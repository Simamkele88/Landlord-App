
// PAYMENTS PAGE
// AUTHOR: SIMAMKELE WEKEZA
// IF YOU DO NOT UNDERSTAND THIS CODE, PLEASE ASK ME TO EXPLAIN AND DON'T ASSUME OTHERWISE.
import { useState } from "react";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useNavigate } from "react-router-dom";
import { usePayments } from "../../../contexts/PaymentsContext";
import { useToast } from "../../../contexts/ToastContext";
import FullReportModal from "../../../components/FullReportModal";


// STATUS STYLES
const STATUS_STYLES = {
  "Paid":             "bg-green-100 text-green-800 dark:bg-gray-700 dark:text-green-400 border border-green-100 dark:border-green-500",
  "Pending Approval": "bg-yellow-100 text-yellow-800 dark:bg-gray-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-500",
  "Late":             "bg-red-100 text-red-800 dark:bg-gray-700 dark:text-red-400 border border-red-100 dark:border-red-500",
  "Rejected":         "bg-red-100 text-red-800 dark:bg-gray-700 dark:text-red-400 border border-red-100 dark:border-red-500",
  "Collections":      "bg-purple-100 text-purple-800 dark:bg-gray-700 dark:text-purple-400 border border-purple-100 dark:border-purple-500",
};

const REJECT_REASONS = [
  "Amount does not match rent due",
  "Proof of payment is not legible",
  "Wrong reference number",
  "Payment made to wrong account",
  "Duplicate submission",
  "Other",
];

const FILTERS = ["All", "Paid", "Pending Approval", "Late", "Collections", "Rejected"];

// HELPER FUNCTIONS
function format(amount) { return `R ${amount.toLocaleString()}`; }

function initials(name) {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}


function Spinner() {
  return (
    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

// STAT CARD COMPONENT
function StatCard({ label, value, sub, color }) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 sm:p-6 dark:bg-gray-800">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${color ?? "text-gray-900 dark:text-white"}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
    </div>
  );
}

// STATUS BADGE COMPONENT
function StatusBadge({ status }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-md ${STATUS_STYLES[status] ?? ""}`}>
      {status}
    </span>
  );
}


// COLLECTIONS MODAL COMPONENT
function CollectionsModal({ payment, onClose, onConfirm }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  function handleConfirm() {
    setLoading(true);
    setTimeout(() => {
      onConfirm(payment.id);
      setLoading(false);
      onClose();
    }, 1000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Send to Collections</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You are escalating <span className="font-semibold text-gray-900 dark:text-white">{payment.tenant}</span> ({payment.unit}) to collections for an outstanding balance of <span className="font-semibold text-red-500">{format(payment.amount)}</span>.
          </p>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Note for collections agent <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add context or instructions..."
            className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white p-2.5 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
          />
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} disabled={loading} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-70 text-white text-sm font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            {loading ? <><Spinner /> Escalating...</> : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

// TOAST COMPONENT
function Toast({ toast }) {
  if (!toast) return null;
  const colours = {
    success: "bg-green-600",
    error:   "bg-red-600",
    warning: "bg-purple-600",
    info:    "bg-blue-600",
  };
  return (
    <div className={`fixed top-5 right-5 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white ${colours[toast.type] ?? "bg-gray-800"} animate-fade-in`}>
      {toast.type === "success" && <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
      {toast.type === "error"   && <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>}
      {toast.msg}
    </div>
  );
}

// MAIN PAYMENTS PAGE COMPONENT
export default function PaymentsPage() {
  const { payments, approvePayment, rejectPayment, sendToCollections } = usePayments();
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [reviewPayment, setReviewPayment] = useState(null);
  const [collectionsPayment, setCollectionsPayment] = useState(null);
  const [showFullReport, setShowFullReport] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useDocumentTitle("Payments");

   function handleApproved(id) {
    approvePayment(id);
    showToast("Payment approved. Receipt generated and sent to tenant.", "success");
  }

  function handleRejected(id, reason) {
    rejectPayment(id, reason);
    showToast(`Payment rejected: "${reason}". Tenant has been notified.`, "error");
    setReviewPayment(null);
  }

  function handleCollections(id) {
    sendToCollections(id);
    showToast("Account escalated to collections.", "warning");
  }

  const filtered = payments.filter(p => {
    const matchesFilter = filter === "All" || p.status === filter;
    const q = search.toLowerCase();
    const matchesSearch = !q || p.tenant.toLowerCase().includes(q) || p.unit.toLowerCase().includes(q) || p.property.toLowerCase().includes(q);
    return matchesFilter && matchesSearch;
  });

  const totalExpected  = payments.reduce((s, p) => s + p.amount, 0);
  const totalCollected = payments.filter(p => p.status === "Paid").reduce((s, p) => s + p.amount, 0);
  const pendingCount   = payments.filter(p => p.status === "Pending Approval").length;
  const lateCount      = payments.filter(p => p.status === "Late" || p.status === "Collections").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      

      {/* MODALS */}
      {reviewPayment && (
        <ReviewModal
          payment={reviewPayment}
          onClose={() => setReviewPayment(null)}
          onApproved={handleApproved}
          onRejected={handleRejected}
        />
      )}
      {collectionsPayment && (
        <CollectionsModal
          payment={collectionsPayment}
          onClose={() => setCollectionsPayment(null)}
          onConfirm={handleCollections}
        />
      )}
      {showFullReport && (
        <FullReportModal onClose={() => setShowFullReport(false)} />
      )}

      <div className="px-4 pt-6 max-w-screen-xl mx-auto pb-10">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">April 2026 · All Properties</p>
          </div>
          <button 
            onClick={() => setShowFullReport(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            Export Report
          </button>
        </div>

        {/* STAT CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
          <StatCard label="Total Expected (Apr)" value={format(totalExpected)} sub={`${payments.length} tenants`} />
          <StatCard label="Collected" value={format(totalCollected)} sub={`${payments.filter(p => p.status === "Paid").length} payments verified`} color="text-green-500" />
          <StatCard label="Pending Approval" value={pendingCount} sub="Proof uploaded, awaiting review" color="text-yellow-500" />
          <StatCard label="Late / Collections" value={lateCount} sub="Require attention" color="text-red-500" />
        </div>

        {/* TABLE CARD */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800">

          {/* TOOLBAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    filter === f
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {f}
                  {f !== "All" && (
                    <span className="ml-1.5 text-xs opacity-70">{payments.filter(p => p.status === f).length}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="relative">
              <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search tenant, unit..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
              />
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Tenant</th>
                  <th className="px-6 py-3">Unit / Property</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3">Date Paid</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Proof</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
                      No payments match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map(p => (
                  <tr key={p.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {initials(p.tenant)}
                        </div>
                        <div>
                          <div>{p.tenant}</div>
                          {p.rejectionReason && (
                            <div className="text-xs text-red-500 dark:text-red-400 font-normal mt-0.5 max-w-[160px] truncate" title={p.rejectionReason}>
                              ↳ {p.rejectionReason}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-gray-900 dark:text-white font-medium">{p.unit}</div>
                      <div className="text-xs text-gray-400">{p.property}</div>
                    </td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{format(p.amount)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{p.due}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{p.paid ?? <span className="text-red-400">—</span>}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.method ?? <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {p.proof
                        ? <span className="text-green-500 font-medium flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Yes
                          </span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={p.status} /></td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {p.status === "Pending Approval" && p.proof && (
                          <button
                            onClick={() => navigate('/landlord/payments/review', { state: { payment: p } })}
                            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Review
                          </button>
                        )}
                        {p.status === "Late" && (
                          <button
                            onClick={() => setCollectionsPayment(p)}
                            className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            Collections
                          </button>
                        )}
                        {p.status === "Rejected" && (
                          <button
                            onClick={() => setCollectionsPayment(p)}
                            className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            Collections
                          </button>
                        )}
                        {p.status === "Paid" && (
                          <button
                            onClick={() => navigate('/landlord/payments/receipt', { state: { payment: p } })}
                            className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:underline"
                          >
                            Receipt
                          </button>
                        )}
                        {p.status === "Collections" && (
                          <span className="text-xs text-gray-400">Escalated</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Showing <span className="font-medium text-gray-900 dark:text-white">{filtered.length}</span> of <span className="font-medium text-gray-900 dark:text-white">{payments.length}</span> payments
          </span>
          <button 
            onClick={() => setShowFullReport(true)}
            className="inline-flex items-center text-xs font-medium uppercase text-blue-600 dark:text-blue-400 hover:underline"
          >
            Full Report
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        </div>
      </div>
    </div>
  );
}
