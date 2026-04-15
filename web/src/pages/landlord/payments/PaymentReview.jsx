import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from '../../../contexts/ToastContext';
import { usePayments } from "../../../contexts/PaymentsContext";
import useDocumentTitle from "../../../hooks/useDocumentTitle";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmt(amount) { return `R ${Number(amount).toLocaleString()}`; }
function initials(name) { return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(); }

function daysLate(due, paid) {
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

function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

function Toast({ toast }) {
  if (!toast) return null;
  const colours = {
    success: "bg-green-600",
    error: "bg-red-600",
    warning: "bg-purple-600",
    info: "bg-blue-600",
  };
  return (
    <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${colours[toast.type] ?? "bg-gray-800"} animate-fade-in`}>
      {toast.type === "success" && <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
      {toast.type === "error" && <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
      {toast.msg}
    </div>
  );
}

function ReceiptModal({ payment, onClose }) {
  const receiptNo = `RCP-${String(payment.id).padStart(4, "0")}-2604`;
  const today = new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-green-600 px-6 py-8 flex flex-col items-center text-white">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-3">
            <svg className="w-9 h-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xl font-bold">Payment Approved</p>
          <p className="text-sm text-green-100 mt-1">Receipt generated successfully</p>
        </div>

        <div className="px-6 py-5 space-y-3 text-sm">
          {[
            ["Receipt No.", <span className="font-mono font-semibold text-gray-900 dark:text-white">{receiptNo}</span>],
            ["Tenant", payment.tenant],
            ["Unit", `${payment.unit} · ${payment.property}`],
            ["Period", "April 2026"],
            ["Method", payment.method],
          ].map(([label, val]) => (
            <div key={label} className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">{label}</span>
              <span className="font-medium text-gray-900 dark:text-white">{val}</span>
            </div>
          ))}

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between items-center">
            <span className="font-semibold text-gray-900 dark:text-white">Amount Paid</span>
            <span className="text-lg font-bold text-green-600">{fmt(payment.amount)}</span>
          </div>

          <p className="text-xs text-center text-gray-400 pt-1">
            Approved on {today} by Landlord
          </p>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button
            onClick={() => alert("In production this downloads a PDF receipt.")}
            className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
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

  const canSubmit = reason !== "" && (reason !== "Other" || customNote.trim() !== "");

  function handleSubmit() {
    setLoading(true);
    setTimeout(() => {
      onConfirmReject(payment.id, reason === "Other" ? customNote : reason);
      setLoading(false);
      onClose();
    }, 1200);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-lg mx-auto">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to review
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Reject Payment</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{payment.tenant} · {payment.unit}</p>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                {initials(payment.tenant)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{payment.tenant}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{payment.unit} · {fmt(payment.amount)}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for rejection <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {REJECT_REASONS.map(r => (
                  <label
                    key={r}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                      ${reason === r
                        ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-500"
                        : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                  >
                    <input
                      type="radio"
                      name="reject-reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="accent-red-600 w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{r}</span>
                  </label>
                ))}
              </div>
            </div>

            {reason === "Other" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Describe the issue <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={customNote}
                  onChange={e => setCustomNote(e.target.value)}
                  placeholder="Explain why this payment is being rejected..."
                  className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                />
              </div>
            )}

            <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
              <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                The tenant will be notified of this rejection. The payment will be marked as <strong>Late</strong> and they will be prompted to resubmit.
              </p>
            </div>
          </div>

          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              {loading ? <><Spinner /> Rejecting...</> : "Reject Payment"}
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
  const { approvePayment, rejectPayment } = usePayments();
  const { showToast } = useToast();
  const payment = location.state?.payment;

  const [step, setStep] = useState("review");
  const [activeTab, setActiveTab] = useState("details");
  const [approving, setApproving] = useState(false);

  useDocumentTitle("Review");

  useEffect(() => {
    if (!payment) {
      navigate("/landlord/payments", { replace: true });
    }
  }, [payment, navigate]);

  if (!payment) {
    return null;
  }

  const receiptNo = `RCP-${String(payment.id).padStart(4, "0")}-2604`;
  const lateDays = payment.paid && payment.due ? daysLate(payment.due, payment.paid) : null;

  function handleCancel() {
    navigate("/landlord/payments");
  }

  function handleApprove() {
    setApproving(true);
    setTimeout(() => {
      approvePayment(payment.id);
      setApproving(false);
      setStep("approved");
      showToast("Payment approved. Receipt generated and sent to tenant.", "success");
    }, 1400);
  }

  function handleRejectSubmit(id, reason) {
    rejectPayment(id, reason);
    showToast(`Payment rejected: "${reason}". Tenant has been notified.`, "error");
    navigate("/landlord/payments");
  }

  // Approved state
  if (step === "approved") {
    return <ReceiptModal payment={payment} onClose={handleCancel} />;
  }

  // Rejecting state
  if (step === "rejecting") {
    return (
      <RejectionModal
        payment={payment}
        onClose={() => setStep("review")}
        onConfirmReject={handleRejectSubmit}
      />
    );
  }

  // Main review page
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Top nav */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleCancel}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Payments
          </button>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">REF: {receiptNo}</span>
        </div>

        {/* Page title */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {initials(payment.tenant)}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Review Payment</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{payment.tenant} · {payment.unit} · {payment.property}</p>
          </div>
          <span className="ml-auto text-xs font-medium px-2.5 py-1 rounded-md bg-yellow-100 text-yellow-800 dark:bg-gray-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-500">
            Pending Approval
          </span>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            {[["details", "Payment Details"], ["proof", "Proof of Payment"]].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors border-b-2
                  ${activeTab === key
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10"
                    : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"}`}
              >
                {label}
                {key === "proof" && payment.proof && (
                  <span className="ml-2 inline-flex items-center justify-center w-4 h-4 text-xs bg-green-500 text-white rounded-full">✓</span>
                )}
              </button>
            ))}
          </div>

          {/* Details tab */}
          {activeTab === "details" && (
            <div className="p-6 space-y-4">
              <div className="divide-y divide-gray-100 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden text-sm">
                {[
                  ["Property", `${payment.unit} · ${payment.property}`],
                  ["Amount Due", fmt(payment.amount)],
                  ["Due Date", payment.due],
                  ["Date Paid", payment.paid ?? "—"],
                  ["Method", payment.method ?? "—"],
                  ["Reference", `TXN-${payment.id}${payment.id}2604`],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between items-center px-4 py-3 odd:bg-white odd:dark:bg-gray-800 even:bg-gray-50 even:dark:bg-gray-700/40">
                    <span className="text-gray-500 dark:text-gray-400">{label}</span>
                    <span className="font-medium text-gray-900 dark:text-white">{val}</span>
                  </div>
                ))}
              </div>

              {lateDays !== null && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium border
                  ${lateDays <= 0
                    ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700"
                    : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700"}`}
                >
                  {lateDays <= 0 ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Paid on time
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Paid {lateDays} day{lateDays !== 1 ? "s" : ""} late
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Proof tab */}
          {activeTab === "proof" && (
            <div className="p-6 space-y-5">
              <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/40 p-8 flex flex-col items-center gap-3 text-center">
                <div className="w-16 h-16 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <svg className="w-9 h-9 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    proof_of_payment_{payment.id}.pdf
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Uploaded {payment.paid} · 1.2 MB
                  </p>
                </div>

                <div className="flex gap-3 mt-1">
                  <button
                    onClick={() => alert("In production this opens the PDF in a viewer.")}
                    className="flex items-center gap-1.5 text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open
                  </button>
                  <span className="text-gray-300 dark:text-gray-600">|</span>
                  <button
                    onClick={() => alert("In production this downloads the proof PDF.")}
                    className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white font-medium transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Verification checklist</p>
                <div className="space-y-2">
                  {[
                    "Amount on proof matches rent due",
                    "Date of payment is visible and correct",
                    "Sender name or account matches tenant",
                    "Reference number is clear and legible",
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm px-6 py-4 flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleCancel}
            disabled={approving}
            className="sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <div className="flex-1" />
          <button
            onClick={() => setStep("rejecting")}
            disabled={approving}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Reject
          </button>
          <button
            onClick={handleApprove}
            disabled={approving}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-70 text-white transition-colors"
          >
            {approving ? (
              <><Spinner /> Approving...</>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Approve & Generate Receipt
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}