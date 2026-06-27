const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { createNotification } = require("../utils/notifications");

// GET /landlord/complaints - Landlord views all complaints
router.get("/complaints", requireAuth, async (req, res) => {
  try {
    if (req.userRole !== "landlord") return res.status(403).json({ error: "Access denied" });
    
    const landlord = await pool.query("SELECT id FROM landlord WHERE user_id = $1", [req.userId]);
    if (!landlord.rows.length) return res.status(404).json({ error: "Landlord not found" });
    
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
       WHERE p.landlord_id = $1
       ORDER BY c.created_at DESC`,
      [landlord.rows[0].id]
    );
    
    res.json({ complaints: result.rows });
  } catch (err) {
    console.error("Get landlord complaints:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /landlord/complaints/:id/approve - Landlord approves
router.put("/complaints/:id/approve", requireAuth, async (req, res) => {
  try {
    if (req.userRole !== "landlord") return res.status(403).json({ error: "Access denied" });
    
    const { id } = req.params;
    
    const result = await pool.query(
      "UPDATE complaint SET status = 'approved', updated_at = NOW() WHERE id = $1 AND status IN ('escalated', 'awaiting_clarification') RETURNING *",
      [id]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found or cannot be approved" });
    
    const tenantUser = await pool.query("SELECT user_id FROM tenant WHERE id = $1", [result.rows[0].filed_by_tenant_id]);
    if (tenantUser.rows.length) {
      await createNotification(tenantUser.rows[0].user_id, "complaint_update", "Complaint Approved",
        `Your complaint has been approved.`, id, "complaint");
    }
    
    res.json({ message: "Complaint approved", complaint: result.rows[0] });
  } catch (err) {
    console.error("Approve complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /landlord/complaints/:id/reject - Landlord rejects
router.put("/complaints/:id/reject", requireAuth, async (req, res) => {
  try {
    if (req.userRole !== "landlord") return res.status(403).json({ error: "Access denied" });
    
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason) return res.status(400).json({ error: "Rejection reason is required" });
    
    const result = await pool.query(
      "UPDATE complaint SET status = 'rejected', resolution_notes = $1, resolved_by = $2, resolved_at = NOW(), updated_at = NOW() WHERE id = $3 RETURNING *",
      [reason, req.userId, id]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found" });
    
    const tenantUser = await pool.query("SELECT user_id FROM tenant WHERE id = $1", [result.rows[0].filed_by_tenant_id]);
    if (tenantUser.rows.length) {
      await createNotification(tenantUser.rows[0].user_id, "complaint_update", "Complaint Rejected",
        `Your complaint was not approved.`, id, "complaint");
    }
    
    res.json({ message: "Complaint rejected", complaint: result.rows[0] });
  } catch (err) {
    console.error("Reject complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /landlord/complaints/:id/clarify - Landlord requests clarification
router.put("/complaints/:id/clarify", requireAuth, async (req, res) => {
  try {
    if (req.userRole !== "landlord") return res.status(403).json({ error: "Access denied" });
    
    const { id } = req.params;
    const { request } = req.body;
    
    if (!request) return res.status(400).json({ error: "Clarification request is required" });
    
    const result = await pool.query(
      "UPDATE complaint SET status = 'awaiting_clarification', updated_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found" });
    
    const tenantUser = await pool.query("SELECT user_id FROM tenant WHERE id = $1", [result.rows[0].filed_by_tenant_id]);
    if (tenantUser.rows.length) {
      await createNotification(tenantUser.rows[0].user_id, "complaint_update", "Clarification Needed",
        `The landlord needs more information.`, id, "complaint");
    }
    
    res.json({ message: "Clarification requested", complaint: result.rows[0] });
  } catch (err) {
    console.error("Request clarification:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /landlord/complaints/:id/verdict - Landlord issues verdict
router.put("/complaints/:id/verdict", requireAuth, async (req, res) => {
  try {
    if (req.userRole !== "landlord") return res.status(403).json({ error: "Access denied" });
    
    const { id } = req.params;
    const { type, fineAmount, notes } = req.body;
    
    if (!type || !["warning", "fine", "final_warning", "eviction_notice"].includes(type)) {
      return res.status(400).json({ error: "Valid verdict type required" });
    }
    
    if (type === "fine" && (!fineAmount || isNaN(Number(fineAmount)) || Number(fineAmount) <= 0)) {
      return res.status(400).json({ error: "Valid fine amount required" });
    }
    
    const resolutionNotes = `${type.replace(/_/g, " ")}${fineAmount ? ` | Fine: R${fineAmount}` : ""}${notes ? ` | ${notes}` : ""}`;
    
    const result = await pool.query(
      "UPDATE complaint SET status = 'resolved', resolution_notes = $1, resolved_by = $2, resolved_at = NOW(), updated_at = NOW() WHERE id = $3 AND status = 'approved' RETURNING *",
      [resolutionNotes, req.userId, id]
    );
    
    if (!result.rows.length) return res.status(404).json({ error: "Complaint not found or not approved" });
    
    if (result.rows[0].against_tenant_id) {
      const againstUser = await pool.query("SELECT user_id FROM tenant WHERE id = $1", [result.rows[0].against_tenant_id]);
      if (againstUser.rows.length) {
        await createNotification(againstUser.rows[0].user_id, "complaint_update", "Verdict Issued",
          `A ${type.replace(/_/g, " ")} has been issued against you.`, id, "complaint");
      }
    }
    
    const filedByUser = await pool.query("SELECT user_id FROM tenant WHERE id = $1", [result.rows[0].filed_by_tenant_id]);
    if (filedByUser.rows.length) {
      await createNotification(filedByUser.rows[0].user_id, "complaint_update", "Verdict Issued",
        `A verdict has been issued for your complaint.`, id, "complaint");
    }
    
    res.json({ message: "Verdict issued", complaint: result.rows[0] });
  } catch (err) {
    console.error("Issue verdict:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
