/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import CaretakerComplaintStats from "./ComplaintStats";
import { FiChevronRight, FiSearch, FiRefreshCw } from "react-icons/fi";

const API = "http://localhost:4000";
const FONT =
  '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';
const PAGE_SIZE = 10;

const C = {
  background: "#f4f5f7",
  card: "#ffffff",
  border: "#e9ecef",
  primary: "#2c3e50",
  blue: "#3498db",
  green: "#2b7a4b",
  red: "#9e3a3a",
  purple: "#6f42c1",
};

const STATUS_MAP = {
  All: "All",
  Open: "open",
  "Under Review": "under_review",
  "Needs Clarification": "awaiting_clarification",
  Escalated: "escalated",
  Resolved: "resolved",
  Dismissed: "dismissed",
  Rejected: "rejected",
};

const statusConfig = {
  open: {
    color: "#9e3a3a",
    bg: "#fbeaea",
    border: "1px solid #e5bdbd",
    dot: "#9e3a3a",
    label: "Open",
  },
  under_review: {
    color: "#8b6e1a",
    bg: "#faf6ed",
    border: "1px solid #e5dbb8",
    dot: "#8b6e1a",
    label: "Under Review",
  },
  awaiting_clarification: {
    color: "#c25e1a",
    bg: "#fef9e7",
    border: "1px solid #f5c6cb",
    dot: "#c25e1a",
    label: "Needs Clarification",
  },
  approved: {
    color: "#2c6b9b",
    bg: "#e8f0f5",
    border: "1px solid #b0cfe0",
    dot: "#2c6b9b",
    label: "Approved",
  },
  resolved: {
    color: "#2b7a4b",
    bg: "#eef5e8",
    border: "1px solid #c5d9b8",
    dot: "#2b7a4b",
    label: "Resolved",
  },
  dismissed: {
    color: "#5a5a5a",
    bg: "#f2f2f2",
    border: "1px solid #d0d0d0",
    dot: "#6b6b6b",
    label: "Dismissed",
  },
  escalated: {
    color: "#54326b",
    bg: "#eee7f3",
    border: "1px solid #d1c2dc",
    dot: "#54326b",
    label: "Escalated",
  },
  rejected: {
    color: "#5a5a5a",
    bg: "#f2f2f2",
    border: "1px solid #d0d0d0",
    dot: "#6b6b6b",
    label: "Rejected",
  },
};

const SCOPE_LABELS = {
  specific_tenant: "Specific Unit",
  common_area: "Common Area",
  unknown: "Unknown",
  property_wide: "Property-Wide",
};

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

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatusBadge({ status }) {
  const cfg = statusConfig[status] ?? statusConfig["open"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        fontSize: "12px",
        fontWeight: 500,
        padding: "0.15rem 0.6rem",
        borderRadius: "12px",
        color: cfg.color,
        background: cfg.bg,
        border: cfg.border,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.dot,
        }}
      />
      {cfg.label}
    </span>
  );
}

function StatChip({ label, value, color, bg, border }) {
  return (
    <div
      style={{
        padding: "0.7rem 0.9rem",
        borderRadius: "3px",
        background: bg || "#f9fafb",
        border: `1px solid ${border || "#e9ecef"}`,
        textAlign: "center",
        flex: "1 1 100px",
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

export default function CaretakerComplaints() {
  useDocumentTitle("Complaints");
  const navigate = useNavigate();
  const toast = useToast();

  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const fetchComplaints = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/caretaker/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(response.data.complaints || []);
    } catch (err) {
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

  const filtered = complaints.filter((c) => {
    const actualStatus = STATUS_MAP[filter];
    const matchStatus = actualStatus === "All" || c.status === actualStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      [c.subject, c.filed_by_name, c.against_name, c.category].some((s) =>
        (s || "").toLowerCase().includes(q),
      );
    return matchStatus && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedComplaints = filtered.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [filter, search, pageSize]);

  const openCount = complaints.filter((c) =>
    ["open", "under_review", "awaiting_clarification"].includes(c.status),
  ).length;
  const underReviewCount = complaints.filter(
    (c) => c.status === "under_review",
  ).length;
  const awaitingClarificationCount = complaints.filter(
    (c) => c.status === "awaiting_clarification",
  ).length;
  const resolvedCount = complaints.filter(
    (c) => c.status === "resolved",
  ).length;
  const dismissedCount = complaints.filter(
    (c) => c.status === "dismissed",
  ).length;
  const rejectedCount = complaints.filter(
    (c) => c.status === "rejected",
  ).length;
  const totalCount = complaints.length;
  const escalatedCount = complaints.filter(
    (c) => c.status === "escalated",
  ).length;

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
  };

  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: "14px",
        fontWeight: 400,
        color: "#000",
        background: "#ffffff",
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
        <Link to="/caretaker/dashboard" className="rb-link">
          Dashboard
        </Link>
        <span style={{ color: "#555" }}>/</span>
        <span style={{ color: "#000" }}>Complaints</span>
      </div>
      <CaretakerComplaintStats />
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

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.6rem",
            padding: "0.85rem 1.1rem",
            background: "#f9fafb",
            borderBottom: "1px solid #dfe3e8",
          }}
        >
          <StatChip
            label="Total"
            value={totalCount}
            color="#2c3e50"
            bg="rgba(44,62,80,0.06)"
            border="rgba(44,62,80,0.15)"
          />
          <StatChip
            label="Open"
            value={openCount}
            color="#9e3a3a"
            bg="rgba(158,58,58,0.06)"
            border="rgba(158,58,58,0.15)"
          />
          <StatChip
            label="Under Review"
            value={underReviewCount}
            color="#8b6e1a"
            bg="rgba(139,110,26,0.06)"
            border="rgba(139,110,26,0.15)"
          />
          <StatChip
            label="Needs Clarification"
            value={awaitingClarificationCount}
            color="#c25e1a"
            bg="rgba(194,94,26,0.06)"
            border="rgba(194,94,26,0.15)"
          />
          <StatChip
            label="Escalated"
            value={escalatedCount}
            color="#54326b"
            bg="rgba(84,50,107,0.06)"
            border="rgba(84,50,107,0.15)"
          />
          <StatChip
            label="Resolved"
            value={resolvedCount}
            color="#2b7a4b"
            bg="rgba(43,122,75,0.06)"
            border="rgba(43,122,75,0.15)"
          />
          <StatChip
            label="Dismissed"
            value={dismissedCount}
            color="#5a5a5a"
            bg="rgba(0,0,0,0.04)"
            border="rgba(0,0,0,0.1)"
          />
          <StatChip
            label="Rejected"
            value={rejectedCount}
            color="#5a5a5a"
            bg="rgba(0,0,0,0.04)"
            border="rgba(0,0,0,0.1)"
          />
        </div>

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
              <FiRefreshCw size={14} />{" "}
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
                padding: "0.3rem 1.5rem 0.3rem 0.5rem",
                background: "#fdfdfd",
                color: "#000",
                fontFamily: FONT,
              }}
            >
              {Object.keys(STATUS_MAP).map((s) => (
                <option key={s} value={s}>
                  {s}
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
                padding: "0.3rem 1.5rem 0.3rem 0.5rem",
                background: "#fdfdfd",
                color: "#000",
                fontFamily: FONT,
                marginRight: "0.6rem",
              }}
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
          <div
            style={{ padding: "3rem 1rem", textAlign: "center", color: "#555" }}
          >
            <span
              style={{
                width: 20,
                height: 20,
                border: "2px solid rgba(44,62,80,0.1)",
                borderTopColor: "#2c3e50",
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
                display: "inline-block",
              }}
            />
            <span style={{ marginLeft: "0.5rem" }}>Loading complaints...</span>
          </div>
        ) : error ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
            <p style={{ color: "#c0392b" }}>{error}</p>
            <button
              onClick={fetchComplaints}
              style={{
                background: "none",
                border: "none",
                color: "#2471a3",
                cursor: "pointer",
                textDecoration: "underline",
                marginTop: "0.5rem",
              }}
            >
              Try again
            </button>
          </div>
        ) : paginatedComplaints.length === 0 ? (
          <div
            style={{ padding: "3rem 1rem", textAlign: "center", color: "#555" }}
          >
            <p>No complaints found.</p>
            <button
              onClick={() => {
                setFilter("All");
                setSearch("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#2471a3",
                cursor: "pointer",
                textDecoration: "underline",
                marginTop: "0.5rem",
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto", margin: "0 1.7rem 1.7rem 1.7rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}></th> {/* Complaint ID link */}
                  <th style={thStyle}>Complaint</th>
                  <th style={thStyle}>Filed By</th>
                  <th style={thStyle}>Against</th>
                  <th style={thStyle}>Scope</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Date</th>
                </tr>
              </thead>
              <tbody>
                {paginatedComplaints.map((c, index) => {
                  const complaintId = `CMP${String((currentPage - 1) * pageSize + index + 1).padStart(6, "0")}`;
                  return (
                    <tr
                      key={c.id}
                      className="rb-row"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/caretaker/complaints/${c.id}`)}
                    >
                      {/* Complaint ID */}
                      <td style={tdStyle}>
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#2471a3",
                            fontSize: "13px",
                          }}
                        >
                          {complaintId}
                        </span>
                      </td>

                      {/* Complaint subject */}
                      <td style={tdStyle}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: "#151515",
                            fontSize: "13px",
                          }}
                        >
                          {c.subject}
                        </div>
                      </td>

                      {/* Filed By */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>
                          {c.filed_by_name || "—"}
                        </div>
                      </td>

                      {/* Against */}
                      <td style={tdStyle}>
                        <div
                          style={{
                            fontWeight: 500,
                            color: c.against_name ? "#151515" : "#555",
                          }}
                        >
                          {c.against_name || "—"}
                        </div>
                      </td>

                      {/* Scope */}
                      <td style={tdStyle}>
                        <span style={{ fontSize: "11px", color: "#333" }}>
                          {SCOPE_LABELS[c.complaint_scope] || "—"}
                        </span>
                      </td>

                      {/* Category */}
                      <td
                        style={{
                          ...tdStyle,
                          textTransform: "capitalize",
                          fontSize: "11px",
                          color: "#333",
                        }}
                      >
                        {c.category?.replace(/_/g, " ") || "—"}
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
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with pagination */}
        {!loading && !error && paginatedComplaints.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0 1.7rem 1.7rem",
              marginTop: "-1.5rem",
              fontSize: "13px",
              color: "#333",
            }}
          >
            <span>
              Showing {startIndex + 1}-
              {Math.min(startIndex + pageSize, filtered.length)} of{" "}
              {filtered.length} complaints
            </span>
            {totalPages > 1 && (
              <div style={{ display: "flex", gap: "0.3rem" }}>
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (p) => (
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
                  ),
                )}
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
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
        )}
      </div>
    </div>
  );
}
