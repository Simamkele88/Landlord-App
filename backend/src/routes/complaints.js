const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireTenant } = require("../middleware/roleCheck");
const { createNotification } = require("../utils/notifications");

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
      "SELECT t.id, t.landlord_id, l.unit_id, u.property_id FROM tenant t JOIN lease l ON l.tenant_id = t.id AND l.status = 'active' JOIN unit u ON u.id = l.unit_id WHERE t.user_id = $1",
      [req.userId]
    );
    
    if (!tenant.rows.length) {
      return res.status(404).json({ error: "Active lease not found" });
    }
    
    const { id: tenantId, landlord_id, unit_id, property_id } = tenant.rows[0];
    
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
            `INSERT INTO document_ (
              tenant_id, uploaded_by, document_type,
              document_name, document_url, file_size, mime_type
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id`,
            [
              tenantId, req.userId,
              'complaint_evidence',
              item.document_name || `Complaint evidence - ${complaintId}`,
              item.document_url,
              item.file_size || 0,
              item.mime_type || 'image/jpeg'
            ]
          );
          
          const documentId = docResult.rows[0].id;
          
          await pool.query(
            `INSERT INTO complaint_evidence (
              complaint_id, document_id, evidence_type, uploaded_by
            ) VALUES ($1, $2, $3, $4)`,
            [complaintId, documentId, item.photo_type || 'photo', req.userId]
          );
        } catch (evidenceErr) {
          console.error("Failed to save evidence item:", evidenceErr.message);
        }
      }
    }
    
    const caretaker = await pool.query(
      "SELECT u.id FROM user_ u JOIN caretaker c ON c.user_id = u.id WHERE c.assigned_property = $1",
      [property_id]
    );
    
    const scopeLabels = {
      specific_tenant: `against Unit ${against_unit_number}`,
      common_area: `about ${common_area_location}`,
      unknown: 'general complaint',
      property_wide: 'property-wide issue'
    };
    
    if (caretaker.rows.length) {
      await createNotification(
        caretaker.rows[0].id, "complaint_update", "New Complaint",
        `New ${scopeLabels[complaint_scope]}: "${subject}"`, complaintId, "complaint"
      );
    }
    
    await createNotification(
      req.userId, "complaint_update", "Complaint Submitted",
      `Your complaint "${subject}" is under review.`, complaintId, "complaint"
    );
    
    res.status(201).json({ message: "Complaint submitted", complaint: result.rows[0] });
  } catch (err) {
    console.error("Submit complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /complaints/my - Tenant views their own complaints
router.get("/my", requireAuth, requireTenant, async (req, res) => {
  try {
    const tenant = await pool.query("SELECT id FROM tenant WHERE user_id = $1", [req.userId]);
    if (!tenant.rows.length) return res.status(404).json({ error: "Tenant not found" });
    
    const result = await pool.query(
      `SELECT c.*, 
              t1.first_name || ' ' || t1.last_name AS filed_by_name,
              t2.first_name || ' ' || t2.last_name AS against_name,
              u.unit_number AS against_unit_number,
              p.name AS property_name,
              COALESCE(
                (SELECT json_agg(json_build_object('id', ce.id, 'document_url', d.document_url, 'evidence_type', ce.evidence_type, 'label', d.document_name, 'mimeType', d.mime_type))
                 FROM complaint_evidence ce
                 LEFT JOIN document_ d ON d.id = ce.document_id
                 WHERE ce.complaint_id = c.id),
                '[]'::json
              ) AS evidence
       FROM complaint c
       LEFT JOIN tenant t1 ON t1.id = c.filed_by_tenant_id
       LEFT JOIN tenant t2 ON t2.id = c.against_tenant_id
       LEFT JOIN unit u ON u.id = c.against_unit_id
       LEFT JOIN property p ON p.id = c.property_id
       WHERE c.filed_by_tenant_id = $1
       ORDER BY c.created_at DESC`,
      [tenant.rows[0].id]
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
      "UPDATE complaint SET status = 'escalated', updated_at = NOW() WHERE id = $1 AND filed_by = $2 AND status = 'awaiting_clarification' RETURNING *",
      [id, req.userId]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found or not awaiting clarification" });
    
    const property = await pool.query("SELECT landlord_id FROM property WHERE id = $1", [result.rows[0].property_id]);
    if (property.rows.length) {
      const landlordUser = await pool.query("SELECT user_id FROM landlord WHERE id = $1", [property.rows[0].landlord_id]);
      if (landlordUser.rows.length) {
        await createNotification(landlordUser.rows[0].user_id, "complaint_update", "Clarification Provided",
          `Tenant provided clarification.`, id, "complaint");
      }
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
      `UPDATE complaint SET status = 'open', resolution_notes = NULL, resolved_by = NULL, resolved_at = NULL, updated_at = NOW() 
       WHERE id = $1 AND filed_by = $2 AND status IN ('resolved', 'rejected', 'dismissed') RETURNING *`,
      [id, req.userId]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found or cannot be reopened" });
    
    const caretaker = await pool.query(
      "SELECT u.id FROM user_ u JOIN caretaker c ON c.user_id = u.id WHERE c.assigned_property = $1",
      [result.rows[0].property_id]
    );
    
    if (caretaker.rows.length) {
      await createNotification(caretaker.rows[0].id, "complaint_update", "Complaint Reopened",
        `Tenant reopened a complaint.`, id, "complaint");
    }
    
    res.json({ message: "Complaint reopened", complaint: result.rows[0] });
  } catch (err) {
    console.error("Reopen complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /complaints/:id - Get single complaint (MUST be after specific routes)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT c.*, 
              t1.first_name || ' ' || t1.last_name AS filed_by_name,
              t2.first_name || ' ' || t2.last_name AS against_name,
              u.unit_number AS against_unit_number,
              p.name AS property_name,
              COALESCE(
                (SELECT json_agg(json_build_object('id', ce.id, 'document_url', d.document_url, 'evidence_type', ce.evidence_type, 'label', d.document_name, 'mimeType', d.mime_type))
                 FROM complaint_evidence ce
                 LEFT JOIN document_ d ON d.id = ce.document_id
                 WHERE ce.complaint_id = c.id),
                '[]'::json
              ) AS evidence
       FROM complaint c
       LEFT JOIN tenant t1 ON t1.id = c.filed_by_tenant_id
       LEFT JOIN tenant t2 ON t2.id = c.against_tenant_id
       LEFT JOIN unit u ON u.id = c.against_unit_id
       LEFT JOIN property p ON p.id = c.property_id
       WHERE c.id = $1`,
      [id]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Complaint not found" });
    }
    
    res.json({ complaint: result.rows[0] });
  } catch (err) {
    console.error("Get complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
