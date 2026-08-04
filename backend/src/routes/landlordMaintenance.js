const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord } = require("../middleware/roleCheck");
const { createNotification } = require("../utils/notifications");

async function getLandlord(userId) {
  const result = await pool.query("SELECT id FROM landlord WHERE user_id = $1", [userId]);
  return result.rows[0] || null;
}

router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlord = await getLandlord(req.userId);
    if (!landlord) return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT mr.*, usr.full_name AS tenant_name, u.unit_number, p.name AS property_name,
              (SELECT json_agg(mu ORDER BY mu.created_at ASC) FROM maintenance_update mu WHERE mu.request_id = mr.id) AS updates,
              COALESCE((SELECT json_agg(json_build_object('id', mp.id, 'photo_type', mp.photo_type, 'document_url', d.document_url, 'uploaded_at', mp.uploaded_at) ORDER BY mp.uploaded_at)
               FROM maintenance_photo mp JOIN document d ON d.id = mp.document_id WHERE mp.request_id = mr.id), '[]'::json) AS photos
       FROM maintenance_request mr
       JOIN tenant t ON t.id = mr.tenant_id
       JOIN users usr ON usr.id = t.user_id
       JOIN unit u ON u.id = mr.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE mr.landlord_id = $1
       ORDER BY mr.status = 'pending_approval' DESC, mr.created_at DESC`,
      [landlord.id]
    );

    const stats = {
      total: result.rows.length,
      pending_approval: result.rows.filter(r => r.status === 'pending_approval').length,
      in_progress: result.rows.filter(r => ['needs_repair', 'assigned', 'in_progress'].includes(r.status)).length,
      completed: result.rows.filter(r => ['completed', 'closed'].includes(r.status)).length,
    };

    res.json({ requests: result.rows, stats });
  } catch (err) {
    console.error("Get landlord maintenance:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", requireAuth, requireLandlord, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT mr.*, usr.full_name AS tenant_name, u.unit_number, p.name AS property_name, p.address_line1 AS property_address,
              (SELECT json_agg(mu ORDER BY mu.created_at ASC) FROM maintenance_update mu WHERE mu.request_id = mr.id) AS updates,
              COALESCE((SELECT json_agg(json_build_object('id', mp.id, 'photo_type', mp.photo_type, 'document_url', d.document_url, 'uploaded_at', mp.uploaded_at) ORDER BY mp.uploaded_at)
               FROM maintenance_photo mp JOIN document d ON d.id = mp.document_id WHERE mp.request_id = mr.id), '[]'::json) AS photos
       FROM maintenance_request mr
       JOIN tenant t ON t.id = mr.tenant_id
       JOIN users usr ON usr.id = t.user_id
       JOIN unit u ON u.id = mr.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE mr.id = $1`,
      [id]
    );

    if (!result.rows.length) return res.status(404).json({ error: "Request not found" });

    res.json({ request: result.rows[0] });
  } catch (err) {
    console.error("Get maintenance detail:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id/approve", requireAuth, requireLandlord, async (req, res) => {
  try {
    const { id } = req.params;

    const requestCheck = await pool.query(
      "SELECT * FROM maintenance_request WHERE id = $1 AND status = 'pending_approval'",
      [id]
    );
    if (!requestCheck.rows.length) {
      return res.status(404).json({ error: "Request not found or not pending approval" });
    }

    const currentRequest = requestCheck.rows[0];

    const result = await pool.query(
      `UPDATE maintenance_request SET status = 'assigned', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    await pool.query(
      `INSERT INTO maintenance_update (request_id, updated_by, status_from, status_to, notes)
       VALUES ($1, $2, 'pending_approval', 'assigned', 'Landlord approved — caretaker may proceed')`,
      [id, req.userId]
    );

    const caretaker = await pool.query(
      `SELECT u.id FROM users u JOIN caretaker c ON c.user_id = u.id JOIN property p ON p.id = c.assigned_property JOIN unit u2 ON u2.property_id = p.id JOIN maintenance_request mr ON mr.unit_id = u2.id WHERE mr.id = $1`,
      [id]
    );
    if (caretaker.rows.length) {
      await createNotification(caretaker.rows[0].id, "maintenance_update", "Request Approved",
        `Landlord approved "${currentRequest.title}". You may now proceed with the work.`, id, "maintenance");
    }

    await createNotification(currentRequest.reported_by, "maintenance_update", "Request Approved",
      `Your request "${currentRequest.title}" has been approved by the landlord.`, id, "maintenance");

    res.json({ message: "Request approved", request: result.rows[0] });
  } catch (err) {
    console.error("Approve request:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT 
router.put("/:id/reject", requireAuth, requireLandlord, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) return res.status(400).json({ error: "Rejection reason is required" });

    const requestCheck = await pool.query(
      "SELECT * FROM maintenance_request WHERE id = $1 AND status = 'pending_approval'",
      [id]
    );
    if (!requestCheck.rows.length) {
      return res.status(404).json({ error: "Request not found or not pending approval" });
    }

    const currentRequest = requestCheck.rows[0];

    const result = await pool.query(
      `UPDATE maintenance_request SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id]
    );

    await pool.query(
      `INSERT INTO maintenance_update (request_id, updated_by, status_from, status_to, notes)
       VALUES ($1, $2, 'pending_approval', 'cancelled', $3)`,
      [id, req.userId, `Landlord rejected: ${reason}`]
    );

    const caretaker = await pool.query(
      `SELECT u.id FROM users u JOIN caretaker c ON c.user_id = u.id JOIN property p ON p.id = c.assigned_property JOIN unit u2 ON u2.property_id = p.id JOIN maintenance_request mr ON mr.unit_id = u2.id WHERE mr.id = $1`,
      [id]
    );
    if (caretaker.rows.length) {
      await createNotification(caretaker.rows[0].id, "maintenance_update", "Request Rejected",
        `Landlord rejected "${currentRequest.title}". Reason: ${reason}`, id, "maintenance");
    }

    await createNotification(currentRequest.reported_by, "maintenance_update", "Request Cancelled",
      `Your request "${currentRequest.title}" was not approved. Reason: ${reason}`, id, "maintenance");

    res.json({ message: "Request rejected", request: result.rows[0] });
  } catch (err) {
    console.error("Reject request:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;