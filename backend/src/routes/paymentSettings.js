// src/routes/paymentSettings.js
const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord } = require("../middleware/roleCheck");
const { auditLog } = require("../utils/audit");

// ── HELPER: Get landlord ID ───────────────────────────────────
async function getLandlordId(userId) {
  const result = await pool.query(
    "SELECT id FROM landlord WHERE user_id = $1",
    [userId]
  );
  return result.rows[0]?.id || null;
}

// ── GET /landlord/payment-settings ────────────────────────────
// Get all payment settings for the landlord
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) {
      return res.status(404).json({ error: "Landlord record not found" });
    }

    const result = await pool.query(
      `SELECT setting_value FROM system_setting 
       WHERE setting_key = $1`,
      [`payment_settings_${landlordId}`]
    );

    if (result.rows.length === 0) {
      // Return default settings
      return res.json({
        settings: {
          // Grace period & late fees
          grace_period_days: 5,
          late_fee_type: "percentage",
          late_fee_value: 10,
          late_fee_cap: 500,
          apply_late_fee_after_days: 5,

          // Auto-reminders
          reminder_before_due: true,
          reminder_before_due_days: 3,
          reminder_on_due_day: true,
          reminder_after_due: true,
          reminder_after_due_days: 1,
          reminder_frequency: "every_3_days",
          max_reminders: 5,

          // Collections
          auto_collections: false,
          collections_after_days: 60,
          collections_note: "Tenant account has been escalated to collections due to non-payment exceeding 60 days.",

          // Payment methods
          accept_eft: true,
          accept_cash: false,
          accept_card: false,
          accept_debit_order: true,

          // Proof of payment
          require_proof: true,
          auto_approve_exact: false,

          // Receipt
          auto_send_receipt: true,
          receipt_prefix: "RCP-CHW",
        }
      });
    }

    res.json({ settings: result.rows[0].setting_value });
  } catch (err) {
    console.error("Get payment settings:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── PUT /landlord/payment-settings ────────────────────────────
// Save/update all payment settings
router.put("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) {
      return res.status(404).json({ error: "Landlord record not found" });
    }

    const {
      // Grace period & late fees
      grace_period_days,
      late_fee_type,
      late_fee_value,
      late_fee_cap,
      apply_late_fee_after_days,

      // Auto-reminders
      reminder_before_due,
      reminder_before_due_days,
      reminder_on_due_day,
      reminder_after_due,
      reminder_after_due_days,
      reminder_frequency,
      max_reminders,

      // Collections
      auto_collections,
      collections_after_days,
      collections_note,

      // Payment methods
      accept_eft,
      accept_cash,
      accept_card,
      accept_debit_order,

      // Proof of payment
      require_proof,
      auto_approve_exact,

      // Receipt
      auto_send_receipt,
      receipt_prefix,
    } = req.body;

    // Validate required fields
    if (grace_period_days === undefined || late_fee_type === undefined) {
      return res.status(400).json({ error: "Grace period and late fee type are required" });
    }

    // Validate late fee type
    if (!["none", "percentage", "fixed"].includes(late_fee_type)) {
      return res.status(400).json({ error: "Invalid late fee type" });
    }

    // Validate reminder frequency
    if (reminder_frequency && !["daily", "every_2_days", "every_3_days", "weekly"].includes(reminder_frequency)) {
      return res.status(400).json({ error: "Invalid reminder frequency" });
    }

    const settings = {
      grace_period_days: parseInt(grace_period_days) || 5,
      late_fee_type,
      late_fee_value: parseFloat(late_fee_value) || 0,
      late_fee_cap: parseFloat(late_fee_cap) || 0,
      apply_late_fee_after_days: parseInt(apply_late_fee_after_days) || 5,

      reminder_before_due: reminder_before_due ?? true,
      reminder_before_due_days: parseInt(reminder_before_due_days) || 3,
      reminder_on_due_day: reminder_on_due_day ?? true,
      reminder_after_due: reminder_after_due ?? true,
      reminder_after_due_days: parseInt(reminder_after_due_days) || 1,
      reminder_frequency: reminder_frequency || "every_3_days",
      max_reminders: parseInt(max_reminders) || 5,

      auto_collections: auto_collections ?? false,
      collections_after_days: parseInt(collections_after_days) || 60,
      collections_note: collections_note || "",

      accept_eft: accept_eft ?? true,
      accept_cash: accept_cash ?? false,
      accept_card: accept_card ?? false,
      accept_debit_order: accept_debit_order ?? true,

      require_proof: require_proof ?? true,
      auto_approve_exact: auto_approve_exact ?? false,

      auto_send_receipt: auto_send_receipt ?? true,
      receipt_prefix: receipt_prefix || "RCP-CHW",
    };

    const settingKey = `payment_settings_${landlordId}`;

    // Upsert the settings
    await pool.query(
      `INSERT INTO system_setting (setting_key, setting_value, description, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (setting_key) 
       DO UPDATE SET setting_value = $2, updated_by = $4, updated_at = NOW()`,
      [settingKey, JSON.stringify(settings), "Payment configuration settings", req.userId]
    );

    // Audit log
    await auditLog(
      req.userId,
      "UPDATE",
      "payment_settings",
      landlordId,
      null,
      { settings },
      req
    );

    res.json({ 
      message: "Payment settings saved successfully",
      settings 
    });
  } catch (err) {
    console.error("Save payment settings:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── PATCH /landlord/payment-settings ──────────────────────────
// Update individual payment settings
router.patch("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) {
      return res.status(404).json({ error: "Landlord record not found" });
    }

    const settingKey = `payment_settings_${landlordId}`;

    // Get current settings
    const current = await pool.query(
      "SELECT setting_value FROM system_setting WHERE setting_key = $1",
      [settingKey]
    );

    let settings = current.rows.length > 0 
      ? current.rows[0].setting_value 
      : {
          grace_period_days: 5,
          late_fee_type: "percentage",
          late_fee_value: 10,
          late_fee_cap: 500,
          apply_late_fee_after_days: 5,
          reminder_before_due: true,
          reminder_before_due_days: 3,
          reminder_on_due_day: true,
          reminder_after_due: true,
          reminder_after_due_days: 1,
          reminder_frequency: "every_3_days",
          max_reminders: 5,
          auto_collections: false,
          collections_after_days: 60,
          collections_note: "",
          accept_eft: true,
          accept_cash: false,
          accept_card: false,
          accept_debit_order: true,
          require_proof: true,
          auto_approve_exact: false,
          auto_send_receipt: true,
          receipt_prefix: "RCP-CHW",
        };

    // Merge new values
    settings = { ...settings, ...req.body };

    // Save
    await pool.query(
      `INSERT INTO system_setting (setting_key, setting_value, description, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (setting_key) 
       DO UPDATE SET setting_value = $2, updated_by = $4, updated_at = NOW()`,
      [settingKey, JSON.stringify(settings), "Payment configuration settings", req.userId]
    );

    res.json({ 
      message: "Payment settings updated successfully",
      settings 
    });
  } catch (err) {
    console.error("Update payment settings:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ── GET /landlord/payment-settings/late-fee-preview ───────────
// Preview late fee calculation for a given rent amount
router.get("/late-fee-preview", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) {
      return res.status(404).json({ error: "Landlord record not found" });
    }

    const { rent_amount } = req.query;
    if (!rent_amount || isNaN(Number(rent_amount))) {
      return res.status(400).json({ error: "Valid rent_amount query parameter is required" });
    }

    const rent = Number(rent_amount);
    const settingKey = `payment_settings_${landlordId}`;
    const result = await pool.query(
      "SELECT setting_value FROM system_setting WHERE setting_key = $1",
      [settingKey]
    );

    const settings = result.rows.length > 0 ? result.rows[0].setting_value : {
      late_fee_type: "percentage",
      late_fee_value: 10,
      late_fee_cap: 500,
      apply_late_fee_after_days: 5,
    };

    let lateFee = 0;
    if (settings.late_fee_type === "percentage") {
      lateFee = Math.round(rent * (settings.late_fee_value / 100));
      if (settings.late_fee_cap > 0) {
        lateFee = Math.min(lateFee, settings.late_fee_cap);
      }
    } else if (settings.late_fee_type === "fixed") {
      lateFee = settings.late_fee_value || 0;
    }

    res.json({
      rent_amount: rent,
      late_fee_type: settings.late_fee_type,
      late_fee_value: settings.late_fee_value,
      late_fee_cap: settings.late_fee_cap,
      calculated_late_fee: lateFee,
      total_due: rent + lateFee,
      applied_after_days: settings.apply_late_fee_after_days,
    });
  } catch (err) {
    console.error("Late fee preview:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;