const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord } = require("../middleware/roleCheck");
const { auditLog } = require("../utils/audit");
const { createNotification } = require("../utils/notifications");

async function getLandlordId(userId) {
  const result = await pool.query("SELECT id FROM landlord WHERE user_id = $1", [userId]);
  return result.rows[0]?.id || null;
}

// GET /collections - List all collections accounts
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

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
        t.first_name || ' ' || t.last_name AS tenant_name,
        u.unit_number AS unit,
        p.name AS property,
        (SELECT MAX(pay.payment_date) FROM payment pay WHERE pay.tenant_id = t.id AND pay.status = 'paid') AS last_payment_date
       FROM collection col
       JOIN tenant t ON t.id = col.tenant_id
       LEFT JOIN lease l ON l.id = col.lease_id
       LEFT JOIN unit u ON u.id = l.unit_id
       LEFT JOIN property p ON p.id = u.property_id
       WHERE col.landlord_id = $1
       ORDER BY col.days_overdue DESC, col.created_at DESC`,
      [landlordId]
    );

    // Also get overdue invoices not yet in collections
    const overdueInvoices = await pool.query(
      `SELECT 
        i.id,
        i.tenant_id,
        i.lease_id,
        i.remaining_balance AS balance,
        CASE WHEN i.due_date IS NOT NULL THEN CURRENT_DATE - i.due_date::date ELSE 0 END AS days_overdue,
        'overdue' AS collections_status,
        NULL AS notes,
        i.created_at,
        t.first_name || ' ' || t.last_name AS tenant_name,
        u.unit_number AS unit,
        p.name AS property,
        (SELECT MAX(pay.payment_date) FROM payment pay WHERE pay.tenant_id = t.id AND pay.status = 'paid') AS last_payment_date
       FROM invoice i
       JOIN tenant t ON t.id = i.tenant_id
       JOIN lease l ON l.id = i.lease_id
       JOIN unit u ON u.id = l.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE i.landlord_id = $1
         AND i.status = 'overdue'
         AND i.remaining_balance > 0
         AND NOT EXISTS (SELECT 1 FROM collection col WHERE col.tenant_id = i.tenant_id)
       ORDER BY i.due_date ASC`,
      [landlordId]
    );

    const accounts = [
      ...result.rows,
      ...overdueInvoices.rows.map(inv => ({
        ...inv,
        id: `inv_${inv.id}`,
      })),
    ];

    res.json({ accounts });
  } catch (err) {
    console.error("Get collections:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /collections - Send an account to collections
router.post("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { tenant_id, lease_id, outstanding_balance, days_overdue, notes } = req.body;

    if (!tenant_id || !outstanding_balance) {
      return res.status(400).json({ error: "Tenant ID and outstanding balance are required" });
    }

    // Check if already in collections
    const existing = await pool.query(
      "SELECT id FROM collection WHERE tenant_id = $1 AND landlord_id = $2 AND status = 'active'",
      [tenant_id, landlordId]
    );
    if (existing.rows.length) {
      return res.status(409).json({ error: "Tenant is already in collections" });
    }

    const result = await pool.query(
      `INSERT INTO collection (
        tenant_id, lease_id, landlord_id, outstanding_balance,
        days_overdue, status, flagged_by, flagged_at, notes, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'active', $6, NOW(), $7, NOW(), NOW())
      RETURNING *`,
      [tenant_id, lease_id || null, landlordId, outstanding_balance, days_overdue || 0, req.userId, notes || null]
    );

    // Notify tenant
    await createNotification(
      tenant_id,
      "payment_rejected",
      "Account Sent to Collections",
      `Your account has been escalated to collections for an outstanding balance of R${outstanding_balance}.`,
      result.rows[0].id,
      "collection"
    );

    await auditLog(req.userId, "CREATE", "collection", result.rows[0].id, null, { tenant_id, outstanding_balance }, req);

    res.status(201).json({ message: "Account sent to collections", collection: result.rows[0] });
  } catch (err) {
    console.error("Send to collections:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /collections/:id/send - Send existing overdue account to collections
router.put("/:id/send", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;
    const { note } = req.body;

    // Handle invoice-based ID (inv_ prefix)
    if (String(id).startsWith('inv_')) {
      const invoiceId = String(id).replace('inv_', '');
      
      const invoice = await pool.query(
        `SELECT i.*, l.id AS lease_id FROM invoice i 
         JOIN lease l ON l.id = i.lease_id
         WHERE i.id = $1 AND i.landlord_id = $2`,
        [invoiceId, landlordId]
      );
      
      if (!invoice.rows.length) return res.status(404).json({ error: "Invoice not found" });

      const inv = invoice.rows[0];
      const daysOverdue = inv.due_date ? Math.floor((new Date() - new Date(inv.due_date)) / 86400000) : 0;

      const result = await pool.query(
        `INSERT INTO collection (
          tenant_id, lease_id, landlord_id, outstanding_balance,
          days_overdue, status, flagged_by, flagged_at, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'active', $6, NOW(), $7, NOW(), NOW())
        RETURNING *`,
        [inv.tenant_id, inv.lease_id, landlordId, inv.remaining_balance, daysOverdue, req.userId, note || null]
      );

      await createNotification(
        inv.tenant_id, "payment_rejected", "Account Sent to Collections",
        `Your account has been escalated to collections for R${inv.remaining_balance}.`,
        result.rows[0].id, "collection"
      );

      return res.json({ message: "Sent to collections", collection: result.rows[0] });
    }

    // Handle direct collection ID
    const existing = await pool.query(
      "SELECT * FROM collection WHERE id = $1 AND landlord_id = $2",
      [id, landlordId]
    );
    
    if (!existing.rows.length) return res.status(404).json({ error: "Collection account not found" });

    await pool.query(
      "UPDATE collection SET status = 'active', notes = COALESCE($1, notes), updated_at = NOW() WHERE id = $2",
      [note || null, id]
    );

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
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'collections', 'legal', 'recovered', 'written_off', 'repayment_plan'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const result = await pool.query(
      "UPDATE collection SET status = $1, updated_at = NOW() WHERE id = $2 AND landlord_id = $3 RETURNING *",
      [status, id, landlordId]
    );

    if (!result.rows.length) return res.status(404).json({ error: "Collection account not found" });

    const collection = result.rows[0];

    // Notify tenant of status change
    const statusLabels = {
      legal: "Legal Action Started",
      recovered: "Account Recovered",
      written_off: "Account Written Off",
    };

    if (statusLabels[status]) {
      await createNotification(
        collection.tenant_id, "payment_rejected",
        statusLabels[status],
        `Your collections account status has been updated to: ${status.replace(/_/g, ' ')}.`,
        id, "collection"
      );
    }

    await auditLog(req.userId, "UPDATE", "collection", id, { status: collection.status }, { status }, req);

    res.json({ message: "Status updated", collection: result.rows[0] });
  } catch (err) {
    console.error("Update collection status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /collections/summary - Collection stats
router.get("/summary", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT 
        COUNT(*) AS total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) AS in_collections,
        COUNT(CASE WHEN status = 'legal' THEN 1 END) AS legal,
        COUNT(CASE WHEN status = 'recovered' THEN 1 END) AS recovered,
        COUNT(CASE WHEN status = 'written_off' THEN 1 END) AS written_off,
        COALESCE(SUM(outstanding_balance), 0) AS total_outstanding,
        COALESCE(AVG(days_overdue), 0) AS avg_days_overdue
       FROM collection
       WHERE landlord_id = $1`,
      [landlordId]
    );

    res.json({ summary: result.rows[0] });
  } catch (err) {
    console.error("Collection summary:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;