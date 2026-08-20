/* eslint-disable no-empty */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { Icon } from "../../../components/Icon";

const API = "http://localhost:4000";

const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const COLORS = {
  text: "#000000",       
  textMuted: "#333333",  
  link: "#2471a3",
  border: "#dfe3e8",
  green: "#2b7a4b",
  gold: "#8b6e1a",
  red: "#9e3a3a",
  blue: "#2c6b9b",
};

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

// InfoRow component similar to other pages
function InfoRow({ label, children, mono = false, highlight = false, color }) {
  return (
    <div style={{
      display: 'flex',
      overflow: 'hidden',
      border: '1px solid #e2e3e4',
      marginBottom: '0.4rem',
      fontSize: '14px',
      fontWeight: 400,
    }}>
      <div style={{
        width: '150px',
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
        color: color || '#000',
        background: '#f5f5f5',
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        fontWeight: highlight ? 600 : 400,
        fontFamily: mono ? 'monospace' : FONT,
      }}>
        {children}
      </div>
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
        headers: { Authorization: `Bearer ${token}` },
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
      <div style={{ minHeight: "100vh", background: "#f4f5f7", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
        <div style={{ textAlign: "center" }}>
          <span
            style={{
              width: 28,
              height: 28,
              border: "2px solid rgba(44,62,80,0.1)",
              borderTopColor: "#2c3e50",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
              display: "inline-block",
              marginBottom: "0.8rem",
            }}
          />
          <p style={{ fontSize: "14px", color: "#333" }}>Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div style={{ minHeight: "100vh", background: "#f4f5f7", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
          <Icon name="file-text" size={40} color="#ccc" />
          <p style={{ fontSize: "14px", color: "#333" }}>No receipt data found</p>
          <button
            onClick={() => navigate("/landlord/payments")}
            style={{
              fontSize: "14px",
              color: COLORS.link,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: FONT,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = "underline")}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = "none")}
          >
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
  const hasAllocation = allocatedRent + allocatedUtilities + allocatedLateFees > 0;

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
  const statusColor = isPartial ? COLORS.gold : COLORS.green;
  const rcpNo = payment.receipt_no || payment.receipt_number || `RCP-${String(payment.id).slice(0, 8)}`;
  const issuedOn = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });

  function handleDownload() {
    window.print();
  }

  return (
    <div style={{ maxWidth: 1280, padding: "1.5rem 1rem 3rem", margin: "-1rem -1.8rem", fontFamily: FONT, color: COLORS.text }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media print {
          body { background: white !important; color: black !important; }
          .receipt-panel { max-width: 100% !important; margin: 0 !important; border-radius: 0 !important; box-shadow: none !important; border: 1px solid #ddd !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print" style={{ marginBottom: "1.2rem" }}>
        <button
          onClick={() => navigate("/landlord/payments")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            fontSize: "13px",
            color: "#333",
            fontFamily: FONT,
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#000")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#333")}
        >
          <Icon name="chevronLeft" size={14} /> Back to Payments
        </button>
      </div>

      <div
        id="receipt-panel"
        className="receipt-panel"
        style={{
          width: "100%",
          background: "#fdfdfd",
          borderRadius: "3px",
          border: "1px solid #e9ecef",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        {/* Receipt header */}
        <div
          style={{
            padding: "1.5rem 2rem",
            borderBottom: "1px solid #e9ecef",
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "2rem",
            alignItems: "start",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.8rem" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "6px",
                  background: "#eaf2f8",
                  border: "1px solid #b0cfe0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="home" size={18} color={COLORS.blue} />
              </div>
              <div>
                <span
                  style={{
                    fontWeight: 600,
                    color: COLORS.text,
                    fontSize: "14px",
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    display: "block",
                  }}
                >
                  Chihwa Rentals
                </span>
                <span style={{ fontSize: "13px", color: "#333" }}>{propertyName}</span>
              </div>
            </div>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 500, color: COLORS.text, margin: 0 }}>Payment Receipt</h2>
            <p style={{ fontSize: "13px", color: "#333", margin: "0.2rem 0 0" }}>Official record of payment</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "12px",
                fontWeight: 500,
                padding: "0.2rem 0.65rem",
                borderRadius: "12px",
                color: statusColor,
                background: statusColor === COLORS.green ? "#eef5e8" : "#faf6ed",
                border: `1px solid ${statusColor === COLORS.green ? "#c5d9b8" : "#e5dbb8"}`,
                marginBottom: "0.6rem",
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor }} />
              {statusLabel}
            </div>
            <p style={{ fontSize: "13px", color: "#333", fontFamily: FONT }}>{rcpNo}</p>
          </div>
        </div>

        {/* Receipt body */}
        <div style={{ padding: "1.5rem 2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {/* Tenant section */}
            <div>
              <p style={{ fontSize: "12px", fontWeight: 500, color: "#000", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>Tenant</p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.8rem",
                  padding: "1rem 1.2rem",
                  borderRadius: "2px",
                  background: "#f9fafb",
                  border: "1px solid #e9ecef",
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    background: "#eaf2f8",
                    color: COLORS.blue,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "16px",
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {initials(tenantName)}
                </div>
                <div>
                  <p style={{ fontWeight: 500, color: COLORS.text, fontSize: "14px", margin: 0 }}>{tenantName}</p>
                  <p style={{ fontSize: "13px", color: "#333" }}>{unitInfo} · {propertyName}</p>
                </div>
              </div>
            </div>

            {/* Payment details */}
            <div>
              <p style={{ fontSize: "12px", fontWeight: 500, color: "#000", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>Payment Details</p>
              <div>
                <InfoRow label="Invoice">{invoiceNo}</InfoRow>
                <InfoRow label="Period">{periodLabel}</InfoRow>
                <InfoRow label="Due Date">{formatDate(dueDate)}</InfoRow>
                <InfoRow label="Paid On">{formatDate(paidDate)}</InfoRow>
                <InfoRow label="Method">{method}</InfoRow>
                <InfoRow label="Reference" mono>{bankRef}</InfoRow>
                {hasProof && <InfoRow label="Proof" color={COLORS.green}>Verified</InfoRow>}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
            {/* Amount breakdown */}
            <div>
              <p style={{ fontSize: "12px", fontWeight: 500, color: "#000", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.5rem" }}>Amount Breakdown</p>
              <div>
                <InfoRow label="Rent">{formatAmount(showRent)}</InfoRow>
                {showUtilities > 0 && <InfoRow label="Utilities">{formatAmount(showUtilities)}</InfoRow>}
                {showLateFees > 0 && <InfoRow label="Late Fees" color={COLORS.red}>{formatAmount(showLateFees)}</InfoRow>}
                {showInvoiceTotal && <InfoRow label="Invoice Total">{formatAmount(invoiceAmountDue)}</InfoRow>}
                {invoiceRemaining > 0 && <InfoRow label="Balance Due" color={COLORS.red}>{formatAmount(invoiceRemaining)}</InfoRow>}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem 0",
                    marginTop: "0.5rem",
                    borderTop: "2px solid #e9ecef",
                  }}
                >
                  <span style={{ fontWeight: 500, color: COLORS.text, fontSize: "14px" }}>Total Paid</span>
                  <span style={{ fontSize: "18px", fontWeight: 600, color: COLORS.text }}>{formatAmount(totalPaid)}</span>
                </div>
              </div>
            </div>

            {isPartial && (
              <div
                style={{
                  padding: "0.8rem 1rem",
                  borderRadius: "2px",
                  background: "#faf6ed",
                  border: "1px solid #e5dbb8",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                }}
              >
                <Icon name="info" size={15} color={COLORS.gold} style={{ marginTop: 1 }} />
                <p style={{ fontSize: "13px", color: COLORS.gold, lineHeight: 1.5, margin: 0 }}>
                  Partial payment received. {formatAmount(invoiceRemaining)} still outstanding on invoice {invoiceNo}.
                </p>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#333", paddingTop: "0.5rem", flexWrap: "wrap", gap: "0.4rem" }}>
              <span>Approved by Landlord</span>
              <span>Issued {issuedOn}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e9ecef", padding: "1rem 2rem" }}>
          <p style={{ textAlign: "center", fontSize: "13px", color: "#333", lineHeight: 1.6, margin: 0 }}>
            Official payment receipt · Chihwa Rentals
          </p>
        </div>

        {/* Action buttons */}
        <div className="no-print" style={{ padding: "0 2rem 1.5rem", display: "flex", gap: "0.8rem" }}>
          <button
            onClick={() => navigate("/landlord/payments")}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              padding: "0.5rem 1rem",
              borderRadius: "2px",
              fontSize: "14px",
              fontWeight: 400,
              fontFamily: FONT,
              border: "1px solid #ccc",
              background: "transparent",
              color: "#333",
              cursor: "pointer",
            }}
          >
            <Icon name="chevronLeft" size={14} /> Back to Payments
          </button>
          <button
            onClick={handleDownload}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              padding: "0.5rem 1rem",
              borderRadius: "2px",
              fontSize: "14px",
              fontWeight: 500,
              fontFamily: FONT,
              border: "none",
              cursor: "pointer",
              background: "#2c3e50",
              color: "#ffffff",
            }}
          >
            <Icon name="download" size={14} /> Download Receipt
          </button>
        </div>
      </div>
    </div>
  );
}