const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord, requireTenant } = require("../middleware/roleCheck");
const { auditLog } = require("../utils/audit");
const { createNotification } = require("../utils/notifications");

async function getLandlordId(userId) {
  const result = await pool.query(
    "SELECT id FROM landlord WHERE user_id = $1",
    [userId],
  );
  return result.rows[0]?.id || null;
}

async function recalculateCollectionBalance(tenantId, client) {
  const result = await client.query(
    `SELECT 
      COALESCE(SUM(remaining_balance), 0) AS total_remaining,
      COUNT(*) FILTER (WHERE status = 'partial') AS partial_count,
      COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_count
     FROM invoice
     WHERE tenant_id = $1
       AND status NOT IN ('paid', 'void', 'cancelled')
       AND remaining_balance > 0`,
    [tenantId],
  );

  const totalRemaining = Number(result.rows[0].total_remaining);
  const partialCount = Number(result.rows[0].partial_count);
  const overdueCount = Number(result.rows[0].overdue_count);

  if (totalRemaining <= 0) {
    await client.query(
      `UPDATE collection
       SET status = 'recovered',
           outstanding_balance = 0,
           updated_at = NOW()
       WHERE tenant_id = $1
         AND status IN ('active', 'flagged', 'repayment_agreed')`,
      [tenantId],
    );
  } else {
    const collectionStatus = partialCount > 0 ? "partial_collection" : "active";

    await client.query(
      `UPDATE collection
       SET outstanding_balance = $1,
           status = CASE 
             WHEN $2 > 0 THEN 'partial_collection'
             ELSE 'active'
           END,
           updated_at = NOW()
       WHERE tenant_id = $3
         AND status IN ('active', 'flagged', 'repayment_agreed', 'partial_collection')`,
      [totalRemaining, partialCount, tenantId],
    );
  }

  return {
    total_remaining: totalRemaining,
    partial_count: partialCount,
    overdue_count: overdueCount,
  };
}

// GET /collections/me - Get tenant's collection status with partial payment details
router.get("/me", requireAuth, requireTenant, async (req, res) => {
  try {
    const tenantResult = await pool.query(
      "SELECT id FROM tenant WHERE user_id = $1",
      [req.userId],
    );
    if (!tenantResult.rows.length)
      return res.status(404).json({ error: "Tenant not found" });

    const tenantId = tenantResult.rows[0].id;

    const collResult = await pool.query(
      `SELECT c.*,
              u.full_name AS flagged_by_name,
              COALESCE((
                SELECT COUNT(*) 
                FROM collection_invoice ci 
                WHERE ci.collection_id = c.id
              ), 0) AS invoice_count
       FROM collection c
       LEFT JOIN users u ON u.id = c.flagged_by
       WHERE c.tenant_id = $1
       ORDER BY c.created_at DESC
       LIMIT 1`,
      [tenantId],
    );

    const collection = collResult.rows[0] || null;

    const invoicesResult = await pool.query(
      `SELECT 
        i.id, 
        i.invoice_number, 
        i.amount_due, 
        i.paid_amount,
        i.remaining_balance, 
        i.due_date,
        i.billing_period_start, 
        i.billing_period_end,
        i.status, 
        i.late_fees,
        COALESCE(ips.payment_count, 0) AS payment_count,
        COALESCE(ips.approved_amount, 0) AS approved_amount,
        COALESCE(ips.pending_amount, 0) AS pending_amount,
        COALESCE(ips.rejected_amount, 0) AS rejected_amount,
        ips.last_payment_date,
        CASE 
          WHEN i.status = 'partial' THEN true 
          ELSE false 
        END AS has_partial_payment
       FROM invoice i
       LEFT JOIN public.invoice_payment_summary ips ON ips.invoice_id = i.id
       WHERE i.tenant_id = $1
         AND i.status IN ('sent', 'overdue', 'partial')
         AND i.remaining_balance > 0
       ORDER BY i.due_date ASC`,
      [tenantId],
    );

    const invoices = invoicesResult.rows;
    const totalOutstanding = invoices.reduce(
      (sum, inv) => sum + Number(inv.remaining_balance || 0),
      0,
    );
    const partialInvoices = invoices.filter((inv) => inv.status === "partial");
    const overdueInvoices = invoices.filter((inv) => inv.status === "overdue");

    res.json({
      collection,
      overdue_invoices: invoices,
      total_outstanding: totalOutstanding,
      in_collections:
        !!collection &&
        [
          "active",
          "flagged",
          "repayment_agreed",
          "partial_collection",
        ].includes(collection.status),
      partial_count: partialInvoices.length,
      overdue_count: overdueInvoices.length,
      has_partial_payments: partialInvoices.length > 0,
      payment_status: {
        total_invoices: invoices.length,
        partial: partialInvoices.length,
        overdue: overdueInvoices.length,
        total_remaining: totalOutstanding,
      },
    });
  } catch (err) {
    console.error("GET /collections/me:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /collections - List all collections accounts with partial payment info
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT 
        col.id,
        col.tenant_id,
        col.lease_id,
        col.outstanding_balance AS balance,
        col.days_overdue,
        col.status AS collections_status,
        col.notes,
        col.flagged_at AS created_at,
        col.updated_at,
        usr.full_name AS tenant_name,
        u.unit_number AS unit,
        p.name AS property,
        t.reliability_score,
        t.reliability_score_value,
        t.standing,
        (SELECT MAX(pay.payment_date) FROM payment pay WHERE pay.tenant_id = t.id AND pay.status = 'paid') AS last_payment_date,
        (SELECT COUNT(*) FROM invoice i 
         WHERE i.tenant_id = t.id AND i.status = 'partial' AND i.remaining_balance > 0) AS partial_invoice_count,
        (SELECT COALESCE(SUM(i.remaining_balance), 0) FROM invoice i 
         WHERE i.tenant_id = t.id AND i.status = 'partial' AND i.remaining_balance > 0) AS partial_balance
       FROM collection col
       JOIN tenant t ON t.id = col.tenant_id
       JOIN users usr ON usr.id = t.user_id
       LEFT JOIN lease l ON l.id = col.lease_id
       LEFT JOIN unit u ON u.id = l.unit_id
       LEFT JOIN property p ON p.id = u.property_id
       WHERE col.landlord_id = $1
       ORDER BY col.days_overdue DESC, col.created_at DESC`,
      [landlordId],
    );

    const overdueInvoices = await pool.query(
      `SELECT 
        i.id,
        i.tenant_id,
        i.lease_id,
        i.remaining_balance AS balance,
        CASE WHEN i.due_date IS NOT NULL THEN CURRENT_DATE - i.due_date::date ELSE 0 END AS days_overdue,
        CASE 
          WHEN i.status = 'partial' THEN 'partial_collection'
          ELSE 'overdue' 
        END AS collections_status,
        NULL AS notes,
        i.created_at,
        usr.full_name AS tenant_name,
        u.unit_number AS unit,
        p.name AS property,
        t.reliability_score,
        t.reliability_score_value,
        t.standing,
        (SELECT MAX(pay.payment_date) FROM payment pay WHERE pay.tenant_id = t.id AND pay.status = 'paid') AS last_payment_date,
        (SELECT COUNT(*) FROM invoice i2 
         WHERE i2.tenant_id = t.id AND i2.status = 'partial' AND i2.remaining_balance > 0) AS partial_invoice_count,
        (SELECT COALESCE(SUM(i2.remaining_balance), 0) FROM invoice i2 
         WHERE i2.tenant_id = t.id AND i2.status = 'partial' AND i2.remaining_balance > 0) AS partial_balance
       FROM invoice i
       JOIN tenant t ON t.id = i.tenant_id
       JOIN users usr ON usr.id = t.user_id
       JOIN lease l ON l.id = i.lease_id
       JOIN unit u ON u.id = l.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE i.landlord_id = $1
         AND i.status IN ('overdue', 'partial')
         AND i.remaining_balance > 0
         AND NOT EXISTS (SELECT 1 FROM collection col WHERE col.tenant_id = i.tenant_id)
       ORDER BY i.due_date ASC`,
      [landlordId],
    );

    const accounts = [
      ...result.rows,
      ...overdueInvoices.rows.map((inv) => ({
        ...inv,
        id: `inv_${inv.id}`,
      })),
    ];

    const summary = {
      total: accounts.length,
      active: accounts.filter((a) =>
        ["active", "collections", "flagged"].includes(a.collections_status),
      ).length,
      partial: accounts.filter(
        (a) =>
          a.collections_status === "partial_collection" ||
          a.partial_invoice_count > 0,
      ).length,
      legal: accounts.filter((a) => a.collections_status === "legal").length,
      recovered: accounts.filter((a) => a.collections_status === "recovered")
        .length,
      total_balance: accounts.reduce(
        (sum, a) => sum + Number(a.balance || 0),
        0,
      ),
      partial_balance: accounts.reduce(
        (sum, a) => sum + Number(a.partial_balance || 0),
        0,
      ),
    };

    res.json({
      accounts,
      summary,
    });
  } catch (err) {
    console.error("Get collections:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /collections - Send an account to collections with partial payment awareness
router.post("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const { tenant_id, lease_id, outstanding_balance, notes, invoice_ids } =
      req.body;
    if (!tenant_id || !lease_id) {
      return res
        .status(400)
        .json({ error: "tenant_id and lease_id are required" });
    }

    const existingActive = await pool.query(
      `SELECT id FROM collection WHERE tenant_id=$1
        AND status IN ('active','flagged','partial_collection','repayment_agreed') LIMIT 1`,
      [tenant_id],
    );
    if (existingActive.rows.length) {
      return res.status(409).json({
        error: "Tenant already has an active collections case.",
        collection_id: existingActive.rows[0].id,
      });
    }

    if (invoice_ids && invoice_ids.length > 0) {
      const invoiceCheck = await pool.query(
        `SELECT id, invoice_number, status, remaining_balance, paid_amount
         FROM invoice
         WHERE id = ANY($1::uuid[])
           AND (status = 'paid' OR remaining_balance <= 0)`,
        [invoice_ids],
      );
      if (invoiceCheck.rows.length > 0) {
        const paid = invoiceCheck.rows.map((i) => i.invoice_number).join(", ");
        return res.status(400).json({
          error: `Cannot send to collections — the following invoice(s) are already fully paid: ${paid}`,
          paid_invoices: invoiceCheck.rows,
        });
      }
    }

    const activePlan = await pool.query(
      `SELECT id FROM repayment_plan
       WHERE tenant_id = $1 AND status IN ('active', 'pending')
       LIMIT 1`,
      [tenant_id],
    );
    if (activePlan.rows.length > 0) {
      return res.status(400).json({
        error:
          "This tenant has an active repayment plan. Resolve or default the plan before sending to collections.",
        repayment_plan_id: activePlan.rows[0].id,
      });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const partialCheck = await client.query(
        `SELECT COUNT(*) > 0 AS has_partial
         FROM invoice
         WHERE tenant_id = $1 
           AND status = 'partial' 
           AND remaining_balance > 0`,
        [tenant_id],
      );
      const hasPartial = partialCheck.rows[0].has_partial;

      const collResult = await client.query(
        `INSERT INTO collection (
           tenant_id, lease_id, landlord_id, outstanding_balance,
           days_overdue, status, flagged_by, flagged_at, notes, created_at, updated_at
         ) VALUES ($1, $2, $3, $4,
           (SELECT GREATEST(0, CURRENT_DATE - MIN(due_date))
            FROM invoice WHERE id = ANY($6::uuid[]) AND remaining_balance > 0),
           $7, $5, NOW(), $8, NOW(), NOW())
         RETURNING *`,
        [
          tenant_id,
          lease_id,
          landlordId,
          outstanding_balance,
          req.userId,
          invoice_ids || [],
          hasPartial ? "partial_collection" : "active",
          notes || null,
        ],
      );

      const collectionId = collResult.rows[0].id;

      if (invoice_ids && invoice_ids.length > 0) {
        for (const invId of invoice_ids) {
          await client.query(
            `INSERT INTO collection_invoice (collection_id, invoice_id)
             VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [collectionId, invId],
          );
        }
      }

      await client.query("COMMIT");

      await pool.query(`SELECT public.recalculate_payment_history($1)`, [
        tenant_id,
      ]);
      await pool.query(`SELECT public.recalculate_tenant_score($1, $2)`, [
        tenant_id,
        req.userId,
      ]);

      const notificationMsg = hasPartial
        ? "Your account has been flagged for collections due to outstanding rent. You have partial payments on record — please contact your landlord or request a repayment plan to clear the remaining balance."
        : "Your account has been flagged for collections due to outstanding rent. Please contact your landlord or request a repayment plan.";

      await createNotification(
        tenant_id,
        "account_status",
        hasPartial
          ? "Account in Collections (Partial Payments)"
          : "Account Sent to Collections",
        notificationMsg,
        collectionId,
        "collection",
      );

      await auditLog(
        req.userId,
        "CREATE",
        "collection",
        collectionId,
        null,
        { tenant_id, outstanding_balance, notes, has_partial: hasPartial },
        req,
      );

      res.status(201).json({
        message: hasPartial
          ? "Account sent to collections (with partial payments)"
          : "Account sent to collections",
        collection: collResult.rows[0],
        has_partial_payments: hasPartial,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("POST /collections:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /collections/:id/invoices - Get invoices linked to a collection account
router.get("/:id/invoices", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;
    let invoices = [];
    let collectionInfo = null;

    if (String(id).startsWith("inv_")) {
      const invoiceId = String(id).replace("inv_", "");
      const invResult = await pool.query(
        `SELECT i.*,
                usr.full_name AS tenant_name
         FROM invoice i
         JOIN tenant t ON t.id = i.tenant_id
         JOIN users usr ON usr.id = t.user_id
         WHERE i.id = $1
           AND i.landlord_id = $2`,
        [invoiceId, landlordId],
      );
      if (invResult.rows.length > 0) {
        invoices = invResult.rows;
        collectionInfo = {
          tenant_name: invResult.rows[0].tenant_name,
          outstanding_balance: invResult.rows[0].remaining_balance,
        };
      }
    } else {
      const collectionResult = await pool.query(
        `SELECT col.*,
                usr.full_name AS tenant_name
         FROM collection col
         JOIN tenant t ON t.id = col.tenant_id
         JOIN users usr ON usr.id = t.user_id
         WHERE col.id = $1
           AND col.landlord_id = $2`,
        [id, landlordId],
      );

      if (collectionResult.rows.length > 0) {
        collectionInfo = collectionResult.rows[0];

        const invResult = await pool.query(
          `SELECT i.*,
                  COALESCE(ips.approved_amount, 0) AS approved_amount,
                  COALESCE(ips.pending_amount, 0) AS pending_amount
           FROM collection_invoice ci
           JOIN invoice i ON i.id = ci.invoice_id
           LEFT JOIN public.invoice_payment_summary ips ON ips.invoice_id = i.id
           WHERE ci.collection_id = $1
           ORDER BY i.due_date ASC`,
          [id],
        );
        invoices = invResult.rows;
      }
    }

    if (!collectionInfo) {
      return res.status(404).json({ error: "Collection account not found" });
    }

    res.json({
      collection: collectionInfo,
      invoices,
      count: invoices.length,
    });
  } catch (err) {
    console.error("Get collection invoices:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /collections/:id/send - Send existing overdue account to collections with partial payment awareness
router.put("/:id/send", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;
    const { note } = req.body;

    if (String(id).startsWith("inv_")) {
      const invoiceId = String(id).replace("inv_", "");

      const invoice = await pool.query(
        `SELECT i.*, l.id AS lease_id FROM invoice i 
         JOIN lease l ON l.id = i.lease_id
         WHERE i.id = $1 AND i.landlord_id = $2`,
        [invoiceId, landlordId],
      );

      if (!invoice.rows.length)
        return res.status(404).json({ error: "Invoice not found" });

      const inv = invoice.rows[0];
      const daysOverdue = inv.due_date
        ? Math.floor((new Date() - new Date(inv.due_date)) / 86400000)
        : 0;

      const partialCheck = await pool.query(
        `SELECT COUNT(*) > 0 AS has_partial
         FROM invoice_payments
         WHERE invoice_id = $1 AND status = 'approved'`,
        [invoiceId],
      );
      const hasPartial = partialCheck.rows[0].has_partial;

      const result = await pool.query(
        `INSERT INTO collection (
          tenant_id, lease_id, landlord_id, outstanding_balance,
          days_overdue, status, flagged_by, flagged_at, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, NOW(), NOW())
        RETURNING *`,
        [
          inv.tenant_id,
          inv.lease_id,
          landlordId,
          inv.remaining_balance,
          daysOverdue,
          hasPartial ? "partial_collection" : "active",
          req.userId,
          note || null,
        ],
      );

      const notificationMsg = hasPartial
        ? `Your account has been escalated to collections for R${inv.remaining_balance} remaining (partial payments on record).`
        : `Your account has been escalated to collections for R${inv.remaining_balance}.`;

      await createNotification(
        inv.tenant_id,
        "payment_rejected",
        hasPartial
          ? "Account in Collections (Partial)"
          : "Account Sent to Collections",
        notificationMsg,
        result.rows[0].id,
        "collection",
      );

      await pool.query(`SELECT public.recalculate_payment_history($1)`, [
        inv.tenant_id,
      ]);
      await pool.query(`SELECT public.recalculate_tenant_score($1, $2)`, [
        inv.tenant_id,
        req.userId,
      ]);

      return res.json({
        message: "Sent to collections",
        collection: result.rows[0],
        has_partial_payments: hasPartial,
      });
    }

    const existing = await pool.query(
      "SELECT * FROM collection WHERE id = $1 AND landlord_id = $2",
      [id, landlordId],
    );

    if (!existing.rows.length)
      return res.status(404).json({ error: "Collection account not found" });

    await pool.query(
      "UPDATE collection SET status = 'active', notes = COALESCE($1, notes), updated_at = NOW() WHERE id = $2",
      [note || null, id],
    );

    await pool.query(`SELECT public.recalculate_payment_history($1)`, [
      existing.rows[0].tenant_id,
    ]);
    await pool.query(`SELECT public.recalculate_tenant_score($1, $2)`, [
      existing.rows[0].tenant_id,
      req.userId,
    ]);

    res.json({ message: "Collection status updated" });
  } catch (err) {
    console.error("Send to collections:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /collections/:id/status - Update collection status
router.put("/:id/status", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "active",
      "partial_collection",
      "collections",
      "legal",
      "recovered",
      "written_off",
      "repayment_plan",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await pool.query(
      "UPDATE collection SET status = $1, updated_at = NOW() WHERE id = $2 AND landlord_id = $3 RETURNING *",
      [status, id, landlordId],
    );

    if (!result.rows.length)
      return res.status(404).json({ error: "Collection account not found" });

    const collection = result.rows[0];

    await pool.query(`SELECT public.recalculate_payment_history($1)`, [
      collection.tenant_id,
    ]);
    await pool.query(`SELECT public.recalculate_tenant_score($1, $2)`, [
      collection.tenant_id,
      req.userId,
    ]);

    const statusLabels = {
      legal: "Legal Action Started",
      recovered: "Account Recovered",
      written_off: "Account Written Off",
      partial_collection: "Partial Payments on Record",
    };

    if (statusLabels[status]) {
      await createNotification(
        collection.tenant_id,
        "payment_rejected",
        statusLabels[status],
        `Your collections account status has been updated to: ${status.replace(/_/g, " ")}.`,
        id,
        "collection",
      );
    }

    await auditLog(
      req.userId,
      "UPDATE",
      "collection",
      id,
      { status: collection.status },
      { status },
      req,
    );

    res.json({ message: "Status updated", collection: result.rows[0] });
  } catch (err) {
    console.error("Update collection status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /collections/summary - Collection stats with partial payment details
router.get("/summary", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT 
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) AS in_collections,
        COUNT(CASE WHEN status = 'partial_collection' THEN 1 END) AS partial_collection,
        COUNT(CASE WHEN status = 'legal' THEN 1 END) AS legal,
        COUNT(CASE WHEN status = 'recovered' THEN 1 END) AS recovered,
        COUNT(CASE WHEN status = 'written_off' THEN 1 END) AS written_off,
        COALESCE(SUM(outstanding_balance), 0) AS total_outstanding,
        COALESCE(SUM(outstanding_balance) FILTER (WHERE status = 'partial_collection'), 0) AS partial_outstanding,
        COALESCE(AVG(days_overdue), 0) AS avg_days_overdue
       FROM collection
       WHERE landlord_id = $1`,
      [landlordId],
    );

    // Get partial payment count across all tenants
    const partialStats = await pool.query(
      `SELECT 
        COUNT(DISTINCT tenant_id) AS tenants_with_partial,
        COUNT(*) AS partial_invoices,
        COALESCE(SUM(remaining_balance), 0) AS total_partial_balance
       FROM invoice
       WHERE landlord_id = $1
         AND status = 'partial'
         AND remaining_balance > 0`,
      [landlordId],
    );

    res.json({
      summary: {
        ...result.rows[0],
        partial_stats: partialStats.rows[0],
      },
    });
  } catch (err) {
    console.error("Collection summary:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /collections/partial - Get all partial collection accounts
router.get("/partial", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT 
        c.id,
        c.tenant_id,
        c.lease_id,
        c.outstanding_balance,
        c.status,
        c.notes,
        c.created_at,
        usr.full_name AS tenant_name,
        u.unit_number AS unit,
        p.name AS property,
        (
          SELECT json_agg(json_build_object(
            'invoice_id', i.id,
            'invoice_number', i.invoice_number,
            'remaining_balance', i.remaining_balance,
            'paid_amount', i.paid_amount,
            'due_date', i.due_date
          ))
          FROM invoice i
          WHERE i.tenant_id = c.tenant_id
            AND i.status = 'partial'
            AND i.remaining_balance > 0
        ) AS partial_invoices
       FROM collection c
       JOIN tenant t ON t.id = c.tenant_id
       JOIN users usr ON usr.id = t.user_id
       LEFT JOIN lease l ON l.id = c.lease_id
       LEFT JOIN unit u ON u.id = l.unit_id
       LEFT JOIN property p ON p.id = u.property_id
       WHERE c.landlord_id = $1
         AND c.status = 'partial_collection'
       ORDER BY c.created_at DESC`,
      [landlordId],
    );

    res.json({
      partial_collections: result.rows,
      count: result.rows.length,
      total_balance: result.rows.reduce(
        (sum, row) => sum + Number(row.outstanding_balance || 0),
        0,
      ),
    });
  } catch (err) {
    console.error("Get partial collections:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
