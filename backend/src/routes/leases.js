const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord } = require("../middleware/roleCheck");

async function getLandlordId(userId) {
  const result = await pool.query("SELECT id FROM landlord WHERE user_id = $1", [userId]);
  return result.rows[0]?.id || null;
}

// GET /leases - Get all leases for landlord
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT l.*, 
              t.first_name || ' ' || t.last_name AS tenant_name,
              u.email AS tenant_email,
              u.phone AS tenant_phone,
              un.unit_number,
              un.unit_type,
              p.name AS property_name,
              p.id AS property_id,
              COALESCE(
                (SELECT SUM(i.remaining_balance) FROM invoice i 
                 WHERE i.lease_id = l.id AND i.status IN ('sent', 'overdue')), 0
              ) AS outstanding_balance,
              COALESCE(
                (SELECT COUNT(*) FROM invoice i WHERE i.lease_id = l.id AND i.status = 'paid'), 0
              ) AS payments_made,
              (SELECT i.status FROM invoice i WHERE i.lease_id = l.id ORDER BY i.created_at DESC LIMIT 1) AS last_invoice_status
       FROM lease l
       JOIN tenant t ON t.id = l.tenant_id
       JOIN unit un ON un.id = l.unit_id
       JOIN user_ u ON u.id = t.user_id 
       JOIN property p ON p.id = un.property_id
       WHERE l.landlord_id = $1
       ORDER BY l.status ASC, l.created_at DESC`,
      [landlordId]
    );

    res.json({ leases: result.rows });
  } catch (err) {
    console.error("Get leases:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /leases/:id - Get single lease
router.get("/:id", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT l.*, 
              t.first_name || ' ' || t.last_name AS tenant_name,
              t.phone AS tenant_phone,
              t.email AS tenant_email,
              t.emergency_name, t.emergency_phone,
              u.unit_number, u.unit_type, u.floor_number, u.square_meters,
              u.bedrooms, u.bathrooms, u.furnished, u.parking_bay,
              p.name AS property_name, p.address_line1 AS property_address,
              p.city AS property_city,
              COALESCE(
                (SELECT json_agg(json_build_object(
                  'id', i.id, 'invoice_number', i.invoice_number,
                  'amount_due', i.amount_due, 'status', i.status,
                  'billing_period_start', i.billing_period_start,
                  'billing_period_end', i.billing_period_end,
                  'due_date', i.due_date, 'paid_date', i.paid_date,
                  'remaining_balance', i.remaining_balance
                ) ORDER BY i.billing_period_start DESC)
                FROM invoice i WHERE i.lease_id = l.id),
                '[]'::json
              ) AS invoices,
              COALESCE(
                (SELECT json_agg(json_build_object(
                  'id', pay.id, 'amount_paid', pay.amount_paid,
                  'payment_method', pay.payment_method, 'status', pay.status,
                  'payment_date', pay.payment_date, 'bank_reference', pay.bank_reference,
                  'proof_of_payment_url', pay.proof_of_payment_url
                ) ORDER BY pay.created_at DESC)
                FROM payment pay WHERE pay.lease_id = l.id),
                '[]'::json
              ) AS payments
       FROM lease l
       JOIN tenant t ON t.id = l.tenant_id
       JOIN unit u ON u.id = l.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE l.id = $1 AND l.landlord_id = $2`,
      [req.params.id, landlordId]
    );

    if (!result.rows.length) return res.status(404).json({ error: "Lease not found" });

    res.json({ lease: result.rows[0] });
  } catch (err) {
    console.error("Get lease:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /leases - Create a new lease
router.post("/", requireAuth, requireLandlord, async (req, res) => {
  const {
    tenant_id, unit_id, lease_start_date, lease_end_date,
    rent_amount, deposit_amount, payment_frequency, payment_due_day,
    late_fee_amount, late_fee_after_days, grace_period_days,
    auto_renew, renewal_notice_days,
    water_included, electricity_included, internet_included,
  } = req.body;

  if (!tenant_id || !unit_id || !lease_start_date || !lease_end_date || !rent_amount) {
    return res.status(400).json({ error: "Tenant, unit, dates, and rent are required" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Landlord not found" }); }

    // Check if unit is available
    const unitCheck = await client.query("SELECT id, status FROM unit WHERE id = $1", [unit_id]);
    if (!unitCheck.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Unit not found" }); }
    if (unitCheck.rows[0].status !== "vacant") { await client.query("ROLLBACK"); return res.status(409).json({ error: "Unit is not vacant" }); }

    // Check tenant doesn't already have active lease
    const tenantCheck = await client.query(
      "SELECT id FROM lease WHERE tenant_id = $1 AND status = 'active'",
      [tenant_id]
    );
    if (tenantCheck.rows.length) { await client.query("ROLLBACK"); return res.status(409).json({ error: "Tenant already has an active lease" }); }

    const result = await client.query(
      `INSERT INTO lease (
        tenant_id, unit_id, landlord_id, lease_start_date, lease_end_date,
        rent_amount, deposit_amount, payment_frequency, payment_due_day,
        late_fee_amount, late_fee_after_days, grace_period_days,
        auto_renew, renewal_notice_days,
        water_included, electricity_included, internet_included,
        status, created_by, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,'active',$18,NOW(),NOW())
      RETURNING *`,
      [
        tenant_id, unit_id, landlordId,
        lease_start_date, lease_end_date,
        rent_amount, deposit_amount || rent_amount,
        payment_frequency || 'monthly', payment_due_day || 1,
        late_fee_amount || 50, late_fee_after_days || 3, grace_period_days || 3,
        auto_renew || false, renewal_notice_days || 60,
        water_included || false, electricity_included || false, internet_included || false,
        req.userId
      ]
    );

    // Update unit status
    await client.query(
      "UPDATE unit SET status = 'occupied', current_tenant_id = $1, updated_at = NOW() WHERE id = $2",
      [tenant_id, unit_id]
    );

    await client.query("COMMIT");

    const lease = await pool.query(
      `SELECT l.*, t.first_name || ' ' || t.last_name AS tenant_name,
              u.unit_number, p.name AS property_name
       FROM lease l
       JOIN tenant t ON t.id = l.tenant_id
       JOIN unit u ON u.id = l.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE l.id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({ message: "Lease created", lease: lease.rows[0] });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Create lease:", err);
    res.status(500).json({ error: "Server error" });
  } finally {
    client.release();
  }
});

// PUT /leases/:id - Update lease
router.put("/:id", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;
    const allowedFields = [
      'lease_start_date', 'lease_end_date', 'rent_amount', 'deposit_amount',
      'payment_frequency', 'payment_due_day', 'late_fee_amount', 'late_fee_after_days',
      'grace_period_days', 'auto_renew', 'renewal_notice_days',
      'water_included', 'electricity_included', 'internet_included', 'status'
    ];

    const updates = [], values = [];
    let idx = 1;
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${idx}`);
        values.push(req.body[field]);
        idx++;
      }
    }

    if (!updates.length) return res.status(400).json({ error: "No fields to update" });

    updates.push("updated_at = NOW()");
    values.push(id);

    await pool.query(
      `UPDATE lease SET ${updates.join(", ")} WHERE id = $${idx} AND landlord_id = $${idx + 1}`,
      [...values, landlordId]
    );

    const result = await pool.query(
      `SELECT l.*, t.first_name || ' ' || t.last_name AS tenant_name,
              u.unit_number, p.name AS property_name
       FROM lease l
       JOIN tenant t ON t.id = l.tenant_id
       JOIN unit u ON u.id = l.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE l.id = $1`,
      [id]
    );

    if (!result.rows.length) return res.status(404).json({ error: "Lease not found" });

    res.json({ message: "Lease updated", lease: result.rows[0] });
  } catch (err) {
    console.error("Update lease:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /leases/:id/terminate - Terminate a lease
router.put("/:id/terminate", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;
    const { termination_reason, termination_date, termination_notes, vacate_date } = req.body;

    if (!termination_reason || !termination_date) {
      return res.status(400).json({ error: "Termination reason and date are required" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const leaseCheck = await client.query(
        "SELECT * FROM lease WHERE id = $1 AND landlord_id = $2",
        [id, landlordId]
      );
      if (!leaseCheck.rows.length) { await client.query("ROLLBACK"); return res.status(404).json({ error: "Lease not found" }); }

      const lease = leaseCheck.rows[0];

      await client.query(
        `UPDATE lease SET status = 'terminated', termination_reason = $1, 
         termination_date = $2, termination_notes = $3, vacate_date = $4, updated_at = NOW()
         WHERE id = $5`,
        [termination_reason, termination_date, termination_notes || null, vacate_date || null, id]
      );

      // Free up the unit
      await client.query(
        "UPDATE unit SET status = 'vacant', current_tenant_id = NULL, updated_at = NOW() WHERE id = $1",
        [lease.unit_id]
      );

      await client.query("COMMIT");

      res.json({ message: "Lease terminated successfully" });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Terminate lease:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /leases/:id/renew - Renew a lease
router.put("/:id/renew", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;
    const { new_end_date, new_rent_amount } = req.body;

    if (!new_end_date) {
      return res.status(400).json({ error: "New end date is required" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO lease_history (lease_id, tenant_id, unit_id, action, reason, performed_by, created_at)
         SELECT id, tenant_id, unit_id, 'renewed', 'Lease renewed', $1, NOW()
         FROM lease WHERE id = $2 AND landlord_id = $3`,
        [req.userId, id, landlordId]
      );

      await client.query(
        `UPDATE lease SET lease_end_date = $1, rent_amount = $2, status = 'active', 
         updated_at = NOW() WHERE id = $3 AND landlord_id = $4`,
        [new_end_date, new_rent_amount || null, id, landlordId]
      );

      await client.query("COMMIT");

      res.json({ message: "Lease renewed successfully" });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Renew lease:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /leases/expiring - Get leases expiring soon
router.get("/expiring", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const days = req.query.days || 30;

    const result = await pool.query(
      `SELECT l.*, 
              t.first_name || ' ' || t.last_name AS tenant_name,
              u.unit_number, p.name AS property_name,
              (l.lease_end_date - CURRENT_DATE) AS days_remaining
       FROM lease l
       JOIN tenant t ON t.id = l.tenant_id
       JOIN unit u ON u.id = l.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE l.landlord_id = $1 AND l.status = 'active'
         AND l.lease_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $2
       ORDER BY l.lease_end_date ASC`,
      [landlordId, days]
    );

    res.json({ expiring: result.rows, count: result.rows.length });
  } catch (err) {
    console.error("Get expiring leases:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;