/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import {
  FiChevronRight, FiFileText, FiDollarSign, FiUser, FiHome,
  FiCreditCard, FiCheck, FiX, FiRefreshCw, FiDownload, FiEye,
} from "react-icons/fi";
import { IoMdCash } from "react-icons/io";

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const paymentStatusConfig = {
  "paid":             { color: "#1a4a30", bg: "#eef5e8", border: "1px solid #c5d9b8", dot: "#2b7a4b", label: "Paid" },
  "pending":          { color: "#5b4a0b", bg: "#faf6ed", border: "1px solid #e5dbb8", dot: "#8b6e1a", label: "Pending" },
  "pending_approval": { color: "#5b4a0b", bg: "#faf6ed", border: "1px solid #e5dbb8", dot: "#8b6e1a", label: "Pending" },
  "late":             { color: "#7a2b2b", bg: "#fbeaea", border: "1px solid #e5bdbd", dot: "#9e3a3a", label: "Late" },
  "rejected":         { color: "#7a2b2b", bg: "#fbeaea", border: "1px solid #e5bdbd", dot: "#9e3a3a", label: "Rejected" },
  "collections":      { color: "#3d2252", bg: "#eee7f3", border: "1px solid #d1c2dc", dot: "#54326b", label: "Collections" },
  "partial":          { color: "#1e4a6b", bg: "#e8f0f5", border: "1px solid #b0cfe0", dot: "#2c6b9b", label: "Partial" },
};

function formatAmount(n) {
  return n === null || n === undefined || n === "" ? "—" : `R ${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function StatusBadge({ status }) {
  const cfg = paymentStatusConfig[status] ?? paymentStatusConfig["pending"];
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

export default function PaymentDetails() {
  useDocumentTitle("Payment Details");
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPayment = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/landlord/payments/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayment(data.payment || data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load payment");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchPayment(); }, [fetchPayment]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '4rem 2rem', color: '#555', fontFamily: FONT }}>
        <span style={{ width: 22, height: 22, border: '2px solid rgba(44,62,80,0.1)', borderTopColor: '#2c3e50', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
        <span>Loading payment...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !payment) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', fontFamily: FONT }}>
        <p style={{ fontSize: '14px', color: '#c0392b', marginBottom: '0.8rem' }}>{error || "Payment not found"}</p>
        <button onClick={fetchPayment} style={{ background: 'transparent', color: '#2471a3', border: 'none', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>
          Try again
        </button>
      </div>
    );
  }

  const isPaid = payment.status === 'paid';
  const isPending = payment.status === 'pending' || payment.status === 'pending_approval';
  const canReview = isPending;
  const canViewReceipt = isPaid;

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
        fontSize: '14px', color: '#333', padding: '0.55rem 0.8rem',
        background: '#fdfdfd', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', border: '1px solid #e9ecef',
      }}>
        <FiChevronRight size={13} style={{ color: '#555' }} />
        <Link to="/landlord/dashboard" className="rb-link">Dashboard</Link>
        <span style={{ color: '#555' }}>/</span>
        <Link to="/landlord/payments" className="rb-link">Payments</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>{payment.tenant_name || "Payment Details"}</span>
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
            <FiCreditCard size={18} color="#2c3e50" />
            <h4 style={{ fontSize: '16px', fontWeight: 500, margin: 0, color: '#000' }}>
              Payment 
            </h4>
          </div>
          <StatusBadge status={payment.status} />
        </div>

        {/* Body */}
        <div style={{ padding: '1.2rem' }}>
          {/* Summary */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <InfoRow label="Tenant" compact>
              <Link to={`/landlord/tenants/${payment.tenant_id}`} className="rb-link">{payment.tenant_name || "—"}</Link>
            </InfoRow>
            <InfoRow label="Unit" compact>{payment.unit_number ? `Unit ${payment.unit_number}` : "—"}</InfoRow>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            <InfoRow label="Property" compact>{payment.property_name || "—"}</InfoRow>
            <InfoRow label="Invoice" compact>{payment.invoice_number || "—"}</InfoRow>
          </div>

          {/* Amount cards */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, minWidth: 200, border: '1px solid #ccc', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ padding: '0.6rem', borderBottom: '2px solid #3498db', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IoMdCash size={15} /> Amount Paid
              </div>
              <div style={{ padding: '0.8rem', textAlign: 'center', fontSize: '18px', fontWeight: 600 }}>
                {formatAmount(payment.amount_paid)}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 200, border: '1px solid #ccc', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ padding: '0.6rem', borderBottom: '2px solid #3498db', fontSize: '15px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IoMdCash size={15} /> Remaining Balance
              </div>
              <div style={{ padding: '0.8rem', textAlign: 'center', fontSize: '18px', fontWeight: 600, color: Number(payment.remaining_balance) > 0 ? '#9e3a3a' : '#2b7a4b' }}>
                {formatAmount(payment.remaining_balance)}
              </div>
            </div>
          </div>

          {/* Payment details */}
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: '0 0 0.5rem' }}>Payment Details</h3>
          <div style={{ border: '1px solid #9a9d9e52', overflow: 'hidden', marginBottom: '1.5rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ["Payment Method", payment.payment_method || "—"],
                  ["Reference", payment.bank_reference || "—"],
                  ["Payment Date", fmtDate(payment.payment_date)],
                  ["Due Date", fmtDate(payment.due_date)],
                  ["Billing Period", `${fmtDate(payment.billing_period_start)} to ${fmtDate(payment.billing_period_end)}`],
                ].map(([label, val], i) => (
                  <tr key={label} className="rb-row">
                    <td style={{ ...tdStyle, fontWeight: 600, width: '35%' }}>{label}</td>
                    <td style={tdStyle}>{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Allocation */}
          {payment.allocated_rent || payment.allocated_utilities || payment.allocated_late_fees ? (
            <>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: '0 0 0.5rem' }}>Allocation</h3>
              <div style={{ border: '1px solid #9a9d9e52', overflow: 'hidden', marginBottom: '1.5rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Category</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Rent", payment.allocated_rent],
                      ["Utilities", payment.allocated_utilities],
                      ["Late Fees", payment.allocated_late_fees],
                    ].filter(([_, val]) => Number(val) > 0).map(([label, val]) => (
                      <tr key={label} className="rb-row">
                        <td style={tdStyle}>{label}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500 }}>{formatAmount(val)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}

          {/* Proof of payment */}
          {payment.proof_of_payment_url && (
            <>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: '0 0 0.5rem' }}>Proof of Payment</h3>
              <div style={{ border: '1px dashed #dee2e6', borderRadius: '2px', padding: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f9fafb' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiFileText size={16} color="#2c6b9b" />
                  <span style={{ fontSize: '13px', color: '#333' }}>Uploaded proof</span>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <a href={payment.proof_of_payment_url.startsWith('http') ? payment.proof_of_payment_url : `${API}${payment.proof_of_payment_url}`} target="_blank" rel="noopener noreferrer" className="rb-link" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <FiEye size={13} /> View
                  </a>
                  <a href={payment.proof_of_payment_url.startsWith('http') ? payment.proof_of_payment_url : `${API}${payment.proof_of_payment_url}`} download className="rb-link" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <FiDownload size={13} /> Download
                  </a>
                </div>
              </div>
            </>
          )}

          {/* Notes */}
          {payment.notes && (
            <>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: '0 0 0.5rem' }}>Notes</h3>
              <div style={{ padding: '0.6rem 0.9rem', borderRadius: '2px', background: '#faf6ed', border: '1px solid #e5dbb8', marginBottom: '1.5rem', fontSize: '13px', color: '#333' }}>
                {payment.notes}
              </div>
            </>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
            {canReview && (
              <button
                onClick={() => navigate(`/landlord/payments/review/${payment.id}`, { state: { payment } })}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#2c6b9b', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', fontSize: '14px', fontWeight: 500, cursor: 'pointer', borderRadius: '2px' }}
              >
                Review Payment
              </button>
            )}
            {canViewReceipt && (
              <button
                onClick={() => navigate(`/landlord/payments/receipt/${payment.id}`, { state: { payment } })}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#2b7a4b', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', fontSize: '14px', fontWeight: 500, cursor: 'pointer', borderRadius: '2px' }}
              >
                View Receipt
              </button>
            )}
            <button
              onClick={() => navigate('/landlord/payments')}
              style={{ background: '#fdfdfd', color: '#000', border: '1px solid #ccc', padding: '0.4rem 0.8rem', borderRadius: '2px', cursor: 'pointer', fontSize: '14px' }}
            >
              Back to Payments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}