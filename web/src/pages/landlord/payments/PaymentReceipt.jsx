/* eslint-disable react-hooks/exhaustive-deps */
// PAYMENT RECEIPT PAGE
import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

function formatAmount(amount) {
  return `R ${Number(amount).toLocaleString("en-ZA")}`;
}

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function Row({ label, value, mono = false, highlight = false }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.7rem 0', borderBottom: `1px solid ${C.border}`,
    }}>
      <span style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.4)' }}>{label}</span>
      <span style={{
        fontSize: highlight ? '0.9rem' : '0.78rem',
        fontWeight: highlight ? 700 : 500,
        color: highlight ? C.gold : C.white,
        fontFamily: mono ? F.mono : F.dm,
        textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  );
}

export default function PaymentReceipt() {
  useDocumentTitle("Receipt");

  const { state } = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const [payment, setPayment] = useState(state?.payment || null);
  const [loading, setLoading] = useState(!payment);

  useEffect(() => {
    if (!payment && id) {
      fetchPayment(id);
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
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: C.black, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', color: 'rgba(245,240,232,0.3)' }}>
          <span style={{ width: 24, height: 24, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block', marginBottom: '0.8rem' }} />
          <p style={{ fontSize: '0.85rem' }}>Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div style={{
        minHeight: '100vh', background: C.black, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.3)' }}>No receipt data found.</p>
          <button
            onClick={() => navigate("/landlord/payments")}
            style={{
              fontSize: '0.78rem', color: C.gold, background: 'none',
              border: 'none', cursor: 'pointer', fontFamily: F.mono,
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = C.gold}
          >
            ← Back to Payments
          </button>
        </div>
      </div>
    );
  }

  const tenantName = payment.tenant_name || payment.tenant || "Unknown";
  const unitInfo = payment.unit_number || payment.unit || "—";
  const propertyName = payment.property_name || payment.property || "—";
  const amount = payment.amount_paid || payment.amount || 0;
  const dueDate = payment.due_date || payment.due || null;
  const paidDate = payment.payment_date || payment.paid || null;
  const method = payment.payment_method || payment.method || "—";
  const bankRef = payment.bank_reference || payment.reference || "—";
  const invoiceNo = payment.invoice_number || "—";
  const billingStart = payment.billing_period_start || null;
  const billingEnd = payment.billing_period_end || null;
  const periodLabel = billingStart && billingEnd 
    ? `${formatDate(billingStart)} — ${formatDate(billingEnd)}`
    : "—";
  const hasProof = !!payment.proof_of_payment_url;

  const approvedOn = payment.approved_at 
    ? formatDate(payment.approved_at) 
    : new Date().toLocaleDateString("en-ZA", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  const rcpNo = `RCP-${String(payment.id).slice(0, 8)}`;

  function handleDownload() {
    window.print();
  }

  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    backBtn: {
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
      fontSize: '0.75rem', color: 'rgba(245,240,232,0.3)',
      fontFamily: F.mono, background: 'none', border: 'none',
      cursor: 'pointer', marginBottom: '1.2rem', transition: 'color 0.15s',
    },
    panel: {
      maxWidth: 640, margin: '0 auto', background: C.muted2,
      borderRadius: '8px', border: `1px solid ${C.border}`,
      overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
    },
    goldHeader: {
      background: C.gold, padding: '2rem', color: C.black,
    },
    receiptBand: {
      background: 'rgba(232,160,18,0.06)', borderBottom: `1px solid rgba(232,160,18,0.2)`,
      padding: '0.7rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    },
    body: { padding: '1.5rem 2rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' },
    tenantCard: {
      display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem',
      borderRadius: '4px', background: C.black, border: `1px solid ${C.border}`,
    },
    detailCard: {
      borderRadius: '4px', border: `1px solid ${C.border}`, overflow: 'hidden',
      padding: '0 1rem',
    },
    amountFooter: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.9rem 1rem', background: 'rgba(232,160,18,0.04)',
      borderTop: `1px solid rgba(232,160,18,0.15)`, borderRadius: '0 0 3px 3px',
    },
    pill: {
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.5rem',
      borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
      textTransform: 'uppercase', color: C.greenLight,
      background: 'rgba(26,122,74,0.1)', border: '1px solid rgba(76,186,122,0.2)',
    },
  };

  return (
    <div style={S.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          body { background: white; }
          .receipt-panel { max-width: 100% !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 640, margin: '0 auto 1.2rem' }}>
        <button
          onClick={() => navigate("/landlord/payments")}
          style={S.backBtn}
          onMouseEnter={e => e.currentTarget.style.color = C.white}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}
        >
          <Icon name="chevronLeft" size={14} /> Back to Payments
        </button>
      </div>

      <div id="receipt-panel" className="receipt-panel" style={S.panel}>

        <div style={S.goldHeader}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '6px',
                  background: 'rgba(0,0,0,0.12)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="home" size={18} color={C.black} />
                </div>
                <span style={{
                  fontWeight: 600, color: 'rgba(0,0,0,0.65)',
                  fontSize: '0.8rem', fontFamily: F.dm, letterSpacing: '0.02em',
                }}>
                  Chihwa Rentals
                </span>
              </div>
              <h1 style={{
                fontSize: '1.6rem', fontWeight: 700, lineHeight: 1.2,
                fontFamily: F.bebas, letterSpacing: '0.04em',
              }}>
                Payment Receipt
              </h1>
              <p style={{
                fontSize: '0.75rem', color: 'rgba(0,0,0,0.5)',
                marginTop: '0.2rem', fontFamily: F.mono,
              }}>
                {propertyName}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(0,0,0,0.12)', border: '2px solid rgba(0,0,0,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="check" size={28} color={C.black} />
              </div>
              <span style={{
                fontSize: '0.58rem', fontWeight: 600, color: 'rgba(0,0,0,0.5)',
                fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                Verified
              </span>
            </div>
          </div>
        </div>

        <div style={S.receiptBand}>
          <span style={{
            fontSize: '0.6rem', fontWeight: 600, color: C.gold,
            fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase',
          }}>
            Receipt Number
          </span>
          <span style={{
            fontFamily: F.mono, fontSize: '0.82rem', fontWeight: 700, color: C.gold,
          }}>
            {rcpNo}
          </span>
        </div>

        <div style={S.body}>
          <div style={S.tenantCard}>
            <div style={{
              width: 44, height: 44, borderRadius: '50%',
              background: 'rgba(232,160,18,0.12)', color: C.gold,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: F.bebas, fontSize: '0.8rem', flexShrink: 0,
            }}>
              {initials(tenantName)}
            </div>
            <div>
              <p style={{ fontWeight: 600, color: C.white, fontSize: '0.85rem' }}>{tenantName}</p>
              <p style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>
                {unitInfo} — {propertyName}
              </p>
            </div>
            <div style={{ marginLeft: 'auto' }}>
              <span style={S.pill}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.greenLight }} /> Paid
              </span>
            </div>
          </div>

          <div>
            <p style={{
              fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)',
              fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase',
              marginBottom: '0.5rem',
            }}>
              Payment Details
            </p>
            <div style={S.detailCard}>
              <Row label="Invoice Number" value={invoiceNo} mono />
              <Row label="Rental Period" value={periodLabel} />
              <Row label="Due Date" value={formatDate(dueDate)} />
              <Row label="Date Paid" value={formatDate(paidDate)} />
              <Row label="Payment Method" value={method} />
              <Row label="Bank Reference" value={bankRef} mono />
              {hasProof && (
                <Row label="Proof of Payment" value="Verified" />
              )}
            </div>
          </div>

          <div style={S.detailCard}>
            <Row label="Rent Amount" value={formatAmount(amount)} />
            <Row label="Late Fees" value={formatAmount(0)} />
            <Row label="Outstanding" value={formatAmount(0)} />
            <div style={S.amountFooter}>
              <span style={{ fontWeight: 600, color: C.white, fontSize: '0.85rem' }}>Total Paid</span>
              <span style={{
                fontSize: '1.2rem', fontWeight: 700, color: C.gold,
                fontFamily: F.bebas, letterSpacing: '0.03em',
              }}>
                {formatAmount(amount)}
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontSize: '0.65rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono,
            paddingTop: '0.3rem',
          }}>
            <span>
              Approved by: <span style={{ color: 'rgba(245,240,232,0.4)', fontWeight: 500 }}>Landlord</span>
            </span>
            <span>
              Issued: <span style={{ color: 'rgba(245,240,232,0.4)', fontWeight: 500 }}>{approvedOn}</span>
            </span>
          </div>

          <div style={{ borderTop: '2px dashed rgba(245,240,232,0.08)' }} />

          <p style={{
            textAlign: 'center', fontSize: '0.65rem', color: 'rgba(245,240,232,0.2)',
            fontFamily: F.mono, lineHeight: 1.6,
          }}>
            This is an official rental payment receipt generated by Chihwa Rentals.
            <br />Keep this for your records.
          </p>
        </div>

        <div style={{ padding: '0 2rem 1.5rem', display: 'flex', gap: '0.8rem' }}>
          <button
            onClick={() => navigate("/landlord/payments")}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.4rem', padding: '0.7rem 1rem', borderRadius: '3px',
              fontSize: '0.76rem', fontWeight: 500, fontFamily: F.dm,
              letterSpacing: '0.04em', border: `1px solid ${C.border}`,
              background: 'transparent', color: 'rgba(245,240,232,0.5)',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = C.muted;
              e.currentTarget.style.color = C.white;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(245,240,232,0.5)';
            }}
          >
            <Icon name="chevronLeft" size={14} /> Back to Payments
          </button>

          <button
            onClick={handleDownload}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '0.4rem', padding: '0.7rem 1rem', borderRadius: '3px',
              fontSize: '0.76rem', fontWeight: 600, fontFamily: F.dm,
              letterSpacing: '0.04em', border: 'none', cursor: 'pointer',
              background: C.gold, color: C.black, transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Icon name="download" size={14} /> Download Receipt
          </button>
        </div>
      </div>
    </div>
  );
}