// LANDLORD DASHBOARD
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { c as palette, f as fonts } from "../../styles/theme";
import LoginDigestModal from "../../components/LoginDigestModal";

const API_BASE = "http://localhost:4000";

const ACCENT = {
  blue: palette.blue || "#2c6b9b",
  blueLight: palette.blueLight || "#4a8cb9",
  green: palette.green,
  gold: palette.gold,
  red: palette.redLight,
  purple: palette.purple,
  orange: palette.orange,
};

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

function RevenueLineChart({ trend }) {
  const w = 300;
  const h = 130;
  const padL = 8;
  const padR = 8;
  const padT = 10;
  const padB = 20;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const max = Math.max(1, ...trend.map((t) => t.amount));

  const points = trend.map((t, i) => {
    const x = padL + (trend.length > 1 ? (i / (trend.length - 1)) * innerW : innerW / 2);
    const y = padT + innerH - (t.amount / max) * innerH;
    return { x, y, t };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1]?.x.toFixed(1)},${padT + innerH} L${points[0]?.x.toFixed(1)},${padT + innerH} Z`;
  const last = points[points.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={140} preserveAspectRatio="none">
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT.blue} stopOpacity="0.28" />
            <stop offset="100%" stopColor={ACCENT.blue} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={padL} y1={padT + innerH} x2={w - padR} y2={padT + innerH} stroke={palette.border} strokeWidth="1" />
        {points.length > 1 && <path d={areaPath} fill="url(#revenueFill)" stroke="none" />}
        {points.length > 1 && <path d={linePath} fill="none" stroke={ACCENT.blue} strokeWidth="2" />}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 3.5 : 2}
            fill={i === points.length - 1 ? ACCENT.blue : palette.white}
            stroke={ACCENT.blue}
            strokeWidth="1.5"
          >
            <title>{`${dateShort(p.t.week_start)} — ${currency(p.t.amount)}`}</title>
          </circle>
        ))}
      </svg>
      <div style={styles.chartFootRow}>
        <span style={{ ...styles.chartFootLabel, color: "#000" }}>{dateShort(trend[0]?.week_start)}</span>
        <span style={{ ...styles.chartFootValue, color: ACCENT.blue }}>{compactCurrency(last?.t.amount)}</span>
        <span style={{ ...styles.chartFootLabel, color: "#000" }}>{dateShort(trend[trend.length - 1]?.week_start)}</span>
      </div>
    </div>
  );
}

function ReliabilityTrendLineChart({ trend }) {
  const w = 300;
  const h = 130;
  const padL = 8;
  const padR = 8;
  const padT = 10;
  const padB = 20;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;

  if (!trend || trend.length === 0) {
    return <div style={{ padding: "1rem 0", textAlign: "center", color: palette.textMuted, fontSize: "0.8rem" }}>No score history yet</div>;
  }

  const max = Math.max(1, ...trend.map((t) => Number(t.avg_score) || 0));
  const min = Math.min(0, ...trend.map((t) => Number(t.avg_score) || 0));
  const range = max - min || 1;

  const points = trend.map((t, i) => {
    const x = padL + (trend.length > 1 ? (i / (trend.length - 1)) * innerW : innerW / 2);
    const y = padT + innerH - ((Number(t.avg_score) - min) / range) * innerH;
    return { x, y, t };
  });

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1]?.x.toFixed(1)},${padT + innerH} L${points[0]?.x.toFixed(1)},${padT + innerH} Z`;
  const last = points[points.length - 1];

  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={140} preserveAspectRatio="none">
        <defs>
          <linearGradient id="scoreFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ACCENT.blue} stopOpacity="0.28" />
            <stop offset="100%" stopColor={ACCENT.blue} stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={padL} y1={padT + innerH} x2={w - padR} y2={padT + innerH} stroke={palette.border} strokeWidth="1" />
        {points.length > 1 && <path d={areaPath} fill="url(#scoreFill)" stroke="none" />}
        {points.length > 1 && <path d={linePath} fill="none" stroke={ACCENT.blue} strokeWidth="2" />}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 3.5 : 2}
            fill={i === points.length - 1 ? ACCENT.blue : palette.white}
            stroke={ACCENT.blue}
            strokeWidth="1.5"
          >
            <title>{`${dateShort(p.t.month)} — Score ${Number(p.t.avg_score).toFixed(1)}`}</title>
          </circle>
        ))}
      </svg>
      <div style={styles.chartFootRow}>
        <span style={{ ...styles.chartFootLabel, color: "#000" }}>{dateShort(trend[0]?.month)}</span>
        <span style={{ ...styles.chartFootValue, color: ACCENT.blue }}>{Number(last?.t.avg_score).toFixed(1)}</span>
        <span style={{ ...styles.chartFootLabel, color: "#000" }}>{dateShort(trend[trend.length - 1]?.month)}</span>
      </div>
    </div>
  );
}

function OccupancyDonut({ overview }) {
  const occupied = Number(overview.occupied_units || 0);
  const vacant = Number(overview.vacant_units || 0);
  const total = Number(overview.total_units || 0);
  const other = Math.max(0, total - occupied - vacant);

  const segments = [
    { label: "Occupied", value: occupied, color: ACCENT.blue },
    { label: "Vacant", value: vacant, color: palette.textMuted },
    ...(other > 0 ? [{ label: "Maintenance / reserved", value: other, color: palette.border }] : []),
  ].filter((s) => s.value > 0);

  const size = 130;
  const strokeWidth = 16;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let offsetSoFar = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ flexShrink: 0 }}>
        <g transform={`rotate(-90 ${cx} ${cy})`}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={palette.borderLight ?? palette.border} strokeWidth={strokeWidth} />
          {total > 0 &&
            segments.map((s, i) => {
              const len = (s.value / total) * circumference;
              const el = (
                <circle
                  key={i}
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${len} ${circumference - len}`}
                  strokeDashoffset={-offsetSoFar}
                  strokeLinecap="butt"
                >
                  <title>{`${s.label}: ${s.value}`}</title>
                </circle>
              );
              offsetSoFar += len;
              return el;
            })}
        </g>
        <text x={cx} y={cy - 3} textAnchor="middle" fontSize="20" fontWeight="700" fill="#000" fontFamily={fonts.dm}>
          {overview.occupancy_rate}%
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill={palette.textMuted} fontFamily={fonts.mono}>
          occupied
        </text>
      </svg>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
        {segments.map((s) => (
          <div key={s.label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: "0.76rem", color: "#000" }}>
              {s.label}: <strong>{s.value}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActionBarChart({ action }) {
  const items = [
    ["pending_payment_approvals", "Payments to approve", ACCENT.blue],
    ["urgent_maintenance", "Urgent maintenance", ACCENT.red],
    ["open_complaints", "Open complaints", ACCENT.orange],
    ["leases_expiring_soon", "Leases expiring", ACCENT.blueLight],
    ["tenants_in_collections", "In collections", ACCENT.red],
    ["documents_pending_verification", "Docs to verify", ACCENT.purple],
  ]
    .map(([key, label, color]) => ({ key, label, color, count: action[key]?.count || 0 }))
    .sort((a, b) => b.count - a.count);

  const max = Math.max(1, ...items.map((i) => i.count));
  const allZero = items.every((i) => i.count === 0);

  if (allZero) {
    return (
      <div style={{ padding: "1.2rem 0", textAlign: "center", color: ACCENT.blue, fontSize: "0.85rem", fontWeight: 600 }}>
        Nothing outstanding
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", marginTop: "0.2rem" }}>
      {items.map((i) => (
        <div key={i.key} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ ...styles.barLabel, color: "#000" }}>{i.label}</span>
          <div style={styles.barTrack}>
            <div
              style={{
                width: `${Math.max(3, (i.count / max) * 100)}%`,
                background: i.color,
                height: "100%",
                borderRadius: "2px",
                opacity: i.count === 0 ? 0.15 : 1,
              }}
            />
          </div>
          <span style={{ ...styles.barCount, color: i.count > 0 ? i.color : palette.textDim }}>{i.count}</span>
        </div>
      ))}
    </div>
  );
}

function OverviewStrip({ overview }) {
  const items = [
    ["Properties", overview.total_properties],
    ["Units", overview.total_units],
    ["Active leases", overview.active_leases],
    ["Tenants", overview.total_tenants],
    ["Outstanding balance", compactCurrency(overview.total_outstanding), overview.total_outstanding > 0 ? ACCENT.red : ACCENT.blue],
    ["Needs attention", overview.tenants_needing_attention, overview.tenants_needing_attention > 0 ? ACCENT.orange : ACCENT.blue],
  ];
  return (
    <div style={styles.overviewStrip}>
      {items.map(([label, value, color], i) => (
        <div
          key={label}
          style={{
            ...styles.overviewItem,
            borderLeft: i === 0 ? "none" : `1px solid ${palette.borderLight ?? palette.border}`,
            borderTop: `3px solid ${ACCENT.blue}`,
          }}
        >
          <div style={{ ...styles.overviewLabel, color: "#000" }}>{label}</div>
          <div style={{ ...styles.overviewValue, color: color || "#000" }}>{value}</div>
        </div>
      ))}
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div style={{ ...styles.chartCard, borderTop: `3px solid ${ACCENT.blue}` }}>
      <div style={{ ...styles.chartTitle, color: "#000" }}>{title}</div>
      {children}
    </div>
  );
}

function PeriodLedger({ label, rows }) {
  return (
    <div style={{ ...styles.ledger, borderTop: `3px solid ${ACCENT.blue}` }}>
      <div style={{ ...styles.ledgerLabel, color: ACCENT.blue }}>{label}</div>
      <div>
        {rows.map(([k, v, color]) => (
          <div key={k} style={styles.ledgerRow}>
            <span style={{ ...styles.ledgerKey, color: "#000" }}>{k}</span>
            <span style={{ ...styles.ledgerVal, color: color || "#000" }}>{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RateBar({ label, value, detail }) {
  const pct = value === null || value === undefined ? 0 : Math.max(0, Math.min(100, value));
  const barColor = pct >= 80 ? ACCENT.blue : pct >= 50 ? ACCENT.blueLight : ACCENT.red;
  return (
    <div style={{ ...styles.rateCard, borderTop: `3px solid ${ACCENT.blue}` }}>
      <div style={styles.rateHead}>
        <span style={{ ...styles.rateLabel, color: "#000" }}>{label}</span>
        <span style={{ ...styles.rateValue, color: barColor }}>
          {value === null || value === undefined ? "—" : `${value}%`}
        </span>
      </div>
      <div style={styles.rateTrack}>
        <div style={{ ...styles.rateFill, width: `${pct}%`, background: barColor }} />
      </div>
      <div style={{ ...styles.rateDetail, color: palette.textMuted }}>{detail}</div>
    </div>
  );
}

function ActionRequired({ action }) {
  const urlMap = {
    pending_payment_approvals: (id) => `/landlord/payments/review/${id}`,
    urgent_maintenance: (id) => `/landlord/maintenance/${id}`,
    open_complaints: (id) => `/landlord/complaints/${id}`,
    leases_expiring_soon: (id) => `/landlord/leases/${id}`,
    tenants_in_collections: (id) => `/landlord/tenants/${id}`,
    documents_pending_verification: (id) => `/landlord/documents/${id}`,
    high_risk_tenants: (id) => `/landlord/tenants/${id}`,
  };

  const sections = [
    {
      key: "pending_payment_approvals",
      title: "Payments awaiting approval",
      accent: ACCENT.blue,
      render: (item) => [
        { text: item.tenant_name, link: urlMap.pending_payment_approvals(item.id) },
        { text: item.unit_number ? `Unit ${item.unit_number}` : "—", link: null },
        { text: currency(item.amount_paid), link: null },
        { text: timeAgo(item.created_at), link: null },
      ],
    },
    {
      key: "urgent_maintenance",
      title: "Urgent & emergency maintenance",
      accent: ACCENT.blue,
      render: (item) => [
        { text: item.tenant_name, link: urlMap.urgent_maintenance(item.id) },
        { text: item.title, link: null },
        { text: item.priority, link: null },
        { text: timeAgo(item.created_at), link: null },
      ],
    },
    {
      key: "open_complaints",
      title: "Open complaints",
      accent: ACCENT.blue,
      render: (item) => [
        { text: item.property_name, link: urlMap.open_complaints(item.id) },
        { text: item.subject, link: null },
        { text: `severity ${item.severity}`, link: null },
        { text: timeAgo(item.created_at), link: null },
      ],
    },
    {
      key: "leases_expiring_soon",
      title: "Leases expiring within 60 days",
      accent: ACCENT.blue,
      render: (item) => [
        { text: item.tenant_name, link: urlMap.leases_expiring_soon(item.id) },
        { text: item.property_name, link: null },
        { text: item.unit_number ? `Unit ${item.unit_number}` : "—", link: null },
        { text: dateShort(item.lease_end_date), link: null },
      ],
    },
    {
      key: "tenants_in_collections",
      title: "Tenants in collections",
      accent: ACCENT.blue,
      render: (item) => [
        { text: item.tenant_name, link: urlMap.tenants_in_collections(item.id) },
        { text: currency(item.outstanding_balance), link: null },
        { text: `${item.days_overdue ?? 0}d overdue`, link: null },
        { text: "", link: null },
      ],
    },
    {
      key: "documents_pending_verification",
      title: "Documents pending verification",
      accent: ACCENT.blue,
      render: (item) => [
        { text: item.tenant_name || "—", link: urlMap.documents_pending_verification(item.id) },
        { text: item.document_name, link: null },
        { text: item.document_type, link: null },
        { text: timeAgo(item.created_at), link: null },
      ],
    },
    {
      key: "high_risk_tenants",
      title: "High-risk tenants",
      accent: ACCENT.blue,
      render: (item) => [
        { text: item.tenant_name, link: urlMap.high_risk_tenants(item.id) },
        { text: item.property_name || "—", link: null },
        { text: item.unit_number ? `Unit ${item.unit_number}` : "—", link: null },
        { text: `Score: ${item.score ?? "—"}`, link: null },
      ],
    },
  ]
    .map((s) => ({ ...s, data: action[s.key] }))
    .filter((s) => s.data && s.data.count > 0);

  if (sections.length === 0) {
    return (
      <div style={{ ...styles.allClear, borderTop: `3px solid ${ACCENT.blue}` }}>
        <div style={{ ...styles.allClearTitle, color: ACCENT.blue }}>Nothing waiting on you</div>
        <div style={{ ...styles.overviewLabel, color: "#000" }}>All payments approved, no urgent maintenance, no open complaints.</div>
      </div>
    );
  }

  return (
    <div style={styles.actionSection}>
      <div style={{ ...styles.sectionHeading, color: "#000" }}>Needs your attention</div>
      <div style={styles.actionGrid} className="dash-action-grid">
        {sections.map((s) => (
          <div key={s.key} style={{ ...styles.actionCard, borderLeft: `4px solid ${s.accent}` }} className="action-card">
            <div style={styles.actionCardHead}>
              <span style={{ ...styles.actionDot, background: s.accent }} />
              <Link to={s.data.link} style={{ ...styles.actionTitleLink, color: "#000" }}>
                <span style={styles.actionTitle}>{s.title}</span>
              </Link>
              <span style={{ ...styles.actionCount, color: s.accent }}>{s.data.count}</span>
            </div>
            <div>
              {s.data.items.slice(0, 4).map((item, i) => {
                const cols = s.render(item);
                return (
                  <div key={item.id || i} style={styles.actionRow}>
                    {cols.map((col, ci) => {
                      if (ci === 0 && col.link) {
                        return (
                          <Link key={ci} to={col.link} style={{ ...styles.actionRowPrimaryLink, color: "#000" }}>
                            {col.text}
                          </Link>
                        );
                      }
                      return (
                        <span key={ci} style={ci === 0 ? { ...styles.actionRowPrimary, color: "#000" } : { ...styles.actionRowSecondary, color: palette.textMuted }}>
                          {col.text}
                        </span>
                      );
                    })}
                  </div>
                );
              })}
              {s.data.count > 4 && (
                <Link to={s.data.link} style={{ ...styles.actionMore, color: s.accent }}>
                  +{s.data.count - 4} more →
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  useDocumentTitle("Dashboard");

  const [data, setData] = useState(null);
  const [status, setStatus] = useState("loading");

  const [showDigest, setShowDigest] = useState(() => {
    return sessionStorage.getItem("digest_shown") !== "true";
  });

  function closeDigest() {
    sessionStorage.setItem("digest_shown", "true");
    setShowDigest(false);
  }

  const load = useCallback(async () => {
    setStatus((s) => (s === "ready" ? "ready" : "loading"));
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
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
          <h1 style={{ ...styles.h1, color: "#000" }}>Dashboard</h1>
        </div>
        {data && (
          <div style={{ ...styles.asOf, color: palette.textMuted }}>
            as of{" "}
            {new Date(data.generated_at).toLocaleTimeString("en-ZA", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        )}
      </header>

      {status === "loading" && <Loading />}
      {status === "error" && <ErrorState onRetry={load} />}
      {status === "ready" && data && <Loaded data={data} />}
      {showDigest && <LoginDigestModal onClose={closeDigest} />}
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
    reliability_breakdown,
    reliability_trend,
  } = data;

  return (
    <>
      <OverviewStrip overview={overview} />

      <div style={styles.chartsGrid} className="dash-charts-grid">
        <ChartCard title="Revenue, last 8 weeks">
          <RevenueLineChart trend={revenue_trend} />
        </ChartCard>
        <ChartCard title="Occupancy">
          <OccupancyDonut overview={overview} />
        </ChartCard>
        <ChartCard title="Needs attention, by category">
          <ActionBarChart action={action_required} />
        </ChartCard>
        <ChartCard title="Reliability trend (6 mo)">
          <ReliabilityTrendLineChart trend={reliability_trend} />
        </ChartCard>
      </div>

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
            ["Overdue invoices", this_week.overdue_invoices, this_week.overdue_invoices > 0 ? ACCENT.red : null],
            ["Maintenance opened / closed", `${this_week.maintenance_opened} / ${this_week.maintenance_completed}`],
            ["New leases signed", this_week.new_leases],
            ["Awaiting approval", this_week.pending_approvals, this_week.pending_approvals > 0 ? ACCENT.orange : null],
          ]}
        />
        <PeriodLedger
          label="This month"
          rows={[
            ["Revenue vs expected", `${currency(this_month.revenue)} / ${currency(this_month.expected)}`],
            ["Collection rate", this_month.collection_rate === null ? "—" : `${this_month.collection_rate}%`],
            ["New tenants onboarded", this_month.new_tenants],
            ["Leases expiring (30d)", this_month.leases_expiring_30d, this_month.leases_expiring_30d > 0 ? ACCENT.orange : null],
            ["Complaints filed / resolved", `${this_month.complaints_filed} / ${this_month.complaints_resolved}`],
            ["Avg. reliability score", this_month.avg_reliability_score === null ? "—" : this_month.avg_reliability_score],
          ]}
        />
        <PeriodLedger
          label="Reliability"
          rows={[
            ["Reliable", reliability_breakdown.reliable],
            ["Moderate risk", reliability_breakdown.moderate_risk],
            ["High risk", reliability_breakdown.high_risk, reliability_breakdown.high_risk > 0 ? ACCENT.red : null],
            ["Average score", reliability_breakdown.avg_score === null ? "—" : reliability_breakdown.avg_score],
          ]}
        />
      </div>

      <div style={styles.midGrid}>
        <RateBar
          label="Collection rate this month"
          value={this_month.collection_rate}
          detail={
            this_month.collection_rate === null
              ? "no invoices billed yet"
              : `${currency(this_month.revenue)} collected of ${currency(this_month.expected)} expected`
          }
        />
      </div>

      <ActionRequired action={action_required} />
    </>
  );
}

function Loading() {
  return (
    <div style={styles.loading}>
      <div className="pulse" style={{ ...styles.overviewStrip, opacity: 0.4 }} />
      <div style={styles.chartsGrid}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="pulse" style={{ ...styles.chartCard, opacity: 0.3, height: 190 }} />
        ))}
      </div>
      <div style={styles.periodGrid}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="pulse" style={{ ...styles.ledger, opacity: 0.3, height: 220 }} />
        ))}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div style={styles.errorBox}>
      <div style={{ ...styles.h1, color: "#000" }}>Couldn't load the dashboard</div>
      <div style={{ color: palette.textMuted, marginTop: "0.5rem" }}>
        The numbers didn't come through. Check your connection and try again.
      </div>
      <button style={styles.retryBtn} onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

const css = `
  .action-card { transition: border-color 120ms ease, transform 120ms ease, box-shadow 120ms ease; }
  .action-card:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(0,0,0,0.08); }
  .action-row-link:hover { background: ${palette.muted2}; }
  .pulse { animation: pulseAnim 1.6s ease-in-out infinite; }
  @keyframes pulseAnim { 0%,100% { opacity: 0.25; } 50% { opacity: 0.45; } }
  @media (prefers-reduced-motion: reduce) { .pulse, .action-card { animation: none !important; transition: none !important; } }
  @media (max-width: 900px) {
    .dash-period-grid, .dash-action-grid, .dash-charts-grid { grid-template-columns: 1fr !important; }
  }
`;

const styles = {
  page: {
    minHeight: "100vh",
    background: palette.bgLight ?? palette.white,
    color: "#000",
    padding: "1rem",
    fontFamily: fonts.dm,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "1.6rem",
  },
  h1: {
    fontSize: "1.5rem",
    fontFamily: fonts.dm,
    fontWeight: 600,
    color: "#000",
    margin: 0,
    lineHeight: 1,
  },
  asOf: {
    fontSize: "0.78rem",
    color: palette.textMuted,
  },

  overviewStrip: {
    display: "flex",
    flexWrap: "wrap",
    background: palette.white,
    border: `1px solid ${palette.border}`,
    borderRadius: "3px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    marginBottom: "1.2rem",
    overflow: "hidden",
  },
  overviewItem: { flex: "1 1 140px", padding: "0.9rem 1.2rem" },
  overviewLabel: {
    fontSize: "0.68rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "#000",
    marginBottom: "0.35rem",
  },
  overviewValue: { fontSize: "1.25rem", fontFamily: fonts.dm, fontWeight: 700 },

  chartsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: "1rem",
    marginBottom: "1.2rem",
  },
  chartCard: {
    background: palette.white,
    border: `1px solid ${palette.border}`,
    borderRadius: "3px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    padding: "1rem 1.1rem",
  },
  chartTitle: {
    fontSize: "0.75rem",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
    color: "#000",
    marginBottom: "0.6rem",
    fontWeight: 600,
  },
  chartFootRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: "0.2rem",
  },
  chartFootLabel: { fontSize: "0.68rem", color: palette.textMuted, fontFamily: fonts.mono },
  chartFootValue: { fontSize: "0.85rem", fontWeight: 700, fontFamily: fonts.dm },

  barLabel: { fontSize: "0.72rem", color: "#000", width: "108px", flexShrink: 0 },
  barTrack: { flex: 1, height: "8px", background: palette.muted2, borderRadius: "2px", overflow: "hidden" },
  barCount: { fontSize: "0.78rem", fontWeight: 700, width: "20px", textAlign: "right", flexShrink: 0 },

  periodGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "1.2rem" },
  ledger: {
    background: palette.white,
    border: `1px solid ${palette.border}`,
    borderRadius: "3px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    padding: "1.1rem 1.2rem 0.4rem",
  },
  ledgerLabel: {
    fontFamily: fonts.dm,
    fontWeight: 700,
    fontSize: "0.95rem",
    marginBottom: "0.6rem",
    textTransform: "uppercase",
    letterSpacing: "0.03em",
  },
  ledgerRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "0.8rem",
    padding: "0.55rem 0",
    borderTop: `1px solid ${palette.muted2}`,
    fontSize: "0.86rem",
  },
  ledgerKey: { color: "#000" },
  ledgerVal: { fontFamily: fonts.dm, fontWeight: 600, textAlign: "right", whiteSpace: "nowrap" },

  midGrid: { display: "grid", gridTemplateColumns: "1fr", gap: "1rem", marginBottom: "1.6rem" },
  rateCard: {
    background: palette.white,
    border: `1px solid ${palette.border}`,
    borderRadius: "3px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    padding: "1rem 1.2rem",
  },
  rateHead: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.5rem" },
  rateLabel: { fontSize: "0.75rem", letterSpacing: "0.04em", textTransform: "uppercase", color: "#000" },
  rateValue: { fontFamily: fonts.dm, fontWeight: 700, fontSize: "1.05rem" },
  rateTrack: { height: "8px", borderRadius: "3px", background: palette.muted2, overflow: "hidden" },
  rateFill: { height: "100%", borderRadius: "3px" },
  rateDetail: { marginTop: "0.5rem", fontSize: "0.72rem", color: palette.textMuted },

  actionSection: { marginTop: "0.4rem" },
  sectionHeading: { fontFamily: fonts.dm, fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.8rem", color: "#000" },
  actionGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "1rem" },
  actionCard: {
    display: "block",
    background: palette.white,
    border: `1px solid ${palette.border}`,
    borderRadius: "3px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    padding: "1rem 1.2rem",
    textDecoration: "none",
    color: "#000",
  },
  actionCardHead: { display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.6rem" },
  actionDot: { width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0 },
  actionTitleLink: { flex: 1, textDecoration: "none", color: "#000" },
  actionTitle: { fontSize: "0.85rem", fontWeight: 600, color: "#000" },
  actionCount: { fontFamily: fonts.dm, fontWeight: 700, fontSize: "0.95rem" },
  actionRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: "0.6rem",
    padding: "0.4rem 0",
    borderTop: `1px solid ${palette.muted2}`,
    fontSize: "0.78rem",
    alignItems: "center",
  },
  actionRowPrimaryLink: {
    color: "#000",
    textDecoration: "none",
    fontWeight: 500,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    padding: "0.1rem 0.2rem",
    borderRadius: "2px",
    transition: "background 0.1s",
  },
  actionRowPrimary: {
    color: "#000",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  actionRowSecondary: {
    color: palette.textMuted,
    whiteSpace: "nowrap",
  },
  actionMore: { fontSize: "0.74rem", fontWeight: 600, paddingTop: "0.5rem", textDecoration: "none" },

  allClear: { background: palette.white, border: `1px solid ${palette.border}`, borderRadius: "3px", padding: "2rem", textAlign: "center" },
  allClearTitle: { fontSize: "1.1rem", fontWeight: 700, color: ACCENT.blue, marginBottom: "0.4rem" },

  loading: { display: "block" },
  errorBox: { background: palette.white, border: `1px solid ${palette.border}`, borderRadius: "3px", padding: "2rem" },
  retryBtn: {
    marginTop: "1rem",
    background: "transparent",
    border: `1px solid ${palette.blue}`,
    color: palette.blue,
    padding: "0.5rem 1.1rem",
    borderRadius: "3px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: 600,
  },
};