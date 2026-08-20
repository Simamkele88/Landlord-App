/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import {
  FiChevronRight, FiFileText, FiDollarSign, FiUser, FiHome,
  FiCreditCard, FiRefreshCw, FiX,
} from "react-icons/fi";
import { FaCreditCard } from "react-icons/fa6";
import { IoMdCash } from "react-icons/io";
import UseDepositModal from "../../../components/UseDepositModal";

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const depositStatusConfig = {
  "paid": { color: "#1e4a6b", bg: "#e8f0f5", border: "1px solid #b0cfe0", dot: "#2c6b9b", label: "Held" },
  "partially_refunded": { color: "#5b4a0b", bg: "#faf6ed", border: "1px solid #e5dbb8", dot: "#8b6e1a", label: "Partially Refunded" },
  "fully_refunded": { color: "#1a4a30", bg: "#eef5e8", border: "1px solid #c5d9b8", dot: "#2b7a4b", label: "Refunded" },
  "forfeited": { color: "#7a2b2b", bg: "#fbeaea", border: "1px solid #e5bdbd", dot: "#9e3a3a", label: "Forfeited" },
  "unpaid": { color: "#6a6a6a", bg: "#f5f5f5", border: "1px solid #e0e0e0", dot: "#7a7a7a", label: "Unpaid" },
};

function formatAmount(n) {
  return n === null || n === undefined || n === "" ? "—" : `R ${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function InfoRow({ label, children, compact }) {
  const labelWidth = compact ? "110px" : "150px";
  return (
    <div style={{
      display: 'flex', overflow: 'hidden', border: '1px solid #e2e3e4',
      marginBottom: '0.4rem', fontSize: '14px', fontWeight: 400,
      flex: compact ? 1 : undefined,
    }}>
      <div style={{
        width: labelWidth, flexShrink: 0, padding: '0.4rem 0.6rem',
        color: '#000', fontWeight: 500, background: '#fdfdfd',
        borderRight: '1px solid #e9ecef', display: 'flex', alignItems: 'center',
      }}>
        {label}
      </div>
      <div style={{
        padding: '0.4rem 0.6rem', color: '#000', background: '#f5f5f5',
        flex: 1, display: 'flex', alignItems: 'center', fontWeight: 400,
      }}>
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = depositStatusConfig[status] ?? depositStatusConfig["unpaid"];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '12px',
      fontWeight: 500, padding: '0.15rem 0.6rem', color: cfg.color, background: cfg.bg,
      border: cfg.border, borderRadius: '12px',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

const thStyle = {
  padding: '0.6rem 0.8rem', fontSize: '12px', fontWeight: 600, color: '#000',
  textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e9eced52',
  border: '1px solid #9a9d9e52', textAlign: 'left', whiteSpace: 'nowrap',
};
const tdStyle = {
  padding: '0.6rem 0.8rem', fontSize: '12px', color: '#151515',
  border: '1px solid #9a9d9e52', verticalAlign: 'middle', fontWeight: 400,
  background: '#e9eced52',
};

const outlineBtnStyle = {
  display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
  background: '#fdfdfd', color: '#000', border: '1px solid #ccc',
  padding: '0.3rem 0.7rem', fontSize: '14px', fontWeight: 400,
  cursor: 'pointer', borderRadius: '2px',
};

function RefundDepositModal({ deposit, onClose, onSuccess }) {
  const heldAmount = Number(deposit?.amount_held ?? deposit?.amount ?? 0);
  const alreadyRefunded = Number(deposit?.amount_refunded ?? 0);
  const remaining = Math.max(heldAmount - alreadyRefunded, 0);

  const [amount, setAmount] = useState(remaining > 0 ? String(remaining) : "");
  const [deductionReason, setDeductionReason] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

  const numericAmount = Number(amount);
  const exceedsRemaining = amount !== "" && !Number.isNaN(numericAmount) && numericAmount > remaining + 0.01;
  const isPartial = amount !== "" && !Number.isNaN(numericAmount) && numericAmount > 0 && numericAmount < remaining - 0.01;
  const isValid = amount !== "" && !Number.isNaN(numericAmount) && numericAmount > 0 && !exceedsRemaining;

  async function handleSubmit() {
    if (!isValid) {
      setError(exceedsRemaining ? `Amount can't exceed the remaining held balance of ${formatAmount(remaining)}` : "Enter a valid amount");
      return;
    }
    if (isPartial && !deductionReason.trim()) {
      setError("Add a reason for the deduction on a partial refund");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/landlord/payments/deposits/${deposit.id}/refund`, {
        amount: numericAmount,
        deduction_reason: isPartial ? deductionReason : null,
        notes: notes || undefined,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`Refund of ${formatAmount(numericAmount)} recorded.`);
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to record refund. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(44,62,80,0.5)' }}>
      <div style={{ width: '100%', maxWidth: 460, background: '#fdfdfd', border: '1px solid #e9ecef', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #e9ecef' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#2c3e50' }}>Refund Deposit</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#95a5a6' }}><FiX size={18} /></button>
        </div>
        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ background: '#f9fafb', border: '1px solid #e9ecef', padding: '0.8rem' }}>
            <p style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '0.3rem' }}>TENANT</p>
            <p style={{ fontSize: '15px', fontWeight: 500, color: '#2c3e50' }}>{deposit?.tenant_name || "Unknown"}</p>
            <p style={{ fontSize: '13px', color: '#7f8c8d' }}>Unit {deposit?.unit_number || "—"} · Held: {formatAmount(heldAmount)}
              {alreadyRefunded > 0 && ` · Already refunded: ${formatAmount(alreadyRefunded)}`}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#7f8c8d', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Refund Amount (ZAR)</label>
            <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setError(""); }}
              min="0" max={remaining || undefined} step="0.01"
              style={{ width: '100%', fontSize: '18px', fontWeight: 500, padding: '0.5rem 0.8rem', background: '#fdfdfd', border: `1px solid ${exceedsRemaining ? '#c0392b' : '#dee2e6'}`, color: '#2c3e50', outline: 'none' }} />
            <span style={{ fontSize: '12.5px', color: exceedsRemaining ? '#c0392b' : '#95a5a6' }}>
              Remaining held: {formatAmount(remaining)}
            </span>
          </div>

          {isPartial && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#7f8c8d', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Reason for deduction</label>
              <input type="text" value={deductionReason} onChange={e => setDeductionReason(e.target.value)}
                placeholder="e.g. Carpet cleaning, unpaid utilities"
                style={{ width: '100%', fontSize: '14px', padding: '0.5rem 0.8rem', background: '#fdfdfd', border: '1px solid #dee2e6', color: '#2c3e50', outline: 'none' }} />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#7f8c8d', letterSpacing: '0.04em', textTransform: 'uppercase' }}>Notes <span style={{ color: '#95a5a6', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              style={{ width: '100%', fontSize: '14px', padding: '0.5rem 0.8rem', background: '#fdfdfd', border: '1px solid #dee2e6', color: '#2c3e50', outline: 'none', resize: 'vertical', minHeight: 60 }} />
          </div>
          {error && <p style={{ fontSize: '13px', color: '#c0392b' }}>{error}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: '1px solid #e9ecef' }}>
          <button onClick={onClose} disabled={loading} style={{ ...outlineBtnStyle, flex: 1, justifyContent: 'center' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !isValid} style={{
            flex: 1, padding: '0.5rem 1.2rem', fontSize: '15px', fontWeight: 500, border: 'none', cursor: 'pointer',
            background: '#1a4a30', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            opacity: !isValid ? 0.5 : 1,
          }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : (isPartial ? "Record Partial Refund" : "Record Refund")}
          </button>
        </div>
      </div>
    </div>
  );
}

function DepositInvoiceModal({ deposit, onClose, onSuccess }) {
  const toast = useToast();
  const [amount, setAmount] = useState(deposit ? String(Number(deposit.amount_held ?? deposit.amount ?? 0)) : "");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!amount || !dueDate) {
      setError("Please fill all required fields.");
      return;
    }
    setLoading(true);
    setError("");
    axios.post(`${API}/landlord/payments/deposit-invoice`, {
      lease_id: deposit.lease_id,
      amount: Number(amount),
      due_date: dueDate,
      notes: notes || undefined,
    }, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then(() => {
        toast.success("Deposit invoice created.");
        onSuccess();
        onClose();
      })
      .catch(err => {
        setError(err.response?.data?.error || "Failed to create deposit invoice");
      })
      .finally(() => setLoading(false));
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(44,62,80,0.5)' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#fdfdfd', border: '1px solid #e9ecef', borderRadius: '3px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #e9ecef' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#000' }}>Create Deposit Invoice</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#95a5a6' }}><FiX size={18} /></button>
        </div>
        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ background: '#f9fafb', border: '1px solid #e9ecef', padding: '0.8rem' }}>
            <p style={{ fontSize: '12px', color: '#333', marginBottom: '0.3rem' }}>TENANT</p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#000' }}>{deposit.tenant_name || "Unknown"}</p>
            <p style={{ fontSize: '12px', color: '#333' }}>Unit {deposit.unit_number || "—"} • Lease #{deposit.lease_id}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>Amount (R)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                style={{ width: '100%', padding: '0.4rem 0.7rem', fontSize: '14px', background: '#fdfdfd', border: '1px solid #dee2e6', color: '#000', outline: 'none', borderRadius: '2px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>Due Date</label>
              <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                style={{ width: '100%', padding: '0.4rem 0.7rem', fontSize: '14px', background: '#fdfdfd', border: '1px solid #dee2e6', color: '#000', outline: 'none', borderRadius: '2px' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>Notes (optional)</label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              style={{ width: '100%', padding: '0.4rem 0.7rem', fontSize: '14px', background: '#fdfdfd', border: '1px solid #dee2e6', color: '#000', outline: 'none', resize: 'vertical', borderRadius: '2px' }} />
          </div>
          {error && <p style={{ fontSize: '13px', color: '#9e3a3a' }}>{error}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: '1px solid #e9ecef' }}>
          <button onClick={onClose} disabled={loading} style={{ ...outlineBtnStyle, flex: 1, justifyContent: 'center' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 1, padding: '0.4rem', borderRadius: '2px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer',
            background: '#2c3e50', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : "Create Invoice"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DepositDetailPage() {
  useDocumentTitle("Deposit Details");
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [deposit, setDeposit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refundDeposit, setRefundDeposit] = useState(null);
  const [depositInvoice, setDepositInvoice] = useState(null);
  const [useDeposit, setUseDeposit] = useState(null);
  const [depositLoading, setDepositLoading] = useState(false);

  const fetchDeposit = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/landlord/payments/deposits/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDeposit(data.deposit || data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load deposit");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDeposit();
  }, [fetchDeposit]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '4rem 2rem', color: '#555', fontFamily: FONT }}>
        <span style={{ width: 22, height: 22, border: '2px solid rgba(44,62,80,0.1)', borderTopColor: '#2c3e50', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
        <span style={{ fontSize: '14px' }}>Loading deposit...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !deposit) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', fontFamily: FONT }}>
        <p style={{ fontSize: '14px', color: '#c0392b', marginBottom: '0.8rem' }}>{error || "Deposit not found"}</p>
        <button onClick={fetchDeposit} style={{ background: 'transparent', color: '#2471a3', border: 'none', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>
          Try again
        </button>
      </div>
    );
  }

  const heldAmount = Number(deposit.amount_held ?? deposit.amount ?? 0);
  const refundedAmount = Number(deposit.amount_refunded ?? 0);
  const usedAmount = Number(deposit.used_amount ?? 0);
  const available = Math.max(heldAmount - refundedAmount - usedAmount, 0);

  const canRefund = (deposit.status === 'paid' || deposit.status === 'partially_refunded') && available > 0;
  const canUse = canRefund; 
  const canInvoice = (deposit.status === 'paid' || deposit.status === 'partially_refunded') && deposit.lease_id;

  return (
    <div style={{ fontSize: '14px', fontWeight: 400, fontFamily: FONT, color: '#000' }}>
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
        <Link to="/landlord/payments" className="rb-link">Payments</Link>
        <span style={{ color: '#555' }}>/</span>
        <Link to="/landlord/payments/deposits" className="rb-link">Deposits</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>{deposit.tenant_name}</span>
      </div>

      {/* Main card */}
      <div style={{
        background: '#fdfdfd', border: '1px solid #dfe3e8', borderRadius: '3px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.2rem', borderBottom: '2px solid #3498db',
          background: '#f7f8fa',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FiFileText size={18} color="#2c3e50" />
            <h4 style={{ fontSize: '16px', fontWeight: 500, margin: 0, color: '#000' }}>
              Deposit 
            </h4>
          </div>
          <StatusBadge status={deposit.status} />
        </div>

        {/* Body */}
        <div style={{ padding: '1.2rem' }}>
          {/* Summary Info Rows */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <InfoRow label="Tenant" compact>
              <Link to={`/landlord/tenants/${deposit.tenant_id}`} className="rb-link">{deposit.tenant_name || "—"}</Link>
            </InfoRow>
            <InfoRow label="Unit" compact>{deposit.unit_number ? `Unit ${deposit.unit_number}` : "—"}</InfoRow>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <InfoRow label="Property" compact>{deposit.property_name || "—"}</InfoRow>
            <InfoRow label="Date Held" compact>{fmtDate(deposit.date_held)}</InfoRow>
          </div>

          {/* Amount Cards */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, minWidth: 150, border: '1px solid #ccc', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ padding: '0.6rem', borderBottom: '2px solid #3498db', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FaCreditCard size={15} /> Held
              </div>
              <div style={{ padding: '0.8rem', textAlign: 'center', fontSize: '18px', fontWeight: 600 }}>
                {formatAmount(heldAmount)}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 150, border: '1px solid #ccc', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ padding: '0.6rem', borderBottom: '2px solid #3498db', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IoMdCash size={15} /> Refunded
              </div>
              <div style={{ padding: '0.8rem', textAlign: 'center', fontSize: '18px', fontWeight: 600 }}>
                {formatAmount(refundedAmount)}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 150, border: '1px solid #ccc', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ padding: '0.6rem', borderBottom: '2px solid #3498db', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IoMdCash size={15} /> Used
              </div>
              <div style={{ padding: '0.8rem', textAlign: 'center', fontSize: '18px', fontWeight: 600 }}>
                {formatAmount(usedAmount)}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 150, border: '1px solid #ccc', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ padding: '0.6rem', borderBottom: '2px solid #3498db', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IoMdCash size={15} /> Available
              </div>
              <div style={{ padding: '0.8rem', textAlign: 'center', fontSize: '18px', fontWeight: 600, color: available > 0 ? '#2b7a4b' : '#9e3a3a' }}>
                {formatAmount(available)}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
            <button
              onClick={() => setRefundDeposit(deposit)}
              disabled={!canRefund}
              title={!canRefund ? "No available balance to refund" : ""}
              style={{ ...outlineBtnStyle, opacity: canRefund ? 1 : 0.5, cursor: canRefund ? 'pointer' : 'not-allowed' }}
            >
              Refund
            </button>
            <button
              onClick={() => setUseDeposit(deposit)}
              disabled={!canUse}
              title={!canUse ? "No available balance to use" : ""}
              style={{ ...outlineBtnStyle, opacity: canUse ? 1 : 0.5, cursor: canUse ? 'pointer' : 'not-allowed' }}
            >
              Use Deposit
            </button>
            <button
              onClick={() => setDepositInvoice(deposit)}
              disabled={!canInvoice}
              title={!canInvoice ? "Cannot create invoice" : ""}
              style={{ ...outlineBtnStyle, opacity: canInvoice ? 1 : 0.5, cursor: canInvoice ? 'pointer' : 'not-allowed' }}
            >
              Create Invoice
            </button>
          </div>

          {/* Back button */}
          <div style={{ marginTop: '1rem' }}>
            <button
              onClick={() => navigate('/landlord/payments/deposits')}
              style={outlineBtnStyle}
            >
              ← Back to Deposits
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {refundDeposit && (
        <RefundDepositModal
          deposit={refundDeposit}
          onClose={() => setRefundDeposit(null)}
          onSuccess={() => {
            setRefundDeposit(null);
            fetchDeposit();
          }}
        />
      )}

      {depositInvoice && (
        <DepositInvoiceModal
          deposit={depositInvoice}
          onClose={() => setDepositInvoice(null)}
          onSuccess={() => {
            setDepositInvoice(null);
            fetchDeposit();
          }}
        />
      )}

      {useDeposit && (
        <UseDepositModal
          deposit={useDeposit}
          onClose={() => setUseDeposit(null)}
          onSuccess={() => {
            setUseDeposit(null);
            fetchDeposit();
          }}
        />
      )}
    </div>
  );
}