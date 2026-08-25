import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { Icon } from "../../../components/Icon";
import {
  FiChevronRight,
  FiSearch,
  FiRefreshCcw,
  FiChevronDown,
} from "react-icons/fi";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";
const PAGE_SIZE = 8;
const FONT =
  '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const STATUS_CONFIG = {
  open: {
    label: "Open",
    color: C.redLight,
    bg: "rgba(224,90,74,0.1)",
    border: "1px solid rgba(224,90,74,0.2)",
    dot: C.redLight,
  },
  under_review: {
    label: "Under Review",
    color: C.gold,
    bg: "rgba(232,160,18,0.08)",
    border: "1px solid rgba(232,160,18,0.2)",
    dot: C.gold,
  },
  awaiting_clarification: {
    label: "Needs Clarification",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.1)",
    border: "1px solid rgba(245,158,11,0.2)",
    dot: "#f59e0b",
  },
  approved: {
    label: "Approved",
    color: C.blue,
    bg: "rgba(58,143,212,0.1)",
    border: "1px solid rgba(58,143,212,0.2)",
    dot: C.blue,
  },
  resolved: {
    label: "Resolved",
    color: C.greenLight,
    bg: "rgba(26,122,74,0.1)",
    border: "1px solid rgba(76,186,122,0.2)",
    dot: C.greenLight,
  },
  dismissed: {
    label: "Dismissed",
    color: "rgba(245,240,232,0.4)",
    bg: "rgba(245,240,232,0.04)",
    border: "1px solid rgba(245,240,232,0.1)",
    dot: "rgba(245,240,232,0.3)",
  },
  escalated: {
    label: "Escalated",
    color: C.purple,
    bg: "rgba(139,92,246,0.1)",
    border: "1px solid rgba(139,92,246,0.2)",
    dot: C.purple,
  },
  rejected: {
    label: "Rejected",
    color: "rgba(245,240,232,0.4)",
    bg: "rgba(245,240,232,0.04)",
    border: "1px solid rgba(245,240,232,0.1)",
    dot: "rgba(245,240,232,0.3)",
  },
};

const FILTERS = [
  "All",
  "Open",
  "Under Review",
  "Escalated",
  "Approved",
  "Resolved",
  "Dismissed",
];
const SCOPE_LABELS = {
  specific_tenant: "Specific Unit",
  common_area: "Common Area",
  unknown: "Unknown",
  property_wide: "Property-Wide",
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["open"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        fontSize: "0.58rem",
        fontWeight: 700,
        padding: "0.12rem 0.45rem",
        borderRadius: "3px",
        fontFamily: F.mono,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: cfg.color,
        background: cfg.bg,
        border: cfg.border,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: cfg.dot,
        }}
      />
      {cfg.label}
    </span>
  );
}

function StatCard({ label, value, color, bg, border }) {
  return (
    <div
      style={{
        padding: "0.7rem 0.9rem",
        borderRadius: "3px",
        background: bg || "#f9fafb",
        border: `1px solid ${border || "#e9ecef"}`,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: "0.68rem",
          fontWeight: 600,
          color: "#555",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontFamily: FONT,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: "1.3rem",
          fontWeight: 700,
          color: color || "#000",
          marginTop: "2px",
        }}
      >
        {value}
      </div>
    </div>
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

const thStyle = {
  padding: "0.6rem 0.8rem",
  fontSize: "12px",
  fontWeight: 600,
  color: "#000",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  background: "#e9eced52",
  border: "1px solid #9a9d9e52",
  textAlign: "left",
  whiteSpace: "nowrap",
};
const tdStyle = {
  padding: "0.6rem 0.8rem",
  fontSize: "12px",
  color: "#151515",
  border: "1px solid #9a9d9e52",
  verticalAlign: "middle",
  fontWeight: 400,
  background: "#e9eced52",
};

export default function LandlordComplaints() {
  useDocumentTitle("Complaints");

  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [stats, setStats] = useState(null);

  const fetchComplaints = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/landlord/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(response.data.complaints || []);
      setStats(response.data.stats || null);
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

  const filtered = complaints
    .filter((c) => {
      if (filter === "All") return true;
      if (filter === "Open") return c.status === "open";
      if (filter === "Under Review") return c.status === "under_review";
      if (filter === "Escalated") return c.status === "escalated";
      if (filter === "Approved") return c.status === "approved";
      if (filter === "Resolved") return c.status === "resolved";
      if (filter === "Dismissed") return c.status === "dismissed";
      return true;
    })
    .filter((c) => {
      const q = search.toLowerCase();
      if (!q) return true;
      return [
        c.subject,
        c.filed_by_name,
        c.against_name,
        c.property_name,
        c.category,
      ].some((s) => (s || "").toLowerCase().includes(q));
    });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [filter, search, pageSize]);

  const outlineBtnStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    background: "#fdfdfd",
    color: "#000",
    border: "1px solid #ccc",
    padding: "0.3rem 0.6rem",
    fontSize: "14px",
    fontWeight: 400,
    cursor: "pointer",
    borderRadius: "2px",
    fontFamily: FONT,
  };

  return (
    <div
      style={{
        fontFamily: FONT,
        color: "#000",
        background: "#ffffff",
        fontSize: "14px",
        padding: "1rem",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .rb-link { color: #2471a3; text-decoration: none; font-size: 14px; }
        .rb-link:hover { text-decoration: underline; }
        .rb-row:hover { background: #fafbfc; }
      `}</style>

      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          marginBottom: "0.75rem",
          fontSize: "14px",
          fontWeight: 400,
          color: "#333",
          padding: "0.55rem 0.8rem",
          background: "#fdfdfd",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          border: "1px solid #e9ecef",
        }}
      >
        <FiChevronRight size={13} style={{ color: "#555" }} />
        <Link to="/landlord/dashboard" className="rb-link">
          Dashboard
        </Link>
        <span style={{ color: "#555" }}>/</span>
        <span style={{ color: "#000" }}>Complaints</span>
      </div>

      {/* Main card */}
      <div
        style={{
          background: "#fdfdfd",
          border: "1px solid #dfe3e8",
          borderRadius: "3px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          overflow: "hidden",
        }}
      >
        {/* Card header */}
        <div
          style={{
            background: "#f7f8fa",
            padding: "0.4rem 0 0.2rem 0.7rem",
            borderBottom: "3px solid #3498db",
          }}
        >
          <h4
            style={{
              fontSize: "16px",
              color: "#000",
              margin: 0,
              fontFamily: FONT,
              fontWeight: 500,
            }}
          >
            List of Complaints
          </h4>
        </div>

        {stats && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "0.6rem",
              padding: "0.85rem 1.1rem",
              background: "#f9fafb",
              borderBottom: "1px solid #dfe3e8",
            }}
          >
            <StatCard
              label="Open"
              value={stats.open || 0}
              color="#9e3a3a"
              bg="rgba(158,58,58,0.06)"
              border="rgba(158,58,58,0.15)"
            />
            <StatCard
              label="Under Review"
              value={stats.under_review || 0}
              color="#8b6e1a"
              bg="rgba(139,110,26,0.06)"
              border="rgba(139,110,26,0.15)"
            />
            <StatCard
              label="Escalated"
              value={stats.escalated || 0}
              color="#6f42c1"
              bg="rgba(111,66,193,0.06)"
              border="rgba(111,66,193,0.15)"
            />
            <StatCard
              label="Approved"
              value={stats.approved || 0}
              color="#2c6b9b"
              bg="rgba(44,107,155,0.06)"
              border="rgba(44,107,155,0.15)"
            />
            <StatCard
              label="Warnings"
              value={stats.warnings || 0}
              color="#8b6e1a"
              bg="rgba(139,110,26,0.06)"
              border="rgba(139,110,26,0.15)"
            />
            <StatCard
              label="Fines"
              value={stats.fines || 0}
              sub={
                stats.total_fines_amount
                  ? `R ${Number(stats.total_fines_amount).toLocaleString("en-ZA")}`
                  : null
              }
              color="#9e3a3a"
              bg="rgba(158,58,58,0.06)"
              border="rgba(158,58,58,0.15)"
            />
          </div>
        )}

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.85rem 1.1rem",
            gap: "1rem",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              marginLeft: "0.6rem",
            }}
          >
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={outlineBtnStyle}
            >
              <FiRefreshCcw size={14} />{" "}
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {/* Search */}
            <div style={{ position: "relative", width: "240px" }}>
              <FiSearch
                size={14}
                style={{
                  position: "absolute",
                  left: "0.6rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#555",
                }}
              />
              <input
                type="text"
                placeholder="Search complaints..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: "0.3rem 0.75rem 0.3rem 2rem",
                  fontSize: "14px",
                  border: "1px solid #d0d1d3",
                  borderRadius: "2px",
                  width: "240px",
                  fontFamily: FONT,
                  color: "#000",
                  outline: "none",
                }}
              />
            </div>

            {/* Filter dropdown */}
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                border: "1px solid #d0d1d3",
                borderRadius: "2px",
                fontSize: "14px",
                padding: "0.3rem 1.8rem 0.3rem 0.6rem",
                background: "#fdfdfd",
                color: "#000",
                fontFamily: FONT,
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
              }}
            >
              {FILTERS.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>

            {/* Page size */}
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              style={{
                border: "1px solid #d0d1d3",
                borderRadius: "2px",
                fontSize: "14px",
                padding: "0.3rem 1.8rem 0.3rem 0.6rem",
                background: "#fdfdfd",
                color: "#000",
                fontFamily: FONT,
                appearance: "none",
                WebkitAppearance: "none",
                MozAppearance: "none",
              }}
            >
              <option value={8}>8</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "0.8rem 1rem",
              borderRadius: "3px",
              background: "rgba(224,90,74,0.08)",
              border: "1px solid rgba(224,90,74,0.2)",
              margin: "0 1.7rem 1rem",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Icon name="warning" size={16} color={C.redLight} />
            <p
              style={{
                fontSize: "14px",
                color: C.redLight,
                flex: 1,
                margin: 0,
              }}
            >
              {error}
            </p>
            <button
              onClick={() => fetchComplaints()}
              style={{
                fontSize: "13px",
                color: "#2471a3",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        <div
          style={{
            border: "1px solid #9a9d9e52",
            overflow: "hidden",
            margin: "0 1.7rem 1.7rem",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={thStyle}></th> {/* Link column */}
                <th style={thStyle}>Complaint</th>
                <th style={thStyle}>Property / Tenant</th>
                <th style={thStyle}>Against</th>
                <th style={thStyle}>Scope</th>
                <th style={thStyle}>Status</th>
                <th style={thStyle}>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      padding: "2rem",
                      color: "#555",
                    }}
                  >
                    Loading complaints...
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      ...tdStyle,
                      textAlign: "center",
                      padding: "2rem",
                      color: "#555",
                    }}
                  >
                    No complaints found
                  </td>
                </tr>
              ) : (
                paginated.map((c, index) => {
                  const refNumber = `CMP${String((currentPage - 1) * pageSize + index + 1).padStart(6, "0")}`;
                  return (
                    <tr key={c.id} className="rb-row">
                      {/* Link column */}
                      <td style={tdStyle}>
                        <Link
                          to={`/landlord/complaints/${c.id}`}
                          style={{
                            fontWeight: 600,
                            color: "#2471a3",
                            textDecoration: "none",
                            fontSize: "13px",
                          }}
                        >
                          {refNumber}
                        </Link>
                      </td>
                      {/* Complaint subject */}
                      <td style={tdStyle}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                          }}
                        >
                          <div
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: "6px",
                              background:
                                c.status === "escalated"
                                  ? "rgba(139,92,246,0.1)"
                                  : "rgba(245,158,11,0.1)",
                              border:
                                c.status === "escalated"
                                  ? "1px solid rgba(139,92,246,0.15)"
                                  : "1px solid rgba(245,158,11,0.15)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                            }}
                          >
                            <Icon
                              name="message-square"
                              size={13}
                              color={
                                c.status === "escalated" ? C.purple : "#f59e0b"
                              }
                            />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <p
                              style={{
                                fontWeight: 600,
                                color: "#000",
                                fontSize: "13px",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                maxWidth: "200px",
                              }}
                            >
                              {c.subject}
                            </p>
                            <p
                              style={{
                                fontSize: "11px",
                                color: "#333",
                                marginTop: "1px",
                              }}
                            >
                              {(c.category || "").replace(/_/g, " ")}
                            </p>
                          </div>
                        </div>
                      </td>
                      {/* Property/Tenant combined */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500, color: "#151515" }}>
                          {c.property_name}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#333",
                            marginTop: "2px",
                          }}
                        >
                          {c.filed_by_name || "—"}
                        </div>
                      </td>
                      {/* Against */}
                      <td style={tdStyle}>
                        {c.against_name ? (
                          <div style={{ fontWeight: 500, color: "#151515" }}>
                            {c.against_name}
                          </div>
                        ) : (
                          <span
                            style={{
                              color: "#555",
                              fontStyle: "italic",
                              fontSize: "11px",
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>
                      {/* Scope */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            color: "#333",
                            fontSize: "11px",
                            fontFamily: F.mono,
                          }}
                        >
                          {SCOPE_LABELS[c.complaint_scope] || "—"}
                        </span>
                      </td>
                      {/* Status */}
                      <td style={tdStyle}>
                        <StatusBadge status={c.status} />
                      </td>
                      {/* Date */}
                      <td
                        style={{ ...tdStyle, fontSize: "11px", color: "#555" }}
                      >
                        {timeAgo(c.created_at)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Footer */}
          {!loading && paginated.length > 0 && (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.5rem 0.8rem",
                borderTop: "1px solid #9a9d9e52",
                background: "#e9eced52",
                fontSize: "13px",
                color: "#333",
              }}
            >
              <span>
                Showing {startIndex + 1}-
                {Math.min(startIndex + pageSize, filtered.length)} of{" "}
                {filtered.length} complaints
              </span>
              {filter !== "All" && (
                <button
                  onClick={() => setFilter("All")}
                  style={{
                    fontSize: "12px",
                    color: "#2471a3",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Clear filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: "0.3rem",
              padding: "0 1.7rem 1.7rem",
              marginTop: "-1.5rem",
            }}
          >
            <button
              disabled={currentPage <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              style={{
                padding: "0.2rem 0.5rem",
                border: "1px solid #d0d1d3",
                background: "#fdfdfd",
                color: "#000",
                cursor: "pointer",
                fontSize: "13px",
                borderRadius: "2px",
              }}
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                style={{
                  padding: "0.2rem 0.5rem",
                  border:
                    p === currentPage
                      ? "1px solid #2c3e50"
                      : "1px solid #d0d1d3",
                  background: p === currentPage ? "#2c3e50" : "#fdfdfd",
                  color: p === currentPage ? "#ffffff" : "#000",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: p === currentPage ? 600 : 400,
                  borderRadius: "2px",
                }}
              >
                {p}
              </button>
            ))}
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
              style={{
                padding: "0.2rem 0.5rem",
                border: "1px solid #d0d1d3",
                background: "#fdfdfd",
                color: "#000",
                cursor: "pointer",
                fontSize: "13px",
                borderRadius: "2px",
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
