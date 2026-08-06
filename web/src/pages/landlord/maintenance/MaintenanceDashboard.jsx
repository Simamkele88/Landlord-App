import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const STATUS_CONFIG = {
  "needs_repair":     { label: "Needs Repair",    color: C.redLight,   bg: 'rgba(224,90,74,0.1)',    border: '1px solid rgba(224,90,74,0.2)',   dot: C.redLight,   icon: 'alert-circle' },
  "assigned":         { label: "Assigned",         color: C.blue,       bg: 'rgba(58,143,212,0.1)',    border: '1px solid rgba(58,143,212,0.2)',   dot: C.blue,       icon: 'user-check' },
  "in_progress":      { label: "In Progress",      color: C.gold,       bg: 'rgba(232,160,18,0.08)',   border: '1px solid rgba(232,160,18,0.2)',   dot: C.gold,       icon: 'clock' },
  "completed":        { label: "Completed",        color: C.greenLight, bg: 'rgba(26,122,74,0.1)',    border: '1px solid rgba(76,186,122,0.2)',   dot: C.greenLight, icon: 'check-circle' },
  "closed":           { label: "Closed",           color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)', dot: 'rgba(245,240,232,0.3)', icon: 'lock' },
  "cancelled":        { label: "Cancelled",        color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)', dot: 'rgba(245,240,232,0.3)', icon: 'x-circle' },
  "pending_approval": { label: "Pending Approval", color: C.purple,     bg: 'rgba(139,92,246,0.1)',    border: '1px solid rgba(139,92,246,0.2)',   dot: C.purple,     icon: 'clock' },
};

const PRIORITY_CONFIG = {
  "emergency": { bg: 'rgba(224,90,74,0.25)', color: '#ffffff', label: 'Emergency' },
  "urgent":    { bg: 'rgba(224,90,74,0.2)', color: C.redLight, label: 'Urgent' },
  "high":      { bg: 'rgba(249,115,22,0.15)', color: '#f97316', label: 'High' },
  "medium":    { bg: 'rgba(58,143,212,0.15)', color: C.blue, label: 'Medium' },
  "low":       { bg: 'rgba(245,240,232,0.08)', color: 'rgba(245,240,232,0.4)', label: 'Low' },
};

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending Approval", value: "pending_approval" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Closed", value: "closed" },
];

function fmt(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function timeAgo(dateStr) { if (!dateStr) return ""; const diff = (Date.now() - new Date(dateStr)) / 1000; if (diff < 60) return "Just now"; if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`; return `${Math.floor(diff / 86400)}d ago`; }

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["needs_repair"];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.58rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: cfg.border }}>
      <Icon name={cfg.icon} size={9} />{cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG["low"];
  return (
    <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  );
}

const inputStyle = { width: '100%', fontSize: '0.82rem', padding: '0.6rem 0.9rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, outline: 'none' };
const btnPrimary = { background: C.gold, color: C.black, border: 'none', padding: '0.6rem 1.4rem', fontSize: '0.76rem', fontWeight: 700, fontFamily: F.dm, letterSpacing: '0.04em', borderRadius: '3px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' };
const btnGhost = { background: 'transparent', color: 'rgba(245,240,232,0.5)', border: `1px solid ${C.border}`, padding: '0.6rem 1.2rem', fontSize: '0.76rem', fontWeight: 500, fontFamily: F.dm, letterSpacing: '0.04em', borderRadius: '3px', cursor: 'pointer' };
const cardStyle = { background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden' };
const modalOverlay = { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' };

function ReopenModal({ request, onClose, onReopen }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit() { if (!reason.trim()) { setError("Please provide a reason"); return; } setLoading(true); onReopen({ reason: reason.trim() }); setLoading(false); onClose(); }

  return (
    <div style={modalOverlay}>
      <div style={{ width: '100%', maxWidth: 440, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '6px', background: 'rgba(232,160,18,0.12)', border: '1px solid rgba(232,160,18,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="refresh-cw" size={16} color={C.gold} /></div>
            <div><h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Reopen Request</h3><p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{request.request_number} · {request.title}</p></div>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }} onMouseEnter={e => e.currentTarget.style.color = C.white} onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {error && <div style={{ padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)', fontSize: '0.72rem', color: C.redLight, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icon name="alert-circle" size={12} /> {error}</div>}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(232,160,18,0.06)', border: '1px solid rgba(232,160,18,0.15)' }}><Icon name="alert-triangle" size={13} color={C.gold} style={{ flexShrink: 0, marginTop: '1px' }} /><p style={{ fontSize: '0.65rem', color: C.gold, lineHeight: 1.4 }}>This will reset the request to "Needs Repair". The caretaker will be notified.</p></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}><label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Reason <span style={{ color: C.redLight }}>*</span></label><textarea rows={4} value={reason} onChange={e => { setReason(e.target.value); setError(""); }} placeholder="Why is this request being reopened?" style={{ ...inputStyle, resize: 'vertical', minHeight: 80, fontSize: '0.72rem' }} /></div>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, padding: '0.6rem 1.2rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600, fontFamily: F.dm, letterSpacing: '0.04em', border: 'none', cursor: 'pointer', background: C.gold, color: C.black, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>{loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: C.black, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <><Icon name="refresh-cw" size={14} /> Reopen Request</>}</button>
        </div>
      </div>
    </div>
  );
}

export default function LandlordMaintenance() {
  useDocumentTitle("Maintenance");
  const navigate = useNavigate();
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending_approval: 0, in_progress: 0, completed: 0 });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [reopenModal, setReopenModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/landlord/maintenance`, { headers: { Authorization: `Bearer ${token}` } });
      setRequests(response.data.requests || []);
      setStats(response.data.stats || { total: 0, pending_approval: 0, in_progress: 0, completed: 0 });
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load requests");
    } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  function handleRefresh() { setRefreshing(true); fetchRequests(true); }

  function filterMatch(request) {
    switch (filter) {
      case "pending_approval": return request.status === "pending_approval";
      case "active": return ["needs_repair", "assigned", "in_progress"].includes(request.status);
      case "completed": return request.status === "completed";
      case "closed": return ["closed", "cancelled"].includes(request.status);
      default: return true;
    }
  }

  const filtered = requests.filter(r => {
    const statusMatch = filterMatch(r);
    const q = search.toLowerCase();
    const searchMatch = !q || [r.title, r.tenant_name, r.unit_number?.toString(), r.property_name, r.request_number, r.category, r.contractor_name].some(s => (s || "").toLowerCase().includes(q));
    return statusMatch && searchMatch;
  });

  async function handleReopen(data) {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/maintenance/${reopenModal.id}/reopen`, data, { headers: { Authorization: `Bearer ${token}` } });
      await fetchRequests();
      setReopenModal(null);
      toast.success("Request reopened");
    } catch (err) { toast.error(err.response?.data?.error || "Failed to reopen"); }
    finally { setSaving(false); }
  }


  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    subtitle: {  fontSize: '1.2rem', color: 'white', fontWeight: 500, fontFamily: F.mono, marginTop: '0.3rem', opacity: 1, letterSpacing: '0.02em',},
    toolbarInner: { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', flexWrap: 'wrap' },
    filterBtn: (active) => ({ padding: '0.4rem 0.8rem', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 600, fontFamily: F.mono, letterSpacing: '0.04em', border: `1px solid ${active ? C.gold : C.border}`, background: active ? 'rgba(232,160,18,0.12)' : 'transparent', color: active ? C.gold : 'rgba(245,240,232,0.4)', cursor: 'pointer', transition: 'all 0.15s' }),
    searchWrap: { position: 'relative', marginLeft: 'auto' },
    searchIcon: { position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.25)' },
    searchInput: { padding: '0.5rem 0.8rem 0.5rem 2.25rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, fontSize: '0.78rem', outline: 'none', width: 220 },
    table: { width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' },
    th: { fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.7rem 1rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` },
    td: { padding: '0.7rem 1rem', borderBottom: `1px solid ${C.border}` },
    footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono },
    loadMoreWrap: { display: 'flex', justifyContent: 'center', padding: '1rem' },
  };


  return (
    <div style={S.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {saving && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.2rem 1.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <span style={{ width: 18, height: 18, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: C.white, fontFamily: F.dm }}>Processing...</span>
          </div>
        </div>
      )}

      {reopenModal && <ReopenModal request={reopenModal} onClose={() => setReopenModal(null)} onReopen={handleReopen} />}

      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}><Icon name="wrench" size={22} color={C.gold} />Maintenance</h1>
          <p style={S.subtitle}>
            {stats.total} total · {stats.pending_approval} pending approval · {stats.in_progress} active · {stats.completed} completed
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} style={btnPrimary}>
          <Icon name="refresh-cw" size={14} /> {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div style={{ padding: '0.8rem 1rem', borderRadius: '3px', background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name="alert-circle" size={16} color={C.redLight} />
          <p style={{ fontSize: '0.75rem', color: C.redLight, flex: 1 }}>{error}</p>
          <button onClick={() => fetchRequests()} style={{ fontSize: '0.72rem', color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}>Retry</button>
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.8rem 1rem', flexWrap: 'wrap', borderBottom: `1px solid ${C.border}` }}>
          {FILTERS.map(f => (
            <button key={f.value} onClick={() => setFilter(f.value)} style={S.filterBtn(filter === f.value)}>
              {f.label}
              {f.value === "pending_approval" && stats.pending_approval > 0 && <span style={{ marginLeft: '0.3rem', color: C.purple }}>({stats.pending_approval})</span>}
            </button>
          ))}
          <div style={{ position: 'relative', marginLeft: 'auto' }}>
            <Icon name="search" size={13} style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.2)' }} />
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} style={{ padding: '0.45rem 0.7rem 0.45rem 2rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, fontSize: '0.75rem', outline: 'none', width: 200 }} />
          </div>
        </div>

        {loading ? (
          <div style={S.loading}>
            <span style={{ width: 24, height: 24, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <span style={{ fontSize: '0.78rem' }}>Loading requests...</span>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {["Request", "Tenant", "Property", "Priority", "Status", "Contractor", "Cost", "Reported", ""].map(h => <th key={h} style={S.th}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ ...S.td, textAlign: 'center', padding: '3rem 0', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono }}>No requests found</td></tr>
                )}
                {filtered.map(r => {
                  const isPending = r.status === "pending_approval";
                  return (
                    <tr key={r.id} style={{ transition: 'background 0.15s', background: isPending ? 'rgba(139,92,246,0.03)' : 'transparent' }}
                      onMouseEnter={e => { if (!isPending) e.currentTarget.style.background = C.muted; }}
                      onMouseLeave={e => { if (!isPending) e.currentTarget.style.background = 'transparent'; }}>
                      
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 30, height: 30, borderRadius: '6px', background: isPending ? 'rgba(139,92,246,0.12)' : 'rgba(58,143,212,0.1)', border: isPending ? '1px solid rgba(139,92,246,0.2)' : '1px solid rgba(58,143,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon name={isPending ? "clock" : "wrench"} size={13} color={isPending ? C.purple : C.blue} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontWeight: 600, color: C.white, fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{r.title}</p>
                            <p style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginTop: 1 }}>{r.request_number}</p>
                          </div>
                        </div>
                      </td>

                      <td style={S.td}>
                        <p style={{ fontWeight: 500, color: C.white }}>{r.tenant_name || "—"}</p>
                        <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono }}>{r.unit_number ? `Unit ${r.unit_number}` : "—"}</p>
                      </td>

                      <td style={{ ...S.td, color: 'rgba(245,240,232,0.4)' }}>{r.property_name || "—"}</td>

                      <td style={S.td}><PriorityBadge priority={r.priority} /></td>

                      <td style={S.td}><StatusBadge status={r.status} /></td>

                      <td style={S.td}>
                        {r.contractor_name ? <span style={{ color: 'rgba(245,240,232,0.5)' }}>{r.contractor_name}</span> : <span style={{ color: 'rgba(245,240,232,0.15)', fontStyle: 'italic', fontFamily: F.mono, fontSize: '0.65rem' }}>Unassigned</span>}
                      </td>

                      <td style={{ ...S.td, fontWeight: 600 }}>
                        {r.estimated_cost ? <span style={{ color: C.gold }}>{fmt(r.estimated_cost)}</span> : r.actual_cost ? <span style={{ color: C.greenLight }}>{fmt(r.actual_cost)}</span> : <span style={{ color: 'rgba(245,240,232,0.2)' }}>—</span>}
                      </td>

                      <td style={{ ...S.td, fontSize: '0.68rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono }}>{timeAgo(r.created_at)}</td>

                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <button onClick={() => navigate(`/landlord/maintenance/${r.id}`)} style={{ fontSize: '0.68rem', fontWeight: 500, color: isPending ? C.purple : C.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono, whiteSpace: 'nowrap', transition: 'color 0.15s' }}
                            onMouseEnter={e => e.currentTarget.style.color = C.white}
                            onMouseLeave={e => e.currentTarget.style.color = isPending ? C.purple : C.blue}>
                            {isPending ? "Review →" : "View"}
                          </button>
                          {["completed", "closed", "cancelled"].includes(r.status) && (
                            <button onClick={() => setReopenModal(r)} style={{ fontSize: '0.68rem', fontWeight: 500, color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono, whiteSpace: 'nowrap' }}
                              onMouseEnter={e => e.currentTarget.style.color = C.white}
                              onMouseLeave={e => e.currentTarget.style.color = C.gold}>
                              Reopen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={S.footer}>
          <span>Showing <span style={{ color: C.white, fontWeight: 500 }}>{filtered.length}</span> of <span style={{ color: C.white, fontWeight: 500 }}>{requests.length}</span> requests</span>
          {filter !== "all" && <button onClick={() => setFilter("all")} style={{ fontSize: '0.65rem', color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}>Clear filter</button>}
        </div>
      </div>
    </div>
  );
}