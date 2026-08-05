/* eslint-disable react-hooks/exhaustive-deps */
// PAYMENTS PAGE 
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import FullReportModal from "../../../components/FullReportModal";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";


const API = "http://localhost:4000";

const PAGE_SIZE = 50;

const statusConfig = {
  "paid":             { color: C.greenLight, bg: 'rgba(26,122,74,0.1)',   border: '1px solid rgba(76,186,122,0.2)',  dot: C.greenLight, label: "Paid" },
  "pending":          { color: C.gold,       bg: 'rgba(232,160,18,0.08)',  border: '1px solid rgba(232,160,18,0.2)',  dot: C.gold,       label: "Pending Approval" },
  "pending_approval": { color: C.gold,       bg: 'rgba(232,160,18,0.08)',  border: '1px solid rgba(232,160,18,0.2)',  dot: C.gold,       label: "Pending Approval" },
  "late":             { color: C.redLight,   bg: 'rgba(224,90,74,0.1)',    border: '1px solid rgba(224,90,74,0.2)',   dot: C.redLight,   label: "Late" },
  "rejected":         { color: C.redLight,   bg: 'rgba(224,90,74,0.08)',   border: '1px solid rgba(224,90,74,0.15)',  dot: C.redLight,   label: "Rejected" },
  "collections":      { color: C.purple,     bg: 'rgba(139,92,246,0.1)',   border: '1px solid rgba(139,92,246,0.2)',  dot: C.purple,     label: "Collections" },
  "partial":          { color: C.blue,       bg: 'rgba(58,143,212,0.1)',   border: '1px solid rgba(58,143,212,0.2)',  dot: C.blue,       label: "Partial" },
};

const invoiceStatusConfig = {
  "sent":      { color: C.gold,       bg: 'rgba(232,160,18,0.08)',  border: '1px solid rgba(232,160,18,0.15)',  dot: C.gold,       label: 'Unpaid' },
  "paid":      { color: C.greenLight, bg: 'rgba(26,122,74,0.08)',   border: '1px solid rgba(76,186,122,0.15)',  dot: C.greenLight, label: 'Paid' },
  "partial":   { color: C.blue,       bg: 'rgba(58,143,212,0.08)',  border: '1px solid rgba(58,143,212,0.15)',  dot: C.blue,       label: 'Partial' },
  "overdue":   { color: C.redLight,   bg: 'rgba(224,90,74,0.08)',   border: '1px solid rgba(224,90,74,0.15)',   dot: C.redLight,   label: 'Overdue' },
  "cancelled": { color: 'rgba(245,240,232,0.35)', bg: 'rgba(245,240,232,0.05)', border: '1px solid rgba(245,240,232,0.1)', dot: 'rgba(245,240,232,0.35)', label: 'Cancelled' },
  "void":      { color: 'rgba(245,240,232,0.25)', bg: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.08)', dot: 'rgba(245,240,232,0.25)', label: 'Void' },
  "draft":     { color: 'rgba(245,240,232,0.4)',  bg: 'rgba(245,240,232,0.05)', border: '1px solid rgba(245,240,232,0.1)',  dot: 'rgba(245,240,232,0.4)',  label: 'Draft' },
};

const FILTERS = ["All", "Paid", "Pending Approval", "Late", "Collections", "Rejected", "Partial"];


const FILTER_MAP = {
  "All": null,
  "Paid": ["paid"],
  "Pending Approval": ["pending", "pending_approval"],
  "Late": ["late"],
  "Collections": ["collections"],
  "Rejected": ["rejected"],
  "Partial": ["partial"],
};

const inputStyle = {
  width: '100%', fontSize: '0.82rem', padding: '0.6rem 0.9rem', borderRadius: '3px',
  background: C.black, border: `1px solid ${C.border}`, color: C.white,
  fontFamily: F.dm, outline: 'none',
};

const btnPrimary = {
  background: C.gold, color: C.black, border: 'none',
  padding: '0.6rem 1.4rem', fontSize: '0.76rem', fontWeight: 700,
  fontFamily: F.dm, letterSpacing: '0.04em', borderRadius: '3px',
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
};

const btnGhost = {
  background: 'transparent', color: 'rgba(245,240,232,0.5)',
  border: `1px solid ${C.border}`, padding: '0.6rem 1.2rem',
  fontSize: '0.76rem', fontWeight: 500, fontFamily: F.dm,
  letterSpacing: '0.04em', borderRadius: '3px', cursor: 'pointer',
};

const cardStyle = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden',
};

const modalOverlay = {
  position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
};

const pillStyle = (cfg) => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.5rem',
  borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
  textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: cfg.border,
});


function formatAmount(amount) {
  return amount === null || amount === undefined || amount === ""
    ? "—"
    : `R ${Number(amount).toLocaleString("en-ZA")}`;
}

function StatusBadge({ status, type }) {
  const config = type === 'invoice' ? invoiceStatusConfig[status] : statusConfig[status];
  const cfg = config ?? statusConfig["pending"];
  return (
    <span style={pillStyle(cfg)}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      padding: '0.8rem 1rem', margin: '0.8rem 1rem 0', borderRadius: '4px',
      background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)',
    }}>
      <span style={{ fontSize: '0.78rem', color: C.redLight, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Icon name="alertCircle" size={14} /> {message}
      </span>
      <button onClick={onRetry} style={{ ...btnGhost, padding: '0.35rem 0.8rem', fontSize: '0.68rem' }}>
        Retry
      </button>
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

  function handleAmountChange(value) {
    setAmount(value);
    setError("");
  }

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
        invoice_id: invoice.id,
        amount_paid: numericAmount,
        notes: notes || "Cash payment received in person"
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Cash payment error:", err);
      const msg = err?.response?.data?.error || "Failed to record cash payment. Please try again.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={modalOverlay}>
      <div style={{ width: '100%', maxWidth: 440, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Record Cash Payment</h3>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ background: 'rgba(232,160,18,0.05)', border: '1px solid rgba(232,160,18,0.1)', borderRadius: '4px', padding: '0.8rem' }}>
            <p style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, marginBottom: '0.3rem' }}>TENANT</p>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: C.white }}>{tenantName}</p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.4)', fontFamily: F.mono }}>Unit {unitInfo} • Invoice #{invoice?.invoice_number}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Amount Received (ZAR)
            </label>
            <input 
              type="number" 
              value={amount} 
              onChange={e => handleAmountChange(e.target.value)}
              min="0"
              max={remainingBalance || undefined}
              step="0.01"
              style={{ ...inputStyle, fontSize: '1.1rem', fontWeight: 600, borderColor: exceedsBalance ? C.redLight : C.border }} 
            />
            <span style={{ fontSize: '0.62rem', color: exceedsBalance ? C.redLight : 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>
              Invoice total: {formatAmount(invoice?.amount_due)} • Remaining: {formatAmount(remainingBalance)}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Notes <span style={{ color: 'rgba(245,240,232,0.25)', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
            </label>
            <textarea 
              rows={2} 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              style={{ ...inputStyle, resize: 'vertical', minHeight: 60, fontSize: '0.72rem' }} 
            />
          </div>
          {error && (
            <p style={{ fontSize: '0.7rem', color: C.redLight, fontFamily: F.mono }}>{error}</p>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || !isValid} 
            style={{
              flex: 1, padding: '0.6rem 1.2rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600,
              fontFamily: F.dm, letterSpacing: '0.04em', border: 'none', cursor: 'pointer',
              background: C.greenLight, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              opacity: !isValid ? 0.5 : 1
            }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: C.white, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CollectionsModal({ payment, onClose, onConfirm }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const tenantName = payment.tenant_name || payment.tenant || "Unknown";
  const unitInfo = payment.unit_number || payment.unit || "—";
  const amount = payment.amount_paid || payment.amount || 0;

  async function handleConfirm() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/landlord/payments/${payment.id}/collections`, { notes: note }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onConfirm(payment.id);
      onClose();
    } catch (err) {
      console.error("Collections error:", err);
      toast.error(err?.response?.data?.error || "Failed to escalate to collections.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={modalOverlay}>
      <div style={{ width: '100%', maxWidth: 440, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Send to Collections</h3>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <p style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.5)', lineHeight: 1.5 }}>
            You are escalating <span style={{ fontWeight: 600, color: C.white }}>{tenantName}</span> ({unitInfo}) to collections for an outstanding balance of <span style={{ fontWeight: 600, color: C.redLight }}>{formatAmount(amount)}</span>.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Note for collections agent <span style={{ color: 'rgba(245,240,232,0.25)', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
            </label>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 60, fontSize: '0.72rem' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
          <button onClick={handleConfirm} disabled={loading} style={{
            flex: 1, padding: '0.6rem 1.2rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600,
            fontFamily: F.dm, letterSpacing: '0.04em', border: 'none', cursor: 'pointer',
            background: C.purple, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: C.white, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState(null);
  const [paymentsPagination, setPaymentsPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [paymentsSummary, setPaymentsSummary] = useState(null);
  const [filter, setFilter] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef(null);
  const [collectionsPayment, setCollectionsPayment] = useState(null);
  const [cashPaymentInvoice, setCashPaymentInvoice] = useState(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("invoices"); 
  const [invoices, setInvoices] = useState([]);
  const [invoiceSummary, setInvoiceSummary] = useState(null);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoicesError, setInvoicesError] = useState(null);
  const [invoicesPagination, setInvoicesPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [invoiceFilter, setInvoiceFilter] = useState("All");

  useDocumentTitle("Billing & Payments");

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

 
  const fetchInvoices = useCallback(async (page = 1, append = false, statusFilter = "All", searchTerm = "") => {
    setLoadingInvoices(true);
    setInvoicesError(null);
    try {
      const token = localStorage.getItem("token");
      const params = { page, limit: PAGE_SIZE };
      const statuses = INVOICE_FILTER_MAP[statusFilter];
      if (statuses) params.status = statuses.join(",");
      if (searchTerm) params.search = searchTerm;

      const { data } = await axios.get(`${API}/landlord/payments/invoices`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setInvoices(prev => (append ? [...prev, ...(data.invoices || [])] : (data.invoices || [])));
      setInvoiceSummary(data.summary || null);
      setInvoicesPagination(data.pagination || { page: 1, total: (data.invoices || []).length, totalPages: 1 });
    } catch (err) {
      console.error("Fetch invoices:", err);
      setInvoicesError("Couldn't load invoices.");
      toast.error("Couldn't load invoices. Check your connection and try again.");
    } finally {
      setLoadingInvoices(false);
    }
  }, [toast]);

  const fetchPayments = useCallback(async (page = 1, append = false, statusFilter = "All", searchTerm = "") => {
    setLoading(true);
    setPaymentsError(null);
    try {
      const token = localStorage.getItem("token");
      const params = { page, limit: PAGE_SIZE };
      const statuses = FILTER_MAP[statusFilter];
      if (statuses) params.status = statuses.join(",");
      if (searchTerm) params.search = searchTerm;

      const { data } = await axios.get(`${API}/landlord/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setPayments(prev => (append ? [...prev, ...(data.payments || [])] : (data.payments || [])));
      setPaymentsPagination(data.pagination || { page: 1, total: (data.payments || []).length, totalPages: 1 });
    } catch (err) {
      console.error("Fetch payments:", err);
      setPaymentsError("Couldn't load payments.");
      toast.error("Couldn't load payments. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchPaymentsSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/landlord/payments/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPaymentsSummary(data.summary || null);
    } catch (err) {
      console.error("Fetch payments summary:", err);
    }
  }, []);


  useEffect(() => {
    fetchInvoices(1, false, invoiceFilter, debouncedSearch);
  }, [fetchInvoices, invoiceFilter, debouncedSearch]);

  useEffect(() => {
    fetchPayments(1, false, filter, debouncedSearch);
  }, [fetchPayments, filter, debouncedSearch]);

  useEffect(() => { fetchPaymentsSummary(); }, [fetchPaymentsSummary]);

  const refreshPayments = useCallback(
    () => fetchPayments(1, false, filter, debouncedSearch),
    [fetchPayments, filter, debouncedSearch]
  );
  const refreshInvoices = useCallback(
    () => fetchInvoices(1, false, invoiceFilter, debouncedSearch),
    [fetchInvoices, invoiceFilter, debouncedSearch]
  );

  function handleCollections(id) {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'collections' } : p));
    refreshInvoices();
    fetchPaymentsSummary();
    toast.warning("Account escalated to collections.");
  }

  function handleCashPaymentSuccess() {
    refreshPayments();
    refreshInvoices();
    fetchPaymentsSummary();
    toast.success("Cash payment recorded and approved. Receipt generated.");
  }

  const INVOICE_FILTERS = ["All", "Unpaid", "Paid", "Overdue", "Partial", "Draft", "Cancelled", "Void"];
  const INVOICE_FILTER_MAP = { 
    "All": null, 
    "Unpaid": ["sent"], 
    "Paid": ["paid"], 
    "Overdue": ["overdue"],
    "Partial": ["partial"],
    "Draft": ["draft"],
    "Cancelled": ["cancelled"],
    "Void": ["void"],
  };


  const filteredInvoices = invoices;
  const filteredPayments = payments;

  const unpaidCount    = invoiceSummary?.unpaid ?? invoices.filter(i => i.status === 'sent').length;
  const overdueCount   = invoiceSummary?.overdue ?? invoices.filter(i => i.status === 'overdue').length;
  const pendingPayments = paymentsSummary?.pending_count ?? payments.filter(p => p.status === 'pending' || p.status === 'pending_approval').length;


  const invoiceFilterCount = (filterLabel) => {
    if (filterLabel === "All") return invoicesPagination.total;
    const summaryMap = {
      Unpaid:  invoiceSummary?.unpaid,
      Paid:    invoiceSummary?.paid,
      Overdue: invoiceSummary?.overdue,
      Partial: invoiceSummary?.partial,
    };
    if (summaryMap[filterLabel] !== undefined) return summaryMap[filterLabel];
    const statuses = INVOICE_FILTER_MAP[filterLabel] || [];
    return invoices.filter(inv => statuses.includes(inv.status)).length;
  };

  const paymentsFilterCount = (filterLabel) => {
    if (filterLabel === "All") return paymentsPagination.total;
    const summaryMap = {
      "Pending Approval": paymentsSummary?.pending_count,
      Late:               paymentsSummary?.late_count,
      Collections:        paymentsSummary?.collections_count,
      Rejected:           paymentsSummary?.rejected_count,
    };
    if (summaryMap[filterLabel] !== undefined) return summaryMap[filterLabel];
    const statuses = FILTER_MAP[filterLabel] || [];
    return payments.filter(p => statuses.includes(p.status)).length;
  };

  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    subtitle: {  fontSize: '1.2rem', color: 'white', fontWeight: 500, fontFamily: F.mono, marginTop: '0.3rem', opacity: 1, letterSpacing: '0.02em',},
    toolbarInner: { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', flexWrap: 'wrap' },
    filterBtn: (active) => ({ padding: '0.4rem 0.8rem', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 600, fontFamily: F.mono, letterSpacing: '0.04em', border: `1px solid ${active ? C.gold : C.border}`, background: active ? 'rgba(232,160,18,0.12)' : 'transparent', color: active ? C.gold : 'rgba(245,240,232,0.4)', cursor: 'pointer', transition: 'all 0.15s' }),
    searchWrap: { position: 'relative', marginLeft: 'auto' },
    searchIcon: { position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.25)' },
    searchInput: { padding: '0.5rem 0.8rem 0.5rem 2.25rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, fontSize: '0.78rem', outline: 'none', width: 220 },
    table: { width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' },
    th: { fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.7rem 1rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` },
    td: { padding: '0.7rem 1rem', borderBottom: `1px solid ${C.border}` },
    footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono },
    loadMoreWrap: { display: 'flex', justifyContent: 'center', padding: '1rem' },
  };

  return (
    <div style={S.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 0.3; } }
        input:focus, select:focus { border-color: ${C.borderFocus ?? C.gold} !important; }
      `}</style>

      {cashPaymentInvoice && (
        <CashPaymentModal 
          invoice={cashPaymentInvoice} 
          onClose={() => setCashPaymentInvoice(null)} 
          onSuccess={handleCashPaymentSuccess} 
        />
      )}

      {collectionsPayment && (
        <CollectionsModal payment={collectionsPayment} onClose={() => setCollectionsPayment(null)} onConfirm={handleCollections} />
      )}
      {showFullReport && <FullReportModal onClose={() => setShowFullReport(false)} />}

      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}><Icon name="credit-card" size={24} color={C.gold} />Billing & Payments</h1>
          <p style={S.subtitle}>{invoicesPagination.total} invoices · {paymentsPagination.total} payments</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => { fetchInvoices(1, false); fetchPayments(1, false); }} style={btnGhost}><Icon name="refresh" size={14} /> Refresh</button>
          <button onClick={() => setShowFullReport(true)} style={btnPrimary}><Icon name="download" size={14} /> Export Report</button>
        </div>
      </div>

      <div style={cardStyle}>
        {/* TABS */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => setActiveTab("invoices")} style={{
            flex: 1, padding: '0.7rem 1rem', fontSize: '0.78rem', fontWeight: 600,
            fontFamily: F.dm, border: 'none', cursor: 'pointer',
            background: activeTab === "invoices" ? 'rgba(232,160,18,0.06)' : 'transparent',
            color: activeTab === "invoices" ? C.gold : 'rgba(245,240,232,0.4)',
            borderBottom: activeTab === "invoices" ? `2px solid ${C.gold}` : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
             Invoices
            {(unpaidCount + overdueCount) > 0 && (
              <span style={{ marginLeft: '0.4rem', background: C.redLight, color: C.white, padding: '0.1rem 0.4rem', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 700, fontFamily: F.mono }}>
                {unpaidCount + overdueCount}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab("payments")} style={{
            flex: 1, padding: '0.7rem 1rem', fontSize: '0.78rem', fontWeight: 600,
            fontFamily: F.dm, border: 'none', cursor: 'pointer',
            background: activeTab === "payments" ? 'rgba(232,160,18,0.06)' : 'transparent',
            color: activeTab === "payments" ? C.gold : 'rgba(245,240,232,0.4)',
            borderBottom: activeTab === "payments" ? `2px solid ${C.gold}` : '2px solid transparent',
            transition: 'all 0.15s',
          }}>
             Payments
            {pendingPayments > 0 && (
              <span style={{ marginLeft: '0.4rem', background: C.gold, color: C.black, padding: '0.1rem 0.4rem', borderRadius: '8px', fontSize: '0.6rem', fontWeight: 700, fontFamily: F.mono }}>
                {pendingPayments}
              </span>
            )}
          </button>
        </div>

        {/* INVOICES TABLE */}
        {activeTab === "invoices" && (
          <>
            <div style={S.toolbarInner}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {INVOICE_FILTERS.map(f => (
                  <button key={f} onClick={() => setInvoiceFilter(f)} style={S.filterBtn(invoiceFilter === f)}>
                    {f}{f !== "All" && <span style={{ marginLeft: '0.3rem', opacity: 0.6 }}>{invoiceFilterCount(f)}</span>}
                  </button>
                ))}
              </div>
              <div style={S.searchWrap}>
                <Icon name="search" size={14} style={S.searchIcon} />
                <input type="text" placeholder="Search tenant, unit..." value={searchInput} onChange={e => setSearchInput(e.target.value)} style={S.searchInput} />
              </div>
            </div>

            {invoicesError && <ErrorBanner message={invoicesError} onRetry={() => fetchInvoices(1, false)} />}

            {invoiceFilter !== "All" && invoicesPagination.page < invoicesPagination.totalPages && (
              <p style={{ margin: '0.6rem 1rem 0', fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>
                Filtering only searches invoices already loaded — use "Load more" below to bring in the rest.
              </p>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {["Invoice #", "Tenant", "Unit / Property", "Amount", "Remaining", "Due Date", "Status", "Actions"].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingInvoices && invoices.length === 0 ? (
                    <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '3rem 0', color: 'rgba(245,240,232,0.25)' }}>Loading invoices...</td></tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '3rem 0', color: 'rgba(245,240,232,0.25)' }}>No invoices match your filters.</td></tr>
                  ) : (
                    filteredInvoices.map(inv => {
                      const canRecordCash = inv.status === 'sent' || inv.status === 'overdue' || inv.status === 'partial';
                      return (
                        <tr key={inv.id} style={{ transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = C.muted}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ ...S.td, fontFamily: F.mono, fontSize: '0.7rem', color: 'rgba(245,240,232,0.5)' }}>{inv.invoice_number}</td>
                          <td style={S.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontWeight: 500, color: C.white }}>{inv.tenant_name || "—"}</span>
                            </div>
                          </td>
                          <td style={S.td}>
                            <div style={{ fontWeight: 500, color: C.white }}>{inv.unit_number || "—"}</div>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{inv.property_name || "—"}</div>
                          </td>
                          <td style={{ ...S.td, fontWeight: 600, color: C.white }}>{formatAmount(inv.amount_due)}</td>
                          <td style={{ ...S.td, fontWeight: 600, color: Number(inv.remaining_balance) > 0 ? C.redLight : C.greenLight }}>
                            {formatAmount(inv.remaining_balance)}
                          </td>
                          <td style={{ ...S.td, fontFamily: F.mono, fontSize: '0.7rem', color: 'rgba(245,240,232,0.5)' }}>
                            {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}
                          </td>
                          <td style={S.td}>
                            <StatusBadge status={inv.status} type="invoice" />
                          </td>
                          <td style={S.td}>
                            {canRecordCash && (
                              <button 
                                onClick={() => setCashPaymentInvoice(inv)}
                                style={{ fontSize: '0.65rem', fontWeight: 600, color: C.greenLight, padding: '0.25rem 0.5rem', borderRadius: '3px', cursor: 'pointer', fontFamily: F.mono }}
                              >
                                Cash Payment
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {invoicesPagination.page < invoicesPagination.totalPages && (
              <div style={S.loadMoreWrap}>
                <button
                  onClick={() => fetchInvoices(invoicesPagination.page + 1, true)}
                  disabled={loadingInvoices}
                  style={btnGhost}
                >
                  {loadingInvoices ? "Loading..." : `Load more (${invoices.length} of ${invoicesPagination.total})`}
                </button>
              </div>
            )}
          </>
        )}

        {/* PAYMENTS TABLE */}
        {activeTab === "payments" && (
          <>
            <div style={S.toolbarInner}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {FILTERS.map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={S.filterBtn(filter === f)}>
                    {f}{f !== "All" && <span style={{ marginLeft: '0.3rem', opacity: 0.6 }}>{paymentsFilterCount(f)}</span>}
                  </button>
                ))}
              </div>
              <div style={S.searchWrap}>
                <Icon name="search" size={14} style={S.searchIcon} />
                <input type="text" placeholder="Search tenant, unit..." value={searchInput} onChange={e => setSearchInput(e.target.value)} style={S.searchInput} />
              </div>
            </div>

            {paymentsError && <ErrorBanner message={paymentsError} onRetry={() => fetchPayments(1, false)} />}

            {filter !== "All" && paymentsPagination.page < paymentsPagination.totalPages && (
              <p style={{ margin: '0.6rem 1rem 0', fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>
                Filtering only searches payments already loaded — use "Load more" below to bring in the rest.
              </p>
            )}

            <div style={{ overflowX: 'auto' }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {["Tenant", "Unit / Property", "Amount", "Method", "Reference", "Proof", "Status", "Actions"].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading && payments.length === 0 ? (
                    <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '3rem 0', color: 'rgba(245,240,232,0.25)' }}>Loading payments...</td></tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '3rem 0', color: 'rgba(245,240,232,0.25)' }}>No payments match your filters.</td></tr>
                  ) : (
                    filteredPayments.map(p => {
                      const tenantName = p.tenant_name || "Unknown";
                      const unitInfo = p.unit_number || "—";
                      const propertyName = p.property_name || "—";
                      const amount = p.amount_paid || 0;
                      const method = p.payment_method || "—";
                      const reference = p.bank_reference || "—";
                      const hasProof = !!p.proof_of_payment_url;
                      const isCash = method === 'cash';
                      const isPending = p.status === "pending" || p.status === "pending_approval";
                      const needsCollections = (p.status === "late" || p.status === "rejected") && p.invoice_status !== "paid";
                      const noActionNeeded = (p.status === "late" || p.status === "rejected") && p.invoice_status === "paid";
                      
                      return (
                        <tr key={p.id} style={{ transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = C.muted}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={S.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div>
                                <div style={{ fontWeight: 600, color: C.white }}>{tenantName}</div>
                                {p.rejection_reason && <div style={{ fontSize: '0.62rem', color: C.redLight, marginTop: '1px' }} title={p.rejection_reason}> {p.rejection_reason}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={S.td}><div style={{ fontWeight: 500, color: C.white }}>{unitInfo}</div><div style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{propertyName}</div></td>
                          <td style={{ ...S.td, fontWeight: 600, color: C.white }}>{formatAmount(amount)}</td>
                          <td style={S.td}>
                            <span style={{ 
                              color:  'rgba(245,240,232,0.7)',
                              fontWeight: isCash ? 600 : 400
                            }}>
                              {isCash ? ' cash' : method}
                            </span>
                          </td>
                          <td style={S.td}><span style={{ fontFamily: F.mono, fontSize: '0.72rem', color: 'rgba(245,240,232,0.4)' }}>{reference}</span></td>
                          <td style={S.td}>{hasProof ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: C.greenLight, fontWeight: 500 }}><Icon name="check" size={12} /> Yes</span> : <span style={{ color: 'rgba(245,240,232,0.25)' }}>—</span>}</td>
                          <td style={S.td}><StatusBadge status={p.status} /></td>
                          <td style={S.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              
                              {isPending && (
                                <button 
                                  onClick={() => navigate(`/landlord/payments/review/${p.id}`, { state: { payment: p } })} 
                                  style={{ fontSize: '0.68rem', fontWeight: 500, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}
                                >
                                  Review
                                </button>
                              )}
                              
                              {needsCollections && (
                                <button 
                                  onClick={() => setCollectionsPayment(p)} 
                                  style={{ fontSize: '0.68rem', fontWeight: 500, color: C.purple, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}
                                >
                                  Collections
                                </button>
                              )}
                              
                              {p.status === "paid" && (
                                <button 
                                  onClick={() => navigate(`/landlord/payments/${p.id}`, { state: { payment: p } })} 
                                  style={{ fontSize: '0.68rem', fontWeight: 500, color: 'rgba(245,240,232,0.3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}
                                >
                                  View Receipt
                                </button>
                              )}  
                              
                              {p.status === "collections" && (
                                <span style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, fontStyle: 'italic' }}>
                                  Escalated
                                </span>
                              )}
                              
                              {noActionNeeded && (
                                <button 
                                  disabled 
                                  style={{ fontSize: '0.68rem', fontWeight: 500, color: 'rgba(245,240,232,0.3)', background: 'none', border: 'none', fontFamily: F.mono, cursor: 'not-allowed' }}
                                >
                                  No action required
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {paymentsPagination.page < paymentsPagination.totalPages && (
              <div style={S.loadMoreWrap}>
                <button
                  onClick={() => fetchPayments(paymentsPagination.page + 1, true)}
                  disabled={loading}
                  style={btnGhost}
                >
                  {loading ? "Loading..." : `Load more (${payments.length} of ${paymentsPagination.total})`}
                </button>
              </div>
            )}
          </>
        )}

        <div style={S.footer}>
          <span>
            Showing <span style={{ color: C.white, fontWeight: 500 }}>
              {activeTab === "invoices" ? filteredInvoices.length : filteredPayments.length}
            </span> of <span style={{ color: C.white, fontWeight: 500 }}>
              {activeTab === "invoices" ? invoicesPagination.total : paymentsPagination.total}
            </span> {activeTab === "invoices" ? "invoices" : "payments"}
          </span>
          <button onClick={() => setShowFullReport(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', fontWeight: 600, color: C.blue, fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase', background: 'none', border: 'none', cursor: 'pointer' }}>
            Full Report <Icon name="chevronRight" size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}