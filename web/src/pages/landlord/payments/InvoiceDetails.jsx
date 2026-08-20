import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import {
  FiChevronRight, FiFileText, FiDollarSign, FiUser, FiHome,
  FiCreditCard, FiSend, FiCheck, FiX, FiRefreshCw,
} from "react-icons/fi";
import { FaCreditCard } from "react-icons/fa6";
import { IoMdCash } from "react-icons/io";
import UseDepositModal from "../../../components/UseDepositModal";

const API = "http://localhost:4000";
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

const invoiceTypeConfig = {
  rent: { color: "#1e4a6b", bg: "#e8f0f5", border: "1px solid #b0cfe0", label: "Rent" },
  deposit: { color: "#1a4a30", bg: "#eef5e8", border: "1px solid #c5d9b8", label: "Deposit" },
  utility: { color: "#8b6e1a", bg: "#faf6ed", border: "1px solid #e5dbb8", label: "Utility" },
  other: { color: "#5a5a5a", bg: "#f2f2f2", border: "1px solid #d0d0d0", label: "Other" },
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
  const cfg = invoiceTypeConfig[type] ?? invoiceTypeConfig.other;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', fontSize: '12px',
      fontWeight: 500, padding: '0.15rem 0.6rem', color: cfg.color,
      background: cfg.bg, border: cfg.border, borderRadius: '12px',
    }}>
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
        notes: notes || "Cash payment received in person"
      }, { headers: { Authorization: `Bearer ${token}` } });
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
            <p style={{ fontSize: '12px', color: '#333', marginBottom: '0.3rem' }}>TENANT</p>
            <p style={{ fontSize: '14px', fontWeight: 500, color: '#000' }}>{invoice.tenant_name || "Unknown"}</p>
            <p style={{ fontSize: '12px', color: '#333' }}>Unit {invoice.unit_number || "—"} • Invoice #{invoice.invoice_number}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>Amount Received (ZAR)</label>
            <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setError(""); }}
              min="0" max={remainingBalance || undefined} step="0.01"
              style={{ width: '100%', fontSize: '16px', fontWeight: 500, padding: '0.4rem 0.7rem', background: '#fdfdfd', border: `1px solid ${exceedsBalance ? '#9e3a3a' : '#dee2e6'}`, color: '#000', outline: 'none' }} />
            <span style={{ fontSize: '12px', color: exceedsBalance ? '#9e3a3a' : '#333' }}>
              Invoice total: {formatAmount(invoice.amount_due)} • Remaining: {formatAmount(remainingBalance)}
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

export default function InvoiceDetailPage() {
  useDocumentTitle("Invoice Details");
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCashPayment, setShowCashPayment] = useState(false);
  const [useDeposit, setUseDeposit] = useState(null);
  const [depositDetails, setDepositDetails] = useState(null); 
  const [depositLoading, setDepositLoading] = useState(false);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/landlord/payments/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInvoice(data.invoice || data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchDeposit = useCallback(async (depositId) => {
    if (!depositId) return;
    setDepositLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/landlord/payments/deposits/${depositId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDepositDetails(data.deposit || data);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load deposit details.";
      toast.error(msg);
      setDepositDetails(null);
    } finally {
      setDepositLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  useEffect(() => {
    if (invoice?.deposit_id) {
      fetchDeposit(invoice.deposit_id);
    } else {
      setDepositDetails(null);
    }
  }, [invoice, fetchDeposit]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '4rem 2rem', color: '#555', fontFamily: FONT }}>
        <span style={{ width: 22, height: 22, border: '2px solid rgba(44,62,80,0.1)', borderTopColor: '#2c3e50', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
        <span style={{ fontSize: '14px' }}>Loading invoice...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', fontFamily: FONT }}>
        <p style={{ fontSize: '14px', color: '#c0392b', marginBottom: '0.8rem' }}>{error || "Invoice not found"}</p>
        <button onClick={fetchInvoice} style={{ background: 'transparent', color: '#2471a3', border: 'none', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>
          Try again
        </button>
      </div>
    );
  }

  const lineItems = invoice.line_items || invoice.items || [];
  const payments = invoice.payments || [];
  const canRecordCash = invoice.status === 'sent' || invoice.status === 'overdue' || invoice.status === 'partial';
  const canUseDeposit = depositDetails && (depositDetails.status === 'paid' || depositDetails.status === 'partially_refunded');

  const openUseDepositModal = () => {
    if (depositDetails) {
      setUseDeposit({ ...depositDetails, invoice_id: invoice.id });
    } else {
      toast.error("Deposit details are not available.");
    }
  };

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
        <Link to="/landlord/payments/invoices" className="rb-link">Invoices</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>Invoice {invoice.invoice_number}</span>
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
              Invoice {invoice.invoice_number}
            </h4>
            <TypeBadge type={invoice.invoice_type} />
          </div>
          <StatusBadge status={invoice.status} />
        </div>

        {/* Body */}
        <div style={{ padding: '1.2rem' }}>
          {/* Summary */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <InfoRow label="Tenant" compact>
              <Link to={`/landlord/tenants/${invoice.tenant_id}`} className="rb-link">{invoice.tenant_name || "—"}</Link>
            </InfoRow>
            <InfoRow label="Unit" compact>{invoice.unit_number ? `Unit ${invoice.unit_number}` : "—"}</InfoRow>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <InfoRow label="Property" compact>{invoice.property_name || "—"}</InfoRow>
            <InfoRow label="Due Date" compact>{fmtDate(invoice.due_date)}</InfoRow>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, minWidth: 200, border: '1px solid #ccc', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ padding: '0.6rem', borderBottom: '2px solid #3498db', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FaCreditCard size={15} /> Amount Due
              </div>
              <div style={{ padding: '0.8rem', textAlign: 'center', fontSize: '18px', fontWeight: 600 }}>
                {formatAmount(invoice.amount_due)}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 200, border: '1px solid #ccc', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ padding: '0.6rem', borderBottom: '2px solid #3498db', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IoMdCash size={15} /> Remaining Balance
              </div>
              <div style={{ padding: '0.8rem', textAlign: 'center', fontSize: '18px', fontWeight: 600, color: Number(invoice.remaining_balance) > 0 ? '#9e3a3a' : '#2b7a4b' }}>
                {formatAmount(invoice.remaining_balance)}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: '0 0 0.5rem' }}>Invoice Items</h3>
          <div style={{ border: '1px solid #9a9d9e52', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Description</th>
                  <th style={thStyle}>Date</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.length > 0 ? (
                  lineItems.map((item, idx) => (
                    <tr key={idx} className="rb-row">
                      <td style={tdStyle}>{item.description || "—"}</td>
                      <td style={tdStyle}>{fmtDate(item.date || item.due_date)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>{formatAmount(item.amount)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} style={{ ...tdStyle, textAlign: 'center', color: '#95a5a6', padding: '2rem' }}>No line items recorded.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Payments Table */}
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: '0 0 0.5rem' }}>Payments Applied</h3>
          <div style={{ border: '1px solid #9a9d9e52', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Method</th>
                  <th style={thStyle}>Reference</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.length > 0 ? (
                  payments.map(p => (
                    <tr key={p.id} className="rb-row">
                      <td style={tdStyle}>{fmtDate(p.payment_date)}</td>
                      <td style={tdStyle}>{p.payment_method || "—"}</td>
                      <td style={tdStyle}>{p.bank_reference || "—"}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>{formatAmount(p.amount_paid)}</td>
                      <td style={tdStyle}><StatusBadge status={p.status} /></td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: '#95a5a6', padding: '2rem' }}>No payments recorded.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',   
            alignItems: 'center',
            gap: '0.6rem',
            marginTop: '0.5rem',
            flexWrap: 'wrap',
          }}>
            {/* Back button – left */}
            <button
              onClick={() => navigate('/landlord/payments/invoices')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#fdfdfd',
                color: '#000',
                border: '1px solid #ccc',
                padding: '0.4rem 0.8rem',
                borderRadius: '2px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 400,
              }}
            >
              ← Back to Invoices
            </button>

            {/* Right side – action buttons */}
            <div style={{ display: 'flex', gap: '0.6rem' }}>
              {canRecordCash && (
                <>
                  <button
                    onClick={() => setShowCashPayment(true)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: '#2b7a4b',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.4rem 0.8rem',
                      fontSize: '14px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      borderRadius: '2px',
                    }}
                  >
                    <IoMdCash size={15} /> Record Cash Payment
                  </button>

                  <button
                    onClick={openUseDepositModal}
                    disabled={depositLoading || !canUseDeposit}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: '#fdfdfd',
                      color: '#000',
                      border: '1px solid #ccc',
                      padding: '0.4rem 0.8rem',
                      borderRadius: '2px',
                      cursor: depositLoading || !canUseDeposit ? 'not-allowed' : 'pointer',
                      fontSize: '14px',
                      fontWeight: 400,
                      opacity: depositLoading || !canUseDeposit ? 0.5 : 1,
                    }}
                  >
                    {depositLoading ? (
                      <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
                    ) : (
                      "Use Deposit"
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cash Payment Modal */}
      {showCashPayment && (
        <CashPaymentModal
          invoice={invoice}
          onClose={() => setShowCashPayment(false)}
          onSuccess={() => { fetchInvoice(); toast.success("Cash payment recorded."); }}
        />
      )}

      {/* Use Deposit Modal */}
      {useDeposit && (
        <UseDepositModal
          deposit={useDeposit}
          invoiceId={invoice.id}
          invoiceNumber={invoice.invoice_number}
          invoiceRemainingBalance={invoice.remaining_balance}
          onClose={() => setUseDeposit(null)}
          onSuccess={() => {
            setUseDeposit(null);
            fetchInvoice();
            if (invoice?.deposit_id) fetchDeposit(invoice.deposit_id);
            toast.success("Deposit applied to invoice.");
          }}
        />
      )}
    </div>
  );
}