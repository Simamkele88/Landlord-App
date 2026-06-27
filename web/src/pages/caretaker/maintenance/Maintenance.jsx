/* eslint-disable no-unused-vars */
// CARETAKER MAINTENANCE PAGE 
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

const STATUS_CONFIG = {
  "needs_repair":     { label: "Needs Repair",    color: C.redLight,   bg: 'rgba(224,90,74,0.06)',  border: '1px solid rgba(224,90,74,0.12)',  dot: C.redLight   },
  "assigned":         { label: "Assigned",         color: C.blue,       bg: 'rgba(58,143,212,0.06)',  border: '1px solid rgba(58,143,212,0.12)',  dot: C.blue       },
  "in_progress":      { label: "In Progress",      color: C.gold,       bg: 'rgba(232,160,18,0.04)',  border: '1px solid rgba(232,160,18,0.1)',   dot: C.gold       },
  "completed":        { label: "Completed",        color: C.greenLight, bg: 'rgba(26,122,74,0.04)',   border: '1px solid rgba(76,186,122,0.1)',   dot: C.greenLight },
  "cancelled":        { label: "Cancelled",        color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.08)', dot: 'rgba(245,240,232,0.3)' },
  "pending_approval": { label: "Pending Approval", color: C.purple,     bg: 'rgba(139,92,246,0.06)',  border: '1px solid rgba(139,92,246,0.12)',  dot: C.purple     },
};

const PRIORITY_CONFIG = {
  "urgent": { bg: C.redLight, color: C.white },
  "high":   { bg: C.gold, color: C.black },
  "medium": { bg: C.blue, color: C.white },
  "low":    { bg: 'rgba(245,240,232,0.06)', color: 'rgba(245,240,232,0.4)' },
};

const FILTERS = ["All", "Needs Repair", "In Progress", "Completed", "Escalated"];

function fmt(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["needs_repair"];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.58rem', fontWeight: 600, padding: '0.12rem 0.45rem',
      borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
      textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: cfg.border,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG["low"];
  return (
    <span style={{
      fontSize: '0.55rem', fontWeight: 700, padding: '0.1rem 0.45rem',
      borderRadius: '2px', fontFamily: F.mono, letterSpacing: '0.04em',
      textTransform: 'uppercase', background: cfg.bg, color: cfg.color,
    }}>{priority}</span>
  );
}

export default function CaretakerMaintenance() {
  useDocumentTitle("Maintenance");
  const navigate = useNavigate();
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/caretaker/maintenance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data.requests || []);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to connect to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  function handleRefresh() { setRefreshing(true); fetchRequests(true); }

  function filterMatch(request) {
    if (filter === "All") return true;
    if (filter === "Needs Repair") return request.status === "needs_repair";
    if (filter === "In Progress") return ["assigned", "in_progress"].includes(request.status);
    if (filter === "Completed") return request.status === "completed";
    if (filter === "Escalated") return request.status === "pending_approval";
    return true;
  }

  const filtered = requests.filter(r => {
    const statusMatch = filterMatch(r);
    const q = search.toLowerCase();
    const searchMatch = !q || [r.title, r.tenant_name, r.unit_number?.toString(), r.property_name, r.request_number, r.category]
      .some(s => (s || "").toLowerCase().includes(q));
    return statusMatch && searchMatch;
  });

  const needsAction = requests.filter(r => r.status === "needs_repair").length;
  const inProgress = requests.filter(r => ["assigned", "in_progress"].includes(r.status)).length;
  const propertyName = requests[0]?.property_name || "Your Property";

  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', gap: '1rem', flexWrap: 'wrap' },
    title: { fontSize: '1.5rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    subtitle: { fontSize: '0.7rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono },
    toolbar: {
      display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.7rem 1rem',
      flexWrap: 'wrap', borderBottom: `1px solid ${C.border}`,
    },
    filterBtn: (active) => ({
      padding: '0.35rem 0.7rem', borderRadius: '3px', fontSize: '0.68rem', fontWeight: 600,
      fontFamily: F.mono, letterSpacing: '0.04em', cursor: 'pointer', transition: 'all 0.15s',
      border: `1px solid ${active ? C.blue : C.border}`,
      background: active ? 'rgba(58,143,212,0.08)' : 'transparent',
      color: active ? C.blue : 'rgba(245,240,232,0.4)',
    }),
    searchWrap: { position: 'relative', marginLeft: 'auto' },
    searchInput: {
      padding: '0.4rem 0.7rem 0.4rem 2rem', borderRadius: '3px',
      background: C.black, border: `1px solid ${C.border}`,
      color: C.white, fontFamily: F.dm, fontSize: '0.74rem', outline: 'none', width: 200,
    },
    table: { width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' },
    th: {
      fontSize: '0.58rem', fontWeight: 600, color: 'rgba(245,240,232,0.25)',
      fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase',
      padding: '0.65rem 1rem', textAlign: 'left', borderBottom: `1px solid ${C.border}`,
    },
    td: { padding: '0.65rem 1rem', borderBottom: `1px solid ${C.border}` },
    footer: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.7rem 1rem', fontSize: '0.7rem', color: 'rgba(245,240,232,0.25)',
      fontFamily: F.mono, borderTop: `1px solid ${C.border}`,
    },
  };

  return (
    <div style={S.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input:focus { border-color: ${C.borderFocus} !important; }`}</style>

      {/* HEADER */}
      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}><Icon name="wrench" size={20} color={C.blue} />Maintenance</h1>
          <p style={S.subtitle}>
            {propertyName} · {requests.length} requests · {needsAction} need action · {inProgress} in progress
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} style={{
          background: C.blue, color: C.white, border: 'none',
          padding: '0.45rem 1rem', fontSize: '0.68rem', fontWeight: 600,
          fontFamily: F.dm, letterSpacing: '0.04em', borderRadius: '3px',
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
          opacity: refreshing ? 0.6 : 1,
        }}>
          <Icon name="refresh" size={12} /> {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div style={{
          padding: '0.7rem 1rem', borderRadius: '3px', marginBottom: '1rem',
          background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.12)',
          display: 'flex', alignItems: 'center', gap: '0.5rem',
        }}>
          <Icon name="warning" size={15} color={C.redLight} />
          <p style={{ fontSize: '0.72rem', color: C.redLight, flex: 1 }}>{error}</p>
          <button onClick={() => fetchRequests()} style={{ fontSize: '0.68rem', color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}>Retry</button>
        </div>
      )}

      {/* TABLE */}
      <div style={{ background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden' }}>
        
        {/* TOOLBAR */}
        <div style={S.toolbar}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={S.filterBtn(filter === f)}>
                {f}
                {f !== "All" && (
                  <span style={{ marginLeft: '0.3rem', opacity: 0.5 }}>
                    {requests.filter(r => {
                      if (f === "Needs Repair") return r.status === "needs_repair";
                      if (f === "In Progress") return ["assigned", "in_progress"].includes(r.status);
                      if (f === "Completed") return r.status === "completed";
                      if (f === "Escalated") return r.status === "pending_approval";
                      return false;
                    }).length}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div style={S.searchWrap}>
            <Icon name="search" size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.2)', pointerEvents: 'none' }} />
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={S.searchInput} />
          </div>
        </div>

        {/* CONTENT */}
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', color: 'rgba(245,240,232,0.3)', gap: '0.6rem' }}>
            <span style={{ width: 20, height: 20, border: '2px solid rgba(245,240,232,0.06)', borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            Loading requests...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["Request", "Tenant / Unit", "Priority", "Status", "Worker", "Cost", "Reported", ""].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '3rem 0', color: 'rgba(245,240,232,0.2)' }}>No maintenance requests found.</td></tr>
                )}
                {filtered.map(r => (
                  <tr key={r.id} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.muted}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: '6px',
                          background: 'rgba(58,143,212,0.08)', border: '1px solid rgba(58,143,212,0.12)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Icon name="wrench" size={13} color={C.blue} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 600, color: C.white, fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>{r.title}</p>
                          <p style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono }}>{r.category}</p>
                        </div>
                      </div>
                    </td>

                    <td style={S.td}>
                      <p style={{ fontWeight: 500, color: C.white, fontSize: '0.75rem' }}>{r.tenant_name}</p>
                      <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>
                        {r.unit_number ? `Unit ${r.unit_number}` : "—"}
                      </p>
                    </td>

                    <td style={S.td}><PriorityBadge priority={r.priority} /></td>
                    <td style={S.td}><StatusBadge status={r.status} /></td>

                    <td style={{ ...S.td, fontSize: '0.72rem' }}>
                      {r.contractor_name ? (
                        <span style={{ color: 'rgba(245,240,232,0.4)' }}>{r.contractor_name}</span>
                      ) : (
                        <span style={{ color: 'rgba(245,240,232,0.15)', fontStyle: 'italic', fontFamily: F.mono, fontSize: '0.65rem' }}>Unassigned</span>
                      )}
                    </td>

                    <td style={{ ...S.td, fontWeight: 600, fontSize: '0.74rem' }}>
                      {r.estimated_cost ? (
                        <span style={{ color: C.gold }}>{fmt(r.estimated_cost)}</span>
                      ) : r.actual_cost ? (
                        <span style={{ color: C.greenLight }}>{fmt(r.actual_cost)}</span>
                      ) : (
                        <span style={{ color: 'rgba(245,240,232,0.2)' }}>—</span>
                      )}
                    </td>

                    <td style={{ ...S.td, fontSize: '0.68rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono }}>
                      {timeAgo(r.created_at)}
                    </td>

                    <td style={S.td}>
                      <button onClick={() => navigate(`/caretaker/maintenance/${r.id}`)} style={{
                        fontSize: '0.66rem', fontWeight: 500, color: C.blue,
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontFamily: F.mono, whiteSpace: 'nowrap',
                      }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                        Review →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}
        <div style={S.footer}>
          <span>Showing <span style={{ color: C.white, fontWeight: 500 }}>{filtered.length}</span> of <span style={{ color: C.white, fontWeight: 500 }}>{requests.length}</span> requests</span>
        </div>
      </div>
    </div>
  );
}