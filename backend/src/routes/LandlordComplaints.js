const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord } = require("../middleware/roleCheck");
const { createNotification } = require("../utils/notifications");

async function createFineInvoice(
  tenantId,
  landlordId,
  fineAmount,
  reqUserId,
  complaintSubject,
) {
  const leaseRes = await pool.query(
    `SELECT id, unit_id, landlord_id
     FROM lease
     WHERE tenant_id = $1
       AND status = 'active'
     ORDER BY lease_start_date DESC
     LIMIT 1`,
    [tenantId],
  );

  if (!leaseRes.rows.length) {
    console.warn(
      `No active lease found for tenant ${tenantId}; fine invoice skipped.`,
    );
    return null;
  }

  const lease = leaseRes.rows[0];

  const invoiceNumber = `INV-FINE-${Date.now()}`;
  const billingStart = new Date();
  const billingEnd = new Date(billingStart);
  billingEnd.setDate(billingEnd.getDate() + 7);
  const dueDate = new Date(billingStart);
  dueDate.setDate(dueDate.getDate() + 7);

  const result = await pool.query(
    `INSERT INTO invoice (
       lease_id, tenant_id, unit_id, landlord_id,
       invoice_number, amount_due,
       rent_amount, utilities_amount, late_fees, other_charges, discounts,
       billing_period_start, billing_period_end, due_date,
       status, paid_amount, invoice_type, notes
     ) VALUES ($1, $2, $3, $4, $5, $6, 0, 0, 0, $6, 0, $7, $8, $9, 'sent', 0, 'fine', $10)
     RETURNING id`,
    [
      lease.id,
      tenantId,
      lease.unit_id,
      landlordId,
      invoiceNumber,
      fineAmount,
      billingStart.toISOString().slice(0, 10),
      billingEnd.toISOString().slice(0, 10),
      dueDate.toISOString().slice(0, 10),
      `Fine: ${complaintSubject || "Complaint fine"}`,
    ],
  );

  return result.rows[0].id;
}

// GET / - List all complaints with stats
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlord = await pool.query(
      "SELECT id FROM landlord WHERE user_id = $1",
      [req.userId],
    );
    if (!landlord.rows.length)
      return res.status(404).json({ error: "Landlord not found" });

    const landlordId = landlord.rows[0].id;

    // Main complaints list
    const complaintsRes = await pool.query(
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
      [landlordId],
    );

    const statsRes = await pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE c.status = 'open') AS open,
         COUNT(*) FILTER (WHERE c.status = 'under_review') AS under_review,
         COUNT(*) FILTER (WHERE c.status = 'awaiting_clarification') AS awaiting_clarification,
         COUNT(*) FILTER (WHERE c.status = 'approved') AS approved,
         COUNT(*) FILTER (WHERE c.status = 'escalated') AS escalated,
         COUNT(*) FILTER (WHERE c.status = 'resolved') AS resolved,
         COUNT(*) FILTER (WHERE c.status = 'rejected') AS rejected,
         COUNT(*) FILTER (WHERE c.status = 'dismissed') AS dismissed,
         COUNT(*) FILTER (WHERE cv.verdict_type = 'warning') AS warnings,
         COUNT(*) FILTER (WHERE cv.verdict_type = 'fine') AS fines,
         COALESCE(SUM(cv.fine_amount) FILTER (WHERE cv.verdict_type = 'fine'), 0) AS total_fines_amount
       FROM complaint c
       LEFT JOIN complaint_verdict cv ON cv.complaint_id = c.id
       LEFT JOIN property p ON p.id = c.property_id
       WHERE p.landlord_id = $1`,
      [landlordId],
    );

    res.json({
      complaints: complaintsRes.rows,
      stats: statsRes.rows[0] || {},
    });
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
      [id],
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
      [id],
    );

    if (!result.rows.length) {
      return res
        .status(404)
        .json({ error: "Complaint not found or cannot be reviewed" });
    }

    if (result.rows[0].filed_by) {
      await createNotification(
        result.rows[0].filed_by,
        "complaint_update",
        "Complaint Under Review",
        `Your complaint "${result.rows[0].subject}" is being reviewed.`,
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
});

// PUT /:id/clarify - Request clarification
router.put("/:id/clarify", requireAuth, requireLandlord, async (req, res) => {
  try {
    const { id } = req.params;
    const { clarification_notes } = req.body;

    if (!clarification_notes) {
      return res
        .status(400)
        .json({ error: "Clarification notes are required" });
    }

    const result = await pool.query(
      `UPDATE complaint SET status = 'awaiting_clarification', clarification_notes = $2, updated_at = NOW() 
       WHERE id = $1 AND status IN ('open', 'under_review', 'escalated')
       RETURNING *`,
      [id, clarification_notes],
    );

    if (!result.rows.length) {
      return res
        .status(404)
        .json({ error: "Complaint not found or cannot request clarification" });
    }

    if (result.rows[0].filed_by) {
      await createNotification(
        result.rows[0].filed_by,
        "complaint_update",
        "Clarification Needed",
        `The landlord needs more information about your complaint: "${result.rows[0].subject}"`,
        id,
        "complaint",
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

    if (
      !verdict_type ||
      !["warning", "fine", "dismissed"].includes(verdict_type)
    ) {
      return res
        .status(400)
        .json({
          error: "Valid verdict_type is required (warning, fine, dismissed)",
        });
    }

    const landlordRes = await pool.query(
      "SELECT id FROM landlord WHERE user_id = $1",
      [req.userId],
    );
    const landlordId = landlordRes.rows[0]?.id;
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const complaint = await pool.query(
      "SELECT * FROM complaint WHERE id = $1 AND status IN ('open', 'under_review', 'awaiting_clarification', 'approved')",
      [id],
    );
    if (!complaint.rows.length) {
      return res
        .status(404)
        .json({ error: "Complaint not found or cannot issue verdict" });
    }

    const targetTenantId = complaint.rows[0].against_tenant_id;
    const complaintSubject = complaint.rows[0].subject;

    await pool.query("DELETE FROM complaint_verdict WHERE complaint_id = $1", [
      id,
    ]);

    const verdictResult = await pool.query(
      `INSERT INTO complaint_verdict (complaint_id, verdict_type, fine_amount, issued_by, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [id, verdict_type, fine_amount || null, req.userId, notes || null],
    );

    if (targetTenantId) {
      if (verdict_type === "warning") {
        await pool.query(
          `UPDATE tenant SET total_warnings = total_warnings + 1, updated_at = NOW()
           WHERE id = $1`,
          [targetTenantId],
        );
      } else if (verdict_type === "fine") {
        await pool.query(
          `UPDATE tenant SET total_fines = COALESCE(total_fines, 0) + $2, updated_at = NOW()
           WHERE id = $1`,
          [targetTenantId, fine_amount || 0],
        );

        await createFineInvoice(
          targetTenantId,
          landlordId,
          fine_amount,
          req.userId,
          complaintSubject,
        );
      }

      await pool.query(`SELECT public.recalculate_tenant_score($1, $2)`, [
        targetTenantId,
        req.userId,
      ]);
    }

    const newStatus = verdict_type === "dismissed" ? "dismissed" : "resolved";
    await pool.query(
      "UPDATE complaint SET status = $2, resolved_by = $3, resolved_at = NOW(), resolution_notes = $4, updated_at = NOW() WHERE id = $1",
      [id, newStatus, req.userId, notes || `Verdict: ${verdict_type}`],
    );

    if (complaint.rows[0].filed_by) {
      await createNotification(
        complaint.rows[0].filed_by,
        "complaint_update",
        "Complaint Resolved",
        `Your complaint "${complaintSubject}" resolved: ${verdict_type.replace(/_/g, " ")}.`,
        id,
        "complaint",
      );
    }

    if (targetTenantId && verdict_type !== "dismissed") {
      const againstUser = await pool.query(
        "SELECT user_id FROM tenant WHERE id = $1",
        [targetTenantId],
      );
      if (againstUser.rows.length) {
        await createNotification(
          againstUser.rows[0].user_id,
          "complaint_update",
          "Verdict Issued",
          `A ${verdict_type} has been issued against you: "${complaintSubject}"`,
          id,
          "complaint",
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
      [id, req.userId, reason || "Complaint rejected by landlord"],
    );

    if (!result.rows.length) {
      return res
        .status(404)
        .json({ error: "Complaint not found or cannot be rejected" });
    }

    if (result.rows[0].filed_by) {
      await createNotification(
        result.rows[0].filed_by,
        "complaint_update",
        "Complaint Rejected",
        `Your complaint "${result.rows[0].subject}" was rejected. Reason: ${reason || "N/A"}`,
        id,
        "complaint",
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
      [id, req.userId, resolution_notes || "Complaint resolved by landlord"],
    );

    if (!result.rows.length) {
      return res
        .status(404)
        .json({ error: "Complaint not found or cannot be resolved" });
    }

    if (result.rows[0].filed_by) {
      await createNotification(
        result.rows[0].filed_by,
        "complaint_update",
        "Complaint Resolved",
        `Your complaint "${result.rows[0].subject}" has been resolved.`,
        id,
        "complaint",
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
      [id],
    );

    if (!complaint.rows.length) {
      return res
        .status(404)
        .json({ error: "Complaint not found or not escalated" });
    }

    const existingVerdict = await pool.query(
      "SELECT * FROM complaint_verdict WHERE complaint_id = $1",
      [id],
    );

    if (existingVerdict.rows.length) {
      await pool.query(
        "UPDATE complaint SET status = 'resolved', resolved_by = $2, resolved_at = NOW(), updated_at = NOW() WHERE id = $1",
        [id, req.userId],
      );
    } else {
      await pool.query(
        "UPDATE complaint SET status = 'approved', updated_at = NOW() WHERE id = $1",
        [id],
      );
    }

    if (existingVerdict.rows.length && complaint.rows[0].against_tenant_id) {
      await pool.query(`SELECT public.recalculate_tenant_score($1, $2)`, [
        complaint.rows[0].against_tenant_id,
        req.userId,
      ]);
    }

    const caretaker = await pool.query(
      "SELECT u.id FROM users u JOIN caretaker c ON c.user_id = u.id WHERE c.assigned_property = $1",
      [complaint.rows[0].property_id],
    );

    if (caretaker.rows.length) {
      await createNotification(
        caretaker.rows[0].id,
        "complaint_update",
        "Complaint Approved",
        `Landlord approved "${complaint.rows[0].subject}". ${existingVerdict.rows.length ? "Resolved." : "Issue verdict now."}`,
        id,
        "complaint",
      );
    }

    if (complaint.rows[0].filed_by) {
      await createNotification(
        complaint.rows[0].filed_by,
        "complaint_update",
        "Complaint Approved",
        `Your escalated complaint "${complaint.rows[0].subject}" has been approved.`,
        id,
        "complaint",
      );
    }

    res.json({ message: "Complaint approved", complaint: complaint.rows[0] });
  } catch (err) {
    console.error("Approve complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post(
  "/:id/override-verdict",
  requireAuth,
  requireLandlord,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { verdict_type, fine_amount, notes } = req.body;

      if (
        !verdict_type ||
        ![
          "warning",
          "fine",
          "dismissed",
          "final_warning",
          "eviction_notice",
        ].includes(verdict_type)
      ) {
        return res
          .status(400)
          .json({ error: "Valid verdict_type is required" });
      }

      const complaint = await pool.query(
        "SELECT * FROM complaint WHERE id = $1 AND status = 'escalated'",
        [id],
      );

      if (!complaint.rows.length) {
        return res
          .status(404)
          .json({ error: "Complaint not found or not escalated" });
      }

      const landlord = await pool.query(
        "SELECT id FROM landlord WHERE user_id = $1",
        [req.userId],
      );
      const landlordId = landlord.rows[0]?.id;

      if (!landlordId) {
        return res.status(404).json({ error: "Landlord not found" });
      }

      await pool.query(
        "DELETE FROM complaint_verdict WHERE complaint_id = $1",
        [id],
      );

      const verdictResult = await pool.query(
        `INSERT INTO complaint_verdict (complaint_id, verdict_type, fine_amount, issued_by, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          id,
          verdict_type === "eviction_notice" ? "warning" : verdict_type,
          fine_amount || null,
          req.userId,
          notes || null,
        ],
      );

      const targetTenantId = complaint.rows[0].against_tenant_id;
      const complaintSubject = complaint.rows[0].subject;

      if (targetTenantId) {
        if (verdict_type === "warning") {
          await pool.query(
            `UPDATE tenant SET total_warnings = total_warnings + 1, updated_at = NOW()
             WHERE id = $1`,
            [targetTenantId],
          );
        } else if (verdict_type === "fine") {
          await pool.query(
            `UPDATE tenant SET total_fines = COALESCE(total_fines, 0) + $2, updated_at = NOW()
             WHERE id = $1`,
            [targetTenantId, fine_amount || 0],
          );

          await createFineInvoice(
            targetTenantId,
            landlordId,
            fine_amount,
            req.userId,
            complaintSubject,
          );
        } else if (verdict_type === "final_warning") {
          await pool.query(
            `UPDATE tenant SET standing = 'final_warning', standing_updated_at = NOW(), standing_reason = $2, total_warnings = total_warnings + 1 WHERE id = $1`,
            [targetTenantId, notes || "Final warning issued by landlord"],
          );
        } else if (verdict_type === "eviction_notice") {
          await pool.query(
            `UPDATE tenant SET standing = 'eviction_notice', standing_updated_at = NOW(), standing_reason = $2 WHERE id = $1`,
            [targetTenantId, notes || "Eviction notice issued by landlord"],
          );
        }

        await pool.query(`SELECT public.recalculate_tenant_score($1, $2)`, [
          targetTenantId,
          req.userId,
        ]);
      }

      if (targetTenantId) {
        const targetUser = await pool.query(
          "SELECT user_id FROM tenant WHERE id = $1",
          [targetTenantId],
        );
        if (targetUser.rows.length) {
          await createNotification(
            targetUser.rows[0].user_id,
            "complaint_update",
            "Verdict Issued",
            `Landlord issued ${verdict_type.replace(/_/g, " ")} regarding: "${complaintSubject}"`,
            id,
            "complaint",
          );
        }
      }

      await pool.query(
        "UPDATE complaint SET status = 'resolved', resolved_by = $2, resolved_at = NOW(), updated_at = NOW() WHERE id = $1",
        [id, req.userId],
      );

      const caretaker = await pool.query(
        "SELECT u.id FROM users u JOIN caretaker c ON c.user_id = u.id WHERE c.assigned_property = $1",
        [complaint.rows[0].property_id],
      );
      if (caretaker.rows.length) {
        await createNotification(
          caretaker.rows[0].id,
          "complaint_update",
          "Verdict Overridden",
          `Landlord overrode verdict on "${complaintSubject}" — ${verdict_type.replace(/_/g, " ")}.`,
          id,
          "complaint",
        );
      }

      if (complaint.rows[0].filed_by) {
        await createNotification(
          complaint.rows[0].filed_by,
          "complaint_update",
          "Complaint Resolved",
          `Your complaint "${complaintSubject}" resolved by landlord.`,
          id,
          "complaint",
        );
      }

      res.json({
        message: "Verdict overridden",
        verdict: verdictResult.rows[0],
      });
    } catch (err) {
      console.error("Override verdict:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// PUT /:id/reject-escalation - Return escalated complaint to caretaker
router.put(
  "/:id/reject-escalation",
  requireAuth,
  requireLandlord,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;

      const result = await pool.query(
        `UPDATE complaint SET status = 'under_review', updated_at = NOW() 
       WHERE id = $1 AND status = 'escalated' 
       RETURNING *`,
        [id],
      );

      if (!result.rows.length) {
        return res
          .status(404)
          .json({ error: "Complaint not found or not escalated" });
      }

      const caretaker = await pool.query(
        "SELECT u.id FROM users u JOIN caretaker c ON c.user_id = u.id WHERE c.assigned_property = $1",
        [result.rows[0].property_id],
      );
      if (caretaker.rows.length) {
        await createNotification(
          caretaker.rows[0].id,
          "complaint_update",
          "Escalation Rejected",
          `Landlord returned "${result.rows[0].subject}" to you. ${notes || ""}`,
          id,
          "complaint",
        );
      }

      res.json({
        message: "Escalation rejected — returned to caretaker",
        complaint: result.rows[0],
      });
    } catch (err) {
      console.error("Reject escalation:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

/*GET Function to collect the stats for a caretaker
 * 1. gets all complaints againts a tenant
 * 2. gets all complaints filed by tenant
 * 3. gets all complaints filed for different people
 * 4. gets all complaints against for different peopl
 */
router.get(
  "/stats/:tenantId",
  requireAuth,
  requireLandlord,
  async (req, res) => {
    try {
      const { tenantId } = req.params;

      const result = await pool.query(
        `SELECT
         (SELECT COUNT(*) FROM complaint WHERE against_tenant_id = $1) AS times_complained_about,
         (SELECT COUNT(*) FROM complaint WHERE filed_by_tenant_id = $1) AS times_filed,
         (SELECT COUNT(DISTINCT against_tenant_id) FROM complaint 
            WHERE filed_by_tenant_id = $1 AND against_tenant_id IS NOT NULL) AS distinct_people_filed_against,
         (SELECT COUNT(DISTINCT filed_by_tenant_id) FROM complaint 
            WHERE against_tenant_id = $1) AS distinct_people_complained_by`,
        [tenantId],
      );

      res.json({ stats: result.rows[0] });
    } catch (err) {
      console.error("Get tenant complaint stats:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

module.exports = router;
