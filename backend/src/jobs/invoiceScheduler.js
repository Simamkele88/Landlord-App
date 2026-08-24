const cron = require("node-cron");
const pool = require("../config/database");
const { createNotification } = require("../utils/notifications");
const {
  sendInvoiceCreatedEmail,
  sendLateFeeAppliedEmail,
} = require("../utils/email");

function getNextBillingDates(leaseStart, frequency, dueDay, referenceDate) {
  const today = referenceDate || new Date();
  const start = new Date(leaseStart);
  const baseDate = new Date(Math.max(today.getTime(), start.getTime()));
  let periodStart, periodEnd, dueDate;

  switch (frequency) {
    case "weekly": {
      const day = baseDate.getDay();
      const offset = (7 - day + 1) % 7;
      periodStart = new Date(baseDate);
      periodStart.setDate(baseDate.getDate() + offset);
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodStart.getDate() + 6);
      dueDate = new Date(periodStart);
      break;
    }
    case "monthly": {
      periodStart = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth() + 1,
        1,
      );
      periodEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 2, 0);
      dueDate = new Date(periodStart);
      const lastDay = periodEnd.getDate();
      dueDate.setDate(Math.min(dueDay || 1, lastDay));
      break;
    }
    case "quarterly": {
      const qMonth = baseDate.getMonth() - (baseDate.getMonth() % 3) + 3;
      periodStart = new Date(baseDate.getFullYear(), qMonth, 1);
      periodEnd = new Date(baseDate.getFullYear(), qMonth + 3, 0);
      dueDate = new Date(periodStart);
      const lastDay = periodEnd.getDate();
      dueDate.setDate(Math.min(dueDay || 1, lastDay));
      break;
    }
    case "annually": {
      periodStart = new Date(baseDate.getFullYear() + 1, 0, 1);
      periodEnd = new Date(baseDate.getFullYear() + 1, 11, 31);
      dueDate = new Date(periodStart);
      dueDate.setDate(Math.min(dueDay || 1, 31));
      break;
    }
    default: {
      periodStart = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth() + 1,
        1,
      );
      periodEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 2, 0);
      dueDate = new Date(periodStart);
      const lastDay = periodEnd.getDate();
      dueDate.setDate(Math.min(dueDay || 1, lastDay));
    }
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
       ORDER BY l.id`,
    );

    let createdCount = 0;
    let skippedCount = 0;

    for (const lease of leasesRes.rows) {
      const { billing_period_start, billing_period_end, due_date } =
        getNextBillingDates(
          lease.lease_start_date,
          lease.payment_frequency,
          lease.payment_due_day,
          new Date(),
        );

      const existing = await client.query(
        `SELECT id FROM invoice
         WHERE lease_id = $1
           AND invoice_type = 'rent'
           AND billing_period_start = $2
         LIMIT 1`,
        [lease.id, billing_period_start],
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
        ],
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

    console.log(
      `[invoiceScheduler] Generated ${createdCount} invoices, skipped ${skippedCount} existing.`,
    );

    for (const info of pendingNotifications) {
      try {
        const tenantRes = await pool.query(
          `SELECT u.email, u.full_name
           FROM tenant t
           JOIN users u ON u.id = t.user_id
           WHERE t.id = $1`,
          [info.tenant_id],
        );

        const tenantEmail = tenantRes.rows[0]?.email;
        const tenantFullName = tenantRes.rows[0]?.full_name || "Tenant";

        await createNotification(
          info.tenant_id,
          "invoice_created",
          "New Rent Invoice",
          `A new rent invoice of R${Number(info.amount).toFixed(2)} has been generated. Due date: ${info.due_date}.`,
          info.invoice_id,
          "invoice",
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

        console.log(
          `[invoiceScheduler] Notified tenant ${info.tenant_id} for invoice ${info.invoice_number}`,
        );
      } catch (notifyErr) {
        console.error(
          `[invoiceScheduler] Failed to notify tenant ${info.tenant_id}:`,
          notifyErr,
        );
      }
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[invoiceScheduler] Error generating invoices:", err);
    throw err;
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
      `SELECT landlord_id, late_fee_type, late_fee_value, late_fee_cap,
              grace_period_days, apply_late_fee_after_days
       FROM landlord_settings
       WHERE late_fee_type IS NOT NULL AND late_fee_type != 'none'`,
    );

    if (settingsRes.rows.length === 0) {
      console.log("[lateFeeScheduler] No landlords with late fees enabled.");
      return;
    }

    for (const landlordSetting of settingsRes.rows) {
      const {
        landlord_id,
        late_fee_type,
        late_fee_value,
        late_fee_cap,
        grace_period_days: defaultGrace,
        apply_late_fee_after_days: defaultApplyAfter,
      } = landlordSetting;

      const invoicesRes = await client.query(
        `SELECT i.id, i.tenant_id, i.landlord_id, i.rent_amount, i.due_date,
                l.grace_period_days AS lease_grace_days,
                l.late_fee_amount AS lease_fixed_fee
         FROM invoice i
         JOIN lease l ON l.id = i.lease_id
         WHERE i.landlord_id = $1
           AND i.status IN ('sent','partial','overdue')
           AND i.due_date < CURRENT_DATE
           AND i.late_fees = 0
         ORDER BY i.due_date ASC`,
        [landlord_id],
      );

      if (invoicesRes.rows.length === 0) continue;

      for (const inv of invoicesRes.rows) {
        const graceDays = Number(inv.lease_grace_days ?? defaultGrace ?? 5);
        const applyAfter = Number(defaultApplyAfter ?? 0);
        const due = new Date(inv.due_date);
        const today = new Date();
        const daysPastDue = Math.floor((today - due) / (1000 * 60 * 60 * 24));

        if (daysPastDue <= graceDays + applyAfter) continue;

        let fee = 0;
        if (late_fee_type === "fixed") {
          fee = Number(inv.lease_fixed_fee ?? late_fee_value ?? 0);
        } else if (late_fee_type === "percentage") {
          const pct = Number(late_fee_value) || 0;
          fee = (pct / 100) * Number(inv.rent_amount);
          const cap = Number(late_fee_cap);
          if (cap > 0) fee = Math.min(fee, cap);
        }

        if (fee > 0) {
          await client.query(
            `UPDATE invoice
             SET late_fees = $1,
                 amount_due = amount_due + $1,
                 updated_at = NOW()
             WHERE id = $2`,
            [fee, inv.id],
          );

          pendingLateFeeNotifications.push({
            tenant_id: inv.tenant_id,
            invoice_id: inv.id,
            amount: fee,
          });
        }
      }
    }

    await client.query("COMMIT");

    console.log(
      `[lateFeeScheduler] Applied late fees to ${pendingLateFeeNotifications.length} invoices.`,
    );

    for (const feeInfo of pendingLateFeeNotifications) {
      try {
        const tenantRes = await pool.query(
          `SELECT u.email, u.full_name
           FROM tenant t
           JOIN users u ON u.id = t.user_id
           WHERE t.id = $1`,
          [feeInfo.tenant_id],
        );

        const tenantEmail = tenantRes.rows[0]?.email;
        const tenantFullName = tenantRes.rows[0]?.full_name || "Tenant";

        await createNotification(
          feeInfo.tenant_id,
          "late_fee_applied",
          "Late Fee Applied",
          `A late fee of R${Number(feeInfo.amount).toFixed(2)} has been added to your invoice.`,
          feeInfo.invoice_id,
          "invoice",
        );

        if (tenantEmail) {
          await sendLateFeeAppliedEmail({
            email: tenantEmail,
            fullName: tenantFullName,
            amount: feeInfo.amount,
          });
        }

        console.log(
          `[lateFeeScheduler] Notified tenant ${feeInfo.tenant_id} about late fee.`,
        );
      } catch (notifyErr) {
        console.error(
          `[lateFeeScheduler] Failed to notify tenant ${feeInfo.tenant_id}:`,
          notifyErr,
        );
      }
    }
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[lateFeeScheduler] Error applying late fees:", err);
    throw err;
  } finally {
    client.release();
  }
}

async function markOverdueInvoices() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `UPDATE invoice
       SET status = 'overdue', updated_at = NOW()
       WHERE status = 'sent'
         AND due_date < CURRENT_DATE
       RETURNING id, tenant_id`,
    );
    await client.query("COMMIT");
    console.log(
      `[invoiceScheduler] Marked ${result.rowCount} invoices overdue.`,
    );
    return result.rows;
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("[invoiceScheduler] Error marking overdue:", err);
    return [];
  } finally {
    client.release();
  }
}

async function autoSendToCollections() {
  const client = await pool.connect();
  try {
    const settingsRes = await client.query(
      `SELECT landlord_id, auto_send_collections, grace_period_days,
              collection_trigger_days
       FROM landlord_settings
       WHERE auto_send_collections = true
         AND collection_trigger_days IS NOT NULL`,
    );

    if (!settingsRes.rows.length) {
      console.log("[invoiceScheduler] No landlords with auto‑send enabled.");
      return;
    }

    for (const s of settingsRes.rows) {
      const threshold = Number(s.collection_trigger_days) || 30;

      const candidates = await client.query(
        `SELECT i.tenant_id, i.lease_id, i.landlord_id, i.remaining_balance,
                (CURRENT_DATE - i.due_date) AS days_overdue
         FROM invoice i
         WHERE i.landlord_id = $1
           AND i.status = 'overdue'
           AND i.remaining_balance > 0
           AND (CURRENT_DATE - i.due_date) >= $2
           AND NOT EXISTS (SELECT 1 FROM collection c WHERE c.tenant_id = i.tenant_id)
           AND NOT EXISTS (
             SELECT 1 FROM repayment_plan rp
             WHERE rp.tenant_id = i.tenant_id AND rp.status IN ('active','pending')
           )`,
        [s.landlord_id, threshold],
      );

      for (const c of candidates.rows) {
        await client.query(
          `INSERT INTO collection (
             tenant_id, lease_id, landlord_id, outstanding_balance,
             days_overdue, status, flagged_by, flagged_at, notes, created_at, updated_at
           ) VALUES ($1, $2, $3, $4, $5, 'flagged', NULL, NOW(),
                      'Auto-flagged by system', NOW(), NOW())`,
          [
            c.tenant_id,
            c.lease_id,
            c.landlord_id,
            c.remaining_balance,
            c.days_overdue,
          ],
        );
        await createNotification(
          c.tenant_id,
          "account_status",
          "Account Flagged for Collections",
          "Your account has been automatically flagged due to a significantly overdue balance. Please contact your landlord or request a repayment plan.",
          null,
          "collection",
        );
      }
      if (candidates.rows.length) {
        console.log(
          `[invoiceScheduler] Auto-flagged ${candidates.rows.length} tenant(s) for landlord ${s.landlord_id}.`,
        );
      }
    }
  } catch (err) {
    console.error("[invoiceScheduler] Auto-send collections error:", err);
  } finally {
    client.release();
  }
}

function startInvoiceScheduler() {
  cron.schedule(
    "0 2 * * *",
    async () => {
      console.log("[invoiceScheduler] Running daily invoice check...");
      try {
        await generateDueInvoices();
      } catch (err) {
        console.error("[invoiceScheduler] Invoice generation failed:", err);
      }
    },
    {
      scheduled: true,
      timezone: "Africa/Johannesburg",
    },
  );

  cron.schedule(
    "0 3 * * *",
    async () => {
      console.log("[invoiceScheduler] Running daily late fee check...");
      try {
        await applyLateFees();
      } catch (err) {
        console.error("[invoiceScheduler] Late fee application failed:", err);
      }
    },
    {
      scheduled: true,
      timezone: "Africa/Johannesburg",
    },
  );

  cron.schedule(
    "30 3 * * *",
    async () => {
      console.log("[invoiceScheduler] Marking overdue invoices...");
      try {
        await markOverdueInvoices();
      } catch (err) {
        console.error("[invoiceScheduler] Overdue marking failed:", err);
      }
    },
    {
      scheduled: true,
      timezone: "Africa/Johannesburg",
    },
  );

  cron.schedule(
    "0 4 * * *",
    async () => {
      console.log("[invoiceScheduler] Running auto‑collections...");
      try {
        await autoSendToCollections();
      } catch (err) {
        console.error("[invoiceScheduler] Auto‑collections failed:", err);
      }
    },
    {
      scheduled: true,
      timezone: "Africa/Johannesburg",
    },
  );

  console.log("[invoiceScheduler] All cron jobs scheduled.");
}

module.exports = {
  startInvoiceScheduler,
  generateDueInvoices,
  applyLateFees,
  markOverdueInvoices,
  autoSendToCollections,
};
