const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireCaretaker } = require("../middleware/roleCheck");
const { createNotification } = require("../utils/notifications");

// GET /caretaker/maintenance - Caretaker views all requests for their assigned property
router.get("/maintenance", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const cr = await pool.query(
      "SELECT id, assigned_property FROM caretaker WHERE user_id = $1", 
      [req.userId]
    );
    
    if (!cr.rows.length) {
      return res.status(404).json({ error: "Caretaker profile not found" });
    }
    
    if (!cr.rows[0].assigned_property) {
      return res.json({ 
        requests: [],
        property: null,
        message: "No property assigned yet. Please contact your landlord."
      });
    }
    
    const property = await pool.query(
      "SELECT id, name, property_type, address_line1, city FROM property WHERE id = $1",
      [cr.rows[0].assigned_property]
    );
    
    const result = await pool.query(
      `SELECT mr.*, 
              t.first_name || ' ' || t.last_name AS tenant_name,
              u.unit_number, 
              p.name AS property_name,
              (SELECT json_agg(mu ORDER BY mu.created_at ASC) 
               FROM maintenance_update mu 
               WHERE mu.request_id = mr.id) AS updates
       FROM maintenance_request mr
       JOIN tenant t ON t.id = mr.tenant_id
       JOIN unit u ON u.id = mr.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE u.property_id = $1
       ORDER BY mr.created_at DESC`,
      [cr.rows[0].assigned_property]
    );
    
    res.json({ 
      requests: result.rows,
      property: property.rows[0] || null,
      caretaker_id: cr.rows[0].id
    });
    
  } catch (err) {
    console.error("Get caretaker maintenance:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /caretaker/maintenance/:id - Caretaker views single request detail
router.get("/maintenance/:id", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const cr = await pool.query(
      "SELECT id, assigned_property FROM caretaker WHERE user_id = $1", 
      [req.userId]
    );
    
    if (!cr.rows.length) {
      return res.status(404).json({ error: "Caretaker profile not found" });
    }
    
    const result = await pool.query(
      `SELECT mr.*, 
              t.first_name || ' ' || t.last_name AS tenant_name,        
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
                JOIN document_ d ON d.id = mp.document_id
                WHERE mp.request_id = mr.id),
                '[]'::json
              ) AS photos
       FROM maintenance_request mr
       JOIN tenant t ON t.id = mr.tenant_id
       JOIN unit u ON u.id = mr.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE mr.id = $1 AND u.property_id = $2`,
      [id, cr.rows[0].assigned_property]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Request not found or not in your property" });
    }
    
    res.json({ request: result.rows[0] });
    
  } catch (err) {
    console.error("Get caretaker maintenance detail:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /caretaker/maintenance/:id/assign - Assign contractor
router.put("/maintenance/:id/assign", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const { contractorName, contractorPhone, scheduledDate, estimatedCost, notes } = req.body;
    
    if (!contractorName) {
      return res.status(400).json({ error: "Contractor name is required" });
    }
    
    const cr = await pool.query(
      "SELECT id, assigned_property FROM caretaker WHERE user_id = $1", 
      [req.userId]
    );
    
    const requestCheck = await pool.query(
      `SELECT mr.* FROM maintenance_request mr
       JOIN unit u ON u.id = mr.unit_id
       WHERE mr.id = $1 AND u.property_id = $2`,
      [id, cr.rows[0].assigned_property]
    );
    
    if (!requestCheck.rows.length) {
      return res.status(403).json({ error: "You can only manage requests in your assigned property" });
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
      [contractorName, contractorPhone, scheduledDate, estimatedCost, req.userId, id]
    );
    
    const updateNotes = notes ? `Assigned to ${contractorName}. ${notes}` : `Assigned to ${contractorName}`;
      
    await pool.query(
      `INSERT INTO maintenance_update (request_id, updated_by, status_from, status_to, notes)
       VALUES ($1, $2, $3, 'assigned', $4)`,
      [id, req.userId, requestCheck.rows[0].status, updateNotes]
    );
    
    await createNotification(
      requestCheck.rows[0].reported_by,
      "maintenance_update",
      "Contractor Assigned",
      `${contractorName} has been assigned to your request "${requestCheck.rows[0].title}"`,
      id,
      "maintenance"
    );
    
    res.json({ message: "Contractor assigned successfully", request: result.rows[0] });
  } catch (err) {
    console.error("Assign contractor:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /caretaker/maintenance/:id/status - Update request status
router.put("/maintenance/:id/status", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, actualCost } = req.body;
    
    if (!status) {
      return res.status(400).json({ error: "New status is required" });
    }
    
    const cr = await pool.query(
      "SELECT id, assigned_property FROM caretaker WHERE user_id = $1", 
      [req.userId]
    );
    
    if (!cr.rows.length) {
      return res.status(404).json({ error: "Caretaker not found" });
    }
    
    const requestCheck = await pool.query(
      `SELECT mr.* FROM maintenance_request mr
       JOIN unit u ON u.id = mr.unit_id
       WHERE mr.id = $1 AND u.property_id = $2`,
      [id, cr.rows[0].assigned_property]
    );
    
    if (!requestCheck.rows.length) {
      return res.status(403).json({ error: "You can only manage requests in your assigned property" });
    }
    
    const currentRequest = requestCheck.rows[0];
    
    const updates = [];
    const values = [];
    let paramIndex = 1;
    
    updates.push(`status = $${paramIndex}::maintenance_status`);
    values.push(status);
    paramIndex++;
    
    updates.push(`updated_at = NOW()`);
    
    if (status === 'completed') {
      updates.push(`completed_at = NOW()`);
      
      if (actualCost != null && actualCost !== '') {
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
      [id, req.userId, currentRequest.status, status, notes && notes.trim() ? notes.trim() : null]
    );
    
    const statusLabel = status.replace(/_/g, ' ');
    await createNotification(
      currentRequest.reported_by,
      "maintenance_update",
      "Status Updated",
      `Your request "${currentRequest.title}" is now ${statusLabel}`,
      id,
      "maintenance"
    );
    
    res.json({ message: "Status updated successfully", request: result.rows[0] });
  } catch (err) {
    console.error("Update status:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// PUT /caretaker/maintenance/:id/escalate - Escalate to landlord
router.put("/maintenance/:id/escalate", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const { estimatedCost, reason } = req.body;
    
    if (!estimatedCost || !reason) {
      return res.status(400).json({ error: "Estimated cost and reason are required" });
    }
    
    const cr = await pool.query(
      "SELECT id, assigned_property FROM caretaker WHERE user_id = $1", 
      [req.userId]
    );
    
    const requestCheck = await pool.query(
      `SELECT mr.*, p.landlord_id FROM maintenance_request mr
       JOIN unit u ON u.id = mr.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE mr.id = $1 AND u.property_id = $2`,
      [id, cr.rows[0].assigned_property]
    );
    
    if (!requestCheck.rows.length) {
      return res.status(403).json({ error: "You can only manage requests in your assigned property" });
    }
    
    const currentRequest = requestCheck.rows[0];
    
    const result = await pool.query(
      `UPDATE maintenance_request 
       SET status = 'pending_approval',
           estimated_cost = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [estimatedCost, id]
    );
    
    await pool.query(
      `INSERT INTO maintenance_update (request_id, updated_by, status_from, status_to, notes)
       VALUES ($1, $2, $3, 'pending_approval', $4)`,
      [id, req.userId, currentRequest.status, `Escalated: ${reason}`]
    );
    
    const landlordUser = await pool.query(
      "SELECT user_id FROM landlord WHERE id = $1",
      [currentRequest.landlord_id]
    );
    
    if (landlordUser.rows.length) {
      await createNotification(
        landlordUser.rows[0].user_id,
        "maintenance_update",
        "Request Escalated - Approval Needed",
        `Request "${currentRequest.title}" needs approval. Estimated cost: R${estimatedCost}`,
        id,
        "maintenance"
      );
    }
    
    res.json({ message: "Request escalated to landlord for approval", request: result.rows[0] });
  } catch (err) {
    console.error("Escalate request:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /caretaker/complaints - Caretaker views property complaints
router.get("/complaints", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const cr = await pool.query("SELECT assigned_property FROM caretaker WHERE user_id = $1", [req.userId]);
    if (!cr.rows.length) return res.status(404).json({ error: "Caretaker not found" });
    if (!cr.rows[0].assigned_property) return res.json({ complaints: [] });
    
    const result = await pool.query(
      `SELECT c.*, 
              t1.first_name || ' ' || t1.last_name AS filed_by_name,
              t2.first_name || ' ' || t2.last_name AS against_name,
              u.unit_number AS against_unit_number,
              p.name AS property_name
       FROM complaint c
       LEFT JOIN tenant t1 ON t1.id = c.filed_by_tenant_id
       LEFT JOIN tenant t2 ON t2.id = c.against_tenant_id
       LEFT JOIN unit u ON u.id = c.against_unit_id
       LEFT JOIN property p ON p.id = c.property_id
       WHERE c.property_id = $1
       ORDER BY c.created_at DESC`,
      [cr.rows[0].assigned_property]
    );
    
    res.json({ complaints: result.rows });
  } catch (err) {
    console.error("Get caretaker complaints:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /caretaker/complaints/:id/review - Mark under review
router.put("/complaints/:id/review", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      "UPDATE complaint SET status = 'under_review', updated_at = NOW() WHERE id = $1 AND status = 'open' RETURNING *",
      [id]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found or not open" });
    
    const tenantUser = await pool.query("SELECT user_id FROM tenant WHERE id = $1", [result.rows[0].filed_by_tenant_id]);
    if (tenantUser.rows.length) {
      await createNotification(tenantUser.rows[0].user_id, "complaint_update", "Complaint Under Review",
        `Your complaint is being reviewed.`, id, "complaint");
    }
    
    res.json({ message: "Complaint marked as under review", complaint: result.rows[0] });
  } catch (err) {
    console.error("Review complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /caretaker/complaints/:id/resolve - Mark as resolved
router.put("/complaints/:id/resolve", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    
    const result = await pool.query(
      `UPDATE complaint 
       SET status = 'resolved', 
           resolution_notes = COALESCE($2, 'Resolved by caretaker'),
           resolved_by = $3,
           resolved_at = NOW(), 
           updated_at = NOW() 
       WHERE id = $1 AND status IN ('under_review') 
       RETURNING *`,
      [id, notes || null, req.userId]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Complaint not found or cannot be resolved in current status" });
    }
    
    const tenantUser = await pool.query("SELECT user_id FROM tenant WHERE id = $1", [result.rows[0].filed_by_tenant_id]);
    if (tenantUser.rows.length) {
      await createNotification(tenantUser.rows[0].user_id, "complaint_update", "Complaint Resolved",
        `Your complaint "${result.rows[0].subject}" has been resolved.`, id, "complaint");
    }
    
    res.json({ message: "Complaint marked as resolved", complaint: result.rows[0] });
  } catch (err) {
    console.error("Resolve complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /caretaker/complaints/:id/escalate - Escalate to landlord
router.put("/complaints/:id/escalate", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await pool.query(
      "UPDATE complaint SET status = 'escalated', updated_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found" });
    
    const property = await pool.query("SELECT landlord_id FROM property WHERE id = $1", [result.rows[0].property_id]);
    if (property.rows.length) {
      const landlordUser = await pool.query("SELECT user_id FROM landlord WHERE id = $1", [property.rows[0].landlord_id]);
      if (landlordUser.rows.length) {
        await createNotification(landlordUser.rows[0].user_id, "complaint_update", "Complaint Escalated",
          `"${result.rows[0].subject}" has been escalated.`, id, "complaint");
      }
    }
    
    res.json({ message: "Complaint escalated", complaint: result.rows[0] });
  } catch (err) {
    console.error("Escalate complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /caretaker/complaints/:id/dismiss - Dismiss complaint
router.put("/complaints/:id/dismiss", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) return res.status(400).json({ error: "Dismissal reason is required" });
    
    const result = await pool.query(
      "UPDATE complaint SET status = 'dismissed', resolution_notes = $1, resolved_by = $2, resolved_at = NOW(), updated_at = NOW() WHERE id = $3 RETURNING *",
      [reason, req.userId, id]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found" });
    
    const tenantUser = await pool.query("SELECT user_id FROM tenant WHERE id = $1", [result.rows[0].filed_by_tenant_id]);
    if (tenantUser.rows.length) {
      await createNotification(tenantUser.rows[0].user_id, "complaint_update", "Complaint Dismissed",
        `Your complaint was dismissed: ${reason}`, id, "complaint");
    }
    
    res.json({ message: "Complaint dismissed", complaint: result.rows[0] });
  } catch (err) {
    console.error("Dismiss complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
