/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
// PAYMENT REVIEW PAGE 
import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import axios from "axios";
import { useToast } from '../../../contexts/ToastContext';
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

function formatAmount(amount) { return `R ${Number(amount).toLocaleString("en-ZA")}`; }
function initials(name) { return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(); }

function daysLate(due, paid) {
  if (!due || !paid) return null;
  const diff = Math.ceil((new Date(paid) - new Date(due)) / 86400000);
  return diff;
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

const pillStyle = (color, bg, border) => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.5rem',
  borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
  textTransform: 'uppercase', color, background: bg, border,
});

function ReceiptModal({ payment, receiptNo, onClose }) {
  const today = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
  const tenantName = payment.tenant_name || payment.tenant || "Unknown";
  const unitInfo = payment.unit_number || payment.unit || "—";
  const propertyName = payment.property_name || payment.property || "—";
  const method = payment.payment_method || "—";
  const amount = payment.amount_paid || payment.amount || 0;

  return (
    <div style={{ minHeight: '100vh', background: C.black, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ width: '100%', maxWidth: 380, background: C.muted2, borderRadius: '8px', border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ background: C.greenLight, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', color: C.black }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.8rem' }}>
            <Icon name="check" size={32} color={C.black} />
          </div>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Payment Approved</p>
          <p style={{ fontSize: '0.72rem', color: 'rgba(0,0,0,0.6)', marginTop: '0.2rem' }}>Receipt generated successfully</p>
        </div>

        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
          {[
            ["Receipt No.", receiptNo, true],
            ["Tenant", tenantName],
            ["Unit", `${unitInfo} · ${propertyName}`],
            ["Method", method],
          ].map(([label, val, mono]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem' }}>
              <span style={{ color: 'rgba(245,240,232,0.4)' }}>{label}</span>
              <span style={{ fontWeight: mono ? 600 : 500, color: C.white, fontFamily: mono ? F.mono : F.dm }}>
                {val}
              </span>
            </div>
          ))}

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: '0.8rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 600, color: C.white, fontSize: '0.85rem' }}>Amount Paid</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: C.greenLight, fontFamily: F.bebas, letterSpacing: '0.03em' }}>
              {formatAmount(amount)}
            </span>
          </div>

          <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.2)', textAlign: 'center', fontFamily: F.mono }}>
            Approved on {today}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.8rem', padding: '0 1.5rem 1.5rem' }}>
          <button onClick={() => alert("In production this downloads a PDF receipt.")}
            style={{ ...btnGhost, flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            <Icon name="download" size={14} /> Download
          </button>
          <button onClick={onClose}
            style={{ flex: 1, padding: '0.6rem 1.2rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600, fontFamily: F.dm, letterSpacing: '0.04em', border: 'none', cursor: 'pointer', background: C.greenLight, color: C.black, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
  const tenantName = payment.tenant_name || payment.tenant || "Unknown";
  const unitInfo = payment.unit_number || payment.unit || "—";
  const amount = payment.amount_paid || payment.amount || 0;

  const canSubmit = reason !== "" && (reason !== "Other" || customNote.trim() !== "");

  async function handleSubmit() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/landlord/payments/${payment.id}/reject`, {
        reason: reason === "Other" ? customNote : reason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onConfirmReject(payment.id, reason === "Other" ? customNote : reason);
      onClose();
    } catch (err) {
      console.error("Reject payment:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.black, padding: '1rem' }}>
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <button onClick={onClose} style={{
          display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem',
          color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, background: 'none',
          border: 'none', cursor: 'pointer', marginBottom: '1.2rem', transition: 'color 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.color = C.white}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
          <Icon name="chevronLeft" size={14} /> Back to review
        </button>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ width: 36, height: 36, borderRadius: '6px', background: 'rgba(224,90,74,0.12)', border: '1px solid rgba(224,90,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="x" size={18} color={C.redLight} />
            </div>
            <div>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Reject Payment</h2>
              <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{tenantName} · {unitInfo}</p>
            </div>
          </div>

          <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.7rem 0.9rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}` }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(58,143,212,0.12)', color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.7rem', flexShrink: 0 }}>
                {initials(tenantName)}
              </div>
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 500, color: C.white }}>{tenantName}</p>
                <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{unitInfo} · {formatAmount(amount)}</p>
              </div>
            </div>

            <div>
              <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                Reason for rejection <span style={{ color: C.redLight }}>*</span>
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {REJECT_REASONS.map(r => (
                  <label key={r} style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem',
                    borderRadius: '3px', border: `1px solid ${reason === r ? 'rgba(224,90,74,0.4)' : C.border}`,
                    background: reason === r ? 'rgba(224,90,74,0.08)' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <input type="radio" name="reject-reason" value={r} checked={reason === r}
                      onChange={() => setReason(r)} style={{ accentColor: C.redLight, width: 14, height: 14 }} />
                    <span style={{ fontSize: '0.75rem', color: C.white }}>{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {reason === "Other" && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Describe the issue <span style={{ color: C.redLight }}>*</span>
                </label>
                <textarea rows={3} value={customNote} onChange={e => setCustomNote(e.target.value)}
                  placeholder="Explain why this payment is being rejected..."
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 60, fontSize: '0.72rem' }} />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(232,160,18,0.06)', border: '1px solid rgba(232,160,18,0.15)' }}>
              <Icon name="alert-triangle" size={14} color={C.gold} style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '0.62rem', color: C.gold, lineHeight: 1.4 }}>
                The tenant will be notified of this rejection and prompted to resubmit.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}` }}>
            <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
            <button onClick={handleSubmit} disabled={!canSubmit || loading} style={{
              flex: 1, padding: '0.6rem 1.2rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600,
              fontFamily: F.dm, letterSpacing: '0.04em', border: 'none',
              cursor: (!canSubmit || loading) ? 'not-allowed' : 'pointer',
              background: C.red, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
              opacity: (!canSubmit || loading) ? 0.5 : 1,
            }}>
              {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: C.white, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : "Reject Payment"}
            </button>
          </div>
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
    if (!payment && id) {
      fetchPayment(id);
    } else if (!payment && !id) {
      navigate("/landlord/payments", { replace: true });
    }
  }, [id]);

  async function fetchPayment(paymentId) {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/landlord/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayment(data.payment);
    } catch (err) {
      console.error("Fetch payment:", err);
      navigate("/landlord/payments", { replace: true });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center', color: 'rgba(245,240,232,0.3)' }}>
          <span style={{ width: 24, height: 24, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block', marginBottom: '0.8rem' }} />
          <p>Loading payment...</p>
        </div>
      </div>
    );
  }

  if (!payment) return null;

  const tenantName = payment.tenant_name || payment.tenant || "Unknown";
  const unitInfo = payment.unit_number || payment.unit || "—";
  const propertyName = payment.property_name || payment.property || "—";
  const amount = payment.amount_paid || payment.amount || 0;
  const dueDate = payment.due_date || payment.due || "—";
  const paidDate = payment.payment_date || payment.paid || "—";
  const method = payment.payment_method || payment.method || "—";
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
      const { data } = await axios.put(`${API}/landlord/payments/${payment.id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
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
    toast.error(`Payment rejected: "${reason}". Tenant has been notified.`);
    navigate("/landlord/payments");
  }

  if (step === "approved") {
    return <ReceiptModal payment={payment} receiptNo={generatedReceiptNo} onClose={handleCancel} />;
  }

  if (step === "rejecting") {
    return (
      <RejectionModal
        payment={payment}
        onClose={() => setStep("review")}
        onConfirmReject={handleRejectSubmit}
      />
    );
  }

  const lateDays = paidDate && dueDate && paidDate !== "—" && dueDate !== "—" ? daysLate(dueDate, paidDate) : null;

  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    backBtn: {
      display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem',
      color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, background: 'none',
      border: 'none', cursor: 'pointer', transition: 'color 0.15s',
    },
    tabBtn: (active) => ({
      flex: 1, padding: '0.75rem 1rem', fontSize: '0.78rem', fontWeight: 500,
      fontFamily: F.dm, border: 'none', cursor: 'pointer', textAlign: 'center',
      background: active ? 'rgba(58,143,212,0.08)' : 'transparent',
      color: active ? C.blue : 'rgba(245,240,232,0.3)',
      borderBottom: `2px solid ${active ? C.blue : 'transparent'}`,
      transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
    }),
    detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.9rem' },
    lateBanner: (onTime) => ({
      display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 0.9rem',
      borderRadius: '3px', fontSize: '0.78rem', fontWeight: 500,
      background: onTime ? 'rgba(26,122,74,0.06)' : 'rgba(232,160,18,0.06)',
      border: `1px solid ${onTime ? 'rgba(76,186,122,0.15)' : 'rgba(232,160,18,0.15)'}`,
      color: onTime ? C.greenLight : C.gold,
    }),
  };

  return (
    <div style={S.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={handleCancel} style={S.backBtn}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="chevronLeft" size={14} /> Back to Payments
          </button>
          <span style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono }}>REF: {reference}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(58,143,212,0.12)', color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.85rem', flexShrink: 0 }}>
            {initials(tenantName)}
          </div>
          <div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Review Payment</h1>
            <p style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.35)', fontFamily: F.mono }}>{tenantName} · {unitInfo} · {propertyName}</p>
          </div>
          <span style={{ marginLeft: 'auto', ...pillStyle(C.gold, 'rgba(232,160,18,0.08)', '1px solid rgba(232,160,18,0.2)') }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.gold }} /> Pending Approval
          </span>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}` }}>
            {[
              ["details", "Payment Details", null],
              ["proof", "Proof of Payment", hasProof],
            ].map(([key, label, hasProofFlag]) => (
              <button key={key} onClick={() => setActiveTab(key)} style={S.tabBtn(activeTab === key)}>
                {label}
                {hasProofFlag && (
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: C.greenLight, color: C.black, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 700 }}>✓</span>
                )}
              </button>
            ))}
          </div>

          {activeTab === "details" && (
            <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ borderRadius: '3px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                {[
                  ["Property", `${unitInfo} · ${propertyName}`],
                  ["Amount Due", formatAmount(amount)],
                  ["Due Date", dueDate],
                  ["Date Paid", paidDate],
                  ["Method", method],
                  ["Reference", reference],
                ].map(([label, val], i) => (
                  <div key={label} style={{
                    ...S.detailRow,
                    background: i % 2 === 0 ? 'rgba(245,240,232,0.02)' : 'transparent',
                    borderBottom: `1px solid ${C.border}`,
                  }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.4)' }}>{label}</span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: C.white }}>{val}</span>
                  </div>
                ))}
              </div>

              {lateDays !== null && (
                <div style={S.lateBanner(lateDays <= 0)}>
                  {lateDays <= 0 ? (
                    <><Icon name="check" size={14} /> Paid on time</>
                  ) : (
                    <><Icon name="alert-triangle" size={14} /> Paid {lateDays} day{lateDays !== 1 ? "s" : ""} late</>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "proof" && (
            <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{
                borderRadius: '6px', border: '2px dashed rgba(245,240,232,0.1)',
                background: C.black, padding: '2rem', display: 'flex',
                flexDirection: 'column', alignItems: 'center', gap: '0.7rem', textAlign: 'center',
              }}>
                <div style={{ width: 56, height: 56, borderRadius: '8px', background: 'rgba(58,143,212,0.1)', border: '1px solid rgba(58,143,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="file" size={28} color={C.blue} />
                </div>
                <div>
                  <p style={{ fontSize: '0.82rem', fontWeight: 500, color: C.white }}>
                    proof_of_payment.pdf
                  </p>
                  <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginTop: '0.15rem' }}>
                    Uploaded {paidDate}
                  </p>
                </div>
                {payment.proof_of_payment_url && (
                  <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.3rem' }}>
                    <a href={API + payment.proof_of_payment_url} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 500, color: C.blue, textDecoration: 'none', fontFamily: F.mono }}>
                      <Icon name="external-link" size={12} /> Open
                    </a>
                    <span style={{ color: 'rgba(245,240,232,0.15)' }}>|</span>
                    <a href={API + payment.proof_of_payment_url} download
                      style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 500, color: 'rgba(245,240,232,0.3)', textDecoration: 'none', fontFamily: F.mono }}>
                      <Icon name="download" size={12} /> Download
                    </a>
                  </div>
                )}
              </div>

              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: 500, color: C.white, marginBottom: '0.6rem' }}>Verification checklist</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {[
                    "Amount on proof matches rent due",
                    "Date of payment is visible and correct",
                    "Sender name or account matches tenant",
                    "Reference number is clear and legible",
                  ].map(item => (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'rgba(245,240,232,0.4)' }}>
                      <Icon name="circle" size={8} color="rgba(245,240,232,0.15)" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ ...cardStyle, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
          <button onClick={handleCancel} disabled={approving}
            style={{ ...btnGhost, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            Cancel
          </button>
          <div style={{ flex: 1 }} />
          <button onClick={() => setStep("rejecting")} disabled={approving}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.2rem',
              borderRadius: '3px', fontSize: '0.76rem', fontWeight: 500, fontFamily: F.dm,
              letterSpacing: '0.04em', border: '1px solid rgba(224,90,74,0.3)',
              background: 'rgba(224,90,74,0.06)', color: C.redLight,
              cursor: approving ? 'not-allowed' : 'pointer', opacity: approving ? 0.5 : 1,
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!approving) e.currentTarget.style.background = 'rgba(224,90,74,0.15)'; }}
            onMouseLeave={e => { if (!approving) e.currentTarget.style.background = 'rgba(224,90,74,0.06)'; }}>
            <Icon name="x" size={14} /> Reject
          </button>
          <button onClick={handleApprove} disabled={approving}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.6rem 1.4rem',
              borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600, fontFamily: F.dm,
              letterSpacing: '0.04em', border: 'none', cursor: approving ? 'not-allowed' : 'pointer',
              background: C.greenLight, color: C.black, opacity: approving ? 0.7 : 1,
            }}>
            {approving ? (
              <><span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: C.black, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> Approving...</>
            ) : (
              <><Icon name="check" size={14} /> Approve & Generate Receipt</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}