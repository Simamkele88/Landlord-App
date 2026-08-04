const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord } = require("../middleware/roleCheck");

async function getLandlordId(userId) {
  const result = await pool.query("SELECT id FROM landlord WHERE user_id = $1", [userId]);
  return result.rows[0]?.id || null;
}

// GET /landlord/settings
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    let result = await pool.query(
      "SELECT * FROM landlord_settings WHERE landlord_id = $1",
      [landlordId]
    );

    if (result.rows.length === 0) {
      result = await pool.query(
        `INSERT INTO landlord_settings (landlord_id) VALUES ($1) RETURNING *`,
        [landlordId]
      );
    }

    const landlord = await pool.query(
      `SELECT u.first_name, u.last_name, l.company_name
       FROM landlord l JOIN users u ON u.id = l.user_id
       WHERE l.id = $1`,
      [landlordId]
    );

    const user = await pool.query(
      "SELECT email, phone FROM users WHERE id = $1",
      [req.userId]
    );

    res.json({
      settings: result.rows[0],
      profile: landlord.rows[0],
      user: user.rows[0]
    });
  } catch (err) {
    console.error("Get settings:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /landlord/settings
router.put("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const allowedFields = [
      'notify_rent_reminders', 'notify_payment_received', 'notify_lease_expiry',
      'notify_maintenance_updates', 'notify_tenant_messages', 'notify_push',
      'notify_email_digest', 'notify_marketing',
      'default_payment_frequency', 'default_due_day', 'default_deposit_type',
      'grace_period_days', 'auto_mark_late', 'auto_send_collections',
      'payout_schedule', 'vat_registered', 'vat_number',
      'show_phone_to_tenants', 'share_data_contractors',
      'score_payment_weight', 'score_complaints_weight', 'score_lease_weight',
      'score_maintenance_weight', 'score_tenure_weight',
      'score_reliable_threshold', 'score_moderate_threshold', 'score_high_risk_threshold',
      'score_escalate_late_penalty', 'score_double_upheld_complaints',
      'score_instant_demotion_eviction', 'score_include_past_tenants'
    ];

    const updates = [];
    const values = [];
    let paramIndex = 1;

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(req.body[field]);
        paramIndex++;
      }
    }

    if (updates.length === 0 && !req.body.first_name && !req.body.last_name
        && !req.body.company_name && !req.body.email && !req.body.phone) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    if (updates.length > 0) {
      updates.push(`updated_at = NOW()`);
      values.push(landlordId);

      await pool.query(
        `UPDATE landlord_settings SET ${updates.join(", ")} WHERE landlord_id = $${paramIndex}`,
        values
      );
    }

    if (req.body.first_name || req.body.last_name || req.body.email || req.body.phone) {
      const userUpdates = [];
      const userValues = [];
      let uIndex = 1;

      if (req.body.first_name) { userUpdates.push(`first_name = $${uIndex}`); userValues.push(req.body.first_name); uIndex++; }
      if (req.body.last_name) { userUpdates.push(`last_name = $${uIndex}`); userValues.push(req.body.last_name); uIndex++; }
      if (req.body.email) { userUpdates.push(`email = $${uIndex}`); userValues.push(req.body.email); uIndex++; }
      if (req.body.phone) { userUpdates.push(`phone = $${uIndex}`); userValues.push(req.body.phone); uIndex++; }

      userUpdates.push(`updated_at = NOW()`);
      userValues.push(req.userId);

      await pool.query(
        `UPDATE users SET ${userUpdates.join(", ")} WHERE id = $${uIndex}`,
        userValues
      );
    }

    if (req.body.company_name) {
      await pool.query(
        "UPDATE landlord SET company_name = $1, updated_at = NOW() WHERE id = $2",
        [req.body.company_name, landlordId]
      );
    }

    res.json({ message: "Settings saved successfully" });
  } catch (err) {
    console.error("Save settings:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
