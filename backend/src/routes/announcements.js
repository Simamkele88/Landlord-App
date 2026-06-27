const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord } = require("../middleware/roleCheck");

// POST /announcements - Send broadcast announcement
router.post("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const { subject, message, property_id, recipient_type } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // Get recipients based on type
    let recipients = [];
    const landlordRes = await pool.query("SELECT id FROM landlord WHERE user_id = $1", [req.userId]);
    const landlordId = landlordRes.rows[0]?.id;

    if (recipient_type === 'all_tenants' || !recipient_type) {
      const tenants = await pool.query(
        "SELECT u.id FROM user_ u JOIN tenant t ON t.user_id = u.id WHERE t.landlord_id = $1",
        [landlordId]
      );
      recipients = tenants.rows.map(r => r.id);
    } else if (recipient_type === 'property' && property_id) {
      const tenants = await pool.query(
        `SELECT u.id FROM user_ u 
         JOIN tenant t ON t.user_id = u.id 
         JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
         JOIN unit un ON un.id = l.unit_id
         WHERE un.property_id = $1`,
        [property_id]
      );
      recipients = tenants.rows.map(r => r.id);
    } else if (recipient_type === 'caretakers') {
      const caretakers = await pool.query(
        "SELECT u.id FROM user_ u JOIN caretaker c ON c.user_id = u.id WHERE c.landlord_id = $1",
        [landlordId]
      );
      recipients = caretakers.rows.map(r => r.id);
    }

    // Insert messages for each recipient
    for (const recipientId of recipients) {
      await pool.query(
        `INSERT INTO message_ (sender_id, recipient_id, property_id, subject, body, message_type, priority, created_at)
         VALUES ($1, $2, $3, $4, $5, 'broadcast', 'normal', NOW())`,
        [req.userId, recipientId, property_id || null, subject || 'Announcement', message]
      );
    }

    res.status(201).json({ 
      message: "Announcement sent", 
      recipients_count: recipients.length 
    });
  } catch (err) {
    console.error("Send announcement:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;