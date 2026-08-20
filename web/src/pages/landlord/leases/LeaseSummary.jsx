/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import {
  FiChevronRight, FiChevronDown, FiEdit, FiX, FiPlus,
  FiDownload, FiEye, FiFileText, FiCreditCard, FiBarChart2,
  FiSave, FiMail,
} from "react-icons/fi";
import { FaInfoCircle } from "react-icons/fa";
import { IoMdCash, IoIosStats } from "react-icons/io";
import { c as COLORS } from "../../../styles/theme";
import UseDepositModal from "../../../components/UseDepositModal";

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const TABS = [
  { id: "lease", label: "Lease", icon: FaInfoCircle },
  { id: "financials", label: "Financials", icon: IoMdCash },
  { id: "reports", label: "Reports", icon: IoIosStats },
];

const FIN_SUBTABS = [
  { id: "financials", label: "Statement" },
  { id: "curinvoice", label: "Current invoice" },
  { id: "deposits", label: "Deposits" },
];

function formatAmount(n) {
  return n === null || n === undefined || n === "" ? "—" : `R ${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}
function formatDateLong(d) {
  return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" }) : "—";
}

function InfoRow({ label, children, compact }) {
  const labelWidth = compact ? "110px" : "150px";
  return (
    <div style={{
      display: 'flex',
      overflow: 'hidden',
      border: '1px solid #e2e3e4',
      marginBottom: '0.4rem',
      fontSize: '14px',
      fontWeight: 400,
      flex: compact ? 1 : undefined,
    }}>
      <div style={{
        width: labelWidth,
        flexShrink: 0,
        padding: '0.4rem 0.6rem',
        color: '#000',
        fontWeight: 500,
        background: '#fdfdfd',
        borderRight: '1px solid #e9ecef',
        display: 'flex',
        alignItems: 'center',
      }}>
        {label}
      </div>
      <div style={{
        padding: '0.4rem 0.6rem',
        color: '#000',
        background: '#f5f5f5',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        fontWeight: 400,
      }}>
        {children}
      </div>
    </div>
  );
}

const thStyle = {
  padding: '0.6rem 0.8rem',
  fontSize: '12px',
  fontWeight: 600,
  color: '#000',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  background: '#e9eced52',
  border: '1px solid #9a9d9e52',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};
const tdStyle = {
  padding: '0.6rem 0.8rem',
  fontSize: '12px',
  color: '#151515',
  border: '1px solid #9a9d9e52',
  verticalAlign: 'middle',
  fontWeight: 400,
  background: '#e9eced52',
};

const outlineBtn = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '0.35rem',
  background: '#fdfdfd',
  color: '#000',
  border: '1px solid #ccc',
  padding: '0.3rem 0.7rem',
  fontSize: '14px',
  fontWeight: 400,
  cursor: 'pointer',
  fontFamily: FONT,
  borderRadius: '2px',
};

const primaryBtn = {
  ...outlineBtn,
  background: '#2c3e50',
  color: '#ffffff',
  border: '1px solid #2c3e50',
};

function CashPaymentModal({ invoice, onClose, onSuccess }) {
  const remainingBalance = Number(invoice?.remaining_balance ?? invoice?.amount_due ?? 0);
  const [amount, setAmount] = useState(remainingBalance > 0 ? String(remainingBalance) : "");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const toast = useToast();

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
        invoice_id: invoice.id,
        amount_paid: numericAmount,
        notes: notes || "Cash payment recorded from lease summary"
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Cash payment recorded.");
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err?.response?.data?.error || "Failed to record cash payment.";
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
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#555' }}><FiX size={16} /></button>
        </div>
        <div style={{ padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div style={{ background: '#f9fafb', border: '1px solid #e9ecef', padding: '0.7rem' }}>
            <p style={{ fontSize: '12px', color: '#333', marginBottom: '0.3rem' }}>INVOICE</p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#000' }}>{invoice.invoice_number || `INV-${invoice.id}`}</p>
            <p style={{ fontSize: '12px', color: '#333' }}>Remaining: {formatAmount(remainingBalance)}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>Amount Received (ZAR)</label>
            <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setError(""); }}
              min="0" max={remainingBalance || undefined} step="0.01"
              style={{ width: '100%', fontSize: '16px', fontWeight: 500, padding: '0.4rem 0.7rem', background: '#fdfdfd', border: `1px solid ${exceedsBalance ? '#9e3a3a' : '#dee2e6'}`, color: '#000', outline: 'none' }} />
            <span style={{ fontSize: '12px', color: exceedsBalance ? '#9e3a3a' : '#333' }}>
              Total: {formatAmount(invoice.amount_due)} • Remaining: {formatAmount(remainingBalance)}
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
          <button onClick={onClose} disabled={loading} style={{ flex: 1, padding: '0.4rem', borderRadius: '2px', fontSize: '14px', fontWeight: 400, background: '#fdfdfd', color: '#000', border: '1px solid #ccc', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading || !isValid} style={{
            flex: 1, padding: '0.4rem', borderRadius: '2px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer',
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

export default function LeaseSummary() {
  useDocumentTitle("Lease Summary");
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const [lease, setLease] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bankDetailsOpen, setBankDetailsOpen] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [leaseForm, setLeaseForm] = useState({});
  const [saving, setSaving] = useState(false);

  const [financials, setFinancials] = useState({ invoices: [], payments: [], deposits: [] });
  const [finLoading, setFinLoading] = useState(false);
  const [showCashPayment, setShowCashPayment] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [useDeposit, setUseDeposit] = useState(null);
  const [depositLoading, setDepositLoading] = useState(false);

  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailSubject, setEmailSubject] = useState("");

  const tabParam = searchParams.get("tab") || "lease";
  const activeMain = ["financials", "curinvoice", "deposits"].includes(tabParam)
    ? "financials" : tabParam === "reports" ? "reports" : "lease";
  const activeFinSub = tabParam === "curinvoice" ? "curinvoice" : tabParam === "deposits" ? "deposits" : "financials";

  const fetchLease = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/leases/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLease(data.lease);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load lease");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchFinancials = useCallback(async () => {
    if (!lease?.id) return;
    setFinLoading(true);
    try {
      const token = localStorage.getItem("token");
      const [invRes, payRes, depRes] = await Promise.all([
        axios.get(`${API}/landlord/payments/invoices`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 200 },
        }),
        axios.get(`${API}/landlord/payments`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 200 },
        }),
        axios.get(`${API}/landlord/payments/deposits`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { limit: 200 },
        }),
      ]);
      const invoices = (invRes.data.invoices || []).filter(i => i.lease_id === lease.id);
      const payments = (payRes.data.payments || []).filter(p => p.lease_id === lease.id);
      const deposits = (depRes.data.deposits || []).filter(d => d.lease_id === lease.id);
      setFinancials({ invoices, payments, deposits });
    } catch (err) {
      console.error("Failed to fetch financials:", err);
    } finally {
      setFinLoading(false);
    }
  }, [lease?.id]);

  useEffect(() => { fetchLease(); }, [fetchLease]);
  useEffect(() => { if (lease) fetchFinancials(); }, [lease, fetchFinancials]);

  useEffect(() => {
    if (lease?.tenant_email) {
      setEmailRecipient(lease.tenant_email);
    }
    if (financials.invoices.length > 0) {
      const currentInv = financials.invoices.find(i => ["sent", "overdue", "partial"].includes(i.status)) || financials.invoices[0];
      if (currentInv) {
        setEmailSubject(`Invoice ${currentInv.invoice_number || currentInv.id} from your landlord`);
      }
    }
  }, [lease, financials.invoices]);

  function goTab(tabId) {
    setSearchParams({ tab: tabId });
  }

  function notReady() {
    toast.success("This action isn't wired up yet.");
  }

  function startEdit() {
    setLeaseForm({
      lease_start_date: lease.lease_start_date || "",
      lease_end_date: lease.lease_end_date || "",
      rent_amount: lease.rent_amount ?? "",
      deposit_amount: lease.deposit_amount ?? "",
      payment_frequency: lease.payment_frequency || "monthly",
      payment_due_day: lease.payment_due_day ?? "",
      status: lease.status || "active",
    });
    setEditMode(true);
  }

  async function saveEdit() {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        lease_start_date: leaseForm.lease_start_date,
        lease_end_date: leaseForm.lease_end_date,
        rent_amount: parseFloat(leaseForm.rent_amount),
        deposit_amount: leaseForm.deposit_amount ? parseFloat(leaseForm.deposit_amount) : null,
        payment_frequency: leaseForm.payment_frequency,
        payment_due_day: leaseForm.payment_due_day ? parseInt(leaseForm.payment_due_day) : null,
        status: leaseForm.status,
      };
      await axios.put(`${API}/leases/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Lease updated!");
      setEditMode(false);
      fetchLease();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update lease.");
    } finally {
      setSaving(false);
    }
  }

  async function openUseDeposit() {
    if (!financials.deposits.length) {
      toast.error("No deposit found for this lease.");
      return;
    }
    const deposit = financials.deposits.find(d => {
      const avail = Number(d.amount_held ?? d.amount ?? 0) - Number(d.amount_refunded ?? 0) - Number(d.used_amount ?? 0);
      return avail > 0;
    });
    if (!deposit) {
      toast.error("No available deposit balance.");
      return;
    }
    setDepositLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/landlord/payments/deposits/${deposit.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUseDeposit({ ...(data.deposit || data), invoice_id: currentInvoice?.id });
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to load deposit details.");
    } finally {
      setDepositLoading(false);
    }
  }

  function openCashPayment() {
  if (!currentInvoice) {
    toast.error("No open invoice available for payment.");
    return;
  }
  setSelectedInvoice(currentInvoice);
  setShowCashPayment(true);
}

  function sendEmail() {
    if (!emailRecipient.trim()) {
      toast.error("Please enter a recipient email.");
      return;
    }
    toast.success(`Email would be sent to ${emailRecipient}`);
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
        padding: '4rem 2rem', color: '#95a5a6', fontWeight: 300,
        background: '#fdfdfd', border: '1px solid #e9ecef',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', fontFamily: FONT,
      }}>
        <span style={{ width: 22, height: 22, border: '2px solid rgba(44,62,80,0.1)', borderTopColor: '#2c3e50', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
        <span style={{ fontSize: '14px' }}>Loading lease...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !lease) {
    return (
      <div style={{
        padding: '3rem 2rem', textAlign: 'center', fontWeight: 300,
        background: '#fdfdfd', border: '1px solid #e9ecef',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', fontFamily: FONT,
      }}>
        <p style={{ fontSize: '14px', color: '#c0392b', marginBottom: '0.8rem' }}>{error || "Lease not found"}</p>
        <button onClick={fetchLease} style={{ background: 'transparent', color: '#2471a3', border: 'none', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>
          Try again
        </button>
      </div>
    );
  }

  const invoices = financials.invoices;
  const payments = financials.payments;
  const deposits = financials.deposits;

  const depositRequired = Number(lease.deposit_amount) || 0;
  const depositHeld = deposits.reduce((sum, d) => {
    return sum + Math.max(0, Number(d.amount_held ?? d.amount ?? 0) - Number(d.amount_refunded ?? 0) - Number(d.used_amount ?? 0));
  }, 0);
  const depositOutstanding = Math.max(0, depositRequired - depositHeld);

  const balanceDue = invoices.reduce((sum, i) => sum + (Number(i.remaining_balance) || 0), 0);

  const statementRows = [
    ...invoices.map(i => ({
      id: `inv-${i.id}`,
      date: i.due_date || i.billing_period_end,
      description: i.invoice_number ? `Invoice ${i.invoice_number}` : "Invoice",
      debit: Number(i.amount_due) || 0,
      credit: null,
      status: i.status,
    })),
    ...payments.map(p => ({
      id: `pay-${p.id}`,
      date: p.payment_date,
      description: `Payment${p.payment_method ? ` (${p.payment_method})` : ""}`,
      debit: null,
      credit: Number(p.amount_paid) || 0,
      status: p.status,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const currentInvoice = invoices.find(i => ["sent", "overdue", "partial"].includes(i.status)) || invoices[0] || null;
  const openInvoice = currentInvoice && ["sent", "overdue", "partial"].includes(currentInvoice.status) ? currentInvoice : null;
  const canRecordCash = openInvoice && openInvoice.remaining_balance > 0;
  const availableDeposit = deposits.find(d => {
    const avail = Number(d.amount_held ?? d.amount ?? 0) - Number(d.amount_refunded ?? 0) - Number(d.used_amount ?? 0);
    return avail > 0;
  });
  const canUseDeposit = canRecordCash && availableDeposit;

  const invoiceLineRows = currentInvoice ? [
    { description: "Rent due", date: currentInvoice.billing_period_start || currentInvoice.due_date, amount: Number(currentInvoice.amount_due) || 0 },
  ] : [];
  const invoiceTotalDue = invoiceLineRows.reduce((sum, r) => sum + r.amount, 0);

  const depositRows = deposits.map(d => ({
    id: `dep-${d.id}`,
    date: d.date_held,
    description: "Deposit held",
    debit: Number(d.amount_held ?? d.amount ?? 0),
    credit: 0,
  }));

  const today = new Date();
  const todayFormatted = formatDateLong(today);

  return (
    <div style={{ fontSize: '14px', fontWeight: 400, fontFamily: FONT, color: '#000' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .rb-link { color: #2471a3; text-decoration: none; font-size: 14px; }
        .rb-link:hover { text-decoration: underline; }
        .rb-link.bold { font-weight: 600; color: #000; }
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
        <Link to="/landlord/leases" className="rb-link">Leases</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>{lease?.tenant_name || "Lease"}</span>
      </div>

      {/* Main card */}
      <div style={{
        background: '#fefcfccf', border: '1px solid #e9ecef',
        boxShadow: '1px 1px 1px 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)', overflow: 'hidden',
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'flex-end', background: '#eee', boxShadow: '1px 1px 1px 1px rgba(0,0,0,0.1)' }}>
          {TABS.map(tab => {
            const active = activeMain === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => goTab(tab.id === "financials" ? "financials" : tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.8rem',
                  fontSize: '14px', fontWeight: active ? 500 : 400,
                  color: active ? '#000' : '#333',
                  background: active ? '#fdfdfd' : 'transparent',
                  border: active ? '1px solid #e9ecef' : '1px solid transparent',
                  borderBottom: active ? '1px solid #fdfdfd' : 'none',
                  borderTop: active ? '2px solid #3498db' : '2px solid transparent',
                  cursor: 'pointer', marginBottom: active ? '-1px' : '0',
                  position: 'relative', zIndex: active ? 2 : 1,
                  transition: 'background 0.15s, border-color 0.15s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <TabIcon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ border: '1px solid #e9ecefbe', minHeight: '300px', margin: '0.8rem 0.6rem 1.6rem', boxShadow: '1px 1px 1px 1px rgba(0,0,0,0.2)', borderRadius: '2px' }}>

          {/* LEASE TAB */}
          {activeMain === "lease" && (
            <div style={{ padding: '1.2rem' }}>
              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Lease Start</label>
                      <input
                        type="date"
                        value={leaseForm.lease_start_date}
                        onChange={e => setLeaseForm(prev => ({ ...prev, lease_start_date: e.target.value }))}
                        style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Lease End</label>
                      <input
                        type="date"
                        value={leaseForm.lease_end_date}
                        onChange={e => setLeaseForm(prev => ({ ...prev, lease_end_date: e.target.value }))}
                        style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Monthly Rent (R)</label>
                      <input
                        type="number"
                        value={leaseForm.rent_amount}
                        onChange={e => setLeaseForm(prev => ({ ...prev, rent_amount: e.target.value }))}
                        style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Deposit (R)</label>
                      <input
                        type="number"
                        value={leaseForm.deposit_amount}
                        onChange={e => setLeaseForm(prev => ({ ...prev, deposit_amount: e.target.value }))}
                        style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Payment Frequency</label>
                      <select
                        value={leaseForm.payment_frequency}
                        onChange={e => setLeaseForm(prev => ({ ...prev, payment_frequency: e.target.value }))}
                        style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }}
                      >
                        <option value="monthly">Monthly</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi‑Weekly</option>
                        <option value="quarterly">Quarterly</option>
                      </select>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Payment Due Day</label>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={leaseForm.payment_due_day}
                        onChange={e => setLeaseForm(prev => ({ ...prev, payment_due_day: e.target.value }))}
                        style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }}
                      />
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Status</label>
                    <select
                      value={leaseForm.status}
                      onChange={e => setLeaseForm(prev => ({ ...prev, status: e.target.value }))}
                      style={{ width: '100%', padding: '0.4rem 0.6rem', fontSize: '14px', border: '1px solid #ccc', borderRadius: '2px', color: '#000' }}
                    >
                      <option value="active">Active</option>
                      <option value="expired">Expired</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' }}>
                    <button
                      onClick={() => setEditMode(false)}
                      disabled={saving}
                      style={{ background: '#fdfdfd', color: '#000', border: '1px solid #ccc', padding: '0.4rem 0.8rem', borderRadius: '2px', cursor: 'pointer', fontSize: '14px' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      style={{ background: '#2c3e50', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '2px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      {saving ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <FiSave size={14} />}
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <InfoRow label="Tenant" compact>{lease.tenant_name || "—"}</InfoRow>
                    <InfoRow label="Status" compact><span style={{ textTransform: 'capitalize' }}>{lease.status || "—"}</span></InfoRow>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <InfoRow label="Property" compact>{lease.property_name || "—"}</InfoRow>
                    <InfoRow label="Unit" compact>{lease.unit_number ? `Unit ${lease.unit_number}` : "—"}</InfoRow>
                  </div>
                  <InfoRow label="Lease Term">{formatDate(lease.lease_start_date)} to {formatDate(lease.lease_end_date)}</InfoRow>
                  <InfoRow label="Monthly Rent">{formatAmount(lease.rent_amount)}</InfoRow>
                  <InfoRow label="Deposit">{formatAmount(lease.deposit_amount)}</InfoRow>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <InfoRow label="Payment Frequency" compact><span style={{ textTransform: 'capitalize' }}>{lease.payment_frequency || "Monthly"}</span></InfoRow>
                    <InfoRow label="Payment Due Day" compact>{lease.payment_due_day ? `Day ${lease.payment_due_day}` : "—"}</InfoRow>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                    <button
                      onClick={startEdit}
                      style={outlineBtn}
                    >
                      <FiEdit size={14} /> Edit Lease
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* FINANCIALS TAB  */}
          {activeMain === "financials" && (
            <div style={{ padding: '1.2rem' }}>
              {/* Summary cards */}
              <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 140, border: '1px solid #e9ecef', background: '#f9fafb', padding: '0.8rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#000' }}>{formatAmount(balanceDue)}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', color: '#333' }}>BALANCE DUE</div>
                </div>
                <div style={{ flex: 1, minWidth: 140, border: '1px solid #e9ecef', background: '#f9fafb', padding: '0.8rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#000' }}>{formatAmount(depositHeld)}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', color: '#333' }}>DEPOSIT HELD</div>
                </div>
                <div style={{ flex: 1, minWidth: 140, border: '1px solid #e9ecef', background: '#f9fafb', padding: '0.8rem', textAlign: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, color: '#000' }}>{formatAmount(depositOutstanding)}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.05em', color: '#333' }}>DEPOSIT OUTSTANDING</div>
                </div>
              </div>

              {/* Sub-tabs */}
              <div style={{ display: 'flex', borderLeft: '4px solid #3498db', background: '#f9fafb', padding: '0.6rem 1rem', marginBottom: '1rem', flexDirection: 'column', gap: '0.3rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', fontSize: '14px' }}>
                  {FIN_SUBTABS.map((sub, i) => (
                    <span key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <a
                        href="#fin"
                        onClick={(e) => { e.preventDefault(); goTab(sub.id); }}
                        className={`rb-link ${activeFinSub === sub.id ? 'bold' : ''}`}
                        style={{ fontWeight: activeFinSub === sub.id ? 600 : 400, color: activeFinSub === sub.id ? '#000' : '#2471a3' }}
                      >
                        {sub.label}
                      </a>
                      {i < FIN_SUBTABS.length - 1 && <span style={{ color: '#adb5bd' }}>|</span>}
                    </span>
                  ))}
                </div>
              </div>

              {finLoading && (
                <p style={{ textAlign: 'center', color: '#555', padding: '1rem' }}>Loading financials…</p>
              )}

              {activeFinSub === "financials" && !finLoading && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={openCashPayment}
                      disabled={!canRecordCash}
                      title={!canRecordCash ? "No open invoice with balance due" : ""}
                      style={{ ...outlineBtn, opacity: canRecordCash ? 1 : 0.5, cursor: canRecordCash ? 'pointer' : 'not-allowed' }}
                    >
                      <IoMdCash size={14} /> Record Cash Payment
                    </button>
                    <button
                      onClick={openUseDeposit}
                      disabled={!canUseDeposit}
                      title={!canUseDeposit ? "No available deposit or open invoice" : ""}
                      style={{ ...outlineBtn, opacity: canUseDeposit ? 1 : 0.5, cursor: canUseDeposit ? 'pointer' : 'not-allowed' }}
                    >
                      Use Deposit
                    </button>
                    <button
                      onClick={notReady}
                      style={outlineBtn}
                      title="Issue a refund"
                    >
                      Issue Refund
                    </button>
                  </div>

                  <div style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Date</th>
                          <th style={thStyle}>Description</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Debit</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {statementRows.length > 0 ? statementRows.map(row => (
                          <tr key={row.id} className="rb-row">
                            <td style={tdStyle}>{formatDate(row.date)}</td>
                            <td style={tdStyle}>
                              {row.description}
                              {row.status && (
                                <span style={{ marginLeft: '0.5rem', fontSize: '11px', textTransform: 'uppercase', color: row.status === 'paid' ? '#2b7a4b' : '#7a2b2b' }}>
                                  ({row.status})
                                </span>
                              )}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>{row.debit != null ? formatAmount(row.debit) : "R 0.0"}</td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>{row.credit != null ? formatAmount(row.credit) : "R 0.0"}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#95a5a6', padding: '2rem' }}>No statement activity yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {activeFinSub === "curinvoice" && !finLoading && (
                <>
                  {currentInvoice ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px solid #3498db', paddingBottom: '0.5rem', marginBottom: '0.8rem' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 500, margin: 0, color: '#000' }}>
                          Current Invoice | {todayFormatted}
                        </h3>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '12px', padding: '0.15rem 0.6rem', borderRadius: '12px', background: currentInvoice.status === 'paid' ? '#eef5e8' : '#eaf2f8', color: currentInvoice.status === 'paid' ? '#1a4a30' : '#1e4a6b', fontWeight: 500 }}>
                            {currentInvoice.status.toUpperCase()}
                          </span>
                          <FiX size={18} style={{ color: '#555', cursor: 'pointer' }} onClick={() => goTab("financials")} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
                        <div style={{ flex: '1 1 250px', border: '1px solid #e9ecef', padding: '0.8rem 1rem', background: '#fdfdfd' }}>
                          <div style={{ fontSize: '15px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>To:</div>
                          <div style={{ fontSize: '14px', color: '#000' }}>{lease.tenant_name || "—"}</div>
                          <div style={{ fontSize: '13px', color: '#333', lineHeight: 1.5 }}>
                            {lease.property_address || "—"}<br />
                            {lease.property_city || ""}
                          </div>
                        </div>
                        <div style={{ flex: '1 1 250px', border: '1px solid #e9ecef', padding: '0.8rem 1rem', background: '#fdfdfd' }}>
                          {[
                            ["Invoice Number:", currentInvoice.invoice_number || `INV${String(currentInvoice.id).padStart(7, "0")}`],
                            ["Due Date:", formatDate(currentInvoice.due_date)],
                            ["Deposit Held:", formatAmount(depositHeld)],
                            ["Payment Reference:", `LEA${String(lease.id).padStart(6, "0")}`],
                          ].map(([label, val]) => (
                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.25rem 0', fontSize: '13px' }}>
                              <span style={{ color: '#333' }}>{label}</span>
                              <span style={{ fontWeight: 500, color: '#000' }}>{val}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                        <button
                          onClick={openCashPayment}
                          disabled={!canRecordCash}
                          title={!canRecordCash ? "No open invoice with balance due" : ""}
                          style={{ ...outlineBtn, opacity: canRecordCash ? 1 : 0.5, cursor: canRecordCash ? 'pointer' : 'not-allowed' }}
                        >
                          <IoMdCash size={14} /> Record Cash Payment
                        </button>
                        <button
                          onClick={openUseDeposit}
                          disabled={!canUseDeposit}
                          title={!canUseDeposit ? "No available deposit or open invoice" : ""}
                          style={{ ...outlineBtn, opacity: canUseDeposit ? 1 : 0.5, cursor: canUseDeposit ? 'pointer' : 'not-allowed' }}
                        >
                          Use Deposit
                        </button>
                      </div>

                      <div style={{ border: '1px solid #e9ecef', overflow: 'hidden', marginBottom: '0.8rem' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr>
                              <th style={thStyle}>Date</th>
                              <th style={thStyle}>Description</th>
                              <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {invoiceLineRows.map((row, i) => (
                              <tr key={i} className="rb-row">
                                <td style={tdStyle}>{row.date ? formatDate(row.date) : "—"}</td>
                                <td style={tdStyle}>{row.description}</td>
                                <td style={{ ...tdStyle, textAlign: 'right' }}>{formatAmount(row.amount)}</td>
                              </tr>
                            ))}
                            <tr>
                              <td colSpan={2} style={{ ...tdStyle, fontWeight: 600, background: '#f9fafb' }}>Total Due</td>
                              <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, background: '#f9fafb' }}>{formatAmount(invoiceTotalDue)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Inline email section */}
                      <div style={{ border: '1px solid #e9ecef', padding: '0.8rem 1rem', marginBottom: '0.8rem', background: '#fdfdfd' }}>
                        <div style={{ fontSize: '14px', fontWeight: 500, color: '#000', marginBottom: '0.6rem' }}>Deliver invoice to</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                          <input
                            type="email"
                            value={emailRecipient}
                            onChange={e => setEmailRecipient(e.target.value)}
                            placeholder="Recipient email"
                            style={{ width: '100%', padding: '0.4rem 0.7rem', fontSize: '14px', border: '1px solid #dee2e6', color: '#000', outline: 'none', borderRadius: '2px' }}
                          />
                          <input
                            type="text"
                            value={emailSubject}
                            onChange={e => setEmailSubject(e.target.value)}
                            placeholder="Subject (optional)"
                            style={{ width: '100%', padding: '0.4rem 0.7rem', fontSize: '14px', border: '1px solid #dee2e6', color: '#000', outline: 'none', borderRadius: '2px' }}
                          />
                        </div>
                        {currentInvoice.status !== 'paid' && (
                          <button
                            onClick={sendEmail}
                            style={{
                              marginTop: '0.6rem',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.4rem',
                              background: '#2471a3',
                              color: '#fff',
                              border: 'none',
                              padding: '0.4rem 0.8rem',
                              fontSize: '14px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              borderRadius: '2px',
                            }}
                          >
                            <FiMail size={14} /> Send Invoice
                          </button>
                        )}
                      </div>

                    </>
                  ) : (
                    <p style={{ textAlign: 'center', color: '#555', padding: '2rem' }}>No invoices on this lease yet.</p>
                  )}
                </>
              )}

              {activeFinSub === "deposits" && !finLoading && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={openUseDeposit}
                      disabled={!canUseDeposit}
                      title={!canUseDeposit ? "No available deposit or open invoice" : ""}
                      style={{ ...outlineBtn, opacity: canUseDeposit ? 1 : 0.5, cursor: canUseDeposit ? 'pointer' : 'not-allowed' }}
                    >
                      Use Deposit
                    </button>
                    <button
                      onClick={notReady}
                      style={outlineBtn}
                    >
                      Return Deposit
                    </button>
                  </div>

                  <div style={{ border: '1px solid #e9ecef', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Date</th>
                          <th style={thStyle}>Description</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Debit</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {depositRows.length > 0 ? depositRows.map(row => (
                          <tr key={row.id} className="rb-row">
                            <td style={tdStyle}>{formatDate(row.date)}</td>
                            <td style={tdStyle}>{row.description}</td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>{formatAmount(row.debit)}</td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>{formatAmount(row.credit)}</td>
                          </tr>
                        )) : (
                          <tr><td colSpan={4} style={{ ...tdStyle, textAlign: 'center', color: '#95a5a6', padding: '2rem' }}>No deposit activity yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/*  REPORTS TAB  */}
          {activeMain === "reports" && (
            <div style={{ padding: '1.2rem' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 500, margin: '0 0 0.8rem', color: '#000' }}>Reports</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '0.8rem' }}>
                {/* Report cards unchanged */}
                {[
                  { icon: FiFileText, color: '#3498db', title: 'Lease Summary', desc: 'Full lease terms, tenant, and unit details in one document.' },
                  { icon: IoMdCash, color: '#27ae60', title: 'Statement of Account', desc: 'Complete ledger of invoices and payments for this lease.' },
                  { icon: FiCreditCard, color: '#8e44ad', title: 'Payment History', desc: 'All payments received against this lease, with method and reference.' },
                  { icon: FiBarChart2, color: '#e67e22', title: 'Invoice History', desc: 'Every invoice issued on this lease and its current status.' },
                ].map((report, i) => (
                  <div key={i} style={{ border: '1px solid #e9ecef', padding: '1rem', background: '#fdfdfd', boxShadow: '0 1px 2px rgba(0,0,0,0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <report.icon size={16} style={{ color: report.color }} />
                      <span style={{ fontWeight: 500, fontSize: '14px', color: '#000' }}>{report.title}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#333', margin: '0 0 0.8rem', lineHeight: 1.4 }}>{report.desc}</p>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button onClick={notReady} style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '13px', fontWeight: 400, background: '#2c3e50', color: '#ffffff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                        <FiDownload size={13} /> PDF
                      </button>
                      <button onClick={notReady} style={{ flex: 1, padding: '0.4rem 0.6rem', fontSize: '13px', fontWeight: 400, background: '#fdfdfd', color: '#000', border: '1px solid #dee2e6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                        <FiEye size={13} /> View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modals */}
      {showCashPayment && selectedInvoice && (
        <CashPaymentModal
          invoice={selectedInvoice}
          onClose={() => setShowCashPayment(false)}
          onSuccess={() => {
            setShowCashPayment(false);
            fetchFinancials();
            fetchLease();
          }}
        />
      )}

      {useDeposit && (
        <UseDepositModal
          deposit={useDeposit}
          invoiceId={currentInvoice?.id}
          invoiceNumber={currentInvoice?.invoice_number}
          invoiceRemainingBalance={currentInvoice?.remaining_balance}
          onClose={() => setUseDeposit(null)}
          onSuccess={() => {
            setUseDeposit(null);
            fetchFinancials();
            fetchLease();
          }}
        />
      )}
    </div>
  );
}