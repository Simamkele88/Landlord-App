/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { FiSearch, FiChevronDown, FiRefreshCcw, FiChevronRight } from "react-icons/fi";

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const STATUS_CONFIG = {
  "needs_repair": { label: "Needs Repair", color: "#9e3a3a", bg: "#fbeaea", border: "1px solid #e5bdbd", dot: "#9e3a3a", icon: "alert-circle" },
  "assigned": { label: "Assigned", color: "#2c6b9b", bg: "#e8f0f5", border: "1px solid #b0cfe0", dot: "#2c6b9b", icon: "user-check" },
  "in_progress": { label: "In Progress", color: "#8b6e1a", bg: "#faf6ed", border: "1px solid #e5dbb8", dot: "#8b6e1a", icon: "clock" },
  "completed": { label: "Completed", color: "#2b7a4b", bg: "#eef5e8", border: "1px solid #c5d9b8", dot: "#2b7a4b", icon: "check-circle" },
  "closed": { label: "Closed", color: "#5a5a5a", bg: "#f2f2f2", border: "1px solid #d0d0d0", dot: "#6b6b6b", icon: "lock" },
  "cancelled": { label: "Cancelled", color: "#5a5a5a", bg: "#f2f2f2", border: "1px solid #d0d0d0", dot: "#6b6b6b", icon: "x-circle" },
  "pending_approval": { label: "Pending Approval", color: "#54326b", bg: "#eee7f3", border: "1px solid #d1c2dc", dot: "#54326b", icon: "clock" },
};

const PRIORITY_CONFIG = {
  "emergency": { bg: "#fbeaea", color: "#9e3a3a", label: "Emergency" },
  "urgent": { bg: "#fdf0f0", color: "#9e3a3a", label: "Urgent" },
  "high": { bg: "#fef9e7", color: "#c25e1a", label: "High" },
  "medium": { bg: "#e8f0f5", color: "#2c6b9b", label: "Medium" },
  "low": { bg: "#f5f5f5", color: "#5f6b7a", label: "Low" },
};


const FILTERS = [
  { label: "All", value: "all" },
  { label: "Pending Approval", value: "pending_approval" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
  { label: "Closed", value: "closed" },
];

const PAGE_SIZE = 8;

function fmt(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "0"; }
function timeAgo(dateStr) { if (!dateStr) return ""; const diff = (Date.now() - new Date(dateStr)) / 1000; if (diff < 60) return "Just now"; if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`; return `${Math.floor(diff / 86400)}d ago`; }

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["needs_repair"];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '12px', fontWeight: 500, padding: '0.15rem 0.6rem',
      borderRadius: '12px', color: cfg.color, background: cfg.bg, border: cfg.border,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG["low"];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '12px', fontWeight: 500, padding: '0.15rem 0.55rem',
      borderRadius: '12px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`,
    }}>
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, sub, color, bg, border }) {
  return (
    <div style={{
      padding: "0.8rem 1rem",
      borderRadius: "3px",
      background: bg || "#f9fafb",
      border: `1px solid ${border || "#e9ecef"}`,
      textAlign: "center",
    }}>
      <div style={{ fontSize: "0.68rem", fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: FONT }}>
        {label}
      </div>
      <div style={{ fontSize: "1.4rem", fontWeight: 700, color: color || "#000", fontFamily: FONT, marginTop: "2px" }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "0.6rem", color: "#888", marginTop: "2px", fontFamily: FONT }}>{sub}</div>}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  fontSize: '14px',
  padding: '0.4rem 0.7rem',
  borderRadius: '2px',
  background: '#fdfdfd',
  border: '1px solid #dee2e6',
  color: '#000',
  fontFamily: FONT,
  outline: 'none',
};

const btnPrimary = {
  background: '#2c3e50',
  color: '#ffffff',
  border: '1px solid #2c3e50',
  padding: '0.3rem 0.8rem',
  fontSize: '14px',
  fontWeight: 500,
  fontFamily: FONT,
  borderRadius: '2px',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.4rem',
};

const btnGhost = {
  background: '#fdfdfd',
  color: '#000',
  border: '1px solid #ccc',
  padding: '0.3rem 0.8rem',
  fontSize: '14px',
  fontWeight: 400,
  fontFamily: FONT,
  borderRadius: '2px',
  cursor: 'pointer',
};

const cardStyle = {
  background: '#fdfdfd',
  border: '1px solid #dfe3e8',
  borderRadius: '3px',
  overflow: 'hidden',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const modalOverlay = {
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '1rem',
  background: 'rgba(44,62,80,0.5)',
};

const thStyle = {
  padding: '0.6rem 0.8rem',
  fontSize: '12px',
  fontWeight: 600,
  color: '#000',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  background: '#e9eced52',
  border: '1px solid #9a9d9e52',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '0.6rem 0.8rem',
  fontSize: '12px',
  color: '#151515',
  border: '1px solid #9a9d9e52',
  verticalAlign: 'middle',
  fontWeight: 400,
  background: '#e9eced52',
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
      <div style={{ width: '100%', maxWidth: 420, background: '#fdfdfd', border: '1px solid #e9ecef', borderRadius: '3px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.2rem', borderBottom: '1px solid #e9ecef', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: '6px', background: '#faf6ed', border: '1px solid #e5dbb8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="refresh-cw" size={15} color="#8b6e1a" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#000' }}>Reopen Request</h3>
              <p style={{ fontSize: '12px', color: '#333' }}>{request.request_number} · {request.title}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#555' }}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div style={{ padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          {error && (
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: '2px', background: '#fbeaea', border: '1px solid #e5bdbd', fontSize: '13px', color: '#9e3a3a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icon name="alert-circle" size={12} /> {error}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.5rem 0.7rem', borderRadius: '2px', background: '#faf6ed', border: '1px solid #e5dbb8' }}>
            <Icon name="alert-triangle" size={13} color="#8b6e1a" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '13px', color: '#8b6e1a', lineHeight: 1.4 }}>This will reset the request to "Needs Repair". The caretaker will be notified.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>Reason <span style={{ color: '#9e3a3a' }}>*</span></label>
            <textarea rows={4} value={reason} onChange={e => { setReason(e.target.value); setError(""); }} placeholder="" style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '0.9rem 1.2rem 1.2rem', borderTop: '1px solid #e9ecef', flexShrink: 0 }}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1, justifyContent: 'center' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, padding: '0.4rem 1rem', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer', background: '#2c3e50', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderRadius: '2px' }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <><Icon name="refresh-cw" size={14} /> Reopen Request</>}
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
  const [stats, setStats] = useState({ total: 0, pending_approval: 0, in_progress: 0, completed: 0 });
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [reopenModal, setReopenModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRequests = filtered.slice(startIndex, startIndex + pageSize);

  useEffect(() => { setPage(1); }, [filter, search, pageSize]);

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

  const outlineBtnStyle = {
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    background: '#fdfdfd', color: '#000', border: '1px solid #ccc',
    padding: '0.3rem 0.6rem', fontSize: '14px', fontWeight: 400,
    cursor: 'pointer', borderRadius: '2px',
  };

  return (
    <div style={{ fontFamily: FONT, color: '#000', background: '#ffffff', fontSize: '14px', padding: '1rem' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .rb-link { color: #2471a3; text-decoration: none; font-size: 14px; }
        .rb-link:hover { text-decoration: underline; }
        .rb-row:hover { background: #fafbfc; }
      `}</style>

      {saving && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fdfdfd', border: '1px solid #e9ecef', borderRadius: '3px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <span style={{ width: 18, height: 18, border: '2px solid rgba(44,62,80,0.1)', borderTopColor: '#2c3e50', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#000' }}>Processing...</span>
          </div>
        </div>
      )}

      {reopenModal && <ReopenModal request={reopenModal} onClose={() => setReopenModal(null)} onReopen={handleReopen} />}

      {/* Breadcrumb */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem',
        fontSize: '14px', fontWeight: 400, color: '#333', padding: '0.55rem 0.8rem',
        background: '#fdfdfd', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', border: '1px solid #e9ecef',
      }}>
        <FiChevronRight size={13} style={{ color: '#555' }} />
        <Link to="/landlord/dashboard" className="rb-link">Dashboard</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>Maintenance</span>
      </div>

      {/* Main card */}
      <div style={cardStyle}>
        {/* Card header */}
        <div style={{
          background: '#f7f8fa', padding: '0.4rem 0 0.2rem 0.7rem', borderBottom: '3px solid #3498db',
        }}>
          <h4 style={{ fontSize: '16px', color: '#000', margin: 0, fontFamily: FONT, fontWeight: 500 }}>
            List of Maintenance Requests
          </h4>
        </div>

        {/* Summary cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "0.6rem",
          padding: "0.85rem 1.1rem",
          background: "#f9fafb",
          borderBottom: "1px solid #dfe3e8",
        }}>
          <StatCard label="Open" value={stats.total || 0} sub="active requests" color="#9e3a3a" bg="rgba(158,58,58,0.06)" border="rgba(158,58,58,0.15)" />
          <StatCard label="In Progress" value={stats.in_progress || 0} sub="being repaired" color="#8b6e1a" bg="rgba(139,110,26,0.06)" border="rgba(139,110,26,0.15)" />
          <StatCard label="Pending Approval" value={stats.pending_approval || 0} sub="awaiting landlord" color="#54326b" bg="rgba(84,50,107,0.06)" border="rgba(84,50,107,0.15)" />
          <StatCard label="Urgent Open" value={stats.urgent_open || 0} sub="urgent/emergency" color="#9e3a3a" bg="rgba(158,58,58,0.06)" border="rgba(158,58,58,0.15)" />
          <StatCard label="Completed this month" value={stats.completed_this_month || 0} sub={stats.avg_completion_days != null ? `avg ${stats.avg_completion_days}d` : "—"} color="#2b7a4b" bg="rgba(43,122,75,0.06)" border="rgba(43,122,75,0.15)" />
          <StatCard label="Cost this month" value={fmt(stats.cost_this_month)} sub="completed repairs" color="#2c3e50" bg="rgba(44,62,80,0.06)" border="rgba(44,62,80,0.15)" />
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.85rem 1.1rem', gap: '1rem', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '0.6rem' }}>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={outlineBtnStyle}
            >
              <FiRefreshCcw size={14} /> {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Search */}
            <div style={{ position: 'relative', width: '240px' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input
                type="text"
                placeholder="Search requests..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: '0.3rem 0.75rem 0.3rem 2rem',
                  fontSize: '14px',
                  border: '1px solid #d0d1d3',
                  borderRadius: '2px',
                  width: '240px',
                  fontFamily: FONT,
                  color: '#000',
                  outline: 'none',
                }}
              />
            </div>

            {/* Filter dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                style={{
                  border: '1px solid #d0d1d3',
                  borderRadius: '2px',
                  fontSize: '14px',
                  padding: '0.3rem 1.8rem 0.3rem 0.6rem',
                  background: '#fdfdfd',
                  color: '#000',
                  fontFamily: FONT,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                }}
              >
                {FILTERS.map(f => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
              <FiChevronDown size={14} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none' }} />
            </div>

            {/* Page size */}
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              style={{
                border: '1px solid #d0d1d3',
                borderRadius: '2px',
                fontSize: '14px',
                padding: '0.3rem 1.8rem 0.3rem 0.6rem',
                background: '#fdfdfd',
                color: '#000',
                fontFamily: FONT,
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
              }}
            >
              <option value={8}>8</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {stats.unassigned_urgent?.length > 0 && (
          <div style={{ margin: "0 1.7rem 1rem", padding: "0.8rem 1rem", background: "#fbeaea", border: "1px solid #e5bdbd", borderRadius: "3px" }}>
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#9e3a3a", margin: "0 0 0.4rem" }}>
              Unassigned urgent requests
            </p>
            {stats.unassigned_urgent.map(r => (
              <div key={r.id} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#333", padding: "0.2rem 0" }}>
                <span>{r.title} ({r.tenant_name})</span>
                <span>{r.unit_number} · {r.property_name}</span>
              </div>
            ))}
          </div>
        )}

        {error && (
          <div style={{ padding: '0.6rem 0.9rem', borderRadius: '2px', background: '#fbeaea', border: '1px solid #e5bdbd', margin: '0 1.7rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Icon name="alert-circle" size={14} color="#9e3a3a" />
            <p style={{ fontSize: '14px', color: '#9e3a3a', flex: 1, margin: 0 }}>{error}</p>
            <button onClick={() => fetchRequests()} style={{ fontSize: '13px', color: '#2471a3', background: 'none', border: 'none', cursor: 'pointer' }}>Retry</button>
          </div>
        )}

        {/* Table */}
        <div style={{ border: '1px solid #9a9d9e52', overflow: 'hidden', margin: '0 1.7rem 1.7rem' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}></th> {/* Ref link column */}
                <th style={thStyle}>Request</th>
                <th style={thStyle}>Tenant/Property</th>
                <th style={thStyle}>Priority</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Cost</th>
                <th style={thStyle}>Reported</th>
                <th style={thStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#555' }}>Loading requests...</td></tr>
              ) : paginatedRequests.length === 0 ? (
                <tr><td colSpan={9} style={{ ...tdStyle, textAlign: 'center', padding: '2rem', color: '#555' }}>No requests found</td></tr>
              ) : (
                paginatedRequests.map((r, index) => {
                  const isPending = r.status === "pending_approval";
                  const refNumber = r.request_number || `MNT${String((currentPage - 1) * pageSize + index + 1).padStart(6, "0")}`;
                  return (
                    <tr key={r.id} style={{ background: isPending ? 'rgba(84,50,107,0.03)' : 'transparent' }}>
                      {/* Ref link column */}
                      <td style={tdStyle}>
                        <Link
                          to={`/landlord/maintenance/${r.id}`}
                          style={{ fontWeight: 600, color: '#2471a3', textDecoration: 'none', fontSize: '13px' }}
                        >
                          {refNumber}
                        </Link>
                      </td>
                      {/* Request column */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 30, height: 30, borderRadius: '6px', background: isPending ? '#eee7f3' : '#e8f0f5', border: isPending ? '1px solid #d1c2dc' : '1px solid #b0cfe0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Icon name={isPending ? "clock" : "wrench"} size={13} color={isPending ? '#54326b' : '#2c6b9b'} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p style={{ fontWeight: 600, color: '#000', fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 160 }}>{r.title}</p>
                            <p style={{ fontSize: '11px', color: '#333', marginTop: 1 }}>{r.category || "—"}</p>
                          </div>
                        </div>
                      </td>
                      {/* Combined Tenant/Property column */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500, color: '#151515' }}>{r.tenant_name || "—"}</div>
                        <div style={{ fontSize: '11px', color: '#333', marginTop: '2px' }}>
                          {r.property_name || "—"}{r.unit_number ? ` • Unit ${r.unit_number}` : ""}
                        </div>
                      </td>
                      <td style={tdStyle}><PriorityBadge priority={r.priority} /></td>
                      <td style={tdStyle}><StatusBadge status={r.status} /></td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        {r.estimated_cost ? <span style={{ color: '#8b6e1a' }}>{fmt(r.estimated_cost)}</span> : r.actual_cost ? <span style={{ color: '#2b7a4b' }}>{fmt(r.actual_cost)}</span> : <span style={{ color: '#2b7a4b' }}>R 0</span>}
                      </td>
                      <td style={{ ...tdStyle, fontSize: '11px', color: '#555' }}>{timeAgo(r.created_at)}</td>
                      {/* Actions */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                          {["completed", "closed", "cancelled"].includes(r.status) && (
                            <button onClick={() => setReopenModal(r)} style={{ fontSize: '12px', fontWeight: 500, color: '#8b6e1a', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                              Reopen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Footer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0.8rem', borderTop: '1px solid #9a9d9e52', background: '#e9eced52', fontSize: '13px', color: '#333' }}>
            <span>Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} requests</span>
            {filter !== "all" && (
              <button onClick={() => setFilter("all")} style={{ fontSize: '12px', color: '#2471a3', background: 'none', border: 'none', cursor: 'pointer' }}>Clear filter</button>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0 1.7rem 1.7rem',
            marginTop: '-1.5rem',
          }}>
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
              style={{ padding: '0.2rem 0.5rem', border: '1px solid #d0d1d3', background: '#fdfdfd', color: '#000', cursor: 'pointer', fontSize: '13px', borderRadius: '2px' }}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: '0.2rem 0.5rem',
                  border: p === currentPage ? '1px solid #2c3e50' : '1px solid #d0d1d3',
                  background: p === currentPage ? '#2c3e50' : '#fdfdfd',
                  color: p === currentPage ? '#ffffff' : '#000',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: p === currentPage ? 600 : 400,
                  borderRadius: '2px',
                }}
              >
                {p}
              </button>
            ))}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
              style={{ padding: '0.2rem 0.5rem', border: '1px solid #d0d1d3', background: '#fdfdfd', color: '#000', cursor: 'pointer', fontSize: '13px', borderRadius: '2px' }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}