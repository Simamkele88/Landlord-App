const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord } = require("../middleware/roleCheck");

// POST /billing/generate-monthly - Generate invoices for all active leases
router.post("/generate-monthly", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordRes = await pool.query(
      "SELECT id FROM landlord WHERE user_id = $1",
      [req.userId]
    );
    const landlordId = landlordRes.rows[0]?.id;
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    // Get the current month's billing period
    const now = new Date();
    const billingStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const billingEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 1); // Due on 1st

    // Get all active leases for this landlord
    const leases = await pool.query(
      `SELECT l.*, u.unit_number, p.name AS property_name,
              t.first_name || ' ' || t.last_name AS tenant_name
       FROM lease l
       JOIN tenant t ON t.id = l.tenant_id
       JOIN unit u ON u.id = l.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE l.landlord_id = $1 AND l.status = 'active'
         AND l.lease_start_date <= $2
         AND (l.lease_end_date IS NULL OR l.lease_end_date >= $2)`,
      [landlordId, billingEnd]
    );

    let generated = 0;
    let skipped = 0;

    for (const lease of leases.rows) {
      // Check if invoice already exists for this period
      const existingInvoice = await pool.query(
        `SELECT id FROM invoice 
         WHERE lease_id = $1 
           AND billing_period_start = $2 
           AND billing_period_end = $3`,
        [lease.id, billingStart.toISOString().split('T')[0], billingEnd.toISOString().split('T')[0]]
      );

      if (existingInvoice.rows.length > 0) {
        skipped++;
        continue;
      }

      // Generate invoice number
      const invoiceCount = await pool.query("SELECT COUNT(*) FROM invoice");
      const invoiceNumber = `INV-${billingStart.getFullYear()}${String(billingStart.getMonth() + 1).padStart(2, '0')}-${String(invoiceCount.rows[0].count + 1).padStart(3, '0')}`;

      // Create invoice
      await pool.query(
        `INSERT INTO invoice (
          lease_id, tenant_id, unit_id, landlord_id, invoice_number,
          amount_due, rent_amount, billing_period_start, billing_period_end,
          due_date, status, remaining_balance, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'sent', $11, NOW())`,
        [
          lease.id, lease.tenant_id, lease.unit_id, landlordId,
          invoiceNumber, lease.rent_amount, lease.rent_amount,
          billingStart.toISOString().split('T')[0],
          billingEnd.toISOString().split('T')[0],
          dueDate.toISOString().split('T')[0],
          lease.rent_amount
        ]
      );
      generated++;
    }

    res.json({ 
      message: "Invoices generated", 
      generated, 
      skipped,
      period: `${billingStart.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}`
    });
  } catch (err) {
    console.error("Generate invoices:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /billing/status - Check billing status for current month
router.get("/status", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordRes = await pool.query(
      "SELECT id FROM landlord WHERE user_id = $1",
      [req.userId]
    );
    const landlordId = landlordRes.rows[0]?.id;
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = await pool.query(
      `SELECT 
        COUNT(*) AS total_leases,
        COUNT(i.id) AS invoices_generated,
        COUNT(CASE WHEN i.status = 'paid' THEN 1 END) AS paid_count,
        COUNT(CASE WHEN i.status = 'sent' THEN 1 END) AS sent_count,
        COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) AS overdue_count
       FROM lease l
       LEFT JOIN invoice i ON i.lease_id = l.id 
         AND i.billing_period_start = $2 
         AND i.billing_period_end = $3
       WHERE l.landlord_id = $1 AND l.status = 'active'`,
      [landlordId, monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]]
    );

    res.json({
      status: result.rows[0],
      current_month: now.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
    });
  } catch (err) {
    console.error("Billing status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;