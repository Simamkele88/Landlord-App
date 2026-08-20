// LANDLORD DASHBOARD
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import useDocumentTitle from "../../hooks/useDocumentTitle";

const API_BASE = "http://localhost:4000";

const COLORS = {
  text: "#1f2328",
  textMuted: "#5f6b7a",
  link: "#1a73e8",
  border: "#dfe3e8",
  borderLight: "#eef1f4",
  headBg: "#f7f8fa",
  green: "#2b7a4b",
  white: "#fdfdfd",
  red: "#9e3a3a",
  gold: "#8b6e1a",
  blue: "#2c6b9b",
  accent: "#3498db",
  dark: "#2c3e50",
};

const FONT =
  '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const currency = (n) =>
  "R " + Number(n || 0).toLocaleString("en-ZA", { maximumFractionDigits: 0 });

const compactCurrency = (n) => {
  const v = Number(n || 0);
  if (Math.abs(v) >= 1_000_000) return "R " + (v / 1_000_000).toFixed(1) + "m";
  if (Math.abs(v) >= 1_000) return "R " + (v / 1_000).toFixed(1) + "k";
  return currency(v);
};

const dateShort = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" })
    : "—";

const timeAgo = (iso) => {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
};

export default function Dashboard() {
  useDocumentTitle("Dashboard");

  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  const load = useCallback(async () => {
    setStatus((s) => (s === "ready" ? "ready" : "loading"));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/landlord/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const json = await res.json();
      setData(json);
      setStatus("ready");
    } catch (err) {
      console.error("Dashboard load failed:", err);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [load]);

  return (
    <div style={styles.page}>
      <style>{css}</style>

      <header style={styles.header}>
        <div>
          <h1 style={styles.h1}>Dashboard</h1>
        </div>
        {data && (
          <div style={styles.asOf}>
            as of {new Date(data.generated_at).toLocaleTimeString("en-ZA", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </header>

      {status === "loading" && <Loading />}
      {status === "error" && <ErrorState onRetry={load} />}
      {status === "ready" && data && <Loaded data={data} />}
    </div>
  );
}

function Loaded({ data }) {
  const {
    overview,
    today,
    this_week,
    this_month,
    revenue_trend,
    action_required,
  } = data;

  return (
    <>
      <OverviewStrip overview={overview} />

      <div style={styles.periodGrid} className="dash-period-grid">
        <PeriodLedger
          label="Today"
          rows={[
            ["Payments received", `${today.payments_count} · ${currency(today.payments_amount)}`],
            ["New pending approvals", today.new_payments_pending],
            ["Invoices due", today.invoices_due],
            ["Maintenance reported", today.maintenance_reported],
            ["Complaints filed", today.complaints_filed],
          ]}
        />
        <PeriodLedger
          label="This week"
          rows={[
            ["Revenue collected", currency(this_week.revenue)],
            ["Invoices due", this_week.invoices_due],
            ["Overdue invoices", this_week.overdue_invoices, this_week.overdue_invoices > 0 ? COLORS.red : null],
            ["Maintenance opened / closed", `${this_week.maintenance_opened} / ${this_week.maintenance_completed}`],
            ["New leases signed", this_week.new_leases],
            ["Awaiting approval", this_week.pending_approvals, this_week.pending_approvals > 0 ? COLORS.gold : null],
          ]}
        />
        <PeriodLedger
          label="This month"
          rows={[
            ["Revenue vs expected", `${currency(this_month.revenue)} / ${currency(this_month.expected)}`],
            ["Collection rate", this_month.collection_rate === null ? "—" : `${this_month.collection_rate}%`],
            ["New tenants onboarded", this_month.new_tenants],
            ["Leases expiring (30d)", this_month.leases_expiring_30d, this_month.leases_expiring_30d > 0 ? COLORS.gold : null],
            ["Complaints filed / resolved", `${this_month.complaints_filed} / ${this_month.complaints_resolved}`],
            ["Avg. reliability score", this_month.avg_reliability_score === null ? "—" : this_month.avg_reliability_score],
          ]}
        />
      </div>

      <div style={styles.midGrid} className="dash-mid-grid">
        <RateBar
          label="Occupancy"
          value={overview.occupancy_rate}
          detail={`${overview.occupied_units} of ${overview.total_units} units`}
        />
        <RateBar
          label="Collection rate — this month"
          value={this_month.collection_rate}
          detail={
            this_month.collection_rate === null
              ? "no invoices billed yet"
              : `${currency(this_month.revenue)} collected`
          }
        />
        <RevenueTicks trend={revenue_trend} />
      </div>

      <ActionRequired action={action_required} />
    </>
  );
}

function OverviewStrip({ overview }) {
  const items = [
    ["Properties", overview.total_properties],
    ["Units", overview.total_units],
    ["Active leases", overview.active_leases],
    ["Tenants", overview.total_tenants],
    ["Outstanding balance", compactCurrency(overview.total_outstanding), overview.total_outstanding > 0 ? COLORS.red : null],
    ["Needs attention", overview.tenants_needing_attention, overview.tenants_needing_attention > 0 ? COLORS.gold : null],
  ];
  return (
    <div style={styles.overviewStrip}>
      {items.map(([label, value, color], i) => (
        <div key={label} style={{ ...styles.overviewItem, borderLeft: i === 0 ? "none" : `1px solid ${COLORS.borderLight}` }}>
          <div style={styles.overviewLabel}>{label}</div>
          <div style={{ ...styles.overviewValue, color: color || COLORS.text }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function PeriodLedger({ label, rows }) {
  return (
    <div style={styles.ledger}>
      <div style={styles.ledgerLabel}>{label}</div>
      <div>
        {rows.map(([k, v, color]) => (
          <div key={k} style={styles.ledgerRow}>
            <span style={styles.ledgerKey}>{k}</span>
            <span style={{ ...styles.ledgerVal, color: color || COLORS.text }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RateBar({ label, value, detail }) {
  const pct = value === null || value === undefined ? 0 : Math.max(0, Math.min(100, value));
  const barColor = pct >= 80 ? COLORS.green : pct >= 50 ? COLORS.gold : COLORS.red;
  return (
    <div style={styles.rateCard}>
      <div style={styles.rateHead}>
        <span style={styles.rateLabel}>{label}</span>
        <span style={{ ...styles.rateValue, color: barColor }}>
          {value === null || value === undefined ? "—" : `${value}%`}
        </span>
      </div>
      <div style={styles.rateTrack}>
        <div style={{ ...styles.rateFill, width: `${pct}%`, background: barColor }} />
      </div>
      <div style={styles.rateDetail}>{detail}</div>
    </div>
  );
}

function RevenueTicks({ trend }) {
  const max = Math.max(1, ...trend.map((t) => t.amount));
  return (
    <div style={styles.rateCard}>
      <div style={styles.rateHead}>
        <span style={styles.rateLabel}>Revenue, last 8 weeks</span>
        <span style={styles.rateValue}>{compactCurrency(trend[trend.length - 1]?.amount)}</span>
      </div>
      <div className="tick-row">
        {trend.map((t) => {
          const h = Math.max(3, Math.round((t.amount / max) * 40));
          const isLast = t === trend[trend.length - 1];
          return (
            <div key={t.week_start} className="tick" title={`${dateShort(t.week_start)} — ${currency(t.amount)}`}>
              <div
                className="tick-bar"
                style={{ height: `${h}px`, background: isLast ? COLORS.accent : "rgba(44,62,80,0.15)" }}
              />
            </div>
          );
        })}
      </div>
      <div style={styles.rateDetail}>
        week of {dateShort(trend[0]?.week_start)} → {dateShort(trend[trend.length - 1]?.week_start)}
      </div>
    </div>
  );
}

function ActionRequired({ action }) {
  const sections = [
    {
      key: "pending_payment_approvals",
      title: "Payments awaiting approval",
      accent: COLORS.gold,
      render: (item) => [item.tenant_name, item.unit_number ? `Unit ${item.unit_number}` : "—", currency(item.amount_paid), timeAgo(item.created_at)],
    },
    {
      key: "urgent_maintenance",
      title: "Urgent & emergency maintenance",
      accent: COLORS.red,
      render: (item) => [item.tenant_name, item.title, item.priority, timeAgo(item.created_at)],
    },
    {
      key: "open_complaints",
      title: "Open complaints",
      accent: COLORS.red,
      render: (item) => [item.property_name, item.subject, `severity ${item.severity}`, timeAgo(item.created_at)],
    },
    {
      key: "leases_expiring_soon",
      title: "Leases expiring within 60 days",
      accent: COLORS.gold,
      render: (item) => [item.tenant_name, item.property_name, item.unit_number ? `Unit ${item.unit_number}` : "—", dateShort(item.lease_end_date)],
    },
    {
      key: "tenants_in_collections",
      title: "Tenants in collections",
      accent: COLORS.red,
      render: (item) => [item.tenant_name, currency(item.outstanding_balance), `${item.days_overdue ?? 0}d overdue`, ""],
    },
    {
      key: "documents_pending_verification",
      title: "Documents pending verification",
      accent: COLORS.gold,
      render: (item) => [item.tenant_name || "—", item.document_name, item.document_type, timeAgo(item.created_at)],
    },
  ]
    .map((s) => ({ ...s, data: action[s.key] }))
    .filter((s) => s.data && s.data.count > 0);

  if (sections.length === 0) {
    return (
      <div style={styles.allClear}>
        <div style={styles.allClearTitle}>Nothing waiting on you</div>
        <div style={styles.overviewLabel}>All payments approved, no urgent maintenance, no open complaints.</div>
      </div>
    );
  }

  return (
    <div style={styles.actionSection}>
      <div style={styles.sectionHeading}>Needs your attention</div>
      <div style={styles.actionGrid} className="dash-action-grid">
        {sections.map((s) => (
          <Link key={s.key} to={s.data.link} style={styles.actionCard} className="action-card">
            <div style={styles.actionCardHead}>
              <span style={{ ...styles.actionDot, background: s.accent }} />
              <span style={styles.actionTitle}>{s.title}</span>
              <span style={{ ...styles.actionCount, color: s.accent }}>{s.data.count}</span>
            </div>
            <div>
              {s.data.items.slice(0, 4).map((item, i) => {
                const cols = s.render(item);
                return (
                  <div key={item.id || i} style={styles.actionRow}>
                    {cols.map((c, ci) => (
                      <span key={ci} style={ci === 0 ? styles.actionRowPrimary : styles.actionRowSecondary}>
                        {c}
                      </span>
                    ))}
                  </div>
                );
              })}
              {s.data.count > 4 && (
                <div style={styles.actionMore}>+{s.data.count - 4} more →</div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div style={styles.loading}>
      <div className="pulse" style={{ ...styles.overviewStrip, opacity: 0.4 }} />
      <div style={styles.periodGrid}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="pulse" style={{ ...styles.ledger, opacity: 0.3, height: 220 }} />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div style={styles.errorBox}>
      <div style={styles.h1}>Couldn't load the dashboard</div>
      <div style={{ color: COLORS.textMuted, marginTop: "0.5rem" }}>
        The numbers didn't come through. Check your connection and try again.
      </div>
      <button style={styles.retryBtn} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

const css = `
  .action-card { transition: border-color 120ms ease, transform 120ms ease; }
  .action-card:hover { border-color: rgba(44,62,80,0.35) !important; transform: translateY(-1px); }
  .tick-row { display: flex; align-items: flex-end; gap: 4px; height: 44px; margin: 0.6rem 0 0.4rem; }
  .tick { flex: 1; display: flex; align-items: flex-end; height: 100%; }
  .tick-bar { width: 100%; border-radius: 1px; }
  .pulse { animation: pulseAnim 1.6s ease-in-out infinite; }
  @keyframes pulseAnim { 0%,100% { opacity: 0.25; } 50% { opacity: 0.45; } }
  @media (prefers-reduced-motion: reduce) { .pulse, .action-card { animation: none !important; transition: none !important; } }
  @media (max-width: 900px) {
    .dash-period-grid, .dash-mid-grid, .dash-action-grid { grid-template-columns: 1fr !important; }
  }
`;

const styles = {
  page: {
    minHeight: "100vh",
    background: COLORS.white,
    color: COLORS.text,
    padding: "1rem",
    fontFamily: FONT,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "1.6rem",
  },
  eyebrow: {
    fontSize: "0.7rem",
    letterSpacing: "0.16em",
    textTransform: "uppercase",
    color: COLORS.accent,
    marginBottom: "0.3rem",
  },
  h1: {
    fontSize: "1.5rem",
    fontFamily: FONT,
    fontWeight: 500,
    color: COLORS.text,
    margin: 0,
    lineHeight: 1,
  },
  asOf: {
    fontSize: "0.78rem",
    color: COLORS.textMuted,
  },

  overviewStrip: {
    display: "flex",
    flexWrap: "wrap",
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "3px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    marginBottom: "1.4rem",
  },
  overviewItem: {
    flex: "1 1 140px",
    padding: "0.9rem 1.2rem",
  },
  overviewLabel: {
    fontSize: "0.68rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: COLORS.textMuted,
    marginBottom: "0.35rem",
  },
  overviewValue: {
    fontSize: "1.2rem",
    fontFamily: FONT,
    fontWeight: 600,
    color: COLORS.text,
  },

  periodGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1rem",
    marginBottom: "1.4rem",
  },
  ledger: {
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "3px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    padding: "1.1rem 1.2rem 0.4rem",
  },
  ledgerLabel: {
    fontFamily: FONT,
    fontWeight: 500,
    fontSize: "1rem",
    color: COLORS.text,
    marginBottom: "0.6rem",
    textTransform: "uppercase",
  },
  ledgerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "0.8rem",
    padding: "0.55rem 0",
    borderTop: `1px solid ${COLORS.borderLight}`,
    fontSize: "0.86rem",
  },
  ledgerKey: {
    color: COLORS.textMuted,
  },
  ledgerVal: {
    fontFamily: FONT,
    fontWeight: 500,
    textAlign: "right",
    whiteSpace: "nowrap",
    color: COLORS.text,
  },

  midGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "1rem",
    marginBottom: "1.8rem",
  },
  rateCard: {
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "3px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    padding: "1rem 1.2rem",
  },
  rateHead: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: "0.5rem",
  },
  rateLabel: {
    fontSize: "0.75rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: COLORS.textMuted,
  },
  rateValue: {
    fontFamily: FONT,
    fontWeight: 600,
    fontSize: "1.05rem",
  },
  rateTrack: {
    height: "6px",
    borderRadius: "3px",
    background: "rgba(44,62,80,0.08)",
    overflow: "hidden",
  },
  rateFill: {
    height: "100%",
    borderRadius: "3px",
  },
  rateDetail: {
    marginTop: "0.5rem",
    fontSize: "0.72rem",
    color: COLORS.textMuted,
  },

  actionSection: { marginTop: "0.4rem" },
  sectionHeading: {
    fontFamily: FONT,
    fontWeight: 500,
    fontSize: "1.1rem",
    marginBottom: "0.8rem",
    color: COLORS.text,
  },
  actionGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, 1fr)",
    gap: "1rem",
  },
  actionCard: {
    display: "block",
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "3px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    padding: "1rem 1.2rem",
    textDecoration: "none",
    color: COLORS.text,
  },
  actionCardHead: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.6rem",
  },
  actionDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    flexShrink: 0,
  },
  actionTitle: {
    fontSize: "0.85rem",
    fontWeight: 600,
    flex: 1,
    color: COLORS.text,
  },
  actionCount: {
    fontFamily: FONT,
    fontWeight: 600,
    fontSize: "0.9rem",
  },
  actionRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "0.6rem",
    padding: "0.4rem 0",
    borderTop: `1px solid ${COLORS.borderLight}`,
    fontSize: "0.78rem",
  },
  actionRowPrimary: {
    color: COLORS.text,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  actionRowSecondary: {
    color: COLORS.textMuted,
    whiteSpace: "nowrap",
  },
  actionMore: {
    fontSize: "0.74rem",
    color: COLORS.accent,
    paddingTop: "0.5rem",
  },

  allClear: {
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "3px",
    padding: "2rem",
    textAlign: "center",
  },
  allClearTitle: {
    fontSize: "1.1rem",
    fontWeight: 500,
    color: COLORS.green,
    marginBottom: "0.4rem",
  },

  loading: { display: "block" },
  errorBox: {
    background: COLORS.white,
    border: `1px solid ${COLORS.border}`,
    borderRadius: "3px",
    padding: "2rem",
  },
  retryBtn: {
    marginTop: "1rem",
    background: "transparent",
    border: `1px solid ${COLORS.accent}`,
    color: COLORS.accent,
    padding: "0.5rem 1.1rem",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
};