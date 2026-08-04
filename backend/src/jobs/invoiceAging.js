

const pool = require("../config/database");
const { createNotification } = require("../utils/notifications");

async function markOverdueInvoices() {
  const result = await pool.query(`
    UPDATE public.invoice inv
    SET status = 'overdue'
    FROM public.lease l
    WHERE inv.lease_id = l.id
      AND inv.status IN ('sent', 'partial')
      AND inv.due_date + l.grace_period_days < CURRENT_DATE
    RETURNING inv.id, inv.tenant_id, inv.landlord_id
  `);
  return result.rows;
}


async function applyLateFees() {
  const result = await pool.query(`
    UPDATE public.invoice inv
    SET late_fees = l.late_fee_amount,
        amount_due = inv.amount_due + l.late_fee_amount
    FROM public.lease l
    WHERE inv.lease_id = l.id
      AND inv.status = 'overdue'
      AND inv.late_fees = 0
      AND inv.due_date + l.late_fee_after_days < CURRENT_DATE
    RETURNING inv.id, inv.tenant_id, inv.landlord_id, l.late_fee_amount
  `);
  return result.rows;
}

async function autoFlagCollections() {
  const settingsRes = await pool.query(`
    SELECT
      split_part(setting_key, 'payment_settings_', 2)::uuid AS landlord_id,
      setting_value
    FROM public.system_setting
    WHERE setting_key LIKE 'payment_settings_%'
      AND (setting_value->>'auto_collections')::boolean IS TRUE
  `);

  const flagged = [];

  for (const row of settingsRes.rows) {
    const landlordId = row.landlord_id;
    const collectionsAfterDays = row.setting_value.collections_after_days || 60;
    const collectionsNote = row.setting_value.collections_note || null;

    const overdueTenants = await pool.query(
      `SELECT inv.tenant_id, inv.lease_id,
              SUM(inv.remaining_balance) AS balance,
              MAX(CURRENT_DATE - inv.due_date) AS days_overdue
       FROM public.invoice inv
       WHERE inv.landlord_id = $1
         AND inv.status = 'overdue'
         AND (CURRENT_DATE - inv.due_date) >= $2
         AND NOT EXISTS (
           SELECT 1 FROM public.collection c
           WHERE c.tenant_id = inv.tenant_id AND c.status = 'active'
         )
       GROUP BY inv.tenant_id, inv.lease_id`,
      [landlordId, collectionsAfterDays]
    );

    for (const t of overdueTenants.rows) {
      const inserted = await pool.query(
        `INSERT INTO public.collection (
           tenant_id, lease_id, landlord_id, outstanding_balance,
           days_overdue, status, flagged_at, notes
         ) VALUES ($1, $2, $3, $4, $5, 'active', NOW(), $6)
         RETURNING id`,
        [
          t.tenant_id, t.lease_id, landlordId, t.balance, t.days_overdue,
          collectionsNote || `Automatically flagged: overdue balance exceeded ${collectionsAfterDays}-day threshold`,
        ]
      );

      await createNotification(
        t.tenant_id,
        "payment_rejected",
        "Account Sent to Collections",
        `Your account has been automatically escalated to collections for an outstanding balance of R${t.balance}.`,
        inserted.rows[0].id,
        "collection"
      );

      flagged.push(t);
    }
  }

  return flagged;
}

async function runInvoiceAgingJob() {
  const startedAt = new Date().toISOString();
  console.log(`[invoice-aging] Starting run at ${startedAt}`);

  try {
    const overdue = await markOverdueInvoices();
    console.log(`[invoice-aging] Marked ${overdue.length} invoice(s) overdue`);

    const feesApplied = await applyLateFees();
    console.log(`[invoice-aging] Applied late fees to ${feesApplied.length} invoice(s)`);
    for (const inv of feesApplied) {
      await createNotification(
        inv.tenant_id,
        "payment_due",
        "Late Fee Applied",
        `A late fee of R${inv.late_fee_amount} has been added to your overdue invoice.`,
        inv.id,
        "invoice"
      );
    }

    const flagged = await autoFlagCollections();
    console.log(`[invoice-aging] Auto-flagged ${flagged.length} tenant(s) to collections`);

    const affectedTenantIds = new Set([
      ...overdue.map((r) => r.tenant_id),
      ...feesApplied.map((r) => r.tenant_id),
      ...flagged.map((r) => r.tenant_id),
    ]);

    for (const tenantId of affectedTenantIds) {
      await pool.query(`SELECT public.recalculate_payment_history($1)`, [tenantId]);
      await pool.query(`SELECT public.recalculate_tenant_score($1, NULL)`, [tenantId]);
    }

    console.log(`[invoice-aging] Run complete. Recalculated ${affectedTenantIds.size} tenant(s).`);
    return { overdueCount: overdue.length, feesAppliedCount: feesApplied.length, flaggedCount: flagged.length };
  } catch (err) {
    console.error("[invoice-aging] Job failed:", err);
    throw err;
  }
}

module.exports = { runInvoiceAgingJob, markOverdueInvoices, applyLateFees, autoFlagCollections };


if (require.main === module) {
  runInvoiceAgingJob()
    .then((summary) => {
      console.log("Manual run summary:", summary);
      process.exit(0);
    })
    .catch(() => process.exit(1));
}


