/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../contexts/ToastContext";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import FullReportModal from "../../../components/FullReportModal";
import { Icon } from "../../../components/Icon";
import { FiPlus, FiSearch, FiChevronDown, FiRefreshCcw } from "react-icons/fi";
import { FaPlus } from "react-icons/fa";

const API = "http://localhost:4000";
const PAGE_SIZE = 8;
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const invoiceStatusConfig = {
  "sent": { color: "#5b4a0b", bg: "#faf6ed", border: "1px solid #e5dbb8", dot: "#8b6e1a", label: "Unpaid" },
  "paid": { color: "#1a4a30", bg: "#eef5e8", border: "1px solid #c5d9b8", dot: "#2b7a4b", label: "Paid" },
  "partial": { color: "#1e4a6b", bg: "#e8f0f5", border: "1px solid #b0cfe0", dot: "#2c6b9b", label: "Partial" },
  "overdue": { color: "#7a2b2b", bg: "#fbeaea", border: "1px solid #e5bdbd", dot: "#9e3a3a", label: "Overdue" },
  "cancelled": { color: "#5a5a5a", bg: "#f2f2f2", border: "1px solid #d0d0d0", dot: "#6b6b6b", label: "Cancelled" },
  "void": { color: "#6a6a6a", bg: "#f5f5f5", border: "1px solid #e0e0e0", dot: "#7a7a7a", label: "Void" },
  "draft": { color: "#5a5a5a", bg: "#f2f2f2", border: "1px solid #d0d0d0", dot: "#6b6b6b", label: "Draft" },
};

const INVOICE_FILTERS = ["All", "Unpaid", "Paid", "Overdue", "Partial", "Draft", "Cancelled", "Void"];
const INVOICE_FILTER_MAP = {
  "All": null, "Unpaid": ["sent"], "Paid": ["paid"], "Overdue": ["overdue"],
  "Partial": ["partial"], "Draft": ["draft"], "Cancelled": ["cancelled"], "Void": ["void"],
};

const INVOICE_TYPES = [
  { value: "all", label: "All Types" },
  { value: "damage", label: "Damage/Repair" },
  { value: "fine", label: "Fine" },
  { value: "rent", label: "Rent" },
  { value: "deposit", label: "Deposit" },
  { value: "utility", label: "Utility" },
  { value: "other", label: "Other" },
];

function formatAmount(amount) {
  return amount === null || amount === undefined || amount === ""
    ? "—"
    : `R ${Number(amount).toLocaleString("en-ZA")}`;
}

function initials(name = "") {
  return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function typeLabel(type) {
  switch (type) {
    case "rent": return "Rent";
    case "deposit": return "Deposit";
    case "utility": return "Utility";
    case "damage": return "Damage";
    case "fine": return "Fine";
    case "other": return "Other";
    default: return type || "—";
  }
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

const primaryBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '0.4rem',
  background: '#2c3e50', color: '#ffffff', border: 'none',
  padding: '0.2rem 1rem', fontSize: '14px', fontWeight: 400,
  cursor: 'pointer', borderRadius: '2px',
};

function StatusBadge({ status }) {
  const cfg = invoiceStatusConfig[status] ?? invoiceStatusConfig["draft"];
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

function TypeBadge({ type }) {
  const label = typeLabel(type);
  const colors = {
    rent: { color: "#1e4a6b", bg: "#e8f0f5", border: "1px solid #b0cfe0" },
    deposit: { color: "#1a4a30", bg: "#eef5e8", border: "1px solid #c5d9b8" },
    utility: { color: "#8b6e1a", bg: "#faf6ed", border: "1px solid #e5dbb8" },
    other: { color: "#5a5a5a", bg: "#f2f2f2", border: "1px solid #d0d0d0" },
  };
  const cfg = colors[type] || colors.other;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontSize: '12px',
      fontWeight: 500, padding: '0.15rem 0.6rem', color: cfg.color,
      background: cfg.bg, border: cfg.border, borderRadius: '12px',
    }}>
      {label}
    </span>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      padding: '0.6rem 1rem', margin: '0 0 1rem', background: '#fbeaea', border: '1px solid #e5bdbd',
    }}>
      <span style={{ fontSize: '14px', color: '#9e3a3a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Icon name="alertCircle" size={14} /> {message}
      </span>
      <button onClick={onRetry} style={{ ...outlineBtnStyle, padding: '0.25rem 0.8rem', fontSize: '13px' }}>Retry</button>
    </div>
  );
}

function CashPaymentModal({ invoice, onClose, onSuccess }) {
  const remainingBalance = Number(invoice?.remaining_balance ?? invoice?.amount_due ?? 0);
  const [amount, setAmount] = useState(remainingBalance > 0 ? String(remainingBalance) : "");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();
  const tenantName = invoice?.tenant_name || "Unknown";
  const unitInfo = invoice?.unit_number || "—";

  const numericAmount = Number(amount);
  const exceedsBalance = amount !== "" && !Number.isNaN(numericAmount) && numericAmount > remainingBalance + 0.01;
  const isValid = amount !== "" && !Number.isNaN(numericAmount) && numericAmount > 0 && !exceedsBalance;

  async function handleSubmit() {
    if (!isValid) {
      setError(exceedsBalance ? `Amount can't exceed the remaining balance of ${formatAmount(remainingBalance)}` : "Enter a valid amount");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/landlord/payments/cash`, {
        invoice_id: invoice.id, amount_paid: numericAmount, notes: notes || "Cash payment received in person"
      }, { headers: { Authorization: `Bearer ${token}` } });
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to record cash payment. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(44,62,80,0.5)' }}>
      <div style={{ width: '100%', maxWidth: 420, background: '#fdfdfd', border: '1px solid #e9ecef', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.2rem', borderBottom: '1px solid #e9ecef' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#000' }}>Record Cash Payment</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#555' }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div style={{ background: '#f9fafb', border: '1px solid #e9ecef', padding: '0.7rem' }}>
            <p style={{ fontSize: '12px', color: '#333', marginBottom: '0.3rem' }}>TENANT</p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#000' }}>{tenantName}</p>
            <p style={{ fontSize: '12px', color: '#333' }}>Unit {unitInfo} • Invoice #{invoice?.invoice_number}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>Amount Received (ZAR)</label>
            <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setError(""); }}
              min="0" max={remainingBalance || undefined} step="0.01"
              style={{ width: '100%', fontSize: '16px', fontWeight: 500, padding: '0.4rem 0.7rem', background: '#fdfdfd', border: `1px solid ${exceedsBalance ? '#9e3a3a' : '#dee2e6'}`, color: '#000', outline: 'none' }} />
            <span style={{ fontSize: '12px', color: exceedsBalance ? '#9e3a3a' : '#333' }}>
              Invoice total: {formatAmount(invoice?.amount_due)} • Remaining: {formatAmount(remainingBalance)}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>Notes <span style={{ color: '#555', fontWeight: 400 }}>(optional)</span></label>
            <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
              style={{ width: '100%', fontSize: '14px', padding: '0.4rem 0.7rem', background: '#fdfdfd', border: '1px solid #dee2e6', color: '#000', outline: 'none', resize: 'vertical', minHeight: 50 }} />
          </div>
          {error && <p style={{ fontSize: '13px', color: '#9e3a3a' }}>{error}</p>}
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '0.9rem 1.2rem 1.2rem', borderTop: '1px solid #e9ecef' }}>
          <button onClick={onClose} disabled={loading} style={{ ...outlineBtnStyle, flex: 1, justifyContent: 'center' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !isValid} style={{
            flex: 1, padding: '0.4rem 1rem', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer',
            background: '#2b7a4b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            opacity: !isValid ? 0.5 : 1,
          }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GenerateInvoicesModal({ period, onClose, onSuccess }) {
  const toast = useToast();
  const [targetPeriod, setTargetPeriod] = useState(period || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleSubmit = async () => {
    if (!targetPeriod) {
      setError("Please select a target month.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(
        `${API}/landlord/billing/generate-monthly`,
        { period: targetPeriod },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult(data);
      toast.success(data.message || "Invoices generated.");
      if (data.generated > 0) {
        onSuccess?.();
      }
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to generate invoices.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', background: 'rgba(44,62,80,0.5)'
    }}>
      <div style={{
        width: '100%', maxWidth: 460,
        background: '#fdfdfd', border: '1px solid #e9ecef',
        borderRadius: '3px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.5rem', borderBottom: '1px solid #e9ecef'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#000' }}>Generate Invoices</h3>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#555' }}
          >
            <Icon name="x" size={18} />
          </button>
        </div>

        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>Target Month</label>
            <input
              type="month"
              value={targetPeriod}
              onChange={(e) => setTargetPeriod(e.target.value)}
              style={{
                width: '100%', padding: '0.4rem 0.7rem', fontSize: '14px',
                background: '#fdfdfd', border: '1px solid #dee2e6', color: '#000',
                outline: 'none', borderRadius: '2px',
              }}
            />
          </div>

          <p style={{ fontSize: '12px', color: '#555', margin: 0 }}>
            This will create rent invoices for all active leases covering the selected month.
            Outstanding balances from previous periods will be included as <strong>other charges</strong>.
          </p>

          {error && <p style={{ fontSize: '13px', color: '#9e3a3a', margin: 0 }}>{error}</p>}

          {result && (
            <div style={{
              background: '#f9fafb', border: '1px solid #e9ecef', borderRadius: '3px',
              padding: '0.8rem', display: 'flex', flexDirection: 'column', gap: '0.3rem',
            }}>
              <p style={{ fontSize: '13px', fontWeight: 500, color: '#000', margin: 0 }}>
                {result.message}
              </p>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '12px', color: '#555' }}>
                <span>Generated: <strong>{result.generated}</strong></span>
                <span>Skipped: <strong>{result.skipped}</strong></span>
                <span>Partial: <strong>{result.has_partial_invoices || 0}</strong></span>
              </div>
            </div>
          )}
        </div>

        <div style={{
          display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem',
          borderTop: '1px solid #e9ecef',
        }}>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{ ...outlineBtnStyle, flex: 1, justifyContent: 'center' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !targetPeriod}
            style={{
              ...primaryBtnStyle, flex: 1, justifyContent: 'center',
              opacity: !targetPeriod ? 0.5 : 1,
              cursor: !targetPeriod ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <span style={{
                width: 14, height: 14,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#ffffff', borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }} />
            ) : "Generate"}
          </button>
        </div>
      </div>
    </div>
  );
}


function InvoicesSummaryStrip({ summary }) {
  if (!summary) return null;

  const total = Number(summary.total || 0);
  const unpaid = Number(summary.unpaid || 0);
  const overdue = Number(summary.overdue || 0);
  const partial = Number(summary.partial || 0);
  const totalAmountDue = Number(summary.total_amount_due || 0);
  const totalRemaining = Number(summary.total_remaining || 0);

  const cards = [
    { label: "Total Invoices", value: total, color: "#2c3e50", bg: "rgba(44,62,80,0.06)", border: "rgba(44,62,80,0.15)" },
    { label: "Unpaid", value: unpaid, color: "#8b6e1a", bg: "rgba(139,110,26,0.06)", border: "rgba(139,110,26,0.15)" },
    { label: "Overdue", value: overdue, color: "#7a2b2b", bg: "rgba(122,43,43,0.06)", border: "rgba(122,43,43,0.15)" },
    { label: "Partial", value: partial, color: "#1e4a6b", bg: "rgba(30,74,107,0.06)", border: "rgba(30,74,107,0.15)" },
    { label: "Total Due", value: formatAmount(totalAmountDue), color: "#2c3e50", bg: "rgba(0,0,0,0.02)", border: "rgba(0,0,0,0.06)" },
    { label: "Total Remaining", value: formatAmount(totalRemaining), color: totalRemaining > 0 ? "#9e3a3a" : "#2b7a4b", bg: "rgba(0,0,0,0.02)", border: "rgba(0,0,0,0.06)" },
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

export default function InvoicesPage() {
  useDocumentTitle("Invoices");

  const [invoices, setInvoices] = useState([]);
  const [invoiceSummary, setInvoiceSummary] = useState(null);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [invoicesError, setInvoicesError] = useState(null);
  const [invoicesPagination, setInvoicesPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [invoiceFilter, setInvoiceFilter] = useState("All");
  const [invoiceTypeFilter, setInvoiceTypeFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef(null);
  const [cashPaymentInvoice, setCashPaymentInvoice] = useState(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const nextMonthDate = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1);
  const nextMonthPeriod = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const nextMonthLabel = nextMonthDate.toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' });

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

  const fetchInvoices = useCallback(async (page = 1, statusFilter = invoiceFilter, typeFilter = invoiceTypeFilter, searchTerm = debouncedSearch) => {
    setLoadingInvoices(true);
    setInvoicesError(null);
    try {
      const token = localStorage.getItem("token");
      const params = { page, limit: pageSize };
      const statuses = INVOICE_FILTER_MAP[statusFilter];
      if (statuses) params.status = statuses.join(",");
      if (typeFilter !== "all") params.type = typeFilter;
      if (searchTerm) params.search = searchTerm;

      const { data } = await axios.get(`${API}/landlord/payments/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setInvoices(data.invoices || []);
      setInvoiceSummary(data.summary || null);
      setInvoicesPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err) {
      console.log(err);
      setInvoicesError("Couldn't load invoices.");
      toast.error("Couldn't load invoices. Check your connection and try again.");
    } finally {
      setLoadingInvoices(false);
    }
  }, [toast, invoiceFilter, invoiceTypeFilter, debouncedSearch, pageSize]);

  useEffect(() => {
    fetchInvoices(1, invoiceFilter, invoiceTypeFilter, debouncedSearch);
  }, [invoiceFilter, invoiceTypeFilter, debouncedSearch, pageSize]);


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

      {cashPaymentInvoice && (
        <CashPaymentModal invoice={cashPaymentInvoice} onClose={() => setCashPaymentInvoice(null)}
          onSuccess={() => { fetchInvoices(invoicesPagination.page); toast.success("Cash payment recorded and approved. Receipt generated."); }} />
      )}
      {showGenerateModal && (
        <GenerateInvoicesModal period={nextMonthPeriod} periodLabel={nextMonthLabel}
          onClose={() => setShowGenerateModal(false)}
          onSuccess={() => fetchInvoices(1)} />
      )}

      {showFullReport && <FullReportModal onClose={() => setShowFullReport(false)} />}

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
            List of Invoices
          </h4>
        </div>

        <InvoicesSummaryStrip summary={invoiceSummary} />

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.85rem 1.1rem', gap: '1rem', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '0.6rem' }}>
            <button
              onClick={() => fetchInvoices(1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                color: '#000',
                border: '1px solid #d0d1d3',
                borderRadius: '2px',
                padding: '0.3rem 0.6rem',
                fontSize: '14px',
                fontWeight: 400,
                cursor: 'pointer',
              }}
            >
              <FiRefreshCcw size={18} />
            </button>
            <button
              onClick={() => setShowGenerateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#ffffff',
                color: '#000',
                border: '1px solid #d0d1d3',
                borderRadius: '2px',
                padding: '0.3rem 0.6rem',
                fontSize: '14px',
                fontWeight: 400,
                cursor: 'pointer',
              }}
            >
              <FaPlus size={14} /> Generate Invoices
            </button>
            <button
              onClick={() => navigate('/landlord/payments/invoices/create')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#ffffff',
                color: '#000',
                border: '1px solid #d0d1d3',
                borderRadius: '2px',
                padding: '0.3rem 0.6rem',
                fontSize: '14px',
                fontWeight: 400,
                cursor: 'pointer',
              }}
            >
              <FaPlus size={14} /> Create Invoice
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ position: 'relative', width: '200px' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                style={{
                  padding: '0.3rem 0.75rem 0.3rem 2rem',
                  fontSize: '14px',
                  border: '1px solid #d0d1d3',
                  borderRadius: '2px',
                  width: '200px',
                  fontFamily: FONT,
                  color: '#000',
                  outline: 'none',
                }}
              />
            </div>

            {/* Status filter dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                value={invoiceFilter}
                onChange={(e) => setInvoiceFilter(e.target.value)}
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
                {INVOICE_FILTERS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <FiChevronDown size={14} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none' }} />
            </div>

            {/* Type filter dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                value={invoiceTypeFilter}
                onChange={(e) => setInvoiceTypeFilter(e.target.value)}
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
                {INVOICE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
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

        {invoicesError && <ErrorBanner message={invoicesError} onRetry={() => fetchInvoices(1)} />}

        {/* Invoices Table */}
        <div style={{ border: '1px solid #9a9d9e52', overflow: 'hidden', margin: '0 1.7rem 1.7rem 1.7rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={thStyle}></th>
                <th style={thStyle}>Tenant</th>
                <th style={thStyle}>Property / Unit</th>
                <th style={thStyle}>Type</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Remaining</th>
                <th style={thStyle}>Due Date</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingInvoices && invoices.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#555', background: '#e9eced52' }}>Loading invoices...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={9} style={{ padding: '2rem', textAlign: 'center', color: '#555', background: '#e9eced52' }}>No invoices found.</td></tr>
              ) : (
                invoices.map((inv, index) => {
                  const canRecordCash =
                    (inv.status === 'sent' || inv.status === 'overdue' || inv.status === 'partial')
                    && !inv.linked_plan_id;
                  const invoiceRef = `INV${String(index + 1).padStart(6, "0")}`;
                  const tenantId = inv.tenant_id;
                  return (
                    <tr key={inv.id}>
                      <td style={tdStyle}>
                        <Link
                          to={`/landlord/payments/invoices/${inv.id}`}
                          style={{ fontWeight: 600, color: '#2471a3', textDecoration: 'none', fontSize: '13px' }}
                        >
                          {invoiceRef}
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
                            {initials(inv.tenant_name || "Unknown")}
                          </div>
                          <Link
                            to={`/landlord/tenants/${tenantId}`}
                            style={{ fontWeight: 500, color: '#151515', textDecoration: 'none', fontSize: '13px' }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                          >
                            {inv.tenant_name || "—"}
                          </Link>
                        </div>
                      </td>

                      {/* Property / Unit */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500, color: '#151515' }}>{inv.property_name || "—"}</div>
                        <div style={{ fontSize: '11px', color: '#333', marginTop: '2px' }}>
                          {inv.unit_number ? `Unit ${inv.unit_number}` : "—"}
                        </div>
                      </td>

                      {/* Type badge */}
                      <td style={tdStyle}>
                        <TypeBadge type={inv.invoice_type || "rent"} />
                      </td>

                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500, color: '#2b7a4b' }}>{formatAmount(inv.amount_due)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500, color: Number(inv.remaining_balance) > 0 ? '#9e3a3a' : '#2b7a4b' }}>{formatAmount(inv.remaining_balance)}</td>
                      <td style={tdStyle}>{inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}</td>
                      <td style={tdStyle}><StatusBadge status={inv.status} /></td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        {canRecordCash && <button onClick={() => setCashPaymentInvoice(inv)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            fontSize: '11px',
                            fontWeight: 500,
                            padding: '0.15rem 0.5rem',
                            color: '#2b7a4b',
                            cursor: 'pointer',
                          }}>
                          Record cash
                        </button>}
                        {inv.linked_plan_id && (
                          <Link to={`/landlord/payments/plans`} style={{ fontSize: '11px', color: '#2c6b9b' }}>
                            Part of repayment plan
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {invoices.length > 0 && (
            <div style={{ padding: '0.5rem 0.8rem', fontSize: '13px', color: '#333', textAlign: 'right', borderTop: '1px solid #9a9d9e52', background: '#e9eced52' }}>
              Showing {invoices.length} of {invoicesPagination.total} invoices
              {" "}·{" "}
              <button onClick={() => setShowFullReport(true)} className="rb-link">Full report</button>
            </div>
          )}
        </div>

        {/* Pagination - bottom right */}
        {invoicesPagination.totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0 1.7rem 1.7rem',
            marginTop: '-1.5rem',
          }}>
            <button
              disabled={invoicesPagination.page <= 1}
              onClick={() => fetchInvoices(invoicesPagination.page - 1)}
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
            {Array.from({ length: invoicesPagination.totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => fetchInvoices(p)}
                style={{
                  padding: '0.2rem 0.5rem',
                  border: p === invoicesPagination.page ? '1px solid #2c3e50' : '1px solid #d0d1d3',
                  background: p === invoicesPagination.page ? '#2c3e50' : '#fdfdfd',
                  color: p === invoicesPagination.page ? '#ffffff' : '#000',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: p === invoicesPagination.page ? 600 : 400,
                  borderRadius: '2px',
                }}
              >
                {p}
              </button>
            ))}
            <button
              disabled={invoicesPagination.page >= invoicesPagination.totalPages}
              onClick={() => fetchInvoices(invoicesPagination.page + 1)}
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