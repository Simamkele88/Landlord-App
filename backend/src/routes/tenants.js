const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord, requireTenant } = require("../middleware/roleCheck");
const { sendWelcomeEmail } = require("../utils/email");
const { auditLog } = require("../utils/audit");
const { generateTempPassword } = require("../utils/helpers");

async function checkInvoiceNotCoveredByPlan(invoiceId, tenantId) {
  const plan = await pool.query(
    `SELECT rp.id, rp.start_date, rp.total_amount, rp.status
     FROM repayment_plan rp
     WHERE rp.tenant_id = $1
       AND rp.status = 'active'
     ORDER BY rp.created_at DESC
     LIMIT 1`,
    [tenantId]
  );
 
  if (!plan.rows.length) return null; 

  if (invoiceId) {
    const inv = await pool.query(
      `SELECT id, status, remaining_balance FROM invoice WHERE id = $1`,
      [invoiceId]
    );
    if (inv.rows.length && ["sent","unpaid","overdue","partial"].includes(inv.rows[0].status)) {
      return {
        blocked: true,
        repayment_plan_id: plan.rows[0].id,
        message: "This invoice is covered by an active repayment plan. Please make payments through your repayment plan schedule.",
      };
    }
  }
 
  return null;
}

// POST /tenants/register - Landlord registers a new tenant
router.post("/register", requireAuth, requireLandlord, async (req, res) => {
  const {
    first_name, last_name, email, phone,
    unit_id, rent_amount, deposit_amount,
    payment_frequency, payment_due_day,
    lease_start_date, lease_end_date, special_note,
  } = req.body;

  if (!first_name || !last_name || !email || !unit_id || !rent_amount || !lease_start_date || !lease_end_date) {
    return res.status(400).json({ error: "Name, email, unit, rent amount, and lease dates are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query("SELECT id FROM users WHERE email=$1", [email.trim().toLowerCase()]);
    if (existing.rows.length) {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "A user with this email already exists" });
    }

    const unitCheck = await client.query("SELECT id, property_id, status FROM unit WHERE id=$1", [unit_id]);
    if (!unitCheck.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Unit not found" });
    }
    if (unitCheck.rows[0].status !== "vacant") {
      await client.query("ROLLBACK");
      return res.status(409).json({ error: "Unit is not vacant" });
    }

    const landlordRes = await client.query("SELECT id FROM landlord WHERE user_id=$1", [req.userId]);
    if (!landlordRes.rows.length) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "Landlord record not found" });
    }
    const landlordId = landlordRes.rows[0].id;

    const tempPassword = generateTempPassword();
    const hashed = await bcrypt.hash(tempPassword, 12);

    const userRes = await client.query(
      `INSERT INTO users (email, phone, password_hash, role, first_name, last_name, must_change_password, status, created_at, updated_at)
       VALUES ($1,$2,$3,'tenant',$4,$5,true,'active',NOW(),NOW()) RETURNING id`,
      [email.trim().toLowerCase(), phone || null, hashed, first_name, last_name]
    );
    const userId = userRes.rows[0].id;

    const tenantRes = await client.query(
      `INSERT INTO tenant (user_id, landlord_id, special_note, profile_completed, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,false,$4,NOW(),NOW()) RETURNING id`,
      [userId, landlordId, special_note || null, req.userId]
    );
    const tenantId = tenantRes.rows[0].id;

    await client.query(
      `INSERT INTO temp_password (user_id, password_hash, expires_at, created_at)
       VALUES ($1,$2, NOW() + INTERVAL '7 days', NOW())`,
      [userId, hashed]
    );

    const leaseRes = await client.query(
      `INSERT INTO lease (tenant_id, unit_id, landlord_id, lease_start_date, lease_end_date,
         rent_amount, deposit_amount, payment_frequency, payment_due_day, status, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active',$10,NOW(),NOW()) RETURNING id`,
      [
        tenantId, unit_id, landlordId,
        lease_start_date, lease_end_date,
        rent_amount, deposit_amount || rent_amount,
        payment_frequency || "monthly", payment_due_day || 1,
        req.userId,
      ]
    );

    await client.query(
      "UPDATE unit SET status='occupied', current_tenant_id=$1, updated_at=NOW() WHERE id=$2",
      [tenantId, unit_id]
    );

    await client.query(
      `INSERT INTO tenant_payment_history (tenant_id, on_time_payments, late_payments, missed_payments, partial_payments, last_calculated)
       VALUES ($1,0,0,0,0,NOW())`,
      [tenantId]
    );

    await client.query("COMMIT");

    await sendWelcomeEmail(email, `${first_name} ${last_name}`, tempPassword, "tenant");
    await auditLog(req.userId, "CREATE", "tenant", tenantId, null, { first_name, last_name, email, unit_id }, req);

    res.status(201).json({
      message:       "Tenant registered successfully",
      tenant_id:     tenantId,
      user_id:       userId,
      lease_id:      leaseRes.rows[0].id,
      temp_password: process.env.NODE_ENV === "development" ? tempPassword : undefined,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Register tenant:", err);
    res.status(500).json({ error: "Server error while registering tenant" });
  } finally {
    client.release();
  }
});

// GET /tenants/me - Get current tenant info
router.get("/me", requireAuth, requireTenant, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.email, u.phone, u.must_change_password,
              u.first_name, u.last_name, u.profile_image_url,
              un.unit_number, un.floor_number, p.name AS property_name,
              COALESCE(ph.partial_payments, 0) AS partial_payments_count,
              COALESCE(ph.on_time_payments, 0) AS on_time_payments_count,
              COALESCE(ph.late_payments, 0) AS late_payments_count,
              COALESCE(ph.missed_payments, 0) AS missed_payments_count,
              (SELECT COUNT(*) FROM invoice i 
               WHERE i.tenant_id = t.id AND i.status = 'partial') AS active_partial_invoices
       FROM tenant t 
       JOIN users u ON u.id = t.user_id 
       LEFT JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
       LEFT JOIN unit un ON un.id = l.unit_id
       LEFT JOIN property p ON p.id = un.property_id
       LEFT JOIN tenant_payment_history ph ON ph.tenant_id = t.id
       WHERE u.id = $1`,
      [req.userId]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Tenant not found" });
    res.json({ tenant: result.rows[0] });
  } catch (err) {
    console.error("Get tenant me:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /tenants/me/profile - Tenant completes/updates their profile
router.patch("/me/profile", requireAuth, requireTenant, async (req, res) => {
  const {
    date_of_birth, gender, nationality, marital_status,
    id_document_type, id_number, passport_number,
    home_address_line1, home_address_line2, home_city, home_postal_code, home_province, home_country,
    employment_status, employer_company, employer_contact, employer_official_email, job_title, monthly_income,
    emergency_name, emergency_relationship, emergency_phone, emergency_email, emergency_address,
    number_of_occupants, has_pets, pet_details,
  } = req.body;

  if (!date_of_birth || !gender || !nationality || !id_document_type || !employment_status || !emergency_name || !emergency_phone) {
    return res.status(400).json({ error: "Date of birth, gender, nationality, ID type, employment status, and emergency contact are required" });
  }
  try {
    const tenantRes = await pool.query("SELECT id FROM tenant WHERE user_id=$1", [req.userId]);
    if (!tenantRes.rows.length) return res.status(404).json({ error: "Tenant record not found" });
    const tenantId = tenantRes.rows[0].id;

    await pool.query(
      `UPDATE tenant SET
         date_of_birth=$1, gender=$2, nationality=$3, marital_status=$4,
         id_document_type=$5, id_number=$6, passport_number=$7,
         home_address_line1=$8, home_address_line2=$9, home_city=$10, home_postal_code=$11,
         home_province=$12, home_country=$13,
         employment_status=$14, employer_company=$15, employer_contact=$16,
         employer_official_email=$17, job_title=$18, monthly_income=$19,
         emergency_name=$20, emergency_relationship=$21, emergency_phone=$22,
         emergency_email=$23, emergency_address=$24,
         number_of_occupants=$25, has_pets=$26, pet_details=$27,
         profile_completed=true, updated_by=$28, updated_at=NOW()
       WHERE id=$29`,
      [
        date_of_birth, gender.toLowerCase(), nationality, marital_status.toLowerCase() || null,
        id_document_type, id_number || null, passport_number || null,
        home_address_line1 || null, home_address_line2 || null, home_city || null,
        home_postal_code || null, home_province || null, home_country || null,
        employment_status.toLowerCase(), employer_company || null, employer_contact || null,
        employer_official_email || null, job_title || null, monthly_income || null,
        emergency_name, emergency_relationship || null, emergency_phone,
        emergency_email || null, emergency_address || null,
        number_of_occupants || 1, has_pets || false, has_pets ? pet_details || null : null,
        req.userId, tenantId,
      ]
    );
    res.json({ message: "Profile completed successfully", profile_completed: true });
  } catch (err) {
    console.error("Complete profile:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /tenants/me/invoices - Get tenant's invoices with payment summary
router.get("/me/invoices", requireAuth, requireTenant, async (req, res) => {
  try {
    const tenantRes = await pool.query("SELECT id FROM tenant WHERE user_id=$1", [req.userId]);
    if (!tenantRes.rows.length) return res.status(404).json({ error: "Tenant not found" });
    const tenantId = tenantRes.rows[0].id;

    const result = await pool.query(
      `SELECT 
        i.*, 
        p.name AS property_name, 
        u.unit_number,
        COALESCE(ips.payment_count, 0) AS payment_count,
        COALESCE(ips.pending_amount, 0) AS pending_amount,
        COALESCE(ips.approved_amount, 0) AS approved_amount,
        COALESCE(ips.rejected_amount, 0) AS rejected_amount,
        ips.last_payment_date,
        ips.payments AS payment_details,
        CASE 
          WHEN i.status = 'partial' THEN true 
          ELSE false 
        END AS has_partial_payment
       FROM invoice i
       LEFT JOIN unit u ON u.id = i.unit_id
       LEFT JOIN property p ON p.id = u.property_id
       LEFT JOIN public.invoice_payment_summary ips ON ips.invoice_id = i.id
       WHERE i.tenant_id = $1
       ORDER BY i.due_date DESC
       LIMIT 24`,
      [tenantId]
    );

    const invoices = result.rows;
    const summary = {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'paid').length,
      partial: invoices.filter(i => i.status === 'partial').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      unpaid: invoices.filter(i => i.status === 'sent' || i.status === 'unpaid').length,
      total_remaining: invoices.reduce((sum, i) => sum + Number(i.remaining_balance || 0), 0),
      total_pending_payments: invoices.reduce((sum, i) => sum + Number(i.pending_amount || 0), 0)
    };

    res.json({ 
      invoices: result.rows,
      summary
    });
  } catch (err) {
    console.error("Get tenant invoices:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /tenants/me/payments - Get payment history with invoice_payments data
router.get("/me/payments", requireAuth, requireTenant, async (req, res) => {
  try {
    const tenantRes = await pool.query("SELECT id FROM tenant WHERE user_id=$1", [req.userId]);
    if (!tenantRes.rows.length) return res.status(404).json({ error: "Tenant not found" });
    const tenantId = tenantRes.rows[0].id;

    const result = await pool.query(
      `SELECT 
        pay.*, 
        inv.invoice_number, 
        inv.billing_period_start, 
        inv.billing_period_end, 
        inv.due_date,
        inv.status AS invoice_status,
        inv.remaining_balance,
        r.receipt_number, 
        r.receipt_url,
        ip.status AS payment_approval_status,
        ip.allocated_rent,
        ip.allocated_utilities,
        ip.allocated_late_fees
       FROM payment pay
       LEFT JOIN invoice inv ON inv.id = pay.invoice_id
       LEFT JOIN receipt r ON r.payment_id = pay.id
       LEFT JOIN public.invoice_payments ip ON ip.payment_id = pay.id
       WHERE pay.tenant_id = $1
       ORDER BY pay.created_at DESC
       LIMIT 50`,
      [tenantId]
    );

    const payments = result.rows;
    const summary = {
      total_paid: payments
        .filter(p => p.status === 'paid' || p.status === 'late')
        .reduce((sum, p) => sum + Number(p.amount_paid), 0),
      pending: payments.filter(p => p.status === 'pending' || p.status === 'pending_approval').length,
      approved: payments.filter(p => p.status === 'paid' || p.status === 'late').length,
      rejected: payments.filter(p => p.status === 'rejected').length,
      partial_payments: payments.filter(p => p.payment_approval_status === 'approved' && 
        p.invoice_status === 'partial').length
    };

    res.json({ 
      payments: result.rows,
      summary
    });
  } catch (err) {
    console.error("Get tenant payments:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /tenants/me/payments - Submit payment with proof
router.post("/me/payments", requireAuth, requireTenant, async (req, res) => {
  try {
    const tenantRes = await pool.query("SELECT id FROM tenant WHERE user_id=$1", [req.userId]);
    if (!tenantRes.rows.length) return res.status(404).json({ error: "Tenant not found" });
    const tenantId = tenantRes.rows[0].id;

    const { 
      invoice_id, 
      amount_paid, 
      payment_method, 
      bank_reference, 
      proof_of_payment_url, 
      auto_approve,
      allocated_rent,
      allocated_utilities,
      allocated_late_fees
    } = req.body;

    if (!invoice_id || !amount_paid) {
      return res.status(400).json({ error: "Invoice ID and amount are required" });
    }

    const invCheck = await pool.query(
      "SELECT id, landlord_id, lease_id, amount_due, paid_amount, remaining_balance, status FROM invoice WHERE id = $1 AND tenant_id = $2",
      [invoice_id, tenantId]
    );
    if (!invCheck.rows.length) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const invoice = invCheck.rows[0];
    
    if (invoice.status === 'paid') {
      return res.status(400).json({ error: "This invoice has already been paid in full" });
    }
    
    const remaining = Number(invoice.remaining_balance);
    if (amount_paid > remaining && remaining > 0) {
      return res.status(400).json({ 
        error: `Amount exceeds remaining balance. Remaining: R${remaining.toFixed(2)}`,
        remaining_balance: remaining
      });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const planBlock = await checkInvoiceNotCoveredByPlan(invoice_id, tenantId);
      if (planBlock?.blocked) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          error: planBlock.message,
          repayment_plan_id: planBlock.repayment_plan_id,
        });
      }

      const status = auto_approve ? 'paid' : 'pending';
      
      let allocRent = allocated_rent || amount_paid;
      let allocUtilities = allocated_utilities || 0;
      let allocLateFees = allocated_late_fees || 0;
      
      if (allocRent + allocUtilities + allocLateFees !== amount_paid) {
        allocRent = amount_paid;
        allocUtilities = 0;
        allocLateFees = 0;
      }
      
      const paymentResult = await client.query(
        `INSERT INTO payment (invoice_id, tenant_id, lease_id, landlord_id, amount_paid, 
          payment_method, bank_reference, proof_of_payment_url, status,
          allocated_rent, allocated_utilities, allocated_late_fees,
          approved_by, approved_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
         RETURNING *`,
        [
          invoice_id, tenantId, invoice.lease_id, invoice.landlord_id, 
          amount_paid, payment_method || 'bank_transfer', bank_reference || null, 
          proof_of_payment_url || null, status,
          allocRent, allocUtilities, allocLateFees,
          auto_approve ? req.userId : null,
          auto_approve ? new Date().toISOString() : null
        ]
      );

      const payment = paymentResult.rows[0];

      const rejectResult = await client.query(
        `UPDATE payment 
         SET status = 'rejected', 
             rejection_reason = 'Auto-rejected: Newer payment submitted',
             updated_at = NOW()
         WHERE invoice_id = $1 
           AND tenant_id = $2
           AND id != $3
           AND status IN ('pending', 'pending_approval')
         RETURNING id, amount_paid`,
        [invoice_id, tenantId, payment.id]
      );

      if (rejectResult.rows.length > 0) {
        const rejectedIds = rejectResult.rows.map(r => r.id);
        await client.query(
          `UPDATE public.invoice_payments 
           SET status = 'rejected', updated_at = NOW()
           WHERE payment_id = ANY($1)`,
          [rejectedIds]
        );

        for (const rejected of rejectResult.rows) {
          await client.query(
            `INSERT INTO notification (user_id, type, title, body, related_entity_id, related_entity_type, created_at)
             VALUES ($1, 'payment_rejected', 'Previous Payment Auto-Cancelled', $2, $3, 'payment', NOW())`,
            [req.userId,
             `Your previous payment of R${Number(rejected.amount_paid).toFixed(2)} for this invoice was automatically cancelled because you submitted a new payment.`,
             rejected.id]
          );
        }
      }

      await client.query(
        `INSERT INTO public.invoice_payments (
          invoice_id, payment_id, amount, payment_date,
          method, reference, status,
          allocated_rent, allocated_utilities, allocated_late_fees,
          notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          invoice_id,
          payment.id,
          amount_paid,
          payment.payment_date,
          payment_method || 'bank_transfer',
          bank_reference || null,
          status === 'paid' ? 'approved' : 'pending',
          allocRent,
          allocUtilities,
          allocLateFees,
          null
        ]
      );

      let receiptNo = null;
      let newInvoiceStatus = invoice.status;
      let remainingBalance = remaining;

      if (auto_approve) {
        const invStatusResult = await client.query(
          `SELECT public.recalculate_invoice_status($1) AS new_status`,
          [invoice_id]
        );
        const invBalance = await client.query(
          `SELECT remaining_balance FROM invoice WHERE id = $1`,
          [invoice_id]
        );
        newInvoiceStatus = invStatusResult.rows[0].new_status;
        remainingBalance = Number(invBalance.rows[0].remaining_balance);

        receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
        await client.query(
          `INSERT INTO receipt (payment_id, tenant_id, receipt_number, receipt_url, issued_by, issued_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [payment.id, tenantId, receiptNo, `/uploads/receipts/${receiptNo}.pdf`, req.userId]
        );

        await client.query(`SELECT public.recalculate_payment_history($1)`, [tenantId]);
        await client.query(`SELECT public.recalculate_tenant_score($1, NULL)`, [tenantId]);

        const landlordUser = await pool.query(
          "SELECT user_id FROM landlord WHERE id = $1",
          [invoice.landlord_id]
        );

        const landlordMsg = newInvoiceStatus === 'partial'
          ? `Partial in-app card payment of R${amount_paid} received. Balance remaining: R${remainingBalance.toFixed(2)}. Receipt: ${receiptNo}`
          : `In-app card payment of R${amount_paid} received and auto-approved. Receipt: ${receiptNo}`;
        const tenantMsg = newInvoiceStatus === 'partial'
          ? `Your in-app payment of R${amount_paid} was received. R${remainingBalance.toFixed(2)} still outstanding on this invoice. Receipt: ${receiptNo}`
          : `Your in-app payment of R${amount_paid} has been approved. Receipt: ${receiptNo}`;

        if (landlordUser.rows.length) {
          await client.query(
            `INSERT INTO notification (user_id, type, title, body, related_entity_id, related_entity_type, created_at)
             VALUES ($1, 'payment_received', $2, $3, $4, 'payment', NOW())`,
            [landlordUser.rows[0].user_id,
             newInvoiceStatus === 'partial' ? 'Partial Payment Received' : 'Payment Received',
             landlordMsg,
             payment.id]
          );
        }

        await client.query(
          `INSERT INTO notification (user_id, type, title, body, related_entity_id, related_entity_type, created_at)
           VALUES ($1, 'payment_approved', $2, $3, $4, 'payment', NOW())`,
          [req.userId,
           newInvoiceStatus === 'partial' ? 'Partial Payment Received' : 'Payment Approved',
           tenantMsg,
           payment.id]
        );
      } else {
        const landlordUser = await pool.query(
          "SELECT user_id FROM landlord WHERE id = $1",
          [invoice.landlord_id]
        );
        if (landlordUser.rows.length) {
          await client.query(
            `INSERT INTO notification (user_id, type, title, body, related_entity_id, related_entity_type, created_at)
             VALUES ($1, 'payment_received', 'Payment Needs Review', $2, $3, 'payment', NOW())`,
            [landlordUser.rows[0].user_id, 
             `Payment of R${amount_paid} submitted and requires your approval.${rejectResult.rows.length > 0 ? ` ${rejectResult.rows.length} previous pending payment(s) were auto-cancelled.` : ''}`,
             payment.id]
          );
        }

        await client.query(
          `INSERT INTO notification (user_id, type, title, body, related_entity_id, related_entity_type, created_at)
           VALUES ($1, 'payment_received', 'Payment Submitted', $2, $3, 'payment', NOW())`,
          [req.userId, 
           `Your payment of R${amount_paid} has been submitted and is pending landlord approval.${rejectResult.rows.length > 0 ? ` Your ${rejectResult.rows.length} previous pending payment(s) were auto-cancelled.` : ''}`,
           payment.id]
        );
      }

      await client.query("COMMIT");

      res.status(201).json({ 
        message: auto_approve ? "Payment approved" : "Payment submitted for approval", 
        payment: {
          ...payment,
          receipt_no: receiptNo,
        },
        auto_cancelled_count: rejectResult.rows.length,
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
    console.error("Submit payment:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /tenants/me/dashboard - Tenant dashboard summary
router.get("/me/dashboard", requireAuth, requireTenant, async (req, res) => {
  try {
    const tenantRes = await pool.query("SELECT id FROM tenant WHERE user_id=$1", [req.userId]);
    if (!tenantRes.rows.length) return res.status(404).json({ error: "Tenant not found" });
    const tenantId = tenantRes.rows[0].id;

    const [currentInvoice, lease, maintenanceCount, complaintCount, unreadMessages, paymentStats, tenantInfo] = await Promise.all([
      pool.query(
        `SELECT 
          i.*,
          COALESCE(ips.payment_count, 0) AS payment_count,
          COALESCE(ips.pending_amount, 0) AS pending_amount,
          COALESCE(ips.approved_amount, 0) AS approved_amount
         FROM invoice i
         LEFT JOIN public.invoice_payment_summary ips ON ips.invoice_id = i.id
         WHERE i.tenant_id = $1 AND i.status IN ('sent', 'overdue', 'partial')
         ORDER BY i.due_date ASC LIMIT 1`,
        [tenantId]
      ),
      pool.query(
        `SELECT l.*, u.unit_number, p.name AS property_name
         FROM lease l
         JOIN unit u ON u.id = l.unit_id
         JOIN property p ON p.id = u.property_id
         WHERE l.tenant_id = $1 AND l.status = 'active'
         LIMIT 1`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) FROM maintenance_request 
         WHERE tenant_id = $1 AND status NOT IN ('completed', 'closed', 'cancelled')`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) FROM complaint 
         WHERE filed_by_tenant_id = $1 AND status NOT IN ('resolved', 'dismissed', 'rejected')`,
        [tenantId]
      ),
      pool.query(
        `SELECT COUNT(*) FROM message 
         WHERE recipient_id = $1 AND is_read = false`,
        [req.userId]
      ),
      pool.query(
        `SELECT 
          COUNT(*) FILTER (WHERE status = 'partial') AS partial_invoices,
          COALESCE(SUM(remaining_balance), 0) AS total_outstanding
         FROM invoice
         WHERE tenant_id = $1 AND status IN ('sent', 'overdue', 'partial')`,
        [tenantId]
      ),
      pool.query(
        `SELECT t.reliability_score, t.reliability_score_value, t.standing, u.first_name, u.last_name,
                u.email, u.phone
         FROM tenant t
         JOIN users u ON u.id = t.user_id
         WHERE t.id = $1`,
        [tenantId]
      ),
    ]);

    res.json({
      current_invoice: currentInvoice.rows[0] || null,
      lease: lease.rows[0] || null,
      open_maintenance: parseInt(maintenanceCount.rows[0].count) || 0,
      open_complaints: parseInt(complaintCount.rows[0].count) || 0,
      unread_messages: parseInt(unreadMessages.rows[0].count) || 0,
      payment_stats: paymentStats.rows[0] || { pending_payments: 0, partial_invoices: 0, total_outstanding: 0 },
      tenant: tenantInfo.rows[0] || null,
    });
  } catch (err) {
    console.error("Tenant dashboard:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /tenants/me/invoices/:id - Get single invoice with payment summary
router.get("/me/invoices/:id", requireAuth, requireTenant, async (req, res) => {
  try {
    const tenantRes = await pool.query("SELECT id FROM tenant WHERE user_id=$1", [req.userId]);
    if (!tenantRes.rows.length) return res.status(404).json({ error: "Tenant not found" });
    const tenantId = tenantRes.rows[0].id;

    const result = await pool.query(
      `SELECT 
        i.*, 
        p.name AS property_name, 
        u.unit_number,
        COALESCE(ips.payment_count, 0) AS payment_count,
        COALESCE(ips.pending_amount, 0) AS pending_amount,
        COALESCE(ips.approved_amount, 0) AS approved_amount,
        COALESCE(ips.rejected_amount, 0) AS rejected_amount,
        ips.last_payment_date,
        ips.payments AS payment_details,
        CASE 
          WHEN i.status = 'partial' THEN true 
          ELSE false 
        END AS has_partial_payment
       FROM invoice i
       LEFT JOIN unit u ON u.id = i.unit_id
       LEFT JOIN property p ON p.id = u.property_id
       LEFT JOIN public.invoice_payment_summary ips ON ips.invoice_id = i.id
       WHERE i.id = $1 AND i.tenant_id = $2`,
      [req.params.id, tenantId]
    );

    if (!result.rows.length) return res.status(404).json({ error: "Invoice not found" });
    
    const invoice = result.rows[0];
    const can_pay = invoice.status !== 'paid' && 
                    invoice.remaining_balance > 0 &&
                    invoice.status !== 'cancelled' &&
                    invoice.status !== 'void';

    res.json({ 
      invoice: {
        ...invoice,
        can_make_payment: can_pay,
        payment_progress: invoice.amount_due > 0 
          ? Math.round((Number(invoice.approved_amount) / Number(invoice.amount_due)) * 100)
          : 0
      }
    });
  } catch (err) {
    console.error("Get invoice:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /tenants/me/invoices/:id/receipt - Get receipt(s) for an invoice
router.get("/me/invoices/:id/receipt", requireAuth, requireTenant, async (req, res) => {
  try {
    const tenantRes = await pool.query("SELECT id FROM tenant WHERE user_id=$1", [req.userId]);
    if (!tenantRes.rows.length) return res.status(404).json({ error: "Tenant not found" });
    const tenantId = tenantRes.rows[0].id;

    const invoiceRes = await pool.query(
      `SELECT i.*, p.name AS property_name, u.unit_number
       FROM invoice i
       LEFT JOIN unit u ON u.id = i.unit_id
       LEFT JOIN property p ON p.id = u.property_id
       WHERE i.id = $1 AND i.tenant_id = $2`,
      [req.params.id, tenantId]
    );
    if (!invoiceRes.rows.length) return res.status(404).json({ error: "Invoice not found" });

    const receiptsRes = await pool.query(
      `SELECT r.*, pay.amount_paid, pay.payment_method, pay.payment_date,
              ip.allocated_rent, ip.allocated_utilities, ip.allocated_late_fees,
              ip.status AS payment_approval_status
       FROM receipt r
       JOIN payment pay ON pay.id = r.payment_id
       LEFT JOIN public.invoice_payments ip ON ip.payment_id = pay.id
       WHERE pay.invoice_id = $1 AND pay.tenant_id = $2
       ORDER BY r.issued_at ASC`,
      [req.params.id, tenantId]
    );

    if (!receiptsRes.rows.length) {
      return res.status(404).json({ error: "No receipt found for this invoice yet" });
    }

    res.json({ 
      invoice: invoiceRes.rows[0], 
      receipts: receiptsRes.rows,
      total_paid: receiptsRes.rows.reduce((sum, r) => sum + Number(r.amount_paid), 0)
    });
  } catch (err) {
    console.error("Get invoice receipt:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /tenants - Get all tenants for a landlord
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordRes = await pool.query("SELECT id FROM landlord WHERE user_id=$1", [req.userId]);
    if (!landlordRes.rows.length) return res.status(404).json({ error: "Landlord not found" });
    const landlordId = landlordRes.rows[0].id;

    const result = await pool.query(
      `SELECT t.id, u.first_name, u.last_name, 
              t.profile_completed, t.reliability_score, t.reliability_score_value,
              t.special_note, t.has_pets, t.number_of_occupants, t.tenant_since,
              u.email, u.phone, u.email_verified, u.phone_verified, u.status AS user_status, u.last_login,
              l.id AS lease_id, l.lease_start_date, l.lease_end_date,
              l.rent_amount, l.deposit_amount, l.payment_frequency,
              l.payment_due_day, l.status AS lease_status,
              un.id AS unit_id, un.unit_number, un.floor_number,
              p.id AS property_id, p.name AS property_name,
              COALESCE(ph.on_time_payments,0) AS on_time_payments,
              COALESCE(ph.late_payments,0) AS late_payments,
              COALESCE(ph.missed_payments,0) AS missed_payments,
              COALESCE(ph.partial_payments,0) AS partial_payments,
              COALESCE(
                (SELECT SUM(i.remaining_balance) FROM invoice i
                 WHERE i.tenant_id = t.id AND i.status IN ('overdue','sent','partial')), 0
              ) AS outstanding_balance,
              (SELECT COUNT(*) FROM invoice i 
               WHERE i.tenant_id = t.id AND i.status = 'partial') AS partial_invoice_count
       FROM tenant t
       JOIN users u ON u.id = t.user_id
       LEFT JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
       LEFT JOIN unit un ON un.id = l.unit_id
       LEFT JOIN property p ON p.id = un.property_id
       LEFT JOIN tenant_payment_history ph ON ph.tenant_id = t.id
       WHERE t.landlord_id = $1
       ORDER BY t.created_at DESC`,
      [landlordId]
    );
    res.json({ tenants: result.rows });
  } catch (err) {
    console.error("Get tenants:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /tenants/:id - Get a specific tenant's info
router.get("/:id", requireAuth, requireLandlord, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.email, u.phone, u.status, u.last_login,
              u.first_name, u.last_name, u.profile_image_url,
              l.id AS lease_id, l.lease_start_date, l.lease_end_date,
              l.rent_amount, l.deposit_amount, l.status AS lease_status,
              un.unit_number, p.name AS property_name,
              COALESCE(ph.partial_payments,0) AS partial_payments_count,
              (SELECT COUNT(*) FROM invoice i 
               WHERE i.tenant_id = t.id AND i.status = 'partial') AS partial_invoice_count
       FROM tenant t
       JOIN users u ON u.id = t.user_id
       LEFT JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
       LEFT JOIN unit un ON un.id = l.unit_id
       LEFT JOIN property p ON p.id = un.property_id
       LEFT JOIN tenant_payment_history ph ON ph.tenant_id = t.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Tenant not found" });
    res.json({ tenant: result.rows[0] });
  } catch (err) {
    console.error("Get tenant:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;