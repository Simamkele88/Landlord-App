import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Search, RefreshCw, AlertCircle,
  MessageSquare,
} from "lucide-react";
import useDocumentTitle from "../../../hooks/useDocumentTitle";

const API = "http://localhost:4000";

const STATUS_CONFIG = {
  "open":          { label: "Open",         color: "text-red-600",    bg: "bg-red-100 dark:bg-red-900/30",     dot: "bg-red-500"      },
  "under_review":  { label: "Under Review", color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30", dot: "bg-yellow-400"   },
  "awaiting_clarification": { label: "Needs Clarification", color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30", dot: "bg-orange-500" },
  "approved":      { label: "Approved",     color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/30",    dot: "bg-blue-500"    },
  "resolved":      { label: "Resolved",     color: "text-green-600",  bg: "bg-green-100 dark:bg-green-900/30",  dot: "bg-green-500"    },
  "dismissed":     { label: "Dismissed",    color: "text-gray-600",   bg: "bg-gray-100 dark:bg-gray-700/50",    dot: "bg-gray-400"     },
  "escalated":     { label: "Escalated",    color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30",dot: "bg-purple-500"   },
  "rejected":      { label: "Rejected",     color: "text-gray-600",   bg: "bg-gray-100 dark:bg-gray-700/50",    dot: "bg-gray-400"     },
};

const FILTERS = ["All", "Open", "Under Review", "Escalated", "Resolved", "Dismissed"];

const SCOPE_LABELS = {
  specific_tenant: "Specific Unit",
  common_area: "Common Area",
  unknown: "Unknown",
  property_wide: "Property-Wide",
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["open"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color} border`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = (Date.now() - new Date(dateStr)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function LandlordComplaints() {
  useDocumentTitle("Complaints");
  const navigate = useNavigate();

  const [complaints, setComplaints] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const fetchComplaints = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/landlord/complaints`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaints(response.data.complaints || []);
    } catch (err) {
      console.error("Failed to fetch complaints:", err);
      setError(err.response?.data?.error || "Unable to connect to server");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  function handleRefresh() {
    setRefreshing(true);
    fetchComplaints(true);
  }

  const filtered = complaints.filter(c => {
    if (filter === "All") return true;
    if (filter === "Open") return c.status === "open";
    if (filter === "Under Review") return c.status === "under_review";
    if (filter === "Escalated") return c.status === "escalated";
    if (filter === "Resolved") return c.status === "resolved";
    if (filter === "Dismissed") return c.status === "dismissed";
    return true;
  }).filter(c => {
    const q = search.toLowerCase();
    if (!q) return true;
    return [c.subject, c.filed_by_name, c.against_name, c.property_name, c.category]
      .some(s => (s || "").toLowerCase().includes(q));
  });

  const escalatedCount = complaints.filter(c => c.status === "escalated").length;
  const openCount = complaints.filter(c => ["open", "under_review"].includes(c.status)).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="px-4 pt-6 max-w-screen-xl mx-auto pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              All Properties · {complaints.length} total · {escalatedCount} escalated · {openCount} active
            </p>
          </div>
          <button onClick={handleRefresh} disabled={refreshing}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50">
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
            <button onClick={() => fetchComplaints()} className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 hover:underline">Try again</button>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}>
                  {f}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search complaints..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <span className="ml-3 text-gray-500 dark:text-gray-400">Loading complaints...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-3">Complaint</th>
                    <th className="px-5 py-3">Property</th>
                    <th className="px-5 py-3">Filed By</th>
                    <th className="px-5 py-3">Scope</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400">No complaints found.</td></tr>
                  )}
                  {filtered.map(c => (
                    <tr key={c.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                            <MessageSquare size={14} className="text-orange-600 dark:text-orange-400" />
                          </div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm max-w-xs truncate">{c.subject}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-500">{c.property_name}</td>
                      <td className="px-5 py-4 text-sm text-gray-900 dark:text-white">{c.filed_by_name}</td>
                      <td className="px-5 py-4 text-xs text-gray-500">{SCOPE_LABELS[c.complaint_scope] || "—"}</td>
                      <td className="px-5 py-4"><StatusBadge status={c.status} /></td>
                      <td className="px-5 py-4 text-xs text-gray-400">{timeAgo(c.created_at)}</td>
                      <td className="px-5 py-4">
                        <button onClick={() => navigate(`/landlord/complaints/${c.id}`)}
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">View</button>
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
              <span className="font-medium text-gray-900 dark:text-white">{complaints.length}</span> complaints
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}