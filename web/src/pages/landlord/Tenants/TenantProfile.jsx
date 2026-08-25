/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import {
  FiChevronRight,
  FiEdit,
  FiFileText,
  FiTool,
  FiMessageSquare,
  FiUser,
  FiX,
  FiSearch,
  FiShield,
} from "react-icons/fi";
import { IoMdCash } from "react-icons/io";
import { c as COLORS } from "../../../styles/theme";
import UseDepositModal from "../../../components/UseDepositModal";

const API = "http://localhost:4000";
const FONT =
  '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const TABS = [
  { id: "tenant", label: "Tenant", icon: FiUser },
  { id: "leases", label: "Leases", icon: FiFileText },
  { id: "financials", label: "Financials", icon: IoMdCash },
  { id: "maintenance", label: "Maintenance", icon: FiTool },
  { id: "complaints", label: "Complaints", icon: FiMessageSquare },
];

function formatAmount(amount) {
  return amount === null || amount === undefined || amount === ""
    ? "—"
    : `R ${Number(amount).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  return d
    ? new Date(d).toLocaleDateString("en-ZA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";
}

function riskColor(score) {
  if (!score) return "#6b6b6b";
  if (score === "reliable") return "#2b7a4b";
  if (score === "moderate_risk") return "#b9770e";
  if (score === "high_risk") return "#c0392b";
  return "#6b6b6b";
}

function monthsUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24 * 30)));
}

function InfoRow({ label, children, compact }) {
  const labelWidth = compact ? "110px" : "150px";
  return (
    <div
      style={{
        display: "flex",
        overflow: "hidden",
        border: "1px solid #e2e3e4",
        marginBottom: "0.4rem",
        fontSize: "14px",
        fontWeight: 400,
        flex: compact ? 1 : undefined,
      }}
    >
      <div
        style={{
          width: labelWidth,
          flexShrink: 0,
          padding: "0.4rem 0.6rem",
          color: "#000",
          fontWeight: 500,
          background: "#fdfdfd",
          borderRight: "1px solid #e9ecef",
          display: "flex",
          alignItems: "center",
        }}
      >
        {label}
      </div>
      <div
        style={{
          padding: "0.4rem 0.6rem",
          color: "#000",
          background: "#f5f5f5",
          flex: 1,
          display: "flex",
          alignItems: "center",
          fontWeight: 400,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function SummaryCard({ icon: Icon, title, children }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 240,
        border: "1px solid #ccc",
        borderRadius: "3px",
        overflow: "hidden",
        boxShadow: "1px 1px 2px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.4rem",
          padding: "0.6rem 1rem",
          color: "#000",
          fontSize: "16px",
          fontWeight: 500,
          borderBottom: "2px solid #3498db",
        }}
      >
        <Icon size={15} /> {title}
      </div>
      <div
        style={{
          padding: "0.8rem",
          textAlign: "center",
          fontSize: "14px",
          color: "#000",
        }}
      >
        {children}
      </div>
    </div>
  );
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

const STATUS_STYLES = {
  invoice: {
    paid: {
      color: "#1a4a30",
      bg: "#eef5e8",
      border: "1px solid #c5d9b8",
      dot: "#2b7a4b",
    },
    sent: {
      color: "#5b4a0b",
      bg: "#faf6ed",
      border: "1px solid #e5dbb8",
      dot: "#8b6e1a",
    },
    overdue: {
      color: "#7a2b2b",
      bg: "#fbeaea",
      border: "1px solid #e5bdbd",
      dot: "#9e3a3a",
    },
    partial: {
      color: "#1e4a6b",
      bg: "#e8f0f5",
      border: "1px solid #b0cfe0",
      dot: "#2c6b9b",
    },
    cancelled: {
      color: "#5a5a5a",
      bg: "#f2f2f2",
      border: "1px solid #d0d0d0",
      dot: "#6b6b6b",
    },
    void: {
      color: "#6a6a6a",
      bg: "#f5f5f5",
      border: "1px solid #e0e0e0",
      dot: "#7a7a7a",
    },
    draft: {
      color: "#5a5a5a",
      bg: "#f2f2f2",
      border: "1px solid #d0d0d0",
      dot: "#6b6b6b",
    },
    default: {
      color: "#5a5a5a",
      bg: "#f2f2f2",
      border: "1px solid #d0d0d0",
      dot: "#6b6b6b",
    },
  },
  payment: {
    paid: {
      color: "#1a4a30",
      bg: "#eef5e8",
      border: "1px solid #c5d9b8",
      dot: "#2b7a4b",
    },
    pending: {
      color: "#5b4a0b",
      bg: "#faf6ed",
      border: "1px solid #e5dbb8",
      dot: "#8b6e1a",
    },
    pending_approval: {
      color: "#5b4a0b",
      bg: "#faf6ed",
      border: "1px solid #e5dbb8",
      dot: "#8b6e1a",
    },
    rejected: {
      color: "#7a2b2b",
      bg: "#fbeaea",
      border: "1px solid #e5bdbd",
      dot: "#9e3a3a",
    },
    late: {
      color: "#7a2b2b",
      bg: "#fbeaea",
      border: "1px solid #e5bdbd",
      dot: "#9e3a3a",
    },
    collections: {
      color: "#7a2b2b",
      bg: "#fbeaea",
      border: "1px solid #e5bdbd",
      dot: "#9e3a3a",
    },
    default: {
      color: "#5a5a5a",
      bg: "#f2f2f2",
      border: "1px solid #d0d0d0",
      dot: "#6b6b6b",
    },
  },
  maintenance: {
    open: {
      color: "#1e4a6b",
      bg: "#e8f0f5",
      border: "1px solid #b0cfe0",
      dot: "#2c6b9b",
    },
    in_progress: {
      color: "#5b4a0b",
      bg: "#faf6ed",
      border: "1px solid #e5dbb8",
      dot: "#8b6e1a",
    },
    completed: {
      color: "#1a4a30",
      bg: "#eef5e8",
      border: "1px solid #c5d9b8",
      dot: "#2b7a4b",
    },
    cancelled: {
      color: "#5a5a5a",
      bg: "#f2f2f2",
      border: "1px solid #d0d0d0",
      dot: "#6b6b6b",
    },
    default: {
      color: "#5a5a5a",
      bg: "#f2f2f2",
      border: "1px solid #d0d0d0",
      dot: "#6b6b6b",
    },
  },
  complaint: {
    open: {
      color: "#1e4a6b",
      bg: "#e8f0f5",
      border: "1px solid #b0cfe0",
      dot: "#2c6b9b",
    },
    in_progress: {
      color: "#5b4a0b",
      bg: "#faf6ed",
      border: "1px solid #e5dbb8",
      dot: "#8b6e1a",
    },
    resolved: {
      color: "#1a4a30",
      bg: "#eef5e8",
      border: "1px solid #c5d9b8",
      dot: "#2b7a4b",
    },
    closed: {
      color: "#5a5a5a",
      bg: "#f2f2f2",
      border: "1px solid #d0d0d0",
      dot: "#6b6b6b",
    },
    default: {
      color: "#5a5a5a",
      bg: "#f2f2f2",
      border: "1px solid #d0d0d0",
      dot: "#6b6b6b",
    },
  },
  lease: {
    active: {
      color: "#2b7a4b",
      bg: "#eef5e8",
      border: "1px solid #c5d9b8",
      dot: "#2b7a4b",
    },
    expired: {
      color: "#9e3a3a",
      bg: "#fbeaea",
      border: "1px solid #e5bdbd",
      dot: "#9e3a3a",
    },
    terminated: {
      color: "#6a6a6a",
      bg: "#f2f2f2",
      border: "1px solid #d0d0d0",
      dot: "#7a7a7a",
    },
    cancelled: {
      color: "#6a6a6a",
      bg: "#f5f5f5",
      border: "1px solid #e0e0e0",
      dot: "#7a7a7a",
    },
    default: {
      color: "#5a5a5a",
      bg: "#f2f2f2",
      border: "1px solid #d0d0d0",
      dot: "#6b6b6b",
    },
  },
};

function StatusBadge({ status, type }) {
  const cfg = STATUS_STYLES[type]?.[status] ||
    STATUS_STYLES[type]?.default || {
      color: "#5a5a5a",
      bg: "#f2f2f2",
      border: "1px solid #d0d0d0",
      dot: "#6b6b6b",
    };
  const label = (status || "—").replace(/_/g, " ");
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.3rem",
        fontSize: "12px",
        fontWeight: 500,
        padding: "0.15rem 0.6rem",
        color: cfg.color,
        background: cfg.bg,
        border: cfg.border,
        borderRadius: "12px",
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: cfg.dot,
          flexShrink: 0,
        }}
      />
      {label}
    </span>
  );
}

function EmptyState({ icon: Icon, text, actionLabel, onAction, colSpan = 6 }) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          padding: "3rem 1.5rem",
          textAlign: "center",
          color: "#9aa4af",
        }}
      >
        <Icon size={28} style={{ marginBottom: "0.6rem", opacity: 0.4 }} />
        <p style={{ fontSize: "14px", marginBottom: "0.6rem" }}>{text}</p>
        {actionLabel && (
          <a
            href="#add"
            onClick={(e) => {
              e.preventDefault();
              onAction?.();
            }}
            className="rb-link"
          >
            {actionLabel}
          </a>
        )}
      </td>
    </tr>
  );
}

export default function TenantProfile() {
  useDocumentTitle("Tenant Profile");
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [tenant, setTenant] = useState(null);
  const [leases, setLeases] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("tenant");
  const [leaseSearch, setLeaseSearch] = useState("");
  const [complaintStats, setComplaintStats] = useState(null);

  const [useDeposit, setUseDeposit] = useState(null);
  const [depositLoading, setDepositLoading] = useState(false);

  const fetchTenant = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");

      const [tenantRes, depositsRes, complaintStatsRes] = await Promise.all([
        axios.get(`${API}/tenants/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API}/landlord/payments/deposits`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 200 },
        }),
        axios.get(`${API}/landlord/complaints/stats/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const t = tenantRes.data.tenant;
      setTenant(t);
      setLeases(t.leases || []);
      setComplaints(t.complaints || []);
      setMaintenanceRequests(t.maintenance_requests || []);
      setInvoices(t.invoices || []);
      setPayments(t.payments || []);

      const allDeposits = depositsRes.data.deposits || [];
      setDeposits(allDeposits.filter((d) => d.tenant_id === t.id));
      setComplaintStats(complaintStatsRes.data.stats || null);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load tenant");
    } finally {
      setLoading(false);
    }
  }, [id]);

  console.log("tenant: ", tenant);

  useEffect(() => {
    fetchTenant();
  }, [fetchTenant]);

  const openInvoice = invoices.find(
    (inv) =>
      ["sent", "overdue", "partial"].includes(inv.status) &&
      Number(inv.remaining_balance) > 0 &&
      !inv.linked_plan_id,
  );
  const availableDeposit = deposits.find((d) => {
    const avail =
      Number(d.amount_held ?? d.amount ?? 0) -
      Number(d.amount_refunded ?? 0) -
      Number(d.used_amount ?? 0);
    return avail > 0;
  });
  const canUseDeposit = Boolean(openInvoice && availableDeposit);

  const openUseDepositModal = async () => {
    if (!availableDeposit) {
      toast.error("No available deposit balance.");
      return;
    }
    if (!openInvoice) {
      toast.error("No open invoice to apply deposit to.");
      return;
    }
    setDepositLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(
        `${API}/landlord/payments/deposits/${availableDeposit.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      setUseDeposit({
        ...(data.deposit || data),
        invoice_id: openInvoice.id,
      });
    } catch (err) {
      toast.error(
        err.response?.data?.error || "Failed to load deposit details.",
      );
    } finally {
      setDepositLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.6rem",
          padding: "4rem 2rem",
          color: "#95a5a6",
          fontWeight: 300,
          background: "#fdfdfd",
          border: "1px solid #e9ecef",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          fontFamily: FONT,
        }}
      >
        <span
          style={{
            width: 22,
            height: 22,
            border: "2px solid rgba(44,62,80,0.1)",
            borderTopColor: "#2c3e50",
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
            display: "inline-block",
          }}
        />
        <span style={{ fontSize: "14px" }}>Loading tenant...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div
        style={{
          padding: "3rem 2rem",
          textAlign: "center",
          fontWeight: 300,
          background: "#fdfdfd",
          border: "1px solid #e9ecef",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          fontFamily: FONT,
        }}
      >
        <p
          style={{ fontSize: "14px", color: "#c0392b", marginBottom: "0.8rem" }}
        >
          {error || "Tenant not found"}
        </p>
        <button
          onClick={fetchTenant}
          style={{
            background: "transparent",
            color: "#2471a3",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            textDecoration: "underline",
          }}
        >
          Try again
        </button>
      </div>
    );
  }

  const fullName =
    tenant.full_name ||
    `${tenant.first_name || ""} ${tenant.last_name || ""}`.trim();
  const activeLease =
    leases.find((l) => l.status === "active") || leases[0] || null;
  const balance =
    Number(tenant.outstanding_balance) ||
    invoices.reduce(
      (sum, inv) => sum + (Number(inv.remaining_balance) || 0),
      0,
    );
  const depositHeld = activeLease?.deposit_amount ?? tenant.deposit_amount;
  const leaseMonthsLeft = activeLease
    ? monthsUntil(activeLease.lease_end_date)
    : null;

  const filteredLeases = leases.filter(
    (lease) =>
      !leaseSearch ||
      (lease.property_name || "")
        .toLowerCase()
        .includes(leaseSearch.toLowerCase()) ||
      (lease.unit_number || "")
        .toLowerCase()
        .includes(leaseSearch.toLowerCase()),
  );

  return (
    <div
      style={{
        fontSize: "14px",
        fontWeight: 400,
        fontFamily: FONT,
        color: "#000",
      }}
    >
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .rb-link { color: #2471a3; text-decoration: none; font-size: 14px; }
        .rb-link:hover { text-decoration: underline; }
        .rb-row:hover { background: #fafbfc; }
        .rb-icon-btn {
          display: inline-flex; align-items: center; justify-content: center;
          width: 28px; height: 28px; cursor: pointer;
          border: 1px solid #dee2e6; background: #fdfdfd; color: #000;
          transition: all 0.15s;
        }
        .rb-icon-btn:hover { background: #f4f5f6; color: #000; }
        .rb-icon-btn.danger:hover { background: #fdf0f0; color: #e74c3c; border-color: #f5c6cb; }
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
        <Link to="/landlord/tenants" className="rb-link">
          Tenants
        </Link>
        <span style={{ color: "#555" }}>/</span>
        <span style={{ color: "#000" }}>{fullName || "Tenant"}</span>
      </div>

      {/* Main card */}
      <div
        style={{
          background: "#fefcfccf",
          border: "1px solid #e9ecef",
          boxShadow:
            "1px 1px 1px 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)",
          overflow: "hidden",
        }}
      >
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            background: "#eee",
            boxShadow: "1px 1px 1px 1px rgba(0,0,0,0.1)",
          }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const TabIcon = tab.icon;
            const count =
              tab.id === "leases"
                ? leases.length
                : tab.id === "maintenance"
                  ? maintenanceRequests.length
                  : tab.id === "complaints"
                    ? complaints.length
                    : tab.id === "financials"
                      ? invoices.length + payments.length
                      : 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.5rem 0.8rem",
                  fontSize: "14px",
                  fontWeight: active ? 500 : 400,
                  color: active ? "#000" : "#333",
                  background: active ? "#fdfdfd" : "transparent",
                  border: active
                    ? "1px solid #e9ecef"
                    : "1px solid transparent",
                  borderBottom: active ? "1px solid #fdfdfd" : "none",
                  borderTop: active
                    ? "2px solid #3498db"
                    : "2px solid transparent",
                  cursor: "pointer",
                  marginBottom: active ? "-1px" : "0",
                  position: "relative",
                  zIndex: active ? 2 : 1,
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  if (!active)
                    e.currentTarget.style.background = "rgba(0,0,0,0.05)";
                }}
                onMouseLeave={(e) => {
                  if (!active) e.currentTarget.style.background = "transparent";
                }}
              >
                <TabIcon size={14} />
                {tab.label}
                {count > 0 && (
                  <span
                    style={{
                      background: active ? "#eaf2f8" : "rgba(0,0,0,0.1)",
                      color: active ? "#2471a3" : "#333",
                      padding: "0.1rem 0.4rem",
                      fontSize: "11px",
                      fontWeight: 500,
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div
          style={{
            border: "1px solid #e9ecefbe",
            minHeight: "300px",
            margin: "0.8rem 0.6rem 1.6rem",
            boxShadow: "1px 1px 1px 1px rgba(0,0,0,0.2)",
            borderRadius: "2px",
          }}
        >
          {/* TENANT TAB */}
          {activeTab === "tenant" && (
            <div style={{ padding: "1.2rem" }}>
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ flex: "1 1 400px", minWidth: 280 }}>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <InfoRow label="State" compact>
                      {tenant.lease_status === "active" ||
                      activeLease?.status === "active"
                        ? "Active"
                        : "Inactive"}
                    </InfoRow>
                    <InfoRow label="Full Name" compact>
                      {fullName || "—"}
                    </InfoRow>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <InfoRow label="Mobile" compact>
                      {tenant.phone || "—"}
                    </InfoRow>
                    <InfoRow label="Email" compact>
                      {tenant.email ? (
                        <a href={`mailto:${tenant.email}`} className="rb-link">
                          {tenant.email}
                        </a>
                      ) : (
                        "—"
                      )}
                    </InfoRow>
                  </div>

                  <InfoRow label="Unit">
                    {tenant.unit_number ? `Unit ${tenant.unit_number}` : "—"}
                  </InfoRow>
                  <InfoRow label="Property">
                    {tenant.property_name || "—"}
                  </InfoRow>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: "0.5rem",
                    }}
                  >
                    <button
                      onClick={() =>
                        navigate("/landlord/tenants", {
                          state: { editTenant: tenant },
                        })
                      }
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        background: "#fdfdfd",
                        color: "#000",
                        border: "1px solid #ccc",
                        padding: "0.3rem 0.6rem",
                        fontSize: "14px",
                        fontWeight: 400,
                        cursor: "pointer",
                        borderRadius: "2px",
                      }}
                    >
                      <FiEdit size={14} /> Edit Tenant
                    </button>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  flexWrap: "wrap",
                  marginTop: "1rem",
                }}
              >
                <SummaryCard icon={FiFileText} title="Lease">
                  {activeLease ? (
                    <>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          marginBottom: "0.2rem",
                        }}
                      >
                        {leaseMonthsLeft != null
                          ? `Expiry in ${leaseMonthsLeft} month${leaseMonthsLeft === 1 ? "" : "s"}`
                          : "—"}
                      </div>
                      <div
                        style={{
                          fontSize: "13px",
                          color: "#333",
                          marginBottom: "0.3rem",
                        }}
                      >
                        {fmtDate(activeLease.lease_start_date)} -{" "}
                        {fmtDate(activeLease.lease_end_date)}
                      </div>
                      <button
                        onClick={(e) =>
                          navigate(`/landlord/leases/${tenant.lease_id}`)
                        }
                        className="rb-link"
                      >
                        View Lease
                      </button>
                    </>
                  ) : (
                    <div style={{ color: "#666" }}>No lease on record</div>
                  )}
                </SummaryCard>

                <SummaryCard icon={IoMdCash} title="Financials">
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      marginBottom: "0.2rem",
                      color: balance > 0 ? "#c0392b" : "#000",
                    }}
                  >
                    Due: {formatAmount(balance)}
                  </div>
                  <div style={{ fontSize: "13px", color: "#333" }}>
                    Deposit Held: {formatAmount(depositHeld)}
                  </div>
                </SummaryCard>
              </div>

              {tenant.score_breakdown && (
                <div
                  style={{
                    marginTop: "1.5rem",
                    border: "1px solid #e9ecef",
                    padding: "1rem",
                    borderRadius: "3px",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                      color: "#000",
                    }}
                  >
                    Reliability Score
                  </h4>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.8rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.3rem",
                        padding: "0.3rem 0.8rem",
                        borderRadius: "12px",
                        background: riskColor(tenant.reliability_score) + "22",
                        color: riskColor(tenant.reliability_score),
                        fontSize: "13px",
                        fontWeight: 600,
                      }}
                    >
                      <FiShield size={14} />
                      {tenant.reliability_score.replace(/_/g, " ")}
                    </span>
                    <span
                      style={{
                        fontSize: "22px",
                        fontWeight: 700,
                        color: riskColor(tenant.reliability_score),
                      }}
                    >
                      {tenant.reliability_score_value != null
                        ? Number(tenant.reliability_score_value).toFixed(1)
                        : "—"}
                    </span>
                  </div>

                  {/* Sub-scores */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "0.8rem",
                    }}
                  >
                    {[
                      { key: "payment", label: "Payment" },
                      { key: "complaints", label: "Complaints" },
                      { key: "lease", label: "Lease" },
                      { key: "tenure", label: "Tenure" },
                      { key: "maintenance", label: "Maintenance" },
                    ].map(({ key, label }) => {
                      const val =
                        tenant.score_breakdown[key] !== undefined
                          ? tenant.score_breakdown[key]
                          : null;
                      return (
                        <div key={key}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "12px",
                              color: "#555",
                              marginBottom: "0.25rem",
                            }}
                          >
                            <span>{label}</span>
                            <span>
                              {val !== null ? Number(val).toFixed(1) : "—"}
                            </span>
                          </div>
                          <div
                            style={{
                              height: "6px",
                              background: "#eee",
                              borderRadius: "3px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${val !== null ? Math.max(0, Math.min(100, val)) : 0}%`,
                                height: "100%",
                                background:
                                  val !== null
                                    ? val >= 80
                                      ? "#2b7a4b"
                                      : val >= 50
                                        ? "#b9770e"
                                        : "#c0392b"
                                    : "#ddd",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Score history */}
                  {tenant.score_history && tenant.score_history.length > 0 && (
                    <div style={{ marginTop: "1rem" }}>
                      <h5
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          marginBottom: "0.5rem",
                          color: "#000",
                        }}
                      >
                        Recent changes
                      </h5>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "0.4rem",
                        }}
                      >
                        {tenant.score_history.slice(0, 5).map((h, idx) => (
                          <div
                            key={idx}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              fontSize: "12px",
                            }}
                          >
                            <span style={{ color: "#666", minWidth: 80 }}>
                              {fmtDate(h.created_at)}
                            </span>
                            <span style={{ color: riskColor(h.old_score) }}>
                              {h.old_score?.replace(/_/g, " ") ?? "—"}
                            </span>
                            <span>→</span>
                            <span
                              style={{
                                color: riskColor(h.new_score),
                                fontWeight: 600,
                              }}
                            >
                              {h.new_score?.replace(/_/g, " ") ?? "—"}
                            </span>
                            <span style={{ color: "#999" }}>
                              {h.old_score_value != null &&
                              h.new_score_value != null
                                ? `${Number(h.old_score_value).toFixed(1)} → ${Number(h.new_score_value).toFixed(1)}`
                                : ""}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* LEASES TAB */}
          {activeTab === "leases" && (
            <div
              style={{
                padding: "0.8rem 0",
                background: "#fdfdfd",
                marginBottom: "1rem",
              }}
            >
              <h4
                style={{
                  fontSize: "16px",
                  color: "#000",
                  fontFamily: FONT,
                  paddingLeft: "0.7rem",
                  background: "#f0f4f8cb",
                  margin: "0 0 0.5rem",
                }}
              >
                List of leases
              </h4>
              <div
                style={{
                  height: "3px",
                  backgroundColor: "#3498db",
                  marginBottom: "1rem",
                }}
              />

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  marginBottom: "1rem",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  marginRight: "1.7rem",
                }}
              >
                <div style={{ position: "relative" }}>
                  <FiSearch
                    size={14}
                    style={{
                      position: "absolute",
                      left: "0.7rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#5fa0e0",
                    }}
                  />
                  <input
                    value={leaseSearch}
                    onChange={(e) => setLeaseSearch(e.target.value)}
                    placeholder="Search by property or unit"
                    style={{
                      padding: "0.4rem 0.75rem 0.4rem 2.1rem",
                      fontSize: "14px",
                      border: `1px solid #d0d1d3`,
                      borderRadius: "3px",
                      width: "240px",
                      fontFamily: FONT,
                      color: "#000",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  borderRadius: "0px",
                  overflow: "hidden",
                  margin: "0 1.7rem 0 1.7rem",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}></th>
                      <th style={thStyle}>Property/Unit</th>
                      <th style={thStyle}>Lease details</th>
                      <th style={thStyle}>Financials</th>
                      <th style={thStyle}>State</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeases.length > 0 ? (
                      filteredLeases.map((lease, i) => (
                        <tr key={lease.id} className="rb-row">
                          <td style={tdStyle}>
                            <Link
                              to={`/landlord/leases/${lease.id}`}
                              className="rb-link"
                              style={{ fontWeight: 600 }}
                            >
                              LEA{String(i + 1).padStart(6, "0")}
                            </Link>
                          </td>
                          <td style={tdStyle}>
                            <div>{lease.property_name || "—"}</div>
                            <div>
                              {lease.unit_number
                                ? `Unit ${lease.unit_number}`
                                : "—"}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div>
                              Term: {fmtDate(lease.lease_start_date)} to{" "}
                              {fmtDate(lease.lease_end_date)}
                            </div>
                            <div>
                              Rental: {formatAmount(lease.rent_amount)}, Fixed
                              Term Lease
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <div>
                              Deposit: {formatAmount(lease.deposit_amount)} held
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <StatusBadge status={lease.status} type="lease" />
                          </td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <div
                              style={{
                                display: "flex",
                                gap: "0.35rem",
                                justifyContent: "center",
                              }}
                            >
                              <button
                                className="rb-icon-btn"
                                title="Edit"
                                onClick={() =>
                                  navigate(`/landlord/leases/${lease.id}`)
                                }
                              >
                                <FiEdit size={13} />
                              </button>
                              <button
                                className="rb-icon-btn danger"
                                title="Terminate"
                                onClick={() =>
                                  toast.success(
                                    "Terminate lease not implemented yet.",
                                  )
                                }
                              >
                                <FiX size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <EmptyState
                        icon={FiFileText}
                        text="No leases on record for this tenant."
                        colSpan={6}
                      />
                    )}
                  </tbody>
                </table>
                {filteredLeases.length > 0 && (
                  <div
                    style={{
                      fontSize: "13px",
                      textAlign: "right",
                      fontWeight: 400,
                    }}
                  >
                    {filteredLeases.length} item
                    {filteredLeases.length === 1 ? "" : "s"} found.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* FINANCIALS TAB */}
          {activeTab === "financials" && (
            <div
              style={{
                padding: "0.8rem 0",
                background: "#fdfdfd",
                marginBottom: "1rem",
              }}
            >
              <h4
                style={{
                  fontSize: "16px",
                  color: "#000",
                  fontFamily: FONT,
                  paddingLeft: "0.7rem",
                  background: "#f0f4f8cb",
                  margin: "0 0 0.5rem",
                }}
              >
                Tenant Financials
              </h4>
              <div
                style={{
                  height: "3px",
                  backgroundColor: "#3498db",
                  marginBottom: "1rem",
                }}
              />

              {/* Summary cards */}
              <div
                style={{
                  display: "flex",
                  gap: "1rem",
                  flexWrap: "wrap",
                  margin: "0 1.7rem 1rem 1.7rem",
                }}
              >
                <SummaryCard icon={IoMdCash} title="Outstanding Balance">
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: balance > 0 ? "#c0392b" : "#000",
                    }}
                  >
                    {formatAmount(balance)}
                  </div>
                </SummaryCard>
                <SummaryCard icon={FiFileText} title="Deposit Held">
                  <div style={{ fontSize: "16px", fontWeight: 600 }}>
                    {formatAmount(depositHeld)}
                  </div>
                </SummaryCard>
              </div>

              {/* Action buttons */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.5rem",
                  margin: "0 1.7rem 1rem",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={openUseDepositModal}
                  disabled={!canUseDeposit || depositLoading}
                  title={
                    !canUseDeposit ? "No available deposit or open invoice" : ""
                  }
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    background: "#fdfdfd",
                    color: "#000",
                    border: "1px solid #ccc",
                    padding: "0.3rem 0.7rem",
                    fontSize: "14px",
                    fontWeight: 400,
                    cursor: canUseDeposit ? "pointer" : "not-allowed",
                    borderRadius: "2px",
                    opacity: canUseDeposit ? 1 : 0.5,
                  }}
                >
                  {depositLoading ? (
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: "2px solid rgba(0,0,0,0.2)",
                        borderTopColor: "#000",
                        borderRadius: "50%",
                        animation: "spin 0.6s linear infinite",
                        display: "inline-block",
                      }}
                    />
                  ) : (
                    "Use Deposit"
                  )}
                </button>
              </div>

              {/* Invoices Table */}
              <h4
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  margin: "0 1.7rem 0.5rem",
                  color: "#000",
                }}
              >
                Invoices
              </h4>
              <div
                style={{
                  borderRadius: "0px",
                  overflow: "hidden",
                  margin: "0 1.7rem 1.5rem",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Invoice #</th>
                      <th style={thStyle}>Due Date</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>
                        Remaining
                      </th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.length > 0 ? (
                      invoices.map((inv) => (
                        <tr key={inv.id} className="rb-row">
                          <td style={tdStyle}>
                            <Link
                              to={`/landlord/payments/invoices/${inv.id}`}
                              className="rb-link"
                            >
                              {inv.invoice_number || "—"}
                            </Link>
                          </td>
                          <td style={tdStyle}>{fmtDate(inv.due_date)}</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            {formatAmount(inv.amount_due)}
                          </td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            {formatAmount(inv.remaining_balance)}
                          </td>
                          <td style={tdStyle}>
                            <StatusBadge status={inv.status} type="invoice" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <EmptyState
                        icon={FiFileText}
                        text="No invoices on record."
                        colSpan={5}
                      />
                    )}
                  </tbody>
                </table>
              </div>

              {/* Payments Table */}
              <h4
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  margin: "0 1.7rem 0.5rem",
                  color: "#000",
                }}
              >
                Payments
              </h4>
              <div
                style={{
                  borderRadius: "0px",
                  overflow: "hidden",
                  margin: "0 1.7rem 1.5rem",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Date</th>
                      <th style={thStyle}>Method</th>
                      <th style={thStyle}>Reference</th>
                      <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length > 0 ? (
                      payments.map((p) => (
                        <tr key={p.id} className="rb-row">
                          <td style={tdStyle}>{fmtDate(p.payment_date)}</td>
                          <td style={tdStyle}>{p.payment_method || "—"}</td>
                          <td style={tdStyle}>{p.bank_reference || "—"}</td>
                          <td style={{ ...tdStyle, textAlign: "right" }}>
                            {formatAmount(p.amount_paid)}
                          </td>
                          <td style={tdStyle}>
                            <StatusBadge status={p.status} type="payment" />
                          </td>
                        </tr>
                      ))
                    ) : (
                      <EmptyState
                        icon={IoMdCash}
                        text="No payments on record."
                        colSpan={5}
                      />
                    )}
                  </tbody>
                </table>
              </div>
              {tenant.active_collection && (
                <div
                  style={{
                    border: "1px solid #e9ecef",
                    borderRadius: "3px",
                    padding: "1rem",
                    margin: "0 1.7rem 1rem",
                  }}
                >
                  <h4
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      marginBottom: "0.5rem",
                    }}
                  >
                    Collections Status
                  </h4>
                  <StatusBadge
                    status={tenant.active_collection.status}
                    type="collection"
                  />
                  {tenant.active_plan && (
                    <div style={{ marginTop: "0.6rem", fontSize: "13px" }}>
                      Repayment plan:{" "}
                      {formatAmount(tenant.active_plan.paid_amount)} of{" "}
                      {formatAmount(tenant.active_plan.total_amount)} paid
                      <Link
                        to="/landlord/payments/plans"
                        className="rb-link"
                        style={{ marginLeft: "0.5rem" }}
                      >
                        View plan
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MAINTENANCE TAB */}
          {activeTab === "maintenance" && (
            <div
              style={{
                padding: "0.8rem 0",
                background: "#fdfdfd",
                marginBottom: "1rem",
              }}
            >
              <h4
                style={{
                  fontSize: "16px",
                  color: "#000",
                  fontFamily: FONT,
                  paddingLeft: "0.7rem",
                  background: "#f0f4f8cb",
                  margin: "0 0 0.5rem",
                }}
              >
                Maintenance history
              </h4>
              <div
                style={{
                  height: "3px",
                  backgroundColor: "#3498db",
                  marginBottom: "1rem",
                }}
              />

              <div
                style={{
                  borderRadius: "0px",
                  overflow: "hidden",
                  margin: "0 1.7rem 1rem 1.7rem",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}></th>
                      <th style={thStyle}>Request</th>
                      <th style={thStyle}>Category</th>
                      <th style={thStyle}>Property/Unit</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceRequests.length > 0 ? (
                      maintenanceRequests.map((r, i) => (
                        <tr key={r.id || i} className="rb-row">
                          <td style={tdStyle}>
                            <Link
                              to={`/landlord/maintenance/${r.id}`}
                              className="rb-link"
                              style={{ fontWeight: 600 }}
                            >
                              MNT{String(i + 1).padStart(6, "0")}
                            </Link>
                          </td>
                          <td style={tdStyle}>{r.title || "—"}</td>
                          <td
                            style={{ ...tdStyle, textTransform: "capitalize" }}
                          >
                            {r.category || "—"}
                          </td>
                          <td style={tdStyle}>
                            <div>{r.property_name || "—"}</div>
                            <div>
                              {r.unit_number ? `Unit ${r.unit_number}` : "—"}
                            </div>
                          </td>
                          <td style={tdStyle}>
                            <StatusBadge status={r.status} type="maintenance" />
                          </td>
                          <td style={tdStyle}>{fmtDate(r.created_at)}</td>
                        </tr>
                      ))
                    ) : (
                      <EmptyState
                        icon={FiTool}
                        text="No maintenance requests on record."
                        colSpan={6}
                      />
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* COMPLAINTS TAB */}
          {activeTab === "complaints" && (
            <div
              style={{
                padding: "0.8rem 0",
                background: "#fdfdfd",
                marginBottom: "1rem",
              }}
            >
              {complaintStats && (
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    flexWrap: "wrap",
                    margin: "0 1.7rem 1.2rem 1.7rem",
                  }}
                >
                  <SummaryCard icon={FiMessageSquare} title="Complained About">
                    <div style={{ fontSize: "20px", fontWeight: 700 }}>
                      {complaintStats.times_complained_about}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      by {complaintStats.distinct_people_complained_by}{" "}
                      different tenant
                      {complaintStats.distinct_people_complained_by === "1"
                        ? ""
                        : "s"}
                    </div>
                  </SummaryCard>
                  <SummaryCard icon={FiMessageSquare} title="Filed by Tenant">
                    <div style={{ fontSize: "20px", fontWeight: 700 }}>
                      {complaintStats.times_filed}
                    </div>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      against {complaintStats.distinct_people_filed_against}{" "}
                      different tenant
                      {complaintStats.distinct_people_filed_against === "1"
                        ? ""
                        : "s"}
                    </div>
                  </SummaryCard>
                </div>
              )}
              <h4
                style={{
                  fontSize: "16px",
                  color: "#000",
                  fontFamily: FONT,
                  paddingLeft: "0.7rem",
                  background: "#f0f4f8cb",
                  margin: "0 0 0.5rem",
                }}
              >
                Complaint history
              </h4>
              <div
                style={{
                  height: "3px",
                  backgroundColor: "#3498db",
                  marginBottom: "1rem",
                }}
              />

              <div
                style={{
                  borderRadius: "0px",
                  overflow: "hidden",
                  margin: "0 1.7rem 1rem 1.7rem",
                }}
              >
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={thStyle}></th>
                      <th style={thStyle}>Subject</th>
                      <th style={thStyle}>Property/Unit</th>
                      <th style={thStyle}>Outcome</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.length > 0 ? (
                      complaints.map((c, i) => (
                        <tr key={c.id || i} className="rb-row">
                          <td style={tdStyle}>
                            <Link
                              to={`/landlord/complaints/${c.id}`}
                              className="rb-link"
                              style={{ fontWeight: 600 }}
                            >
                              CMP{String(i + 1).padStart(6, "0")}
                            </Link>
                          </td>
                          <td style={tdStyle}>{c.subject || "—"}</td>
                          <td style={tdStyle}>
                            <div>{c.property_name || "—"}</div>
                            <div>
                              {c.against_unit_number
                                ? `Unit ${c.against_unit_number}`
                                : "—"}
                            </div>
                          </td>
                          <td
                            style={{ ...tdStyle, textTransform: "capitalize" }}
                          >
                            {c.verdict_type
                              ? c.verdict_type.replace(/_/g, " ")
                              : "—"}
                          </td>
                          <td style={tdStyle}>
                            <StatusBadge status={c.status} type="complaint" />
                          </td>
                          <td style={tdStyle}>{fmtDate(c.created_at)}</td>
                        </tr>
                      ))
                    ) : (
                      <EmptyState
                        icon={FiMessageSquare}
                        text="No complaints on record."
                        colSpan={6}
                      />
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Use Deposit Modal */}
      {useDeposit && (
        <UseDepositModal
          deposit={useDeposit}
          invoiceId={openInvoice?.id}
          invoiceNumber={openInvoice?.invoice_number}
          invoiceRemainingBalance={openInvoice?.remaining_balance}
          onClose={() => setUseDeposit(null)}
          onSuccess={() => {
            setUseDeposit(null);
            fetchTenant();
          }}
        />
      )}
    </div>
  );
}
