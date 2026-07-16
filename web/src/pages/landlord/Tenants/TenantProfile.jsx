/* eslint-disable no-unused-vars */
// LANDLORD TENANT PROFILE PAGE 
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";


function format(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
function initials(name = "") { return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(); }
function daysUntil(dateStr) { if (!dateStr) return null; return Math.ceil((new Date(dateStr) - Date.now()) / 86400000); }
function leaseExpired(endDate) { return endDate && new Date(endDate) < new Date(); }
function leaseExpiresSoon(endDate) { const d = daysUntil(endDate); return d !== null && d >= 0 && d <= 60; }

const cardStyle = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.5rem',
};

const statCardStyle = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px',
  padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.4rem',
};

const pillStyle = (color, bg, border) => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  fontSize: '0.58rem', fontWeight: 700, padding: '0.12rem 0.5rem',
  borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
  textTransform: 'uppercase', color, background: bg, border,
});

const btnPrimary = {
  background: C.gold, color: C.black, border: 'none',
  padding: '0.6rem 1.4rem', fontSize: '0.76rem', fontWeight: 700,
  fontFamily: F.dm, letterSpacing: '0.04em', borderRadius: '3px',
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
};

const btnGhost = {
  background: 'transparent', color: 'rgba(245,240,232,0.5)',
  border: `1px solid ${C.border}`, padding: '0.6rem 1.2rem',
  fontSize: '0.76rem', fontWeight: 500, fontFamily: F.dm,
  letterSpacing: '0.04em', borderRadius: '3px', cursor: 'pointer',
};

const tagStyle = (color) => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  fontSize: '0.62rem', fontWeight: 600, padding: '0.2rem 0.6rem',
  borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
  textTransform: 'uppercase', color, background: 'transparent',
  border: `1px solid ${color}30`,
});


const SCORE_CONFIG = {
  "reliable":      { color: C.greenLight, bg: 'rgba(26,122,74,0.1)',   border: '1px solid rgba(76,186,122,0.2)',  dot: C.greenLight, label: "Reliable"      },
  "moderate risk": { color: C.gold,       bg: 'rgba(232,160,18,0.08)',  border: '1px solid rgba(232,160,18,0.2)',  dot: C.gold,       label: "Moderate Risk" },
  "high risk":     { color: C.redLight,   bg: 'rgba(224,90,74,0.1)',    border: '1px solid rgba(224,90,74,0.2)',   dot: C.redLight,   label: "High Risk"     },
};

function ScoreBadge({ score }) {
  const cfg = SCORE_CONFIG[score?.toLowerCase().replace(/_/g, " ")] ?? SCORE_CONFIG["moderate risk"];
  return (
    <span style={pillStyle(cfg.color, cfg.bg, cfg.border)}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}


function SectionHeader({ title, icon, action, onAction }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.6rem', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Icon name={icon} size={14} color={C.gold} />
        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {title}
        </span>
      </div>
      {action && (
        <button onClick={onAction} style={{ fontSize: '0.68rem', fontWeight: 500, color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}>
          {action}
        </button>
      )}
    </div>
  );
}

function InfoRow({ label, value, icon, mono = false, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
      <span style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.4)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        {icon && <Icon name={icon} size={11} />}
        {label}
      </span>
      <span style={{
        fontSize: '0.72rem', fontWeight: 500,
        color: color || C.white,
        fontFamily: mono ? F.mono : F.dm,
      }}>
        {value}
      </span>
    </div>
  );
}

function PaymentHistoryTable({ payments }) {
  if (!payments || payments.length === 0) {
    return <p style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.25)', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>No payment history yet.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: '0.7rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {["Period", "Amount", "Due", "Paid", "Method", "Status"].map(h => (
              <th key={h} style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.4rem 0.6rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {payments.slice(0, 12).map((p, i) => (
            <tr key={p.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '0.45rem 0.6rem', color: C.white, fontWeight: 500 }}>{p.period || "—"}</td>
              <td style={{ padding: '0.45rem 0.6rem', color: C.white }}>{format(p.amount)}</td>
              <td style={{ padding: '0.45rem 0.6rem', color: 'rgba(245,240,232,0.4)' }}>{formatDate(p.due)}</td>
              <td style={{ padding: '0.45rem 0.6rem', color: 'rgba(245,240,232,0.4)' }}>{p.paid ? formatDate(p.paid) : "—"}</td>
              <td style={{ padding: '0.45rem 0.6rem', color: 'rgba(245,240,232,0.3)' }}>{p.method || "—"}</td>
              <td style={{ padding: '0.45rem 0.6rem' }}>
                <span style={pillStyle(
                  p.status === "Paid" ? C.greenLight : p.status === "Late" ? C.redLight : C.gold,
                  p.status === "Paid" ? 'rgba(26,122,74,0.08)' : p.status === "Late" ? 'rgba(224,90,74,0.08)' : 'rgba(232,160,18,0.06)',
                  `1px solid ${p.status === "Paid" ? 'rgba(76,186,122,0.15)' : p.status === "Late" ? 'rgba(224,90,74,0.15)' : 'rgba(232,160,18,0.12)'}`,
                )}>
                  {p.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


function ComplaintHistoryTable({ complaints }) {
  if (!complaints || complaints.length === 0) {
    return <p style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.25)', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>No complaints on record.</p>;
  }

  const STATUS_CONFIG = {
    "resolved":  { color: C.greenLight, label: "Resolved"  },
    "dismissed": { color: 'rgba(245,240,232,0.4)', label: "Dismissed" },
    "approved":  { color: C.blue, label: "Upheld"    },
    "escalated": { color: C.purple, label: "Escalated" },
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: '0.7rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {["Subject", "Scope", "Outcome", "Date"].map(h => (
              <th key={h} style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.4rem 0.6rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {complaints.slice(0, 10).map((c, i) => {
            const sc = STATUS_CONFIG[c.status] ?? { color: 'rgba(245,240,232,0.3)', label: c.status };
            return (
              <tr key={c.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: '0.45rem 0.6rem', color: C.white, fontWeight: 500, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {c.subject}
                </td>
                <td style={{ padding: '0.45rem 0.6rem', color: 'rgba(245,240,232,0.4)' }}>{c.scope || "—"}</td>
                <td style={{ padding: '0.45rem 0.6rem' }}>
                  <span style={pillStyle(sc.color, `${sc.color}15`, `1px solid ${sc.color}25`)}>
                    {sc.label}
                  </span>
                </td>
                <td style={{ padding: '0.45rem 0.6rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, fontSize: '0.65rem' }}>
                  {formatDate(c.created_at)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


function MaintenanceHistoryTable({ requests }) {
  if (!requests || requests.length === 0) {
    return <p style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.25)', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>No maintenance requests.</p>;
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', fontSize: '0.7rem', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {["Request", "Category", "Status", "Date"].map(h => (
              <th key={h} style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.05em', textTransform: 'uppercase', padding: '0.4rem 0.6rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {requests.slice(0, 10).map((r, i) => (
            <tr key={r.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
              <td style={{ padding: '0.45rem 0.6rem', color: C.white, fontWeight: 500, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {r.title}
              </td>
              <td style={{ padding: '0.45rem 0.6rem', color: 'rgba(245,240,232,0.4)' }}>{r.category || "—"}</td>
              <td style={{ padding: '0.45rem 0.6rem' }}>
                <span style={pillStyle(
                  r.status === "completed" ? C.greenLight : r.status === "in_progress" ? C.gold : C.blue,
                  r.status === "completed" ? 'rgba(26,122,74,0.08)' : 'rgba(58,143,212,0.06)',
                  `1px solid ${r.status === "completed" ? 'rgba(76,186,122,0.15)' : 'rgba(58,143,212,0.12)'}`,
                )}>
                  {r.status?.replace(/_/g, " ")}
                </span>
              </td>
              <td style={{ padding: '0.45rem 0.6rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, fontSize: '0.65rem' }}>
                {formatDate(r.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}


export default function TenantProfile() {
  useDocumentTitle("Tenant Profile");
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [tenant, setTenant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const fetchTenant = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/tenants/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTenant(data.tenant);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load tenant");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchTenant(); }, [fetchTenant]);

  
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ display: 'block', width: 32, height: 32, border: '3px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 0.8rem' }} />
          <p style={{ fontSize: '0.82rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>Loading tenant...</p>
        </div>
      </div>
    );
  }

  
  if (error || !tenant) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, padding: '2rem 1rem' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={cardStyle}>
            <Icon name="user" size={40} color="rgba(245,240,232,0.2)" style={{ marginBottom: '1rem' }} />
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: C.white, marginBottom: '0.5rem' }}>Tenant not found</h2>
            <p style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.4)', marginBottom: '1.2rem' }}>{error || "This tenant could not be loaded."}</p>
            <button onClick={() => navigate("/landlord/tenants")} style={btnPrimary}>
              <Icon name="chevron-left" size={14} /> Back to Tenants
            </button>
          </div>
        </div>
      </div>
    );
  }

  
  const reliabilityScore = (tenant.reliability_score || "moderate_risk").replace(/_/g, " ");
  const daysLeft = daysUntil(tenant.lease_end_date);
  const isExpired = leaseExpired(tenant.lease_end_date);
  const isExpiring = leaseExpiresSoon(tenant.lease_end_date);
  const balance = Number(tenant.outstanding_balance) || 0;
  const payments = tenant.payments || [];
  const complaints = tenant.complaints || [];
  const maintenanceRequests = tenant.maintenance_requests || [];
  const onTime = Number(tenant.on_time_payments) || 0;
  const late = Number(tenant.late_payments) || 0;
  const missed = Number(tenant.missed_payments) || 0;
  const totalPayments = onTime + late + missed;
  const paymentScore = totalPayments > 0 ? Math.round((onTime / totalPayments) * 100) : 0;

  
  const tabs = [
    { id: "overview", label: "Overview", icon: "user" },
    { id: "payments", label: "Payments", icon: "credit-card", count: payments.length },
    { id: "complaints", label: "Complaints", icon: "message-square", count: complaints.length },
    { id: "maintenance", label: "Maintenance", icon: "wrench", count: maintenanceRequests.length },
  ];

  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    backBtn: {
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem',
      color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, background: 'none',
      border: 'none', cursor: 'pointer', marginBottom: '1.2rem', transition: 'color 0.15s',
    },
    profileHeader: {
      display: 'flex', alignItems: 'flex-start', gap: '1.5rem', marginBottom: '1.5rem',
      flexWrap: 'wrap',
    },
    avatar: {
      width: 80, height: 80, borderRadius: '50%',
      background: 'rgba(232,160,18,0.12)', color: C.gold,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: F.bebas, fontSize: '1.8rem', flexShrink: 0,
      border: '2px solid rgba(232,160,18,0.25)',
    },
    tabBtn: (active) => ({
      padding: '0.6rem 1rem', fontSize: '0.75rem', fontWeight: 500,
      fontFamily: F.dm, border: 'none', cursor: 'pointer',
      background: active ? 'rgba(232,160,18,0.08)' : 'transparent',
      color: active ? C.gold : 'rgba(245,240,232,0.3)',
      borderBottom: `2px solid ${active ? C.gold : 'transparent'}`,
      transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: '0.4rem',
      whiteSpace: 'nowrap',
    }),
    alertBanner: (type) => ({
      display: 'flex', alignItems: 'center', gap: '0.5rem',
      padding: '0.6rem 1rem', borderRadius: '4px',
      background: type === 'expired' ? 'rgba(224,90,74,0.06)' : 'rgba(232,160,18,0.06)',
      border: `1px solid ${type === 'expired' ? 'rgba(224,90,74,0.2)' : 'rgba(232,160,18,0.15)'}`,
      color: type === 'expired' ? C.redLight : C.gold,
      fontSize: '0.72rem', fontWeight: 500,
    }),
  };

  return (
    <div style={S.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .profile-header { flex-direction: column; align-items: center; text-align: center; } }
        @media (max-width: 900px) { .profile-grid { grid-template-columns: 1fr !important; } }
      `}</style>

      {/* BACK BUTTON */}
      <button onClick={() => navigate("/landlord/tenants")} style={S.backBtn}
        onMouseEnter={e => e.currentTarget.style.color = C.white}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
        <Icon name="chevron-left" size={14} /> Back to Tenants
      </button>

      {/* ── PROFILE HEADER ────────────────────────────────── */}
      <div className="profile-header" style={S.profileHeader}>
        <div style={S.avatar}>{initials(`${tenant.first_name} ${tenant.last_name}`)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>
              {tenant.first_name} {tenant.last_name}
            </h1>
            <ScoreBadge score={reliabilityScore} />
          </div>
          <p style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.35)', fontFamily: F.mono }}>
            {tenant.unit_number ? `Unit ${tenant.unit_number}` : "N/A"} · {tenant.property_name || "Unknown Property"}
          </p>

          {/* Quick actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => navigate("/landlord/tenants", { state: { editTenant: tenant } })} style={{ ...btnGhost, fontSize: '0.7rem', padding: '0.4rem 0.9rem' }}>
              <Icon name="edit" size={12} /> Edit
            </button>
            <button onClick={() => navigate("/landlord/payments")} style={{ ...btnGhost, fontSize: '0.7rem', padding: '0.4rem 0.9rem' }}>
              <Icon name="credit-card" size={12} /> Payments
            </button>
            {balance > 0 && (
              <button onClick={() => navigate("/landlord/payments/plans")} style={{ ...btnGhost, fontSize: '0.7rem', padding: '0.4rem 0.9rem', color: C.blue, borderColor: 'rgba(58,143,212,0.3)' }}>
                <Icon name="rand" size={12} /> Repayment Plan
              </button>
            )}
            {(isExpiring || isExpired) && (
              <button style={{ ...btnPrimary, fontSize: '0.7rem', padding: '0.4rem 0.9rem' }}>
                <Icon name="refresh" size={12} /> Renew Lease
              </button>
            )}
          </div>
        </div>

        {/* Lease status badge */}
        <div style={{ flexShrink: 0 }}>
          {isExpired ? (
            <span style={pillStyle(C.redLight, 'rgba(224,90,74,0.08)', '1px solid rgba(224,90,74,0.2)')}>
              <Icon name="warning" size={10} /> Lease Expired
            </span>
          ) : isExpiring ? (
            <span style={pillStyle(C.gold, 'rgba(232,160,18,0.06)', '1px solid rgba(232,160,18,0.15)')}>
              <Icon name="clock" size={10} /> Expiring in {daysLeft}d
            </span>
          ) : (
            <span style={pillStyle(C.greenLight, 'rgba(26,122,74,0.06)', '1px solid rgba(76,186,122,0.12)')}>
              <Icon name="check" size={10} /> Active
            </span>
          )}
        </div>
      </div>

      {/* ── ALERTS ────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {isExpired && (
          <div style={S.alertBanner('expired')}>
            <Icon name="warning" size={14} />
            Lease expired on {formatDate(tenant.lease_end_date)} — renewal required
          </div>
        )}
        {isExpiring && !isExpired && (
          <div style={S.alertBanner('expiring')}>
            <Icon name="clock" size={14} />
            Lease expires on {formatDate(tenant.lease_end_date)} — {daysLeft} days remaining
          </div>
        )}
        {balance > 0 && (
          <div style={S.alertBanner('expired')}>
            <Icon name="credit-card" size={14} />
            Outstanding balance: {format(balance)}
          </div>
        )}
        {Number(tenant.missed_payments) > 0 && (
          <div style={S.alertBanner('expired')}>
            <Icon name="warning" size={14} />
            {tenant.missed_payments} missed payment{Number(tenant.missed_payments) !== 1 ? "s" : ""} on record
          </div>
        )}
      </div>

      {/* ── QUICK STATS ROW ───────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem', marginBottom: '1.5rem' }}>
        {[
          { label: "Monthly Rent", value: format(tenant.rent_amount), icon: "rand", color: C.white },
          { label: "Balance", value: balance > 0 ? format(balance) : "Clear", icon: "credit-card", color: balance > 0 ? C.redLight : C.greenLight },
          { label: "Payment Score", value: `${paymentScore}%`, icon: "check", color: paymentScore >= 80 ? C.greenLight : paymentScore >= 50 ? C.gold : C.redLight },
          { label: "Lease Period", value: `${formatDate(tenant.lease_start_date)} → ${formatDate(tenant.lease_end_date)}`, icon: "calendar", color: 'rgba(245,240,232,0.5)', fullWidth: true },
        ].map((stat, i) => (
          <div key={i} style={{ ...statCardStyle, gridColumn: stat.fullWidth ? 'span 2' : 'span 1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icon name={stat.icon} size={12} color="rgba(245,240,232,0.3)" />
              <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {stat.label}
              </span>
            </div>
            <span style={{ fontSize: stat.fullWidth ? '0.72rem' : '1.1rem', fontWeight: 700, color: stat.color, fontFamily: stat.fullWidth ? F.mono : F.bebas, letterSpacing: '0.03em' }}>
              {stat.value}
            </span>
          </div>
        ))}
      </div>

      {/* ── TABS ──────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0', borderBottom: `1px solid ${C.border}`, marginBottom: '1.2rem', overflowX: 'auto' }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={S.tabBtn(activeTab === tab.id)}>
            <Icon name={tab.icon} size={13} />
            {tab.label}
            {tab.count > 0 && (
              <span style={{ fontSize: '0.6rem', background: 'rgba(245,240,232,0.08)', padding: '0.1rem 0.35rem', borderRadius: '8px', fontFamily: F.mono }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB CONTENT ───────────────────────────────────── */}
      <div className="profile-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.2rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <>
              {/* Personal Information */}
              <div style={cardStyle}>
                <SectionHeader title="Personal Information" icon="user" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
                  <InfoRow label="Full Name" value={`${tenant.first_name} ${tenant.last_name}`} />
                  <InfoRow label="Email" value={tenant.email || "—"} icon="mail" />
                  <InfoRow label="Phone" value={tenant.phone || "—"} icon="phone" />
                  <InfoRow label="ID Number" value={tenant.id_number || "—"} mono />
                  <InfoRow label="Date of Birth" value={tenant.date_of_birth ? formatDate(tenant.date_of_birth) : "—"} />
                  <InfoRow label="Employment" value={tenant.employment_status?.replace(/_/g, " ") || "—"} />
                  <InfoRow label="Monthly Income" value={tenant.monthly_income ? format(tenant.monthly_income) : "—"} />
                </div>
              </div>

              {/* Lease Information */}
              <div style={cardStyle}>
                <SectionHeader title="Lease Information" icon="file-text" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 2rem' }}>
                  <InfoRow label="Unit" value={tenant.unit_number ? `Unit ${tenant.unit_number}` : "N/A"} />
                  <InfoRow label="Property" value={tenant.property_name || "—"} />
                  <InfoRow label="Monthly Rent" value={format(tenant.rent_amount)} />
                  <InfoRow label="Frequency" value={tenant.payment_frequency || "Monthly"} />
                  <InfoRow label="Deposit" value={tenant.deposit_amount ? format(tenant.deposit_amount) : "—"} />
                  <InfoRow label="Payment Due Day" value={tenant.payment_due_day ? `Day ${tenant.payment_due_day}` : "—"} />
                  <InfoRow label="Lease Start" value={formatDate(tenant.lease_start_date)} />
                  <InfoRow label="Lease End" value={formatDate(tenant.lease_end_date)} color={isExpired ? C.redLight : isExpiring ? C.gold : C.white} />
                  <InfoRow label="Status" value={tenant.lease_status === "active" ? "Active" : "Inactive"} color={tenant.lease_status === "active" ? C.greenLight : C.redLight} />
                </div>
              </div>
            </>
          )}

          {/* PAYMENTS TAB */}
          {activeTab === "payments" && (
            <div style={cardStyle}>
              <SectionHeader title="Payment History" icon="credit-card" action="View All" onAction={() => navigate("/landlord/payments")} />
              <PaymentHistoryTable payments={payments} />
            </div>
          )}

          {/* COMPLAINTS TAB */}
          {activeTab === "complaints" && (
            <div style={cardStyle}>
              <SectionHeader title="Complaint History" icon="message-square" action="View All" onAction={() => navigate("/landlord/complaints")} />
              <ComplaintHistoryTable complaints={complaints} />
            </div>
          )}

          {/* MAINTENANCE TAB */}
          {activeTab === "maintenance" && (
            <div style={cardStyle}>
              <SectionHeader title="Maintenance History" icon="wrench" action="View All" onAction={() => navigate("/landlord/maintenance")} />
              <MaintenanceHistoryTable requests={maintenanceRequests} />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — RELIABILITY SCORE CARD */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          <div style={cardStyle}>
            <SectionHeader title="Reliability Score" icon="star" />
            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
              <ScoreBadge score={reliabilityScore} />
            </div>

            {/* Payment breakdown */}
            <div style={{ marginBottom: '0.8rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>On-time</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: C.greenLight }}>{onTime}</span>
              </div>
              <div style={{ width: '100%', height: 4, borderRadius: '2px', background: 'rgba(245,240,232,0.06)', overflow: 'hidden', marginBottom: '0.4rem' }}>
                <div style={{ height: 4, background: C.greenLight, width: `${totalPayments > 0 ? (onTime / totalPayments) * 100 : 0}%` }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>Late</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: C.gold }}>{late}</span>
              </div>
              <div style={{ width: '100%', height: 4, borderRadius: '2px', background: 'rgba(245,240,232,0.06)', overflow: 'hidden', marginBottom: '0.4rem' }}>
                <div style={{ height: 4, background: C.gold, width: `${totalPayments > 0 ? (late / totalPayments) * 100 : 0}%` }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                <span style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>Missed</span>
                <span style={{ fontSize: '0.65rem', fontWeight: 600, color: C.redLight }}>{missed}</span>
              </div>
              <div style={{ width: '100%', height: 4, borderRadius: '2px', background: 'rgba(245,240,232,0.06)', overflow: 'hidden' }}>
                <div style={{ height: 4, background: C.redLight, width: `${totalPayments > 0 ? (missed / totalPayments) * 100 : 0}%` }} />
              </div>
            </div>

            <InfoRow label="Total Periods" value={String(totalPayments)} />
            <InfoRow label="Complaints" value={String(complaints.length)} color={complaints.length > 2 ? C.redLight : complaints.length > 0 ? C.gold : C.greenLight} />
            <InfoRow label="Maintenance Requests" value={String(maintenanceRequests.length)} />
          </div>

          {/* Quick Contact Card */}
          <div style={cardStyle}>
            <SectionHeader title="Quick Contact" icon="phone" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {tenant.email && (
                <a href={`mailto:${tenant.email}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: C.blue, textDecoration: 'none', padding: '0.5rem 0.7rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}` }}>
                  <Icon name="mail" size={13} /> {tenant.email}
                </a>
              )}
              {tenant.phone && (
                <a href={`tel:${tenant.phone}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.72rem', color: C.blue, textDecoration: 'none', padding: '0.5rem 0.7rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}` }}>
                  <Icon name="phone" size={13} /> {tenant.phone}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}