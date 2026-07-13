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

// GET /landlord/payments
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT 
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
        p.notes,
        p.created_at,
        t.first_name || ' ' || t.last_name AS tenant_name,
        u.unit_number,
        prop.name AS property_name,
        inv.invoice_number,
        inv.amount_due,
        inv.due_date,
        inv.billing_period_start,
        inv.billing_period_end
       FROM payment p
       LEFT JOIN tenant t ON t.id = p.tenant_id
       LEFT JOIN unit u ON u.id = (SELECT unit_id FROM invoice WHERE id = p.invoice_id)
       LEFT JOIN property prop ON prop.id = u.property_id
       LEFT JOIN invoice inv ON inv.id = p.invoice_id
       WHERE p.landlord_id = $1
       ORDER BY p.created_at DESC
       LIMIT 100`,
      [landlordId]
    );

    res.json({ payments: result.rows });
  } catch (err) {
    console.error("Get payments:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /landlord/invoices - List all invoices
router.get("/invoices", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT i.*, 
              t.first_name || ' ' || t.last_name AS tenant_name,
              u.unit_number,
              p.name AS property_name
       FROM invoice i
       JOIN tenant t ON t.id = i.tenant_id
       JOIN unit u ON u.id = i.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE i.landlord_id = $1
       ORDER BY i.billing_period_start DESC, i.created_at DESC
       LIMIT 100`,
      [landlordId]
    );

    res.json({ invoices: result.rows });
  } catch (err) {
    console.error("Get invoices:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /landlord/payments/:id
router.get("/:id", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        p.*,
        t.first_name || ' ' || t.last_name AS tenant_name,
        u.unit_number,
        prop.name AS property_name,
        inv.invoice_number,
        inv.amount_due,
        inv.due_date,
        inv.billing_period_start,
        inv.billing_period_end
       FROM payment p
       LEFT JOIN tenant t ON t.id = p.tenant_id
       LEFT JOIN invoice inv ON inv.id = p.invoice_id
       LEFT JOIN unit u ON u.id = inv.unit_id
       LEFT JOIN property prop ON prop.id = u.property_id
       WHERE p.id = $1 AND p.landlord_id = $2`,
      [id, landlordId]
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

// PUT /landlord/payments/:id/approve
router.put("/:id/approve", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;

    const paymentCheck = await pool.query(
      "SELECT * FROM payment WHERE id = $1 AND landlord_id = $2",
      [id, landlordId]
    );

    if (!paymentCheck.rows.length) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const payment = paymentCheck.rows[0];

    if (payment.status !== 'pending' && payment.status !== 'pending_approval') {
      return res.status(400).json({ error: "Only pending payments can be approved" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update payment status
      await client.query(
        `UPDATE payment SET 
          status = 'paid', 
          approved_by = $1, 
          approved_at = NOW(),
          updated_at = NOW()
         WHERE id = $2`,
        [req.userId, id]
      );

      // Update invoice
      await client.query(
        `UPDATE invoice SET 
          status = 'paid', 
          paid_amount = $1, 
          paid_date = CURRENT_DATE,
          remaining_balance = 0
         WHERE id = $2`,
        [payment.amount_paid, payment.invoice_id]
      );

      // Generate receipt
      const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
      await client.query(
        `INSERT INTO receipt (payment_id, tenant_id, receipt_number, receipt_url, issued_by, issued_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [id, payment.tenant_id, receiptNo, `/uploads/receipts/${receiptNo}.pdf`, req.userId]
      );

      // Update tenant payment history
      await client.query(
        `UPDATE tenant_payment_history SET 
          on_time_payments = on_time_payments + 1,
          last_calculated = NOW()
         WHERE tenant_id = $1`,
        [payment.tenant_id]
      );

      await client.query("COMMIT");

      // Notify tenant
      await createNotification(
        payment.tenant_id,
        "payment_approved",
        "Payment Approved",
        `Your payment of R${payment.amount_paid} has been approved. Receipt: ${receiptNo}`,
        id,
        "payment"
      );

      // Audit log
      await auditLog(req.userId, "APPROVE", "payment", id, { status: payment.status }, { status: "paid" }, req);

      res.json({ message: "Payment approved", receipt_no: receiptNo });
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
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Rejection reason is required" });
    }

    const paymentCheck = await pool.query(
      "SELECT * FROM payment WHERE id = $1 AND landlord_id = $2",
      [id, landlordId]
    );

    if (!paymentCheck.rows.length) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const payment = paymentCheck.rows[0];

    if (payment.status !== 'pending' && payment.status !== 'pending_approval') {
      return res.status(400).json({ error: "Only pending payments can be rejected" });
    }

    await pool.query(
      `UPDATE payment SET 
        status = 'rejected', 
        rejection_reason = $1,
        updated_at = NOW()
       WHERE id = $2`,
      [reason, id]
    );

    // Update invoice to show still unpaid
    await pool.query(
      `UPDATE invoice SET status = 'sent', remaining_balance = amount_due WHERE id = $1`,
      [payment.invoice_id]
    );

    // Update tenant payment history
    await pool.query(
      `UPDATE tenant_payment_history SET 
        missed_payments = missed_payments + 1,
        last_calculated = NOW()
       WHERE tenant_id = $1`,
      [payment.tenant_id]
    );

    // Notify tenant
    await createNotification(
      payment.tenant_id,
      "payment_rejected",
      "Payment Rejected",
      `Your payment of R${payment.amount_paid} was rejected: ${reason}`,
      id,
      "payment"
    );

    await auditLog(req.userId, "REJECT", "payment", id, { status: payment.status }, { status: "rejected", reason }, req);

    res.json({ message: "Payment rejected" });
  } catch (err) {
    console.error("Reject payment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /landlord/payments/:id/collections
router.put("/:id/collections", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;
    const { notes } = req.body;

    const paymentCheck = await pool.query(
      "SELECT * FROM payment WHERE id = $1 AND landlord_id = $2",
      [id, landlordId]
    );

    if (!paymentCheck.rows.length) {
      return res.status(404).json({ error: "Payment not found" });
    }

    const payment = paymentCheck.rows[0];

    if (payment.status !== 'late' && payment.status !== 'rejected') {
      return res.status(400).json({ error: "Only late or rejected payments can be sent to collections" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update payment status
      await client.query(
        `UPDATE payment SET status = 'collections', notes = $1, updated_at = NOW() WHERE id = $2`,
        [notes || null, id]
      );

      // Create collection record
      const invoiceRes = await pool.query(
        "SELECT amount_due, remaining_balance FROM invoice WHERE id = $1",
        [payment.invoice_id]
      );

      const invoice = invoiceRes.rows[0];
      const outstandingBalance = invoice?.remaining_balance || invoice?.amount_due || payment.amount_paid;

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
          60,
          req.userId,
          notes || null
        ]
      );

      // Update tenant status
      await client.query(
        "UPDATE tenant SET updated_at = NOW() WHERE id = $1",
        [payment.tenant_id]
      );

      await client.query("COMMIT");

      // Notify tenant
      await createNotification(
        payment.tenant_id,
        "payment_rejected",
        "Account Sent to Collections",
        `Your account has been escalated to collections for non-payment of R${outstandingBalance}.`,
        id,
        "payment"
      );

      await auditLog(req.userId, "COLLECTIONS", "payment", id, { status: payment.status }, { status: "collections" }, req);

      res.json({ message: "Account sent to collections" });
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
});

// GET /landlord/payments/summary
router.get("/summary", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT 
        COUNT(*) AS total_payments,
        COALESCE(SUM(p.amount_paid), 0) AS total_expected,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount_paid ELSE 0 END), 0) AS total_collected,
        COUNT(CASE WHEN p.status IN ('pending', 'pending_approval') THEN 1 END) AS pending_count,
        COUNT(CASE WHEN p.status = 'late' THEN 1 END) AS late_count,
        COUNT(CASE WHEN p.status = 'collections' THEN 1 END) AS collections_count,
        COUNT(CASE WHEN p.status = 'rejected' THEN 1 END) AS rejected_count
       FROM payment p
       WHERE p.landlord_id = $1`,
      [landlordId]
    );

    res.json({ summary: result.rows[0] });
  } catch (err) {
    console.error("Payment summary:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;