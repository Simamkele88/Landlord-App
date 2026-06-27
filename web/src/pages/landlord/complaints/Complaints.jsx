// LANDLORD COMPLAINTS PAGE 
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

const STATUS_CONFIG = {
  "open":                   { label: "Open",               color: C.redLight,   bg: 'rgba(224,90,74,0.1)',    border: '1px solid rgba(224,90,74,0.2)',   dot: C.redLight   },
  "under_review":           { label: "Under Review",       color: C.gold,       bg: 'rgba(232,160,18,0.08)',   border: '1px solid rgba(232,160,18,0.2)',   dot: C.gold       },
  "awaiting_clarification": { label: "Needs Clarification",color: '#f59e0b',    bg: 'rgba(245,158,11,0.1)',    border: '1px solid rgba(245,158,11,0.2)',   dot: '#f59e0b'    },
  "approved":               { label: "Approved",           color: C.blue,       bg: 'rgba(58,143,212,0.1)',    border: '1px solid rgba(58,143,212,0.2)',   dot: C.blue       },
  "resolved":               { label: "Resolved",           color: C.greenLight, bg: 'rgba(26,122,74,0.1)',    border: '1px solid rgba(76,186,122,0.2)',   dot: C.greenLight },
  "dismissed":              { label: "Dismissed",          color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)', dot: 'rgba(245,240,232,0.3)' },
  "escalated":              { label: "Escalated",          color: C.purple,     bg: 'rgba(139,92,246,0.1)',    border: '1px solid rgba(139,92,246,0.2)',   dot: C.purple     },
  "rejected":               { label: "Rejected",           color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)', dot: 'rgba(245,240,232,0.3)' },
};

const FILTERS = ["All", "Open", "Under Review", "Escalated", "Resolved", "Dismissed"];

const SCOPE_LABELS = {
  specific_tenant: "Specific Unit",
  common_area: "Common Area",
  unknown: "Unknown",
  property_wide: "Property-Wide",
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["open"];
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

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}


export default function LandlordComplaints() {
  useDocumentTitle("Complaints");
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchComplaints = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/landlord/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(response.data.complaints || []);
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
      setError(err.response?.data?.error || "Unable to connect to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  function handleRefresh() {
    setRefreshing(true);
    fetchComplaints(true);
  }

  const filtered = complaints.filter(c => {
    if (filter === "All") return true;
    if (filter === "Open") return c.status === "open";
    if (filter === "Under Review") return c.status === "under_review";
    if (filter === "Escalated") return c.status === "escalated";
    if (filter === "Resolved") return c.status === "resolved";
    if (filter === "Dismissed") return c.status === "dismissed";
    return true;
  }).filter(c => {
    const q = search.toLowerCase();
    if (!q) return true;
    return [c.subject, c.filed_by_name, c.against_name, c.property_name, c.category]
      .some(s => (s || "").toLowerCase().includes(q));
  });

  const escalatedCount = complaints.filter(c => c.status === "escalated").length;
  const openCount = complaints.filter(c => ["open", "under_review"].includes(c.status)).length;

  
  const btnPrimary = {
    background: C.gold, color: C.black, border: 'none',
    padding: '0.6rem 1.4rem', fontSize: '0.76rem', fontWeight: 700,
    fontFamily: F.dm, letterSpacing: '0.04em', borderRadius: '3px',
    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
  };

  const cardStyle = {
    background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden',
  };

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
        input:focus, select:focus { border-color: ${C.borderFocus} !important; }
      `}</style>

      {/* HEADER */}
      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}><Icon name="message-square" size={24} color={C.gold} />Complaints</h1>
          <p style={S.subtitle}>
            All Properties · {complaints.length} total · {escalatedCount} escalated · {openCount} active
          </p>
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
          <button onClick={() => fetchComplaints()} style={{ fontSize: '0.72rem', color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono, fontWeight: 500 }}>Retry</button>
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
            <input type="text" placeholder="Search complaints..." value={search}
              onChange={e => setSearch(e.target.value)} style={S.searchInput} />
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <div style={S.loading}>
            <span style={{ width: 20, height: 20, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            Loading complaints...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["Complaint", "Property", "Filed By", "Scope", "Status", "Date", ""].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: '3rem 0', color: 'rgba(245,240,232,0.25)' }}>
                      No complaints found.
                    </td>
                  </tr>
                )}
                {filtered.map(c => (
                  <tr key={c.id} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.muted}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '6px',
                          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                          <Icon name="message-square" size={14} color="#f59e0b" />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{
                            fontWeight: 600, color: C.white, fontSize: '0.8rem',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px',
                          }}>
                            {c.subject}
                          </p>
                          {c.category && (
                            <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginTop: '1px' }}>
                              {c.category}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ ...S.td, color: 'rgba(245,240,232,0.4)', fontSize: '0.75rem' }}>{c.property_name}</td>
                    <td style={{ ...S.td, fontWeight: 500, color: C.white }}>{c.filed_by_name}</td>
                    <td style={{ ...S.td, color: 'rgba(245,240,232,0.3)', fontSize: '0.68rem', fontFamily: F.mono }}>
                      {SCOPE_LABELS[c.complaint_scope] || "—"}
                    </td>
                    <td style={S.td}><StatusBadge status={c.status} /></td>
                    <td style={{ ...S.td, fontSize: '0.7rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono }}>
                      {timeAgo(c.created_at)}
                    </td>
                    <td style={S.td}>
                      <button
                        onClick={() => navigate(`/landlord/complaints/${c.id}`)}
                        style={{
                          fontSize: '0.7rem', fontWeight: 500, color: C.blue,
                          background: 'none', border: 'none', cursor: 'pointer',
                          fontFamily: F.mono, whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                      >
                        View
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
          <span>
            Showing <span style={{ color: C.white, fontWeight: 500 }}>{filtered.length}</span> of{" "}
            <span style={{ color: C.white, fontWeight: 500 }}>{complaints.length}</span> complaints
          </span>
        </div>
      </div>
    </div>
  );
}