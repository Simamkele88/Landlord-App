import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { FiChevronRight, FiRefreshCw } from "react-icons/fi";

const API = "http://localhost:4000";
const FONT =
  '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

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

const CATEGORY_CONFIG = {
  plumbing: { label: "Plumbing", icon: "droplet", color: C.blue },
  electrical: { label: "Electrical", icon: "zap", color: C.gold },
  structural: { label: "Structural", icon: "home", color: C.purple },
  appliance: { label: "Appliance", icon: "tv", color: C.green },
  hvac: { label: "HVAC", icon: "wind", color: C.blue },
  painting: { label: "Painting", icon: "pen-tool", color: C.primary },
  cleaning: { label: "Cleaning", icon: "sparkles", color: C.green },
  pest_control: { label: "Pest Control", icon: "shield", color: C.red },
  other: { label: "Other", icon: "more-horizontal", color: SECONDARY_TEXT },
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

const cardStyle = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: "6px",
  padding: "1.5rem",
};

function fmtDate(d) {
  return d
    ? new Date(d).toLocaleDateString("en-ZA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
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

function CategoryTag({ category }) {
  const cfg = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        fontSize: "0.65rem",
        fontWeight: 600,
        padding: "0.2rem 0.55rem",
        borderRadius: "3px",
        fontFamily: F.mono,
        letterSpacing: "0.02em",
        color: cfg.color,
        background: `${cfg.color}10`,
        border: `1px solid ${cfg.color}25`,
      }}
    >
      <Icon name={cfg.icon} size={10} /> {cfg.label}
    </span>
  );
}

function SeverityBadge({ count }) {
  // 2 = watch, 3-4 = flagged, 5+ = critical — tune thresholds to taste
  let cfg;
  if (count >= 5)
    cfg = {
      label: "Critical",
      color: C.red,
      bg: "rgba(158,58,58,0.08)",
      border: "1px solid rgba(158,58,58,0.15)",
    };
  else if (count >= 3)
    cfg = {
      label: "Flagged",
      color: C.gold,
      bg: "rgba(217,158,11,0.08)",
      border: "1px solid rgba(217,158,11,0.15)",
    };
  else
    cfg = {
      label: "Watch",
      color: C.blue,
      bg: "rgba(52,152,219,0.08)",
      border: "1px solid rgba(52,152,219,0.15)",
    };

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        fontSize: "0.65rem",
        fontWeight: 600,
        padding: "0.2rem 0.55rem",
        borderRadius: "12px",
        color: cfg.color,
        background: cfg.bg,
        border: cfg.border,
      }}
    >
      {cfg.label}
    </span>
  );
}

export default function CaretakerRecurringIssues() {
  useDocumentTitle("Recurring Issues");
  const navigate = useNavigate();
  const toast = useToast();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [minCount, setMinCount] = useState(2);

  const fetchRecurring = useCallback(
    async (isRefresh = false) => {
      if (!isRefresh) setLoading(true);
      setError("");
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${API}/caretaker/maintenance/recurring`,
          {
            params: { minCount },
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setRows(response.data.rows || response.data || []);
      } catch (err) {
        setError(err.response?.data?.error || "Unable to connect to server");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [minCount],
  );

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

  function handleRefresh() {
    setRefreshing(true);
    fetchRecurring(true);
  }

  function goToFilteredList(row) {
    navigate(
      `/caretaker/maintenance?property=${row.property_id}&category=${row.category}`,
    );
  }

  const propertiesFlagged = new Set(rows.map((r) => r.property_id)).size;
  const criticalCount = rows.filter((r) => r.report_count >= 5).length;
  const topCategory = rows.length
    ? Object.entries(
        rows.reduce((acc, r) => {
          acc[r.category] = (acc[r.category] || 0) + r.report_count;
          return acc;
        }, {}),
      ).sort((a, b) => b[1] - a[1])[0][0]
    : "—";

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
        <Link to="/caretaker/maintenance" className="rb-link">
          Maintenance
        </Link>
        <span style={{ color: "#555" }}>/</span>
        <span style={{ color: "#000" }}>Recurring Issues</span>
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
            Recurring Maintenance Issues
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
            label="Properties Flagged"
            value={propertiesFlagged}
            color="#2c3e50"
            bg="rgba(44,62,80,0.06)"
            border="rgba(44,62,80,0.15)"
          />
          <StatChip
            label="Recurring Groups"
            value={rows.length}
            color="#8b6e1a"
            bg="rgba(139,110,26,0.06)"
            border="rgba(139,110,26,0.15)"
          />
          <StatChip
            label="Critical (5+)"
            value={criticalCount}
            color="#9e3a3a"
            bg="rgba(158,58,58,0.06)"
            border="rgba(158,58,58,0.15)"
          />
          <StatChip
            label="Top Category"
            value={CATEGORY_CONFIG[topCategory]?.label || "—"}
            color="#2c6b9b"
            bg="rgba(52,152,219,0.06)"
            border="rgba(52,152,219,0.15)"
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
            <label
              style={{ fontSize: "12px", color: "#333", fontFamily: FONT }}
            >
              Min. reports
            </label>
            <select
              value={minCount}
              onChange={(e) => setMinCount(Number(e.target.value))}
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
              <option value={2}>2+</option>
              <option value={3}>3+</option>
              <option value={5}>5+</option>
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
            <span style={{ marginLeft: "0.5rem" }}>
              Loading recurring issues...
            </span>
          </div>
        ) : error ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
            <p style={{ color: "#c0392b" }}>{error}</p>
            <button
              onClick={fetchRecurring}
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
        ) : rows.length === 0 ? (
          <div
            style={{ padding: "3rem 1rem", textAlign: "center", color: "#555" }}
          >
            <p>No recurring issues at this threshold.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", margin: "0 1.7rem 1.7rem 1.7rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Property</th>
                  <th style={thStyle}>Category</th>
                  <th style={thStyle}>Reports</th>
                  <th style={thStyle}>Distinct Tenants</th>
                  <th style={thStyle}>Severity</th>
                  <th style={thStyle}>First Reported</th>
                  <th style={thStyle}>Last Reported</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, index) => (
                  <tr
                    key={`${r.property_id}-${r.category}-${index}`}
                    className="rb-row"
                    style={{ cursor: "pointer" }}
                    onClick={() => goToFilteredList(r)}
                  >
                    <td style={tdStyle}>
                      <span
                        style={{
                          fontWeight: 600,
                          color: "#151515",
                          fontSize: "13px",
                        }}
                      >
                        {r.property_name ||
                          r.address ||
                          `Property #${r.property_id}`}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <CategoryTag category={r.category} />
                    </td>
                    <td style={{ ...tdStyle, fontWeight: 700 }}>
                      {r.report_count}
                    </td>
                    <td style={tdStyle}>{r.distinct_tenants ?? "—"}</td>
                    <td style={tdStyle}>
                      <SeverityBadge count={r.report_count} />
                    </td>
                    <td style={{ ...tdStyle, fontSize: "11px", color: "#555" }}>
                      {fmtDate(r.first_reported)}
                    </td>
                    <td style={{ ...tdStyle, fontSize: "11px", color: "#555" }}>
                      {fmtDate(r.last_reported)}
                    </td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          goToFilteredList(r);
                        }}
                        style={{
                          fontSize: "12px",
                          fontWeight: 500,
                          color: "#2c6b9b",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.textDecoration = "underline")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.textDecoration = "none")
                        }
                      >
                        View Requests
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
