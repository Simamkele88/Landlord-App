const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord } = require("../middleware/roleCheck");
const { auditLog } = require("../utils/audit");
const { createNotification } = require("../utils/notifications");

async function getLandlordId(userId) {
  const result = await pool.query("SELECT id FROM landlord WHERE user_id = $1", [userId]);
  return result.rows[0]?.id || null;
}

// GET /repayment-plans - List all plans
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT rp.*, 
              t.first_name || ' ' || t.last_name AS tenant_name,
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
       LEFT JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
       LEFT JOIN unit u ON u.id = l.unit_id
       LEFT JOIN property p ON p.id = u.property_id
       WHERE rp.landlord_id = $1
       ORDER BY rp.created_at DESC`,
      [landlordId]
    );

    const plans = result.rows.map(plan => ({
      ...plan,
      instalments: (plan.instalments || []).map(inst => ({
        id: inst.id,
        due_date: inst.due_date,
        amount: Number(inst.amount_due || 0),
        status: inst.status || 'pending',
        paid_date: inst.paid_date,
      })),
    }));

    res.json({ plans });
  } catch (err) {
    console.error("Get repayment plans:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /repayment-plans/:id - Single plan
router.get("/:id", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const result = await pool.query(
      `SELECT rp.*, 
              t.first_name || ' ' || t.last_name AS tenant_name,
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
       LEFT JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
       LEFT JOIN unit u ON u.id = l.unit_id
       LEFT JOIN property p ON p.id = u.property_id
       WHERE rp.id = $1 AND rp.landlord_id = $2`,
      [req.params.id, landlordId]
    );

    if (!result.rows.length) return res.status(404).json({ error: "Plan not found" });

    const plan = {
      ...result.rows[0],
      instalments: (result.rows[0].instalments || []).map(inst => ({
        id: inst.id,
        due_date: inst.due_date,
        amount: Number(inst.amount_due || 0),
        status: inst.status || 'pending',
        paid_date: inst.paid_date,
      })),
    };

    res.json({ plan });
  } catch (err) {
    console.error("Get repayment plan:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /repayment-plans - Create a new plan
router.post("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { tenant_id, total_amount, instalments, frequency, start_date, note } = req.body;

    if (!tenant_id || !total_amount || !instalments || !start_date) {
      return res.status(400).json({ error: "Tenant, total amount, instalments, and start date are required" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const planResult = await client.query(
        `INSERT INTO repayment_plan (
          landlord_id, tenant_id, total_amount, installments, 
          amount_per_period, frequency, start_date, status, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'active', $8, NOW(), NOW())
        RETURNING *`,
        [
          landlordId, tenant_id, total_amount, instalments,
          Math.round(total_amount / instalments), frequency || 'monthly',
          start_date, req.userId
        ]
      );

      const planId = planResult.rows[0].id;

      // Create instalments
      for (let i = 1; i <= instalments; i++) {
        const dueDate = new Date(start_date);
        if (frequency === 'monthly') dueDate.setMonth(dueDate.getMonth() + i - 1);
        else if (frequency === 'weekly') dueDate.setDate(dueDate.getDate() + (i - 1) * 7);
        else dueDate.setDate(dueDate.getDate() + (i - 1) * 14); // biweekly

        const amount = i === instalments 
          ? total_amount - Math.round(total_amount / instalments) * (instalments - 1)
          : Math.round(total_amount / instalments);

        await client.query(
          `INSERT INTO repayment_instalment (
            repayment_plan_id, instalment_number, due_date, amount_due, status
          ) VALUES ($1, $2, $3, $4, 'pending')`,
          [planId, i, dueDate.toISOString().split('T')[0], amount]
        );
      }

      await client.query("COMMIT");

      // Get the created plan with instalments
      const plan = await pool.query(
        `SELECT rp.*, t.first_name || ' ' || t.last_name AS tenant_name,
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
         WHERE rp.id = $1`,
        [planId]
      );

      await auditLog(req.userId, "CREATE", "repayment_plan", planId, null, { tenant_id, total_amount, instalments }, req);

      res.status(201).json({ 
        message: "Repayment plan created", 
        plan: {
          ...plan.rows[0],
          instalments: (plan.rows[0].instalments || []).map(inst => ({
            id: inst.id,
            due_date: inst.due_date,
            amount: Number(inst.amount_due || 0),
            status: inst.status || 'pending',
          })),
        }
      });
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Create repayment plan:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /repayment-plans/:planId/instalments/:instalmentId/pay - Mark instalment as paid
router.put("/:planId/instalments/:instalmentId/pay", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { planId, instalmentId } = req.params;

    // Verify plan belongs to landlord
    const planCheck = await pool.query(
      "SELECT id, tenant_id, total_amount FROM repayment_plan WHERE id = $1 AND landlord_id = $2",
      [planId, landlordId]
    );
    if (!planCheck.rows.length) return res.status(404).json({ error: "Plan not found" });

    // Update instalment
    const instResult = await pool.query(
      `UPDATE repayment_instalment SET status = 'paid', amount_paid = amount_due, paid_date = NOW()
       WHERE id = $1 AND repayment_plan_id = $2
       RETURNING *`,
      [instalmentId, planId]
    );

    if (!instResult.rows.length) return res.status(404).json({ error: "Instalment not found" });

    // Check if all instalments are paid
    const allPaid = await pool.query(
      `SELECT COUNT(*) as total, 
              COUNT(*) FILTER (WHERE status = 'paid') as paid
       FROM repayment_instalment WHERE repayment_plan_id = $1`,
      [planId]
    );

    if (allPaid.rows[0].total === allPaid.rows[0].paid) {
      await pool.query(
        "UPDATE repayment_plan SET status = 'completed', updated_at = NOW() WHERE id = $1",
        [planId]
      );
    }

    // Notify tenant
    await createNotification(
      planCheck.rows[0].tenant_id,
      "payment_received",
      "Instalment Paid",
      `An instalment of R${instResult.rows[0].amount_due} has been marked as paid.`,
      planId,
      "repayment_plan"
    );

    res.json({ message: "Instalment marked as paid", instalment: instResult.rows[0] });
  } catch (err) {
    console.error("Mark instalment paid:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// PUT /repayment-plans/:id/default - Mark plan as defaulted
router.put("/:id/default", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

    const { id } = req.params;

    const result = await pool.query(
      "UPDATE repayment_plan SET status = 'defaulted', updated_at = NOW() WHERE id = $1 AND landlord_id = $2 RETURNING *",
      [id, landlordId]
    );

    if (!result.rows.length) return res.status(404).json({ error: "Plan not found" });

    // Notify tenant
    await createNotification(
      result.rows[0].tenant_id,
      "payment_rejected",
      "Payment Plan Defaulted",
      "Your repayment plan has been marked as defaulted. Please contact your landlord.",
      id,
      "repayment_plan"
    );

    res.json({ message: "Plan marked as defaulted", plan: result.rows[0] });
  } catch (err) {
    console.error("Default plan:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;