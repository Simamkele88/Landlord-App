const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord, requireTenant } = require("../middleware/roleCheck");
const { sendWelcomeEmail } = require("../utils/email");
const { auditLog } = require("../utils/audit");
const { generateTempPassword } = require("../utils/helpers");

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

    const existing = await client.query("SELECT id FROM user_ WHERE email=$1", [email.trim().toLowerCase()]);
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
      `INSERT INTO user_ (email, phone, password_hash, role, must_change_password, status, created_at, updated_at)
       VALUES ($1,$2,$3,'tenant',true,'active',NOW(),NOW()) RETURNING id`,
      [email.trim().toLowerCase(), phone || null, hashed]
    );
    const userId = userRes.rows[0].id;

    const tenantRes = await client.query(
      `INSERT INTO tenant (user_id, landlord_id, first_name, last_name, special_note, profile_completed, created_by, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,false,$6,NOW(),NOW()) RETURNING id`,
      [userId, landlordId, first_name, last_name, special_note || null, req.userId]
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
      `INSERT INTO tenant_payment_history (tenant_id, on_time_payments, late_payments, missed_payments, partial_payment, last_calculated)
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

// GET /tenants/me - Get current tenant info
router.get("/me", requireAuth, requireTenant, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.email, u.phone, u.must_change_password,
              un.unit_number, un.floor_number, p.name AS property_name
       FROM tenant t 
       JOIN user_ u ON u.id = t.user_id 
       LEFT JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
       LEFT JOIN unit un ON un.id = l.unit_id
       LEFT JOIN property p ON p.id = un.property_id
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

// GET /tenants - Get all tenants for a landlord
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordRes = await pool.query("SELECT id FROM landlord WHERE user_id=$1", [req.userId]);
    if (!landlordRes.rows.length) return res.status(404).json({ error: "Landlord not found" });
    const landlordId = landlordRes.rows[0].id;

    const result = await pool.query(
      `SELECT t.id, t.first_name, t.last_name, 
              t.profile_completed, t.reliability_score, t.reliability_score_count,
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
              COALESCE(
                (SELECT SUM(i.remaining_balance) FROM invoice i
                 WHERE i.tenant_id = t.id AND i.status IN ('overdue','sent')), 0
              ) AS outstanding_balance
       FROM tenant t
       JOIN user_ u ON u.id = t.user_id
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
              l.id AS lease_id, l.lease_start_date, l.lease_end_date,
              l.rent_amount, l.deposit_amount, l.status AS lease_status,
              un.unit_number, p.name AS property_name
       FROM tenant t
       JOIN user_ u ON u.id = t.user_id
       LEFT JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
       LEFT JOIN unit un ON un.id = l.unit_id
       LEFT JOIN property p ON p.id = un.property_id
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

// GET /tenants/me/invoices - Get tenant's invoices
router.get("/me/invoices", requireAuth, requireTenant, async (req, res) => {
  try {
    const tenantRes = await pool.query("SELECT id FROM tenant WHERE user_id=$1", [req.userId]);
    if (!tenantRes.rows.length) return res.status(404).json({ error: "Tenant not found" });
    const tenantId = tenantRes.rows[0].id;

    const result = await pool.query(
      `SELECT i.*, p.name AS property_name, u.unit_number
       FROM invoice i
       LEFT JOIN unit u ON u.id = i.unit_id
       LEFT JOIN property p ON p.id = u.property_id
       WHERE i.tenant_id = $1
       ORDER BY i.due_date DESC
       LIMIT 24`,
      [tenantId]
    );

    res.json({ invoices: result.rows });
  } catch (err) {
    console.error("Get tenant invoices:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /tenants/me/invoices/:id - Get single invoice
router.get("/me/invoices/:id", requireAuth, requireTenant, async (req, res) => {
  try {
    const tenantRes = await pool.query("SELECT id FROM tenant WHERE user_id=$1", [req.userId]);
    if (!tenantRes.rows.length) return res.status(404).json({ error: "Tenant not found" });
    const tenantId = tenantRes.rows[0].id;

    const result = await pool.query(
      `SELECT i.*, p.name AS property_name, u.unit_number
       FROM invoice i
       LEFT JOIN unit u ON u.id = i.unit_id
       LEFT JOIN property p ON p.id = u.property_id
       WHERE i.id = $1 AND i.tenant_id = $2`,
      [req.params.id, tenantId]
    );

    if (!result.rows.length) return res.status(404).json({ error: "Invoice not found" });
    res.json({ invoice: result.rows[0] });
  } catch (err) {
    console.error("Get invoice:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /tenants/me/payments - Get payment history
router.get("/me/payments", requireAuth, requireTenant, async (req, res) => {
  try {
    const tenantRes = await pool.query("SELECT id FROM tenant WHERE user_id=$1", [req.userId]);
    if (!tenantRes.rows.length) return res.status(404).json({ error: "Tenant not found" });
    const tenantId = tenantRes.rows[0].id;

    const result = await pool.query(
      `SELECT pay.*, inv.invoice_number, inv.billing_period_start, inv.billing_period_end, inv.due_date
       FROM payment pay
       LEFT JOIN invoice inv ON inv.id = pay.invoice_id
       WHERE pay.tenant_id = $1
       ORDER BY pay.created_at DESC
       LIMIT 50`,
      [tenantId]
    );

    res.json({ payments: result.rows });
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

    const { invoice_id, amount_paid, payment_method, bank_reference, proof_of_payment_url, auto_approve } = req.body;

    if (!invoice_id || !amount_paid) {
      return res.status(400).json({ error: "Invoice ID and amount are required" });
    }

    // Verify invoice belongs to tenant
    const invCheck = await pool.query(
      "SELECT id, landlord_id, lease_id, amount_due FROM invoice WHERE id = $1 AND tenant_id = $2",
      [invoice_id, tenantId]
    );
    if (!invCheck.rows.length) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const invoice = invCheck.rows[0];

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Auto-approve for in-app card payments
      const status = auto_approve ? 'paid' : 'pending';
      
      const paymentResult = await client.query(
        `INSERT INTO payment (invoice_id, tenant_id, lease_id, landlord_id, amount_paid, 
          payment_method, bank_reference, proof_of_payment_url, status,
          approved_by, approved_at, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
         RETURNING *`,
        [
          invoice_id, tenantId, invoice.lease_id, invoice.landlord_id, 
          amount_paid, payment_method || 'bank_transfer', bank_reference || null, 
          proof_of_payment_url || null, status,
          auto_approve ? req.userId : null,
          auto_approve ? new Date().toISOString() : null
        ]
      );

      const payment = paymentResult.rows[0];

      if (auto_approve) {
        // Update invoice to paid
        await client.query(
          `UPDATE invoice SET 
            status = 'paid', 
            paid_amount = $1, 
            paid_date = CURRENT_DATE,
            remaining_balance = 0
           WHERE id = $2`,
          [amount_paid, invoice_id]
        );

        // Generate receipt
        const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;
        await client.query(
          `INSERT INTO receipt (payment_id, tenant_id, receipt_number, receipt_url, issued_by, issued_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [payment.id, tenantId, receiptNo, `/uploads/receipts/${receiptNo}.pdf`, req.userId]
        );

        // Update tenant payment history
        await client.query(
          `UPDATE tenant_payment_history SET 
            on_time_payments = on_time_payments + 1,
            last_calculated = NOW()
           WHERE tenant_id = $1`,
          [tenantId]
        );

        // Create notification for landlord
        const landlordUser = await pool.query(
          "SELECT user_id FROM landlord WHERE id = $1",
          [invoice.landlord_id]
        );
        if (landlordUser.rows.length) {
          await client.query(
            `INSERT INTO notification (user_id, type, title, message_, related_entity_id, related_entity_type, created_at)
             VALUES ($1, 'payment_received', 'Payment Received', $2, $3, 'payment', NOW())`,
            [landlordUser.rows[0].user_id, 
             `In-app card payment of R${amount_paid} received and auto-approved. Receipt: ${receiptNo}`,
             payment.id]
          );
        }

        // Notify tenant
        await client.query(
          `INSERT INTO notification (user_id, type, title, message_, related_entity_id, related_entity_type, created_at)
           VALUES ($1, 'payment_approved', 'Payment Approved', $2, $3, 'payment', NOW())`,
          [req.userId, 
           `Your in-app payment of R${amount_paid} has been approved. Receipt: ${receiptNo}`,
           payment.id]
        );
      } else {
        // For EFT/proof payments - create notification for landlord review
        const landlordUser = await pool.query(
          "SELECT user_id FROM landlord WHERE id = $1",
          [invoice.landlord_id]
        );
        if (landlordUser.rows.length) {
          await client.query(
            `INSERT INTO notification (user_id, type, title, message_, related_entity_id, related_entity_type, created_at)
             VALUES ($1, 'payment_received', 'Payment Needs Review', $2, $3, 'payment', NOW())`,
            [landlordUser.rows[0].user_id, 
             `Payment of R${amount_paid} submitted and requires your approval.`,
             payment.id]
          );
        }

        // Notify tenant
        await client.query(
          `INSERT INTO notification (user_id, type, title, message_, related_entity_id, related_entity_type, created_at)
           VALUES ($1, 'payment_received', 'Payment Submitted', $2, $3, 'payment', NOW())`,
          [req.userId, 
           `Your payment of R${amount_paid} has been submitted and is pending landlord approval.`,
           payment.id]
        );
      }

      await client.query("COMMIT");

      res.status(201).json({ 
        message: auto_approve ? "Payment approved" : "Payment submitted for approval", 
        payment: {
          ...payment,
          receipt_no: auto_approve ? `RCP-${Date.now().toString().slice(-6)}` : null,
        }
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

    // Get current invoice
    const currentInvoice = await pool.query(
      `SELECT * FROM invoice WHERE tenant_id = $1 AND status IN ('sent', 'overdue')
       ORDER BY due_date ASC LIMIT 1`,
      [tenantId]
    );

    // Get active lease
    const lease = await pool.query(
      `SELECT l.*, u.unit_number, p.name AS property_name
       FROM lease l
       JOIN unit u ON u.id = l.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE l.tenant_id = $1 AND l.status = 'active'
       LIMIT 1`,
      [tenantId]
    );

    // Get open maintenance requests count
    const maintenanceCount = await pool.query(
      `SELECT COUNT(*) FROM maintenance_request 
       WHERE tenant_id = $1 AND status NOT IN ('completed', 'cancelled')`,
      [tenantId]
    );

    // Get open complaints count
    const complaintCount = await pool.query(
      `SELECT COUNT(*) FROM complaint 
       WHERE filed_by_tenant_id = $1 AND status NOT IN ('resolved', 'dismissed', 'rejected')`,
      [tenantId]
    );

    // Get unread messages count
    const unreadMessages = await pool.query(
      `SELECT COUNT(*) FROM message_ 
       WHERE recipient_id = $1 AND is_read = false`,
      [req.userId]
    );

    res.json({
      current_invoice: currentInvoice.rows[0] || null,
      lease: lease.rows[0] || null,
      open_maintenance: parseInt(maintenanceCount.rows[0].count) || 0,
      open_complaints: parseInt(complaintCount.rows[0].count) || 0,
      unread_messages: parseInt(unreadMessages.rows[0].count) || 0,
    });
  } catch (err) {
    console.error("Tenant dashboard:", err);
    res.status(500).json({ error: "Server error" });
  }
});
module.exports = router;
