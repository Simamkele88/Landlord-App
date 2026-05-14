/* eslint-disable no-unused-vars */
// CARETAKER MAINTENANCE PAGE 
// AUTHOR: SIMAMKELE WEKEZA

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Wrench, AlertCircle, CheckCircle, Clock, ArrowUpCircle,
  Search, ChevronRight, User, Home, Calendar, DollarSign,
  Loader2, Plus, Filter, RefreshCw,
} from "lucide-react";
import useDocumentTitle from "../../../hooks/useDocumentTitle";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

// STATUS CONFIG
const STATUS_CONFIG = {
  "needs_repair":     { label: "Needs Repair",    color: "text-red-600",    bg: "bg-red-100 dark:bg-red-900/30",     border: "border-red-200 dark:border-red-800",    dot: "bg-red-500"      },
  "assigned":         { label: "Assigned",         color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/30",    border: "border-blue-200 dark:border-blue-800",   dot: "bg-blue-500"     },
  "in_progress":      { label: "In Progress",      color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30",  border: "border-yellow-200 dark:border-yellow-800", dot: "bg-yellow-400"   },
  "completed":        { label: "Completed",        color: "text-green-600",  bg: "bg-green-100 dark:bg-green-900/30",   border: "border-green-200 dark:border-green-800",  dot: "bg-green-500"    },
  "cancelled":        { label: "Cancelled",        color: "text-gray-600",   bg: "bg-gray-100 dark:bg-gray-900/30",     border: "border-gray-200 dark:border-gray-800",    dot: "bg-gray-500"     },
  "pending_approval": { label: "Pending Approval", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30", border: "border-purple-200 dark:border-purple-800", dot: "bg-purple-500" },
};

// PRIORITY CONFIG
const PRIORITY_CONFIG = {
  "urgent":    "bg-red-500 text-white",
  "high":      "bg-orange-400 text-white",
  "medium":    "bg-yellow-400 text-gray-900",
  "low":       "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white",
};

const FILTERS = ["All", "Needs Repair", "In Progress", "Completed", "Escalated"];

// HELPERS
function fmt(n) { return `R ${Number(n).toLocaleString("en-ZA")}`; }
function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// STATUS BADGE
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["needs_repair"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// PRIORITY BADGE
function PriorityBadge({ priority }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${PRIORITY_CONFIG[priority] ?? ""}`}>
      {priority}
    </span>
  );
}

// MAIN PAGE
export default function CaretakerMaintenance() {
  useDocumentTitle("Maintenance");
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // FETCH FROM API
  const fetchRequests = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/caretaker/maintenance`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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


  const handleRefresh = () => {
    setRefreshing(true);
    fetchRequests(true);
  };

  // FILTER LOGIC
  function filterMatch(request) {
    if (filter === "All") return true;
    if (filter === "Needs Repair") return request.status === "needs_repair";
    if (filter === "In Progress") return ["assigned", "in_progress"].includes(request.status);
    if (filter === "Completed") return ["completed"].includes(request.status);
    if (filter === "Escalated") return ["pending_approval"].includes(request.status);
    return true;
  }

  const filtered = requests.filter(r => {
    const statusMatch = filterMatch(r);
    const q = search.toLowerCase();
    const searchMatch = !q || [r.title, r.tenant_name, r.unit_number, r.property_name, r.request_number, r.category]
      .some(s => (s || "").toLowerCase().includes(q));
    return statusMatch && searchMatch;
  });

  // STATS
  const needsAction = requests.filter(r => r.status === "needs_repair").length;
  const inProgress = requests.filter(r => ["assigned", "in_progress"].includes(r.status)).length;
  const awaitingApproval = requests.filter(r => r.status === "pending_approval").length;
  const awaitingConfirm = requests.filter(r => r.status === "completed").length;

  // GET PROPERTY NAME FROM FIRST REQUEST
  const propertyName = requests[0]?.property_name || "Property";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 pt-6 max-w-screen-xl mx-auto pb-12">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {propertyName} · {requests.length} total requests
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

        {/* ERROR STATE */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-red-500" />
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
            <button
              onClick={() => fetchRequests()}
              className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* TABLE CARD */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">

          {/* TOOLBAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
            {/* FILTER TABS */}
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
                    <span className="ml-1.5 text-xs opacity-70">
                      {requests.filter(r => {
                        if (f === "Needs Repair") return r.status === "needs_repair";
                        if (f === "In Progress") return ["assigned", "in_progress"].includes(r.status);
                        if (f === "Completed") return ["completed"].includes(r.status);
                        if (f === "Escalated") return ["pending_approval"].includes(r.status);
                        return false;
                      }).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* SEARCH */}
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

          {/* TABLE */}
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
                    <th className="px-5 py-3">Priority</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Worker</th>
                    <th className="px-5 py-3">Cost</th>
                    <th className="px-5 py-3">Reported</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
                        No maintenance requests found.
                      </td>
                    </tr>
                  )}
                  {filtered.map(r => (
                    <tr key={r.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {/* TITLE */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                            <Wrench size={14} className="text-blue-600 dark:text-blue-400" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">{r.title}</p>
                            <p className="text-xs text-gray-400">{r.category}</p>
                          </div>
                        </div>
                      </td>

                      {/* TENANT + UNIT */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{r.tenant_name}</p>
                          <p className="text-xs text-gray-400">{r.unit_number ? `Unit ${r.unit_number}` : 'No unit'}</p>
                        </div>
                      </td>

                      {/* PRIORITY */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <PriorityBadge priority={r.priority} />
                      </td>

                      {/* STATUS */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <StatusBadge status={r.status} />
                      </td>

                      {/* WORKER */}
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {r.contractor_name ?? <span className="italic text-gray-400">Unassigned</span>}
                      </td>

                      {/* COST */}
                      <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold">
                        {r.estimated_cost ? (
                          <span className="text-gray-900 dark:text-white">{fmt(r.estimated_cost)}</span>
                        ) : r.actual_cost ? (
                          <span className="text-green-500">{fmt(r.actual_cost)}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>

                      {/* REPORTED */}
                      <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {timeAgo(r.created_at)}
                      </td>

                      {/* ACTION */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <button
                          onClick={() => navigate(`/caretaker/maintenance/${r.id}`)}
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* FOOTER */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-medium text-gray-900 dark:text-white">{filtered.length}</span> of{" "}
              <span className="font-medium text-gray-900 dark:text-white">{requests.length}</span> requests
            </span>
            {loading && (
              <Loader2 size={16} className="animate-spin text-gray-400" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}