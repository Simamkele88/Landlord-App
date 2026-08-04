/* eslint-disable no-empty */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

function formatAmount(amount) {
  if (amount === null || amount === undefined) return "R 0.00";
  return `R ${Number(amount).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr).slice(0, 10);
    return date.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return String(dateStr).slice(0, 10);
  }
}

function formatRentalPeriod(startDateStr) {
  if (startDateStr) {
    try {
      const date = new Date(startDateStr);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-ZA", { month: "long", year: "numeric" });
      }
    } catch {}
  }
  return "—";
}

function formatPaymentMethod(method) {
  if (!method) return "—";
  const methods = {
    bank_transfer: "Bank Transfer",
    eft: "EFT",
    cash: "Cash",
    card: "Card Payment",
    mobile_wallet: "Mobile Wallet",
    direct_deposit: "Direct Deposit",
  };
  return methods[method] || method.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function Row({ label, value, mono = false, highlight = false, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: `1px solid ${C.border}20` }}>
      <span style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.4)', fontFamily: F.dm }}>{label}</span>
      <span style={{ fontSize: highlight ? '0.95rem' : '0.8rem', fontWeight: highlight ? 700 : 500, color: color || (highlight ? C.gold : C.white), fontFamily: mono ? F.mono : F.dm, textAlign: 'right' }}>{value}</span>
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
    if (!payment && id) fetchPayment(id);
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
      <div style={{ minHeight: '100vh', background: C.black, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ width: 28, height: 28, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block', marginBottom: '0.8rem' }} />
          <p style={{ fontSize: '0.85rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div style={{ minHeight: '100vh', background: C.black, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
          <Icon name="file-text" size={40} color="rgba(245,240,232,0.12)" />
          <p style={{ fontSize: '0.9rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.dm }}>No receipt data found</p>
          <button onClick={() => navigate("/landlord/payments")} style={{ fontSize: '0.78rem', color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono, transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = C.white} onMouseLeave={e => e.currentTarget.style.color = C.gold}>
            ← Back to Payments
          </button>
        </div>
      </div>
    );
  }

  const tenantName = payment.tenant_name || "Unknown";
  const unitInfo = payment.unit_number || "—";
  const propertyName = payment.property_name || "—";

  const totalPaid = Number(payment.amount_paid || 0);
  const allocatedRent = Number(payment.allocated_rent || 0);
  const allocatedUtilities = Number(payment.allocated_utilities || 0);
  const allocatedLateFees = Number(payment.allocated_late_fees || 0);
  const hasAllocation = (allocatedRent + allocatedUtilities + allocatedLateFees) > 0;

  const invoiceAmountDue = Number(payment.amount_due || 0);
  const invoiceRentAmount = Number(payment.rent_amount || 0);
  const invoiceLateFees = Number(payment.late_fees || 0);
  const invoiceUtilities = Number(payment.utilities_amount || 0);
  const invoiceRemaining = Number(payment.remaining_balance || 0);

  const showRent = hasAllocation ? allocatedRent : invoiceRentAmount || invoiceAmountDue;
  const showUtilities = hasAllocation ? allocatedUtilities : invoiceUtilities;
  const showLateFees = hasAllocation ? allocatedLateFees : invoiceLateFees;
  const showInvoiceTotal = invoiceAmountDue > 0 && totalPaid < invoiceAmountDue;

  const dueDate = payment.due_date || null;
  const paidDate = payment.payment_date || null;
  const method = formatPaymentMethod(payment.payment_method);
  const bankRef = payment.bank_reference || "—";
  const invoiceNo = payment.invoice_number || "—";
  const billingStart = payment.billing_period_start || null;
  const periodLabel = formatRentalPeriod(billingStart);
  const hasProof = !!payment.proof_of_payment_url;
  const isPartial = payment.invoice_status === "partial" || invoiceRemaining > 0;
  const statusLabel = payment.status === "paid" ? (isPartial ? "Partial Payment" : "Paid") : payment.status;
  const statusColor = isPartial ? C.gold : C.greenLight;
  const rcpNo = payment.receipt_no || payment.receipt_number || `RCP-${String(payment.id).slice(0, 8)}`;
  const issuedOn = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });

  function handleDownload() {
    window.print();
  }

  return (
    <div style={{ maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          body { background: white !important; color: black !important; }
          .receipt-panel { max-width: 100% !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; border: 1px solid #ddd !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print" style={{ marginBottom: '1.2rem' }}>
        <button onClick={() => navigate("/landlord/payments")} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s' }} onMouseEnter={e => e.currentTarget.style.color = C.white} onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
          <Icon name="chevronLeft" size={14} /> Back to Payments
        </button>
      </div>

      <div id="receipt-panel" className="receipt-panel" style={{ width: '100%', background: C.muted2, borderRadius: '8px', border: `1px solid ${C.border}`, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>

        <div style={{ padding: '2rem 2.5rem', borderBottom: `1px solid ${C.border}`, display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.8rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '8px', background: 'rgba(232,160,18,0.1)', border: '1px solid rgba(232,160,18,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="home" size={18} color={C.gold} />
              </div>
              <div>
                <span style={{ fontWeight: 600, color: C.gold, fontSize: '0.8rem', fontFamily: F.bebas, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block' }}>Chihwa Rentals</span>
                <span style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{propertyName}</span>
              </div>
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', marginBottom: '0.2rem' }}>Payment Receipt</h2>
            <p style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.35)', fontFamily: F.mono }}>Official record of payment</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.62rem', fontWeight: 700, padding: '0.25rem 0.65rem', borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase', color: statusColor, background: `${statusColor}14`, border: `1px solid ${statusColor}25`, marginBottom: '0.6rem' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor }} /> {statusLabel}
            </div>
            <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono }}>{rcpNo}</p>
          </div>
        </div>

        <div style={{ padding: '2rem 2.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <style>{`@media (max-width: 768px) { .receipt-grid { grid-template-columns: 1fr !important; } }`}</style>
          <div className="receipt-grid" style={{ display: 'contents' }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <p style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Tenant</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem 1.2rem', borderRadius: '6px', background: C.black, border: `1px solid ${C.border}` }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(232,160,18,0.12)', color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.85rem', flexShrink: 0 }}>{initials(tenantName)}</div>
                  <div>
                    <p style={{ fontWeight: 600, color: C.white, fontSize: '0.9rem', fontFamily: F.dm }}>{tenantName}</p>
                    <p style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{unitInfo} · {propertyName}</p>
                  </div>
                </div>
              </div>

              <div>
                <p style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Payment Details</p>
                <div style={{ borderRadius: '6px', border: `1px solid ${C.border}`, overflow: 'hidden', padding: '0 1.2rem', background: C.black }}>
                  <Row label="Invoice" value={invoiceNo} mono />
                  <Row label="Period" value={periodLabel} />
                  <Row label="Due Date" value={formatDate(dueDate)} />
                  <Row label="Paid On" value={formatDate(paidDate)} />
                  <Row label="Method" value={method} />
                  <Row label="Reference" value={bankRef} mono />
                  {hasProof && <Row label="Proof" value="Verified" color={C.greenLight} />}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <p style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.6rem' }}>Amount Breakdown</p>
                <div style={{ borderRadius: '6px', border: `1px solid ${C.border}`, overflow: 'hidden', padding: '0 1.2rem', background: C.black }}>
                  <Row label="Rent" value={formatAmount(showRent)} />
                  {showUtilities > 0 && <Row label="Utilities" value={formatAmount(showUtilities)} />}
                  {showLateFees > 0 && <Row label="Late Fees" value={formatAmount(showLateFees)} color={C.redLight} />}
                  {showInvoiceTotal && <Row label="Invoice Total" value={formatAmount(invoiceAmountDue)} color="rgba(245,240,232,0.3)" />}
                  {invoiceRemaining > 0 && <Row label="Balance Due" value={formatAmount(invoiceRemaining)} color={C.redLight} />}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.2rem', margin: '0 -1.2rem', background: 'rgba(232,160,18,0.04)', borderTop: `1px solid rgba(232,160,18,0.15)` }}>
                    <span style={{ fontWeight: 600, color: C.white, fontSize: '0.9rem', fontFamily: F.dm }}>Total Paid</span>
                    <span style={{ fontSize: '1.3rem', fontWeight: 700, color: C.gold, fontFamily: F.bebas, letterSpacing: '0.03em' }}>{formatAmount(totalPaid)}</span>
                  </div>
                </div>
              </div>

              {isPartial && (
                <div style={{ padding: '0.8rem 1rem', borderRadius: '4px', background: 'rgba(232,160,18,0.06)', border: '1px solid rgba(232,160,18,0.15)', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <Icon name="info" size={15} color={C.gold} style={{ marginTop: 1 }} />
                  <p style={{ fontSize: '0.7rem', color: 'rgba(232,160,18,0.7)', fontFamily: F.dm, lineHeight: 1.5, flex: 1 }}>Partial payment received. {formatAmount(invoiceRemaining)} still outstanding on invoice {invoiceNo}.</p>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, paddingTop: '0.5rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span>Approved by Landlord</span>
                <span>Issued {issuedOn}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${C.border}`, padding: '1.2rem 2.5rem' }}>
          <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'rgba(245,240,232,0.15)', fontFamily: F.mono, lineHeight: 1.6 }}>
            Official payment receipt@Chihwa Rentals 
          </p>
        </div>

        <div className="no-print" style={{ padding: '0 2.5rem 1.5rem', display: 'flex', gap: '0.8rem' }}>
          <button onClick={() => navigate("/landlord/payments")} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.7rem 1rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 500, fontFamily: F.dm, letterSpacing: '0.04em', border: `1px solid ${C.border}`, background: 'transparent', color: 'rgba(245,240,232,0.5)', cursor: 'pointer', transition: 'all 0.15s' }} onMouseEnter={e => { e.currentTarget.style.background = C.muted; e.currentTarget.style.color = C.white; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(245,240,232,0.5)'; }}>
            <Icon name="chevronLeft" size={14} /> Back to Payments
          </button>
          <button onClick={handleDownload} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.7rem 1rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600, fontFamily: F.dm, letterSpacing: '0.04em', border: 'none', cursor: 'pointer', background: C.gold, color: C.black, transition: 'opacity 0.15s' }} onMouseEnter={e => e.currentTarget.style.opacity = '0.85'} onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            <Icon name="download" size={14} /> Download Receipt
          </button>
        </div>
      </div>
    </div>
  );
}