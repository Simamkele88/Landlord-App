// LANDLORD MAINTENANCE DASHBOARD 
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const STATUS_CONFIG = {
  "needs_repair":     { label: "Needs Repair",    color: C.redLight,   bg: 'rgba(224,90,74,0.1)',    border: '1px solid rgba(224,90,74,0.2)',   dot: C.redLight      },
  "assigned":         { label: "Assigned",         color: C.blue,       bg: 'rgba(58,143,212,0.1)',    border: '1px solid rgba(58,143,212,0.2)',   dot: C.blue          },
  "in_progress":      { label: "In Progress",      color: C.gold,       bg: 'rgba(232,160,18,0.08)',   border: '1px solid rgba(232,160,18,0.2)',   dot: C.gold          },
  "completed":        { label: "Completed",        color: C.greenLight, bg: 'rgba(26,122,74,0.1)',    border: '1px solid rgba(76,186,122,0.2)',   dot: C.greenLight    },
  "cancelled":        { label: "Closed",           color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)', dot: 'rgba(245,240,232,0.3)' },
  "pending_approval": { label: "Pending Approval", color: C.purple,     bg: 'rgba(139,92,246,0.1)',    border: '1px solid rgba(139,92,246,0.2)',   dot: C.purple        },
};

const PRIORITY_CONFIG = {
  "urgent": { bg: C.redLight, color: C.white },
  "high":   { bg: 'rgba(232,160,18,0.2)', color: C.gold },
  "medium": { bg: 'rgba(58,143,212,0.15)', color: C.blue },
  "low":    { bg: 'rgba(245,240,232,0.08)', color: 'rgba(245,240,232,0.4)' },
};

const FILTERS = ["All", "Needs Repair", "In Progress", "Pending Approval", "Completed", "Closed"];

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
      fontSize: '0.58rem', fontWeight: 700, padding: '0.12rem 0.45rem',
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
      fontSize: '0.58rem', fontWeight: 700, padding: '0.12rem 0.5rem',
      borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
      textTransform: 'uppercase', background: cfg.bg, color: cfg.color,
    }}>
      {priority}
    </span>
  );
}


const inputStyle = {
  width: '100%', fontSize: '0.82rem', padding: '0.6rem 0.9rem', borderRadius: '3px',
  background: C.black, border: `1px solid ${C.border}`, color: C.white,
  fontFamily: F.dm, outline: 'none',
};

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

const cardStyle = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden',
};

const modalOverlay = {
  position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
};


function ReopenModal({ request, onClose, onReopen }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!reason.trim()) { setError("Please provide a reason"); return; }
    setLoading(true);
    onReopen({ reason: reason.trim() });
    setLoading(false);
    onClose();
  }

  return (
    <div style={modalOverlay}>
      <div style={{ width: '100%', maxWidth: 440, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '6px', background: 'rgba(232,160,18,0.12)', border: '1px solid rgba(232,160,18,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="refresh" size={16} color={C.gold} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Reopen Request</h3>
              <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{request.request_number} · {request.title}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {error && (
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)', fontSize: '0.72rem', color: C.redLight }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(232,160,18,0.06)', border: '1px solid rgba(232,160,18,0.15)' }}>
            <Icon name="warning" size={13} color={C.gold} style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '0.62rem', color: C.gold, lineHeight: 1.4 }}>
              This will reopen the request and set the status back to "Needs Repair". The caretaker will be notified.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Reason <span style={{ color: C.redLight }}>*</span>
            </label>
            <textarea rows={4} value={reason} onChange={e => { setReason(e.target.value); setError(""); }}
              placeholder="Why is this request being reopened?"
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80, fontSize: '0.72rem' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 1, padding: '0.6rem 1.2rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600,
            fontFamily: F.dm, letterSpacing: '0.04em', border: 'none', cursor: 'pointer',
            background: C.gold, color: C.black, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: C.black, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <><Icon name="refresh" size={14} /> Reopen Request</>}
          </button>
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
  const [filter, setFilter] = useState("All");
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
      const response = await axios.get(`${API}/maintenance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data.requests || []);
    } catch (err) {
      console.error("Failed to fetch maintenance requests:", err);
      setError(err.response?.data?.error || "Unable to connect to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  function handleRefresh() {
    setRefreshing(true);
    fetchRequests(true);
  }

  function filterMatch(request) {
    if (filter === "All") return true;
    if (filter === "Needs Repair") return request.status === "needs_repair";
    if (filter === "In Progress") return ["assigned", "in_progress"].includes(request.status);
    if (filter === "Pending Approval") return request.status === "pending_approval";
    if (filter === "Completed") return request.status === "completed";
    if (filter === "Closed") return request.status === "cancelled";
    return true;
  }

  const filtered = requests.filter(r => {
    const statusMatch = filterMatch(r);
    const q = search.toLowerCase();
    const searchMatch = !q || [r.title, r.tenant_name, r.unit_number?.toString(), r.property_name, r.request_number, r.category]
      .some(s => (s || "").toLowerCase().includes(q));
    return statusMatch && searchMatch;
  });

  async function handleReopen(data) {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/maintenance/${reopenModal.id}/reopen`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchRequests();
      setReopenModal(null);
      toast.success("Request reopened successfully.");
    } catch (err) {
      console.error("Failed to reopen:", err);
      toast.error(err.response?.data?.error || "Failed to reopen request");
    } finally {
      setSaving(false);
    }
  }

  
  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    subtitle: { fontSize: '0.75rem', color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, marginTop: '0.3rem' },
    toolbar: { ...cardStyle, padding: '0', marginBottom: '1.2rem' },
    toolbarInner: { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', flexWrap: 'wrap' },
    filterBtn: (active) => ({ padding: '0.4rem 0.8rem', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 600, fontFamily: F.mono, letterSpacing: '0.04em', border: `1px solid ${active ? C.gold : C.border}`, background: active ? 'rgba(232,160,18,0.12)' : 'transparent', color: active ? C.gold : 'rgba(245,240,232,0.4)', cursor: 'pointer', transition: 'all 0.15s' }),
    searchWrap: { position: 'relative', marginLeft: 'auto' },
    searchIcon: { position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.25)' },
    searchInput: { padding: '0.5rem 0.8rem 0.5rem 2.25rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, fontSize: '0.78rem', outline: 'none', width: 220 },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: 'rgba(245,240,232,0.3)', gap: '0.8rem' },
    table: { width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' },
    th: { fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.7rem 1rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` },
    td: { padding: '0.7rem 1rem', borderBottom: `1px solid ${C.border}` },
    footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono },
  };

  return (
    <div style={S.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, textarea:focus, select:focus { border-color: ${C.borderFocus} !important; }
      `}</style>

      {/* SAVING OVERLAY */}
      {saving && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.2rem 1.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <span style={{ width: 18, height: 18, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: C.white, fontFamily: F.dm }}>Saving changes...</span>
          </div>
        </div>
      )}

      {/* REOPEN MODAL */}
      {reopenModal && (
        <ReopenModal
          request={reopenModal}
          onClose={() => setReopenModal(null)}
          onReopen={handleReopen}
        />
      )}

      {/* HEADER */}
      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}><Icon name="wrench" size={24} color={C.gold} />Maintenance</h1>
          <p style={S.subtitle}>All Properties · {requests.length} total requests</p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} style={btnPrimary}>
          <Icon name="refresh" size={14} /> {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div style={{ padding: '0.8rem 1rem', borderRadius: '3px', background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name="warning" size={16} color={C.redLight} />
          <p style={{ fontSize: '0.75rem', color: C.redLight, flex: 1 }}>{error}</p>
          <button onClick={() => fetchRequests()} style={{ fontSize: '0.72rem', color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono, fontWeight: 500 }}>Retry</button>
        </div>
      )}

      {/* TABLE CARD */}
      <div style={cardStyle}>
        {/* TOOLBAR */}
        <div style={S.toolbarInner}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={S.filterBtn(filter === f)}>
                {f}
              </button>
            ))}
          </div>
          <div style={S.searchWrap}>
            <Icon name="search" size={14} style={S.searchIcon} />
            <input type="text" placeholder="Search requests..." value={search} onChange={e => setSearch(e.target.value)} style={S.searchInput} />
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <div style={S.loading}>
            <span style={{ width: 20, height: 20, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            Loading requests...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["Request", "Tenant / Unit", "Property", "Priority", "Status", "Contractor", "Cost", "Reported", ""].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ ...S.td, textAlign: 'center', padding: '3rem 0', color: 'rgba(245,240,232,0.25)' }}>
                      No maintenance requests found.
                    </td>
                  </tr>
                )}
                {filtered.map(r => (
                  <tr key={r.id} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.muted}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    
                    {/* Request */}
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '6px',
                          background: 'rgba(58,143,212,0.1)', border: '1px solid rgba(58,143,212,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Icon name="wrench" size={14} color={C.blue} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ fontWeight: 600, color: C.white, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                            {r.title}
                          </p>
                          <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginTop: '1px' }}>
                            {r.request_number} · {r.category || "Maintenance"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Tenant / Unit */}
                    <td style={S.td}>
                      <p style={{ fontWeight: 500, color: C.white, fontSize: '0.78rem' }}>{r.tenant_name || "—"}</p>
                      <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>
                        {r.unit_number ? `Unit ${r.unit_number}` : "—"}
                      </p>
                    </td>

                    {/* Property */}
                    <td style={{ ...S.td, color: 'rgba(245,240,232,0.4)', fontSize: '0.75rem' }}>
                      {r.property_name}
                    </td>

                    {/* Priority */}
                    <td style={S.td}>
                      <PriorityBadge priority={r.priority} />
                    </td>

                    {/* Status */}
                    <td style={S.td}>
                      <StatusBadge status={r.status} />
                    </td>

                    {/* Contractor */}
                    <td style={{ ...S.td, fontSize: '0.75rem' }}>
                      {r.contractor_name ? (
                        <span style={{ color: 'rgba(245,240,232,0.4)' }}>{r.contractor_name}</span>
                      ) : (
                        <span style={{ color: 'rgba(245,240,232,0.15)', fontStyle: 'italic', fontFamily: F.mono, fontSize: '0.68rem' }}>Unassigned</span>
                      )}
                    </td>

                    {/* Cost */}
                    <td style={{ ...S.td, fontWeight: 600, fontSize: '0.78rem' }}>
                      {r.estimated_cost ? (
                        <span style={{ color: C.gold }}>{fmt(r.estimated_cost)}</span>
                      ) : r.actual_cost ? (
                        <span style={{ color: C.greenLight }}>{fmt(r.actual_cost)}</span>
                      ) : (
                        <span style={{ color: 'rgba(245,240,232,0.2)' }}>—</span>
                      )}
                    </td>

                    {/* Reported */}
                    <td style={{ ...S.td, fontSize: '0.7rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono }}>
                      {timeAgo(r.created_at)}
                    </td>

                    {/* Actions */}
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <button
                          onClick={() => navigate(`/landlord/maintenance/${r.id}`)}
                          style={{
                            fontSize: '0.7rem', fontWeight: 500, color: C.blue,
                            background: 'none', border: 'none', cursor: 'pointer',
                            fontFamily: F.mono, whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >
                          Review
                        </button>
                        {["completed", "cancelled"].includes(r.status) && (
                          <button
                            onClick={() => setReopenModal(r)}
                            style={{
                              fontSize: '0.7rem', fontWeight: 500, color: C.gold,
                              background: 'none', border: 'none', cursor: 'pointer',
                              fontFamily: F.mono, whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                          >
                            Reopen
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}
        <div style={S.footer}>
          <span>
            Showing <span style={{ color: C.white, fontWeight: 500 }}>{filtered.length}</span> of{" "}
            <span style={{ color: C.white, fontWeight: 500 }}>{requests.length}</span> requests
          </span>
        </div>
      </div>
    </div>
  );
}