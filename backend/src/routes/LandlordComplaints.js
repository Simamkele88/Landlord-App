const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord } = require("../middleware/roleCheck");
const { createNotification } = require("../utils/notifications");

// GET / - List all complaints for landlord
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlord = await pool.query("SELECT id FROM landlord WHERE user_id = $1", [req.userId]);
    if (!landlord.rows.length) return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT c.*, 
              usr1.full_name AS filed_by_name,
              usr2.full_name AS against_name,
              u.unit_number AS against_unit_number,
              p.name AS property_name,
              cv.verdict_type,
              cv.fine_amount
       FROM complaint c
       LEFT JOIN tenant t1 ON t1.id = c.filed_by_tenant_id
       LEFT JOIN users usr1 ON usr1.id = t1.user_id
       LEFT JOIN tenant t2 ON t2.id = c.against_tenant_id
       LEFT JOIN users usr2 ON usr2.id = t2.user_id
       LEFT JOIN unit u ON u.id = c.against_unit_id
       LEFT JOIN property p ON p.id = c.property_id
       LEFT JOIN complaint_verdict cv ON cv.complaint_id = c.id
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

// GET /:id - Get single complaint detail
router.get("/:id", requireAuth, requireLandlord, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.*, 
              usr1.full_name AS filed_by_name,
              usr1.email AS filed_by_email,
              usr1.phone AS filed_by_phone,
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

    res.json({ complaint: result.rows[0] });
  } catch (err) {
    console.error("Get complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /:id/review - Mark as under review
router.put("/:id/review", requireAuth, requireLandlord, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE complaint SET status = 'under_review', updated_at = NOW() 
       WHERE id = $1 AND status IN ('open', 'escalated', 'awaiting_clarification')
       RETURNING *`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Complaint not found or cannot be reviewed" });
    }

    if (result.rows[0].filed_by) {
      await createNotification(
        result.rows[0].filed_by, "complaint_update", "Complaint Under Review",
        `Your complaint "${result.rows[0].subject}" is being reviewed.`, id, "complaint"
      );
    }

    res.json({ message: "Complaint marked as under review", complaint: result.rows[0] });
  } catch (err) {
    console.error("Review complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /:id/clarify - Request clarification
router.put("/:id/clarify", requireAuth, requireLandlord, async (req, res) => {
  try {
    const { id } = req.params;
    const { clarification_notes } = req.body;

    if (!clarification_notes) {
      return res.status(400).json({ error: "Clarification notes are required" });
    }

    const result = await pool.query(
      `UPDATE complaint SET status = 'awaiting_clarification', clarification_notes = $2, updated_at = NOW() 
       WHERE id = $1 AND status IN ('open', 'under_review', 'escalated')
       RETURNING *`,
      [id, clarification_notes]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Complaint not found or cannot request clarification" });
    }

    if (result.rows[0].filed_by) {
      await createNotification(
        result.rows[0].filed_by, "complaint_update", "Clarification Needed",
        `The landlord needs more information about your complaint: "${result.rows[0].subject}"`,
        id, "complaint"
      );
    }

    res.json({ message: "Clarification requested", complaint: result.rows[0] });
  } catch (err) {
    console.error("Request clarification:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /:id/verdict - Issue verdict
router.put("/:id/verdict", requireAuth, requireLandlord, async (req, res) => {
  try {
    const { id } = req.params;
    const { verdict_type, fine_amount, notes } = req.body;

    if (!verdict_type || !['warning', 'fine', 'dismissed'].includes(verdict_type)) {
      return res.status(400).json({ error: "Valid verdict_type is required (warning, fine, dismissed)" });
    }

    const complaint = await pool.query(
      "SELECT * FROM complaint WHERE id = $1 AND status IN ('open', 'under_review', 'awaiting_clarification', 'approved')",
      [id]
    );

    if (!complaint.rows.length) {
      return res.status(404).json({ error: "Complaint not found or cannot issue verdict" });
    }

    await pool.query("DELETE FROM complaint_verdict WHERE complaint_id = $1", [id]);

    const verdictResult = await pool.query(
      `INSERT INTO complaint_verdict (complaint_id, verdict_type, fine_amount, issued_by, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, verdict_type, fine_amount || null, req.userId, notes || null]
    );

    await pool.query(
      "UPDATE complaint SET status = 'resolved', resolved_by = $2, resolved_at = NOW(), updated_at = NOW() WHERE id = $1",
      [id, req.userId]
    );

    if (complaint.rows[0].filed_by) {
      await createNotification(
        complaint.rows[0].filed_by, "complaint_update", "Complaint Resolved",
        `Your complaint "${complaint.rows[0].subject}" resolved: ${verdict_type.replace(/_/g, ' ')}.`,
        id, "complaint"
      );
    }

    if (complaint.rows[0].against_tenant_id && verdict_type !== 'dismissed') {
      const againstUser = await pool.query(
        "SELECT user_id FROM tenant WHERE id = $1", 
        [complaint.rows[0].against_tenant_id]
      );
      if (againstUser.rows.length) {
        await createNotification(
          againstUser.rows[0].user_id, "complaint_update", "Verdict Issued",
          `A ${verdict_type} has been issued against you: "${complaint.rows[0].subject}"`,
          id, "complaint"
        );
      }
    }

    res.json({ message: "Verdict issued", verdict: verdictResult.rows[0] });
  } catch (err) {
    console.error("Issue verdict:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /:id/reject - Reject complaint
router.put("/:id/reject", requireAuth, requireLandlord, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const result = await pool.query(
      `UPDATE complaint SET status = 'rejected', resolution_notes = $3, resolved_by = $2, resolved_at = NOW(), updated_at = NOW() 
       WHERE id = $1 AND status IN ('open', 'under_review', 'awaiting_clarification', 'escalated')
       RETURNING *`,
      [id, req.userId, reason || 'Complaint rejected by landlord']
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Complaint not found or cannot be rejected" });
    }

    if (result.rows[0].filed_by) {
      await createNotification(
        result.rows[0].filed_by, "complaint_update", "Complaint Rejected",
        `Your complaint "${result.rows[0].subject}" was rejected. Reason: ${reason || 'N/A'}`,
        id, "complaint"
      );
    }

    res.json({ message: "Complaint rejected", complaint: result.rows[0] });
  } catch (err) {
    console.error("Reject complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /:id/resolve - Resolve complaint
router.put("/:id/resolve", requireAuth, requireLandlord, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution_notes } = req.body;

    const result = await pool.query(
      `UPDATE complaint SET status = 'resolved', resolution_notes = $3, resolved_by = $2, resolved_at = NOW(), updated_at = NOW() 
       WHERE id = $1 AND status IN ('open', 'under_review', 'awaiting_clarification', 'approved', 'escalated')
       RETURNING *`,
      [id, req.userId, resolution_notes || 'Complaint resolved by landlord']
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Complaint not found or cannot be resolved" });
    }

    if (result.rows[0].filed_by) {
      await createNotification(
        result.rows[0].filed_by, "complaint_update", "Complaint Resolved",
        `Your complaint "${result.rows[0].subject}" has been resolved.`,
        id, "complaint"
      );
    }

    res.json({ message: "Complaint resolved", complaint: result.rows[0] });
  } catch (err) {
    console.error("Resolve complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /:id/approve - Approve escalated complaint
router.put("/:id/approve", requireAuth, requireLandlord, async (req, res) => {
  try {
    const { id } = req.params;

    const complaint = await pool.query(
      "SELECT * FROM complaint WHERE id = $1 AND status = 'escalated'",
      [id]
    );

    if (!complaint.rows.length) {
      return res.status(404).json({ error: "Complaint not found or not escalated" });
    }

    const existingVerdict = await pool.query(
      "SELECT * FROM complaint_verdict WHERE complaint_id = $1",
      [id]
    );

    if (existingVerdict.rows.length) {
      await pool.query(
        "UPDATE complaint SET status = 'resolved', resolved_by = $2, resolved_at = NOW(), updated_at = NOW() WHERE id = $1",
        [id, req.userId]
      );
    } else {
      await pool.query(
        "UPDATE complaint SET status = 'approved', updated_at = NOW() WHERE id = $1",
        [id]
      );
    }

    const caretaker = await pool.query(
      "SELECT u.id FROM users u JOIN caretaker c ON c.user_id = u.id WHERE c.assigned_property = $1",
      [complaint.rows[0].property_id]
    );

    if (caretaker.rows.length) {
      await createNotification(
        caretaker.rows[0].id, "complaint_update", "Complaint Approved",
        `Landlord approved "${complaint.rows[0].subject}". ${existingVerdict.rows.length ? 'Resolved.' : 'Issue verdict now.'}`,
        id, "complaint"
      );
    }

    if (complaint.rows[0].filed_by) {
      await createNotification(
        complaint.rows[0].filed_by, "complaint_update", "Complaint Approved",
        `Your escalated complaint "${complaint.rows[0].subject}" has been approved.`,
        id, "complaint"
      );
    }

    res.json({ message: "Complaint approved", complaint: complaint.rows[0] });
  } catch (err) {
    console.error("Approve complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /:id/override-verdict - Override verdict on escalated complaint
router.post("/:id/override-verdict", requireAuth, requireLandlord, async (req, res) => {
  try {
    const { id } = req.params;
    const { verdict_type, fine_amount, notes } = req.body;

    if (!verdict_type || !['warning', 'fine', 'dismissed', 'final_warning', 'eviction_notice'].includes(verdict_type)) {
      return res.status(400).json({ error: "Valid verdict_type is required" });
    }

    const complaint = await pool.query(
      "SELECT * FROM complaint WHERE id = $1 AND status = 'escalated'",
      [id]
    );

    if (!complaint.rows.length) {
      return res.status(404).json({ error: "Complaint not found or not escalated" });
    }

    await pool.query("DELETE FROM complaint_verdict WHERE complaint_id = $1", [id]);

    const verdictResult = await pool.query(
      `INSERT INTO complaint_verdict (complaint_id, verdict_type, fine_amount, issued_by, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, verdict_type === 'eviction_notice' ? 'warning' : verdict_type, 
       fine_amount || null, req.userId, notes || null]
    );

    const targetTenantId = complaint.rows[0].against_tenant_id;

    if (targetTenantId) {
      if (verdict_type === 'final_warning') {
        await pool.query(
          "UPDATE tenant SET standing = 'final_warning', standing_updated_at = NOW(), standing_reason = $2, total_warnings = total_warnings + 1 WHERE id = $1",
          [targetTenantId, notes || 'Final warning issued by landlord']
        );
      } else if (verdict_type === 'eviction_notice') {
        await pool.query(
          "UPDATE tenant SET standing = 'eviction_notice', standing_updated_at = NOW(), standing_reason = $2 WHERE id = $1",
          [targetTenantId, notes || 'Eviction notice issued by landlord']
        );
      }

      const targetUser = await pool.query("SELECT user_id FROM tenant WHERE id = $1", [targetTenantId]);
      if (targetUser.rows.length) {
        await createNotification(
          targetUser.rows[0].user_id, "complaint_update", "Verdict Issued",
          `Landlord issued ${verdict_type.replace(/_/g, ' ')} regarding: "${complaint.rows[0].subject}"`,
          id, "complaint"
        );
      }
    }

    await pool.query(
      "UPDATE complaint SET status = 'resolved', resolved_by = $2, resolved_at = NOW(), updated_at = NOW() WHERE id = $1",
      [id, req.userId]
    );

    const caretaker = await pool.query(
      "SELECT u.id FROM users u JOIN caretaker c ON c.user_id = u.id WHERE c.assigned_property = $1",
      [complaint.rows[0].property_id]
    );
    if (caretaker.rows.length) {
      await createNotification(
        caretaker.rows[0].id, "complaint_update", "Verdict Overridden",
        `Landlord overrode verdict on "${complaint.rows[0].subject}" — ${verdict_type.replace(/_/g, ' ')}.`,
        id, "complaint"
      );
    }

    if (complaint.rows[0].filed_by) {
      await createNotification(
        complaint.rows[0].filed_by, "complaint_update", "Complaint Resolved",
        `Your complaint "${complaint.rows[0].subject}" resolved by landlord.`,
        id, "complaint"
      );
    }

    res.json({ message: "Verdict overridden", verdict: verdictResult.rows[0] });
  } catch (err) {
    console.error("Override verdict:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /:id/reject-escalation - Return escalated complaint to caretaker
router.put("/:id/reject-escalation", requireAuth, requireLandlord, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await pool.query(
      `UPDATE complaint SET status = 'under_review', updated_at = NOW() 
       WHERE id = $1 AND status = 'escalated' 
       RETURNING *`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Complaint not found or not escalated" });
    }

    const caretaker = await pool.query(
      "SELECT u.id FROM users u JOIN caretaker c ON c.user_id = u.id WHERE c.assigned_property = $1",
      [result.rows[0].property_id]
    );
    if (caretaker.rows.length) {
      await createNotification(
        caretaker.rows[0].id, "complaint_update", "Escalation Rejected",
        `Landlord returned "${result.rows[0].subject}" to you. ${notes || ''}`,
        id, "complaint"
      );
    }

    res.json({ message: "Escalation rejected — returned to caretaker", complaint: result.rows[0] });
  } catch (err) {
    console.error("Reject escalation:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;