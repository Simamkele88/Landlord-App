const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireTenant } = require("../middleware/roleCheck");
const { createNotification } = require("../utils/notifications");

async function getTenant(userId) {
  const result = await pool.query(
    "SELECT id, landlord_id FROM tenant WHERE user_id = $1", 
    [userId]
  );
  return result.rows[0] || null;
}

// POST /complaints - Tenant submits new complaint
router.post("/", requireAuth, requireTenant, async (req, res) => {
  try {
    const { 
      subject, description, category, complaint_scope,
      against_unit_number, common_area_location, evidence
    } = req.body;
    
    if (!subject || !description || !category) {
      return res.status(400).json({ error: "Subject, description, and category are required" });
    }
    
    if (!complaint_scope) {
      return res.status(400).json({ error: "Complaint scope is required" });
    }
    
    if (complaint_scope === 'specific_tenant' && !against_unit_number) {
      return res.status(400).json({ error: "Unit number is required for tenant-specific complaints" });
    }
    
    if (complaint_scope === 'common_area' && !common_area_location) {
      return res.status(400).json({ error: "Common area location is required" });
    }
    
    const tenant = await pool.query(
      `SELECT t.id, t.landlord_id, l.unit_id, u.property_id, u.unit_number AS my_unit
       FROM tenant t 
       JOIN lease l ON l.tenant_id = t.id AND l.status = 'active' 
       JOIN unit u ON u.id = l.unit_id 
       WHERE t.user_id = $1`,
      [req.userId]
    );
    
    if (!tenant.rows.length) {
      return res.status(404).json({ error: "Active lease not found" });
    }
    
    const { id: tenantId, landlord_id, unit_id, property_id, my_unit } = tenant.rows[0];
    
    if (complaint_scope === 'specific_tenant' && parseInt(against_unit_number) === my_unit) {
      return res.status(400).json({ error: "You cannot file a complaint against your own unit" });
    }
    
    let againstTenantId = null;
    let againstUnitId = null;
    
    if (complaint_scope === 'specific_tenant' && against_unit_number) {
      const unitResult = await pool.query(
        "SELECT id, current_tenant_id FROM unit WHERE unit_number = $1 AND property_id = $2",
        [parseInt(against_unit_number), property_id]
      );
      
      if (unitResult.rows.length) {
        againstUnitId = unitResult.rows[0].id;
        againstTenantId = unitResult.rows[0].current_tenant_id;
      } else {
        return res.status(404).json({ error: `Unit ${against_unit_number} not found in your property` });
      }
    }
    
    const result = await pool.query(
      `INSERT INTO complaint (
        property_id, filed_by, filed_by_tenant_id, 
        against_tenant_id, against_unit_id, 
        subject, description, category, status,
        complaint_scope, common_area_location
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open', $9, $10) 
      RETURNING *`,
      [
        property_id, req.userId, tenantId, 
        againstTenantId, againstUnitId,
        subject, description, category,
        complaint_scope, common_area_location || null
      ]
    );
    
    const complaintId = result.rows[0].id;
    
    if (evidence && Array.isArray(evidence) && evidence.length > 0) {
      for (const item of evidence) {
        if (!item.document_url) continue;
        try {
          const docResult = await pool.query(
            `INSERT INTO document (
              tenant_id, uploaded_by, document_type,
              document_name, document_url, file_size, mime_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id`,
            [tenantId, req.userId, 'complaint_evidence',
             item.document_name || `Evidence - ${complaintId}`,
             item.document_url, item.file_size || 0, item.mime_type || 'image/jpeg']
          );
          
          await pool.query(
            `INSERT INTO complaint_evidence (
              complaint_id, document_id, evidence_type, uploaded_by
            ) VALUES ($1, $2, $3, $4)`,
            [complaintId, docResult.rows[0].id, item.photo_type || 'photo', req.userId]
          );
        } catch (e) {
          console.error("Evidence save error:", e.message);
        }
      }
    }
    
    const caretaker = await pool.query(
      "SELECT u.id FROM users u JOIN caretaker c ON c.user_id = u.id WHERE c.assigned_property = $1",
      [property_id]
    );
    
    const scopeLabel = {
      specific_tenant: `against Unit ${against_unit_number}`,
      common_area: `about ${common_area_location}`,
      unknown: 'general complaint',
      property_wide: 'property-wide issue'
    };
    
    if (caretaker.rows.length) {
      await createNotification(
        caretaker.rows[0].id, "complaint_update", "New Complaint",
        `New complaint ${scopeLabel[complaint_scope]}: "${subject}"`, complaintId, "complaint"
      );
    } else {
      const lu = await pool.query("SELECT user_id FROM landlord WHERE id = $1", [landlord_id]);
      if (lu.rows.length) {
        await createNotification(
          lu.rows[0].user_id, "complaint_update", "New Complaint (No Caretaker)",
          `New complaint: "${subject}" - No caretaker assigned`, complaintId, "complaint"
        );
      }
    }
    
    await createNotification(
      req.userId, "complaint_update", "Complaint Submitted",
      `Your complaint "${subject}" has been submitted for review.`, complaintId, "complaint"
    );
    
    res.status(201).json({ message: "Complaint submitted", complaint: result.rows[0] });
  } catch (err) {
    console.error("Submit complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /complaints/my - Tenant's own complaints
router.get("/my", requireAuth, requireTenant, async (req, res) => {
  try {
    const tenant = await getTenant(req.userId);
    if (!tenant) return res.status(404).json({ error: "Tenant not found" });
    
    const result = await pool.query(
      `SELECT c.*, 
              usr1.full_name AS filed_by_name,
              usr2.full_name AS against_name,
              u.unit_number AS against_unit_number,
              p.name AS property_name,
              COALESCE(
                (SELECT json_agg(json_build_object(
                  'id', ce.id, 
                  'document_url', d.document_url, 
                  'evidence_type', ce.evidence_type, 
                  'label', d.document_name, 
                  'mime_type', d.mime_type
                ))
                 FROM complaint_evidence ce
                 LEFT JOIN document d ON d.id = ce.document_id
                 WHERE ce.complaint_id = c.id),
                '[]'::json
              ) AS evidence,
              CASE WHEN cv.id IS NOT NULL THEN
                json_build_object(
                  'id', cv.id,
                  'verdict_type', cv.verdict_type,
                  'fine_amount', cv.fine_amount,
                  'notes', cv.notes,
                  'issued_by', cv.issued_by,
                  'issued_at', cv.issued_at
                )
              ELSE NULL END AS verdict
       FROM complaint c
       LEFT JOIN tenant t1 ON t1.id = c.filed_by_tenant_id
       LEFT JOIN users usr1 ON usr1.id = t1.user_id
       LEFT JOIN tenant t2 ON t2.id = c.against_tenant_id
       LEFT JOIN users usr2 ON usr2.id = t2.user_id
       LEFT JOIN unit u ON u.id = c.against_unit_id
       LEFT JOIN property p ON p.id = c.property_id
       LEFT JOIN complaint_verdict cv ON cv.complaint_id = c.id
       WHERE c.filed_by_tenant_id = $1
       ORDER BY c.created_at DESC`,
      [tenant.id]
    );
    
    res.json({ complaints: result.rows });
  } catch (err) {
    console.error("Get tenant complaints:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /complaints/:id/clarify - Tenant provides clarification
router.put("/:id/clarify", requireAuth, requireTenant, async (req, res) => {
  try {
    const { id } = req.params;
    const { response } = req.body;
    
    if (!response) return res.status(400).json({ error: "Response is required" });
    
    const result = await pool.query(
      `UPDATE complaint 
       SET status = 'under_review', clarification_notes = $3, updated_at = NOW() 
       WHERE id = $1 AND filed_by = $2 AND status = 'awaiting_clarification' 
       RETURNING *`,
      [id, req.userId, response]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Complaint not found or not awaiting clarification" });
    }
    
    const caretaker = await pool.query(
      "SELECT u.id FROM users u JOIN caretaker c ON c.user_id = u.id WHERE c.assigned_property = $1",
      [result.rows[0].property_id]
    );
    if (caretaker.rows.length) {
      await createNotification(
        caretaker.rows[0].id, "complaint_update", "Clarification Provided",
        `Tenant responded to clarification for "${result.rows[0].subject}".`, id, "complaint"
      );
    }
    
    res.json({ message: "Clarification submitted", complaint: result.rows[0] });
  } catch (err) {
    console.error("Clarify complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /complaints/:id/reopen - Tenant reopens complaint
router.put("/:id/reopen", requireAuth, requireTenant, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const result = await pool.query(
      `UPDATE complaint 
       SET status = 'open', resolution_notes = NULL, resolved_by = NULL, 
           resolved_at = NULL, updated_at = NOW() 
       WHERE id = $1 AND filed_by = $2 
         AND status IN ('resolved', 'rejected', 'dismissed') 
       RETURNING *`,
      [id, req.userId]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Complaint not found or cannot be reopened" });
    }
    
    const caretaker = await pool.query(
      "SELECT u.id FROM users u JOIN caretaker c ON c.user_id = u.id WHERE c.assigned_property = $1",
      [result.rows[0].property_id]
    );
    if (caretaker.rows.length) {
      await createNotification(
        caretaker.rows[0].id, "complaint_update", "Complaint Reopened",
        `Tenant reopened "${result.rows[0].subject}". Reason: ${reason || 'N/A'}`, id, "complaint"
      );
    }
    
    res.json({ message: "Complaint reopened", complaint: result.rows[0] });
  } catch (err) {
    console.error("Reopen complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /complaints/:id - Get single complaint
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT c.*, 
              usr1.full_name AS filed_by_name,
              usr1.email AS filed_by_email,
              usr2.full_name AS against_name,
              u.unit_number AS against_unit_number,
              p.name AS property_name,
              p.address_line1 AS property_address,
              COALESCE(
                (SELECT json_agg(json_build_object(
                  'id', ce.id, 
                  'document_url', d.document_url, 
                  'evidence_type', ce.evidence_type, 
                  'label', d.document_name, 
                  'mime_type', d.mime_type,
                  'file_size', d.file_size
                ))
                 FROM complaint_evidence ce
                 LEFT JOIN document d ON d.id = ce.document_id
                 WHERE ce.complaint_id = c.id),
                '[]'::json
              ) AS evidence,
              CASE WHEN cv.id IS NOT NULL THEN
                json_build_object(
                  'id', cv.id,
                  'verdict_type', cv.verdict_type,
                  'fine_amount', cv.fine_amount,
                  'notes', cv.notes,
                  'issued_by', cv.issued_by,
                  'issued_at', cv.issued_at
                )
              ELSE NULL END AS verdict
       FROM complaint c
       LEFT JOIN tenant t1 ON t1.id = c.filed_by_tenant_id
       LEFT JOIN users usr1 ON usr1.id = t1.user_id
       LEFT JOIN tenant t2 ON t2.id = c.against_tenant_id
       LEFT JOIN users usr2 ON usr2.id = t2.user_id
       LEFT JOIN unit u ON u.id = c.against_unit_id
       LEFT JOIN property p ON p.id = c.property_id
       LEFT JOIN complaint_verdict cv ON cv.complaint_id = c.id
       WHERE c.id = $1`,
      [id]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    
    if (req.userRole === 'tenant') {
      const tenant = await getTenant(req.userId);
      if (!tenant || result.rows[0].filed_by_tenant_id !== tenant.id) {
        return res.status(403).json({ error: "Access denied" });
      }
    }
    
    res.json({ complaint: result.rows[0] });
  } catch (err) {
    console.error("Get complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;