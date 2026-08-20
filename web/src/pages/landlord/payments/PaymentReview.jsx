/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams, Link } from "react-router-dom";
import axios from "axios";
import { useToast } from '../../../contexts/ToastContext';
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { Icon } from "../../../components/Icon";
import { FiChevronRight, FiChevronDown } from "react-icons/fi";

const API = "http://localhost:4000";

const COLORS = {
  text: "#1f2328",
  textMuted: "#5f6b7a",
  link: "#1a73e8",
  border: "#dfe3e8",
  borderLight: "#eef1f4",
  headBg: "#f7f8fa",
  green: "#2b7a4b",
  white: "#fdfdfd",
  red: "#9e3a3a",
  gold: "#8b6e1a",
  blue: "#2c6b9b",
};

const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

function formatAmount(amount) {
  return `R ${Number(amount).toLocaleString("en-ZA")}`;
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function daysLate(due, paid) {
  if (!due || !paid) return null;
  return Math.ceil((new Date(paid) - new Date(due)) / 86400000);
}

const REJECT_REASONS = [
  "Amount does not match rent due",
  "Proof of payment is not legible",
  "Wrong reference number",
  "Payment made to wrong account",
  "Duplicate submission",
  "Other",
];

const inputStyle = {
  width: "100%",
  fontSize: "14px",
  padding: "0.5rem 0.8rem",
  borderRadius: "2px",
  background: COLORS.white,
  border: "1px solid #dee2e6",
  color: COLORS.text,
  fontFamily: FONT,
  outline: "none",
};

const btnPrimary = {
  background: "#2c3e50",
  color: "#ffffff",
  border: "1px solid #2c3e50",
  padding: "0.4rem 1.2rem",
  fontSize: "14px",
  fontWeight: 500,
  fontFamily: FONT,
  borderRadius: "2px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
};

const btnGhost = {
  background: "transparent",
  color: "#6c757d",
  border: "1px solid #ccc",
  padding: "0.4rem 1.2rem",
  fontSize: "14px",
  fontWeight: 400,
  fontFamily: FONT,
  borderRadius: "2px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
};

const cardStyle = {
  background: COLORS.white,
  border: "1px solid #e9ecef",
  borderRadius: "3px",
  overflow: "hidden",
};

function ReceiptModal({ payment, receiptNo, onClose }) {
  const tenantName = payment.tenant_name || "Unknown";
  const unitInfo = payment.unit_number || "—";
  const propertyName = payment.property_name || "—";
  const method = payment.payment_method || "—";
  const amount = payment.amount_paid || 0;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', background: 'rgba(44,62,80,0.5)',
    }}>
      <div style={{ width: '100%', maxWidth: 420, background: COLORS.white, borderRadius: '3px', border: '1px solid #e9ecef', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        {/* Green success header */}
        <div style={{ background: "#eef5e8", padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#1a4a30' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#c5d9b8', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.6rem' }}>
            <Icon name="check" size={28} color="#1a4a30" />
          </div>
          <p style={{ fontSize: "18px", fontWeight: 500, margin: 0 }}>Payment Approved</p>
          <p style={{ fontSize: "13px", color: "#2b7a4b", marginTop: '0.2rem' }}>Receipt generated successfully</p>
        </div>

        <div style={{ padding: "1.2rem 1.5rem", display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {[
            ["Receipt No.", receiptNo, true],
            ["Tenant", tenantName],
            ["Unit", `${unitInfo} · ${propertyName}`],
            ["Method", method],
          ].map(([label, val, mono]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
              <span style={{ color: '#6c757d' }}>{label}</span>
              <span style={{ fontWeight: 500, color: COLORS.text, fontFamily: mono ? 'monospace' : 'inherit' }}>{val}</span>
            </div>
          ))}

          <div style={{ borderTop: '1px solid #e9ecef', paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: COLORS.text, fontSize: '14px' }}>Amount Paid</span>
            <span style={{ fontSize: '18px', fontWeight: 600, color: '#2b7a4b' }}>{formatAmount(amount)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', padding: '0 1.5rem 1.5rem' }}>
          <button onClick={() => window.print()} style={{ ...btnGhost, flex: 1, justifyContent: 'center' }}>
            <Icon name="download" size={14} /> Download
          </button>
          <button onClick={onClose} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', background: '#2b7a4b', borderColor: '#2b7a4b' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

function RejectionModal({ payment, onClose, onConfirmReject }) {
  const [reason, setReason] = useState("");
  const [customNote, setCustomNote] = useState("");
  const [loading, setLoading] = useState(false);
  const tenantName = payment.tenant_name || "Unknown";
  const unitInfo = payment.unit_number || "—";
  const amount = payment.amount_paid || 0;
  const canSubmit = reason !== "" && (reason !== "Other" || customNote.trim() !== "");

  async function handleSubmit() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API}/landlord/payments/${payment.id}/reject`,
        { reason: reason === "Other" ? customNote : reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onConfirmReject(payment.id, reason === "Other" ? customNote : reason);
      onClose();
    } catch (err) {
      console.error("Reject payment:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', background: 'rgba(44,62,80,0.5)',
    }}>
      <div style={{ width: '100%', maxWidth: 560, background: COLORS.white, borderRadius: '3px', border: '1px solid #e9ecef', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem 1.5rem', borderBottom: '1px solid #e9ecef' }}>
          <div style={{ width: 36, height: 36, borderRadius: '6px', background: '#fbeaea', border: '1px solid #e5bdbd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="x-circle" size={18} color="#9e3a3a" />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 500, color: COLORS.text, margin: 0 }}>Reject Payment</h2>
            <p style={{ fontSize: '13px', color: '#6c757d' }}>{tenantName} · {unitInfo}</p>
          </div>
          <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#95a5a6' }}>
            <Icon name="x" size={18} />
          </button>
        </div>

        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          

          <div>
            <p style={{ fontSize: '12px', fontWeight: 500, color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
              Reason for rejection <span style={{ color: COLORS.red }}>*</span>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {REJECT_REASONS.map(r => (
                <label
                  key={r}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem',
                    borderRadius: '2px',
                    border: `1px solid ${reason === r ? '#e5bdbd' : '#dee2e6'}`,
                    background: reason === r ? '#fbeaea' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <input type="radio" name="reject-reason" value={r} checked={reason === r} onChange={() => setReason(r)} style={{ accentColor: '#9e3a3a', width: 14, height: 14 }} />
                  <span style={{ fontSize: '14px', color: COLORS.text }}>{r}</span>
                </label>
              ))}
            </div>
          </div>

          {reason === "Other" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '12px', fontWeight: 500, color: '#7f8c8d', textTransform: 'uppercase' }}>
                Describe the issue <span style={{ color: COLORS.red }}>*</span>
              </label>
              <textarea
                rows={3}
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                placeholder="Explain why this payment is being rejected..."
                style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
              />
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.6rem 0.8rem', borderRadius: '2px', background: '#faf6ed', border: '1px solid #e5dbb8' }}>
            <Icon name="alert-triangle" size={14} color="#8b6e1a" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '13px', color: '#5b4a0b', lineHeight: 1.4, margin: 0 }}>The tenant will be notified of this rejection and prompted to resubmit.</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: '1px solid #e9ecef' }}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1, justifyContent: 'center' }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || loading}
            style={{
              ...btnPrimary,
              flex: 1,
              justifyContent: 'center',
              background: '#9e3a3a',
              borderColor: '#9e3a3a',
              opacity: !canSubmit || loading ? 0.5 : 1,
              cursor: !canSubmit || loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? (
              <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            ) : (
              "Reject Payment"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentReview() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();
  const [payment, setPayment] = useState(location.state?.payment || null);
  const [loading, setLoading] = useState(!payment);
  const [step, setStep] = useState("review");
  const [activeTab, setActiveTab] = useState("details");
  const [approving, setApproving] = useState(false);
  const [receiptNo, setReceiptNo] = useState("");

  useDocumentTitle("Review Payment");

  useEffect(() => {
    if (!payment && id) fetchPayment(id);
    else if (!payment && !id) navigate("/landlord/payments", { replace: true });
  }, [id]);

  async function fetchPayment(paymentId) {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/landlord/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPayment(data.payment);
    } catch (err) {
      navigate("/landlord/payments", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '4rem 2rem', color: '#95a5a6', fontFamily: FONT }}>
        <span style={{ width: 22, height: 22, border: '2px solid rgba(44,62,80,0.1)', borderTopColor: '#2c3e50', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
        <span style={{ fontSize: '14px' }}>Loading payment...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!payment) return null;

  const tenantName = payment.tenant_name || "Unknown";
  const unitInfo = payment.unit_number || "—";
  const propertyName = payment.property_name || "—";
  const amount = payment.amount_paid || 0;
  const dueDate = payment.due_date || null;
  const paidDate = payment.payment_date || null;
  const method = payment.payment_method || "—";
  const reference = payment.bank_reference || `TXN-${payment.id?.slice(0, 8)}`;
  const hasProof = !!payment.proof_of_payment_url;
  const generatedReceiptNo = receiptNo || `RCP-${String(payment.id).slice(0, 8)}`;

  function handleCancel() {
    navigate("/landlord/payments");
  }

  async function handleApprove() {
    setApproving(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.put(
        `${API}/landlord/payments/${payment.id}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setReceiptNo(data.receipt_no || generatedReceiptNo);
      setApproving(false);
      setStep("approved");
      toast.success("Payment approved. Receipt generated and sent to tenant.");
    } catch (err) {
      setApproving(false);
      toast.error(err.response?.data?.error || "Failed to approve payment.");
    }
  }

  function handleRejectSubmit(id, reason) {
    toast.error("Payment rejected. Tenant has been notified.");
    navigate("/landlord/payments");
  }

  if (step === "approved") return <ReceiptModal payment={payment} receiptNo={generatedReceiptNo} onClose={handleCancel} />;
  if (step === "rejecting") return <RejectionModal payment={payment} onClose={() => setStep("review")} onConfirmReject={handleRejectSubmit} />;

  const lateDays = paidDate && dueDate ? daysLate(dueDate, paidDate) : null;

  const S = {
    container: { padding: '1rem', fontFamily: FONT, color: COLORS.text, background: '#ffffff' },
    backBtn: {
      display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '13px', color: '#6c757d',
      fontFamily: FONT, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s',
    },
    tabBtn: (active) => ({
      flex: 1, padding: '0.75rem 1rem', fontSize: '14px', fontWeight: 500, fontFamily: FONT, border: 'none',
      cursor: 'pointer', textAlign: 'center',
      background: active ? '#eaf2f8' : 'transparent',
      color: active ? '#2c6b9b' : '#6c757d',
      borderBottom: `2px solid ${active ? '#2c6b9b' : 'transparent'}`,
      transition: 'all 0.15s',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
    }),
    detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.9rem' },
    lateBanner: (onTime) => ({
      display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 0.9rem', borderRadius: '2px', fontSize: '14px',
      fontWeight: 500,
      background: onTime ? '#eef5e8' : '#faf6ed',
      border: `1px solid ${onTime ? '#c5d9b8' : '#e5dbb8'}`,
      color: onTime ? '#2b7a4b' : '#8b6e1a',
    }),
  };

  return (
    <div style={S.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Breadcrumb */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem',
        fontSize: '14px', fontWeight: 400, color: '#333', padding: '0.55rem 0.8rem',
        background: '#fdfdfd', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', border: '1px solid #e9ecef',
      }}>
        <FiChevronRight size={13} style={{ color: '#555' }} />
        <Link to="/landlord/dashboard" className="rb-link">Dashboard</Link>
        <span style={{ color: '#555' }}>/</span>
        <Link to="/landlord/payments/history" className="rb-link">Payments</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>Review Payment</span>
      </div>

      {/* Main card */}
      <div style={{
        background: '#fdfdfd', border: '1px solid #dfe3e8', borderRadius: '3px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{
          background: '#f7f8fa', padding: '0.8rem 1.2rem', borderBottom: '3px solid #3498db',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '6px', background: '#eaf2f8', border: '1px solid #b0cfe0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="credit-card" size={20} color="#2c6b9b" />
            </div>
            <div>
              <h4 style={{ fontSize: '16px', fontWeight: 500, margin: 0, color: '#000' }}>Review Payment</h4>
              <p style={{ fontSize: '13px', color: '#333', margin: '0.2rem 0 0' }}>{tenantName} · {unitInfo} · {propertyName}</p>
            </div>
          </div>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '12px',
            fontWeight: 500, padding: '0.2rem 0.55rem', borderRadius: '12px', color: '#8b6e1a',
            background: '#faf6ed', border: '1px solid #e5dbb8',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8b6e1a' }} /> Pending
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #e9ecef' }}>
          <button onClick={() => setActiveTab("details")} style={S.tabBtn(activeTab === "details")}>
            Payment Details
          </button>
          <button onClick={() => setActiveTab("proof")} style={S.tabBtn(activeTab === "proof")}>
            Proof of Payment
            {hasProof && (
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: '#2b7a4b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 600 }}>
                ✓
              </span>
            )}
          </button>
        </div>

        {/* Tab content */}
        <div style={{ padding: '1.2rem 1.5rem' }}>
          {activeTab === "details" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ borderRadius: '2px', border: '1px solid #e9ecef', overflow: 'hidden' }}>
                {[
                  ["Property", `${unitInfo} · ${propertyName}`],
                  ["Amount Paid", formatAmount(amount)],
                  ["Due Date", fmtDate(dueDate)],
                  ["Date Paid", fmtDate(paidDate)],
                  ["Method", method],
                  ["Reference", reference],
                ].map(([label, val], i) => (
                  <div key={label} style={{ ...S.detailRow, background: i % 2 === 0 ? '#f9fafb' : 'transparent', borderBottom: '1px solid #e9ecef' }}>
                    <span style={{ fontSize: '14px', color: '#6c757d' }}>{label}</span>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: COLORS.text }}>{val}</span>
                  </div>
                ))}
              </div>

              {lateDays !== null && (
                <div style={S.lateBanner(lateDays <= 0)}>
                  {lateDays <= 0 ? (
                    <>
                      <Icon name="check-circle" size={14} /> Paid on time
                    </>
                  ) : (
                    <>
                      <Icon name="alert-triangle" size={14} /> Paid {lateDays} day{lateDays !== 1 ? "s" : ""} late
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "proof" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ borderRadius: '2px', border: '2px dashed #dee2e6', background: '#f9fafb', padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.7rem', textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '6px', background: '#eaf2f8', border: '1px solid #b0cfe0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="file-text" size={28} color="#2c6b9b" />
                </div>
                <div>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: COLORS.text, margin: 0 }}>Proof of Payment</p>
                  <p style={{ fontSize: '13px', color: '#6c757d', marginTop: '0.15rem' }}>Uploaded {fmtDate(paidDate)}</p>
                </div>
                {payment.proof_of_payment_url && (
                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.3rem' }}>
                    <a href={API + payment.proof_of_payment_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '13px', fontWeight: 500, color: COLORS.link, textDecoration: 'none' }}>
                      <Icon name="external-link" size={12} /> Open
                    </a>
                    <span style={{ color: '#ccc' }}>|</span>
                    <a href={API + payment.proof_of_payment_url} download style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '13px', fontWeight: 500, color: '#6c757d', textDecoration: 'none' }}>
                      <Icon name="download" size={12} /> Download
                    </a>
                  </div>
                )}
              </div>

              <div>
                <p style={{ fontSize: '14px', fontWeight: 500, color: COLORS.text, marginBottom: '0.6rem' }}>Verification checklist</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    "Amount on proof matches rent due",
                    "Date of payment is visible and correct",
                    "Sender name or account matches tenant",
                    "Reference number is clear and legible",
                  ].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px', color: '#6c757d' }}>
                      <Icon name="circle" size={8} color="#ccc" /> {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div style={{ borderTop: '1px solid #e9ecef', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap', background: '#fafbfc' }}>
          <button onClick={handleCancel} disabled={approving} style={btnGhost}>Cancel</button>
          <div style={{ flex: 1 }} />
          <button
            onClick={() => setStep("rejecting")}
            disabled={approving}
            style={{
              ...btnGhost,
              color: '#9e3a3a',
              borderColor: '#e5bdbd',
              background: '#fbeaea',
              opacity: approving ? 0.5 : 1,
            }}
          >
            <Icon name="x-circle" size={14} /> Reject
          </button>
          <button onClick={handleApprove} disabled={approving} style={btnPrimary}>
            {approving ? (
              <>
                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                Approving...
              </>
            ) : (
              <>
                <Icon name="check" size={14} /> Approve Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}