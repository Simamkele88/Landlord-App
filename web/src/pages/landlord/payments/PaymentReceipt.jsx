import { useLocation, useNavigate } from "react-router-dom";
import useDocumentTitle from "../../../hooks/useDocumentTitle";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(amount) {
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

// Derive receipt number from payment id + paid date
function receiptNumber(payment) {
  const datePart = payment.paid
    ? payment.paid.replace(/-/g, "").slice(2) // e.g. "260401"
    : "000000";
  return `RCP-${String(payment.id).padStart(4, "0")}-${datePart}`;
}

// ─── Row helper ───────────────────────────────────────────────────────────────
function Row({ label, value, mono = false, highlight = false }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span
        className={`text-sm font-medium text-right
          ${highlight ? "text-green-600 dark:text-green-400 text-base font-bold" : "text-gray-900 dark:text-white"}
          ${mono ? "font-mono" : ""}
        `}
      >
        {value}
      </span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PaymentReceipt() {
  useDocumentTitle("Receipt");

  const { state } = useLocation();
  const navigate = useNavigate();

  // If someone lands here without state (e.g. direct URL), send them back
  const payment = state?.payment;
  if (!payment) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-gray-500 dark:text-gray-400 text-sm">No receipt data found.</p>
          <button
            onClick={() => navigate("/landlord/payments")}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Payments
          </button>
        </div>
      </div>
    );
  }

  const rcpNo = receiptNumber(payment);
  const approvedOn = new Date().toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  // ── Download handler ────────────────────────────────────────────────────────
  function handleDownload() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">

      {/* ── Back nav ── */}
      <div className="max-w-2xl mx-auto mb-6">
        <button
          onClick={() => navigate("/landlord/payments")}
          className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Payments
        </button>
      </div>

      {/* ── Receipt card ── */}
      <div
        id="receipt-panel"
        className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden print:shadow-none print:border-0"
      >

        {/* ── Green header ── */}
        <div className="bg-green-600 px-8 py-8 text-white">
          <div className="flex items-start justify-between">
            {/* Left: branding */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                </div>
                <span className="font-semibold text-white/90 text-sm tracking-wide">
                  Chihwa Rentals
                </span>
              </div>
              <h1 className="text-2xl font-bold leading-tight">Payment Receipt</h1>
              <p className="text-green-100 text-sm mt-1">{payment.property}</p>
            </div>

            {/* Right: verified badge */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className="text-xs text-green-100 font-medium uppercase tracking-wider">Verified</span>
            </div>
          </div>
        </div>

        {/* ── Receipt number band ── */}
        <div className="bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-800 px-8 py-3 flex items-center justify-between">
          <span className="text-xs text-green-700 dark:text-green-400 font-medium uppercase tracking-wider">
            Receipt Number
          </span>
          <span className="font-mono text-sm font-bold text-green-800 dark:text-green-300">
            {rcpNo}
          </span>
        </div>

        {/* ── Body ── */}
        <div className="px-8 py-6 space-y-6">

          {/* Tenant info */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-bold flex-shrink-0">
              {initials(payment.tenant)}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{payment.tenant}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {payment.unit} &mdash; {payment.property}
              </p>
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 border border-green-200 dark:border-green-700 px-2.5 py-1 rounded-full">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Paid
              </span>
            </div>
          </div>

          {/* Payment details table */}
          <div>
            <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">
              Payment Details
            </h2>
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden px-4">
              <Row label="Rental Period"   value="April 2026" />
              <Row label="Due Date"        value={formatDate(payment.due)} />
              <Row label="Date Paid"       value={formatDate(payment.paid)} />
              <Row label="Payment Method" value={payment.method ?? "—"} />
              <Row
                label="Paid On Time"
                value={
                  payment.paid && payment.due && payment.paid <= payment.due
                    ? "✓ Yes"
                    : `${Math.max(0, Math.ceil((new Date(payment.paid) - new Date(payment.due)) / 86400000))} day(s) late`
                }
              />
              {payment.proof && (
                <Row label="Proof of Payment" value="Uploaded" />
              )}
            </div>
          </div>

          {/* Amount summary */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="px-4">
              <Row label="Rent Amount"   value={fmt(payment.amount)} />
              <Row label="Outstanding"   value={fmt(0)} />
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
              <span className="font-semibold text-gray-900 dark:text-white">Total Paid</span>
              <span className="text-xl font-bold text-green-600 dark:text-green-400">
                {fmt(payment.amount)}
              </span>
            </div>
          </div>

          {/* Approval metadata */}
          <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 pt-1">
            <span>Approved by: <span className="font-medium text-gray-600 dark:text-gray-300">Landlord</span></span>
            <span>Issued: <span className="font-medium text-gray-600 dark:text-gray-300">{approvedOn}</span></span>
          </div>

          {/* Dashed divider — receipt tear line feel */}
          <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-700" />

          <p className="text-center text-xs text-gray-400 dark:text-gray-500">
            This is an official rental payment receipt generated by SmartRental.
            <br />Keep this for your records.
          </p>
        </div>

        {/* ── Action footer ── */}
        <div className="px-8 pb-8 flex gap-3 print:hidden">
          <button
            onClick={() => navigate("/landlord/payments")}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white text-sm font-medium py-3 px-4 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Payments
          </button>

          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-3 px-4 rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Receipt
          </button>
        </div>
      </div>

      {/* ── Print styles (injected inline so no extra CSS file needed) ── */}
      <style>{`
        @media print {
          body { background: white; }
          #receipt-panel { max-width: 100%; margin: 0; border-radius: 0; }
        }
      `}</style>
    </div>
  );
}

