const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireTenant } = require("../middleware/roleCheck");
const { createNotification } = require("../utils/notifications");

// POST /maintenance - Tenant submits new maintenance request
router.post("/", requireAuth, requireTenant, async (req, res) => {
  const { title, description, category, priority, photos } = req.body;
  
  if (!title || !description || !category) {
    return res.status(400).json({ error: "Title, description, and category are required" });
  }
  
  const validCategories = ['plumbing', 'electrical', 'structural', 'appliance', 'hvac', 'painting', 'cleaning', 'pest_control', 'other'];
  if (!validCategories.includes(category)) {
    return res.status(400).json({ error: "Invalid category", validCategories });
  }
  
  const validPriorities = ['low', 'medium', 'high', 'urgent', 'emergency'];
  if (priority && !validPriorities.includes(priority)) {
    return res.status(400).json({ error: "Invalid priority", validPriorities });
  }
  
  try {
    const tr = await pool.query(
      `SELECT t.id, t.landlord_id, l.unit_id, l.id AS lease_id
       FROM tenant t
       JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
       WHERE t.user_id = $1
       ORDER BY l.lease_start_date DESC
       LIMIT 1`,
      [req.userId]
    );
    
    if (!tr.rows.length) {
      return res.status(404).json({ error: "No active lease found. Please contact your landlord." });
    }
    
    const { id: tenantId, landlord_id, unit_id, lease_id } = tr.rows[0];

    const count = await pool.query("SELECT COUNT(*) FROM maintenance_request");
    const requestNumber = `MR-${String(Number(count.rows[0].count) + 1).padStart(5, "0")}`;

    const result = await pool.query(
      `INSERT INTO maintenance_request (
        tenant_id, landlord_id, unit_id, reported_by, request_number,
        title, description, category, priority, status, 
        created_at, updated_at
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'needs_repair', NOW(), NOW()) 
       RETURNING *`,
      [tenantId, landlord_id, unit_id, req.userId, requestNumber, title, description, category, priority || "medium"]
    );

    const requestId = result.rows[0].id;

    if (photos && Array.isArray(photos) && photos.length > 0) {
      for (const photo of photos) {
        if (!photo.document_url) continue;
        
        const docResult = await pool.query(
          `INSERT INTO document_ (
            tenant_id, uploaded_by, document_type, 
            document_name, document_url, file_size, mime_type
          )
           VALUES ($1, $2, 'maintenance_photo', $3, $4, $5, $6)
           RETURNING id`,
          [tenantId, req.userId, photo.document_name || `Maintenance photo - ${requestNumber}`, photo.document_url, photo.file_size || 0, photo.mime_type || 'image/jpeg']
        );
        
        await pool.query(
          `INSERT INTO maintenance_photo (request_id, document_id, photo_type, uploaded_by)
           VALUES ($1, $2, $3, $4)`,
          [requestId, docResult.rows[0].id, photo.photo_type || 'before', req.userId]
        );
      }
    }

    await pool.query(
      `INSERT INTO maintenance_update (request_id, updated_by, status_from, status_to, notes)
       VALUES ($1, $2, NULL, 'needs_repair', 'Request submitted by tenant')`,
      [requestId, req.userId]
    );

    const unitInfo = await pool.query(
      `SELECT u.unit_number, p.name AS property_name, p.id AS property_id
       FROM unit u
       JOIN property p ON p.id = u.property_id
       WHERE u.id = $1`,
      [unit_id]
    );
    
    const unitNumber = unitInfo.rows[0]?.unit_number || 'Unknown';
    const propertyName = unitInfo.rows[0]?.property_name || 'Unknown';
    const propertyId = unitInfo.rows[0]?.property_id;

    if (propertyId) {
      const caretaker = await pool.query(
        `SELECT u.id, u.email, c.first_name, c.last_name
         FROM user_ u 
         JOIN caretaker c ON c.user_id = u.id
         WHERE c.assigned_property = $1`,
        [propertyId]
      );

      if (caretaker.rows.length) {
        await createNotification(
          caretaker.rows[0].id,
          "maintenance_update",
          "New Maintenance Request",
          `New ${priority || 'medium'} priority request: "${title}" (${category}) - Unit ${unitNumber}, ${propertyName}`,
          requestId,
          "maintenance"
        );
      } else {
        const landlordUser = await pool.query("SELECT user_id FROM landlord WHERE id = $1", [landlord_id]);
        if (landlordUser.rows.length) {
          await createNotification(
            landlordUser.rows[0].user_id,
            "maintenance_update",
            "New Maintenance Request (No Caretaker)",
            `New request: "${title}" (${category}) - No caretaker assigned to ${propertyName}`,
            requestId,
            "maintenance"
          );
        }
      }
    }

    await createNotification(
      req.userId, "maintenance_update", "Request Submitted",
      `Your maintenance request "${title}" (${requestNumber}) has been submitted. We will review it shortly.`,
      requestId, "maintenance"
    );

    res.status(201).json({ 
      message: "Maintenance request submitted successfully",
      request: {
        ...result.rows[0],
        request_number: requestNumber,
        unit_number: unitNumber,
        property_name: propertyName,
        photos_count: photos ? photos.length : 0
      }
    });
    
  } catch (err) {
    console.error("Submit maintenance:", err);
    res.status(500).json({ error: "Server error", details: process.env.NODE_ENV === 'development' ? err.message : undefined });
  }
});

// GET /maintenance - Get all maintenance requests for current user
router.get("/", requireAuth, async (req, res) => {
  try {
    let where, params;
    
    if (req.userRole === "landlord") {
      const lr = await pool.query("SELECT id FROM landlord WHERE user_id = $1", [req.userId]);
      if (!lr.rows.length) return res.status(404).json({ error: "Landlord not found" });
      where = "mr.landlord_id = $1"; 
      params = [lr.rows[0].id];
    } else if (req.userRole === "tenant") {
      const tr = await pool.query("SELECT id FROM tenant WHERE user_id = $1", [req.userId]);
      if (!tr.rows.length) return res.status(404).json({ error: "Tenant not found" });
      where = "mr.tenant_id = $1"; 
      params = [tr.rows[0].id];
    } else {
      return res.status(403).json({ error: "Use /caretaker/maintenance endpoint" });
    }
    
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
       WHERE ${where} 
       ORDER BY mr.created_at DESC`,
      params
    );
    
    res.json({ requests: result.rows });
  } catch (err) {
    console.error("Get maintenance:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /maintenance/:id/confirm - Tenant confirms completion
router.put("/:id/confirm", requireAuth, requireTenant, async (req, res) => {
  try {
    const { id } = req.params;
    const { photos } = req.body;
    const { userId } = req;
    
    const tenant = await pool.query("SELECT id FROM tenant WHERE user_id = $1", [userId]);
    if (!tenant.rows.length) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    
    const requestCheck = await pool.query(
      "SELECT * FROM maintenance_request WHERE id = $1 AND tenant_id = $2 AND status = 'completed'",
      [id, tenant.rows[0].id]
    );
    
    if (!requestCheck.rows.length) {
      return res.status(404).json({ error: "Request not found or not completed yet" });
    }
    
    await pool.query(
      `UPDATE maintenance_request 
       SET status = 'cancelled'::maintenance_status, updated_at = NOW() 
       WHERE id = $1`,
      [id]
    );
    
    await pool.query(
      `INSERT INTO maintenance_update (request_id, updated_by, status_from, status_to, notes)
       VALUES ($1, $2, 'completed'::maintenance_status, 'cancelled'::maintenance_status, 'Tenant confirmed completion - request closed')`,
      [id, userId]
    );
    
    if (photos && Array.isArray(photos) && photos.length > 0) {
      for (const photo of photos) {
        if (!photo.document_url) continue;
        
        const docResult = await pool.query(
          `INSERT INTO document_ (tenant_id, uploaded_by, document_type, document_name, document_url, file_size, mime_type)
           VALUES ($1, $2, 'maintenance_photo', $3, $4, $5, $6) RETURNING id`,
          [tenant.rows[0].id, userId, `After photo - ${id}`, photo.document_url, photo.file_size || 0, photo.mime_type || 'image/jpeg']
        );
        
        await pool.query(
          `INSERT INTO maintenance_photo (request_id, document_id, photo_type, uploaded_by)
           VALUES ($1, $2, 'after', $3)`,
          [id, docResult.rows[0].id, userId]
        );
      }
    }
    
    res.json({ message: "Completion confirmed. Request closed." });
  } catch (err) {
    console.error("Confirm completion:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /maintenance/:id/reopen - Tenant reopens closed or completed request
router.put("/:id/reopen", requireAuth, requireTenant, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { userId } = req;
    
    const tenant = await pool.query("SELECT id FROM tenant WHERE user_id = $1", [userId]);
    if (!tenant.rows.length) {
      return res.status(404).json({ error: "Tenant not found" });
    }
    
    const requestCheck = await pool.query(
      `SELECT mr.*, u.property_id, p.landlord_id 
       FROM maintenance_request mr
       JOIN unit u ON u.id = mr.unit_id
       JOIN property p ON p.id = u.property_id
       WHERE mr.id = $1 AND mr.tenant_id = $2 AND mr.status IN ('completed', 'cancelled')`,
      [id, tenant.rows[0].id]
    );
    
    if (!requestCheck.rows.length) {
      return res.status(404).json({ error: "Request not found or cannot be reopened" });
    }
    
    const currentRequest = requestCheck.rows[0];
    
    await pool.query(
      `UPDATE maintenance_request 
       SET status = 'needs_repair'::maintenance_status, 
           completed_at = NULL,
           contractor_name = NULL,
           contractor_phone = NULL,
           scheduled_date = NULL,
           actual_cost = NULL,
           completion_notes = NULL,
           updated_at = NOW() 
       WHERE id = $1`,
      [id]
    );
    
    await pool.query(
      `INSERT INTO maintenance_update (request_id, updated_by, status_from, status_to, notes)
       VALUES ($1, $2, $3::maintenance_status, 'needs_repair'::maintenance_status, $4::text)`,
      [id, userId, currentRequest.status, reason || "Tenant reopened — issue not resolved"]
    );
    
    const caretaker = await pool.query(
      `SELECT u.id FROM user_ u 
       JOIN caretaker c ON c.user_id = u.id 
       WHERE c.assigned_property = $1`,
      [currentRequest.property_id]
    );
    
    if (caretaker.rows.length) {
      await createNotification(
        caretaker.rows[0].id,
        "maintenance_update",
        "Request Reopened",
        `Tenant reopened: "${currentRequest.title}" — needs attention`,
        id,
        "maintenance"
      );
    }
    
    const landlordUser = await pool.query("SELECT user_id FROM landlord WHERE id = $1", [currentRequest.landlord_id]);
    if (landlordUser.rows.length) {
      await createNotification(
        landlordUser.rows[0].user_id,
        "maintenance_update",
        "Request Reopened by Tenant",
        `"${currentRequest.title}" has been reopened — tenant says issue persists`,
        id,
        "maintenance"
      );
    }
    
    res.json({ message: "Request reopened successfully", newStatus: "needs_repair" });
  } catch (err) {
    console.error("Reopen request:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /maintenance/:id - Get single maintenance request detail (MUST be last)
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT mr.*, 
              t.first_name || ' ' || t.last_name AS tenant_name,
              u.unit_number, 
              p.name AS property_name,
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
       WHERE mr.id = $1`,
      [id]
    );
    
    if (!result.rows.length) {
      return res.status(404).json({ error: "Request not found" });
    }
    
    res.json({ request: result.rows[0] });
  } catch (err) {
    console.error("Get maintenance detail:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
