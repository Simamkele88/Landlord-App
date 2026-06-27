const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");

// GET /notifications - Get all notifications for current user
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT n.*, 
        CASE 
          WHEN n.type = 'payment_due' THEN 'late_payment'
          WHEN n.type = 'payment_received' THEN 'payment'
          WHEN n.type = 'payment_approved' THEN 'payment'
          WHEN n.type = 'payment_rejected' THEN 'payment'
          WHEN n.type = 'lease_expiring' THEN 'lease_expiry'
          WHEN n.type = 'lease_expired' THEN 'lease_expiry'
          WHEN n.type = 'maintenance_update' THEN 'maintenance'
          WHEN n.type = 'complaint_update' THEN 'complaint'
          WHEN n.type = 'message_received' THEN 'message'
          ELSE 'system'
        END AS display_type
       FROM notification n
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.userId]
    );

    res.json({ notifications: result.rows });
  } catch (err) {
    console.error("Get notifications:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /notifications/:id/read - Mark notification as read
router.put("/:id/read", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "UPDATE notification SET is_read = true, read_at = NOW() WHERE id = $1 AND user_id = $2",
      [id, req.userId]
    );

    res.json({ message: "Marked as read" });
  } catch (err) {
    console.error("Mark notification read:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /notifications/read-all - Mark all as read
router.put("/read-all", requireAuth, async (req, res) => {
  try {
    await pool.query(
      "UPDATE notification SET is_read = true, read_at = NOW() WHERE user_id = $1 AND is_read = false",
      [req.userId]
    );

    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    console.error("Mark all read:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;