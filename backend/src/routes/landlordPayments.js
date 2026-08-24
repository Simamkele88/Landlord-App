const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord } = require("../middleware/roleCheck");
const { auditLog } = require("../utils/audit");
const { createNotification } = require("../utils/notifications");
const { sendInvoiceCreatedEmail } = require("../utils/email"); //

async function getLandlordId(userId) {
  const result = await pool.query(
    "SELECT id FROM landlord WHERE user_id = $1",
    [userId],
  );
  return result.rows[0]?.id || null;
}

function getPagination(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
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
         AND status IN ('active', 'flagged', 'repayment_agreed', 'partial_collection')`,
      [tenantId],
    );
  } else {
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

// GET /landlord/payments - Get a payments
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const { page, limit, offset } = getPagination(req);

    const statusParam = req.query.status ? req.query.status.split(",") : null;
    const searchParam = req.query.search ? req.query.search.trim() : null;

    const whereClauses = ["p.landlord_id = $1"];
    const params = [landlordId];

    if (statusParam && statusParam.length > 0) {
      params.push(statusParam);
      whereClauses.push(`p.status::text = ANY($${params.length}::text[])`);
    }

    if (searchParam) {
      params.push(`%${searchParam}%`);
      whereClauses.push(
        `(usr.full_name ILIKE $${params.length} OR u.unit_number ILIKE $${params.length})`,
      );
    }

    const whereSql = whereClauses.join(" AND ");

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM payment p
      LEFT JOIN tenant t ON t.id = p.tenant_id
      LEFT JOIN users usr ON usr.id = t.user_id
      LEFT JOIN invoice inv ON inv.id = p.invoice_id
      LEFT JOIN unit u ON u.id = inv.unit_id
      WHERE ${whereSql}
    `;

    const dataQuery = `
      SELECT 
        p.id,
        p.invoice_id,
        p.tenant_id,
        p.lease_id,
        p.amount_paid,
        p.payment_method,
        p.payment_date,
        p.bank_reference,
        p.status,
        p.proof_of_payment_url,
        p.rejection_reason,
        p.allocated_rent,
        p.allocated_utilities,
        p.allocated_late_fees,
        p.notes,
        p.created_at,
        usr.full_name AS tenant_name,
        u.unit_number,
        prop.name AS property_name,
        inv.invoice_number,
        inv.amount_due,
        inv.paid_amount AS invoice_paid_amount,
        inv.remaining_balance,
        inv.due_date,
        inv.billing_period_start,
        inv.billing_period_end,
        inv.status AS invoice_status,
        ip.payment_count,
        ip.pending_amount,
        ip.approved_amount,
        ip.rejected_amount,
        ip.last_payment_date,
        ip.payments AS payment_details,
        ri.id AS repayment_instalment_id, 
        ri.instalment_number
      FROM payment p
      LEFT JOIN tenant t ON t.id = p.tenant_id
      LEFT JOIN users usr ON usr.id = t.user_id
      LEFT JOIN invoice inv ON inv.id = p.invoice_id
      LEFT JOIN unit u ON u.id = inv.unit_id
      LEFT JOIN property prop ON prop.id = u.property_id
      LEFT JOIN public.invoice_payment_summary ip ON ip.invoice_id = p.invoice_id
      LEFT JOIN repayment_instalment ri ON ri.payment_id = p.id
      WHERE ${whereSql}
      ORDER BY p.payment_date DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const [countResult, dataResult] = await Promise.all([
      pool.query(countQuery, params),
      pool.query(dataQuery, [...params, limit, offset]),
    ]);

    const total = Number(countResult.rows[0].total);

    res.json({
      payments: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    console.error("Get payments:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /landlord/payments/invoices - Get list of invoices
router.get("/invoices", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const { page, limit, offset } = getPagination(req);

    const statusParam = req.query.status ? req.query.status.split(",") : null;
    const typeParam = req.query.type ? req.query.type : null;
    const searchParam = req.query.search ? req.query.search.trim() : null;

    const whereClauses = ["i.landlord_id = $1"];
    const params = [landlordId];

    if (statusParam && statusParam.length > 0) {
      params.push(statusParam);
      whereClauses.push(`i.status::text = ANY($${params.length}::text[])`);
    }

    if (typeParam && typeParam !== "all") {
      params.push(typeParam);
      whereClauses.push(`i.invoice_type = $${params.length}`);
    }

    if (searchParam) {
      params.push(`%${searchParam}%`);
      whereClauses.push(
        `(usr.full_name ILIKE $${params.length} OR u.unit_number ILIKE $${params.length})`,
      );
    }

    const whereSql = whereClauses.join(" AND ");

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM invoice i
      JOIN tenant t ON t.id = i.tenant_id
      JOIN users usr ON usr.id = t.user_id
      JOIN unit u ON u.id = i.unit_id
      WHERE ${whereSql}
    `;

    const statsQuery = `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE i.status = 'paid') AS paid,
        COUNT(*) FILTER (WHERE i.status = 'partial') AS partial,
        COUNT(*) FILTER (WHERE i.status = 'overdue') AS overdue,
        COUNT(*) FILTER (WHERE i.status = 'sent') AS unpaid,
        COALESCE(SUM(i.amount_due), 0) AS total_amount_due,
        COALESCE(SUM(i.paid_amount), 0) AS total_paid,
        COALESCE(SUM(i.remaining_balance), 0) AS total_remaining
      FROM invoice i
      JOIN tenant t ON t.id = i.tenant_id
      JOIN users usr ON usr.id = t.user_id
      JOIN unit u ON u.id = i.unit_id
      WHERE ${whereSql}
    `;

    const dataQuery = `
      SELECT 
        i.*,
        usr.full_name AS tenant_name,
        u.unit_number,
        prop.name AS property_name,
        COALESCE(ip.payment_count, 0) AS payment_count,
        COALESCE(ip.pending_amount, 0) AS pending_amount,
        COALESCE(ip.approved_amount, 0) AS approved_amount,
        COALESCE(ip.rejected_amount, 0) AS rejected_amount,
        ip.last_payment_date,
        ip.payments,
        rpi.repayment_plan_id AS linked_plan_id
      FROM invoice i
      JOIN tenant t ON t.id = i.tenant_id
      JOIN users usr ON usr.id = t.user_id
      JOIN unit u ON u.id = i.unit_id
      JOIN property prop ON prop.id = u.property_id
      LEFT JOIN public.invoice_payment_summary ip ON ip.invoice_id = i.id
      LEFT JOIN repayment_plan_invoice rpi ON rpi.invoice_id = i.id
      LEFT JOIN repayment_plan rp ON rp.id = rpi.repayment_plan_id AND rp.status IN ('active', 'pending')
      WHERE ${whereSql}
      ORDER BY i.status IN ('overdue') DESC, i.status IN ('sent') DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const [countResult, statsResult, dataResult] = await Promise.all([
      pool.query(countQuery, params),
      pool.query(statsQuery, params),
      pool.query(dataQuery, [...params, limit, offset]),
    ]);

    const total = Number(countResult.rows[0].total);
    const s = statsResult.rows[0];

    res.json({
      invoices: dataResult.rows,
      summary: {
        total: Number(s.total),
        paid: Number(s.paid),
        partial: Number(s.partial),
        overdue: Number(s.overdue),
        unpaid: Number(s.unpaid),
        total_amount_due: Number(s.total_amount_due),
        total_paid: Number(s.total_paid),
        total_remaining: Number(s.total_remaining),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    console.error("Get invoices:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /landlord/payments/invoices - Create a custom invoice
router.post("/invoices", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const {
      lease_id,
      invoice_type = "other",
      amount,
      due_date,
      notes,
    } = req.body;

    if (!lease_id || !amount || Number(amount) <= 0) {
      return res
        .status(400)
        .json({ error: "lease_id and a positive amount are required" });
    }
    if (
      !["rent", "deposit", "utility", "damage", "other", "fine"].includes(
        invoice_type,
      )
    ) {
      return res.status(400).json({ error: "Invalid invoice_type" });
    }

    const leaseRes = await pool.query(
      `SELECT l.*, u.property_id, u.id AS unit_id
       FROM lease l
       JOIN unit u ON u.id = l.unit_id
       WHERE l.id = $1 AND l.landlord_id = $2`,
      [lease_id, landlordId],
    );
    if (leaseRes.rows.length === 0) {
      return res.status(404).json({ error: "Lease not found" });
    }
    const lease = leaseRes.rows[0];

    const invoiceNumber = `INV-${Date.now()}`;
    const billingPeriodStart = new Date().toISOString().slice(0, 10);
    const billingPeriodEnd = billingPeriodStart;
    const dueDate =
      due_date ||
      new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);

    let rent = 0,
      utilities = 0,
      other = amount;
    if (invoice_type === "rent") {
      rent = Number(amount);
      other = 0;
    } else if (invoice_type === "utility") {
      utilities = Number(amount);
      other = 0;
    }

    const insertRes = await pool.query(
      `INSERT INTO invoice (
        lease_id, tenant_id, unit_id, landlord_id,
        invoice_number, amount_due,
        rent_amount, utilities_amount, late_fees, other_charges, discounts,
        billing_period_start, billing_period_end, due_date,
        status, paid_amount, invoice_type, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, 0, $9, 0,
        $10, $11, $12,
        'sent', 0, $13, $14
      )
      RETURNING id`,
      [
        lease.id,
        lease.tenant_id,
        lease.unit_id,
        landlordId,
        invoiceNumber,
        amount,
        rent,
        utilities,
        other,
        billingPeriodStart,
        billingPeriodEnd,
        dueDate,
        invoice_type,
        notes || null,
      ],
    );
    const invoiceId = insertRes.rows[0].id;

    const tenantId = lease.tenant_id;

    let tenantEmail = null;
    let tenantFullName = "Tenant";
    const tenantInfoRes = await pool.query(
      `SELECT u.email, u.full_name
       FROM tenant t
       JOIN users u ON u.id = t.user_id
       WHERE t.id = $1`,
      [tenantId],
    );
    if (tenantInfoRes.rows.length > 0) {
      tenantEmail = tenantInfoRes.rows[0].email;
      tenantFullName = tenantInfoRes.rows[0].full_name || tenantFullName;
    }

    await createNotification(
      tenantId,
      "invoice_created",
      "New Invoice Created",
      `A new ${invoice_type} invoice of R${Number(amount).toFixed(2)} has been created. Due date: ${dueDate}.`,
      invoiceId,
      "invoice",
    );

    if (tenantEmail) {
      await sendInvoiceCreatedEmail({
        email: tenantEmail,
        fullName: tenantFullName,
        invoiceType: invoice_type,
        amount: amount,
        dueDate: dueDate,
        notes: notes || "",
      });
    }

    res.status(201).json({
      message: "Invoice created",
      invoice_id: invoiceId,
    });
  } catch (err) {
    console.error("Create invoice:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /landlord/payments/invoices/:id
router.get("/invoices/:id", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;

    const invoiceRes = await pool.query(
      `SELECT i.*,
          usr.full_name AS tenant_name,
          u.unit_number,
          prop.name AS property_name,
          (SELECT id FROM deposit WHERE deposit.lease_id = i.lease_id LIMIT 1) AS deposit_id,
          rp.id AS linked_plan_id
      FROM invoice i
      JOIN tenant t ON t.id = i.tenant_id
      JOIN users usr ON usr.id = t.user_id
      JOIN unit u ON u.id = i.unit_id
      JOIN property prop ON prop.id = u.property_id
      LEFT JOIN repayment_plan_invoice rpi ON rpi.invoice_id = i.id
      LEFT JOIN repayment_plan rp ON rp.id = rpi.repayment_plan_id AND rp.status IN ('active', 'pending')
      WHERE i.id = $1 AND i.landlord_id = $2`,
      [id, landlordId],
    );

    if (invoiceRes.rows.length === 0) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const invoice = invoiceRes.rows[0];

    let lineItems = [];
    const startDate = invoice.billing_period_start;

    if (invoice.invoice_type === "deposit") {
      lineItems = [
        {
          description: "Security Deposit",
          date: startDate,
          amount: Number(invoice.other_charges || 0),
        },
      ];
    } else {
      lineItems = [
        {
          description: "Rent",
          date: startDate,
          amount: Number(invoice.rent_amount || 0),
        },
        {
          description: "Utilities",
          date: startDate,
          amount: Number(invoice.utilities_amount || 0),
        },
        {
          description: "Late Fees",
          date: startDate,
          amount: Number(invoice.late_fees || 0),
        },
        {
          description: "Other Charges",
          date: startDate,
          amount: Number(invoice.other_charges || 0),
        },
        {
          description: "Discounts",
          date: startDate,
          amount: -Number(invoice.discounts || 0),
        },
      ].filter((item) => item.amount !== 0);
    }

    const paymentsRes = await pool.query(
      `SELECT p.id, p.payment_date, p.payment_method, p.bank_reference, p.amount_paid, p.status
       FROM payment p
       WHERE p.invoice_id = $1 AND p.status = 'paid'
       ORDER BY p.payment_date DESC`,
      [id],
    );

    invoice.line_items = lineItems;
    invoice.items = lineItems;
    invoice.payments = paymentsRes.rows;

    res.json({ invoice });
  } catch (err) {
    console.error("Get invoice detail:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /landlord/payments/deposit-invoice
router.post(
  "/deposit-invoice",
  requireAuth,
  requireLandlord,
  async (req, res) => {
    try {
      const landlordId = await getLandlordId(req.userId);
      if (!landlordId)
        return res.status(404).json({ error: "Landlord not found" });

      const { lease_id, amount, due_date, notes } = req.body;

      if (!lease_id || !amount) {
        return res
          .status(400)
          .json({ error: "lease_id and amount are required" });
      }

      const leaseRes = await pool.query(
        `SELECT l.*, u.property_id, u.id AS unit_id
       FROM lease l
       JOIN unit u ON u.id = l.unit_id
       WHERE l.id = $1 AND l.landlord_id = $2`,
        [lease_id, landlordId],
      );

      if (leaseRes.rows.length === 0) {
        return res.status(404).json({ error: "Lease not found" });
      }

      const lease = leaseRes.rows[0];
      const tenant_id = lease.tenant_id;
      const unit_id = lease.unit_id;

      const today = new Date();
      const periodStart = today.toISOString().slice(0, 10);
      const periodEnd = today.toISOString().slice(0, 10);
      let dueDate;
      if (due_date) {
        dueDate = new Date(due_date);
      } else {
        dueDate = new Date(today);
        dueDate.setDate(dueDate.getDate() + 7);
      }
      const dueDateStr = dueDate.toISOString().slice(0, 10);

      const invoiceNumber = `INV-${Date.now()}`;

      const insertRes = await pool.query(
        `INSERT INTO invoice (
        lease_id, tenant_id, unit_id, landlord_id,
        invoice_number, amount_due, rent_amount, utilities_amount,
        late_fees, other_charges, discounts,
        billing_period_start, billing_period_end, due_date,
        status, paid_amount, invoice_type, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 0, $6, 0, $7, $8, $9, 'sent', 0, 'deposit', $10)
      RETURNING id`,
        [
          lease_id,
          tenant_id,
          unit_id,
          landlordId,
          invoiceNumber,
          amount,
          periodStart,
          periodEnd,
          dueDateStr,
          notes || null,
        ],
      );

      res.status(201).json({
        message: "Deposit invoice created",
        invoice_id: insertRes.rows[0].id,
      });
    } catch (err) {
      console.error("Create deposit invoice:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);
// POST /landlord/payments/cash
router.post("/cash", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const { invoice_id, amount_paid, notes } = req.body;

    if (!invoice_id || !amount_paid) {
      return res
        .status(400)
        .json({ error: "Missing required fields: invoice_id, amount_paid" });
    }
    if (Number(amount_paid) <= 0) {
      return res
        .status(400)
        .json({ error: "amount_paid must be greater than 0" });
    }

    const invoiceCheck = await pool.query(
      `SELECT id, tenant_id, lease_id, landlord_id, remaining_balance, status, due_date
       FROM invoice WHERE id = $1`,
      [invoice_id],
    );
    if (!invoiceCheck.rows.length) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const planLinkCheck = await pool.query(
      `SELECT rp.id, rp.status
        FROM repayment_plan_invoice rpi
        JOIN repayment_plan rp ON rp.id = rpi.repayment_plan_id
        WHERE rpi.invoice_id = $1 AND rp.status IN ('active', 'pending')`,
      [invoice_id],
    );
    if (planLinkCheck.rows.length) {
      return res.status(400).json({
        error:
          "This invoice is part of an active repayment plan. Manage payment through the repayment plan instead.",
        repayment_plan_id: planLinkCheck.rows[0].id,
      });
    }
    const invoice = invoiceCheck.rows[0];
    const isLate = invoice.due_date && new Date() > new Date(invoice.due_date);
    const paymentStatus = isLate ? "late" : "paid";
    if (invoice.landlord_id !== landlordId) {
      return res
        .status(403)
        .json({ error: "This invoice does not belong to you" });
    }
    if (
      invoice.status === "paid" ||
      invoice.status === "void" ||
      invoice.status === "cancelled"
    ) {
      return res
        .status(400)
        .json({ error: `Invoice is already ${invoice.status}` });
    }

    const remaining = Number(invoice.remaining_balance);
    if (Number(amount_paid) > remaining + 0.01) {
      return res.status(400).json({
        error: `Amount (R${amount_paid}) exceeds the remaining balance of R${remaining.toFixed(2)}`,
      });
    }

    const tenant_id = invoice.tenant_id;
    const lease_id = invoice.lease_id;

    const tenantResult = await pool.query(
      `SELECT first_name, last_name
       FROM users u
       JOIN tenant t ON t.user_id = u.id
       WHERE t.id = $1`,
      [tenant_id],
    );
    let initials = "XX";
    if (tenantResult.rows.length > 0) {
      const { first_name, last_name } = tenantResult.rows[0];
      const firstInitial = (first_name || "").charAt(0).toUpperCase();
      const lastInitial = (last_name || "").charAt(0).toUpperCase();
      if (firstInitial || lastInitial) {
        initials = `${firstInitial || ""}${lastInitial || ""}`;
      }
    }
    const now = new Date();
    const monthYear = `${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getFullYear()).slice(-2)}`;
    const cashReference = `CASH-${initials}-${monthYear}`;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const rejectResult = await client.query(
        `UPDATE payment 
         SET status = 'rejected', 
             rejection_reason = 'Auto-rejected: Cash payment received and processed',
             updated_at = NOW()
         WHERE invoice_id = $1 
           AND status IN ('pending', 'pending_approval')`,
        [invoice_id],
      );

      await client.query(
        `UPDATE public.invoice_payments 
         SET status = 'rejected', updated_at = NOW()
         WHERE payment_id IN (
           SELECT id FROM payment 
           WHERE invoice_id = $1 
             AND status = 'rejected'
             AND rejection_reason = 'Auto-rejected: Cash payment received and processed'
         )`,
        [invoice_id],
      );

      const paymentResult = await client.query(
        `INSERT INTO payment (
          invoice_id, tenant_id, lease_id, landlord_id, amount_paid,
          payment_method, payment_date, status, approved_by, approved_at, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'cash', NOW(), $8, $6, NOW(), $7, NOW(), NOW())
        RETURNING id`,
        [
          invoice_id,
          tenant_id,
          lease_id,
          landlordId,
          amount_paid,
          req.userId,
          notes || "Cash payment recorded by landlord",
          paymentStatus,
        ],
      );

      const paymentId = paymentResult.rows[0].id;

      await client.query(
        `UPDATE payment SET bank_reference = $1 WHERE id = $2`,
        [cashReference, paymentId],
      );

      await client.query(
        `INSERT INTO public.invoice_payments (
          invoice_id, payment_id, amount, payment_date, method, reference, status, allocated_rent
        ) VALUES ($1, $2, $3, NOW(), 'cash', $4, 'approved', $3)`,
        [invoice_id, paymentId, amount_paid, cashReference],
      );

      await client.query(`SELECT public.recalculate_invoice_status($1)`, [
        invoice_id,
      ]);

      const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
      await client.query(
        `INSERT INTO receipt (payment_id, tenant_id, receipt_number, receipt_url, issued_by, issued_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          paymentId,
          tenant_id,
          receiptNo,
          `/uploads/receipts/${receiptNo}.pdf`,
          req.userId,
        ],
      );

      await client.query(`SELECT public.recalculate_payment_history($1)`, [
        tenant_id,
      ]);
      await client.query(`SELECT public.recalculate_tenant_score($1, $2)`, [
        tenant_id,
        req.userId,
      ]);
      await recalculateCollectionBalance(tenant_id, client);

      await client.query("COMMIT");

      await createNotification(
        tenant_id,
        "payment_approved",
        "Cash Payment Recorded",
        `Your cash payment of R${amount_paid} has been recorded and your invoice has been updated. Receipt: ${receiptNo}`,
        paymentId,
        "payment",
      );

      res.json({
        message: "Cash payment recorded and approved",
        payment_id: paymentId,
        receipt_no: receiptNo,
        reference: cashReference,
        auto_rejected_count: rejectResult.rowCount,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Record cash payment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /landlord/payments/summary
router.get("/summary", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT 
        COUNT(*) AS total_payments,
        COALESCE(SUM(p.amount_paid), 0) AS total_expected,
        COALESCE(SUM(CASE WHEN p.status IN ('paid', 'late') THEN p.amount_paid ELSE 0 END), 0) AS total_collected,
        COUNT(CASE WHEN p.status IN ('pending', 'pending_approval') THEN 1 END) AS pending_count,
        COUNT(CASE WHEN p.status = 'late' THEN 1 END) AS late_count,
        COUNT(CASE WHEN p.status = 'collections' THEN 1 END) AS collections_count,
        COUNT(CASE WHEN p.status = 'rejected' THEN 1 END) AS rejected_count,
        COUNT(DISTINCT i.id) AS total_invoices,
        COUNT(DISTINCT CASE WHEN i.status = 'partial' THEN i.id END) AS partial_invoices,
        COUNT(DISTINCT CASE WHEN i.status = 'overdue' THEN i.id END) AS overdue_invoices,
        COALESCE(SUM(i.remaining_balance), 0) AS total_outstanding
       FROM payment p
       LEFT JOIN invoice i ON i.id = p.invoice_id
       WHERE p.landlord_id = $1`,
      [landlordId],
    );

    const partialTenants = await pool.query(
      `SELECT 
        DISTINCT t.id,
        u.full_name,
        COUNT(DISTINCT i.id) AS partial_invoice_count,
        COALESCE(SUM(i.remaining_balance), 0) AS total_remaining
       FROM tenant t
       JOIN users u ON u.id = t.user_id
       JOIN invoice i ON i.tenant_id = t.id
       WHERE i.status = 'partial'
         AND i.landlord_id = $1
       GROUP BY t.id, u.full_name
       ORDER BY total_remaining DESC
       LIMIT 10`,
      [landlordId],
    );

    res.json({
      summary: result.rows[0],
      tenants_with_partial: partialTenants.rows,
    });
  } catch (err) {
    console.error("Payment summary:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /landlord/payments/deposits
router.get("/deposits", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const { page, limit, offset } = getPagination(req);

    const statusParam = req.query.status ? req.query.status.split(",") : null;
    const searchParam = req.query.search ? req.query.search.trim() : null;

    const whereClauses = ["p.landlord_id = $1"];
    const params = [landlordId];

    if (statusParam && statusParam.length > 0) {
      params.push(statusParam);
      whereClauses.push(`d.status::text = ANY($${params.length}::text[])`);
    }

    if (searchParam) {
      params.push(`%${searchParam}%`);
      whereClauses.push(
        `(usr.full_name ILIKE $${params.length} OR u.unit_number ILIKE $${params.length})`,
      );
    }

    const whereSql = whereClauses.join(" AND ");

    const countQuery = `
      SELECT COUNT(*) AS total
      FROM deposit d
      JOIN lease l ON l.id = d.lease_id
      JOIN unit u ON u.id = l.unit_id
      JOIN property p ON p.id = u.property_id
      JOIN tenant t ON t.id = d.tenant_id
      JOIN users usr ON usr.id = t.user_id
      WHERE ${whereSql}
    `;

    const summaryQuery = `
      SELECT
        COUNT(*) AS total_deposits,
        COALESCE(SUM(d.deposit_amount), 0) AS total_deposit_amount,
        COALESCE(SUM(d.refund_amount), 0) AS total_refunded,
        COALESCE(SUM(d.deposit_amount) - SUM(COALESCE(d.refund_amount, 0)), 0) AS total_held,
        COUNT(*) FILTER (WHERE d.status = 'forfeited') AS disputed
      FROM deposit d
      JOIN lease l ON l.id = d.lease_id
      JOIN unit u ON u.id = l.unit_id
      JOIN property p ON p.id = u.property_id
      JOIN tenant t ON t.id = d.tenant_id
      JOIN users usr ON usr.id = t.user_id
      WHERE ${whereSql}
    `;

    const dataQuery = `
      SELECT
        d.id,
        d.deposit_amount AS amount_held,
        COALESCE(d.refund_amount, 0) AS amount_refunded,
        d.status,
        d.payment_date AS date_held,
        d.held_until,
        d.interest_earned,
        d.deposit_amount AS amount,
        d.amount_paid,
        d.payment_reference,
        usr.full_name AS tenant_name,
        u.unit_number,
        p.name AS property_name,
        l.id AS lease_id,
        d.tenant_id
      FROM deposit d
      JOIN lease l ON l.id = d.lease_id
      JOIN unit u ON u.id = l.unit_id
      JOIN property p ON p.id = u.property_id
      JOIN tenant t ON t.id = d.tenant_id
      JOIN users usr ON usr.id = t.user_id
      WHERE ${whereSql}
      ORDER BY d.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    const [countResult, summaryResult, dataResult] = await Promise.all([
      pool.query(countQuery, params),
      pool.query(summaryQuery, params),
      pool.query(dataQuery, [...params, limit, offset]),
    ]);

    const total = Number(countResult.rows[0].total);
    const summary = summaryResult.rows[0];

    res.json({
      deposits: dataResult.rows,
      summary: {
        total: Number(summary.total_deposits),
        total_held: Number(summary.total_held),
        total_deposit_amount: Number(summary.total_deposit_amount),
        total_refunded: Number(summary.total_refunded),
        disputed: Number(summary.disputed),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    console.error("Get deposits:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /landlord/payments/deposits/:id
router.get("/deposits/:id", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;

    const result = await pool.query(
      `SELECT
        d.id,
        d.deposit_amount AS amount_held,
        COALESCE(d.refund_amount, 0) AS amount_refunded,
        COALESCE(d.used_amount, 0) AS used_amount,
        d.status,
        d.payment_date AS date_held,
        d.held_until,
        d.interest_earned,
        d.deposit_amount AS amount,
        d.amount_paid,
        d.payment_reference,
        d.deductions,
        usr.full_name AS tenant_name,
        u.unit_number,
        p.name AS property_name,
        l.id AS lease_id,
        d.tenant_id
       FROM deposit d
       JOIN lease l ON l.id = d.lease_id
       JOIN unit u ON u.id = l.unit_id
       JOIN property p ON p.id = u.property_id
       JOIN tenant t ON t.id = d.tenant_id
       JOIN users usr ON usr.id = t.user_id
       WHERE d.id = $1 AND p.landlord_id = $2`,
      [id, landlordId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Deposit not found" });
    }

    res.json({ deposit: result.rows[0] });
  } catch (err) {
    console.error("Get deposit:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /landlord/payments/deposits/:id/use - Use deposit to pay an invoice
router.post(
  "/deposits/:id/use",
  requireAuth,
  requireLandlord,
  async (req, res) => {
    try {
      const landlordId = await getLandlordId(req.userId);
      if (!landlordId)
        return res.status(404).json({ error: "Landlord not found" });

      const { id } = req.params;
      const { invoice_id, amount, notes } = req.body;

      if (!invoice_id || !amount || Number(amount) <= 0) {
        return res
          .status(400)
          .json({ error: "invoice_id and a positive amount are required" });
      }

      const depositQuery = await pool.query(
        `SELECT d.*, p.landlord_id
         FROM deposit d
         JOIN lease l ON l.id = d.lease_id
         JOIN unit u ON u.id = l.unit_id
         JOIN property p ON p.id = u.property_id
         WHERE d.id = $1`,
        [id],
      );
      if (!depositQuery.rows.length)
        return res.status(404).json({ error: "Deposit not found" });
      const deposit = depositQuery.rows[0];
      if (deposit.landlord_id !== landlordId)
        return res.status(403).json({ error: "Unauthorized" });

      const heldAmount = Number(deposit.deposit_amount);
      const usedAmount = Number(deposit.used_amount || 0);
      const refundedAmount = Number(deposit.refund_amount || 0);
      const available = heldAmount - usedAmount - refundedAmount;

      if (Number(amount) > available + 0.01) {
        return res.status(400).json({
          error: `Amount exceeds available deposit balance of R ${available.toFixed(2)}`,
        });
      }

      const invoiceQuery = await pool.query(
        `SELECT * FROM invoice WHERE id = $1 AND landlord_id = $2`,
        [invoice_id, landlordId],
      );
      if (!invoiceQuery.rows.length)
        return res.status(404).json({ error: "Invoice not found" });
      const invoice = invoiceQuery.rows[0];

      const planLinkCheck = await pool.query(
        `SELECT rp.id, rp.status
          FROM repayment_plan_invoice rpi
          JOIN repayment_plan rp ON rp.id = rpi.repayment_plan_id
          WHERE rpi.invoice_id = $1 AND rp.status IN ('active', 'pending')`,
        [invoice_id],
      );
      if (planLinkCheck.rows.length) {
        return res.status(400).json({
          error:
            "This invoice is part of an active repayment plan. Manage payment through the repayment plan instead.",
          repayment_plan_id: planLinkCheck.rows[0].id,
        });
      }
      if (
        invoice.status === "paid" ||
        invoice.status === "void" ||
        invoice.status === "cancelled"
      ) {
        return res.status(400).json({ error: "Invoice is already settled" });
      }
      const invoiceRemaining = Number(invoice.remaining_balance);
      const applyAmount = Math.min(Number(amount), invoiceRemaining);

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        await client.query(
          `UPDATE deposit
           SET used_amount = used_amount + $1,
               status = (CASE
                 WHEN deposit_amount - (used_amount + $1) - refund_amount <= 0
                 THEN 'forfeited'::deposit_status
                 ELSE 'partially_refunded'::deposit_status
               END),
               deductions = COALESCE(deductions, '[]')::jsonb || $2::jsonb,
               updated_at = NOW()
           WHERE id = $3`,
          [
            applyAmount,
            JSON.stringify([
              {
                reason: "Deposit used for payment",
                amount: applyAmount,
                date: new Date().toISOString(),
              },
            ]),
            id,
          ],
        );

        const paymentRes = await client.query(
          `INSERT INTO payment (
            invoice_id, tenant_id, lease_id, landlord_id, amount_paid,
            payment_method, payment_date, status, approved_by, approved_at, notes
          ) VALUES ($1, $2, $3, $4, $5, 'bank_transfer', NOW(), 'paid', $6, NOW(), $7)
          RETURNING id`,
          [
            invoice_id,
            deposit.tenant_id,
            deposit.lease_id,
            landlordId,
            applyAmount,
            req.userId,
            notes || "Deposit used to pay invoice",
          ],
        );
        const paymentId = paymentRes.rows[0].id;

        await client.query(`SELECT public.recalculate_invoice_status($1)`, [
          invoice_id,
        ]);

        const replenishInvoiceNumber = `INV-${Date.now()}-DR`;
        const replenishDueDate = new Date();
        replenishDueDate.setDate(replenishDueDate.getDate() + 7);

        await client.query(
          `INSERT INTO invoice (
            lease_id, tenant_id, unit_id, landlord_id,
            invoice_number, amount_due,
            rent_amount, utilities_amount, late_fees, other_charges, discounts,
            billing_period_start, billing_period_end, due_date,
            status, paid_amount, invoice_type, notes
          ) VALUES (
            $1, $2, $3, $4,
            $5, $6,
            0, 0, 0, $6, 0,
            CURRENT_DATE, CURRENT_DATE + INTERVAL '1 day', $7,
            'sent', 0, 'deposit', $8
          )`,
          [
            deposit.lease_id,
            deposit.tenant_id,
            invoice.unit_id,
            landlordId,
            replenishInvoiceNumber,
            applyAmount,
            replenishDueDate.toISOString().slice(0, 10),
            "Deposit replenishment after usage",
          ],
        );

        const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
        await client.query(
          `INSERT INTO receipt (payment_id, tenant_id, receipt_number, receipt_url, issued_by, issued_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            paymentId,
            deposit.tenant_id,
            receiptNo,
            `/uploads/receipts/${receiptNo}.pdf`,
            req.userId,
          ],
        );

        await client.query(`SELECT public.recalculate_payment_history($1)`, [
          deposit.tenant_id,
        ]);
        await client.query(`SELECT public.recalculate_tenant_score($1, $2)`, [
          deposit.tenant_id,
          req.userId,
        ]);
        await recalculateCollectionBalance(deposit.tenant_id, client);

        await client.query("COMMIT");

        await createNotification(
          deposit.tenant_id,
          "deposit_used",
          "Deposit Used for Payment",
          `R${applyAmount.toFixed(2)} from your deposit has been used to pay invoice ${invoice.invoice_number}. Receipt: ${receiptNo}. A deposit replenishment invoice has been issued.`,
          paymentId,
          "payment",
        );

        res.json({
          message: "Deposit applied to invoice. Replenishment invoice created.",
          payment_id: paymentId,
          receipt_no: receiptNo,
          amount_applied: applyAmount,
          deposit_remaining: available - applyAmount,
        });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Use deposit:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// GET /landlord/payments/receipt/:id
router.get("/receipt/:id", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        p.*,
        usr.full_name AS tenant_name,
        u.unit_number,
        prop.name AS property_name,
        inv.invoice_number,
        inv.amount_due,
        inv.rent_amount,
        inv.late_fees,
        inv.utilities_amount,
        inv.paid_amount AS invoice_paid_amount,
        inv.remaining_balance,
        inv.due_date,
        inv.billing_period_start,
        inv.billing_period_end,
        inv.status AS invoice_status,
        ip.payment_count,
        ip.pending_amount,
        ip.approved_amount,
        ip.rejected_amount,
        ip.last_payment_date,
        ip.payments AS payment_details
       FROM payment p
       LEFT JOIN tenant t ON t.id = p.tenant_id
       LEFT JOIN users usr ON usr.id = t.user_id
       LEFT JOIN invoice inv ON inv.id = p.invoice_id
       LEFT JOIN unit u ON u.id = inv.unit_id
       LEFT JOIN property prop ON prop.id = u.property_id
       LEFT JOIN public.invoice_payment_summary ip ON ip.invoice_id = p.invoice_id
       WHERE p.id = $1 AND p.landlord_id = $2`,
      [id, landlordId],
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json({ payment: result.rows[0] });
  } catch (err) {
    console.error("Get payment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /landlord/payments/:id
router.get("/:id", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        p.*,
        usr.full_name AS tenant_name,
        u.unit_number,
        prop.name AS property_name,
        inv.invoice_number,
        inv.amount_due,
        inv.rent_amount,
        inv.late_fees,
        inv.utilities_amount,
        inv.paid_amount AS invoice_paid_amount,
        inv.remaining_balance,
        inv.due_date,
        inv.billing_period_start,
        inv.billing_period_end,
        inv.status AS invoice_status,
        ip.payment_count,
        ip.pending_amount,
        ip.approved_amount,
        ip.rejected_amount,
        ip.last_payment_date,
        ip.payments AS payment_details,
        ri.instalment_number, 
        rp2.id AS repayment_plan_id
       FROM payment p
       LEFT JOIN tenant t ON t.id = p.tenant_id
       LEFT JOIN users usr ON usr.id = t.user_id
       LEFT JOIN invoice inv ON inv.id = p.invoice_id
       LEFT JOIN unit u ON u.id = inv.unit_id
       LEFT JOIN property prop ON prop.id = u.property_id
       LEFT JOIN public.invoice_payment_summary ip ON ip.invoice_id = p.invoice_id
       LEFT JOIN repayment_instalment ri ON ri.payment_id = p.id
       LEFT JOIN repayment_plan rp2 ON rp2.id = ri.repayment_plan_id
       WHERE p.id = $1 AND p.landlord_id = $2`,
      [id, landlordId],
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Payment not found" });
    }

    res.json({ payment: result.rows[0] });
  } catch (err) {
    console.error("Get payment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /landlord/payments/deposits/:id/refund
router.post(
  "/deposits/:id/refund",
  requireAuth,
  requireLandlord,
  async (req, res) => {
    try {
      const landlordId = await getLandlordId(req.userId);
      if (!landlordId)
        return res.status(404).json({ error: "Landlord not found" });

      const { id } = req.params;
      const { amount, deduction_reason, notes } = req.body;

      const refundAmount = Number(amount);
      if (!refundAmount || refundAmount <= 0) {
        return res
          .status(400)
          .json({ error: "A valid refund amount is required" });
      }

      const depositQuery = await pool.query(
        `SELECT d.*, p.landlord_id
       FROM deposit d
       JOIN lease l ON l.id = d.lease_id
       JOIN unit u ON u.id = l.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE d.id = $1`,
        [id],
      );

      if (!depositQuery.rows.length) {
        return res.status(404).json({ error: "Deposit not found" });
      }

      const deposit = depositQuery.rows[0];
      if (deposit.landlord_id !== landlordId) {
        return res
          .status(403)
          .json({ error: "This deposit does not belong to you" });
      }

      if (!["paid", "partially_refunded"].includes(deposit.status)) {
        return res.status(400).json({
          error: "Only paid or partially refunded deposits can be refunded",
        });
      }

      const heldAmount = Number(deposit.deposit_amount);
      const alreadyRefunded = Number(deposit.refund_amount || 0);
      const remaining = heldAmount - alreadyRefunded;

      if (refundAmount > remaining + 0.01) {
        return res.status(400).json({
          error: `Refund amount (R${refundAmount.toFixed(2)}) exceeds the remaining held balance of R${remaining.toFixed(2)}`,
        });
      }

      const newRefundTotal = alreadyRefunded + refundAmount;
      const newStatus =
        newRefundTotal >= heldAmount - 0.01
          ? "fully_refunded"
          : "partially_refunded";

      let deductions = deposit.deductions || null;
      if (refundAmount < remaining - 0.01) {
        if (!deduction_reason || !deduction_reason.trim()) {
          return res.status(400).json({
            error: "A deduction reason is required for partial refunds",
          });
        }
        const existing = deductions
          ? Array.isArray(deductions)
            ? deductions
            : [deductions]
          : [];
        existing.push({
          reason: deduction_reason.trim(),
          amount: remaining - refundAmount,
          date: new Date().toISOString(),
        });
        deductions = JSON.stringify(existing);
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        await client.query(
          `UPDATE deposit
         SET refund_amount = $1,
             refund_date = NOW(),
             refund_reason = $2,
             status = $3,
             deductions = $4,
             updated_at = NOW()
         WHERE id = $5`,
          [newRefundTotal, deduction_reason || null, newStatus, deductions, id],
        );

        await auditLog(
          req.userId,
          "REFUND",
          "deposit",
          id,
          {
            status: deposit.status,
            refund_amount: alreadyRefunded,
            deposit_amount: heldAmount,
          },
          {
            status: newStatus,
            refund_amount: newRefundTotal,
            amount_refunded: refundAmount,
          },
          req,
        );

        await client.query("COMMIT");

        await createNotification(
          deposit.tenant_id,
          "deposit_refunded",
          "Deposit Refunded",
          `A refund of R${refundAmount.toFixed(2)} has been processed for your deposit.`,
          id,
          "deposit",
        );

        res.json({
          message: "Refund recorded successfully",
          deposit_id: id,
          new_status: newStatus,
          total_refunded: newRefundTotal,
        });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Refund deposit:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// PUT /landlord/payments/:id/mark-cash-paid
router.put(
  "/:id/mark-cash-paid",
  requireAuth,
  requireLandlord,
  async (req, res) => {
    try {
      const landlordId = await getLandlordId(req.userId);
      if (!landlordId)
        return res.status(404).json({ error: "Landlord not found" });

      const { id } = req.params;

      const paymentCheck = await pool.query(
        "SELECT * FROM payment WHERE id = $1 AND landlord_id = $2",
        [id, landlordId],
      );

      if (!paymentCheck.rows.length) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const payment = paymentCheck.rows[0];

      if (payment.payment_method !== "cash") {
        return res
          .status(400)
          .json({ error: "This endpoint is for cash payments only" });
      }

      if (
        payment.status !== "pending" &&
        payment.status !== "pending_approval"
      ) {
        return res
          .status(400)
          .json({ error: "Only pending cash payments can be auto-approved" });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const rejectResult = await client.query(
          `UPDATE payment 
         SET status = 'rejected', 
             rejection_reason = 'Auto-rejected: Newer cash payment received and approved',
             updated_at = NOW()
         WHERE invoice_id = $1 
           AND id != $2 
           AND status IN ('pending', 'pending_approval')`,
          [payment.invoice_id, id],
        );

        const invDueRes = await client.query(
          `SELECT due_date FROM invoice WHERE id = $1`,
          [payment.invoice_id],
        );

        const isLate =
          invDueRes.rows[0]?.due_date &&
          new Date(payment.payment_date) > new Date(invDueRes.rows[0].due_date);
        const newPaymentStatus = isLate ? "late" : "paid";

        await client.query(
          `UPDATE public.invoice_payments 
         SET status = 'rejected', updated_at = NOW()
         WHERE payment_id IN (
           SELECT id FROM payment 
           WHERE invoice_id = $1 
             AND id != $2 
             AND status = 'rejected'
             AND rejection_reason = 'Auto-rejected: Newer cash payment received and approved'
         )`,
          [payment.invoice_id, id],
        );

        await client.query(
          `UPDATE payment SET 
            status = $3, 
            approved_by = $1, 
            approved_at = NOW(),
            updated_at = NOW()
          WHERE id = $2`,
          [req.userId, id, newPaymentStatus],
        );

        await client.query(
          `UPDATE public.invoice_payments 
         SET status = 'approved', updated_at = NOW()
         WHERE payment_id = $1`,
          [id],
        );

        const invStatusResult = await client.query(
          `SELECT public.recalculate_invoice_status($1) AS new_status`,
          [payment.invoice_id],
        );

        const invBalance = await client.query(
          `SELECT amount_due, remaining_balance FROM invoice WHERE id = $1`,
          [payment.invoice_id],
        );

        const newInvoiceStatus = invStatusResult.rows[0].new_status;
        const remainingBalance = Number(invBalance.rows[0].remaining_balance);

        const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
        await client.query(
          `INSERT INTO receipt (payment_id, tenant_id, receipt_number, receipt_url, issued_by, issued_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            id,
            payment.tenant_id,
            receiptNo,
            `/uploads/receipts/${receiptNo}.pdf`,
            req.userId,
          ],
        );

        await client.query(`SELECT public.recalculate_payment_history($1)`, [
          payment.tenant_id,
        ]);
        await client.query(`SELECT public.recalculate_tenant_score($1, $2)`, [
          payment.tenant_id,
          req.userId,
        ]);
        await recalculateCollectionBalance(payment.tenant_id, client);

        await client.query("COMMIT");

        await createNotification(
          payment.tenant_id,
          "payment_approved",
          "Cash Payment Verified",
          `Your cash payment of R${payment.amount_paid} has been verified and approved. Receipt: ${receiptNo}`,
          id,
          "payment",
        );

        res.json({
          message: "Cash payment verified and approved",
          receipt_no: receiptNo,
          invoice_status: newInvoiceStatus,
          remaining_balance: remainingBalance,
          auto_rejected_count: rejectResult.rowCount,
        });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Mark cash paid:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// PUT /landlord/payments/:id/approve
router.put("/:id/approve", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;

    const paymentCheck = await pool.query(
      "SELECT * FROM payment WHERE id = $1 AND landlord_id = $2",
      [id, landlordId],
    );

    if (!paymentCheck.rows.length) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const payment = paymentCheck.rows[0];

    const instRes = await pool.query(
      `SELECT ri.*, rp.tenant_id, rp.landlord_id, rp.id AS plan_id
        FROM repayment_instalment ri
        JOIN repayment_plan rp ON rp.id = ri.repayment_plan_id
        WHERE ri.payment_id = $1`,
      [id],
    );
    const linkedInstalment = instRes.rows[0] || null;

    if (payment.status !== "pending" && payment.status !== "pending_approval") {
      return res
        .status(400)
        .json({ error: "Only pending payments can be approved" });
    }

    if (linkedInstalment) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        await client.query(
          `UPDATE payment SET status = 'paid', approved_by = $1, approved_at = NOW(), updated_at = NOW() WHERE id = $2`,
          [req.userId, id],
        );
        await client.query(
          `UPDATE repayment_instalment SET status = 'paid', amount_paid = amount_due, paid_date = NOW(), updated_at = NOW() WHERE id = $1`,
          [linkedInstalment.id],
        );

        const allPaid = await client.query(
          `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'paid') AS paid
           FROM repayment_instalment WHERE repayment_plan_id = $1`,
          [linkedInstalment.plan_id],
        );
        const allDone =
          Number(allPaid.rows[0].total) === Number(allPaid.rows[0].paid);

        if (allDone) {
          await client.query(
            `UPDATE invoice
            SET status = 'paid', paid_amount = amount_due, updated_at = NOW()
            WHERE id IN (SELECT invoice_id FROM repayment_plan_invoice WHERE repayment_plan_id = $1)`,
            [linkedInstalment.plan_id],
          );

          await client.query(
            `UPDATE repayment_plan SET status = 'completed', updated_at = NOW() WHERE id = $1`,
            [linkedInstalment.plan_id],
          );
          await client.query(
            `UPDATE collection SET status = 'recovered', updated_at = NOW()
         WHERE tenant_id = $1 AND status IN ('active', 'repayment_agreed', 'partial_collection')`,
            [linkedInstalment.tenant_id],
          );
        }

        await client.query(`SELECT public.recalculate_tenant_score($1, $2)`, [
          linkedInstalment.tenant_id,
          req.userId,
        ]);

        await client.query("COMMIT");

        await createNotification(
          linkedInstalment.tenant_id,
          "payment_approved",
          "Instalment Payment Approved",
          `Your payment for instalment #${linkedInstalment.instalment_number} has been approved.`,
          linkedInstalment.id,
          "repayment_instalment",
        );

        return res.json({
          message: "Instalment payment approved",
          plan_completed: allDone,
        });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE payment 
        SET status = 'rejected', 
            rejection_reason = 'Auto-rejected: Another payment was approved for this invoice',
            updated_at = NOW()
        WHERE invoice_id = $1 
          AND id != $2 
          AND status IN ('pending', 'pending_approval')`,
        [payment.invoice_id, id],
      );

      const invDueRes = await client.query(
        `SELECT due_date FROM invoice WHERE id = $1`,
        [payment.invoice_id],
      );
      const isLate =
        invDueRes.rows[0]?.due_date &&
        new Date(payment.payment_date) > new Date(invDueRes.rows[0].due_date);
      const newPaymentStatus = isLate ? "late" : "paid";

      await client.query(
        `UPDATE public.invoice_payments 
        SET status = 'rejected', updated_at = NOW()
        WHERE payment_id IN (
          SELECT id FROM payment 
          WHERE invoice_id = $1 
            AND id != $2 
            AND status = 'rejected'
            AND rejection_reason = 'Auto-rejected: Another payment was approved for this invoice'
        )`,
        [payment.invoice_id, id],
      );

      await client.query(
        `UPDATE payment SET 
          status = $3, 
          approved_by = $1, 
          approved_at = NOW(),
          updated_at = NOW()
        WHERE id = $2`,
        [req.userId, id, newPaymentStatus],
      );

      await client.query(
        `UPDATE public.invoice_payments 
         SET status = 'approved',
             updated_at = NOW()
         WHERE payment_id = $1`,
        [id],
      );

      const invStatusResult = await client.query(
        `SELECT public.recalculate_invoice_status($1) AS new_status`,
        [payment.invoice_id],
      );

      const invBalance = await client.query(
        `SELECT amount_due, remaining_balance, status FROM invoice WHERE id = $1`,
        [payment.invoice_id],
      );

      const newInvoiceStatus = invStatusResult.rows[0].new_status;
      const invoiceData = invBalance.rows[0];
      const remainingBalance = Number(invoiceData.remaining_balance);

      const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
      await client.query(
        `INSERT INTO receipt (payment_id, tenant_id, receipt_number, receipt_url, issued_by, issued_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          id,
          payment.tenant_id,
          receiptNo,
          `/uploads/receipts/${receiptNo}.pdf`,
          req.userId,
        ],
      );

      await client.query(`SELECT public.recalculate_payment_history($1)`, [
        payment.tenant_id,
      ]);
      await client.query(`SELECT public.recalculate_tenant_score($1, $2)`, [
        payment.tenant_id,
        req.userId,
      ]);

      await recalculateCollectionBalance(payment.tenant_id, client);

      await client.query("COMMIT");

      let notificationTitle, notificationBody;
      if (newInvoiceStatus === "partial") {
        notificationTitle = "Partial Payment Approved";
        notificationBody = `Your payment of R${payment.amount_paid} was approved. R${remainingBalance} still outstanding on this invoice. Receipt: ${receiptNo}`;
      } else if (newInvoiceStatus === "paid") {
        notificationTitle = "Payment Approved - Invoice Fully Paid";
        notificationBody = `Your payment of R${payment.amount_paid} has been approved and the invoice is now fully paid. Receipt: ${receiptNo}`;
      } else {
        notificationTitle = "Payment Approved";
        notificationBody = `Your payment of R${payment.amount_paid} has been approved. Receipt: ${receiptNo}`;
      }

      await createNotification(
        payment.tenant_id,
        "payment_approved",
        notificationTitle,
        notificationBody,
        id,
        "payment",
      );

      await auditLog(
        req.userId,
        "APPROVE",
        "payment",
        id,
        { status: payment.status, amount: payment.amount_paid },
        { status: newPaymentStatus, invoice_status: newInvoiceStatus },
        req,
      );

      res.json({
        message: "Payment approved",
        receipt_no: receiptNo,
        invoice_status: newInvoiceStatus,
        remaining_balance: remainingBalance,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Approve payment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /landlord/payments/:id/reject
router.put("/:id/reject", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    const paymentCheck = await pool.query(
      "SELECT * FROM payment WHERE id = $1 AND landlord_id = $2",
      [id, landlordId],
    );

    if (!paymentCheck.rows.length) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const payment = paymentCheck.rows[0];

    const instRes = await pool.query(
      `SELECT ri.*, rp.tenant_id, rp.landlord_id, rp.id AS plan_id
        FROM repayment_instalment ri
        JOIN repayment_plan rp ON rp.id = ri.repayment_plan_id
        WHERE ri.payment_id = $1`,
      [id],
    );
    const linkedInstalment = instRes.rows[0] || null;

    if (payment.status !== "pending" && payment.status !== "pending_approval") {
      return res
        .status(400)
        .json({ error: "Only pending payments can be rejected" });
    }

    if (linkedInstalment) {
      await pool.query(
        `UPDATE payment SET status = 'rejected', rejection_reason = $1, updated_at = NOW() WHERE id = $2`,
        [reason, id],
      );
      await pool.query(
        `UPDATE repayment_instalment SET status = 'pending', payment_id = NULL, updated_at = NOW() WHERE id = $1`,
        [linkedInstalment.id],
      );
      await createNotification(
        linkedInstalment.tenant_id,
        "payment_rejected",
        "Instalment Payment Rejected",
        `Your payment for instalment #${linkedInstalment.instalment_number} was rejected: ${reason}`,
        linkedInstalment.id,
        "repayment_instalment",
      );
      return res.json({ message: "Instalment payment rejected" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE payment SET 
          status = 'rejected', 
          rejection_reason = $1,
          updated_at = NOW()
         WHERE id = $2`,
        [reason, id],
      );

      await client.query(
        `UPDATE public.invoice_payments 
         SET status = 'rejected',
             updated_at = NOW()
         WHERE payment_id = $1`,
        [id],
      );

      const invStatusResult = await client.query(
        `SELECT public.recalculate_invoice_status($1) AS new_status`,
        [payment.invoice_id],
      );
      const newInvoiceStatus = invStatusResult.rows[0].new_status;

      await client.query(`SELECT public.recalculate_payment_history($1)`, [
        payment.tenant_id,
      ]);
      await client.query(`SELECT public.recalculate_tenant_score($1, $2)`, [
        payment.tenant_id,
        req.userId,
      ]);

      await client.query("COMMIT");

      await createNotification(
        payment.tenant_id,
        "payment_rejected",
        "Payment Rejected",
        `Your payment of R${payment.amount_paid} was rejected: ${reason}`,
        id,
        "payment",
      );

      await auditLog(
        req.userId,
        "REJECT",
        "payment",
        id,
        { status: payment.status, amount: payment.amount_paid },
        { status: "rejected", reason, invoice_status: newInvoiceStatus },
        req,
      );

      res.json({
        message: "Payment rejected",
        invoice_status: newInvoiceStatus,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Reject payment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /landlord/payments/:id/collections
router.put(
  "/:id/collections",
  requireAuth,
  requireLandlord,
  async (req, res) => {
    try {
      const landlordId = await getLandlordId(req.userId);
      if (!landlordId)
        return res.status(404).json({ error: "Landlord not found" });

      const { id } = req.params;
      const { notes } = req.body;

      const paymentCheck = await pool.query(
        "SELECT * FROM payment WHERE id = $1 AND landlord_id = $2",
        [id, landlordId],
      );

      if (!paymentCheck.rows.length) {
        return res.status(404).json({ error: "Payment not found" });
      }

      const payment = paymentCheck.rows[0];

      if (payment.status !== "late" && payment.status !== "rejected") {
        return res.status(400).json({
          error: "Only late or rejected payments can be sent to collections",
        });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        await client.query(
          `UPDATE payment SET status = 'collections', notes = $1, updated_at = NOW() WHERE id = $2`,
          [notes || null, id],
        );

        const invoiceRes = await client.query(
          "SELECT amount_due, remaining_balance, status, due_date FROM invoice WHERE id = $1",
          [payment.invoice_id],
        );

        const invoice = invoiceRes.rows[0];
        const outstandingBalance =
          invoice?.remaining_balance ||
          invoice?.amount_due ||
          payment.amount_paid;

        let daysOverdue = 0;
        if (invoice?.due_date) {
          const dueDate = new Date(invoice.due_date);
          const msPerDay = 1000 * 60 * 60 * 24;
          daysOverdue = Math.max(
            0,
            Math.floor((Date.now() - dueDate.getTime()) / msPerDay),
          );
        }

        const existingCollection = await client.query(
          `SELECT id FROM collection WHERE tenant_id = $1 AND status IN ('active', 'flagged', 'repayment_agreed')`,
          [payment.tenant_id],
        );

        if (existingCollection.rows.length === 0) {
          await client.query(
            `INSERT INTO collection (
            tenant_id, lease_id, landlord_id, outstanding_balance, 
            days_overdue, status, flagged_by, flagged_at, notes, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, 'active', $6, NOW(), $7, NOW(), NOW())`,
            [
              payment.tenant_id,
              payment.lease_id,
              landlordId,
              outstandingBalance,
              daysOverdue,
              req.userId,
              notes || null,
            ],
          );
        } else {
          await client.query(
            `UPDATE collection 
           SET outstanding_balance = $1,
               days_overdue = $2,
               status = 'active',
               notes = COALESCE($3, notes),
               updated_at = NOW()
           WHERE tenant_id = $4 AND status IN ('active', 'flagged', 'repayment_agreed')`,
            [outstandingBalance, daysOverdue, notes || null, payment.tenant_id],
          );
        }

        await client.query(
          "UPDATE tenant SET updated_at = NOW() WHERE id = $1",
          [payment.tenant_id],
        );

        await client.query(`SELECT public.recalculate_payment_history($1)`, [
          payment.tenant_id,
        ]);
        await client.query(`SELECT public.recalculate_tenant_score($1, $2)`, [
          payment.tenant_id,
          req.userId,
        ]);

        await client.query("COMMIT");

        await createNotification(
          payment.tenant_id,
          "payment_rejected",
          "Account Sent to Collections",
          `Your account has been escalated to collections for non-payment of R${outstandingBalance}.`,
          id,
          "payment",
        );

        await auditLog(
          req.userId,
          "COLLECTIONS",
          "payment",
          id,
          { status: payment.status },
          {
            status: "collections",
            outstanding_balance: outstandingBalance,
            days_overdue: daysOverdue,
          },
          req,
        );

        res.json({
          message: "Account sent to collections",
          days_overdue: daysOverdue,
        });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Send to collections:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// GET /landlord/payments/invoices/partial
router.get(
  "/invoices/partial",
  requireAuth,
  requireLandlord,
  async (req, res) => {
    try {
      const landlordId = await getLandlordId(req.userId);
      if (!landlordId)
        return res.status(404).json({ error: "Landlord not found" });

      const result = await pool.query(
        `SELECT 
        i.*,
        usr.full_name AS tenant_name,
        u.unit_number,
        prop.name AS property_name,
        COALESCE(ip.payment_count, 0) AS payment_count,
        COALESCE(ip.approved_amount, 0) AS approved_amount,
        COALESCE(ip.pending_amount, 0) AS pending_amount,
        ip.payments AS payment_details
       FROM invoice i
       JOIN tenant t ON t.id = i.tenant_id
       JOIN users usr ON usr.id = t.user_id
       JOIN unit u ON u.id = i.unit_id
       JOIN property prop ON prop.id = u.property_id
       LEFT JOIN public.invoice_payment_summary ip ON ip.invoice_id = i.id
       WHERE i.landlord_id = $1
         AND i.status = 'partial'
         AND i.remaining_balance > 0
       ORDER BY i.due_date ASC`,
        [landlordId],
      );

      res.json({
        partial_invoices: result.rows,
        count: result.rows.length,
      });
    } catch (err) {
      console.error("Get partial invoices:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

module.exports = router;
