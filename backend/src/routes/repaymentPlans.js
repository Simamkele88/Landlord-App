const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord } = require("../middleware/roleCheck");
const { requireTenant } = require("../middleware/roleCheck");
const { auditLog } = require("../utils/audit");
const { createNotification } = require("../utils/notifications");

async function getLandlordId(userId) {
  const result = await pool.query(
    "SELECT id FROM landlord WHERE user_id = $1",
    [userId],
  );
  return result.rows[0]?.id || null;
}

async function getTenantId(userId) {
  const result = await pool.query("SELECT id FROM tenant WHERE user_id = $1", [
    userId,
  ]);
  return result.rows[0]?.id || null;
}

function localDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function shapeInstalment(inst) {
  return {
    id: inst.id,
    instalment_number: inst.instalment_number,
    due_date: inst.due_date,
    amount: Number(inst.amount_due || 0),
    amount_paid: Number(inst.amount_paid || 0),
    status: inst.status || "pending",
    paid_date: inst.paid_date || null,
  };
}

async function createPlanWithInstalments({
  landlordId,
  tenantId,
  totalAmount,
  instalments,
  frequency,
  startDate,
  status,
  createdBy,
  note,
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const amountPerPeriod = Math.round(totalAmount / instalments);

    const planResult = await client.query(
      `INSERT INTO repayment_plan (
        landlord_id, tenant_id, total_amount, instalments,
        amount_per_period, frequency, start_date, status, created_by, tenant_note,
        created_at, updated_at
   ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
   RETURNING *`,
      [
        landlordId,
        tenantId,
        totalAmount,
        instalments,
        amountPerPeriod,
        frequency,
        startDate,
        status,
        createdBy,
        note || null,
      ],
    );

    const planId = planResult.rows[0].id;

    for (let i = 1; i <= instalments; i++) {
      const dueDate = new Date(startDate);
      if (frequency === "monthly") dueDate.setMonth(dueDate.getMonth() + i - 1);
      else if (frequency === "weekly")
        dueDate.setDate(dueDate.getDate() + (i - 1) * 7);
      else dueDate.setDate(dueDate.getDate() + (i - 1) * 14);

      const amount =
        i === instalments
          ? totalAmount - amountPerPeriod * (instalments - 1)
          : amountPerPeriod;

      await client.query(
        `INSERT INTO repayment_instalment (
           repayment_plan_id, instalment_number, due_date, amount_due, status
         ) VALUES ($1, $2, $3, $4, 'pending')`,
        [planId, i, localDateString(dueDate), amount],
      );
    }

    await client.query("COMMIT");

    const full = await pool.query(
      `SELECT rp.*,
              usr.full_name AS tenant_name,
              COALESCE(
                (SELECT json_agg(json_build_object(
                  'id', ri.id, 'instalment_number', ri.instalment_number,
                  'due_date', ri.due_date, 'amount_due', ri.amount_due,
                  'amount_paid', ri.amount_paid, 'status', ri.status, 'paid_date', ri.paid_date
                ) ORDER BY ri.instalment_number)
                FROM repayment_instalment ri WHERE ri.repayment_plan_id = rp.id),
                '[]'::json
              ) AS instalments
       FROM repayment_plan rp
       JOIN tenant t ON t.id = rp.tenant_id
       JOIN users usr ON usr.id = t.user_id
       WHERE rp.id = $1`,
      [planId],
    );

    return {
      ...full.rows[0],
      instalments: (full.rows[0].instalments || []).map(shapeInstalment),
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// GET /repayment-plans/me — tenant views their own active plans
router.get("/me", requireAuth, requireTenant, async (req, res) => {
  try {
    const tenantId = await getTenantId(req.userId);
    if (!tenantId) return res.status(404).json({ error: "Tenant not found" });

    const result = await pool.query(
      `SELECT rp.*,
              COALESCE(
                (SELECT json_agg(json_build_object(
                  'id', ri.id,
                  'instalment_number', ri.instalment_number,
                  'due_date', ri.due_date,
                  'amount_due', ri.amount_due,
                  'amount_paid', ri.amount_paid,
                  'status', ri.status,
                  'paid_date', ri.paid_date
                ) ORDER BY ri.instalment_number)
                FROM repayment_instalment ri WHERE ri.repayment_plan_id = rp.id),
                '[]'::json
              ) AS instalments,
              COALESCE(
                (SELECT SUM(ri.amount_paid) FROM repayment_instalment ri
                 WHERE ri.repayment_plan_id = rp.id AND ri.status = 'paid'), 0
              ) AS paid_amount,
              (SELECT COUNT(*) FROM repayment_instalment ri
               WHERE ri.repayment_plan_id = rp.id AND ri.status = 'paid')
               AS paid_count,
              (SELECT COUNT(*) FROM repayment_instalment ri
               WHERE ri.repayment_plan_id = rp.id) AS total_count
       FROM repayment_plan rp
       WHERE rp.tenant_id = $1
       ORDER BY rp.created_at DESC`,
      [tenantId],
    );

    if (!result.rows.length) {
      return res.json({ plan: null, has_plan: false });
    }

    const plan = result.rows[0];
    res.json({
      has_plan: true,
      plan: {
        ...plan,
        paid_amount: Number(plan.paid_amount || 0),
        remaining: Number(plan.total_amount) - Number(plan.paid_amount || 0),
        progress_pct:
          plan.total_count > 0
            ? Math.round(
                (Number(plan.paid_count) / Number(plan.total_count)) * 100,
              )
            : 0,
        instalments: (plan.instalments || []).map(shapeInstalment),
      },
    });
  } catch (err) {
    console.error("Tenant get own plan:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /repayment-plans/request — tenant proposes a plan when in collections
router.post("/request", requireAuth, requireTenant, async (req, res) => {
  try {
    const tenantId = await getTenantId(req.userId);
    if (!tenantId) return res.status(404).json({ error: "Tenant not found" });

    const { total_amount, instalments, frequency, start_date, note } = req.body;

    if (!total_amount || !instalments || !start_date) {
      return res.status(400).json({
        error: "total_amount, instalments, and start_date are required",
      });
    }
    if (instalments < 1 || instalments > 24) {
      return res
        .status(400)
        .json({ error: "Instalments must be between 1 and 24" });
    }

    const collectionCheck = await pool.query(
      `SELECT c.id, c.landlord_id, c.outstanding_balance
       FROM collection c
       WHERE c.tenant_id = $1 AND c.status IN ('active', 'flagged', 'partial_collection', 'collections')
       ORDER BY c.created_at DESC LIMIT 1`,
      [tenantId],
    );
    if (!collectionCheck.rows.length) {
      return res.status(400).json({
        error:
          "You do not currently have an active collections case. Only tenants flagged for collections can request a repayment plan.",
      });
    }

    const existingPending = await pool.query(
      "SELECT id FROM repayment_plan WHERE tenant_id = $1 AND status = 'pending'",
      [tenantId],
    );
    if (existingPending.rows.length) {
      return res.status(409).json({
        error:
          "You already have a pending repayment plan request. Please wait for your landlord to review it.",
        existing_request_id: existingPending.rows[0].id,
      });
    }

    const { landlord_id: landlordId } = collectionCheck.rows[0];

    const plan = await createPlanWithInstalments({
      landlordId,
      tenantId,
      totalAmount: total_amount,
      instalments,
      frequency: frequency || "monthly",
      startDate: start_date,
      status: "pending",
      createdBy: req.userId,
      note: note || null,
    });

    const linkedInvoices = await pool.query(
      `SELECT ci.invoice_id
        FROM collection_invoice ci
        JOIN collection c ON c.id = ci.collection_id
        WHERE c.tenant_id = $1
     AND c.status IN ('active','flagged','partial_collection','repayment_agreed')`,
      [tenantId],
    );
    for (const row of linkedInvoices.rows) {
      await pool.query(
        `INSERT INTO repayment_plan_invoice (repayment_plan_id, invoice_id) VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [plan.id, row.invoice_id],
      );
    }

    await auditLog(
      req.userId,
      "REQUEST",
      "repayment_plan",
      plan.id,
      null,
      { total_amount, instalments, note },
      req,
    );

    const landlordUser = await pool.query(
      "SELECT user_id FROM landlord WHERE id = $1",
      [landlordId],
    );

    if (landlordUser.rows.length) {
      await createNotification(
        landlordUser.rows[0].user_id,
        "payment_received",
        "Repayment Plan Request",
        `A tenant has submitted a repayment plan request for R${total_amount} over ${instalments} instalments. Please review and approve or reject.`,
        plan.id,
        "repayment_plan",
      );
    }

    res.status(201).json({
      message:
        "Repayment plan request submitted. Your landlord will review it shortly.",
      plan,
    });
  } catch (err) {
    console.error("Tenant request repayment plan:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT rp.*,
              usr.full_name AS tenant_name,
              u.unit_number,
              p.name AS property_name,
              COALESCE(
                (SELECT json_agg(json_build_object(
                  'id', ri.id,
                  'instalment_number', ri.instalment_number,
                  'due_date', ri.due_date,
                  'amount_due', ri.amount_due,
                  'amount_paid', ri.amount_paid,
                  'status', ri.status,
                  'paid_date', ri.paid_date
                ) ORDER BY ri.instalment_number)
                FROM repayment_instalment ri WHERE ri.repayment_plan_id = rp.id),
                '[]'::json
              ) AS instalments,
              COALESCE(
                (SELECT SUM(ri.amount_paid) FROM repayment_instalment ri
                 WHERE ri.repayment_plan_id = rp.id AND ri.status = 'paid'), 0
              ) AS paid_amount
       FROM repayment_plan rp
       JOIN tenant t ON t.id = rp.tenant_id
       JOIN users usr ON usr.id = t.user_id
       LEFT JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
       LEFT JOIN unit u ON u.id = l.unit_id
       LEFT JOIN property p ON p.id = u.property_id
       WHERE rp.landlord_id = $1
       ORDER BY rp.created_at DESC`,
      [landlordId],
    );

    const plans = result.rows.map((plan) => ({
      ...plan,
      instalments: (plan.instalments || []).map(shapeInstalment),
    }));

    res.json({ plans });
  } catch (err) {
    console.error("Get repayment plans:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /repayment-plans/pending-requests — requests waiting for landlord approval
router.get(
  "/pending-requests",
  requireAuth,
  requireLandlord,
  async (req, res) => {
    try {
      const landlordId = await getLandlordId(req.userId);
      if (!landlordId)
        return res.status(404).json({ error: "Landlord not found" });

      const result = await pool.query(
        `SELECT rp.*,
              usr.full_name AS tenant_name,
              u.unit_number,
              p.name AS property_name,
              COALESCE(
                (SELECT json_agg(json_build_object(
                  'id', ri.id,
                  'instalment_number', ri.instalment_number,
                  'due_date', ri.due_date,
                  'amount_due', ri.amount_due,
                  'amount_paid', ri.amount_paid,
                  'status', ri.status,
                  'paid_date', ri.paid_date
                ) ORDER BY ri.instalment_number)
                FROM repayment_instalment ri WHERE ri.repayment_plan_id = rp.id),
                '[]'::json
              ) AS instalments
       FROM repayment_plan rp
       JOIN tenant t ON t.id = rp.tenant_id
       JOIN users usr ON usr.id = t.user_id
       LEFT JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
       LEFT JOIN unit u ON u.id = l.unit_id
       LEFT JOIN property p ON p.id = u.property_id
       WHERE rp.landlord_id = $1 AND rp.status = 'pending'
       ORDER BY rp.created_at ASC`,
        [landlordId],
      );

      res.json({
        requests: result.rows.map((plan) => ({
          ...plan,
          instalments: (plan.instalments || []).map(shapeInstalment),
        })),
        count: result.rows.length,
      });
    } catch (err) {
      console.error("Get pending requests:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// GET /repayment-plans/:id — single plan
router.get("/:id", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT rp.*,
              usr.full_name AS tenant_name,
              u.unit_number, p.name AS property_name,
              COALESCE(
                (SELECT json_agg(json_build_object(
                  'id', ri.id, 'instalment_number', ri.instalment_number,
                  'due_date', ri.due_date, 'amount_due', ri.amount_due,
                  'amount_paid', ri.amount_paid, 'status', ri.status, 'paid_date', ri.paid_date
                ) ORDER BY ri.instalment_number)
                FROM repayment_instalment ri WHERE ri.repayment_plan_id = rp.id),
                '[]'::json
              ) AS instalments,
              COALESCE(
                (SELECT SUM(ri.amount_paid) FROM repayment_instalment ri
                 WHERE ri.repayment_plan_id = rp.id AND ri.status = 'paid'), 0
              ) AS paid_amount
       FROM repayment_plan rp
       JOIN tenant t ON t.id = rp.tenant_id
       JOIN users usr ON usr.id = t.user_id
       LEFT JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
       LEFT JOIN unit u ON u.id = l.unit_id
       LEFT JOIN property p ON p.id = u.property_id
       WHERE rp.id = $1 AND rp.landlord_id = $2`,
      [req.params.id, landlordId],
    );

    if (!result.rows.length)
      return res.status(404).json({ error: "Plan not found" });

    res.json({
      plan: {
        ...result.rows[0],
        instalments: (result.rows[0].instalments || []).map(shapeInstalment),
      },
    });
  } catch (err) {
    console.error("Get repayment plan:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /repayment-plans — landlord creates a plan directly
router.post("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const { tenant_id, total_amount, instalments, frequency, start_date } =
      req.body;

    if (!tenant_id || !total_amount || !instalments || !start_date) {
      return res.status(400).json({
        error:
          "tenant_id, total_amount, instalments, and start_date are required",
      });
    }

    const plan = await createPlanWithInstalments({
      landlordId,
      tenantId: tenant_id,
      totalAmount: total_amount,
      instalments,
      frequency: frequency || "monthly",
      startDate: start_date,
      status: "active",
      createdBy: req.userId,
    });

    const linkedInvoices = await pool.query(
      `SELECT ci.invoice_id
        FROM collection_invoice ci
        JOIN collection c ON c.id = ci.collection_id
        WHERE c.tenant_id = $1
     AND c.status IN ('active','flagged','partial_collection','repayment_agreed')`,
      [tenant_id],
    );
    for (const row of linkedInvoices.rows) {
      await pool.query(
        `INSERT INTO repayment_plan_invoice (repayment_plan_id, invoice_id) VALUES ($1, $2)
          ON CONFLICT DO NOTHING`,
        [plan.id, row.invoice_id],
      );
    }

    await auditLog(
      req.userId,
      "CREATE",
      "repayment_plan",
      plan.id,
      null,
      { tenant_id, total_amount, instalments },
      req,
    );

    await createNotification(
      tenant_id,
      "payment_received",
      "Repayment Plan Created",
      `Your landlord has set up a repayment plan of R${total_amount} over ${instalments} instalments starting ${start_date}.`,
      plan.id,
      "repayment_plan",
    );

    res.status(201).json({ message: "Repayment plan created", plan });
  } catch (err) {
    console.error("Create repayment plan:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /repayment-plans/:id/approve — landlord approves a tenant-requested plan
router.post("/:id/approve", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const planCheck = await pool.query(
      "SELECT * FROM repayment_plan WHERE id = $1 AND landlord_id = $2",
      [req.params.id, landlordId],
    );
    if (!planCheck.rows.length)
      return res.status(404).json({ error: "Plan not found" });
    if (planCheck.rows[0].status !== "pending") {
      return res.status(400).json({
        error: `Plan is already ${planCheck.rows[0].status} — only pending plans can be approved`,
      });
    }

    const result = await pool.query(
      `UPDATE repayment_plan
       SET status = 'active', approved_by = $1, approved_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [req.userId, req.params.id],
    );

    await pool.query(
      `UPDATE collection SET status = 'repayment_agreed', updated_at = NOW()
       WHERE tenant_id = $1 AND status IN ('active', 'flagged', 'partial_collection', 'collections')`,
      [planCheck.rows[0].tenant_id],
    );

    await auditLog(
      req.userId,
      "APPROVE",
      "repayment_plan",
      req.params.id,
      { status: "pending" },
      { status: "active" },
      req,
    );

    await createNotification(
      planCheck.rows[0].tenant_id,
      "payment_approved",
      "Repayment Plan Approved",
      "Your repayment plan request has been approved. Your first instalment is due on the date agreed.",
      req.params.id,
      "repayment_plan",
    );

    res.json({ message: "Repayment plan approved", plan: result.rows[0] });
  } catch (err) {
    console.error("Approve repayment plan:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /repayment-plans/:id/reject — landlord rejects a tenant-requested plan
router.post("/:id/reject", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const { rejection_reason } = req.body;

    const planCheck = await pool.query(
      "SELECT * FROM repayment_plan WHERE id = $1 AND landlord_id = $2",
      [req.params.id, landlordId],
    );
    if (!planCheck.rows.length)
      return res.status(404).json({ error: "Plan not found" });
    if (planCheck.rows[0].status !== "pending") {
      return res.status(400).json({
        error: `Plan is already ${planCheck.rows[0].status} — only pending plans can be rejected`,
      });
    }

    const result = await pool.query(
      `UPDATE repayment_plan
       SET status = 'rejected'
       WHERE id = $1
       RETURNING *`,
      [req.params.id],
    );

    await auditLog(
      req.userId,
      "REJECT",
      "repayment_plan",
      req.params.id,
      { status: "pending" },
      { status: "rejected", rejection_reason },
      req,
    );

    await createNotification(
      planCheck.rows[0].tenant_id,
      "payment_rejected",
      "Repayment Plan Rejected",
      rejection_reason
        ? `Your repayment plan request was not approved: ${rejection_reason}`
        : "Your repayment plan request was not approved. Please contact your landlord to discuss alternatives.",
      req.params.id,
      "repayment_plan",
    );

    res.json({ message: "Repayment plan rejected", plan: result.rows[0] });
  } catch (err) {
    console.error("Reject repayment plan:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /repayment-plans/:planId/instalments/:instalmentId/pay — mark instalment paid
router.put(
  "/:planId/instalments/:instalmentId/pay",
  requireAuth,
  requireLandlord,
  async (req, res) => {
    try {
      const landlordId = await getLandlordId(req.userId);
      if (!landlordId)
        return res.status(404).json({ error: "Landlord not found" });

      const { planId, instalmentId } = req.params;

      const planCheck = await pool.query(
        "SELECT id, tenant_id, total_amount FROM repayment_plan WHERE id = $1 AND landlord_id = $2",
        [planId, landlordId],
      );
      if (!planCheck.rows.length)
        return res.status(404).json({ error: "Plan not found" });

      await client.query(
        `UPDATE repayment_instalment
          SET status = 'pending_approval', payment_id = $2
          WHERE id = $1`,
        [instalmentId, paymentId],
      );
      if (!instResult.rows.length)
        return res.status(404).json({ error: "Instalment not found" });

      const allPaid = await pool.query(
        `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status = 'paid') AS paid
       FROM repayment_instalment WHERE repayment_plan_id = $1`,
        [planId],
      );

      const allDone =
        Number(allPaid.rows[0].total) === Number(allPaid.rows[0].paid);

      if (allDone) {
        await pool.query(
          "UPDATE repayment_plan SET status = 'completed' WHERE id = $1",
          [planId],
        );

        await pool.query(
          `UPDATE collection SET status = 'recovered', updated_at = NOW()
         WHERE tenant_id = $1 AND status IN ('active', 'repayment_agreed')`,
          [planCheck.rows[0].tenant_id],
        );

        await createNotification(
          planCheck.rows[0].tenant_id,
          "payment_received",
          "Repayment Plan Completed",
          "You have successfully completed your repayment plan. Your account is no longer in collections.",
          planId,
          "repayment_plan",
        );
      }

      await pool.query("SELECT public.recalculate_tenant_score($1, $2)", [
        planCheck.rows[0].tenant_id,
        req.userId,
      ]);

      await createNotification(
        planCheck.rows[0].tenant_id,
        "payment_received",
        "Instalment Paid",
        `An instalment of R${instResult.rows[0].amount_due} has been recorded as paid.`,
        planId,
        "repayment_plan",
      );

      res.json({
        message: "Instalment marked as paid",
        instalment: instResult.rows[0],
        plan_completed: allDone,
      });
    } catch (err) {
      console.error("Mark instalment paid:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

// PUT /repayment-plans/:id/default — mark plan as defaulted
router.put("/:id/default", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId)
      return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `UPDATE repayment_plan SET status = 'defaulted'
       WHERE id = $1 AND landlord_id = $2
       RETURNING *`,
      [req.params.id, landlordId],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Plan not found" });

    await pool.query(
      `UPDATE collection SET status = 'active', updated_at = NOW()
       WHERE tenant_id = $1 AND status = 'repayment_agreed'`,
      [result.rows[0].tenant_id],
    );

    await createNotification(
      result.rows[0].tenant_id,
      "payment_rejected",
      "Repayment Plan Defaulted",
      "Your repayment plan has been marked as defaulted due to missed instalments. Please contact your landlord immediately.",
      req.params.id,
      "repayment_plan",
    );

    res.json({ message: "Plan marked as defaulted", plan: result.rows[0] });
  } catch (err) {
    console.error("Default plan:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /repayment-plans/me/instalments/:instalmentId/pay
router.post(
  "/me/instalments/:instalmentId/pay",
  requireAuth,
  requireTenant,
  async (req, res) => {
    try {
      const tenantId = await getTenantId(req.userId);
      if (!tenantId) return res.status(404).json({ error: "Tenant not found" });

      const instalmentId = req.params.instalmentId;
      const {
        amount_paid,
        payment_method = "bank_transfer",
        bank_reference,
        proof_of_payment_url,
      } = req.body;

      if (!amount_paid || Number(amount_paid) <= 0) {
        return res
          .status(400)
          .json({ error: "amount_paid is required and must be positive" });
      }

      const instRes = await pool.query(
        `SELECT ri.*, rp.id AS plan_id, rp.tenant_id, rp.status AS plan_status,
                rp.landlord_id, rp.total_amount, rp.instalments
         FROM repayment_instalment ri
         JOIN repayment_plan rp ON rp.id = ri.repayment_plan_id
         WHERE ri.id = $1
           AND rp.tenant_id = $2`,
        [instalmentId, tenantId],
      );

      if (!instRes.rows.length) {
        return res.status(404).json({ error: "Instalment not found" });
      }

      const instalment = instRes.rows[0];

      if (instalment.status === "paid") {
        return res.status(400).json({ error: "Instalment is already paid" });
      }

      if (instalment.status === "pending_approval") {
        return res.status(400).json({
          error: "A payment for this instalment is already awaiting approval.",
        });
      }

      if (instalment.plan_status !== "active") {
        return res.status(400).json({
          error: `Payment is only allowed for active plans. Current plan status: ${instalment.plan_status}`,
        });
      }

      const amountDue = Number(instalment.amount_due);
      const numericAmount = Number(amount_paid);

      if (numericAmount > amountDue + 0.01) {
        return res.status(400).json({
          error: `Amount exceeds the instalment amount of R ${amountDue.toFixed(2)}`,
        });
      }

      if (Math.abs(numericAmount - amountDue) > 0.01) {
        return res.status(400).json({
          error: `Instalment payments must be paid in full: R ${amountDue.toFixed(2)}`,
        });
      }

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const paymentRes = await client.query(
          `INSERT INTO payment (
             invoice_id, tenant_id, lease_id, landlord_id,
             amount_paid, payment_method, payment_date,
             bank_reference, proof_of_payment_url, status,
             approved_by, approved_at, notes, created_at, updated_at
           ) VALUES (
             NULL, $1,
             (SELECT id FROM lease WHERE tenant_id = $1 AND status = 'active' ORDER BY lease_start_date DESC LIMIT 1),
             $2, $3, $4, NOW(),
             $5, $6, 'pending',
             NULL, NULL, 'Repayment plan instalment payment', NOW(), NOW()
           )
           RETURNING id`,
          [
            tenantId,
            instalment.landlord_id,
            numericAmount,
            payment_method,
            bank_reference || null,
            proof_of_payment_url || null,
          ],
        );
        const paymentId = paymentRes.rows[0].id;

        await client.query(
          `UPDATE repayment_instalment
           SET status = 'pending_approval', payment_id = $2
           WHERE id = $1`,
          [instalmentId, paymentId],
        );

        await client.query("COMMIT");

        const landlordUser = await pool.query(
          "SELECT user_id FROM landlord WHERE id = $1",
          [instalment.landlord_id],
        );
        if (landlordUser.rows.length) {
          await createNotification(
            landlordUser.rows[0].user_id,
            "payment_received",
            "Instalment Payment Submitted",
            `Tenant submitted a payment of R ${numericAmount.toFixed(2)} for instalment #${instalment.instalment_number}. Awaiting approval.`,
            instalmentId,
            "repayment_instalment",
          );
        }

        res.status(201).json({
          message: "Instalment payment submitted for approval",
          payment_id: paymentId,
          instalment_id: instalmentId,
        });
      } catch (err) {
        await client.query("ROLLBACK");
        throw err;
      } finally {
        client.release();
      }
    } catch (err) {
      console.error("Tenant pay instalment:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

router.get(
  "/me/instalments/:id",
  requireAuth,
  requireTenant,
  async (req, res) => {
    const tenantId = await getTenantId(req.userId);
    if (!tenantId) return res.status(404).json({ error: "Tenant not found" });
    const result = await pool.query(
      `SELECT ri.* FROM repayment_instalment ri
     JOIN repayment_plan rp ON rp.id = ri.repayment_plan_id
     WHERE ri.id = $1 AND rp.tenant_id = $2`,
      [req.params.id, tenantId],
    );
    if (!result.rows.length)
      return res.status(404).json({ error: "Instalment not found" });
    res.json({ instalment: shapeInstalment(result.rows[0]) });
  },
);

// POST /repayment-plans/instalments/:instalmentId/approve-payment
router.post(
  "/instalments/:instalmentId/approve-payment",
  requireAuth,
  requireLandlord,
  async (req, res) => {
    try {
      const landlordId = await getLandlordId(req.userId);
      if (!landlordId)
        return res.status(404).json({ error: "Landlord not found" });

      const instalmentId = req.params.instalmentId;

      const instRes = await pool.query(
        `SELECT ri.*, rp.id AS plan_id, rp.tenant_id, rp.landlord_id, rp.status AS plan_status
         FROM repayment_instalment ri
         JOIN repayment_plan rp ON rp.id = ri.repayment_plan_id
         WHERE ri.id = $1
           AND rp.landlord_id = $2`,
        [instalmentId, landlordId],
      );

      if (!instRes.rows.length) {
        return res.status(404).json({ error: "Instalment not found" });
      }

      const instalment = instRes.rows[0];

      if (instalment.status !== "pending_approval") {
        return res
          .status(400)
          .json({ error: "Instalment is not pending approval" });
      }

      const updatedInst = await pool.query(
        `UPDATE repayment_instalment
         SET status = 'paid', amount_paid = amount_due, paid_date = NOW()
         WHERE id = $1
         RETURNING *`,
        [instalmentId],
      );

      if (instalment.payment_id) {
        await pool.query(
          `UPDATE payment SET status = 'paid', approved_by = $1, approved_at = NOW()
           WHERE id = $2`,
          [req.userId, instalment.payment_id],
        );
      }

      const allPaid = await pool.query(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'paid') AS paid
         FROM repayment_instalment WHERE repayment_plan_id = $1`,
        [instalment.plan_id],
      );

      const allDone =
        Number(allPaid.rows[0].total) === Number(allPaid.rows[0].paid);

      if (allDone) {
        await pool.query(
          `UPDATE invoice
            SET status = 'paid', paid_amount = amount_due, updated_at = NOW()
            WHERE id IN (SELECT invoice_id FROM repayment_plan_invoice WHERE repayment_plan_id = $1)`,
          [instalment.plan_id],
        );

        await pool.query(
          "UPDATE repayment_plan SET status = 'completed' WHERE id = $1",
          [instalment.plan_id],
        );

        await pool.query(
          `UPDATE collection SET status = 'recovered', updated_at = NOW()
             WHERE tenant_id = $1 AND status IN ('active', 'repayment_agreed', 'partial_collection')`,
          [instalment.tenant_id],
        );
      }

      await pool.query(`SELECT public.recalculate_tenant_score($1, $2)`, [
        instalment.tenant_id,
        req.userId,
      ]);

      await createNotification(
        instalment.tenant_id,
        "payment_approved",
        "Instalment Payment Approved",
        `Your payment for instalment #${instalment.instalment_number} has been approved.`,
        instalmentId,
        "repayment_instalment",
      );

      res.json({
        message: "Instalment payment approved",
        instalment: updatedInst.rows[0],
        plan_completed: allDone,
      });
    } catch (err) {
      console.error("Approve instalment payment:", err);
      res.status(500).json({ error: "Server error" });
    }
  },
);

module.exports = router;
