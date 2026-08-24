/* eslint-disable no-empty */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { Icon } from "../../../components/Icon";
import jsPDF from 'jspdf';

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

const LOGO_BASE64 = "../../../../public/images/logo/logo.jpg";

function formatAmount(amount) {
  if (amount === null || amount === undefined) return "R 0.00";
  return `R ${Number(amount).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  function handleExportPDF() {
    if (!payment) return;

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    let y = margin;

    const drawLine = (yPos) => {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos, pageWidth - margin, yPos);
    };

    const logoSize = 15;
    const logoWidth = 30;
    const logoX = margin;
    const logoY = y;

    if (LOGO_BASE64) {
      doc.addImage(LOGO_BASE64, 'PNG', logoX, logoY, logoWidth, logoSize);
    }

    const textX = LOGO_BASE64 ? logoX + logoWidth + 4 : logoX;
    const textY = logoY + (LOGO_BASE64 ? logoSize / 2 : 0) - 2;

    doc.setFontSize(LOGO_BASE64 ? 12 : 14);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Chihwa Rentals', textX, textY);
    doc.setFontSize(LOGO_BASE64 ? 8 : 9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(payment.property_name || 'Property', textX, textY + 5);

    y = logoY + logoSize + 6;

    const rcpNo = payment.receipt_no || payment.receipt_number || `RCP-${String(payment.id).slice(0, 8)}`;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(rcpNo, pageWidth - margin, margin + 2, { align: 'right' });
    doc.setTextColor(43, 122, 75);
    doc.setTextColor(0, 0, 0);

    drawLine(y);
    y += 6;

    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text('Payment Receipt', pageWidth / 2, y, { align: 'center' });
    y += 6;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text('Official record of payment', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Tenant', margin, y);
    y += 4;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const tenantName = payment.tenant_name || 'Unknown';
    const unitInfo = payment.unit_number || '—';
    const propertyName = payment.property_name || '—';
    doc.text(`${tenantName}`, margin + 2, y);
    y += 5;
    doc.text(`${unitInfo} · ${propertyName}`, margin + 2, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Payment Details', margin, y);
    y += 4;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    const details = [
      ['Invoice', payment.invoice_number || '—'],
      ['Period', formatRentalPeriod(payment.billing_period_start)],
      ['Due Date', formatDate(payment.due_date)],
      ['Paid On', formatDate(payment.payment_date)],
      ['Method', formatPaymentMethod(payment.payment_method)],
      ['Reference', payment.bank_reference || '—'],
    ];
    if (payment.proof_of_payment_url) details.push(['Proof', 'Verified']);

    const labelWidth = 30;
    const valueStart = margin + labelWidth + 2;
    details.forEach(([label, value]) => {
      doc.setFont(undefined, 'bold');
      doc.setTextColor(44, 62, 80);
      doc.text(label + ':', margin, y);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text(value, valueStart, y);
      y += 5;
    });
    y += 4;

    drawLine(y);
    y += 6;

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

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(44, 62, 80);
    doc.text('Amount Breakdown', margin, y);
    y += 4;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    const printBreakdown = (label, amount, color = null) => {
      const labelStr = label + ':';
      const amountStr = formatAmount(amount);
      doc.setFont(undefined, 'bold');
      doc.setTextColor(44, 62, 80);
      doc.text(labelStr, margin, y);
      doc.setFont(undefined, 'normal');
      doc.setTextColor(color || 0, 0, 0);
      doc.text(amountStr, pageWidth - margin, y, { align: 'right' });
      y += 5;
    };

    printBreakdown('Rent', showRent);
    if (showUtilities > 0) printBreakdown('Utilities', showUtilities);
    if (showLateFees > 0) printBreakdown('Late Fees', showLateFees, COLORS.red);
    if (showInvoiceTotal) printBreakdown('Invoice Total', invoiceAmountDue);
    if (invoiceRemaining > 0) printBreakdown('Balance Due', invoiceRemaining, COLORS.red);

    y += 2;
    drawLine(y);
    y += 4;
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.setTextColor(0, 0, 0);
    const totalLabel = 'Total Paid:';
    const totalAmount = formatAmount(totalPaid);
    doc.text(totalLabel, margin, y);
    doc.setTextColor(43, 122, 75);
    doc.text(totalAmount, pageWidth - margin, y, { align: 'right' });
    y += 6;

    if (invoiceRemaining > 0) {
      doc.setFontSize(9);
      doc.setFont(undefined, 'italic');
      doc.setTextColor(139, 110, 26);
      doc.text(`* Partial payment received. ${formatAmount(invoiceRemaining)} still outstanding.`, margin, y);
      y += 6;
    }

    const issuedOn = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });
    drawLine(y);
    y += 6;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(`Approved by Landlord · Issued ${issuedOn}`, pageWidth / 2, y, { align: 'center' });
    y += 5;
    doc.text('Official payment receipt · Chihwa Rentals', pageWidth / 2, y, { align: 'center' });

    doc.save(`Receipt_${rcpNo}.pdf`);
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
  const rcpNo = payment.receipt_no || payment.receipt_number || `RCP-${String(payment.id).slice(0, 8)}`;
  const issuedOn = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });

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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
            <div>
              <div style={{ fontWeight: 600, color: COLORS.text, fontSize: "14px", letterSpacing: "0.04em" }}>
                Chihwa Rentals
              </div>
              <div style={{ fontSize: "12px", color: "#333" }}>{propertyName}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "12px", color: "#333" }}>{rcpNo}</div>
          </div>
        </div>

        {/* Receipt body */}
        <div style={{ padding: "1.5rem 2rem" }}>
          {/* Title */}
          <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 500, color: COLORS.text, margin: 0 }}>Payment Receipt</h2>
            <p style={{ fontSize: "12px", color: "#333", margin: "0.2rem 0 0" }}>Official record of payment</p>
          </div>

          {/* Tenant */}
          <div style={{ marginBottom: "1.2rem" }}>
            <div style={{ fontSize: "11px", fontWeight: 500, color: COLORS.text, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.3rem" }}>Tenant</div>
            <div style={{ padding: "0.8rem 1rem", borderRadius: "2px", background: "#f9fafb", border: "1px solid #e9ecef" }}>
              <div style={{ fontWeight: 500, fontSize: "14px", color: COLORS.text }}>{tenantName}</div>
              <div style={{ fontSize: "13px", color: "#333" }}>{unitInfo} · {propertyName}</div>
            </div>
          </div>

          {/* Payment Details */}
          <div style={{ marginBottom: "1.2rem" }}>
            <div style={{ fontSize: "11px", fontWeight: 500, color: COLORS.text, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem" }}>Payment Details</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              {[
                ["Invoice", invoiceNo],
                ["Period", periodLabel],
                ["Due Date", formatDate(dueDate)],
                ["Paid On", formatDate(paidDate)],
                ["Method", method],
                ["Reference", bankRef],
                ...(hasProof ? [["Proof", "Verified"]] : []),
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.2rem 0", borderBottom: "1px solid #f1f3f5" }}>
                  <span style={{ fontSize: "13px", color: "#333", fontWeight: 500 }}>{label}</span>
                  <span style={{ fontSize: "13px", color: COLORS.text, fontWeight: label === "Proof" ? 600 : 400 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid #e9ecef", margin: "1.2rem 0" }} />

          {/* Amount Breakdown */}
          <div>
            <div style={{ fontSize: "11px", fontWeight: 500, color: COLORS.text, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.4rem" }}>Amount Breakdown</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
              {[
                ["Rent", formatAmount(showRent)],
                ...(showUtilities > 0 ? [["Utilities", formatAmount(showUtilities)]] : []),
                ...(showLateFees > 0 ? [["Late Fees", formatAmount(showLateFees), COLORS.red]] : []),
                ...(showInvoiceTotal ? [["Invoice Total", formatAmount(invoiceAmountDue)]] : []),
                ...(invoiceRemaining > 0 ? [["Balance Due", formatAmount(invoiceRemaining), COLORS.red]] : []),
              ].map(([label, amount, color]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "0.2rem 0", borderBottom: "1px solid #f1f3f5" }}>
                  <span style={{ fontSize: "13px", color: "#333" }}>{label}</span>
                  <span style={{ fontSize: "13px", color: color || COLORS.text, fontWeight: label === "Balance Due" ? 600 : 400 }}>{amount}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "0.8rem 0", marginTop: "0.3rem", borderTop: "2px solid #e9ecef" }}>
                <span style={{ fontSize: "14px", fontWeight: 600, color: COLORS.text }}>Total Paid</span>
                <span style={{ fontSize: "16px", fontWeight: 700, color: COLORS.green }}>{formatAmount(totalPaid)}</span>
              </div>
            </div>
          </div>

          {/* Partial payment note */}
          {isPartial && (
            <div style={{ marginTop: "1rem", padding: "0.7rem 1rem", borderRadius: "2px", background: "#faf6ed", border: "1px solid #e5dbb8", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
              <Icon name="info" size={15} color={COLORS.gold} style={{ marginTop: 1 }} />
              <p style={{ fontSize: "13px", color: COLORS.gold, lineHeight: 1.5, margin: 0 }}>
                Partial payment received. {formatAmount(invoiceRemaining)} still outstanding on invoice {invoiceNo}.
              </p>
            </div>
          )}

          {/* Footer info */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#333", paddingTop: "1rem", marginTop: "1.2rem", borderTop: "1px solid #e9ecef" }}>
            <span>Approved by Landlord</span>
            <span>Issued {issuedOn}</span>
          </div>
        </div>

        {/* Footer line */}
        <div style={{ borderTop: "1px solid #e9ecef", padding: "0.8rem 2rem", textAlign: "center", fontSize: "12px", color: "#333" }}>
          Official payment receipt · Chihwa Rentals
        </div>

        {/* Action buttons */}
        <div className="no-print" style={{ padding: "0 2rem 1.5rem", display: "flex", gap: "0.8rem" }}>
          <button
            onClick={() => navigate("/landlord/payments/history")}
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
            onClick={handleExportPDF}
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
            <Icon name="download" size={14} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}