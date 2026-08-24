/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { FiSearch, FiChevronDown, FiRefreshCcw } from "react-icons/fi";
import { c as C, f as F } from "../../../styles/theme";
import UseDepositModal from "../../../components/UseDepositModal";

const API = "http://localhost:4000";
const PAGE_SIZE = 8;
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const depositStatusConfig = {
  "paid": { color: "#1e4a6b", bg: "#e8f0f5", border: "1px solid #b0cfe0", dot: "#2c6b9b", label: "Held" },
  "partially_refunded": { color: "#5b4a0b", bg: "#faf6ed", border: "1px solid #e5dbb8", dot: "#8b6e1a", label: "Partially Refunded" },
  "fully_refunded": { color: "#1a4a30", bg: "#eef5e8", border: "1px solid #c5d9b8", dot: "#2b7a4b", label: "Refunded" },
  "forfeited": { color: "#7a2b2b", bg: "#fbeaea", border: "1px solid #e5bdbd", dot: "#9e3a3a", label: "Forfeited" },
  "unpaid": { color: "#6a6a6a", bg: "#f5f5f5", border: "1px solid #e0e0e0", dot: "#7a7a7a", label: "Unpaid" },
};

const DEPOSIT_FILTERS = ["All", "Held", "Partially Refunded", "Refunded", "Forfeited"];
const DEPOSIT_FILTER_MAP = {
  "All": null,
  "Held": ["paid"],
  "Partially Refunded": ["partially_refunded"],
  "Refunded": ["fully_refunded"],
  "Forfeited": ["forfeited"],
};

function formatAmount(amount) {
  return amount === null || amount === undefined || amount === ""
    ? "—"
    : `R ${Number(amount).toLocaleString("en-ZA")}`;
}

function initials(name = "") {
  return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
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
  display: 'flex', alignItems: 'center', gap: '0.4rem',
  background: '#fdfdfd', color: '#000', border: '1px solid #ccc',
  padding: '0.3rem 0.6rem', fontSize: '14px', fontWeight: 400,
  cursor: 'pointer', borderRadius: '2px',
};

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

function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      padding: '0.6rem 1rem', margin: '0 0 1rem', background: '#fde8e5', border: '1px solid #f5c8c2',
    }}>
      <span style={{ fontSize: '14px', color: '#c0392b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Icon name="alertCircle" size={14} /> {message}
      </span>
      <button onClick={onRetry} style={{ ...outlineBtnStyle, padding: '0.25rem 0.8rem', fontSize: '13px' }}>Retry</button>
    </div>
  );
}

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
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#95a5a6' }}><Icon name="x" size={18} /></button>
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
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#95a5a6' }}><Icon name="x" size={18} /></button>
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

function DepositsSummaryStrip({ summary }) {
  if (!summary) return null;

  const total = Number(summary.total || 0);
  const held = Number(summary.total_held || 0);
  const totalDeposit = Number(summary.total_deposit_amount || 0);
  const refunded = Number(summary.total_refunded || 0);
  const disputed = Number(summary.disputed || 0);

  const cards = [
    { label: "Total Deposits", value: total, color: "#2c3e50", bg: "rgba(44,62,80,0.06)", border: "rgba(44,62,80,0.15)" },
    { label: "Total Held", value: formatAmount(held), color: "#1e4a6b", bg: "rgba(30,74,107,0.06)", border: "rgba(30,74,107,0.15)" },
    { label: "Total Refunded", value: formatAmount(refunded), color: "#1a4a30", bg: "rgba(26,74,48,0.06)", border: "rgba(26,74,48,0.15)" },
    { label: "Total Deposit Amount", value: formatAmount(totalDeposit), color: "#2c3e50", bg: "rgba(0,0,0,0.02)", border: "rgba(0,0,0,0.06)" },
    { label: "Disputed", value: disputed, color: "#7a2b2b", bg: "rgba(122,43,43,0.06)", border: "rgba(122,43,43,0.15)" },
  ];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
      gap: "0.6rem",
      padding: "0.85rem 1.1rem",
      background: "#f9fafb",
      borderBottom: "1px solid #dfe3e8",
    }}>
      {cards.map(card => (
        <div key={card.label} style={{
          padding: "0.6rem 0.9rem",
          borderRadius: "3px",
          background: card.bg,
          border: `1px solid ${card.border}`,
          textAlign: "center",
        }}>
          <div style={{ fontSize: "11px", fontWeight: 600, color: "#333", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            {card.label}
          </div>
          <div style={{ fontSize: "1.2rem", fontWeight: 700, color: card.color, marginTop: "2px" }}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DepositsPage() {
  const [useDeposit, setUseDeposit] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef(null);
  const [refundDeposit, setRefundDeposit] = useState(null);
  const [depositInvoice, setDepositInvoice] = useState(null);
  const toast = useToast();
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

  const fetchDeposits = useCallback(async (page = 1, statusFilter = filter, searchTerm = debouncedSearch) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const params = { page, limit: pageSize };
      const statuses = DEPOSIT_FILTER_MAP[statusFilter];
      if (statuses) params.status = statuses.join(",");
      if (searchTerm) params.search = searchTerm;

      const { data } = await axios.get(`${API}/landlord/payments/deposits`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setDeposits(data.deposits || []);
      setSummary(data.summary || null);
      setPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err) {
      setError("Couldn't load deposits.");
      toast.error("Couldn't load deposits. Check your connection and try again.");
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, [toast, filter, debouncedSearch, pageSize]);

  useEffect(() => {
    fetchDeposits(1, filter, debouncedSearch);
  }, [filter, debouncedSearch, pageSize]);

  return (
    <div style={{ padding: '1rem', fontFamily: FONT, color: '#000', background: '#ffffff' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table tbody tr:hover { background: #fafbfc; }
        .rb-link { color: #2471a3; text-decoration: none; font-size: 14px; background: none; border: none; cursor: pointer; padding: 0; }
        .rb-link:hover { text-decoration: underline; }
        .rb-select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          padding-right: 1.8rem;
        }
      `}</style>

      {refundDeposit && (
        <RefundDepositModal
          deposit={refundDeposit}
          onClose={() => setRefundDeposit(null)}
          onSuccess={() => fetchDeposits(pagination.page)}
        />
      )}

      {depositInvoice && (
        <DepositInvoiceModal
          deposit={depositInvoice}
          onClose={() => setDepositInvoice(null)}
          onSuccess={() => fetchDeposits(1)}
        />
      )}

      {useDeposit && (
        <UseDepositModal
          deposit={useDeposit}
          onClose={() => setUseDeposit(null)}
          onSuccess={() => fetchDeposits(1)}
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
            List of Deposits
          </h4>
        </div>

        {/* Summary Strip */}
        <DepositsSummaryStrip summary={summary} />

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.85rem 1.1rem', gap: '1rem', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '0.6rem' }}>
            <button
              onClick={() => fetchDeposits(1)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#ffffff', color: '#000', border: '1px solid #d0d1d3',
                borderRadius: '2px', padding: '0.3rem 0.6rem', fontSize: '14px',
                fontWeight: 400, cursor: 'pointer',
              }}
            >
              <FiRefreshCcw size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ position: 'relative', width: '240px' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input
                type="text"
                placeholder="Search tenant, unit..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
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
                {DEPOSIT_FILTERS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <FiChevronDown size={14} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none' }} />
            </div>

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

        {error && <ErrorBanner message={error} onRetry={() => fetchDeposits(1)} />}

        {/* Deposits Table */}
        <div style={{ border: '1px solid #9a9d9e52', overflow: 'hidden', margin: '0 1.7rem 1.7rem 1.7rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={thStyle}></th>
                <th style={thStyle}>Tenant</th>
                <th style={thStyle}>Property / Unit</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Held</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Refunded</th>
                <th style={thStyle}>Date Held</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && deposits.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#95a5a6', background: '#e9eced52' }}>Loading deposits...</td></tr>
              ) : deposits.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#95a5a6', background: '#e9eced52' }}>No deposits found.</td></tr>
              ) : (
                deposits.map((d, index) => {
                  const tenantId = d.tenant_id;
                  const depositRef = `DEP${String(index + 1).padStart(6, "0")}`;
                  const canAct = d.status === 'paid' || d.status === 'partially_refunded';
                  return (
                    <tr key={d.id}>
                      <td style={tdStyle}>
                        <Link
                          to={`/landlord/payments/deposits/${d.id}`}
                          style={{ fontWeight: 600, color: '#2471a3', textDecoration: 'none', fontSize: '13px' }}
                        >
                          {depositRef}
                        </Link>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: '#eaf2f8', color: '#2c6b9b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 600, fontSize: '12px', flexShrink: 0,
                          }}>
                            {initials(d.tenant_name || "Unknown")}
                          </div>
                          <Link
                            to={`/landlord/tenants/${tenantId}`}
                            style={{ fontWeight: 500, color: '#151515', textDecoration: 'none', fontSize: '13px' }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                          >
                            {d.tenant_name || "—"}
                          </Link>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500, color: '#151515' }}>{d.property_name || "—"}</div>
                        <div style={{ fontSize: '11px', color: '#333', marginTop: '2px' }}>
                          {d.unit_number ? `Unit ${d.unit_number}` : "—"}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500, color: '#2b7a4b' }}>{formatAmount(d.amount_held ?? d.amount)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>{formatAmount(d.amount_refunded || 0)}</td>
                      <td style={tdStyle}>{d.date_held ? new Date(d.date_held).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}</td>
                      <td style={tdStyle}><StatusBadge status={d.status} /></td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', flexWrap: 'wrap' }}>
                          {canAct && (
                            <>
                              <button
                                onClick={() => setUseDeposit(d)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                  fontSize: '11px', fontWeight: 500, padding: '0.15rem 0.4rem',
                                  color: '#2c6b9b', cursor: 'pointer',
                                }}
                              >
                                Use
                              </button>
                              <button
                                onClick={() => setRefundDeposit(d)}
                                style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                                  fontSize: '11px', fontWeight: 500, padding: '0.15rem 0.4rem',
                                  color: '#1a4a30', cursor: 'pointer',
                                }}
                              >
                                Refund
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setDepositInvoice(d)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                              fontSize: '11px', fontWeight: 500, padding: '0.15rem 0.4rem',
                              color: '#8b6e1a', cursor: 'pointer',
                            }}
                          >
                            Invoice
                          </button>
                          {d.status === 'forfeited' && (
                            <span style={{ fontSize: '11px', color: '#95a5a6', fontStyle: 'italic' }}>Forfeited</span>
                          )}
                          {d.status === 'fully_refunded' && (
                            <span style={{ fontSize: '11px', color: '#95a5a6', fontStyle: 'italic' }}>Refunded</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {deposits.length > 0 && (
            <div style={{ padding: '0.6rem 1rem', fontSize: '13px', color: '#7f8c8d', textAlign: 'right', borderTop: '1px solid #9a9d9e52', background: '#e9eced52' }}>
              Showing {deposits.length} of {pagination.total} deposits
            </div>
          )}
        </div>

        {/* Pagination - bottom right */}
        {pagination.totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0 1.7rem 1.7rem',
            marginTop: '-1.5rem',
          }}>
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchDeposits(pagination.page - 1)}
              style={{
                padding: '0.2rem 0.5rem',
                border: '1px solid #d0d1d3',
                background: '#fdfdfd',
                color: '#000',
                cursor: 'pointer',
                fontSize: '13px',
                borderRadius: '2px',
              }}
            >
              ‹
            </button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => fetchDeposits(p)}
                style={{
                  padding: '0.2rem 0.5rem',
                  border: p === pagination.page ? '1px solid #2c3e50' : '1px solid #d0d1d3',
                  background: p === pagination.page ? '#2c3e50' : '#fdfdfd',
                  color: p === pagination.page ? '#ffffff' : '#000',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: p === pagination.page ? 600 : 400,
                  borderRadius: '2px',
                }}
              >
                {p}
              </button>
            ))}
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchDeposits(pagination.page + 1)}
              style={{
                padding: '0.2rem 0.5rem',
                border: '1px solid #d0d1d3',
                background: '#fdfdfd',
                color: '#000',
                cursor: 'pointer',
                fontSize: '13px',
                borderRadius: '2px',
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