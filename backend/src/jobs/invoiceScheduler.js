const cron = require("node-cron");
const pool = require("../config/database");
const { createNotification } = require("../utils/notifications");
const { sendInvoiceCreatedEmail, sendLateFeeAppliedEmail } = require("../utils/email");

function getNextBillingDates(leaseStart, frequency, dueDay) {
  const today = new Date();
  const start = new Date(leaseStart);

  let periodStart, periodEnd, dueDate;

  switch (frequency) {
    case "weekly":
      periodStart = new Date(today);
      periodStart.setDate(today.getDate() + ((7 - today.getDay() + 1) % 7));
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 6);
      dueDate = periodStart;
      break;

    case "monthly":
      periodStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      periodEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      dueDate = new Date(periodStart);
      dueDate.setDate(Math.min(dueDay || 1, periodEnd.getDate()));
      break;

    case "quarterly":
      const qMonth = today.getMonth() - (today.getMonth() % 3) + 3;
      periodStart = new Date(today.getFullYear(), qMonth, 1);
      periodEnd = new Date(today.getFullYear(), qMonth + 3, 0);
      dueDate = new Date(periodStart);
      dueDate.setDate(Math.min(dueDay || 1, periodEnd.getDate()));
      break;

    case "annually":
      periodStart = new Date(today.getFullYear() + 1, 0, 1);
      periodEnd = new Date(today.getFullYear() + 1, 11, 31);
      dueDate = new Date(periodStart);
      dueDate.setDate(Math.min(dueDay || 1, 31));
      break;

    default:
      periodStart = new Date(today.getFullYear(), today.getMonth() + 1, 1);
      periodEnd = new Date(today.getFullYear(), today.getMonth() + 2, 0);
      dueDate = new Date(periodStart);
      dueDate.setDate(Math.min(dueDay || 1, periodEnd.getDate()));
  }

  return {
    billing_period_start: periodStart.toISOString().slice(0, 10),
    billing_period_end: periodEnd.toISOString().slice(0, 10),
    due_date: dueDate.toISOString().slice(0, 10),
  };
}

async function generateDueInvoices() {
  const client = await pool.connect();
  const pendingNotifications = [];

  try {
    await client.query("BEGIN");

    const leasesRes = await client.query(
      `SELECT l.*, u.property_id
       FROM lease l
       JOIN unit u ON u.id = l.unit_id
       WHERE l.status = 'active'
       ORDER BY l.id`
    );

    let createdCount = 0;
    let skippedCount = 0;

    for (const lease of leasesRes.rows) {
      const { billing_period_start, billing_period_end, due_date } = getNextBillingDates(
        lease.lease_start_date,
        lease.payment_frequency,
        lease.payment_due_day
      );

      const existing = await client.query(
        `SELECT id FROM invoice
         WHERE lease_id = $1
           AND invoice_type = 'rent'
           AND billing_period_start = $2
         LIMIT 1`,
        [lease.id, billing_period_start]
      );

      if (existing.rows.length > 0) {
        skippedCount++;
        continue;
      }

      const invoiceNumber = `INV-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      const inserted = await client.query(
        `INSERT INTO invoice (
          lease_id, tenant_id, unit_id, landlord_id,
          invoice_number, amount_due,
          rent_amount, utilities_amount, late_fees, other_charges, discounts,
          billing_period_start, billing_period_end, due_date,
          status, paid_amount, invoice_type, notes
        ) VALUES (
          $1, $2, $3, $4,
          $5, $6,
          $6, 0, 0, 0, 0,
          $7, $8, $9,
          'sent', 0, 'rent', 'Auto-generated invoice'
        )
        RETURNING id`,
        [
          lease.id,
          lease.tenant_id,
          lease.unit_id,
          lease.landlord_id,
          invoiceNumber,
          lease.rent_amount,
          billing_period_start,
          billing_period_end,
          due_date,
        ]
      );

      const invoiceId = inserted.rows[0].id;
      createdCount++;

      pendingNotifications.push({
        tenant_id: lease.tenant_id,
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        amount: lease.rent_amount,
        due_date: due_date,
      });
    }

    await client.query("COMMIT");

    console.log(`[invoiceScheduler] Generated ${createdCount} invoices, skipped ${skippedCount} existing.`);

    for (const info of pendingNotifications) {
      try {
        const tenantRes = await pool.query(
          `SELECT u.email, u.full_name
           FROM tenant t
           JOIN users u ON u.id = t.user_id
           WHERE t.id = $1`,
          [info.tenant_id]
        );

        const tenantEmail = tenantRes.rows[0]?.email;
        const tenantFullName = tenantRes.rows[0]?.full_name || "Tenant";

        await createNotification(
          info.tenant_id,
          "invoice_created",
          "New Rent Invoice",
          `A new rent invoice of R${Number(info.amount).toFixed(2)} has been generated. Due date: ${info.due_date}.`,
          info.invoice_id,
          "invoice"
        );

        if (tenantEmail) {
          await sendInvoiceCreatedEmail({
            email: tenantEmail,
            fullName: tenantFullName,
            invoiceType: "rent",
            amount: info.amount,
            dueDate: info.due_date,
            notes: "Auto-generated monthly rent invoice",
          });
        }

        console.log(`[invoiceScheduler] Notified tenant ${info.tenant_id} for invoice ${info.invoice_number}`);
      } catch (notifyErr) {
        console.error(`[invoiceScheduler] Failed to notify tenant ${info.tenant_id}:`, notifyErr);
      }
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[invoiceScheduler] Error generating invoices:", err);
  } finally {
    client.release();
  }
}

async function applyLateFees() {
  const client = await pool.connect();
  const pendingLateFeeNotifications = [];

  try {
    await client.query("BEGIN");

    const settingsRes = await client.query(
      `SELECT * FROM payment_settings LIMIT 1`
    );
    if (settingsRes.rows.length === 0) {
      console.warn("[lateFeeScheduler] No payment settings found, skipping.");
      return;
    }
    const s = settingsRes.rows[0];

    if (s.late_fee_type === "none") {
      console.log("[lateFeeScheduler] Late fee type is 'none', skipping.");
      return;
    }

    const invoicesRes = await client.query(
      `SELECT i.id, i.tenant_id, i.landlord_id, i.rent_amount, i.due_date,
              l.grace_period_days AS lease_grace_days,
              l.late_fee_amount AS lease_fixed_fee
       FROM invoice i
       JOIN lease l ON l.id = i.lease_id
       WHERE i.status IN ('sent','partial','overdue')
         AND i.due_date < CURRENT_DATE
         AND i.late_fees = 0
       ORDER BY i.due_date ASC`
    );

    let appliedCount = 0;

    for (const inv of invoicesRes.rows) {
      const graceDays = Number(inv.lease_grace_days ?? s.grace_period_days);
      const applyAfter = Number(s.apply_late_fee_after_days);
      const due = new Date(inv.due_date);
      const today = new Date();
      const daysPastDue = Math.floor((today - due) / (1000 * 60 * 60 * 24));

      if (daysPastDue <= graceDays + applyAfter) continue;

      let fee = 0;
      if (s.late_fee_type === 'fixed') {
        fee = Number(inv.lease_fixed_fee ?? s.late_fee_value);
      } else if (s.late_fee_type === 'percentage') {
        const pct = Number(s.late_fee_value) || 0;
        fee = (pct / 100) * Number(inv.rent_amount);
        const cap = Number(s.late_fee_cap);
        if (cap > 0) fee = Math.min(fee, cap);
      }

      if (fee > 0) {
        await client.query(
          `UPDATE invoice
           SET late_fees = $1,
               amount_due = amount_due + $1,
               updated_at = NOW()
           WHERE id = $2`,
          [fee, inv.id]
        );

        pendingLateFeeNotifications.push({
          tenant_id: inv.tenant_id,
          invoice_id: inv.id,
          amount: fee,
        });

        appliedCount++;
      }
    }

    await client.query("COMMIT");

    console.log(`[lateFeeScheduler] Applied late fees to ${appliedCount} invoices.`);

    for (const feeInfo of pendingLateFeeNotifications) {
      try {
        const tenantRes = await pool.query(
          `SELECT u.email, u.full_name
           FROM tenant t
           JOIN users u ON u.id = t.user_id
           WHERE t.id = $1`,
          [feeInfo.tenant_id]
        );

        const tenantEmail = tenantRes.rows[0]?.email;
        const tenantFullName = tenantRes.rows[0]?.full_name || "Tenant";

        await createNotification(
          feeInfo.tenant_id,
          "late_fee_applied",
          "Late Fee Applied",
          `A late fee of R${Number(feeInfo.amount).toFixed(2)} has been added to your invoice.`,
          feeInfo.invoice_id,
          "invoice"
        );

        if (tenantEmail) {
          await sendLateFeeAppliedEmail({
            email: tenantEmail,
            fullName: tenantFullName,
            amount: feeInfo.amount,
          });
        }

        console.log(`[lateFeeScheduler] Notified tenant ${feeInfo.tenant_id} about late fee.`);
      } catch (notifyErr) {
        console.error(`[lateFeeScheduler] Failed to notify tenant ${feeInfo.tenant_id}:`, notifyErr);
      }
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[lateFeeScheduler] Error applying late fees:", err);
  } finally {
    client.release();
  }
}

function startInvoiceScheduler() {
  cron.schedule("0 2 * * *", async () => {
    console.log("[invoiceScheduler] Running daily invoice check...");
    await generateDueInvoices();
  }, {
    scheduled: true,
    timezone: "Africa/Johannesburg",
  });

  cron.schedule("30 2 * * *", async () => {
    console.log("[invoiceScheduler] Running daily late fee check...");
    await applyLateFees();
  }, {
    scheduled: true,
    timezone: "Africa/Johannesburg",
  });
}

module.exports = { startInvoiceScheduler, generateDueInvoices, applyLateFees };