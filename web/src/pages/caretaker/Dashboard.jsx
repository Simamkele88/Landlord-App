/* eslint-disable no-unused-vars */
// CARETAKER DASHBOARD PAGE — LIGHT THEME
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useToast } from "../../contexts/ToastContext";
import { Icon } from "../../components/Icon";

const API = "http://localhost:4000";

// ---- Local light theme ----
const C = {
  background: "#f4f5f7",
  card: "#ffffff",
  border: "#e9ecef",
  primary: "#2c3e50",
  blue: "#3498db",
  green: "#2b7a4b",
  red: "#9e3a3a",
  purple: "#6f42c1",
  gold: "#d99e0b",
};

const F = {
  bebas: '"Bebas Neue", sans-serif',
  dm: '"DM Sans", sans-serif',
  mono: '"Space Mono", monospace',
};

const TEXT = "#000";
const SECONDARY_TEXT = "#333";

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const PRIORITY = {
  urgent: { color: "#ffffff", bg: C.red },
  high:   { color: TEXT, bg: C.gold },
  medium: { color: "#ffffff", bg: C.blue },
  low:    { color: SECONDARY_TEXT, bg: C.background },
};

const STATUS = {
  'needs_repair':  { color: C.red,       bg: 'rgba(158,58,58,0.06)',  border: '1px solid rgba(158,58,58,0.12)' },
  'in_progress':   { color: C.gold,      bg: 'rgba(217,158,11,0.06)', border: '1px solid rgba(217,158,11,0.12)' },
  'assigned':      { color: C.blue,      bg: 'rgba(52,152,219,0.06)', border: '1px solid rgba(52,152,219,0.12)' },
  'completed':     { color: C.green,     bg: 'rgba(43,122,75,0.06)',  border: '1px solid rgba(43,122,75,0.12)' },
  'open':          { color: C.red,       bg: 'rgba(158,58,58,0.06)',  border: '1px solid rgba(158,58,58,0.12)' },
  'under_review':  { color: C.gold,      bg: 'rgba(217,158,11,0.06)', border: '1px solid rgba(217,158,11,0.12)' },
};

function StatusDot({ status }) {
  const cfg = STATUS[status] || STATUS['needs_repair'];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.58rem', fontWeight: 600, padding: '0.1rem 0.4rem',
      borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
      textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: cfg.border,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color }} />
      {status?.replace(/_/g, " ")}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY[priority?.toLowerCase()] || PRIORITY.medium;
  return (
    <span style={{
      fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.4rem',
      borderRadius: '2px', fontFamily: F.mono, letterSpacing: '0.04em',
      textTransform: 'uppercase', background: cfg.bg, color: cfg.color,
    }}>{priority}</span>
  );
}

function ActivityRow({ type, title, detail, time, status, priority, onClick }) {
  const cfg = type === 'maintenance'
    ? { icon: 'wrench', color: C.blue, bg: 'rgba(52,152,219,0.06)', border: '1px solid rgba(52,152,219,0.1)' }
    : { icon: 'message-square', color: C.purple, bg: 'rgba(111,66,193,0.06)', border: '1px solid rgba(111,66,193,0.1)' };

  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '0.8rem',
      padding: '0.7rem 0.9rem', borderRadius: '4px',
      cursor: 'pointer', transition: 'background 0.15s',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.03)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
      
      {/* Icon */}
      <div style={{ width: 34, height: 34, borderRadius: '6px', background: cfg.bg, border: cfg.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={cfg.icon} size={15} color={cfg.color} />
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.78rem', fontWeight: 500, color: TEXT, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</p>
        <p style={{ fontSize: '0.62rem', color: SECONDARY_TEXT, fontFamily: F.mono, marginTop: '2px' }}>{detail}</p>
      </div>

      {/* Badges */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
        {priority && <PriorityBadge priority={priority} />}
        <StatusDot status={status} />
        <span style={{ fontSize: '0.6rem', color: SECONDARY_TEXT, fontFamily: F.mono, minWidth: '3.5rem', textAlign: 'right' }}>{time}</span>
      </div>
    </div>
  );
}

function MetricRow({ label, value, total, color, icon }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: '0.8rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Icon name={icon} size={11} color={color} />
          <span style={{ fontSize: '0.68rem', color: SECONDARY_TEXT, fontFamily: F.mono }}>{label}</span>
        </div>
        <span style={{ fontSize: '0.68rem', fontWeight: 600, color: TEXT, fontFamily: F.mono }}>
          {value}<span style={{ color: SECONDARY_TEXT }}>/{total}</span>
          <span style={{ marginLeft: '0.5rem', color }}>{pct}%</span>
        </span>
      </div>
      <div style={{ height: 3, borderRadius: '2px', background: 'rgba(0,0,0,0.06)', overflow: 'hidden' }}>
        <div style={{ height: 3, borderRadius: '2px', background: color, width: `${pct}%`, transition: 'width 0.6s' }} />
      </div>
    </div>
  );
}

export default function CaretakerDashboard() {
  useDocumentTitle("Dashboard");
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/caretaker/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDashboard(data);
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const data = dashboard;
  const stats = data?.stats || {};
  const today = new Date().toLocaleDateString("en-ZA", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div style={{ maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem', background: C.background, color: TEXT }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* HEADER */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '0.8rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: TEXT, fontFamily: F.bebas, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon name="bar-chart" size={20} color={C.blue} />
            {data?.caretaker_name || "Caretaker"}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ fontSize: '0.7rem', color: SECONDARY_TEXT, fontFamily: F.mono }}>{today}</span>
            <button onClick={fetchDashboard} style={{
              background: C.card, border: `1px solid ${C.border}`, borderRadius: '3px',
              padding: '0.4rem 0.7rem', cursor: 'pointer', color: TEXT,
              display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem',
              fontFamily: F.mono, letterSpacing: '0.04em', transition: 'color 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.color = C.primary}
              onMouseLeave={e => e.currentTarget.style.color = TEXT}>
              <Icon name="refresh" size={11} /> Refresh
            </button>
          </div>
        </div>

        {data?.property_name && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.5rem 0.9rem', borderRadius: '4px',
            background: 'rgba(52,152,219,0.06)', border: '1px solid rgba(52,152,219,0.15)',
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.blue }} />
            <span style={{ fontSize: '0.72rem', color: C.blue, fontFamily: F.mono }}>{data.property_name}</span>
            <span style={{ color: C.blue, opacity: 0.4 }}>·</span>
            <span style={{ fontSize: '0.68rem', color: C.blue, fontFamily: F.mono, opacity: 0.7 }}>{data.property_address}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', color: SECONDARY_TEXT, gap: '0.8rem' }}>
          <span style={{ width: 24, height: 24, border: '3px solid rgba(0,0,0,0.1)', borderTopColor: C.primary, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          <span style={{ fontSize: '0.85rem', fontFamily: F.mono, color: TEXT }}>Loading...</span>
        </div>
      ) : (
        /* MAIN GRID */
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1.5rem', alignItems: 'start' }}>
          <style>{`@media (max-width: 900px) { .dash-grid { grid-template-columns: 1fr !important; } }`}</style>

          {/* ACTIVITY FEED */}
          <div style={{
            background: C.card, border: `1px solid ${C.border}`,
            borderRadius: '6px', overflow: 'hidden',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.2rem', borderBottom: `1px solid ${C.border}`,
            }}>
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 600, color: TEXT, fontFamily: F.bebas, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Recent Activity
                </p>
                <p style={{ fontSize: '0.58rem', color: SECONDARY_TEXT, fontFamily: F.mono, marginTop: '2px' }}>
                  {data?.recent_activity?.length || 0} items
                </p>
              </div>
              <button onClick={() => navigate("/caretaker/maintenance")} style={{
                fontSize: '0.62rem', fontWeight: 500, color: C.blue,
                background: 'none', border: 'none', cursor: 'pointer',
                fontFamily: F.mono, letterSpacing: '0.04em',
              }}>
                View All 
              </button>
            </div>

            <div style={{ padding: '0.4rem 0' }}>
              {(data?.recent_activity || []).map((item, i) => (
                <ActivityRow key={i} {...item}
                  onClick={() => navigate(item.type === 'maintenance' ? '/caretaker/maintenance' : '/caretaker/complaints')} />
              ))}
            </div>
          </div>

          {/* RIGHT: SUMMARY + ACTIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Property Overview */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.3rem 1.2rem' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 600, color: TEXT, fontFamily: F.mono, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Property Overview</p>
              <MetricRow label="Occupancy" value={stats.total_tenants || 0} total={stats.total_units || 1} color={C.green} icon="home" />
              <MetricRow label="Maintenance" value={stats.open_maintenance || 0} total={10} color={C.red} icon="wrench" />
              <MetricRow label="Complaints" value={stats.open_complaints || 0} total={5} color={C.purple} icon="message-square" />
              {stats.pending_verdicts > 0 && (
                <MetricRow label="Pending Verdicts" value={stats.pending_verdicts || 0} total={stats.open_complaints || 1} color={C.red} icon="flag" />
              )}
            </div>

            {/* Quick Actions */}
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.3rem 1.2rem' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 600, color: TEXT, fontFamily: F.mono, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.8rem' }}>Quick Actions</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {[
                  { label: 'Manage Maintenance', icon: 'wrench', path: '/caretaker/maintenance', color: C.blue },
                  { label: 'Review Complaints', icon: 'message-square', path: '/caretaker/complaints', color: C.purple },
                  { label: 'View Tenants', icon: 'users', path: '/caretaker/tenants', color: C.green },
                  { label: 'Messages', icon: 'messages', path: '/caretaker/messages', color: C.gold },
                ].map(btn => (
                  <button key={btn.label} onClick={() => navigate(btn.path)} style={{
                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                    padding: '0.6rem 0.8rem', borderRadius: '3px',
                    background: C.background, border: `1px solid ${C.border}`,
                    cursor: 'pointer', transition: 'all 0.15s', width: '100%', textAlign: 'left',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = btn.color; e.currentTarget.style.background = `${btn.color}06`; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.background = C.background; }}>
                    <Icon name={btn.icon} size={16} color={btn.color} />
                    <span style={{ fontSize: '0.72rem', fontWeight: 500, color: SECONDARY_TEXT, fontFamily: F.dm }}>{btn.label}</span>
                    <Icon name="chevron-right" size={11} color={SECONDARY_TEXT} style={{ marginLeft: 'auto' }} />
                  </button>
                ))}
              </div>
            </div>

            {/* In Progress */}
            {stats.in_progress > 0 && (
              <div style={{
                background: 'rgba(217,158,11,0.06)', border: '1px solid rgba(217,158,11,0.15)',
                borderRadius: '6px', padding: '1rem 1.2rem',
                display: 'flex', alignItems: 'center', gap: '0.7rem',
              }}>
                <Icon name="clock" size={18} color={C.gold} />
                <div>
                  <p style={{ fontSize: '0.8rem', fontWeight: 700, color: C.gold, fontFamily: F.bebas, letterSpacing: '0.03em' }}>
                    {stats.in_progress} repair{stats.in_progress !== 1 ? 's' : ''} in progress
                  </p>
                  <p style={{ fontSize: '0.6rem', color: SECONDARY_TEXT, fontFamily: F.mono }}>Being worked on by contractors</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}