/* eslint-disable no-unused-vars */
// PAYMENTS PAGE 
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import FullReportModal from "../../../components/FullReportModal";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

const statusConfig = {
  "paid":             { color: C.greenLight, bg: 'rgba(26,122,74,0.1)',   border: '1px solid rgba(76,186,122,0.2)',  dot: C.greenLight, label: "Paid" },
  "pending":          { color: C.gold,       bg: 'rgba(232,160,18,0.08)',  border: '1px solid rgba(232,160,18,0.2)',  dot: C.gold,       label: "Pending Approval" },
  "pending_approval": { color: C.gold,       bg: 'rgba(232,160,18,0.08)',  border: '1px solid rgba(232,160,18,0.2)',  dot: C.gold,       label: "Pending Approval" },
  "late":             { color: C.redLight,   bg: 'rgba(224,90,74,0.1)',    border: '1px solid rgba(224,90,74,0.2)',   dot: C.redLight,   label: "Late" },
  "rejected":         { color: C.redLight,   bg: 'rgba(224,90,74,0.08)',   border: '1px solid rgba(224,90,74,0.15)',  dot: C.redLight,   label: "Rejected" },
  "collections":      { color: C.purple,     bg: 'rgba(139,92,246,0.1)',   border: '1px solid rgba(139,92,246,0.2)',  dot: C.purple,     label: "Collections" },
  "partial":          { color: C.blue,       bg: 'rgba(58,143,212,0.1)',   border: '1px solid rgba(58,143,212,0.2)',  dot: C.blue,       label: "Partial" },
};

const REJECT_REASONS = [
  "Amount does not match rent due",
  "Proof of payment is not legible",
  "Wrong reference number",
  "Payment made to wrong account",
  "Duplicate submission",
  "Other",
];

const FILTERS = ["All", "Paid", "Pending Approval", "Late", "Collections", "Rejected"];

const FILTER_MAP = {
  "All": "All",
  "Paid": "paid",
  "Pending Approval": "pending",
  "Late": "late",
  "Collections": "collections",
  "Rejected": "rejected",
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

function formatAmount(amount) { return amount ? `R ${Number(amount).toLocaleString("en-ZA")}` : "—"; }
function initials(name) { return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(); }

function StatusBadge({ status }) {
  const cfg = statusConfig[status] ?? statusConfig["pending"];
  return (
    <span style={pillStyle(cfg)}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function SummaryBar({ totalExpected, totalCollected, pendingCount, lateCount, totalPayments }) {
  const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0;

  const items = [
    { label: "Expected",         value: formatAmount(totalExpected),  sub: `${totalPayments} tenants`,        valueColor: C.white },
    { label: "Collected",        value: formatAmount(totalCollected), sub: `${collectionRate}% collection rate`, valueColor: C.greenLight },
    { label: "Pending Approval", value: pendingCount,           sub: pendingCount === 1 ? "needs review" : "need review", valueColor: pendingCount > 0 ? C.gold : C.white, alert: pendingCount > 0, alertColor: C.gold },
    { label: "Late / Collections", value: lateCount,            sub: lateCount === 1 ? "requires attention" : "require attention", valueColor: lateCount > 0 ? C.redLight : C.white, alert: lateCount > 0, alertColor: C.redLight },
  ];

  return (
    <div style={{ ...cardStyle, marginBottom: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0 }}>
        <style>{`
          @media (min-width: 640px) { .summary-grid { grid-template-columns: repeat(2, 1fr) !important; } }
          @media (min-width: 1024px) { .summary-grid { grid-template-columns: repeat(4, 1fr) !important; } }
        `}</style>
        <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
          {items.map((item, i) => (
            <div key={item.label} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '1rem 1.25rem', gap: '0.8rem',
              borderBottom: `1px solid ${C.border}`,
            }}>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                  {item.label}
                </p>
                <p style={{ fontSize: '1.25rem', fontWeight: 700, color: item.valueColor, fontFamily: F.bebas, letterSpacing: '0.03em' }}>
                  {item.value}
                </p>
                <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginTop: '0.15rem' }}>{item.sub}</p>
              </div>
              {item.alert && (
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.alertColor, flexShrink: 0, animation: 'pulse 2s ease-in-out infinite', opacity: 0.7 }} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '0.75rem 1.25rem 1rem', borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono }}>Collection progress</span>
          <span style={{
            fontSize: '0.62rem', fontWeight: 600, fontFamily: F.mono,
            color: collectionRate >= 80 ? C.greenLight : collectionRate >= 50 ? C.gold : C.redLight,
          }}>
            {collectionRate}%
          </span>
        </div>
        <div style={{ width: '100%', height: 4, borderRadius: '2px', background: 'rgba(245,240,232,0.08)', overflow: 'hidden' }}>
          <div style={{
            height: 4, borderRadius: '2px', transition: 'width 0.5s',
            background: collectionRate >= 80 ? C.greenLight : collectionRate >= 50 ? C.gold : C.redLight,
            width: `${Math.min(collectionRate, 100)}%`,
          }} />
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ payment, onClose, onApproved, onRejected }) {
  const [rejectReason, setRejectReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [step, setStep] = useState("view");
  const [loading, setLoading] = useState(false);
  const tenantName = payment.tenant_name || payment.tenant || "Unknown";
  const unitInfo = payment.unit_number || payment.unit || "—";
  const amount = payment.amount_paid || payment.amount || 0;
  const dueDate = payment.due_date || payment.due || "—";
  const paidDate = payment.payment_date || payment.paid || "—";
  const method = payment.payment_method || payment.method || "—";
  const reference = payment.bank_reference || payment.reference || "—";
  const hasProof = !!payment.proof_of_payment_url;

  async function handleApprove() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/landlord/payments/${payment.id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onApproved(payment.id);
      onClose();
    } catch (err) {
      console.error("Approve error:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    const reason = rejectReason === "Other" ? customReason : rejectReason;
    if (!reason) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/landlord/payments/${payment.id}/reject`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onRejected(payment.id, reason);
      onClose();
    } catch (err) {
      console.error("Reject error:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={modalOverlay}>
      <div style={{ width: '100%', maxWidth: 500, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '92vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>
              {step === "view" ? "Review Payment" : "Reject Payment"}
            </h3>
            <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{tenantName} · {unitInfo}</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ borderRadius: '3px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            {[
              ["Amount", formatAmount(amount)],
              ["Due Date", dueDate],
              ["Date Paid", paidDate],
              ["Method", method],
              ["Reference", reference],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.9rem', background: 'rgba(245,240,232,0.02)', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.4)' }}>{label}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 500, color: C.white }}>{val}</span>
              </div>
            ))}
          </div>

          {hasProof && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.9rem', borderRadius: '3px', background: 'rgba(26,122,74,0.06)', border: '1px solid rgba(76,186,122,0.15)' }}>
              <Icon name="check" size={14} color={C.greenLight} />
              <span style={{ fontSize: '0.72rem', color: C.greenLight, fontWeight: 500 }}>Proof of payment attached</span>
            </div>
          )}

          {step === "reject" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Reason for Rejection</p>
              {REJECT_REASONS.map(r => (
                <label key={r} style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem',
                  borderRadius: '3px', border: `1px solid ${rejectReason === r ? 'rgba(224,90,74,0.4)' : C.border}`,
                  background: rejectReason === r ? 'rgba(224,90,74,0.08)' : 'transparent',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <input type="radio" name="reject-reason" value={r} checked={rejectReason === r} onChange={() => setRejectReason(r)} style={{ accentColor: C.redLight, width: 14, height: 14 }} />
                  <span style={{ fontSize: '0.75rem', color: C.white }}>{r}</span>
                </label>
              ))}
              {rejectReason === "Other" && (
                <textarea rows={2} value={customReason} onChange={e => setCustomReason(e.target.value)} placeholder="Specify reason..." style={{ ...inputStyle, resize: 'vertical', minHeight: 50, fontSize: '0.72rem' }} />
              )}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          {step === "view" ? (
            <>
              <button onClick={() => setStep("reject")} style={{ ...btnGhost, flex: 1, textAlign: 'center', color: C.redLight, borderColor: 'rgba(224,90,74,0.3)' }}>Reject</button>
              <button onClick={handleApprove} disabled={loading} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', background: C.greenLight }}>
                {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: C.black, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <><Icon name="check" size={14} /> Approve</>}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep("view")} disabled={loading} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Back</button>
              <button onClick={handleReject} disabled={loading || (!rejectReason || (rejectReason === "Other" && !customReason))} style={{
                flex: 1, padding: '0.6rem 1.2rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600,
                fontFamily: F.dm, letterSpacing: '0.04em', border: 'none', cursor: (loading || !rejectReason) ? 'not-allowed' : 'pointer',
                background: C.red, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                opacity: (loading || !rejectReason || (rejectReason === "Other" && !customReason)) ? 0.5 : 1,
              }}>
                {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: C.white, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : "Confirm Rejection"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function CollectionsModal({ payment, onClose, onConfirm }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
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
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Add context or instructions..."
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
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [reviewPayment, setReviewPayment] = useState(null);
  const [collectionsPayment, setCollectionsPayment] = useState(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("invoices"); 
  const [invoices, setInvoices] = useState([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceFilter, setInvoiceFilter] = useState("All");

  useDocumentTitle("Billing & Payments");

  const fetchInvoices = useCallback(async () => {
    setLoadingInvoices(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/landlord/payments/invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setInvoices(data.invoices || []);
    } catch (err) {
      console.error("Fetch invoices:", err);
    } finally {
      setLoadingInvoices(false);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/landlord/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(data.payments || []);
    } catch (err) {
      console.error("Fetch payments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchInvoices(); fetchPayments(); }, [fetchInvoices, fetchPayments]);

  function handleApproved(id) {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'paid' } : p));
    fetchInvoices(); 
    toast.success("Payment approved. Receipt generated and sent to tenant.");
  }

  function handleRejected(id, reason) {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'rejected', rejection_reason: reason } : p));
    toast.error(`Payment rejected: "${reason}". Tenant has been notified.`);
  }

  function handleCollections(id) {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'collections' } : p));
    fetchInvoices();
    toast.warning("Account escalated to collections.");
  }

  const filteredPayments = payments.filter(p => {
    const matchFilter = filter === "All" || p.status === FILTER_MAP[filter];
    const q = search.toLowerCase();
    const tenantName = p.tenant_name || "";
    const unitInfo = p.unit_number || "";
    const propertyName = p.property_name || "";
    const matchSearch = !q || tenantName.toLowerCase().includes(q) || unitInfo.toLowerCase().includes(q) || propertyName.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  const INVOICE_FILTERS = ["All", "Unpaid", "Paid", "Overdue"];
  const INVOICE_FILTER_MAP = { "All": "All", "Unpaid": "sent", "Paid": "paid", "Overdue": "overdue" };

  const filteredInvoices = invoices.filter(inv => {
    const matchFilter = invoiceFilter === "All" || inv.status === INVOICE_FILTER_MAP[invoiceFilter];
    const q = search.toLowerCase();
    const tenantName = inv.tenant_name || "";
    const unitInfo = inv.unit_number || "";
    const matchSearch = !q || tenantName.toLowerCase().includes(q) || unitInfo.toLowerCase().includes(q);
    return matchFilter && matchSearch;
  });

  // Summary calculations
  const totalExpected  = invoices.filter(i => i.status === 'sent' || i.status === 'overdue' || i.status === 'paid').reduce((s, i) => s + Number(i.amount_due || 0), 0);
  const totalCollected = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount_due || 0), 0);
  const unpaidCount    = invoices.filter(i => i.status === 'sent').length;
  const overdueCount   = invoices.filter(i => i.status === 'overdue').length;
  const pendingPayments = payments.filter(p => p.status === 'pending' || p.status === 'pending_approval').length;
  const latePayments    = payments.filter(p => p.status === 'late' || p.status === 'collections').length;

  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    subtitle: { fontSize: '0.75rem', color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, marginTop: '0.3rem' },
    toolbarInner: { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', flexWrap: 'wrap' },
    filterBtn: (active) => ({ padding: '0.4rem 0.8rem', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 600, fontFamily: F.mono, letterSpacing: '0.04em', border: `1px solid ${active ? C.gold : C.border}`, background: active ? 'rgba(232,160,18,0.12)' : 'transparent', color: active ? C.gold : 'rgba(245,240,232,0.4)', cursor: 'pointer', transition: 'all 0.15s' }),
    searchWrap: { position: 'relative', marginLeft: 'auto' },
    searchIcon: { position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.25)' },
    searchInput: { padding: '0.5rem 0.8rem 0.5rem 2.25rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, fontSize: '0.78rem', outline: 'none', width: 220 },
    table: { width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' },
    th: { fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.7rem 1rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` },
    td: { padding: '0.7rem 1rem', borderBottom: `1px solid ${C.border}` },
    footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono },
  };

  return (
    <div style={S.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.7; } 50% { opacity: 0.3; } }
        input:focus, select:focus { border-color: ${C.borderFocus} !important; }
      `}</style>

      {reviewPayment && (
        <ReviewModal payment={reviewPayment} onClose={() => setReviewPayment(null)} onApproved={handleApproved} onRejected={handleRejected} />
      )}
      {collectionsPayment && (
        <CollectionsModal payment={collectionsPayment} onClose={() => setCollectionsPayment(null)} onConfirm={handleCollections} />
      )}
      {showFullReport && <FullReportModal onClose={() => setShowFullReport(false)} />}

      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}><Icon name="credit-card" size={24} color={C.gold} />Billing & Payments</h1>
          <p style={S.subtitle}>{invoices.length} invoices · {payments.length} payments</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => { fetchInvoices(); fetchPayments(); }} style={btnGhost}><Icon name="refresh" size={14} /> Refresh</button>
          <button onClick={() => setShowFullReport(true)} style={btnPrimary}><Icon name="download" size={14} /> Export Report</button>
        </div>
      </div>

      <SummaryBar 
        totalExpected={totalExpected} 
        totalCollected={totalCollected} 
        pendingCount={pendingPayments + unpaidCount} 
        lateCount={latePayments + overdueCount} 
        totalPayments={invoices.length} 
      />

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
                    {f}{f !== "All" && <span style={{ marginLeft: '0.3rem', opacity: 0.6 }}>{invoices.filter(inv => inv.status === INVOICE_FILTER_MAP[f]).length}</span>}
                  </button>
                ))}
              </div>
              <div style={S.searchWrap}>
                <Icon name="search" size={14} style={S.searchIcon} />
                <input type="text" placeholder="Search tenant, unit..." value={search} onChange={e => setSearch(e.target.value)} style={S.searchInput} />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={S.table}>
                <thead>
                  <tr>
                    {["Invoice #", "Tenant", "Unit / Property", "Amount", "Period", "Due Date", "Status"].map(h => (
                      <th key={h} style={S.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingInvoices ? (
                    <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: '3rem 0', color: 'rgba(245,240,232,0.25)' }}>Loading invoices...</td></tr>
                  ) : filteredInvoices.length === 0 ? (
                    <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: '3rem 0', color: 'rgba(245,240,232,0.25)' }}>No invoices match your filters.</td></tr>
                  ) : (
                    filteredInvoices.map(inv => {
                      const invStatus = inv.status === 'sent' ? { color: C.gold, bg: 'rgba(232,160,18,0.08)', border: '1px solid rgba(232,160,18,0.15)', dot: C.gold, label: 'Unpaid' }
                        : inv.status === 'paid' ? { color: C.greenLight, bg: 'rgba(26,122,74,0.08)', border: '1px solid rgba(76,186,122,0.15)', dot: C.greenLight, label: 'Paid' }
                        : { color: C.redLight, bg: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.15)', dot: C.redLight, label: 'Overdue' };
                      return (
                        <tr key={inv.id} style={{ transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = C.muted}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={{ ...S.td, fontFamily: F.mono, fontSize: '0.7rem', color: 'rgba(245,240,232,0.5)' }}>{inv.invoice_number}</td>
                          <td style={S.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(245,240,232,0.2)', color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.6rem', flexShrink: 0 }}>
                                {initials(inv.tenant_name || "?")}
                              </div>
                              <span style={{ fontWeight: 500, color: C.white }}>{inv.tenant_name || "—"}</span>
                            </div>
                          </td>
                          <td style={S.td}>
                            <div style={{ fontWeight: 500, color: C.white }}>{inv.unit_number || "—"}</div>
                            <div style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{inv.property_name || "—"}</div>
                          </td>
                          <td style={{ ...S.td, fontWeight: 600, color: C.white }}>{formatAmount(inv.amount_due)}</td>
                          <td style={S.td}>
                            {inv.billing_period_start 
                              ? new Date(inv.billing_period_start).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
                              : "—"}
                          </td>
                          <td style={{ ...S.td, fontFamily: F.mono, fontSize: '0.7rem', color: 'rgba(245,240,232,0.5)' }}>
                            {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) : "—"}
                          </td>
                          <td style={S.td}>
                            <span style={pillStyle(invStatus)}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: invStatus.dot }} />
                              {invStatus.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* PAYMENTS TABLE */}
        {activeTab === "payments" && (
          <>
            <div style={S.toolbarInner}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {FILTERS.map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={S.filterBtn(filter === f)}>
                    {f}{f !== "All" && <span style={{ marginLeft: '0.3rem', opacity: 0.6 }}>{payments.filter(p => p.status === FILTER_MAP[f]).length}</span>}
                  </button>
                ))}
              </div>
              <div style={S.searchWrap}>
                <Icon name="search" size={14} style={S.searchIcon} />
                <input type="text" placeholder="Search tenant, unit..." value={search} onChange={e => setSearch(e.target.value)} style={S.searchInput} />
              </div>
            </div>

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
                  {loading ? (
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
                      return (
                        <tr key={p.id} style={{ transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = C.muted}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <td style={S.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(245,240,232,0.25)', color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.65rem', flexShrink: 0 }}>{initials(tenantName)}</div>
                              <div>
                                <div style={{ fontWeight: 600, color: C.white }}>{tenantName}</div>
                                {p.rejection_reason && <div style={{ fontSize: '0.62rem', color: C.redLight, marginTop: '1px' }} title={p.rejection_reason}>↳ {p.rejection_reason}</div>}
                              </div>
                            </div>
                          </td>
                          <td style={S.td}><div style={{ fontWeight: 500, color: C.white }}>{unitInfo}</div><div style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{propertyName}</div></td>
                          <td style={{ ...S.td, fontWeight: 600, color: C.white }}>{formatAmount(amount)}</td>
                          <td style={S.td}>{method}</td>
                          <td style={S.td}><span style={{ fontFamily: F.mono, fontSize: '0.72rem', color: 'rgba(245,240,232,0.4)' }}>{reference}</span></td>
                          <td style={S.td}>{hasProof ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: C.greenLight, fontWeight: 500 }}><Icon name="check" size={12} /> Yes</span> : <span style={{ color: 'rgba(245,240,232,0.25)' }}>—</span>}</td>
                          <td style={S.td}><StatusBadge status={p.status} /></td>
                          <td style={S.td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                              {(p.status === "pending" || p.status === "pending_approval") && (
                                <button onClick={() => setReviewPayment(p)} style={{ fontSize: '0.68rem', fontWeight: 500, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}>Review</button>
                              )}
                              {(p.status === "late" || p.status === "rejected") && (
                                <button onClick={() => setCollectionsPayment(p)} style={{ fontSize: '0.68rem', fontWeight: 500, color: C.purple, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}>Collections</button>
                              )}
                              {p.status === "paid" && (
                                <button onClick={() => navigate(`/landlord/payments/receipt/${p.id}`, { state: { payment: p } })} style={{ fontSize: '0.68rem', fontWeight: 500, color: 'rgba(245,240,232,0.3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}>View Receipt</button>
                              )}
                              {p.status === "collections" && (
                                <span style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, fontStyle: 'italic' }}>Escalated</span>
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
          </>
        )}

        <div style={S.footer}>
          <span>
            Showing <span style={{ color: C.white, fontWeight: 500 }}>
              {activeTab === "invoices" ? filteredInvoices.length : filteredPayments.length}
            </span> of <span style={{ color: C.white, fontWeight: 500 }}>
              {activeTab === "invoices" ? invoices.length : payments.length}
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