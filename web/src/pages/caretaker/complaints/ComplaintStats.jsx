import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FiUsers,
  FiAlertTriangle,
  FiFlag,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";

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

function RankedTable({
  title,
  icon: TitleIcon,
  rows,
  countKey,
  countLabel,
  secondaryKey,
  secondaryLabel,
  onSelectTenant,
  selectedTenantId,
  accentColor,
}) {
  return (
    <div
      style={{
        background: "#fdfdfd",
        border: "1px solid #dfe3e8",
        borderRadius: "3px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        overflow: "hidden",
        flex: "1 1 320px",
        minWidth: 320,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "#f7f8fa",
          padding: "0.55rem 0.9rem",
          borderBottom: `3px solid ${accentColor}`,
        }}
      >
        <TitleIcon size={14} color={accentColor} />
        <h4
          style={{
            fontSize: "14px",
            color: "#000",
            margin: 0,
            fontFamily: FONT,
            fontWeight: 600,
          }}
        >
          {title}
        </h4>
      </div>

      {rows.length === 0 ? (
        <div
          style={{
            padding: "1.5rem",
            textAlign: "center",
            color: "#555",
            fontSize: "13px",
          }}
        >
          No data yet
        </div>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>Tenant</th>
              <th style={thStyle}>{countLabel}</th>
              <th style={thStyle}>{secondaryLabel}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSelected =
                String(selectedTenantId) === String(row.tenant_id);
              return (
                <tr
                  key={row.tenant_id}
                  onClick={() => onSelectTenant(row.tenant_id)}
                  style={{
                    cursor: "pointer",
                    background: isSelected
                      ? "rgba(52,152,219,0.08)"
                      : undefined,
                  }}
                >
                  <td style={tdStyle}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                      }}
                    >
                      <span style={{ fontWeight: 600, color: "#000" }}>
                        {row.full_name}
                      </span>
                      {row.unit_number && (
                        <span style={{ fontSize: "11px", color: "#555" }}>
                          Unit {row.unit_number}
                        </span>
                      )}
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <span style={{ fontWeight: 700, color: accentColor }}>
                      {row[countKey]}
                    </span>
                  </td>
                  <td style={{ ...tdStyle, fontSize: "11px", color: "#333" }}>
                    {row[secondaryKey]}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function StatBlock({ label, value, color }) {
  return (
    <div
      style={{
        padding: "0.6rem 0.7rem",
        borderRadius: "3px",
        background: "#f9fafb",
        border: "1px solid #e9ecef",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "1.15rem", fontWeight: 700, color }}>
        {value ?? 0}
      </div>
      <div
        style={{
          fontSize: "10.5px",
          color: "#555",
          marginTop: "2px",
          lineHeight: 1.3,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function TenantStatDetail({ tenantId, stats, loading }) {
  if (!tenantId) return null;

  return (
    <div
      style={{
        background: "#fdfdfd",
        border: "1px solid #dfe3e8",
        borderRadius: "3px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        padding: "0.9rem 1.1rem",
        marginTop: "0.8rem",
      }}
    >
      <h5
        style={{
          fontSize: "13px",
          fontWeight: 600,
          color: "#000",
          margin: "0 0 0.7rem",
          fontFamily: FONT,
        }}
      >
        Complaint history for this tenant
      </h5>
      {loading || !stats ? (
        <p style={{ fontSize: "13px", color: "#555" }}>Loading...</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: "0.6rem",
          }}
        >
          <StatBlock
            label="Complained about"
            value={stats.times_complained_about}
            color={C.red}
          />
          <StatBlock
            label="Filed by them"
            value={stats.times_filed}
            color={C.blue}
          />
          <StatBlock
            label="Distinct people they've filed against"
            value={stats.distinct_people_filed_against}
            color={C.purple}
          />
          <StatBlock
            label="Distinct people who've complained about them"
            value={stats.distinct_people_complained_by}
            color="#8b6e1a"
          />
        </div>
      )}
    </div>
  );
}

export default function CaretakerComplaintStats() {
  const [data, setData] = useState({
    most_complained_about: [],
    most_active_filers: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [tenantStats, setTenantStats] = useState(null);
  const [tenantLoading, setTenantLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`${API}/caretaker/complaints/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData({
        most_complained_about: res.data.most_complained_about || [],
        most_active_filers: res.data.most_active_filers || [],
      });
    } catch (err) {
      setError(err.response?.data?.error || "Unable to load complaint stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  async function handleSelectTenant(tenantId) {
    if (String(selectedTenantId) === String(tenantId)) {
      setSelectedTenantId(null);
      setTenantStats(null);
      return;
    }
    setSelectedTenantId(tenantId);
    setTenantLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        `${API}/caretaker/complaints/stats/${tenantId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setTenantStats(res.data.stats);
    } catch (err) {
      setTenantStats(null);
    } finally {
      setTenantLoading(false);
    }
  }

  return (
    <div
      style={{
        fontFamily: FONT,
        fontSize: "14px",
        color: "#000",
        marginBottom: "0.75rem",
      }}
    >
      <div
        onClick={() => setCollapsed((c) => !c)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          padding: "0.55rem 0.8rem",
          background: "#fdfdfd",
          border: "1px solid #e9ecef",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
          borderRadius: collapsed ? "3px" : "3px 3px 0 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <FiUsers size={14} color={C.blue} />
          <span style={{ fontSize: "14px", fontWeight: 600 }}>
            Repeat Complaint Activity
          </span>
        </div>
        {collapsed ? <FiChevronDown size={14} /> : <FiChevronUp size={14} />}
      </div>

      {!collapsed && (
        <div
          style={{
            padding: "0.8rem",
            background: "#f9fafb",
            border: "1px solid #e9ecef",
            borderTop: "none",
            borderRadius: "0 0 3px 3px",
          }}
        >
          {error && (
            <div
              style={{
                padding: "0.7rem 0.9rem",
                borderRadius: "3px",
                marginBottom: "0.7rem",
                background: "#fbeaea",
                border: "1px solid #e5bdbd",
                color: C.red,
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}

          {loading ? (
            <div
              style={{ padding: "1.5rem", textAlign: "center", color: "#555" }}
            >
              Loading stats...
            </div>
          ) : (
            <div style={{ display: "flex", gap: "0.9rem", flexWrap: "wrap" }}>
              <RankedTable
                title="Most complained about"
                icon={FiAlertTriangle}
                rows={data.most_complained_about}
                countKey="complaint_count"
                countLabel="Complaints"
                secondaryKey="distinct_filers"
                secondaryLabel="Distinct filers"
                onSelectTenant={handleSelectTenant}
                selectedTenantId={selectedTenantId}
                accentColor={C.red}
              />
              <RankedTable
                title="Most active filers"
                icon={FiFlag}
                rows={data.most_active_filers}
                countKey="filed_count"
                countLabel="Filed"
                secondaryKey="distinct_targets"
                secondaryLabel="Distinct targets"
                onSelectTenant={handleSelectTenant}
                selectedTenantId={selectedTenantId}
                accentColor={C.blue}
              />
            </div>
          )}

          <TenantStatDetail
            tenantId={selectedTenantId}
            stats={tenantStats}
            loading={tenantLoading}
          />
        </div>
      )}
    </div>
  );
}
