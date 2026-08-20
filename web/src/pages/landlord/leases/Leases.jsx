/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { FiChevronRight, FiSearch, FiRefreshCw, FiEdit, FiX, FiAlertTriangle } from "react-icons/fi";
import { FaPlus } from "react-icons/fa";
import { c as COLORS } from "../../../styles/theme";

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

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

function formatAmount(n) {
  return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—";
}
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}
function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - Date.now()) / 86400000);
}

function LeaseStatusBadge({ lease }) {
  const status = lease.status || "active";
  const days = daysUntil(lease.end_date);
  const now = new Date();
  const end = new Date(lease.end_date);
  const isExpired = end < now;
  const isExpiringSoon = !isExpired && days !== null && days <= 60;

  if (status === "terminated") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "0.3rem",
        fontSize: "12px", fontWeight: 500, padding: "0.15rem 0.6rem",
        borderRadius: "12px", color: "#6a6a6a", background: "#f2f2f2", border: "1px solid #d0d0d0",
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7a7a7a" }} /> Terminated
      </span>
    );
  }
  if (status === "cancelled") {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "0.3rem",
        fontSize: "12px", fontWeight: 500, padding: "0.15rem 0.6rem",
        borderRadius: "12px", color: "#6a6a6a", background: "#f5f5f5", border: "1px solid #e0e0e0",
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7a7a7a" }} /> Cancelled
      </span>
    );
  }
  if (status === "expired" || isExpired) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "0.3rem",
        fontSize: "12px", fontWeight: 500, padding: "0.15rem 0.6rem",
        borderRadius: "12px", color: "#9e3a3a", background: "#fbeaea", border: "1px solid #e5bdbd",
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#9e3a3a" }} /> Expired
      </span>
    );
  }
  if (isExpiringSoon) {
    return (
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "0.3rem",
        fontSize: "12px", fontWeight: 500, padding: "0.15rem 0.6rem",
        borderRadius: "12px", color: "#8b6e1a", background: "#faf6ed", border: "1px solid #e5dbb8",
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#8b6e1a" }} /> {days}d left
      </span>
    );
  }
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      fontSize: "12px", fontWeight: 500, padding: "0.15rem 0.6rem",
      borderRadius: "12px", color: "#2b7a4b", background: "#eef5e8", border: "1px solid #c5d9b8",
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2b7a4b" }} /> Active
    </span>
  );
}

function RenewalModal({ lease, onClose, onConfirm }) {
  const [newLeaseEnd, setNewLeaseEnd] = useState("");
  const [newRent, setNewRent] = useState(String(lease.rent_amount || ""));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const rentChanged = Number(newRent) !== Number(lease.rent_amount);

  function validate() {
    const e = {};
    if (!newLeaseEnd) e.newLeaseEnd = "Required";
    if (!newRent.trim()) e.newRent = "Required";
    if (newLeaseEnd && lease.end_date && new Date(newLeaseEnd) <= new Date(lease.end_date))
      e.newLeaseEnd = "Must be after current lease end";
    return e;
  }

  function handleConfirm() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => {
      onConfirm(lease.id, { leaseEnd: newLeaseEnd, rentAmount: Number(newRent) });
      setLoading(false);
      onClose();
    }, 1000);
  }

  const inputStyle = (error) => ({
    width: '100%',
    fontSize: '14px',
    padding: '0.4rem 0.7rem',
    borderRadius: '2px',
    background: "#fdfdfd",
    border: `1px solid ${error ? '#e5bdbd' : '#dee2e6'}`,
    color: "#000",
    fontFamily: FONT,
    outline: 'none',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(44,62,80,0.5)' }}>
      <div style={{ width: '100%', maxWidth: 420, background: "#fdfdfd", border: '1px solid #e9ecef', borderRadius: '3px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.2rem', borderBottom: '1px solid #e9ecef', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: '6px', background: '#eef5e8', border: '1px solid #c5d9b8', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FiRefreshCw size={15} color="#2b7a4b" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 500, color: "#000" }}>Renew Lease</h3>
              <p style={{ fontSize: '12px', color: '#333' }}>{lease.tenant_name} · {lease.unit_number ? `Unit ${lease.unit_number}` : "N/A"}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#555' }}>
            <FiX size={16} />
          </button>
        </div>
        <div style={{ padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div style={{ borderRadius: '2px', border: '1px solid #e9ecef', overflow: 'hidden' }}>
            {[
              ["Current Lease End", formatDate(lease.end_date)],
              ["Current Rent", formatAmount(lease.rent_amount)],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0.7rem', background: '#f9fafb', borderBottom: '1px solid #e9ecef' }}>
                <span style={{ fontSize: '13px', color: '#333' }}>{label}</span>
                <span style={{ fontSize: '13px', fontWeight: 500, color: "#000" }}>{val}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>
              New Lease End Date{errors.newLeaseEnd && <span style={{ color: "#9e3a3a", marginLeft: '0.3rem' }}>— {errors.newLeaseEnd}</span>}
            </label>
            <input type="date" value={newLeaseEnd} onChange={e => { setNewLeaseEnd(e.target.value); setErrors(er => ({ ...er, newLeaseEnd: undefined })); }} style={inputStyle(errors.newLeaseEnd)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>
              Monthly Rent (R){errors.newRent && <span style={{ color: "#9e3a3a", marginLeft: '0.3rem' }}>— {errors.newRent}</span>}
            </label>
            <input type="number" min="0" value={newRent} onChange={e => { setNewRent(e.target.value); setErrors(er => ({ ...er, newRent: undefined })); }} style={inputStyle(errors.newRent)} />
            {rentChanged && Number(newRent) > 0 && (
              <p style={{ fontSize: '12px', color: "#8b6e1a", marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <FiEdit size={10} /> Rent will change from {formatAmount(lease.rent_amount)} → {formatAmount(Number(newRent))}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', padding: '0.4rem 0.6rem', borderRadius: '2px', background: '#eef5e8', border: '1px solid #c5d9b8' }}>
            <FiRefreshCw size={12} color="#2b7a4b" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '12px', color: '#2b7a4b' }}>The tenant will be notified of their renewal on the mobile app.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '0.9rem 1.2rem 1.2rem', borderTop: '1px solid #e9ecef', flexShrink: 0 }}>
          <button onClick={onClose} disabled={loading} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            background: "#fdfdfd", color: "#000",
            border: '1px solid #ccc', padding: '0.3rem 0.6rem', fontSize: '14px', fontWeight: 400,
            cursor: 'pointer', borderRadius: '2px', flex: 1,
          }}>Cancel</button>
          <button onClick={handleConfirm} disabled={loading} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            background: '#2b7a4b', color: '#ffffff', border: '1px solid #2b7a4b',
            padding: '0.3rem 0.6rem', fontSize: '14px', fontWeight: 500,
            cursor: 'pointer', borderRadius: '2px', flex: 1,
          }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <><FiRefreshCw size={13} /> Renew Lease</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function TerminateModal({ lease, onClose, onConfirm }) {
  const [terminationDate, setTerminationDate] = useState(new Date().toISOString().slice(0, 10));
  const [terminationReason, setTerminationReason] = useState("");
  const [terminationNotes, setTerminationNotes] = useState("");
  const [vacateDate, setVacateDate] = useState("");
  const [loading, setLoading] = useState(false);

  function handleConfirm() {
    setLoading(true);
    setTimeout(() => {
      onConfirm(lease.id, {
        termination_date: terminationDate,
        termination_reason: terminationReason,
        termination_notes: terminationNotes,
        vacate_date: vacateDate,
      });
      setLoading(false);
      onClose();
    }, 1000);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(44,62,80,0.5)' }}>
      <div style={{ width: '100%', maxWidth: 460, background: "#fdfdfd", border: '1px solid #e9ecef', borderRadius: '3px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.2rem', borderBottom: '1px solid #e9ecef', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: '6px', background: '#fbeaea', border: '1px solid #e5bdbd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <FiAlertTriangle size={15} color="#9e3a3a" />
            </div>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 500, color: "#000" }}>Terminate Lease</h3>
              <p style={{ fontSize: '12px', color: '#333' }}>{lease.tenant_name} · {lease.unit_number ? `Unit ${lease.unit_number}` : "N/A"}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#555' }}>
            <FiX size={16} />
          </button>
        </div>

        <div style={{ padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <p style={{ fontSize: '13px', color: '#333' }}>
            You are terminating this lease. Please provide the details below.
          </p>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#333', marginBottom: '0.3rem' }}>Termination Date</label>
              <input
                type="date"
                value={terminationDate}
                onChange={e => setTerminationDate(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '14px',
                  padding: '0.4rem 0.7rem',
                  borderRadius: '2px',
                  background: "#fdfdfd",
                  border: '1px solid #dee2e6',
                  color: "#000",
                  fontFamily: FONT,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#333', marginBottom: '0.3rem' }}>Vacate Date (optional)</label>
              <input
                type="date"
                value={vacateDate}
                onChange={e => setVacateDate(e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '14px',
                  padding: '0.4rem 0.7rem',
                  borderRadius: '2px',
                  background: "#fdfdfd",
                  border: '1px solid #dee2e6',
                  color: "#000",
                  fontFamily: FONT,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>
              Termination Reason
            </label>
            <select
              value={terminationReason}
              onChange={e => setTerminationReason(e.target.value)}
              style={{
                width: '100%',
                fontSize: '14px',
                padding: '0.4rem 0.7rem',
                borderRadius: '2px',
                background: "#fdfdfd",
                border: '1px solid #dee2e6',
                color: "#000",
                fontFamily: FONT,
                outline: 'none',
              }}
            >
              <option value="">Select a reason</option>
              <option value="non_payment">Non‑Payment</option>
              <option value="lease_end">Lease End</option>
              <option value="mutual_agreement">Mutual Agreement</option>
              <option value="breach_of_contract">Breach of Contract</option>
              <option value="property_damage">Property Damage</option>
              <option value="owner_use">Owner Use</option>
              <option value="renovation">Renovation</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>
              Termination Notes (optional)
            </label>
            <textarea
              rows={2}
              value={terminationNotes}
              onChange={e => setTerminationNotes(e.target.value)}
              placeholder="Any additional notes..."
              style={{
                width: '100%',
                fontSize: '14px',
                padding: '0.4rem 0.7rem',
                borderRadius: '2px',
                background: "#fdfdfd",
                border: '1px solid #dee2e6',
                color: "#000",
                fontFamily: FONT,
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', padding: '0.9rem 1.2rem 1.2rem', borderTop: '1px solid #e9ecef', flexShrink: 0 }}>
          <button onClick={onClose} disabled={loading} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            background: "#fdfdfd", color: "#000",
            border: '1px solid #ccc', padding: '0.3rem 0.6rem', fontSize: '14px', fontWeight: 400,
            cursor: 'pointer', borderRadius: '2px', flex: 1,
          }}>Cancel</button>
          <button onClick={handleConfirm} disabled={loading || !terminationReason} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            background: '#9e3a3a', color: '#ffffff', border: '1px solid #9e3a3a',
            padding: '0.3rem 0.6rem', fontSize: '14px', fontWeight: 500,
            cursor: 'pointer', borderRadius: '2px', flex: 1,
            opacity: terminationReason ? 1 : 0.5,
          }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <><FiX size={13} /> Terminate</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Leases() {
  useDocumentTitle("Leases");
  const navigate = useNavigate();
  const toast = useToast();

  const [leases, setLeases] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [renewalLease, setRenewalLease] = useState(null);
  const [terminateLease, setTerminateLease] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchLeases = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/leases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mapped = (data.leases || []).map(l => ({
        id: l.id,
        tenant_id: l.tenant_id,
        tenant_name: l.tenant_name || `${l.first_name || ""} ${l.last_name || ""}`.trim(),
        unit_id: l.unit_id,
        unit_number: l.unit_number,
        property_name: l.property_name || "Unknown",
        start_date: l.lease_start_date || l.start_date,
        end_date: l.lease_end_date || l.end_date,
        rent_amount: Number(l.rent_amount) || 0,
        frequency: l.payment_frequency || "monthly",
        payment_due_day: l.payment_due_day || 1,
        type: l.lease_type || "fixed",
        status: l.status || l.lease_status || "active",
        balance_due: l.balance_due ?? l.outstanding_balance ?? null, 
        deposit_held: l.deposit_held ?? null, 
      }));
      setLeases(mapped);
    } catch (err) {
      console.error("Failed to fetch leases:", err);
      setError(err.response?.data?.error || "Unable to load leases. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchLeases(); }, [fetchLeases]);

  function handleRefresh() {
    setRefreshing(true);
    fetchLeases(true);
  }

  async function handleRenew(id, data) {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/leases/${id}/renew`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeases(prev => prev.map(l => l.id === id ? { ...l, end_date: data.leaseEnd, rent_amount: data.rentAmount, status: "active" } : l));
      toast.success("Lease renewed!");
    } catch (err) {
      toast.error("Failed to renew lease.");
    } finally {
      setSaving(false);
      setRenewalLease(null);
    }
  }

  async function handleTerminate(id, data) {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/leases/${id}/terminate`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeases(prev => prev.map(l => l.id === id ? { ...l, status: "terminated", end_date: data.termination_date } : l));
      toast.success("Lease terminated.");
    } catch (err) {
      toast.error("Failed to terminate lease.");
    } finally {
      setSaving(false);
      setTerminateLease(null);
    }
  }

  const now = new Date();
  const filtered = leases.filter(l => {
    const end = new Date(l.end_date);
    const days = daysUntil(l.end_date);
    const isExpired = end < now;
    const isExpiringSoon = !isExpired && days !== null && days <= 60;
    const isMonthToMonth = l.type === "month_to_month";

    if (filter === "All") return true;
    if (filter === "Active") return !isExpired && !isMonthToMonth && !isExpiringSoon && l.status === "active";
    if (filter === "Expiring Soon") return !isExpired && isExpiringSoon && l.status === "active";
    if (filter === "Expired") return isExpired && l.status !== "terminated" && l.status !== "cancelled";
    if (filter === "Month-to-Month") return isMonthToMonth && l.status === "active";
    if (filter === "Terminated") return l.status === "terminated";
    if (filter === "Cancelled") return l.status === "cancelled";
    return true;
  }).filter(l => {
    const q = search.toLowerCase();
    if (!q) return true;
    return [l.tenant_name, l.unit_number?.toString(), l.property_name]
      .some(s => (s || "").toLowerCase().includes(q));
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedLeases = filtered.slice(startIndex, startIndex + pageSize);

  useEffect(() => { setPage(1); }, [filter, search, pageSize]);

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
    <div style={{ fontFamily: FONT, color: "#000", background: "#ffffff", fontSize: "14px" }}>
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
        <Link to="/landlord/dashboard" className="rb-link">Dashboard</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>Leases</span>
      </div>

      {/* Main card */}
      <div style={{
        background: "#fdfdfd",
        border: "1px solid #dfe3e8",
        borderRadius: "3px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}>
        {/* Card header */}
        <div style={{
          background: "#f7f8fa",
          padding: "0.4rem 0 0.2rem 0.7rem",
          borderBottom: '3px solid #3498db',
        }}>
          <h4 style={{
            fontSize: "16px",
            color: "#000",
            fontFamily: FONT,
            background: "transparent",
            margin: 0,
          }}>
            List of Leases
          </h4>
        </div>

        {/* Toolbar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.85rem 1.1rem",
          gap: "1rem",
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginLeft: "0.6rem" }}>
            <button
              onClick={() => navigate('/landlord/leases/create')}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "#ffffff",
                color: "#000",
                border: "1px solid #d0d1d3",
                borderRadius: "2px",
                padding: "0.3rem 0.6rem",
                fontSize: "14px",
                fontWeight: 400,
                cursor: "pointer",
                fontFamily: FONT,
              }}
            >
              <FaPlus size={14} />
              Add a lease
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              style={outlineBtnStyle}
            >
              <FiRefreshCw size={14} /> {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ position: "relative", width: "260px" }}>
              <FiSearch size={14} style={{
                position: "absolute",
                top: "50%",
                left: "0.6rem",
                transform: "translateY(-50%)",
                color: "#555",
              }} />
              <input
                type="text"
                value={search}
                placeholder="Search leases...."
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: "0.3rem 0.75rem 0.3rem 2rem",
                  fontSize: "14px",
                  border: "1px solid #d0d1d3",
                  borderRadius: "2px",
                  width: "260px",
                  fontFamily: FONT,
                  color: "#000",
                  outline: "none",
                }}
              />
            </div>

            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.3rem 1.5rem 0.3rem 0.4rem', background: '#fdfdfd', color: '#000', fontFamily: FONT }}
            >
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Expiring Soon">Expiring Soon</option>
              <option value="Expired">Expired</option>
              <option value="Terminated">Terminated</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              style={{ border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.3rem 1.5rem 0.3rem 0.4rem', background: '#fdfdfd', color: '#000', fontFamily: FONT }}
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
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#555" }}>
            <span style={{
              width: 20,
              height: 20,
              border: "2px solid rgba(44,62,80,0.1)",
              borderTopColor: "#2c3e50",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
              display: "inline-block",
            }} />
            <span style={{ marginLeft: "0.5rem" }}>Loading leases...</span>
          </div>
        ) : error ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
            <p style={{ color: "#c0392b" }}>{error}</p>
            <button
              onClick={() => fetchLeases()}
              style={{
                background: 'transparent', color: '#2471a3', border: 'none',
                cursor: 'pointer', textDecoration: 'underline',
              }}
            >
              Try again
            </button>
          </div>
        ) : paginatedLeases.length === 0 ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#555" }}>
            <p>{search ? "No leases match your search" : "No leases yet"}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", margin: "0 1.7rem 1.7rem 1.7rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}></th>
                  <th style={thStyle}>Property/Tenant</th>
                  <th style={thStyle}>Lease details</th>
                  <th style={thStyle}>Financials</th>
                  <th style={thStyle}>State</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLeases.map((l, i) => {
                  const remaining = daysUntil(l.end_date);
                  const isExpired = remaining !== null && remaining < 0;
                  const canTerminate = !isExpired && l.status === "active";
                  const canRenew = isExpired || (remaining !== null && remaining <= 60 && l.status === "active");
                  const leaseId = `LEA${String((currentPage - 1) * pageSize + i + 1).padStart(6, "0")}`;

                  return (
                    <tr key={l.id} className="rb-row">
                      <td style={tdStyle}>
                        <Link to={`/landlord/leases/${l.id}`} style={{ fontWeight: 600, color: "#2471a3", textDecoration: "none", fontSize: "13px" }}>
                          {leaseId}
                        </Link>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>{l.property_name}</div>
                        <div style={{ marginTop: "2px" }}>{l.tenant_name || "—"}</div>
                      </td>
                      <td style={tdStyle}>
                        <div>Term: {formatDate(l.start_date)} to {formatDate(l.end_date)}</div>
                        <div style={{ fontSize: "11px", marginTop: "2px" }}>
                          Rental: {formatAmount(l.rent_amount)}
                          {l.frequency === "monthly" ? "/mo" : "/wk"}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div>Due day: {l.payment_due_day || 1}</div>
                        {l.balance_due != null ? (
                          <div style={{ fontSize: "11px", marginTop: "2px" }}>
                            Balance due: {formatAmount(l.balance_due)}
                          </div>
                        ) : (
                          <div style={{ fontSize: "11px", marginTop: "2px", color: "#95a5a6" }}>No balance data</div>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <LeaseStatusBadge lease={l} />
                      </td>
                      <td style={{ ...tdStyle, textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "0.35rem", justifyContent: "center" }}>
                          {canRenew && (
                            <button
                              onClick={() => setRenewalLease(l)}
                              style={{
                                fontSize: '12px',
                                fontWeight: 500,
                                color: '#2b7a4b',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                              }}
                              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                            >
                              Renew
                            </button>
                          )}
                          {canTerminate && (
                            <button
                              onClick={() => setTerminateLease(l)}
                              style={{
                                fontSize: '12px',
                                fontWeight: 500,
                                color: '#9e3a3a',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                marginLeft: '0.3rem',
                              }}
                              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                            >
                              Terminate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with pagination */}
        {!loading && paginatedLeases.length > 0 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 1.7rem 1.7rem",
            marginTop: "-1.5rem",
            fontSize: "13px",
            color: "#333",
          }}>
            <span>
              Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} leases
            </span>
            {totalPages > 1 && (
              <div style={{ display: "flex", gap: "0.3rem" }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  style={{ padding: "0.2rem 0.5rem", border: "1px solid #d0d1d3", background: "#fdfdfd", cursor: "pointer", fontSize: "13px", borderRadius: "2px", color: "#000" }}
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
                  style={{ padding: "0.2rem 0.5rem", border: "1px solid #d0d1d3", background: "#fdfdfd", cursor: "pointer", fontSize: "13px", borderRadius: "2px", color: "#000" }}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Renewal modal */}
      {renewalLease && (
        <RenewalModal
          lease={renewalLease}
          onClose={() => setRenewalLease(null)}
          onConfirm={handleRenew}
        />
      )}

      {/* Terminate modal */}
      {terminateLease && (
        <TerminateModal
          lease={terminateLease}
          onClose={() => setTerminateLease(null)}
          onConfirm={handleTerminate}
        />
      )}
    </div>
  );
}