const express = require("express");
const router = express.Router();
const pool = require("../config/database");
const { requireAuth } = require("../middleware/auth");
const { requireLandlord } = require("../middleware/roleCheck");

async function getLandlordId(userId) {
  const result = await pool.query(
    "SELECT id FROM landlord WHERE user_id = $1",
    [userId],
  );
  return result.rows[0]?.id || null;
}

function num(v) { return Number(v ?? 0); }

// GET /dashboard/login-digest
router.get("/login-digest", requireAuth, async (req, res) => {
  try {
    const role = req.userRole;

    if (role === "landlord") {
      const landlordRes = await pool.query(
        "SELECT id FROM landlord WHERE user_id = $1",
        [req.userId]
      );
      const landlordId = landlordRes.rows[0]?.id;
      if (!landlordId) return res.status(404).json({ error: "Landlord not found" });

      const [
        pendingPayments,
        overdueInvoices,
        highRiskTenants,
        maintenance,
        complaints,
        leasesExpiring,
        collections,
      ] = await Promise.all([
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM payment p
           WHERE p.landlord_id = $1
             AND p.status IN ('pending','pending_approval')`,
          [landlordId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count,
                  COALESCE(SUM(remaining_balance), 0) AS total
           FROM invoice
           WHERE landlord_id = $1
             AND status = 'overdue'`,
          [landlordId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM tenant
           WHERE landlord_id = $1
             AND reliability_score = 'high_risk'`,
          [landlordId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS open_count,
                  COUNT(*) FILTER (WHERE priority IN ('urgent','emergency'))::int AS urgent_count
           FROM maintenance_request
           WHERE landlord_id = $1
             AND status IN ('needs_repair','assigned','in_progress','pending_approval')`,
          [landlordId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS open_count,
                  COUNT(*) FILTER (WHERE status = 'escalated')::int AS escalated_count
           FROM complaint c
           JOIN property p ON p.id = c.property_id
           WHERE p.landlord_id = $1
             AND c.status IN ('open','under_review','awaiting_clarification','approved','escalated')`,
          [landlordId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM lease
           WHERE landlord_id = $1
             AND status = 'active'
             AND lease_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + interval '60 days'`,
          [landlordId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count,
                  COALESCE(SUM(outstanding_balance), 0) AS total
           FROM collection
           WHERE landlord_id = $1
             AND status IN ('active','flagged','repayment_agreed','partial_collection')`,
          [landlordId]
        ),
      ]);

      return res.json({
        role: "landlord",
        digest: {
          pending_payment_approvals: pendingPayments.rows[0].count,
          overdue_invoices: {
            count: overdueInvoices.rows[0].count,
            total: num(overdueInvoices.rows[0].total),
          },
          high_risk_tenants: highRiskTenants.rows[0].count,
          open_maintenance: {
            total: maintenance.rows[0].open_count,
            urgent: maintenance.rows[0].urgent_count,
          },
          open_complaints: {
            total: complaints.rows[0].open_count,
            escalated: complaints.rows[0].escalated_count,
          },
          leases_expiring_soon: leasesExpiring.rows[0].count,
          active_collections: {
            count: collections.rows[0].count,
            total: num(collections.rows[0].total),
          },
        },
      });
    }

    if (role === "caretaker") {
      const caretakerRes = await pool.query(
        "SELECT id, assigned_property FROM caretaker WHERE user_id = $1 AND is_active = true",
        [req.userId]
      );
      const caretaker = caretakerRes.rows[0];
      if (!caretaker) return res.status(404).json({ error: "Caretaker not found" });

      const propertyId = caretaker.assigned_property;
      if (!propertyId) {
        return res.json({
          role: "caretaker",
          digest: {
            open_maintenance: 0,
            complaints_needing_review: 0,
            pending_verdicts: 0,
            escalated_complaints: 0,
            high_risk_tenants: 0,
          },
        });
      }

      const [maintenance, complaints, pendingVerdicts, escalated, highRisk] = await Promise.all([
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM maintenance_request mr
           JOIN unit u ON u.id = mr.unit_id
           WHERE u.property_id = $1
             AND mr.status IN ('needs_repair','assigned','in_progress','pending_approval')`,
          [propertyId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM complaint
           WHERE property_id = $1
             AND status IN ('open','under_review','awaiting_clarification')`,
          [propertyId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM complaint
           WHERE property_id = $1
             AND status = 'approved'`,
          [propertyId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM complaint
           WHERE property_id = $1
             AND status = 'escalated'`,
          [propertyId]
        ),
        pool.query(
          `SELECT COUNT(DISTINCT t.id)::int AS count
           FROM tenant t
           JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
           JOIN unit u ON u.id = l.unit_id
           WHERE u.property_id = $1
             AND t.reliability_score = 'high_risk'`,
          [propertyId]
        ),
      ]);

      return res.json({
        role: "caretaker",
        digest: {
          open_maintenance: maintenance.rows[0].count,
          complaints_needing_review: complaints.rows[0].count,
          pending_verdicts: pendingVerdicts.rows[0].count,
          escalated_complaints: escalated.rows[0].count,
          high_risk_tenants: highRisk.rows[0].count,
        },
      });
    }

    if (role === "tenant") {
      const tenantRes = await pool.query(
        "SELECT id FROM tenant WHERE user_id = $1",
        [req.userId]
      );
      const tenantId = tenantRes.rows[0]?.id;
      if (!tenantId) return res.status(404).json({ error: "Tenant not found" });

      const [currentInvoice, openMaintenance, openComplaints, unreadMessages, pendingPayments] = await Promise.all([
        pool.query(
          `SELECT i.id, i.amount_due, i.remaining_balance, i.status, i.due_date
           FROM invoice i
           WHERE i.tenant_id = $1
             AND i.status IN ('sent','overdue','partial')
           ORDER BY i.due_date ASC
           LIMIT 1`,
          [tenantId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM maintenance_request
           WHERE tenant_id = $1
             AND status NOT IN ('completed','closed','cancelled')`,
          [tenantId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM complaint
           WHERE filed_by_tenant_id = $1
             AND status NOT IN ('resolved','dismissed','rejected')`,
          [tenantId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM message
           WHERE recipient_id = $1 AND is_read = false`,
          [req.userId]
        ),
        pool.query(
          `SELECT COUNT(*)::int AS count
           FROM payment
           WHERE tenant_id = $1
             AND status IN ('pending','pending_approval')`,
          [tenantId]
        ),
      ]);

      return res.json({
        role: "tenant",
        digest: {
          current_invoice: currentInvoice.rows[0] || null,
          open_maintenance: openMaintenance.rows[0].count,
          open_complaints: openComplaints.rows[0].count,
          unread_messages: unreadMessages.rows[0].count,
          pending_payments: pendingPayments.rows[0].count,
        },
      });
    }

    return res.status(403).json({ error: "Unknown role" });
  } catch (err) {
    console.error("Login digest:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /landlord/dashboard
router.get("/", requireAuth, requireLandlord, async (req, res) => {
  try {
    const landlordId = await getLandlordId(req.userId);
    if (!landlordId) {
      return res.status(404).json({ error: "Landlord not found" });
    }

    const [
      overviewRes,
      todayRes,
      weekRes,
      monthRes,
      revenueTrendRes,
      pendingPaymentsRes,
      urgentMaintenanceRes,
      openComplaintsRes,
      leasesExpiringRes,
      collectionsRes,
      pendingDocumentsRes,
      reliabilityBreakdownRes,
      scoreTrendRes,
      highRiskTenantsRes,
    ] = await Promise.all([
      pool.query(
        `SELECT
          (SELECT COUNT(*) FROM property WHERE landlord_id = $1) AS total_properties,
          (SELECT COUNT(*) FROM unit u JOIN property p ON p.id = u.property_id
            WHERE p.landlord_id = $1) AS total_units,
          (SELECT COUNT(*) FROM unit u JOIN property p ON p.id = u.property_id
            WHERE p.landlord_id = $1 AND u.status = 'occupied') AS occupied_units,
          (SELECT COUNT(*) FROM unit u JOIN property p ON p.id = u.property_id
            WHERE p.landlord_id = $1 AND u.status = 'vacant') AS vacant_units,
          (SELECT COUNT(*) FROM tenant WHERE landlord_id = $1) AS total_tenants,
          (SELECT COUNT(*) FROM lease WHERE landlord_id = $1 AND status = 'active') AS active_leases,
          (SELECT COALESCE(SUM(remaining_balance), 0) FROM invoice
            WHERE landlord_id = $1 AND status NOT IN ('paid','void','cancelled')) AS total_outstanding,
          (SELECT COUNT(*) FROM tenant
            WHERE landlord_id = $1 AND (reliability_score = 'high_risk' OR standing <> 'good_standing')) AS tenants_needing_attention,
          (SELECT COUNT(*) FROM collection
            WHERE landlord_id = $1 AND status IN ('active','flagged','repayment_agreed')) AS active_collections`,
        [landlordId],
      ),

      pool.query(
        `SELECT
          (SELECT COUNT(*) FROM payment
            WHERE landlord_id = $1 AND status = 'paid' AND payment_date::date = CURRENT_DATE) AS payments_count,
          (SELECT COALESCE(SUM(amount_paid), 0) FROM payment
            WHERE landlord_id = $1 AND status = 'paid' AND payment_date::date = CURRENT_DATE) AS payments_amount,
          (SELECT COUNT(*) FROM payment
            WHERE landlord_id = $1 AND status IN ('pending','pending_approval') AND created_at::date = CURRENT_DATE) AS new_payments_pending,
          (SELECT COUNT(*) FROM invoice
            WHERE landlord_id = $1 AND due_date = CURRENT_DATE AND status NOT IN ('paid','void','cancelled')) AS invoices_due,
          (SELECT COUNT(*) FROM maintenance_request
            WHERE landlord_id = $1 AND created_at::date = CURRENT_DATE) AS maintenance_reported,
          (SELECT COUNT(*) FROM complaint c JOIN property p ON p.id = c.property_id
            WHERE p.landlord_id = $1 AND c.created_at::date = CURRENT_DATE) AS complaints_filed`,
        [landlordId],
      ),

      pool.query(
        `SELECT
          (SELECT COALESCE(SUM(amount_paid), 0) FROM payment
            WHERE landlord_id = $1 AND status = 'paid'
              AND payment_date >= date_trunc('week', CURRENT_DATE)) AS revenue,
          (SELECT COUNT(*) FROM invoice
            WHERE landlord_id = $1
              AND due_date >= date_trunc('week', CURRENT_DATE)::date
              AND due_date < (date_trunc('week', CURRENT_DATE) + interval '7 days')::date) AS invoices_due,
          (SELECT COUNT(*) FROM invoice
            WHERE landlord_id = $1 AND status = 'overdue') AS overdue_invoices,
          (SELECT COUNT(*) FROM maintenance_request
            WHERE landlord_id = $1 AND created_at >= date_trunc('week', CURRENT_DATE)) AS maintenance_opened,
          (SELECT COUNT(*) FROM maintenance_request
            WHERE landlord_id = $1 AND completed_at >= date_trunc('week', CURRENT_DATE)) AS maintenance_completed,
          (SELECT COUNT(*) FROM lease
            WHERE landlord_id = $1 AND created_at >= date_trunc('week', CURRENT_DATE)) AS new_leases,
          (SELECT COUNT(*) FROM payment
            WHERE landlord_id = $1 AND status IN ('pending','pending_approval')) AS pending_approvals`,
        [landlordId],
      ),

      pool.query(
        `SELECT
          (SELECT COALESCE(SUM(amount_paid), 0) FROM payment
            WHERE landlord_id = $1 AND status = 'paid'
              AND payment_date >= date_trunc('month', CURRENT_DATE)) AS revenue,
          (SELECT COALESCE(SUM(amount_due), 0) FROM invoice
            WHERE landlord_id = $1
              AND billing_period_start >= date_trunc('month', CURRENT_DATE)::date
              AND billing_period_start < (date_trunc('month', CURRENT_DATE) + interval '1 month')::date) AS expected,
          (SELECT COUNT(*) FROM tenant
            WHERE landlord_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE)) AS new_tenants,
          (SELECT COUNT(*) FROM lease
            WHERE landlord_id = $1 AND status = 'active'
              AND lease_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + interval '30 days') AS leases_expiring_30d,
          (SELECT COUNT(*) FROM lease
            WHERE landlord_id = $1 AND status = 'active'
              AND lease_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + interval '60 days') AS leases_expiring_60d,
          (SELECT COUNT(*) FROM complaint c JOIN property p ON p.id = c.property_id
            WHERE p.landlord_id = $1 AND c.created_at >= date_trunc('month', CURRENT_DATE)) AS complaints_filed,
          (SELECT COUNT(*) FROM complaint c JOIN property p ON p.id = c.property_id
            WHERE p.landlord_id = $1 AND c.status IN ('resolved','dismissed')
              AND c.resolved_at >= date_trunc('month', CURRENT_DATE)) AS complaints_resolved,
          (SELECT COUNT(*) FROM maintenance_request
            WHERE landlord_id = $1 AND created_at >= date_trunc('month', CURRENT_DATE)) AS maintenance_opened,
          (SELECT COUNT(*) FROM maintenance_request
            WHERE landlord_id = $1 AND completed_at >= date_trunc('month', CURRENT_DATE)) AS maintenance_completed,
          (SELECT ROUND(AVG(reliability_score_value), 1) FROM tenant
            WHERE landlord_id = $1 AND reliability_score_value IS NOT NULL) AS avg_reliability_score`,
        [landlordId],
      ),

      pool.query(
        `SELECT date_trunc('week', payment_date)::date AS week_start,
                COALESCE(SUM(amount_paid), 0) AS amount
         FROM payment
         WHERE landlord_id = $1 AND status = 'paid'
           AND payment_date >= CURRENT_DATE - interval '8 weeks'
         GROUP BY week_start
         ORDER BY week_start ASC`,
        [landlordId],
      ),

      pool.query(
        `SELECT p.id, p.amount_paid, p.payment_method, p.created_at,
                usr.full_name AS tenant_name, u.unit_number,
                COUNT(*) OVER() AS total_count
         FROM payment p
         JOIN tenant t ON t.id = p.tenant_id
         JOIN users usr ON usr.id = t.user_id
         LEFT JOIN invoice inv ON inv.id = p.invoice_id
         LEFT JOIN unit u ON u.id = inv.unit_id
         WHERE p.landlord_id = $1 AND p.status IN ('pending','pending_approval')
         ORDER BY p.created_at ASC
         LIMIT 5`,
        [landlordId],
      ),

      pool.query(
        `SELECT m.id, m.request_number, m.title, m.priority, m.status, m.created_at,
                usr.full_name AS tenant_name, u.unit_number,
                COUNT(*) OVER() AS total_count
         FROM maintenance_request m
         JOIN tenant t ON t.id = m.tenant_id
         JOIN users usr ON usr.id = t.user_id
         JOIN unit u ON u.id = m.unit_id
         WHERE m.landlord_id = $1
           AND m.priority IN ('urgent','emergency')
           AND m.status NOT IN ('completed','cancelled','closed')
         ORDER BY m.priority = 'emergency' DESC, m.created_at ASC
         LIMIT 5`,
        [landlordId],
      ),

      pool.query(
        `SELECT c.id, c.subject, c.category, c.severity, c.status, c.created_at,
                p.name AS property_name,
                COUNT(*) OVER() AS total_count
         FROM complaint c
         JOIN property p ON p.id = c.property_id
         WHERE p.landlord_id = $1
           AND c.status IN ('open','under_review','escalated','awaiting_clarification')
         ORDER BY c.severity DESC, c.created_at ASC
         LIMIT 5`,
        [landlordId],
      ),

      pool.query(
        `SELECT l.id, l.lease_end_date, usr.full_name AS tenant_name,
                u.unit_number, p.name AS property_name,
                COUNT(*) OVER() AS total_count
         FROM lease l
         JOIN tenant t ON t.id = l.tenant_id
         JOIN users usr ON usr.id = t.user_id
         JOIN unit u ON u.id = l.unit_id
         JOIN property p ON p.id = u.property_id
         WHERE l.landlord_id = $1 AND l.status = 'active'
           AND l.lease_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + interval '60 days'
         ORDER BY l.lease_end_date ASC
         LIMIT 5`,
        [landlordId],
      ),

      pool.query(
        `SELECT col.id, col.outstanding_balance, col.days_overdue,
                usr.full_name AS tenant_name,
                COUNT(*) OVER() AS total_count
         FROM collection col
         JOIN tenant t ON t.id = col.tenant_id
         JOIN users usr ON usr.id = t.user_id
         WHERE col.landlord_id = $1 AND col.status IN ('active','flagged','repayment_agreed')
         ORDER BY col.outstanding_balance DESC
         LIMIT 5`,
        [landlordId],
      ),

      pool.query(
        `SELECT d.id, d.document_name, d.document_type, d.created_at,
                usr.full_name AS tenant_name,
                COUNT(*) OVER() AS total_count
         FROM document d
         LEFT JOIN tenant t ON t.id = d.tenant_id
         LEFT JOIN users usr ON usr.id = t.user_id
         WHERE d.landlord_id = $1 AND d.verification_status = 'pending'
         ORDER BY d.created_at ASC
         LIMIT 5`,
        [landlordId],
      ),

      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE reliability_score = 'reliable') AS reliable_count,
           COUNT(*) FILTER (WHERE reliability_score = 'moderate_risk') AS moderate_count,
           COUNT(*) FILTER (WHERE reliability_score = 'high_risk') AS high_risk_count,
           ROUND(AVG(reliability_score_value) FILTER (WHERE reliability_score_value IS NOT NULL), 1) AS avg_score
         FROM tenant
         WHERE landlord_id = $1`,
        [landlordId],
      ),

      pool.query(
        `SELECT date_trunc('month', h.created_at)::date AS month,
                ROUND(AVG(h.new_score_value), 1) AS avg_score
         FROM tenant_score_history h
         JOIN tenant t ON t.id = h.tenant_id
         WHERE t.landlord_id = $1
           AND h.created_at >= now() - interval '6 months'
         GROUP BY month
         ORDER BY month ASC`,
        [landlordId],
      ),

      pool.query(
        `SELECT t.id, usr.full_name AS tenant_name,
                u.unit_number, p.name AS property_name,
                t.reliability_score_value AS score,
                COUNT(*) OVER() AS total_count
         FROM tenant t
         JOIN users usr ON usr.id = t.user_id
         LEFT JOIN lease l ON l.tenant_id = t.id AND l.status = 'active'
         LEFT JOIN unit u ON u.id = l.unit_id
         LEFT JOIN property p ON p.id = u.property_id
         WHERE t.landlord_id = $1
           AND t.reliability_score = 'high_risk'
         ORDER BY t.reliability_score_value ASC
         LIMIT 5`,
        [landlordId],
      ),
    ]);

    const overview = overviewRes.rows[0];
    const today = todayRes.rows[0];
    const week = weekRes.rows[0];
    const month = monthRes.rows[0];

    const trendByWeek = new Map(
      revenueTrendRes.rows.map((r) => [
        r.week_start.toISOString().slice(0, 10),
        num(r.amount),
      ]),
    );
    const revenueTrend = [];
    const cursor = new Date();
    cursor.setHours(0, 0, 0, 0);
    const day = (cursor.getDay() + 6) % 7;
    cursor.setDate(cursor.getDate() - day - 7 * 7);
    for (let i = 0; i < 8; i++) {
      const key = cursor.toISOString().slice(0, 10);
      revenueTrend.push({ week_start: key, amount: trendByWeek.get(key) || 0 });
      cursor.setDate(cursor.getDate() + 7);
    }

    const occupiedUnits = num(overview.occupied_units);
    const totalUnits = num(overview.total_units);
    const occupancyRate = totalUnits > 0 ? (occupiedUnits / totalUnits) * 100 : 0;

    const monthRevenue = num(month.revenue);
    const monthExpected = num(month.expected);
    const collectionRate =
      monthExpected > 0 ? Math.min(100, (monthRevenue / monthExpected) * 100) : null;

    const strip = (rows) => {
      const total = rows.length ? Number(rows[0].total_count) : 0;
      const items = rows.map(({ total_count, ...rest }) => rest);
      return { count: total, items };
    };

    res.json({
      generated_at: new Date().toISOString(),

      overview: {
        total_properties: num(overview.total_properties),
        total_units: totalUnits,
        occupied_units: occupiedUnits,
        vacant_units: num(overview.vacant_units),
        occupancy_rate: Math.round(occupancyRate * 10) / 10,
        total_tenants: num(overview.total_tenants),
        active_leases: num(overview.active_leases),
        total_outstanding: num(overview.total_outstanding),
        tenants_needing_attention: num(overview.tenants_needing_attention),
        active_collections: num(overview.active_collections),
      },

      today: {
        payments_count: num(today.payments_count),
        payments_amount: num(today.payments_amount),
        new_payments_pending: num(today.new_payments_pending),
        invoices_due: num(today.invoices_due),
        maintenance_reported: num(today.maintenance_reported),
        complaints_filed: num(today.complaints_filed),
      },

      this_week: {
        revenue: num(week.revenue),
        invoices_due: num(week.invoices_due),
        overdue_invoices: num(week.overdue_invoices),
        maintenance_opened: num(week.maintenance_opened),
        maintenance_completed: num(week.maintenance_completed),
        new_leases: num(week.new_leases),
        pending_approvals: num(week.pending_approvals),
      },

      this_month: {
        revenue: monthRevenue,
        expected: monthExpected,
        collection_rate: collectionRate === null ? null : Math.round(collectionRate * 10) / 10,
        new_tenants: num(month.new_tenants),
        leases_expiring_30d: num(month.leases_expiring_30d),
        leases_expiring_60d: num(month.leases_expiring_60d),
        complaints_filed: num(month.complaints_filed),
        complaints_resolved: num(month.complaints_resolved),
        maintenance_opened: num(month.maintenance_opened),
        maintenance_completed: num(month.maintenance_completed),
        avg_reliability_score: month.avg_reliability_score === null ? null : Number(month.avg_reliability_score),
      },

      revenue_trend: revenueTrend,

      reliability_breakdown: {
        reliable: num(reliabilityBreakdownRes.rows[0]?.reliable_count),
        moderate_risk: num(reliabilityBreakdownRes.rows[0]?.moderate_count),
        high_risk: num(reliabilityBreakdownRes.rows[0]?.high_risk_count),
        avg_score: reliabilityBreakdownRes.rows[0]?.avg_score === null
          ? null
          : Number(reliabilityBreakdownRes.rows[0]?.avg_score),
      },

      reliability_trend: scoreTrendRes.rows.map(r => ({
        month: r.month.toISOString().slice(0, 10),
        avg_score: r.avg_score === null ? null : Number(r.avg_score),
      })),

      action_required: {
        pending_payment_approvals: {
          ...strip(pendingPaymentsRes.rows),
          link: "/landlord/payments?status=pending,pending_approval",
        },
        urgent_maintenance: {
          ...strip(urgentMaintenanceRes.rows),
          link: "/landlord/maintenance?priority=urgent,emergency",
        },
        open_complaints: {
          ...strip(openComplaintsRes.rows),
          link: "/landlord/complaints?status=open,under_review,escalated",
        },
        leases_expiring_soon: {
          ...strip(leasesExpiringRes.rows),
          link: "/landlord/leases?expiring=60",
        },
        tenants_in_collections: {
          ...strip(collectionsRes.rows),
          link: "/landlord/collections",
        },
        documents_pending_verification: {
          ...strip(pendingDocumentsRes.rows),
          link: "/landlord/documents?status=pending",
        },
        high_risk_tenants: {
          ...strip(highRiskTenantsRes.rows),
          link: "/landlord/tenants?risk=high_risk",
        },
      },
    });
  } catch (err) {
    console.error("Get dashboard:", err);
    res.status(500).json({ error: "Server error" });
  }
});



module.exports = router;