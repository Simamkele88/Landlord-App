// LANDLORD MAINTENANCE DASHBOARD
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Wrench, Search, Loader2, RefreshCw, AlertCircle,
  Eye, ArrowUpCircle,
} from "lucide-react";
import useDocumentTitle from "../../../hooks/useDocumentTitle";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

const STATUS_CONFIG = {
  "needs_repair":     { label: "Needs Repair",    color: "text-red-600",    bg: "bg-red-100 dark:bg-red-900/30",     border: "border-red-200 dark:border-red-800",    dot: "bg-red-500"      },
  "assigned":         { label: "Assigned",         color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/30",    border: "border-blue-200 dark:border-blue-800",   dot: "bg-blue-500"     },
  "in_progress":      { label: "In Progress",      color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30",  border: "border-yellow-200 dark:border-yellow-800", dot: "bg-yellow-400"   },
  "completed":        { label: "Completed",        color: "text-green-600",  bg: "bg-green-100 dark:bg-green-900/30",   border: "border-green-200 dark:border-green-800",  dot: "bg-green-500"    },
  "cancelled":        { label: "Closed",           color: "text-gray-600",   bg: "bg-gray-100 dark:bg-gray-700/50",     border: "border-gray-200 dark:border-gray-700",    dot: "bg-gray-400"     },
  "pending_approval": { label: "Pending Approval", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30", border: "border-purple-200 dark:border-purple-800", dot: "bg-purple-500" },
};

const PRIORITY_CONFIG = {
  "urgent":    "bg-red-500 text-white",
  "high":      "bg-orange-400 text-white",
  "medium":    "bg-yellow-400 text-gray-900",
  "low":       "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white",
};

const FILTERS = ["All", "Needs Repair", "In Progress", "Pending Approval", "Completed", "Closed"];

function fmt(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["needs_repair"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${PRIORITY_CONFIG[priority] ?? ""}`}>
      {priority}
    </span>
  );
}

function ModalShell({ title, sub, icon: Icon, iconBg, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                <Icon size={18} />
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
              {sub && <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">{children}</div>
        {footer && (
          <div className="px-6 pb-6 flex gap-3 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function ReopenModal({ request, onClose, onReopen }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!reason.trim()) { setError("Please provide a reason"); return; }
    setLoading(true);
    onReopen({ reason: reason.trim() });
    setLoading(false);
    onClose();
  }

  return (
    <ModalShell
      title="Reopen Request"
      sub={`${request.request_number} · ${request.title}`}
      icon={ArrowUpCircle}
      iconBg="bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} disabled={loading} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
            {loading ? <><Loader2 size={15} className="animate-spin" />Reopening...</> : <>Reopen Request</>}
          </button>
        </>
      }
    >
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
        <AlertCircle size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-orange-700 dark:text-orange-300">
          This will reopen the request and set the status back to "Needs Repair". The caretaker will be notified.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Reason *</label>
        <textarea
          rows={4}
          value={reason}
          onChange={e => { setReason(e.target.value); setError(""); }}
          placeholder="Why is this request being reopened?"
          className="w-full text-sm rounded-lg px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
        />
      </div>
    </ModalShell>
  );
}

export default function LandlordMaintenance() {
  useDocumentTitle("Maintenance");
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [reopenModal, setReopenModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/maintenance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data.requests || []);
    } catch (err) {
      console.error("Failed to fetch maintenance requests:", err);
      setError(err.response?.data?.error || "Unable to connect to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  function handleRefresh() {
    setRefreshing(true);
    fetchRequests(true);
  }

  function filterMatch(request) {
    if (filter === "All") return true;
    if (filter === "Needs Repair") return request.status === "needs_repair";
    if (filter === "In Progress") return ["assigned", "in_progress"].includes(request.status);
    if (filter === "Pending Approval") return request.status === "pending_approval";
    if (filter === "Completed") return request.status === "completed";
    if (filter === "Closed") return request.status === "cancelled";
    return true;
  }

  const filtered = requests.filter(r => {
    const statusMatch = filterMatch(r);
    const q = search.toLowerCase();
    const searchMatch = !q || [r.title, r.tenant_name, r.unit_number?.toString(), r.property_name, r.request_number, r.category]
      .some(s => (s || "").toLowerCase().includes(q));
    return statusMatch && searchMatch;
  });

  async function handleReopen(data) {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/maintenance/${reopenModal.id}/reopen`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchRequests();
      setReopenModal(null);
    } catch (err) {
      console.error("Failed to reopen:", err);
      alert(err.response?.data?.error || "Failed to reopen request");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {saving && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex items-center gap-3 shadow-xl">
            <Loader2 size={20} className="animate-spin text-blue-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Saving changes...</span>
          </div>
        </div>
      )}

      {reopenModal && (
        <ReopenModal
          request={reopenModal}
          onClose={() => setReopenModal(null)}
          onReopen={handleReopen}
        />
      )}

      <div className="px-4 pt-6 max-w-screen-xl mx-auto pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              All Properties · {requests.length} total requests
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
            <button onClick={() => fetchRequests()} className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:underline">
              Try again
            </button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
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
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={32} className="animate-spin text-blue-500" />
              <span className="ml-3 text-gray-500 dark:text-gray-400">Loading requests...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-3">Request</th>
                    <th className="px-5 py-3">Tenant / Unit</th>
                    <th className="px-5 py-3">Property</th>
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Contractor</th>
                    <th className="px-5 py-3">Cost</th>
                    <th className="px-5 py-3">Reported</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
                        No maintenance requests found.
                      </td>
                    </tr>
                  )}
                  {filtered.map(r => (
                    <tr key={r.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <Wrench size={14} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{r.title}</p>
                            <p className="text-xs text-gray-400">{r.request_number} · {r.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{r.tenant_name}</p>
                          <p className="text-xs text-gray-400">{r.unit_number ? `Unit ${r.unit_number}` : "—"}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {r.property_name}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <PriorityBadge priority={r.priority} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {r.contractor_name ?? <span className="italic text-gray-400">Unassigned</span>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold">
                        {r.estimated_cost ? (
                          <span className="text-gray-900 dark:text-white">{fmt(r.estimated_cost)}</span>
                        ) : r.actual_cost ? (
                          <span className="text-green-500">{fmt(r.actual_cost)}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {timeAgo(r.created_at)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/landlord/maintenance/${r.id}`)}
                            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Review
                          </button>
                          {["completed", "cancelled"].includes(r.status) && (
                            <button
                              onClick={() => setReopenModal(r)}
                              className="text-xs font-medium text-orange-600 dark:text-orange-400 hover:underline"
                            >
                              Reopen
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-medium text-gray-900 dark:text-white">{filtered.length}</span> of{" "}
              <span className="font-medium text-gray-900 dark:text-white">{requests.length}</span> requests
            </span>
            {loading && <Loader2 size={16} className="animate-spin text-gray-400" />}
          </div>
        </div>
      </div>
    </div>
  );
}