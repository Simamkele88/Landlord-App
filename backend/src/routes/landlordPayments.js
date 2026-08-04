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

function getPagination(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

async function recalculateCollectionBalance(tenantId, client) {
  const result = await client.query(
    `SELECT COALESCE(SUM(remaining_balance), 0) AS total_remaining
     FROM invoice
     WHERE tenant_id = $1
       AND status NOT IN ('paid', 'void', 'cancelled')
       AND remaining_balance > 0`,
    [tenantId]
  );
  const totalRemaining = Number(result.rows[0].total_remaining);
 
  if (totalRemaining <= 0) {
    await client.query(
      `UPDATE collection
       SET status = 'recovered',
           outstanding_balance = 0,
           updated_at = NOW()
       WHERE tenant_id = $1
         AND status IN ('active', 'flagged', 'repayment_agreed')`,
      [tenantId]
    );
  } else {
    await client.query(
      `UPDATE collection
       SET outstanding_balance = $1,
           updated_at = NOW()
       WHERE tenant_id = $2
         AND status IN ('active', 'flagged', 'repayment_agreed')`,
      [totalRemaining, tenantId]
    );
  }
 
  return totalRemaining;
}

// GET /landlord/payments - List of Payments with invoice_payments data 
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { page, limit, offset } = getPagination(req);

    const [countResult, dataResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM payment WHERE landlord_id = $1`, [landlordId]),
      pool.query(
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
          ip.payments AS payment_details
         FROM payment p
         LEFT JOIN tenant t ON t.id = p.tenant_id
         LEFT JOIN users usr ON usr.id = t.user_id
         LEFT JOIN invoice inv ON inv.id = p.invoice_id
         LEFT JOIN unit u ON u.id = inv.unit_id
         LEFT JOIN property prop ON prop.id = u.property_id
         LEFT JOIN public.invoice_payment_summary ip ON ip.invoice_id = p.invoice_id
         WHERE p.landlord_id = $1
         ORDER BY p.created_at DESC
         LIMIT $2 OFFSET $3`,
        [landlordId, limit, offset]
      ),
    ]);

    const total = Number(countResult.rows[0].total);

    res.json({
      payments: dataResult.rows,
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    console.error("Get payments:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /landlord/invoices - List all invoices with payment summary
router.get("/invoices", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { page, limit, offset } = getPagination(req);

    const [countResult, statsResult, dataResult] = await Promise.all([
      pool.query(`SELECT COUNT(*) AS total FROM invoice WHERE landlord_id = $1`, [landlordId]),
      // Summary stats computed across ALL of the landlord's invoices
      pool.query(
        `SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'paid') AS paid,
          COUNT(*) FILTER (WHERE status = 'partial') AS partial,
          COUNT(*) FILTER (WHERE status = 'overdue') AS overdue,
          COUNT(*) FILTER (WHERE status = 'sent') AS unpaid,
          COALESCE(SUM(amount_due), 0) AS total_amount_due,
          COALESCE(SUM(paid_amount), 0) AS total_paid,
          COALESCE(SUM(remaining_balance), 0) AS total_remaining
         FROM invoice WHERE landlord_id = $1`,
        [landlordId]
      ),
      pool.query(
        `SELECT 
          i.*,
          usr.full_name AS tenant_name,
          u.unit_number,
          prop.name AS property_name,
          COALESCE(ip.payment_count, 0) AS payment_count,
          COALESCE(ip.pending_amount, 0) AS pending_amount,
          COALESCE(ip.approved_amount, 0) AS approved_amount,
          COALESCE(ip.rejected_amount, 0) AS rejected_amount,
          ip.last_payment_date,
          ip.payments
         FROM invoice i
         JOIN tenant t ON t.id = i.tenant_id
         JOIN users usr ON usr.id = t.user_id
         JOIN unit u ON u.id = i.unit_id
         JOIN property prop ON prop.id = u.property_id
         LEFT JOIN public.invoice_payment_summary ip ON ip.invoice_id = i.id
         WHERE i.landlord_id = $1
         ORDER BY i.billing_period_start DESC, i.created_at DESC
         LIMIT $2 OFFSET $3`,
        [landlordId, limit, offset]
      ),
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
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  } catch (err) {
    console.error("Get invoices:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /landlord/payments/cash - Record a cash payment
router.post("/cash", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { invoice_id, amount_paid, notes } = req.body;

    if (!invoice_id || !amount_paid) {
      return res.status(400).json({ error: "Missing required fields: invoice_id, amount_paid" });
    }
    if (Number(amount_paid) <= 0) {
      return res.status(400).json({ error: "amount_paid must be greater than 0" });
    }

    const invoiceCheck = await pool.query(
      `SELECT id, tenant_id, lease_id, landlord_id, remaining_balance, status
       FROM invoice WHERE id = $1`,
      [invoice_id]
    );
    if (!invoiceCheck.rows.length) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    const invoice = invoiceCheck.rows[0];
    if (invoice.landlord_id !== landlordId) {
      return res.status(403).json({ error: "This invoice does not belong to you" });
    }
    if (invoice.status === "paid" || invoice.status === "void" || invoice.status === "cancelled") {
      return res.status(400).json({ error: `Invoice is already ${invoice.status}` });
    }

    const remaining = Number(invoice.remaining_balance);
    if (Number(amount_paid) > remaining + 0.01) {
      return res.status(400).json({
        error: `Amount (R${amount_paid}) exceeds the remaining balance of R${remaining.toFixed(2)}`,
      });
    }

    const tenant_id = invoice.tenant_id;
    const lease_id = invoice.lease_id;

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
        [invoice_id]
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
        [invoice_id]
      );

      const paymentResult = await client.query(
        `INSERT INTO payment (
          invoice_id, tenant_id, lease_id, landlord_id, amount_paid,
          payment_method, payment_date, status, approved_by, approved_at, notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'cash', NOW(), 'paid', $6, NOW(), $7, NOW(), NOW())
        RETURNING id`,
        [invoice_id, tenant_id, lease_id, landlordId, amount_paid, req.userId, notes || "Cash payment recorded by landlord"]
      );

      const paymentId = paymentResult.rows[0].id;

      const cashReference = 'CASH-' + paymentId;

      await client.query(
        `INSERT INTO public.invoice_payments (
          invoice_id, payment_id, amount, payment_date, method, reference, status, allocated_rent
        ) VALUES ($1, $2, $3, NOW(), 'cash', $4, 'approved', $3)`,
        [invoice_id, paymentId, amount_paid, cashReference]
      );

      await client.query(`SELECT public.recalculate_invoice_status($1)`, [invoice_id]);

      const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
      await client.query(
        `INSERT INTO receipt (payment_id, tenant_id, receipt_number, receipt_url, issued_by, issued_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [paymentId, tenant_id, receiptNo, `/uploads/receipts/${receiptNo}.pdf`, req.userId]
      );

      await client.query(`SELECT public.recalculate_payment_history($1)`, [tenant_id]);
      await client.query(`SELECT public.recalculate_tenant_score($1, $2)`, [tenant_id, req.userId]);
      await recalculateCollectionBalance(tenant_id, client);

      await client.query("COMMIT");

      await createNotification(
        tenant_id,
        "payment_approved",
        "Cash Payment Recorded",
        `Your cash payment of R${amount_paid} has been recorded and your invoice has been updated. Receipt: ${receiptNo}`,
        paymentId,
        "payment"
      );

      res.json({ 
        message: "Cash payment recorded and approved", 
        payment_id: paymentId,
        receipt_no: receiptNo,
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
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT 
        COUNT(*) AS total_payments,
        COALESCE(SUM(p.amount_paid), 0) AS total_expected,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount_paid ELSE 0 END), 0) AS total_collected,
        COUNT(CASE WHEN p.status IN ('pending', 'pending_approval') THEN 1 END) AS pending_count,
        COUNT(CASE WHEN p.status = 'late' THEN 1 END) AS late_count,
        COUNT(CASE WHEN p.status = 'collections' THEN 1 END) AS collections_count,
        COUNT(CASE WHEN p.status = 'rejected' THEN 1 END) AS rejected_count,
        -- Invoice summary
        COUNT(DISTINCT i.id) AS total_invoices,
        COUNT(DISTINCT CASE WHEN i.status = 'partial' THEN i.id END) AS partial_invoices,
        COUNT(DISTINCT CASE WHEN i.status = 'overdue' THEN i.id END) AS overdue_invoices,
        COALESCE(SUM(i.remaining_balance), 0) AS total_outstanding
       FROM payment p
       LEFT JOIN invoice i ON i.id = p.invoice_id
       WHERE p.landlord_id = $1`,
      [landlordId]
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
      [landlordId]
    );

    res.json({ 
      summary: result.rows[0],
      tenants_with_partial: partialTenants.rows
    });
  } catch (err) {
    console.error("Payment summary:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /landlord/payments/:id - Get single payment with full details
router.get("/:id", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

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

// PUT /landlord/payments/:id/mark-cash-paid 
router.put("/:id/mark-cash-paid", requireAuth, requireLandlord, async (req, res) => {
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

    if (payment.payment_method !== 'cash') {
      return res.status(400).json({ error: "This endpoint is for cash payments only" });
    }

    if (payment.status !== 'pending' && payment.status !== 'pending_approval') {
      return res.status(400).json({ error: "Only pending cash payments can be auto-approved" });
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
        [payment.invoice_id, id]
      );

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
        [payment.invoice_id, id]
      );

      await client.query(
        `UPDATE payment SET 
          status = 'paid', 
          approved_by = $1, 
          approved_at = NOW(),
          updated_at = NOW()
         WHERE id = $2`,
        [req.userId, id]
      );

      await client.query(
        `UPDATE public.invoice_payments 
         SET status = 'approved', updated_at = NOW()
         WHERE payment_id = $1`,
        [id]
      );

      const invStatusResult = await client.query(
        `SELECT public.recalculate_invoice_status($1) AS new_status`,
        [payment.invoice_id]
      );
      
      const invBalance = await client.query(
        `SELECT amount_due, remaining_balance FROM invoice WHERE id = $1`,
        [payment.invoice_id]
      );
      
      const newInvoiceStatus = invStatusResult.rows[0].new_status;
      const remainingBalance = Number(invBalance.rows[0].remaining_balance);

      const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
      await client.query(
        `INSERT INTO receipt (payment_id, tenant_id, receipt_number, receipt_url, issued_by, issued_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [id, payment.tenant_id, receiptNo, `/uploads/receipts/${receiptNo}.pdf`, req.userId]
      );

      await client.query(`SELECT public.recalculate_payment_history($1)`, [payment.tenant_id]);
      await client.query(`SELECT public.recalculate_tenant_score($1, $2)`, [payment.tenant_id, req.userId]);
      await recalculateCollectionBalance(payment.tenant_id, client);

      await client.query("COMMIT");

      await createNotification(
        payment.tenant_id,
        "payment_approved",
        "Cash Payment Verified",
        `Your cash payment of R${payment.amount_paid} has been verified and approved. Receipt: ${receiptNo}`,
        id,
        "payment"
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

      await client.query(
        `UPDATE payment 
        SET status = 'rejected', 
            rejection_reason = 'Auto-rejected: Another payment was approved for this invoice',
            updated_at = NOW()
        WHERE invoice_id = $1 
          AND id != $2 
          AND status IN ('pending', 'pending_approval')`,
        [payment.invoice_id, id]
      );

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
        [payment.invoice_id, id]
      );

      await client.query(
        `UPDATE payment SET 
          status = 'paid', 
          approved_by = $1, 
          approved_at = NOW(),
          updated_at = NOW()
         WHERE id = $2`,
        [req.userId, id]
      );

      await client.query(
        `UPDATE public.invoice_payments 
         SET status = 'approved',
             updated_at = NOW()
         WHERE payment_id = $1`,
        [id]
      );

      const invStatusResult = await client.query(
        `SELECT public.recalculate_invoice_status($1) AS new_status`,
        [payment.invoice_id]
      );
      
      const invBalance = await client.query(
        `SELECT amount_due, remaining_balance, status FROM invoice WHERE id = $1`,
        [payment.invoice_id]
      );
      
      const newInvoiceStatus = invStatusResult.rows[0].new_status;
      const invoiceData = invBalance.rows[0];
      const remainingBalance = Number(invoiceData.remaining_balance);

      const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
      await client.query(
        `INSERT INTO receipt (payment_id, tenant_id, receipt_number, receipt_url, issued_by, issued_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [id, payment.tenant_id, receiptNo, `/uploads/receipts/${receiptNo}.pdf`, req.userId]
      );

      await client.query(`SELECT public.recalculate_payment_history($1)`, [payment.tenant_id]);
      await client.query(`SELECT public.recalculate_tenant_score($1, $2)`, [payment.tenant_id, req.userId]);

      await recalculateCollectionBalance(payment.tenant_id, client);

      await client.query("COMMIT");

      let notificationTitle, notificationBody;
      if (newInvoiceStatus === 'partial') {
        notificationTitle = "Partial Payment Approved";
        notificationBody = `Your payment of R${payment.amount_paid} was approved. R${remainingBalance} still outstanding on this invoice. Receipt: ${receiptNo}`;
      } else if (newInvoiceStatus === 'paid') {
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
        "payment"
      );

      await auditLog(req.userId, "APPROVE", "payment", id, 
        { status: payment.status, amount: payment.amount_paid }, 
        { status: "paid", invoice_status: newInvoiceStatus }, 
        req
      );

      res.json({ 
        message: "Payment approved", 
        receipt_no: receiptNo,
        invoice_status: newInvoiceStatus,
        remaining_balance: remainingBalance
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

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE payment SET 
          status = 'rejected', 
          rejection_reason = $1,
          updated_at = NOW()
         WHERE id = $2`,
        [reason, id]
      );

      await client.query(
        `UPDATE public.invoice_payments 
         SET status = 'rejected',
             updated_at = NOW()
         WHERE payment_id = $1`,
        [id]
      );

      const invStatusResult = await client.query(
        `SELECT public.recalculate_invoice_status($1) AS new_status`,
        [payment.invoice_id]
      );
      const newInvoiceStatus = invStatusResult.rows[0].new_status;

      await client.query(`SELECT public.recalculate_payment_history($1)`, [payment.tenant_id]);
      await client.query(`SELECT public.recalculate_tenant_score($1, $2)`, [payment.tenant_id, req.userId]);

      await client.query("COMMIT");

      await createNotification(
        payment.tenant_id,
        "payment_rejected",
        "Payment Rejected",
        `Your payment of R${payment.amount_paid} was rejected: ${reason}`,
        id,
        "payment"
      );

      await auditLog(req.userId, "REJECT", "payment", id, 
        { status: payment.status, amount: payment.amount_paid }, 
        { status: "rejected", reason, invoice_status: newInvoiceStatus }, 
        req
      );

      res.json({ 
        message: "Payment rejected",
        invoice_status: newInvoiceStatus
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

      await client.query(
        `UPDATE payment SET status = 'collections', notes = $1, updated_at = NOW() WHERE id = $2`,
        [notes || null, id]
      );

      const invoiceRes = await client.query(
        "SELECT amount_due, remaining_balance, status, due_date FROM invoice WHERE id = $1",
        [payment.invoice_id]
      );

      const invoice = invoiceRes.rows[0];
      const outstandingBalance = invoice?.remaining_balance || invoice?.amount_due || payment.amount_paid;

      let daysOverdue = 0;
      if (invoice?.due_date) {
        const dueDate = new Date(invoice.due_date);
        const msPerDay = 1000 * 60 * 60 * 24;
        daysOverdue = Math.max(0, Math.floor((Date.now() - dueDate.getTime()) / msPerDay));
      }

      const existingCollection = await client.query(
        `SELECT id FROM collection WHERE tenant_id = $1 AND status IN ('active', 'flagged', 'repayment_agreed')`,
        [payment.tenant_id]
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
            notes || null
          ]
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
          [outstandingBalance, daysOverdue, notes || null, payment.tenant_id]
        );
      }

      await client.query(
        "UPDATE tenant SET updated_at = NOW() WHERE id = $1",
        [payment.tenant_id]
      );

      await client.query("COMMIT");

      await createNotification(
        payment.tenant_id,
        "payment_rejected",
        "Account Sent to Collections",
        `Your account has been escalated to collections for non-payment of R${outstandingBalance}.`,
        id,
        "payment"
      );

      await auditLog(req.userId, "COLLECTIONS", "payment", id, 
        { status: payment.status }, 
        { status: "collections", outstanding_balance: outstandingBalance, days_overdue: daysOverdue }, 
        req
      );

      res.json({ message: "Account sent to collections", days_overdue: daysOverdue });
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


// GET /landlord/invoices/partial - Get all partial invoices
router.get("/invoices/partial", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

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
      [landlordId]
    );

    res.json({ 
      partial_invoices: result.rows,
      count: result.rows.length
    });
  } catch (err) {
    console.error("Get partial invoices:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;