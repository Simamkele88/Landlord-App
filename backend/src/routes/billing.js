const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord } = require("../middleware/roleCheck");
const { createNotification } = require("../utils/notifications");
const { auditLog } = require("../utils/audit");

async function getLandlordId(userId) {
  const result = await pool.query("SELECT id FROM landlord WHERE user_id = $1", [userId]);
  return result.rows[0]?.id || null;
}

async function hasPartialPayments(invoiceId, client) {
  const result = await client.query(
    `SELECT COUNT(*) > 0 AS has_partial
     FROM public.invoice_payments
     WHERE invoice_id = $1 AND status = 'approved'`,
    [invoiceId]
  );
  return result.rows[0].has_partial;
}

// POST /billing/generate-monthly - Generate invoices for all active leases
router.post("/generate-monthly", requireAuth, requireLandlord, async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const now = new Date();
    const billingStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const billingEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 1);

    const leases = await client.query(
      `SELECT l.*, u.unit_number, p.name AS property_name,
              usr.full_name AS tenant_name,
              t.id AS tenant_id
       FROM lease l
       JOIN tenant t ON t.id = l.tenant_id
       JOIN users usr ON usr.id = t.user_id
       JOIN unit u ON u.id = l.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE l.landlord_id = $1 AND l.status = 'active'
         AND l.lease_start_date <= $2
         AND (l.lease_end_date IS NULL OR l.lease_end_date >= $2)`,
      [landlordId, billingEnd]
    );

    let generated = 0;
    let skipped = 0;
    let hasPartial = 0;

    for (const lease of leases.rows) {
      const existingInvoice = await client.query(
        `SELECT id, status, remaining_balance 
         FROM invoice 
         WHERE lease_id = $1 
           AND billing_period_start = $2 
           AND billing_period_end = $3`,
        [lease.id, billingStart.toISOString().split('T')[0], billingEnd.toISOString().split('T')[0]]
      );

      if (existingInvoice.rows.length > 0) {
        const hasPartialPay = await hasPartialPayments(existingInvoice.rows[0].id, client);
        if (hasPartialPay) {
          hasPartial++;
          if (existingInvoice.rows[0].status !== 'partial') {
            await client.query(
              `UPDATE invoice SET status = 'partial', updated_at = NOW()
               WHERE id = $1`,
              [existingInvoice.rows[0].id]
            );
          }
        }
        skipped++;
        continue;
      }

      const outstandingBalance = await client.query(
        `SELECT COALESCE(SUM(remaining_balance), 0) AS total
         FROM invoice
         WHERE tenant_id = $1 
           AND status IN ('sent', 'overdue', 'partial')
           AND remaining_balance > 0`,
        [lease.tenant_id]
      );

      const seqResult = await client.query("SELECT nextval('invoice_number_seq') AS n");
      const invoiceNumber = `INV-${billingStart.getFullYear()}${String(billingStart.getMonth() + 1).padStart(2, '0')}-${String(seqResult.rows[0].n).padStart(3, '0')}`;

      const otherCharges = Number(outstandingBalance.rows[0].total) || 0;

      await client.query(
        `INSERT INTO invoice (
          lease_id, tenant_id, unit_id, landlord_id, invoice_number,
          amount_due, rent_amount, other_charges, billing_period_start, billing_period_end,
          due_date, status, notes, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
        [
          lease.id, lease.tenant_id, lease.unit_id, landlordId,
          invoiceNumber,
          Number(lease.rent_amount) + otherCharges, 
          lease.rent_amount, 
          otherCharges, 
          billingStart.toISOString().split('T')[0],
          billingEnd.toISOString().split('T')[0],
          dueDate.toISOString().split('T')[0],
          'sent',
          otherCharges > 0 ? `Includes outstanding balance of R${otherCharges} from previous periods.` : null,
        ]
      );
      generated++;
    }

    await client.query("COMMIT");

    await auditLog(req.userId, "GENERATE_INVOICES", "billing", null, 
      { period: `${billingStart.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}` },
      { generated, skipped, has_partial: hasPartial },
      req
    );

    res.json({ 
      message: "Invoices generated", 
      generated, 
      skipped,
      has_partial_invoices: hasPartial,
      period: `${billingStart.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })}`
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Generate invoices:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// GET /billing/status - Check billing status for current month with partial tracking
router.get("/status", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const result = await client.query(
      `SELECT 
        COUNT(*) AS total_leases,
        COUNT(i.id) AS invoices_generated,
        COUNT(CASE WHEN i.status = 'paid' THEN 1 END) AS paid_count,
        COUNT(CASE WHEN i.status = 'partial' THEN 1 END) AS partial_count,
        COUNT(CASE WHEN i.status = 'sent' THEN 1 END) AS sent_count,
        COUNT(CASE WHEN i.status = 'overdue' THEN 1 END) AS overdue_count,
        COALESCE(SUM(i.amount_due), 0) AS total_amount_due,
        COALESCE(SUM(i.paid_amount), 0) AS total_paid,
        COALESCE(SUM(i.remaining_balance), 0) AS total_remaining,
        COALESCE(SUM(i.remaining_balance) FILTER (WHERE i.status = 'partial'), 0) AS partial_balance
       FROM lease l
       LEFT JOIN invoice i ON i.lease_id = l.id 
         AND i.billing_period_start = $2 
         AND i.billing_period_end = $3
       WHERE l.landlord_id = $1 AND l.status = 'active'`,
      [landlordId, monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]]
    );

    const partialTenants = await pool.query(
      `SELECT 
        DISTINCT t.id,
        u.full_name,
        COUNT(i.id) AS partial_invoice_count,
        COALESCE(SUM(i.remaining_balance), 0) AS total_remaining
       FROM tenant t
       JOIN users u ON u.id = t.user_id
       JOIN invoice i ON i.tenant_id = t.id
       WHERE i.landlord_id = $1
         AND i.billing_period_start = $2
         AND i.billing_period_end = $3
         AND i.status = 'partial'
         AND i.remaining_balance > 0
       GROUP BY t.id, u.full_name
       ORDER BY total_remaining DESC`,
      [landlordId, monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]]
    );

    res.json({
      status: result.rows[0],
      current_month: now.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }),
      partial_tenants: partialTenants.rows,
      collection_risk: {
        has_partial_payments: Number(result.rows[0]?.partial_count || 0) > 0,
        total_at_risk: Number(result.rows[0]?.partial_balance || 0)
      }
    });
  } catch (err) {
    console.error("Billing status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /billing/invoices/:id - Get invoice with partial payment details
router.get("/invoices/:id", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        i.*,
        usr.full_name AS tenant_name,
        u.unit_number,
        p.name AS property_name,
        COALESCE(ips.payment_count, 0) AS payment_count,
        COALESCE(ips.pending_amount, 0) AS pending_amount,
        COALESCE(ips.approved_amount, 0) AS approved_amount,
        COALESCE(ips.rejected_amount, 0) AS rejected_amount,
        ips.last_payment_date,
        ips.payments AS payment_details
       FROM invoice i
       LEFT JOIN tenant t ON t.id = i.tenant_id
       LEFT JOIN users usr ON usr.id = t.user_id
       LEFT JOIN unit u ON u.id = i.unit_id
       LEFT JOIN property p ON p.id = u.property_id
       LEFT JOIN public.invoice_payment_summary ips ON ips.invoice_id = i.id
       WHERE i.id = $1 AND i.landlord_id = $2`,
      [id, landlordId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const invoice = result.rows[0];
    const isPartial = invoice.status === 'partial';
    const remaining = Number(invoice.remaining_balance) || 0;

    res.json({
      invoice: {
        ...invoice,
        is_partial: isPartial,
        remaining_balance: remaining,
        payment_progress: invoice.amount_due > 0 
          ? Math.round((Number(invoice.approved_amount) / Number(invoice.amount_due)) * 100)
          : 0,
        status_display: isPartial ? 'Partially Paid' : invoice.status
      }
    });
  } catch (err) {
    console.error("Get invoice:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /billing/partial-invoices - Get all partial invoices
router.get("/partial-invoices", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT 
        i.*,
        usr.full_name AS tenant_name,
        u.unit_number,
        p.name AS property_name,
        COALESCE(ips.payment_count, 0) AS payment_count,
        COALESCE(ips.approved_amount, 0) AS approved_amount,
        COALESCE(ips.pending_amount, 0) AS pending_amount,
        ips.last_payment_date,
        ips.payments AS payment_details
       FROM invoice i
       LEFT JOIN tenant t ON t.id = i.tenant_id
       LEFT JOIN users usr ON usr.id = t.user_id
       LEFT JOIN unit u ON u.id = i.unit_id
       LEFT JOIN property p ON p.id = u.property_id
       LEFT JOIN public.invoice_payment_summary ips ON ips.invoice_id = i.id
       WHERE i.landlord_id = $1
         AND i.status = 'partial'
         AND i.remaining_balance > 0
       ORDER BY i.due_date ASC`,
      [landlordId]
    );

    const summary = {
      total: result.rows.length,
      total_remaining: result.rows.reduce((sum, inv) => sum + Number(inv.remaining_balance), 0),
      total_paid: result.rows.reduce((sum, inv) => sum + Number(inv.paid_amount), 0)
    };

    res.json({
      partial_invoices: result.rows,
      summary
    });
  } catch (err) {
    console.error("Get partial invoices:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /billing/sync-invoice-status - Manually sync invoice status
router.post("/sync-invoice-status", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { invoice_id } = req.body;

    if (!invoice_id) {
      return res.status(400).json({ error: "Invoice ID is required" });
    }

    const check = await pool.query(
      "SELECT id FROM invoice WHERE id = $1 AND landlord_id = $2",
      [invoice_id, landlordId]
    );

    if (!check.rows.length) {
      return res.status(404).json({ error: "Invoice not found or not owned by you" });
    }

    const result = await pool.query(
      `SELECT public.recalculate_invoice_status($1) AS new_status`,
      [invoice_id]
    );

    const updated = await pool.query(
      `SELECT id, status, paid_amount, remaining_balance FROM invoice WHERE id = $1`,
      [invoice_id]
    );

    await auditLog(req.userId, "SYNC_INVOICE", "billing", invoice_id, 
      null, 
      { new_status: result.rows[0].new_status },
      req
    );

    res.json({
      message: "Invoice status synced successfully",
      invoice: updated.rows[0],
      new_status: result.rows[0].new_status
    });
  } catch (err) {
    console.error("Sync invoice status:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /billing/outstanding-summary - Get outstanding balance summary
router.get("/outstanding-summary", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT 
        COUNT(*) AS total_outstanding_invoices,
        COALESCE(SUM(remaining_balance), 0) AS total_outstanding,
        COUNT(*) FILTER (WHERE status = 'partial') AS partial_count,
        COALESCE(SUM(remaining_balance) FILTER (WHERE status = 'partial'), 0) AS partial_balance,
        COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_count,
        COALESCE(SUM(remaining_balance) FILTER (WHERE status = 'overdue'), 0) AS overdue_balance,
        COUNT(*) FILTER (WHERE status = 'sent') AS sent_count,
        COALESCE(SUM(remaining_balance) FILTER (WHERE status = 'sent'), 0) AS sent_balance
       FROM invoice
       WHERE landlord_id = $1
         AND status IN ('sent', 'overdue', 'partial')
         AND remaining_balance > 0`,
      [landlordId]
    );

    res.json({
      summary: result.rows[0],
      risk_level: Number(result.rows[0]?.overdue_balance || 0) > 10000 ? 'high' : 
                  Number(result.rows[0]?.overdue_balance || 0) > 5000 ? 'medium' : 'low'
    });
  } catch (err) {
    console.error("Outstanding summary:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;