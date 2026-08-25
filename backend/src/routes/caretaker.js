const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireCaretaker } = require("../middleware/roleCheck");
const { createNotification } = require("../utils/notifications");

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// GET /caretaker/dashboard
router.get("/dashboard", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const caretakerRes = await pool.query(
      `SELECT c.id,
              c.assigned_property,
              u.full_name AS caretaker_name
       FROM caretaker c
       JOIN users u ON u.id = c.user_id
       WHERE c.user_id = $1
         AND c.is_active = true`,
      [req.userId],
    );

    if (!caretakerRes.rows.length) {
      return res.status(404).json({ error: "Caretaker not found" });
    }

    const caretaker = caretakerRes.rows[0];
    let propertyId = caretaker.assigned_property;

    if (!propertyId) {
      const propertyRes = await pool.query(
        `SELECT id FROM property WHERE caretaker_id = $1 LIMIT 1`,
        [caretaker.id],
      );
      propertyId = propertyRes.rows[0]?.id || null;
    }

    if (!propertyId) {
      return res.json({
        caretaker_name: caretaker.caretaker_name,
        property_name: null,
        property_address: null,
        stats: {
          total_units: 0,
          total_tenants: 0,
          occupied_units: 0,
          open_maintenance: 0,
          in_progress: 0,
          open_complaints: 0,
          pending_verdicts: 0,
          high_risk_tenants: 0,
          avg_reliability_score: null,
        },
        recent_activity: [],
      });
    }

    const [
      propertyRes,
      unitRes,
      maintenanceRes,
      inProgressRes,
      complaintsRes,
      pendingVerdictsRes,
      highRiskRes,
      avgScoreRes,
      recentMaintenanceRes,
      recentComplaintsRes,
    ] = await Promise.all([
      pool.query(
        `SELECT name AS property_name,
                address_line1 AS property_address
         FROM property
         WHERE id = $1`,
        [propertyId],
      ),

      pool.query(
        `SELECT COUNT(*)::int AS total_units,
                COUNT(*) FILTER (WHERE status = 'occupied')::int AS occupied_units
         FROM unit
         WHERE property_id = $1`,
        [propertyId],
      ),

      pool.query(
        `SELECT COUNT(*)::int AS open_maintenance
         FROM maintenance_request mr
         JOIN unit u ON u.id = mr.unit_id
         WHERE u.property_id = $1
           AND mr.status IN ('needs_repair', 'assigned', 'in_progress', 'pending_approval')`,
        [propertyId],
      ),

      pool.query(
        `SELECT COUNT(*)::int AS in_progress
         FROM maintenance_request mr
         JOIN unit u ON u.id = mr.unit_id
         WHERE u.property_id = $1
           AND mr.status = 'in_progress'`,
        [propertyId],
      ),

      pool.query(
        `SELECT COUNT(*)::int AS open_complaints
         FROM complaint
         WHERE property_id = $1
           AND status IN ('open', 'under_review', 'escalated', 'awaiting_clarification', 'approved')`,
        [propertyId],
      ),

      pool.query(
        `SELECT COUNT(*)::int AS pending_verdicts
         FROM complaint
         WHERE property_id = $1
           AND status = 'approved'`,
        [propertyId],
      ),

      pool.query(
        `SELECT COUNT(DISTINCT t.id)::int AS high_risk_tenants
         FROM tenant t
         JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
         JOIN unit u ON u.id = l.unit_id
         WHERE u.property_id = $1
           AND t.reliability_score = 'high_risk'`,
        [propertyId],
      ),

      pool.query(
        `SELECT ROUND(AVG(t.reliability_score_value)::numeric, 1) AS avg_reliability_score
         FROM tenant t
         JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
         JOIN unit u ON u.id = l.unit_id
         WHERE u.property_id = $1
           AND t.reliability_score_value IS NOT NULL`,
        [propertyId],
      ),

      pool.query(
        `SELECT 'maintenance' AS type,
                mr.id,
                mr.title,
                'Unit ' || u.unit_number || ' · ' || usr.full_name AS detail,
                mr.created_at,
                mr.status::text AS status,
                mr.priority::text AS priority
         FROM maintenance_request mr
         JOIN unit u ON u.id = mr.unit_id
         JOIN tenant t ON t.id = mr.tenant_id
         JOIN users usr ON usr.id = t.user_id
         WHERE u.property_id = $1
         ORDER BY mr.created_at DESC
         LIMIT 5`,
        [propertyId],
      ),

      pool.query(
        `SELECT 'complaint' AS type,
                c.id,
                c.subject AS title,
                'Filed by ' || fu.full_name AS detail,
                c.created_at,
                c.status::text AS status,
                CASE
                  WHEN c.severity >= 4 THEN 'urgent'
                  WHEN c.severity = 3 THEN 'high'
                  ELSE 'medium'
                END AS priority
         FROM complaint c
         JOIN users fu ON fu.id = c.filed_by
         WHERE c.property_id = $1
         ORDER BY c.created_at DESC
         LIMIT 5`,
        [propertyId],
      ),
    ]);

    const property = propertyRes.rows[0] || {};
    const units = unitRes.rows[0] || {};
    const maintenance = maintenanceRes.rows[0] || {};
    const inProgress = inProgressRes.rows[0] || {};
    const complaints = complaintsRes.rows[0] || {};
    const pendingVerdicts = pendingVerdictsRes.rows[0] || {};
    const highRisk = highRiskRes.rows[0] || {};
    const avgScore = avgScoreRes.rows[0] || {};

    const recentActivity = [
      ...recentMaintenanceRes.rows.map((row) => ({
        type: "maintenance",
        title: row.title,
        detail: row.detail,
        time: timeAgo(row.created_at),
        status: row.status,
        priority: row.priority,
      })),
      ...recentComplaintsRes.rows.map((row) => ({
        type: "complaint",
        title: row.title,
        detail: row.detail,
        time: timeAgo(row.created_at),
        status: row.status,
        priority: row.priority,
      })),
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 8);

    res.json({
      caretaker_name: caretaker.caretaker_name,
      property_name: property.property_name || null,
      property_address: property.property_address || null,
      stats: {
        total_units: units.total_units || 0,
        total_tenants: units.occupied_units || 0,
        occupied_units: units.occupied_units || 0,
        open_maintenance: maintenance.open_maintenance || 0,
        in_progress: inProgress.in_progress || 0,
        open_complaints: complaints.open_complaints || 0,
        pending_verdicts: pendingVerdicts.pending_verdicts || 0,
        high_risk_tenants: highRisk.high_risk_tenants || 0,
        avg_reliability_score: avgScore.avg_reliability_score || null,
      },
      recent_activity: recentActivity,
    });
  } catch (err) {
    console.error("Caretaker dashboard:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /caretaker/maintenance - Caretaker views all requests for their assigned property
router.get("/maintenance", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const cr = await pool.query(
      "SELECT id, assigned_property FROM caretaker WHERE user_id = $1",
      [req.userId],
    );

    if (!cr.rows.length) {
      return res.status(404).json({ error: "Caretaker profile not found" });
    }

    if (!cr.rows[0].assigned_property) {
      return res.json({
        requests: [],
        property: null,
        message: "No property assigned yet. Please contact your landlord.",
      });
    }

    const property = await pool.query(
      "SELECT id, name, property_type, address_line1, city FROM property WHERE id = $1",
      [cr.rows[0].assigned_property],
    );

    const result = await pool.query(
      `SELECT mr.*, 
              usr.full_name AS tenant_name,
              u.unit_number, 
              p.name AS property_name,
              (SELECT json_agg(mu ORDER BY mu.created_at ASC) 
               FROM maintenance_update mu 
               WHERE mu.request_id = mr.id) AS updates
       FROM maintenance_request mr
       JOIN tenant t ON t.id = mr.tenant_id
       JOIN users usr ON usr.id = t.user_id
       JOIN unit u ON u.id = mr.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE u.property_id = $1
       ORDER BY mr.created_at DESC`,
      [cr.rows[0].assigned_property],
    );

    res.json({
      requests: result.rows,
      property: property.rows[0] || null,
      caretaker_id: cr.rows[0].id,
    });
  } catch (err) {
    console.error("Get caretaker maintenance:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /caretaker/maintenance/recurring - Flag properties with recurring issues by category
router.get(
  "/maintenance/recurring",
  requireAuth,
  requireCaretaker,
  async (req, res) => {
    const minCount = parseInt(req.query.minCount, 10) || 2;

    try {
      // Find the caretaker and their assigned property
      const caretakerRes = await pool.query(
        `SELECT id, assigned_property
         FROM caretaker
         WHERE user_id = $1
           AND is_active = true`,
        [req.userId],
      );

      if (!caretakerRes.rows.length) {
        return res.status(404).json({
          error: "Caretaker not found",
        });
      }

      const caretaker = caretakerRes.rows[0];

      if (!caretaker.assigned_property) {
        return res.json({ rows: [] });
      }

      const result = await pool.query(
        `
        SELECT
          u.property_id,
          p.name AS property_name,
          mr.category,
          COUNT(*)::int AS report_count,
          COUNT(DISTINCT mr.reported_by)::int AS distinct_tenants,
          MIN(mr.created_at) AS first_reported,
          MAX(mr.created_at) AS last_reported
        FROM maintenance_request mr
        JOIN unit u
          ON u.id = mr.unit_id
        JOIN property p
          ON p.id = u.property_id
        WHERE u.property_id = $1
        GROUP BY
          u.property_id,
          p.name,
          mr.category
        HAVING COUNT(*) >= $2
        ORDER BY report_count DESC
        `,
        [caretaker.assigned_property, minCount],
      );

      res.json({
        rows: result.rows,
      });
    } catch (err) {
      console.error("Get recurring maintenance issues:", err);

      res.status(500).json({
        error: "Failed to fetch recurring issues",
      });
    }
  },
);

// GET /caretaker/maintenance/:id - Caretaker views single request detail
router.get(
  "/maintenance/:id",
  requireAuth,
  requireCaretaker,
  async (req, res) => {
    try {
      const { id } = req.params;
      const cr = await pool.query(
        "SELECT id, assigned_property FROM caretaker WHERE user_id = $1",
        [req.userId],
      );

      if (!cr.rows.length) {
        return res.status(404).json({ error: "Caretaker profile not found" });
      }

      const result = await pool.query(
        `SELECT mr.*, 
              usr.full_name AS tenant_name,
              u.unit_number, 
              p.name AS property_name,
              p.address_line1 AS property_address,
              (SELECT json_agg(mu ORDER BY mu.created_at ASC) 
               FROM maintenance_update mu 
               WHERE mu.request_id = mr.id) AS updates,
              COALESCE(
                (SELECT json_agg(
                  json_build_object(
                    'id', mp.id, 
                    'photo_type', mp.photo_type, 
                    'document_url', d.document_url,
                    'uploaded_at', mp.uploaded_at
                  ) ORDER BY mp.uploaded_at)
                FROM maintenance_photo mp
                JOIN document d ON d.id = mp.document_id
                WHERE mp.request_id = mr.id),
                '[]'::json
              ) AS photos
       FROM maintenance_request mr
       JOIN tenant t ON t.id = mr.tenant_id
       JOIN users usr ON usr.id = t.user_id
       JOIN unit u ON u.id = mr.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE mr.id = $1 AND u.property_id = $2`,
        [id, cr.rows[0].assigned_property],
      );

      if (!result.rows.length) {
        return res
          .status(404)
          .json({ error: "Request not found or not in your property" });
      }

      res.json({ request: result.rows[0] });
    } catch (err) {
      console.error("Get caretaker maintenance detail:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// PUT /caretaker/maintenance/:id/assign - Assign contractor
router.put(
  "/maintenance/:id/assign",
  requireAuth,
  requireCaretaker,
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        contractorName,
        contractorPhone,
        scheduledDate,
        estimatedCost,
        notes,
      } = req.body;

      if (!contractorName) {
        return res.status(400).json({ error: "Contractor name is required" });
      }

      const cr = await pool.query(
        "SELECT id, assigned_property FROM caretaker WHERE user_id = $1",
        [req.userId],
      );

      const requestCheck = await pool.query(
        `SELECT mr.* FROM maintenance_request mr
       JOIN unit u ON u.id = mr.unit_id
       WHERE mr.id = $1 AND u.property_id = $2`,
        [id, cr.rows[0].assigned_property],
      );

      if (!requestCheck.rows.length) {
        return res.status(403).json({
          error: "You can only manage requests in your assigned property",
        });
      }

      const result = await pool.query(
        `UPDATE maintenance_request 
       SET contractor_name = $1,
           contractor_phone = $2,
           scheduled_date = $3,
           estimated_cost = $4,
           status = 'assigned',
           assigned_at = NOW(),
           assigned_to = $5,
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
        [
          contractorName,
          contractorPhone,
          scheduledDate,
          estimatedCost,
          req.userId,
          id,
        ],
      );

      const updateNotes = notes
        ? `Assigned to ${contractorName}. ${notes}`
        : `Assigned to ${contractorName}`;

      await pool.query(
        `INSERT INTO maintenance_update (request_id, updated_by, status_from, status_to, notes)
       VALUES ($1, $2, $3, 'assigned', $4)`,
        [id, req.userId, requestCheck.rows[0].status, updateNotes],
      );

      await createNotification(
        requestCheck.rows[0].reported_by,
        "maintenance_update",
        "Contractor Assigned",
        `${contractorName} has been assigned to your request "${requestCheck.rows[0].title}"`,
        id,
        "maintenance",
      );

      res.json({
        message: "Contractor assigned successfully",
        request: result.rows[0],
      });
    } catch (err) {
      console.error("Assign contractor:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// PUT /caretaker/maintenance/:id/status - Update request status
router.put(
  "/maintenance/:id/status",
  requireAuth,
  requireCaretaker,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes, actualCost } = req.body;

      if (!status) {
        return res.status(400).json({ error: "New status is required" });
      }

      const cr = await pool.query(
        "SELECT id, assigned_property FROM caretaker WHERE user_id = $1",
        [req.userId],
      );

      if (!cr.rows.length) {
        return res.status(404).json({ error: "Caretaker not found" });
      }

      const requestCheck = await pool.query(
        `SELECT mr.* FROM maintenance_request mr
       JOIN unit u ON u.id = mr.unit_id
       WHERE mr.id = $1 AND u.property_id = $2`,
        [id, cr.rows[0].assigned_property],
      );

      if (!requestCheck.rows.length) {
        return res.status(403).json({
          error: "You can only manage requests in your assigned property",
        });
      }

      const currentRequest = requestCheck.rows[0];

      const updates = [];
      const values = [];
      let paramIndex = 1;

      updates.push(`status = $${paramIndex}::maintenance_status`);
      values.push(status);
      paramIndex++;

      updates.push(`updated_at = NOW()`);

      if (status === "completed") {
        updates.push(`completed_at = NOW()`);

        if (actualCost != null && actualCost !== "") {
          updates.push(`actual_cost = $${paramIndex}::decimal`);
          values.push(Number(actualCost));
          paramIndex++;
        }

        if (notes && notes.trim()) {
          updates.push(`completion_notes = $${paramIndex}::text`);
          values.push(notes.trim());
          paramIndex++;
        }
      }

      values.push(id);

      const query = `
      UPDATE maintenance_request 
      SET ${updates.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING *`;

      const result = await pool.query(query, values);

      await pool.query(
        `INSERT INTO maintenance_update (request_id, updated_by, status_from, status_to, notes)
       VALUES ($1, $2, $3::maintenance_status, $4::maintenance_status, $5::text)`,
        [
          id,
          req.userId,
          currentRequest.status,
          status,
          notes && notes.trim() ? notes.trim() : null,
        ],
      );

      const statusLabel = status.replace(/_/g, " ");
      await createNotification(
        currentRequest.reported_by,
        "maintenance_update",
        "Status Updated",
        `Your request "${currentRequest.title}" is now ${statusLabel}`,
        id,
        "maintenance",
      );

      res.json({
        message: "Status updated successfully",
        request: result.rows[0],
      });
    } catch (err) {
      console.error("Update status:", err);
      res.status(500).json({ error: "Server error", details: err.message });
    }
  },
);

// PUT /caretaker/maintenance/:id/escalate - Escalate to landlord
router.put(
  "/maintenance/:id/escalate",
  requireAuth,
  requireCaretaker,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { estimatedCost, reason } = req.body;

      if (!estimatedCost || !reason) {
        return res
          .status(400)
          .json({ error: "Estimated cost and reason are required" });
      }

      const cr = await pool.query(
        "SELECT id, assigned_property FROM caretaker WHERE user_id = $1",
        [req.userId],
      );

      const requestCheck = await pool.query(
        `SELECT mr.*, p.landlord_id FROM maintenance_request mr
       JOIN unit u ON u.id = mr.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE mr.id = $1 AND u.property_id = $2`,
        [id, cr.rows[0].assigned_property],
      );

      if (!requestCheck.rows.length) {
        return res.status(403).json({
          error: "You can only manage requests in your assigned property",
        });
      }

      const currentRequest = requestCheck.rows[0];

      const result = await pool.query(
        `UPDATE maintenance_request 
       SET status = 'pending_approval',
           estimated_cost = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
        [estimatedCost, id],
      );

      await pool.query(
        `INSERT INTO maintenance_update (request_id, updated_by, status_from, status_to, notes)
       VALUES ($1, $2, $3, 'pending_approval', $4)`,
        [id, req.userId, currentRequest.status, `Escalated: ${reason}`],
      );

      const landlordUser = await pool.query(
        "SELECT user_id FROM landlord WHERE id = $1",
        [currentRequest.landlord_id],
      );

      if (landlordUser.rows.length) {
        await createNotification(
          landlordUser.rows[0].user_id,
          "maintenance_update",
          "Request Escalated - Approval Needed",
          `Request "${currentRequest.title}" needs approval. Estimated cost: R${estimatedCost}`,
          id,
          "maintenance",
        );
      }

      res.json({
        message: "Request escalated to landlord for approval",
        request: result.rows[0],
      });
    } catch (err) {
      console.error("Escalate request:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// GET /caretaker/complaints - Caretaker views property complaints
router.get("/complaints", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const cr = await pool.query(
      "SELECT assigned_property FROM caretaker WHERE user_id = $1",
      [req.userId],
    );
    if (!cr.rows.length)
      return res.status(404).json({ error: "Caretaker not found" });
    if (!cr.rows[0].assigned_property) return res.json({ complaints: [] });

    const result = await pool.query(
      `SELECT c.*, 
              usr1.full_name AS filed_by_name,
              usr2.full_name AS against_name,
              u.unit_number AS against_unit_number,
              p.name AS property_name
       FROM complaint c
       LEFT JOIN tenant t1 ON t1.id = c.filed_by_tenant_id
       LEFT JOIN users usr1 ON usr1.id = t1.user_id
       LEFT JOIN tenant t2 ON t2.id = c.against_tenant_id
       LEFT JOIN users usr2 ON usr2.id = t2.user_id
       LEFT JOIN unit u ON u.id = c.against_unit_id
       LEFT JOIN property p ON p.id = c.property_id
       WHERE c.property_id = $1
       ORDER BY c.created_at DESC`,
      [cr.rows[0].assigned_property],
    );

    res.json({ complaints: result.rows });
  } catch (err) {
    console.error("Get caretaker complaints:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /caretaker/complaints/:id/review - Mark under review
router.put(
  "/complaints/:id/review",
  requireAuth,
  requireCaretaker,
  async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        "UPDATE complaint SET status = 'under_review', updated_at = NOW() WHERE id = $1 AND status = 'open' RETURNING *",
        [id],
      );

      if (!result.rows.length)
        return res
          .status(404)
          .json({ error: "Complaint not found or not open" });

      const tenantUser = await pool.query(
        "SELECT user_id FROM tenant WHERE id = $1",
        [result.rows[0].filed_by_tenant_id],
      );
      if (tenantUser.rows.length) {
        await createNotification(
          tenantUser.rows[0].user_id,
          "complaint_update",
          "Complaint Under Review",
          `Your complaint is being reviewed.`,
          id,
          "complaint",
        );
      }

      res.json({
        message: "Complaint marked as under review",
        complaint: result.rows[0],
      });
    } catch (err) {
      console.error("Review complaint:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// PUT /caretaker/complaints/:id/resolve - Mark complaint as resolved
router.put(
  "/complaints/:id/resolve",
  requireAuth,
  requireCaretaker,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const result = await pool.query(
        `UPDATE complaint 
       SET status = 'resolved', 
           resolution_notes = COALESCE($2, 'Resolved by caretaker, no fault found'),
           resolved_by = $3,
           resolved_at = NOW(), 
           updated_at = NOW() 
       WHERE id = $1 AND status IN ('under_review') 
       RETURNING *`,
        [id, notes || null, req.userId],
      );

      if (!result.rows.length) {
        return res.status(404).json({
          error: "Complaint not found or cannot be resolved in current status",
        });
      }

      const tenantUser = await pool.query(
        "SELECT user_id FROM tenant WHERE id = $1",
        [result.rows[0].filed_by_tenant_id],
      );
      if (tenantUser.rows.length) {
        await createNotification(
          tenantUser.rows[0].user_id,
          "complaint_update",
          "Complaint Resolved",
          `Your complaint "${result.rows[0].subject}" has been resolved.`,
          id,
          "complaint",
        );
      }

      res.json({
        message: "Complaint marked as resolved",
        complaint: result.rows[0],
      });
    } catch (err) {
      console.error("Resolve complaint:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

router.put(
  "/complaints/:id/verdict",
  requireAuth,
  requireCaretaker,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { verdict_type, fine_amount, notes } = req.body;

      if (!["warning", "fine", "dismissed"].includes(verdict_type)) {
        return res.status(400).json({
          error: "verdict_type must be 'warning', 'fine', or 'dismissed'",
        });
      }
      if (
        verdict_type === "fine" &&
        (fine_amount === undefined || fine_amount === null)
      ) {
        return res.status(400).json({
          error: "fine_amount is required when verdict_type is 'fine'",
        });
      }

      const complaint = await pool.query(
        "SELECT * FROM complaint WHERE id = $1 AND status IN ('under_review', 'escalated')",
        [id],
      );
      if (!complaint.rows.length) {
        return res.status(404).json({
          error: "Complaint not found or not in a state that accepts a verdict",
        });
      }

      const verdict = await pool.query(
        `INSERT INTO complaint_verdict (complaint_id, verdict_type, fine_amount, issued_by, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
        [
          id,
          verdict_type,
          verdict_type === "fine" ? fine_amount : null,
          req.userId,
          notes || null,
        ],
      );

      const againstTenantId = complaint.rows[0].against_tenant_id;
      if (againstTenantId) {
        const tenantUser = await pool.query(
          "SELECT user_id FROM tenant WHERE id = $1",
          [againstTenantId],
        );
        if (tenantUser.rows.length) {
          const labels = {
            warning: "Warning Issued",
            fine: `Fine Issued: R${fine_amount}`,
            dismissed: "Complaint Dismissed",
          };
          await createNotification(
            tenantUser.rows[0].user_id,
            "complaint_update",
            labels[verdict_type],
            notes ||
              `Verdict issued on complaint "${complaint.rows[0].subject}"`,
            id,
            "complaint",
          );
        }
      }

      res
        .status(201)
        .json({ message: "Verdict recorded", verdict: verdict.rows[0] });
    } catch (err) {
      console.error("Issue verdict:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// PUT /caretaker/complaints/:id/escalate - Escalate to landlord
router.put(
  "/complaints/:id/escalate",
  requireAuth,
  requireCaretaker,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const result = await pool.query(
        "UPDATE complaint SET status = 'escalated', updated_at = NOW() WHERE id = $1 RETURNING *",
        [id],
      );

      if (!result.rows.length)
        return res.status(404).json({ error: "Complaint not found" });

      const property = await pool.query(
        "SELECT landlord_id FROM property WHERE id = $1",
        [result.rows[0].property_id],
      );
      if (property.rows.length) {
        const landlordUser = await pool.query(
          "SELECT user_id FROM landlord WHERE id = $1",
          [property.rows[0].landlord_id],
        );
        if (landlordUser.rows.length) {
          await createNotification(
            landlordUser.rows[0].user_id,
            "complaint_update",
            "Complaint Escalated",
            `"${result.rows[0].subject}" has been escalated.`,
            id,
            "complaint",
          );
        }
      }

      res.json({ message: "Complaint escalated", complaint: result.rows[0] });
    } catch (err) {
      console.error("Escalate complaint:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// PUT /caretaker/complaints/:id/dismiss - Dismiss complaint
router.put(
  "/complaints/:id/dismiss",
  requireAuth,
  requireCaretaker,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!reason)
        return res.status(400).json({ error: "Dismissal reason is required" });

      const result = await pool.query(
        "UPDATE complaint SET status = 'dismissed', resolution_notes = $1, resolved_by = $2, resolved_at = NOW(), updated_at = NOW() WHERE id = $3 RETURNING *",
        [reason, req.userId, id],
      );

      if (!result.rows.length)
        return res.status(404).json({ error: "Complaint not found" });

      const tenantUser = await pool.query(
        "SELECT user_id FROM tenant WHERE id = $1",
        [result.rows[0].filed_by_tenant_id],
      );
      if (tenantUser.rows.length) {
        await createNotification(
          tenantUser.rows[0].user_id,
          "complaint_update",
          "Complaint Dismissed",
          `Your complaint was dismissed: ${reason}`,
          id,
          "complaint",
        );
      }

      res.json({ message: "Complaint dismissed", complaint: result.rows[0] });
    } catch (err) {
      console.error("Dismiss complaint:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

module.exports = router;
