/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";
import { FiSearch, FiPlus, FiRefreshCw, FiX, FiChevronDown, FiChevronRight } from "react-icons/fi";

const API = "http://localhost:4000";
const PAGE_SIZE = 8;

const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const COLORS = {
  text: "#1f2328",
  textMuted: "#5f6b7a",
  link: "#1a73e8",
  border: "#dfe3e8",
  borderLight: "#eef1f4",
  headBg: "#f7f8fa",
  green: "#4c8c4c",
  white: "#fdfdfd",
};

const PLAN_STATUS = {
  pending: { color: "#5b4a0b", bg: "#faf6ed", border: "1px solid #e5dbb8", dot: "#8b6e1a", label: "Pending Approval" },
  active: { color: "#1e4a6b", bg: "#e8f0f5", border: "1px solid #b0cfe0", dot: "#2c6b9b", label: "Active" },
  completed: { color: "#1a4a30", bg: "#eef5e8", border: "1px solid #c5d9b8", dot: "#2b7a4b", label: "Completed" },
  defaulted: { color: "#7a2b2b", bg: "#fbeaea", border: "1px solid #e5bdbd", dot: "#9e3a3a", label: "Defaulted" },
  rejected: { color: "#5a5a5a", bg: "#f2f2f2", border: "1px solid #d0d0d0", dot: "#6b6b6b", label: "Rejected" },
};

const INSTALMENT_STATUS = {
  paid: { color: "#1a4a30", bg: "#eef5e8", border: "1px solid #c5d9b8", dot: "#2b7a4b", label: "Paid" },
  pending: { color: "#5b4a0b", bg: "#faf6ed", border: "1px solid #e5dbb8", dot: "#8b6e1a", label: "Pending" },
  overdue: { color: "#7a2b2b", bg: "#fbeaea", border: "1px solid #e5bdbd", dot: "#9e3a3a", label: "Overdue" },
};

function formatAmount(amount) {
  return amount === null || amount === undefined || amount === ""
    ? "—"
    : `R ${Number(amount).toLocaleString("en-ZA")}`;
}

function formatDate(dateStr) {
  return dateStr ? new Date(dateStr).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function initials(name = "") {
  return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

const thStyle = {
  padding: "0.6rem 0.8rem", fontSize: "12px", fontWeight: 600, color: "#000",
  textTransform: "uppercase", letterSpacing: "0.06em", background: "#e9eced52",
  border: "1px solid #9a9d9e52", textAlign: "left", whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "0.6rem 0.8rem", fontSize: "12px", color: "#151515",
  border: "1px solid #9a9d9e52", verticalAlign: "middle", fontWeight: 400,
  background: "#e9eced52",
};

const outlineBtnStyle = {
  display: "flex", alignItems: "center", gap: "0.4rem",
  background: COLORS.white, color: COLORS.text,
  border: "1px solid #ccc", padding: "0.2rem 0.3rem", fontSize: "14.5px", fontWeight: 400,
  cursor: "pointer", borderRadius: "2px",
};

const primaryBtnStyle = {
  ...outlineBtnStyle,
  background: "#2c3e50", color: "#ffffff", border: "1px solid #2c3e50",
};

function StatusBadge({ status }) {
  const cfg = PLAN_STATUS[status] || PLAN_STATUS.active;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "12px",
      fontWeight: 500, padding: "0.15rem 0.6rem", color: cfg.color, background: cfg.bg,
      border: cfg.border, borderRadius: "12px",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function InstalmentBadge({ status }) {
  const cfg = INSTALMENT_STATUS[status] || INSTALMENT_STATUS.pending;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem", fontSize: "11px",
      fontWeight: 500, padding: "0.1rem 0.5rem", color: cfg.color, background: cfg.bg,
      border: cfg.border, borderRadius: "12px",
    }}>
      {cfg.label}
    </span>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem",
      padding: "0.6rem 1rem", margin: "0 0 1rem", background: "#fde8e5", border: "1px solid #f5c8c2",
    }}>
      <span style={{ fontSize: "14px", color: "#c0392b", display: "flex", alignItems: "center", gap: "0.4rem" }}>
        <Icon name="alertCircle" size={14} /> {message}
      </span>
      <button onClick={onRetry} style={{ ...outlineBtnStyle, padding: "0.25rem 0.8rem", fontSize: "13px" }}>Retry</button>
    </div>
  );
}

function CreatePlanModal({ tenants, onClose, onCreated }) {
  const toast = useToast();
  const [tenantId, setTenantId] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [instalments, setInstalments] = useState("3");
  const [frequency, setFrequency] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!tenantId || !totalAmount || !instalments || !startDate) {
      setError("Please fill all required fields.");
      return;
    }
    setLoading(true);
    setError("");
    axios.post(`${API}/repayment-plans`, {
      tenant_id: tenantId,
      total_amount: Number(totalAmount),
      instalments: Number(instalments),
      frequency,
      start_date: startDate,
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(({ data }) => {
        toast.success("Repayment plan created.");
        onCreated(data.plan);
        onClose();
      })
      .catch(err => {
        setError(err.response?.data?.error || "Failed to create plan");
      })
      .finally(() => setLoading(false));
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(44,62,80,0.5)' }}>
      <div style={{ width: '100%', maxWidth: 480, background: '#fdfdfd', border: '1px solid #e9ecef', borderRadius: '3px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #e9ecef' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#000' }}>Create Repayment Plan</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#95a5a6' }}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#333', marginBottom: '0.3rem', display: 'block' }}>Tenant *</label>
            <select value={tenantId} onChange={e => setTenantId(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.7rem', fontSize: '14px', background: '#fdfdfd', border: '1px solid #dee2e6', color: '#000', outline: 'none', borderRadius: '2px' }}>
              <option value="">Select tenant...</option>
              {tenants.map(t => (
                <option key={t.id} value={t.id}>{t.name} ({t.unit})</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#333', marginBottom: '0.3rem', display: 'block' }}>Total Amount (R) *</label>
              <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.7rem', fontSize: '14px', background: '#fdfdfd', border: '1px solid #dee2e6', color: '#000', outline: 'none', borderRadius: '2px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#333', marginBottom: '0.3rem', display: 'block' }}>Instalments *</label>
              <input type="number" min="1" max="24" value={instalments} onChange={e => setInstalments(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.7rem', fontSize: '14px', background: '#fdfdfd', border: '1px solid #dee2e6', color: '#000', outline: 'none', borderRadius: '2px' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#333', marginBottom: '0.3rem', display: 'block' }}>Frequency</label>
              <select value={frequency} onChange={e => setFrequency(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.7rem', fontSize: '14px', background: '#fdfdfd', border: '1px solid #dee2e6', color: '#000', outline: 'none', borderRadius: '2px' }}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#333', marginBottom: '0.3rem', display: 'block' }}>Start Date *</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ width: '100%', padding: '0.4rem 0.7rem', fontSize: '14px', background: '#fdfdfd', border: '1px solid #dee2e6', color: '#000', outline: 'none', borderRadius: '2px' }} />
            </div>
          </div>
          {error && <p style={{ fontSize: '13px', color: '#9e3a3a' }}>{error}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: '1px solid #e9ecef' }}>
          <button onClick={onClose} disabled={loading} style={{ ...outlineBtnStyle, flex: 1, justifyContent: 'center' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ ...primaryBtnStyle, flex: 1, justifyContent: 'center' }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : "Create Plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanDetailModal({ plan, onClose, onMarkPaid, onApprove, onReject }) {
  const [loadingAction, setLoadingAction] = useState(false);
  const toast = useToast();

  const remaining = plan.total_amount - plan.paid_amount;
  const progress = plan.total_amount > 0 ? Math.round((plan.paid_amount / plan.total_amount) * 100) : 0;

  async function handleApprove() {
    setLoadingAction(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/repayment-plans/${plan.id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onApprove(plan.id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to approve");
    } finally {
      setLoadingAction(false);
    }
  }

  async function handleReject() {
    setLoadingAction(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/repayment-plans/${plan.id}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onReject(plan.id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to reject");
    } finally {
      setLoadingAction(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(44,62,80,0.5)' }}>
      <div style={{ width: '100%', maxWidth: 720, maxHeight: '90vh', overflowY: 'auto', background: '#fdfdfd', border: '1px solid #e9ecef', borderRadius: '3px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #e9ecef' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#000' }}>{plan.tenant_name}</h3>
            <p style={{ fontSize: '13px', color: '#333', marginTop: '0.2rem' }}>{plan.unit} · {plan.property}</p>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#95a5a6' }}><Icon name="x" size={18} /></button>
        </div>

        {/* Summary */}
        <div style={{ padding: '1rem 1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.8rem' }}>
          {[
            ["Total", formatAmount(plan.total_amount)],
            ["Paid", formatAmount(plan.paid_amount)],
            ["Remaining", formatAmount(remaining)],
            ["Progress", `${progress}%`],
            ["Frequency", plan.frequency],
            ["Start Date", formatDate(plan.start_date)],
          ].map(([label, val]) => (
            <div key={label} style={{ flex: '1 1 120px', background: '#f9fafb', border: '1px solid #e9ecef', padding: '0.6rem', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#333', textTransform: 'uppercase' }}>{label}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#000' }}>{val}</div>
            </div>
          ))}
        </div>

        {/* Status */}
        <div style={{ padding: '0 1.5rem 1rem' }}>
          <StatusBadge status={plan.status} />
        </div>

        {/* Action buttons */}
        {plan.status === 'pending' && (
          <div style={{ padding: '0 1.5rem 1rem', display: 'flex', gap: '0.8rem' }}>
            <button onClick={handleApprove} disabled={loadingAction} style={{ ...primaryBtnStyle, background: '#2b7a4b', borderColor: '#2b7a4b' }}>
              Approve Plan
            </button>
            <button onClick={handleReject} disabled={loadingAction} style={{ ...outlineBtnStyle, color: '#9e3a3a', borderColor: '#e5bdbd' }}>
              Reject Plan
            </button>
          </div>
        )}

        {/* Instalments */}
        <div style={{ padding: '0 1.5rem 1.5rem' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#000', marginBottom: '0.6rem' }}>Instalment Schedule</h4>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Due Date</th>
                <th style={thStyle}>Amount</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {plan.instalments.map((inst, idx) => (
                <tr key={inst.id || idx}>
                  <td style={tdStyle}>{inst.instalment_number}</td>
                  <td style={tdStyle}>{formatDate(inst.due_date)}</td>
                  <td style={tdStyle}>{formatAmount(inst.amount)}</td>
                  <td style={tdStyle}><InstalmentBadge status={inst.status} /></td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    {inst.status !== 'paid' && plan.status === 'active' && (
                      <button
                        onClick={() => onMarkPaid(plan.id, inst.id)}
                        style={{ fontSize: '12px', fontWeight: 500, color: '#2b7a4b', background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        Mark Paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function RepaymentPlans() {
  useDocumentTitle("Repayment Plans");
  const toast = useToast();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [detailPlan, setDetailPlan] = useState(null);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const [plansRes, tenantsRes] = await Promise.all([
        axios.get(`${API}/repayment-plans`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/tenants`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setPlans((plansRes.data.plans || []).map(p => ({
        id: p.id,
        tenant_id: p.tenant_id,
        tenant_name: p.tenant_name || "Unknown",
        unit: p.unit_number ? `Unit ${p.unit_number}` : "N/A",
        property: p.property_name || "Unknown",
        total_amount: Number(p.total_amount) || 0,
        paid_amount: Number(p.paid_amount) || 0,
        amount_per_period: Number(p.amount_per_period) || 0,
        frequency: p.frequency || "monthly",
        start_date: p.start_date,
        status: p.status || "active",
        note: p.note || "",
        created_at: p.created_at,
        instalments: (p.instalments || []).map(i => ({
          id: i.id,
          instalment_number: i.instalment_number,
          due_date: i.due_date,
          amount: Number(i.amount || i.amount_due || 0),
          status: i.status || "pending",
          paid_date: i.paid_date,
        })),
      })));

      setTenants((tenantsRes.data.tenants || []).map(t => ({
        id: t.id || t.tenant_id,
        name: `${t.first_name || ""} ${t.last_name || ""}`.trim(),
        unit: t.unit_number ? `Unit ${t.unit_number}` : "N/A",
        balance: Number(t.outstanding_balance || t.balance || 0),
      })));
    } catch (err) {
      console.error("Fetch plans:", err);
      setError("Unable to load repayment plans");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handlePlanCreated(newPlan) {
    setPlans(prev => [{ ...newPlan, instalments: newPlan.instalments || [] }, ...prev]);
  }
  function handlePlanApproved(id) {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, status: "active" } : p));
  }
  function handlePlanRejected(id) {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, status: "rejected" } : p));
  }

  async function handleMarkPaid(planId, instalmentId) {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/repayment-plans/${planId}/instalments/${instalmentId}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlans(prev => prev.map(p => {
        if (p.id !== planId) return p;
        const updated = p.instalments.map(i => i.id === instalmentId ? { ...i, status: "paid" } : i);
        const newPaid = updated.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
        const allDone = updated.every(i => i.status === "paid");
        return { ...p, instalments: updated, paid_amount: newPaid, status: allDone ? "completed" : p.status };
      }));
      setDetailPlan(prev => {
        if (!prev || prev.id !== planId) return prev;
        const updated = prev.instalments.map(i => i.id === instalmentId ? { ...i, status: "paid" } : i);
        const newPaid = updated.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
        return { ...prev, instalments: updated, paid_amount: newPaid };
      });
      toast.success("Instalment marked as paid!");
    } catch {
      toast.error("Failed to mark instalment as paid");
    }
  }

  const pendingCount = plans.filter(p => p.status === "pending").length;
  const activePlans = plans.filter(p => p.status === "active").length;
  const totalOwed = plans.filter(p => p.status === "active").reduce((s, p) => s + (p.total_amount - p.paid_amount), 0);

  const filteredPlans = plans.filter(p => {
    if (filter === "Pending Approval") return p.status === "pending";
    if (filter === "Active") return p.status === "active";
    if (filter === "Completed") return p.status === "completed";
    if (filter === "Defaulted") return p.status === "defaulted";
    if (filter === "Rejected") return p.status === "rejected";
    return true;
  }).filter(p => {
    const q = search.toLowerCase();
    return !q || [p.tenant_name, p.unit, p.property].some(s => (s || "").toLowerCase().includes(q));
  });

  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const paginatedPlans = filteredPlans.slice(startIdx, startIdx + pageSize);

  useEffect(() => {
    setPage(1);
  }, [filter, search, pageSize]);

  const FILTERS = ["All", "Pending Approval", "Active", "Completed", "Defaulted", "Rejected"];

  return (
    <div style={{ padding: "1rem", fontFamily: FONT, color: COLORS.text, background: "#ffffff" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } .rb-link { color: #2471a3; text-decoration: none; font-size: 14px; } .rb-link:hover { text-decoration: underline; } .rb-row:hover { background: #fafbfc; }`}</style>

      {showCreate && <CreatePlanModal tenants={tenants} onClose={() => setShowCreate(false)} onCreated={handlePlanCreated} />}
      {detailPlan && (
        <PlanDetailModal
          plan={detailPlan}
          onClose={() => setDetailPlan(null)}
          onMarkPaid={handleMarkPaid}
          onApprove={handlePlanApproved}
          onReject={handlePlanRejected}
        />
      )}

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
            List of Repayment Plans
          </h4>
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.85rem 1.1rem', gap: '1rem', flexWrap: 'wrap',
        }}>
          {/* Left side: Refresh + Create Plan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '0.6rem' }}>
            <button
              onClick={fetchData}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: '#ffffff', color: '#000', border: '1px solid #d0d1d3',
                borderRadius: '2px', padding: '0.3rem 0.6rem', fontSize: '14px',
                fontWeight: 400, cursor: 'pointer', fontFamily: FONT,
              }}
            >
              <FiRefreshCw size={14} /> Refresh
            </button>
            <button
              onClick={() => setShowCreate(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: '#ffffff', color: '#000', border: '1px solid #d0d1d3',
                borderRadius: '2px', padding: '0.3rem 0.6rem', fontSize: '14px',
                fontWeight: 400, cursor: 'pointer', fontFamily: FONT,
              }}
            >
              <FiPlus size={14} /> Create Plan
            </button>
          </div>

          {/* Right side: search, filter dropdown, page size dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ position: 'relative', width: '240px' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input
                type="text"
                placeholder="Search tenant..."
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
            <div style={{ position: 'relative' }}>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rb-select"
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
                {FILTERS.map(f => {
                  const count = f === "Pending Approval" ? pendingCount : null;
                  return (
                    <option key={f} value={f}>
                      {f}{count != null && count > 0 ? ` (${count})` : ""}
                    </option>
                  );
                })}
              </select>
              <FiChevronDown size={14} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none' }} />
            </div>

            {/* Page size dropdown */}
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="rb-select"
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

        {/* Error banner */}
        {error && <ErrorBanner message={error} onRetry={fetchData} />}

        {/* Table (unchanged) */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 0", color: "#95a5a6", gap: "0.6rem" }}>
            <span style={{ width: 20, height: 20, border: "2px solid rgba(44,62,80,0.1)", borderTopColor: "#2c3e50", borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
            Loading plans...
          </div>
        ) : (
          <>
            <div style={{ border: "1px solid #9a9d9e52", overflow: "hidden", margin: "0 1.7rem 1.7rem 1.7rem" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Tenant</th>
                    <th style={thStyle}>Total</th>
                    <th style={thStyle}>Paid</th>
                    <th style={thStyle}>Remaining</th>
                    <th style={thStyle}>Progress</th>
                    <th style={thStyle}>Frequency</th>
                    <th style={thStyle}>Status</th>
                    <th style={{ ...thStyle, textAlign: "center" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPlans.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ ...tdStyle, textAlign: "center", padding: "2.5rem", color: "#95a5a6" }}>
                        No plans found.
                      </td>
                    </tr>
                  ) : (
                    paginatedPlans.map(p => {
                      const remaining = p.total_amount - p.paid_amount;
                      const progress = p.total_amount > 0 ? Math.round((p.paid_amount / p.total_amount) * 100) : 0;
                      return (
                        <tr key={p.id} className="rb-row">
                          <td style={tdStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#eaf2f8", color: "#2471a3", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 600, flexShrink: 0 }}>
                                {initials(p.tenant_name)}
                              </div>
                              <div>
                                <div style={{ fontWeight: 500, fontSize: "13px" }}>{p.tenant_name}</div>
                                <div style={{ fontSize: "11px", color: "#6c757d" }}>{p.unit} · {p.property}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 500 }}>{formatAmount(p.total_amount)}</td>
                          <td style={{ ...tdStyle, color: "#2b7a4b" }}>{formatAmount(p.paid_amount)}</td>
                          <td style={{ ...tdStyle, fontWeight: 500, color: remaining > 0 ? "#9e3a3a" : "#2b7a4b" }}>
                            {remaining > 0 ? formatAmount(remaining) : "Settled"}
                          </td>
                          <td style={tdStyle}>
                            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                              <div style={{ flex: 1, height: 4, background: "#f1f3f5", overflow: "hidden", minWidth: 50 }}>
                                <div style={{ height: 4, background: progress === 100 ? "#2b7a4b" : "#8b6e1a", width: `${progress}%` }} />
                              </div>
                              <span style={{ fontSize: "11px", fontWeight: 500, color: "#6c757d" }}>{progress}%</span>
                            </div>
                          </td>
                          <td style={{ ...tdStyle, textTransform: "capitalize" }}>{p.frequency}</td>
                          <td style={tdStyle}><StatusBadge status={p.status} /></td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <button
                              onClick={() => setDetailPlan(p)}
                              style={{ fontSize: "12px", fontWeight: 500, color: "#1a73e8", background: "none", border: "none", cursor: "pointer" }}
                            >
                              {p.status === "pending" ? "Review" : "View"}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination - right aligned */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.3rem", padding: "0 1.7rem 1.7rem", marginTop: "-1.5rem" }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  style={{ padding: "0.2rem 0.5rem", border: "1px solid #d0d1d3", background: "#fdfdfd", color: "#000", cursor: "pointer", fontSize: "13px", borderRadius: "2px" }}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: "0.2rem 0.5rem",
                      border: p === currentPage ? "1px solid #2c3e50" : "1px solid #d0d1d3",
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
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  style={{ padding: "0.2rem 0.5rem", border: "1px solid #d0d1d3", background: "#fdfdfd", color: "#000", cursor: "pointer", fontSize: "13px", borderRadius: "2px" }}
                >
                  ›
                </button>
              </div>
            )}

            {/* Footer info  */}
            <div style={{ display: "flex", justifyContent: "flex-end", padding: "0 1.7rem 1.7rem", fontSize: "13px", color: "#7f8c8d", marginTop: "-1.5rem" }}>
              Showing {paginatedPlans.length} of {filteredPlans.length} plans
            </div>
          </>
        )}
      </div>
    </div>
  );
}