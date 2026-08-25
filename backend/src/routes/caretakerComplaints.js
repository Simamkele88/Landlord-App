const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireCaretaker } = require("../middleware/roleCheck");
const { createNotification } = require("../utils/notifications");

async function getCaretakerProperty(userId) {
  const result = await pool.query(
    "SELECT id, assigned_property FROM caretaker WHERE user_id = $1",
    [userId],
  );
  return result.rows[0] || null;
}

async function verifyComplaintAccess(complaintId, propertyId) {
  const result = await pool.query(
    "SELECT * FROM complaint WHERE id = $1 AND property_id = $2",
    [complaintId, propertyId],
  );
  return result.rows[0] || null;
}

async function createFineInvoice(
  tenantId,
  landlordId,
  fineAmount,
  reqUserId,
  complaintSubject,
) {
  const leaseRes = await pool.query(
    `SELECT id, unit_id
     FROM lease
     WHERE tenant_id = $1
       AND status = 'active'
     ORDER BY lease_start_date DESC
     LIMIT 1`,
    [tenantId],
  );

  if (!leaseRes.rows.length) return null;

  const lease = leaseRes.rows[0];
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  const invoiceNumber = `INV-FINE-${Date.now()}`;

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
      new Date().toISOString().slice(0, 10),
      new Date(dueDate).toISOString().slice(0, 10),
      dueDate.toISOString().slice(0, 10),
      `Fine: ${complaintSubject || "Complaint fine"}`,
    ],
  );

  return result.rows[0].id;
}

// GET /caretaker/complaints - Get all complaints for the caretaker's assigned property
router.get("/", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const cr = await getCaretakerProperty(req.userId);
    if (!cr) return res.status(404).json({ error: "Caretaker not found" });

    if (!cr.assigned_property) {
      return res.json({
        complaints: [],
        property: null,
        message: "No property assigned yet. Please contact your landlord.",
      });
    }

    const property = await pool.query(
      "SELECT id, name, property_type, address_line1, city FROM property WHERE id = $1",
      [cr.assigned_property],
    );

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
       WHERE c.property_id = $1
       ORDER BY c.created_at DESC`,
      [cr.assigned_property],
    );

    res.json({
      complaints: result.rows,
      property: property.rows[0] || null,
      caretaker_id: cr.id,
    });
  } catch (err) {
    console.error("Get caretaker complaints:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/stats", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const cr = await getCaretakerProperty(req.userId);
    if (!cr || !cr.assigned_property) {
      return res.status(404).json({ error: "No property assigned" });
    }

    const [mostComplainedAbout, mostActiveFilers] = await Promise.all([
      pool.query(
        `SELECT c.against_tenant_id AS tenant_id, usr.full_name, u.unit_number,
                COUNT(*)::int AS complaint_count,
                COUNT(DISTINCT c.filed_by_tenant_id)::int AS distinct_filers
         FROM complaint c
         JOIN tenant t ON t.id = c.against_tenant_id
         JOIN users usr ON usr.id = t.user_id
         LEFT JOIN unit u ON u.id = c.against_unit_id
         WHERE c.property_id = $1 AND c.against_tenant_id IS NOT NULL
         GROUP BY c.against_tenant_id, usr.full_name, u.unit_number
         ORDER BY complaint_count DESC
         LIMIT 10`,
        [cr.assigned_property],
      ),
      pool.query(
        `SELECT c.filed_by_tenant_id AS tenant_id, usr.full_name,
                COUNT(*)::int AS filed_count,
                COUNT(DISTINCT c.against_tenant_id)::int AS distinct_targets
         FROM complaint c
         JOIN tenant t ON t.id = c.filed_by_tenant_id
         JOIN users usr ON usr.id = t.user_id
         WHERE c.property_id = $1
         GROUP BY c.filed_by_tenant_id, usr.full_name
         ORDER BY filed_count DESC
         LIMIT 10`,
        [cr.assigned_property],
      ),
    ]);

    res.json({
      most_complained_about: mostComplainedAbout.rows,
      most_active_filers: mostActiveFilers.rows,
    });
  } catch (err) {
    console.error("Get complaint stats ranking:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get(
  "/stats/:tenantId",
  requireAuth,
  requireCaretaker,
  async (req, res) => {
    try {
      const { tenantId } = req.params;

      const cr = await getCaretakerProperty(req.userId);
      if (!cr || !cr.assigned_property) {
        return res.status(404).json({ error: "No property assigned" });
      }

      const result = await pool.query(
        `SELECT
         (SELECT COUNT(*) FROM complaint WHERE against_tenant_id = $1 AND property_id = $2) AS times_complained_about,
         (SELECT COUNT(*) FROM complaint WHERE filed_by_tenant_id = $1 AND property_id = $2) AS times_filed,
         (SELECT COUNT(DISTINCT against_tenant_id) FROM complaint 
            WHERE filed_by_tenant_id = $1 AND property_id = $2 AND against_tenant_id IS NOT NULL) AS distinct_people_filed_against,
         (SELECT COUNT(DISTINCT filed_by_tenant_id) FROM complaint 
            WHERE against_tenant_id = $1 AND property_id = $2) AS distinct_people_complained_by`,
        [tenantId, cr.assigned_property],
      );

      res.json({ stats: result.rows[0] });
    } catch (err) {
      console.error("Get tenant complaint stats:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// GET /caretaker/complaints/:id - Get single complaint detail
router.get("/:id", requireAuth, requireCaretaker, async (req, res) => {
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

// PUT /caretaker/complaints/:id/review - Mark as under review
router.put("/:id/review", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const cr = await getCaretakerProperty(req.userId);

    // Verify property ownership
    const complaint = await verifyComplaintAccess(id, cr.assigned_property);
    if (!complaint) {
      return res
        .status(403)
        .json({ error: "This complaint is not in your assigned property" });
    }
    if (complaint.status !== "open") {
      return res
        .status(400)
        .json({ error: `Complaint is already ${complaint.status}` });
    }

    const result = await pool.query(
      "UPDATE complaint SET status = 'under_review', updated_at = NOW() WHERE id = $1 AND status = 'open' RETURNING *",
      [id],
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: "Complaint not found or not open" });
    }

    if (result.rows[0].filed_by) {
      await createNotification(
        result.rows[0].filed_by,
        "complaint_update",
        "Complaint Under Review",
        `Your complaint "${result.rows[0].subject}" is now being reviewed by the caretaker.`,
        id,
        "complaint",
      );
    }

    res.json({ message: "Complaint under review", complaint: result.rows[0] });
  } catch (err) {
    console.error("Review complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /caretaker/complaints/:id/clarify - Request clarification from tenant
router.put("/:id/clarify", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const { clarification_notes } = req.body;

    if (!clarification_notes) {
      return res.status(400).json({ error: "Clarification notes required" });
    }

    const cr = await getCaretakerProperty(req.userId);
    const complaintCheck = await verifyComplaintAccess(
      id,
      cr.assigned_property,
    );
    if (!complaintCheck) {
      return res
        .status(403)
        .json({ error: "This complaint is not in your assigned property" });
    }

    const result = await pool.query(
      `UPDATE complaint 
       SET status = 'awaiting_clarification', 
           clarification_requested = true,
           clarification_notes = $2, 
           updated_at = NOW() 
       WHERE id = $1 AND status IN ('open', 'under_review') 
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
        `The caretaker needs more information about your complaint "${result.rows[0].subject}". Please provide clarification.`,
        id,
        "complaint",
      );
    }

    res.json({ message: "Clarification requested", complaint: result.rows[0] });
  } catch (err) {
    console.error("Clarify complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /caretaker/complaints/:id/reject - Reject complaint
router.put("/:id/reject", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason)
      return res.status(400).json({ error: "Rejection reason required" });

    const cr = await getCaretakerProperty(req.userId);
    const complaintCheck = await verifyComplaintAccess(
      id,
      cr.assigned_property,
    );
    if (!complaintCheck) {
      return res
        .status(403)
        .json({ error: "This complaint is not in your assigned property" });
    }

    const result = await pool.query(
      `UPDATE complaint 
       SET status = 'rejected', 
           resolution_notes = $2, 
           resolved_by = $3, 
           resolved_at = NOW(), 
           updated_at = NOW() 
       WHERE id = $1 AND status IN ('open', 'under_review', 'awaiting_clarification') 
       RETURNING *`,
      [id, reason, req.userId],
    );

    if (!result.rows.length) {
      return res
        .status(404)
        .json({ error: "Complaint not found or cannot be rejected" });
    }

    const complaint = result.rows[0];

    if (complaint.filed_by) {
      await createNotification(
        complaint.filed_by,
        "complaint_update",
        "Complaint Rejected",
        `Your complaint "${complaint.subject}" was rejected. Reason: ${reason}`,
        id,
        "complaint",
      );
    }

    if (complaint.against_tenant_id) {
      const target = await pool.query(
        "SELECT user_id FROM tenant WHERE id = $1",
        [complaint.against_tenant_id],
      );
      if (target.rows.length) {
        await createNotification(
          target.rows[0].user_id,
          "complaint_update",
          "Complaint Dismissed",
          `A complaint against you regarding "${complaint.subject}" has been rejected.`,
          id,
          "complaint",
        );
      }
    }

    res.json({ message: "Complaint rejected", complaint });
  } catch (err) {
    console.error("Reject complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /caretaker/complaints/:id/verdict - Issue verdict
router.post("/:id/verdict", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const { verdict_type, fine_amount, notes } = req.body;

    if (
      !verdict_type ||
      !["warning", "fine", "dismissed"].includes(verdict_type)
    ) {
      return res.status(400).json({
        error: "Valid verdict_type (warning, fine, dismissed) is required",
      });
    }

    if (verdict_type === "fine" && (!fine_amount || Number(fine_amount) <= 0)) {
      return res
        .status(400)
        .json({ error: "Fine amount is required for fine verdicts" });
    }

    const cr = await getCaretakerProperty(req.userId);
    const complaintCheck = await verifyComplaintAccess(
      id,
      cr.assigned_property,
    );
    if (!complaintCheck) {
      return res
        .status(403)
        .json({ error: "This complaint is not in your assigned property" });
    }

    const complaint = await pool.query(
      "SELECT * FROM complaint WHERE id = $1 AND status IN ('open', 'under_review', 'awaiting_clarification', 'approved')",
      [id],
    );
    if (!complaint.rows.length) {
      return res
        .status(404)
        .json({ error: "Complaint not found or cannot receive verdict" });
    }

    const targetTenantId = complaint.rows[0].against_tenant_id;
    const complaintSubject = complaint.rows[0].subject;

    const verdictResult = await pool.query(
      `INSERT INTO complaint_verdict (complaint_id, verdict_type, fine_amount, issued_by, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        id,
        verdict_type,
        verdict_type === "fine" ? Number(fine_amount) : null,
        req.userId,
        notes || null,
      ],
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
          cr.landlord_id,
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
      `UPDATE complaint SET status = $2, resolved_by = $3, resolved_at = NOW(), resolution_notes = $4, updated_at = NOW()
       WHERE id = $1`,
      [id, newStatus, req.userId, notes || `Verdict: ${verdict_type}`],
    );

    if (targetTenantId) {
      const targetUser = await pool.query(
        "SELECT user_id FROM tenant WHERE id = $1",
        [targetTenantId],
      );
      if (targetUser.rows.length) {
        const labels = {
          warning: "A warning has been issued against you",
          fine: `A fine of R${Number(fine_amount).toLocaleString("en-ZA")} has been issued against you`,
          dismissed: "The complaint against you has been dismissed",
        };
        await createNotification(
          targetUser.rows[0].user_id,
          "complaint_update",
          verdict_type === "dismissed"
            ? "Complaint Dismissed"
            : "Verdict Issued",
          `${labels[verdict_type]} regarding: "${complaintSubject}". ${notes || ""}`,
          id,
          "complaint",
        );
      }
    }

    if (complaint.rows[0].filed_by) {
      const labels = {
        warning: "A warning was issued against the tenant",
        fine: `A fine of R${Number(fine_amount).toLocaleString("en-ZA")} was issued against the tenant`,
        dismissed: "The complaint was dismissed - no action taken",
      };
      await createNotification(
        complaint.rows[0].filed_by,
        "complaint_update",
        "Complaint Resolved",
        `${labels[verdict_type]} for your complaint "${complaintSubject}". ${notes || ""}`,
        id,
        "complaint",
      );
    }

    const landlord = await pool.query(
      `SELECT u.id FROM users u
       JOIN landlord l ON l.user_id = u.id
       JOIN property p ON p.landlord_id = l.id
       WHERE p.id = $1`,
      [complaint.rows[0].property_id],
    );
    if (landlord.rows.length) {
      await createNotification(
        landlord.rows[0].id,
        "complaint_update",
        "Complaint Resolved",
        `Caretaker resolved complaint "${complaintSubject}" — ${verdict_type} issued.${fine_amount ? ` Fine: R${Number(fine_amount).toLocaleString("en-ZA")}` : ""}`,
        id,
        "complaint",
      );
    }

    res.status(201).json({
      message: "Verdict issued",
      verdict: verdictResult.rows[0],
    });
  } catch (err) {
    console.error("Issue verdict:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /caretaker/complaints/:id/escalate - Escalate to landlord
router.put("/:id/escalate", requireAuth, requireCaretaker, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason)
      return res.status(400).json({ error: "Escalation reason is required" });

    const cr = await getCaretakerProperty(req.userId);
    const complaintCheck = await verifyComplaintAccess(
      id,
      cr.assigned_property,
    );
    if (!complaintCheck) {
      return res
        .status(403)
        .json({ error: "This complaint is not in your assigned property" });
    }

    const result = await pool.query(
      `UPDATE complaint 
       SET status = 'escalated', 
           updated_at = NOW() 
       WHERE id = $1 AND status IN ('open', 'under_review', 'awaiting_clarification', 'approved') 
       RETURNING *`,
      [id],
    );

    if (!result.rows.length) {
      return res
        .status(404)
        .json({ error: "Complaint not found or cannot be escalated" });
    }

    const landlord = await pool.query(
      "SELECT u.id FROM users u JOIN landlord l ON l.user_id = u.id JOIN property p ON p.landlord_id = l.id WHERE p.id = $1",
      [result.rows[0].property_id],
    );
    if (landlord.rows.length) {
      await createNotification(
        landlord.rows[0].id,
        "complaint_update",
        "Complaint Escalated",
        `Caretaker escalated complaint "${result.rows[0].subject}" — requires your decision. Reason: ${reason}`,
        id,
        "complaint",
      );
    }

    if (result.rows[0].filed_by) {
      await createNotification(
        result.rows[0].filed_by,
        "complaint_update",
        "Complaint Escalated",
        `Your complaint "${result.rows[0].subject}" has been escalated to the landlord for review.`,
        id,
        "complaint",
      );
    }

    res.json({
      message: "Complaint escalated to landlord",
      complaint: result.rows[0],
    });
  } catch (err) {
    console.error("Escalate complaint:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
