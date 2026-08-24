const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord } = require("../middleware/roleCheck");
const { createNotification } = require("../utils/notifications");

async function getLandlord(userId) {
  const result = await pool.query(
    "SELECT id FROM landlord WHERE user_id = $1",
    [userId],
  );
  return result.rows[0]?.id || null;  
}

// GET /landlord/maintenance
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlord(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const [
      requestsRes,
      statsRes,
      byPropertyRes,
      highRiskRes,
      unassignedUrgentRes,
      overdueScheduledRes,
      awaitingConfirmationRes,
    ] = await Promise.all([
      pool.query(
        `SELECT
           mr.id,
           mr.request_number,
           mr.title,
           mr.category::text AS category,
           mr.priority::text AS priority,
           mr.status::text AS status,
           usr.full_name AS tenant_name,
           u.unit_number,
           p.name AS property_name,
           l.id AS lease_id,
           mr.estimated_cost,
           mr.actual_cost,
           mr.created_at,
           mr.tenant_confirmed
         FROM maintenance_request mr
         JOIN tenant t ON t.id = mr.tenant_id
         JOIN users usr ON usr.id = t.user_id
         JOIN unit u ON u.id = mr.unit_id
         JOIN property p ON p.id = u.property_id
         LEFT JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
         WHERE mr.landlord_id = $1
         ORDER BY mr.created_at DESC`,
        [landlordId],
      ),

      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE status IN ('needs_repair','assigned','in_progress','pending_approval')) AS total_open,
           COUNT(*) FILTER (WHERE status = 'pending_approval') AS pending_approval,
           COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
           COUNT(*) FILTER (WHERE status = 'completed') AS completed_total,
           COUNT(*) FILTER (WHERE priority IN ('urgent','emergency')
             AND status IN ('needs_repair','assigned','in_progress','pending_approval')) AS urgent_open,
           COUNT(*) FILTER (WHERE status = 'completed'
             AND completed_at >= date_trunc('month', CURRENT_DATE)) AS completed_this_month,
           COALESCE(SUM(COALESCE(actual_cost, estimated_cost, 0))
             FILTER (WHERE completed_at >= date_trunc('month', CURRENT_DATE)), 0) AS cost_this_month,
           ROUND(AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/86400)
             FILTER (WHERE status IN ('completed','closed')), 1) AS avg_completion_days
         FROM maintenance_request
         WHERE landlord_id = $1`,
        [landlordId],
      ),

      pool.query(
        `SELECT
           p.name AS property_name,
           COUNT(*) FILTER (WHERE mr.status IN ('needs_repair','assigned','in_progress','pending_approval')) AS open,
           COUNT(*) FILTER (WHERE mr.status = 'in_progress') AS in_progress,
           COUNT(*) FILTER (WHERE mr.status = 'completed') AS completed,
           COUNT(*) FILTER (WHERE mr.priority IN ('urgent','emergency')
             AND mr.status IN ('needs_repair','assigned','in_progress','pending_approval')) AS urgent_open
         FROM maintenance_request mr
         JOIN unit u ON u.id = mr.unit_id
         JOIN property p ON p.id = u.property_id
         WHERE mr.landlord_id = $1
         GROUP BY p.id, p.name
         ORDER BY p.name`,
        [landlordId],
      ),

      pool.query(
        `SELECT
           mr.id,
           mr.request_number,
           mr.title,
           mr.priority::text AS priority,
           mr.status::text AS status,
           usr.full_name AS tenant_name,
           u.unit_number,
           p.name AS property_name,
           t.reliability_score_value AS score_value
         FROM maintenance_request mr
         JOIN tenant t ON t.id = mr.tenant_id
         JOIN users usr ON usr.id = t.user_id
         JOIN unit u ON u.id = mr.unit_id
         JOIN property p ON p.id = u.property_id
         WHERE mr.landlord_id = $1
           AND mr.status IN ('needs_repair','assigned','in_progress','pending_approval')
           AND t.reliability_score = 'high_risk'
         ORDER BY mr.priority = 'emergency' DESC, mr.created_at ASC
         LIMIT 5`,
        [landlordId],
      ),

      pool.query(
        `SELECT
           mr.id,
           mr.request_number,
           mr.title,
           mr.priority::text AS priority,
           usr.full_name AS tenant_name,
           u.unit_number,
           p.name AS property_name
         FROM maintenance_request mr
         JOIN tenant t ON t.id = mr.tenant_id
         JOIN users usr ON usr.id = t.user_id
         JOIN unit u ON u.id = mr.unit_id
         JOIN property p ON p.id = u.property_id
         WHERE mr.landlord_id = $1
           AND mr.priority IN ('urgent','emergency')
           AND mr.status IN ('needs_repair','pending_approval')
           AND mr.assigned_to IS NULL
         ORDER BY mr.created_at ASC
         LIMIT 5`,
        [landlordId],
      ),

      pool.query(
        `SELECT
           mr.id,
           mr.request_number,
           mr.title,
           mr.priority::text AS priority,
           mr.status::text AS status,
           mr.scheduled_date,
           usr.full_name AS tenant_name,
           u.unit_number,
           p.name AS property_name
         FROM maintenance_request mr
         JOIN tenant t ON t.id = mr.tenant_id
         JOIN users usr ON usr.id = t.user_id
         JOIN unit u ON u.id = mr.unit_id
         JOIN property p ON p.id = u.property_id
         WHERE mr.landlord_id = $1
           AND mr.scheduled_date < CURRENT_DATE
           AND mr.status NOT IN ('completed','closed','cancelled')
         ORDER BY mr.scheduled_date ASC
         LIMIT 5`,
        [landlordId],
      ),

      pool.query(
        `SELECT
           mr.id,
           mr.request_number,
           mr.title,
           mr.priority::text AS priority,
           mr.status::text AS status,
           mr.completed_at,
           usr.full_name AS tenant_name,
           u.unit_number,
           p.name AS property_name
         FROM maintenance_request mr
         JOIN tenant t ON t.id = mr.tenant_id
         JOIN users usr ON usr.id = t.user_id
         JOIN unit u ON u.id = mr.unit_id
         JOIN property p ON p.id = u.property_id
         WHERE mr.landlord_id = $1
           AND mr.status = 'completed'
           AND mr.tenant_confirmed = false
         ORDER BY mr.completed_at DESC
         LIMIT 5`,
        [landlordId],
      ),
    ]);

    const s = statsRes.rows[0] || {};

    res.json({
      requests: requestsRes.rows,
      stats: {
        total: Number(s.total_open || 0),
        pending_approval: Number(s.pending_approval || 0),
        in_progress: Number(s.in_progress || 0),
        completed: Number(s.completed_total || 0),
        urgent_open: Number(s.urgent_open || 0),
        completed_this_month: Number(s.completed_this_month || 0),
        cost_this_month: Number(s.cost_this_month || 0),
        avg_completion_days:
          s.avg_completion_days === null ? null : Number(s.avg_completion_days),
        by_property: byPropertyRes.rows,
        high_risk_requests: highRiskRes.rows,
        unassigned_urgent: unassignedUrgentRes.rows,
        overdue_scheduled: overdueScheduledRes.rows,
        awaiting_confirmation: awaitingConfirmationRes.rows,
      },
    });
  } catch (err) {
    console.error("Landlord maintenance:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /landlord/maintenance/:id  - Get a single maintenance request
router.get("/:id", requireAuth, requireLandlord, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT mr.*, 
              usr.full_name AS tenant_name, 
              u.unit_number, 
              p.name AS property_name, 
              p.address_line1 AS property_address,
              l.id AS lease_id,   
              (SELECT json_agg(mu ORDER BY mu.created_at ASC) FROM maintenance_update mu WHERE mu.request_id = mr.id) AS updates,
              COALESCE((SELECT json_agg(json_build_object('id', mp.id, 'photo_type', mp.photo_type, 'document_url', d.document_url, 'uploaded_at', mp.uploaded_at) ORDER BY mp.uploaded_at)
               FROM maintenance_photo mp JOIN document d ON d.id = mp.document_id WHERE mp.request_id = mr.id), '[]'::json) AS photos
       FROM maintenance_request mr
       JOIN tenant t ON t.id = mr.tenant_id
       JOIN users usr ON usr.id = t.user_id
       JOIN unit u ON u.id = mr.unit_id
       JOIN property p ON p.id = u.property_id
       LEFT JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
       WHERE mr.id = $1`,
      [id],
    );

    if (!result.rows.length)
      return res.status(404).json({ error: "Request not found" });

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
      [id],
    );
    if (!requestCheck.rows.length) {
      return res
        .status(404)
        .json({ error: "Request not found or not pending approval" });
    }
    const currentRequest = requestCheck.rows[0];

    const assigneeRes = await pool.query(
      `SELECT c.id FROM caretaker c
       JOIN property p ON p.id = c.assigned_property
       JOIN unit u ON u.property_id = p.id
       WHERE u.id = (SELECT unit_id FROM maintenance_request WHERE id = $1)
       LIMIT 1`,
      [id],
    );
    const assignedTo = assigneeRes.rows[0]?.id || null;

    const result = await pool.query(
      `UPDATE maintenance_request 
       SET status = 'assigned', 
           assigned_to = $2, 
           assigned_at = NOW(), 
           updated_at = NOW() 
       WHERE id = $1 
       RETURNING *`,
      [id, assignedTo],
    );

    await pool.query(
      `INSERT INTO maintenance_update (request_id, updated_by, status_from, status_to, notes)
       VALUES ($1, $2, 'pending_approval', 'assigned', 'Landlord approved — assigned to caretaker')`,
      [id, req.userId],
    );

    if (assignedTo) {
      const caretakerUserRes = await pool.query(
        "SELECT user_id FROM caretaker WHERE id = $1",
        [assignedTo],
      );
      if (caretakerUserRes.rows.length) {
        await createNotification(
          caretakerUserRes.rows[0].user_id,
          "maintenance_update",
          "Request Approved",
          `Landlord approved "${currentRequest.title}". You may now proceed with the work.`,
          id,
          "maintenance",
        );
      }
    }

    await createNotification(
      currentRequest.reported_by,
      "maintenance_update",
      "Request Approved",
      `Your request "${currentRequest.title}" has been approved by the landlord.`,
      id,
      "maintenance",
    );

    res.json({ message: "Request approved", request: result.rows[0] });
  } catch (err) {
    console.error("Approve request:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id/reject", requireAuth, requireLandlord, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason)
      return res.status(400).json({ error: "Rejection reason is required" });

    const requestCheck = await pool.query(
      "SELECT * FROM maintenance_request WHERE id = $1 AND status = 'pending_approval'",
      [id],
    );
    if (!requestCheck.rows.length) {
      return res
        .status(404)
        .json({ error: "Request not found or not pending approval" });
    }

    const currentRequest = requestCheck.rows[0];

    const result = await pool.query(
      `UPDATE maintenance_request SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *`,
      [id],
    );

    await pool.query(
      `INSERT INTO maintenance_update (request_id, updated_by, status_from, status_to, notes)
       VALUES ($1, $2, 'pending_approval', 'cancelled', $3)`,
      [id, req.userId, `Landlord rejected: ${reason}`],
    );

    const caretaker = await pool.query(
      `SELECT u.id FROM users u JOIN caretaker c ON c.user_id = u.id JOIN property p ON p.id = c.assigned_property JOIN unit u2 ON u2.property_id = p.id JOIN maintenance_request mr ON mr.unit_id = u2.id WHERE mr.id = $1`,
      [id],
    );
    if (caretaker.rows.length) {
      await createNotification(
        caretaker.rows[0].id,
        "maintenance_update",
        "Request Rejected",
        `Landlord rejected "${currentRequest.title}". Reason: ${reason}`,
        id,
        "maintenance",
      );
    }

    await createNotification(
      currentRequest.reported_by,
      "maintenance_update",
      "Request Cancelled",
      `Your request "${currentRequest.title}" was not approved. Reason: ${reason}`,
      id,
      "maintenance",
    );

    res.json({ message: "Request rejected", request: result.rows[0] });
  } catch (err) {
    console.error("Reject request:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;