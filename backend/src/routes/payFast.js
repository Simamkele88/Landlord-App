const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireTenant } = require("../middleware/roleCheck");

function pfEncode(value) {
  return encodeURIComponent(value).replace(/%20/g, "+");
}

function generateSignature(data, passphrase) {
  const pfData = [];
  for (const key in data) {
    if (key !== "signature") {
      pfData.push(`${key}=${pfEncode(data[key])}`);
    }
  }
  if (passphrase) pfData.push(`passphrase=${pfEncode(passphrase)}`);
  return crypto.createHash("md5").update(pfData.join("&")).digest("hex");
}

router.post("/initiate", requireAuth, requireTenant, async (req, res) => {
  try {
    const tenantRes = await pool.query(
      "SELECT id FROM tenant WHERE user_id = $1",
      [req.userId],
    );
    const tenantId = tenantRes.rows[0]?.id;
    if (!tenantId) return res.status(404).json({ error: "Tenant not found" });

    const { invoice_id, repayment_instalment_id, amount, item_name } = req.body;
    const numericAmount = Number(amount);

    if (
      (!invoice_id && !repayment_instalment_id) ||
      !numericAmount ||
      numericAmount <= 0
    ) {
      return res.status(400).json({ error: "Invalid payment request" });
    }

    let maxPayable, mPaymentId, itemDescription;

    if (repayment_instalment_id) {
      const instRes = await pool.query(
        `SELECT ri.*, rp.tenant_id FROM repayment_instalment ri
         JOIN repayment_plan rp ON rp.id = ri.repayment_plan_id
         WHERE ri.id = $1 AND rp.tenant_id = $2 AND ri.status != 'paid'`,
        [repayment_instalment_id, tenantId],
      );
      if (!instRes.rows.length)
        return res.status(404).json({ error: "Instalment not found" });
      maxPayable = Number(instRes.rows[0].amount_due);
      mPaymentId = `inst_${repayment_instalment_id}`;
      itemDescription = `Repayment instalment ${instRes.rows[0].instalment_number}`;
    } else {
      const invoiceRes = await pool.query(
        "SELECT id, remaining_balance, amount_due FROM invoice WHERE id = $1 AND tenant_id = $2",
        [invoice_id, tenantId],
      );
      if (!invoiceRes.rows.length)
        return res.status(404).json({ error: "Invoice not found" });
      maxPayable = Number(
        invoiceRes.rows[0].remaining_balance ??
          invoiceRes.rows[0].amount_due ??
          0,
      );
      mPaymentId = invoice_id;
      itemDescription = `Invoice ${invoice_id}`;
    }

    if (numericAmount > maxPayable) {
      return res
        .status(400)
        .json({ error: "Amount exceeds remaining balance" });
    }

    const tenant = await pool.query(
      `SELECT t.id, u.first_name, u.last_name, u.email
       FROM tenant t JOIN users u ON u.id = t.user_id
       WHERE t.id = $1`,
      [tenantId],
    );

    const paymentData = {
      merchant_id: process.env.PAYFAST_MERCHANT_ID,
      merchant_key: process.env.PAYFAST_MERCHANT_KEY,
      return_url: process.env.PAYFAST_RETURN_URL,
      cancel_url: process.env.PAYFAST_CANCEL_URL,
      notify_url: process.env.PAYFAST_NOTIFY_URL,
      name_first: tenant.rows[0].first_name,
      name_last: tenant.rows[0].last_name,
      email_address: tenant.rows[0].email,
      m_payment_id: mPaymentId,
      amount: numericAmount.toFixed(2),
      item_name: item_name || "Rent Payment",
      item_description: itemDescription,
    };

    const signature = generateSignature(
      paymentData,
      process.env.PAYFAST_PASSPHRASE,
    );
    paymentData.signature = signature;

    const payfastUrl =
      process.env.PAYFAST_TEST_MODE === "true"
        ? "https://sandbox.payfast.co.za/eng/process"
        : "https://www.payfast.co.za/eng/process";

    res.json({ url: payfastUrl, data: paymentData });
  } catch (err) {
    console.error("PayFast initiate:", err);
    res.status(500).json({ error: "Failed to initiate payment" });
  }
});

router.post("/notify", async (req, res) => {
  try {
    const data = req.body;
    const signature = data.signature;
    const expectedSignature = generateSignature(
      data,
      process.env.PAYFAST_PASSPHRASE,
    );
    if (signature !== expectedSignature)
      return res.status(400).json({ error: "Invalid signature" });

    if (data.payment_status !== "COMPLETE") return res.status(200).send("OK");

    const rawId = data.m_payment_id;
    const amountPaid = parseFloat(data.amount_gross);

    const existingPayment = await pool.query(
      "SELECT id FROM payment WHERE bank_reference = $1",
      [data.pf_payment_id],
    );
    if (existingPayment.rows.length) return res.status(200).send("OK");

    if (String(rawId).startsWith("inst_")) {
      const instalmentId = String(rawId).replace("inst_", "");

      const instRes = await pool.query(
        `SELECT ri.*, rp.tenant_id, rp.landlord_id, rp.id AS plan_id
     FROM repayment_instalment ri
     JOIN repayment_plan rp ON rp.id = ri.repayment_plan_id
     WHERE ri.id = $1`,
        [instalmentId],
      );
      if (!instRes.rows.length)
        return res.status(404).json({ error: "Instalment not found" });

      const inst = instRes.rows[0];

      const client = await pool.connect();
      try {
        await client.query("BEGIN");

        const leaseRes = await client.query(
          `SELECT id FROM lease
            WHERE tenant_id = $1
            ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END,
                lease_start_date DESC
       LIMIT 1`,
          [inst.tenant_id],
        );
        const leaseId = leaseRes.rows[0]?.id || null;

        if (!leaseId) {
          await client.query("ROLLBACK");
          return res.status(400).json({ error: "No lease found for tenant" });
        }

        const paymentRes = await client.query(
          `INSERT INTO payment (
         invoice_id, tenant_id, lease_id, landlord_id, amount_paid,
         payment_method, payment_date, status, bank_reference,
         approved_at, created_at, updated_at, notes
       ) VALUES (NULL, $1, $2, $3, $4, 'card', NOW(), 'paid', $5, NOW(), NOW(), NOW(), 'Repayment plan instalment payment')
       RETURNING id`,
          [
            inst.tenant_id,
            leaseId,
            inst.landlord_id,
            amountPaid,
            data.pf_payment_id,
          ],
        );
        const paymentId = paymentRes.rows[0].id;

        await client.query(
          `UPDATE repayment_instalment SET status = 'paid', amount_paid = amount_due, payment_id = $2, paid_date = NOW() WHERE id = $1`,
          [instalmentId, paymentId],
        );

        const allPaid = await client.query(
          `SELECT COUNT(*) AS total,
              COUNT(*) FILTER (WHERE status = 'paid') AS paid
            FROM repayment_instalment
            WHERE repayment_plan_id = $1`,
          [inst.plan_id],
        );
        const allDone =
          Number(allPaid.rows[0].total) === Number(allPaid.rows[0].paid);

        if (allDone) {
          await client.query(
            `UPDATE repayment_plan SET status = 'completed', updated_at = NOW()
         WHERE id = $1`,
            [inst.plan_id],
          );
          await client.query(
            `UPDATE collection SET status = 'recovered', updated_at = NOW()
         WHERE tenant_id = $1
           AND status IN ('active', 'repayment_agreed', 'partial_collection')`,
            [inst.tenant_id],
          );
        }

        await client.query("SELECT public.recalculate_tenant_score($1, $2)", [
          inst.tenant_id,
          null,
        ]);

        await client.query("COMMIT");
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      } finally {
        client.release();
      }

      return res.status(200).send("OK");
    }

    const invoiceId = rawId;
    const invoice = await pool.query("SELECT * FROM invoice WHERE id = $1", [
      invoiceId,
    ]);
    if (!invoice.rows.length)
      return res.status(404).json({ error: "Invoice not found" });

    const inv = invoice.rows[0];
    const isLate = new Date(data.pf_payment_date) > new Date(inv.due_date);
    const status = isLate ? "late" : "paid";

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const paymentRes = await client.query(
        `INSERT INTO payment (
          invoice_id, tenant_id, lease_id, landlord_id, amount_paid,
          payment_method, payment_date, status, bank_reference, proof_of_payment_url,
          approved_by, approved_at, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, 'card', NOW(), $6, $7, $8, $9, NOW(), NOW(), NOW())
        RETURNING id`,
        [
          invoiceId,
          inv.tenant_id,
          inv.lease_id,
          inv.landlord_id,
          amountPaid,
          status,
          data.pf_payment_id,
          null,
          req.userId || null,
        ],
      );
      const paymentId = paymentRes.rows[0].id;

      await client.query(
        `INSERT INTO public.invoice_payments (
          invoice_id, payment_id, amount, payment_date,
          method, reference, status,
          allocated_rent, allocated_utilities, allocated_late_fees,
          notes
        ) VALUES ($1, $2, $3, NOW(), 'card', $4, 'approved', $5, 0, 0, $6)`,
        [
          invoiceId,
          paymentId,
          amountPaid,
          data.pf_payment_id,
          amountPaid,
          "PayFast online payment",
        ],
      );

      await client.query("SELECT public.recalculate_invoice_status($1)", [
        invoiceId,
      ]);
      await client.query("SELECT public.recalculate_payment_history($1)", [
        inv.tenant_id,
      ]);
      await client.query("SELECT public.recalculate_tenant_score($1, $2)", [
        inv.tenant_id,
        null,
      ]);

      await client.query("COMMIT");
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }

    res.status(200).send("OK");
  } catch (err) {
    console.error("PayFast notify:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/return", (req, res) => {
  res.send(
    "<h1>Payment processing</h1><p>You can return to the app. We will confirm shortly.</p>",
  );
});

router.get("/cancel", (req, res) => {
  res.send("<h1>Payment cancelled</h1><p>You can return to the app.</p>");
});

module.exports = router;
