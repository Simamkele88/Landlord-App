/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import {
  FiChevronRight, FiSearch, FiRefreshCw
} from "react-icons/fi";

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';
const PAGE_SIZE = 10;

const STATUS_MAP = {
  "All": "All",
  "Needs Repair": "needs_repair",
  "Assigned": "assigned",
  "In Progress": "in_progress",
  "Completed": "completed",
  "Closed": "closed",
  "Cancelled": "cancelled",
  "Pending Approval": "pending_approval",
};

const statusConfig = {
  "needs_repair":     { color: "#9e3a3a", bg: "#fbeaea", border: "1px solid #e5bdbd", dot: "#9e3a3a", label: "Needs Repair" },
  "assigned":         { color: "#2c6b9b", bg: "#e8f0f5", border: "1px solid #b0cfe0", dot: "#2c6b9b", label: "Assigned" },
  "in_progress":      { color: "#8b6e1a", bg: "#faf6ed", border: "1px solid #e5dbb8", dot: "#8b6e1a", label: "In Progress" },
  "completed":        { color: "#2b7a4b", bg: "#eef5e8", border: "1px solid #c5d9b8", dot: "#2b7a4b", label: "Completed" },
  "closed":           { color: "#5a5a5a", bg: "#f2f2f2", border: "1px solid #d0d0d0", dot: "#6b6b6b", label: "Closed" },
  "cancelled":        { color: "#5a5a5a", bg: "#f2f2f2", border: "1px solid #d0d0d0", dot: "#6b6b6b", label: "Cancelled" },
  "pending_approval": { color: "#54326b", bg: "#eee7f3", border: "1px solid #d1c2dc", dot: "#54326b", label: "Pending Approval" },
};

const priorityConfig = {
  "emergency": { bg: "#9e3a3a", color: "#ffffff" },
  "urgent":    { bg: "#fbeaea", color: "#9e3a3a" },
  "high":      { bg: "#faf6ed", color: "#8b6e1a" },
  "medium":    { bg: "#e8f0f5", color: "#2c6b9b" },
  "low":       { bg: "#f5f5f5", color: "#555555" },
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
  const cfg = statusConfig[status] ?? statusConfig["needs_repair"];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '12px', fontWeight: 500, padding: '0.15rem 0.6rem',
      borderRadius: '12px', color: cfg.color, background: cfg.bg, border: cfg.border,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = priorityConfig[priority] ?? priorityConfig["low"];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '12px', fontWeight: 500, padding: '0.15rem 0.55rem',
      borderRadius: '12px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`,
    }}>
      {priority}
    </span>
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
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

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

  function handleRefresh() {
    setRefreshing(true);
    fetchRequests(true);
  }

  function filterMatch(request) {
    if (filter === "All") return true;
    const actualStatus = STATUS_MAP[filter];
    return request.status === actualStatus;
  }

  const filtered = requests.filter(r => {
    const statusMatch = filterMatch(r);
    const q = search.toLowerCase();
    const searchMatch = !q || [r.title, r.tenant_name, r.unit_number?.toString(), r.property_name, r.request_number, r.category, r.worker_name]
      .some(s => (s || "").toLowerCase().includes(q));
    return statusMatch && searchMatch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRequests = filtered.slice(startIndex, startIndex + pageSize);

  useEffect(() => { setPage(1); }, [filter, search, pageSize]);

  const needsAction = requests.filter(r => r.status === "needs_repair").length;
  const inProgress = requests.filter(r => ["assigned", "in_progress"].includes(r.status)).length;
  const escalatedCount = requests.filter(r => r.escalated).length;
  const propertyName = requests[0]?.property_name || "Your Property";

  const outlineBtnStyle = {
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    background: '#fdfdfd', color: '#000', border: '1px solid #ccc',
    padding: '0.3rem 0.6rem', fontSize: '14px', fontWeight: 400,
    cursor: 'pointer', borderRadius: '2px',
  };

  return (
    <div style={{ fontFamily: FONT, fontSize: '14px', fontWeight: 400, color: '#000', background: '#ffffff' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .rb-link { color: #2471a3; text-decoration: none; font-size: 14px; }
        .rb-link:hover { text-decoration: underline; }
        .rb-row:hover { background: #fafbfc; }
      `}</style>

      {/* Breadcrumb */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem',
        fontSize: '14px', fontWeight: 400, color: '#333', padding: '0.55rem 0.8rem',
        background: '#fdfdfd', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', border: '1px solid #e9ecef',
      }}>
        <FiChevronRight size={13} style={{ color: '#555' }} />
        <Link to="/caretaker/dashboard" className="rb-link">Dashboard</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>Maintenance</span>
      </div>

      {/* Main card */}
      <div style={{
        background: '#fdfdfd', border: '1px solid #dfe3e8', borderRadius: '3px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{
          background: '#f7f8fa', padding: '0.4rem 0 0.2rem 0.7rem', borderBottom: '3px solid #3498db',
        }}>
          <h4 style={{ fontSize: '16px', color: '#000', margin: 0, fontFamily: FONT, fontWeight: 500 }}>
            List of Maintenance Requests
          </h4>
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
              <FiRefreshCw size={14} /> {refreshing ? "Refreshing..." : "Refresh"}
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
                  padding: '0.3rem 0.75rem 0.3rem 2rem', fontSize: '14px',
                  border: '1px solid #d0d1d3', borderRadius: '2px', width: '240px',
                  fontFamily: FONT, color: '#000', outline: 'none',
                }}
              />
            </div>

            {/* Filter dropdown */}
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.3rem 1.5rem 0.3rem 0.5rem', background: '#fdfdfd', color: '#000', fontFamily: FONT }}
            >
              {Object.keys(STATUS_MAP).map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Page size */}
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              style={{ border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.3rem 1.5rem 0.3rem 0.5rem', background: '#fdfdfd', color: '#000', fontFamily: FONT, marginRight: '0.6rem' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#555' }}>
            <span style={{ width: 20, height: 20, border: '2px solid rgba(44,62,80,0.1)', borderTopColor: '#2c3e50', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
            <span style={{ marginLeft: '0.5rem' }}>Loading requests...</span>
          </div>
        ) : error ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <p style={{ color: '#c0392b' }}>{error}</p>
            <button onClick={fetchRequests} style={{ background: 'none', border: 'none', color: '#2471a3', cursor: 'pointer', textDecoration: 'underline', marginTop: '0.5rem' }}>
              Try again
            </button>
          </div>
        ) : paginatedRequests.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#555' }}>
            <p>No maintenance requests found.</p>
            <button onClick={() => { setFilter("All"); setSearch(""); }} style={{ background: 'none', border: 'none', color: '#2471a3', cursor: 'pointer', marginTop: '0.5rem' }}>
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', margin: '0 1.7rem 1.7rem 1.7rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}></th> {/* Request ID link */}
                  <th style={thStyle}>Request</th>
                  <th style={thStyle}>Tenant / Unit</th>
                  <th style={thStyle}>Priority</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Worker</th>
                  <th style={thStyle}>Cost</th>
                  <th style={thStyle}>Reported</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedRequests.map((r, index) => {
                  const requestId = `MNT${String((currentPage - 1) * pageSize + index + 1).padStart(6, "0")}`;
                  return (
                    <tr
                      key={r.id}
                      className="rb-row"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/caretaker/maintenance/${r.id}`)}
                    >
                      {/* Request ID */}
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: '#2471a3', fontSize: '13px' }}>
                          {requestId}
                        </span>
                      </td>

                      {/* Request Title + category */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: '#151515', fontSize: '13px' }}>
                          {r.title}
                        </div>
                        <div style={{ fontSize: '11px', color: '#333', marginTop: '2px' }}>
                          {r.request_number} · {(r.category || "").replace(/_/g, " ")}
                        </div>
                      </td>

                      {/* Tenant/Unit */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>{r.tenant_name || "—"}</div>
                        <div style={{ fontSize: '11px', color: '#333', marginTop: '2px' }}>
                          {r.unit_number ? `Unit ${r.unit_number}` : "—"}
                        </div>
                      </td>

                      {/* Priority */}
                      <td style={tdStyle}><PriorityBadge priority={r.priority} /></td>

                      {/* Status */}
                      <td style={tdStyle}><StatusBadge status={r.status} /></td>

                      {/* Worker */}
                      <td style={tdStyle}>
                        {r.worker_name || r.contractor_name ? (
                          <span style={{ color: '#151515' }}>{r.worker_name || r.contractor_name}</span>
                        ) : (
                          <span style={{ color: '#555', fontStyle: 'italic', fontSize: '11px' }}>Unassigned</span>
                        )}
                      </td>

                      {/* Cost */}
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        {r.estimated_cost ? (
                          <span style={{ color: '#8b6e1a' }}>{fmt(r.estimated_cost)}</span>
                        ) : r.actual_cost ? (
                          <span style={{ color: '#2b7a4b' }}>{fmt(r.actual_cost)}</span>
                        ) : (
                          <span style={{ color: '#555' }}>—</span>
                        )}
                      </td>

                      {/* Reported */}
                      <td style={{ ...tdStyle, fontSize: '11px', color: '#555' }}>
                        {timeAgo(r.created_at)}
                      </td>

                      {/* Actions */}
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/caretaker/maintenance/${r.id}`);
                          }}
                          style={{
                            fontSize: '12px', fontWeight: 500, color: '#2c6b9b',
                            background: 'none', border: 'none', cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with pagination */}
        {!loading && !error && paginatedRequests.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0 1.7rem 1.7rem', marginTop: '-1.5rem', fontSize: '13px', color: '#333',
          }}>
            <span>
              Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} requests
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '0.3rem' }}>
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
        )}
      </div>
    </div>
  );
}