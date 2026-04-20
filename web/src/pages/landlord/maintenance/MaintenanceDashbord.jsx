// This is the maintenance dashboard for landlords.
import { useState } from "react";

import useDocumentTitle from "../../../hooks/useDocumentTitle";

// ─── Mock Data ────────────────────────────────────────────────────────────────
const REQUESTS = [
{id:1,title:"Burst pipe under kitchen sink",description:"Water leaking under the sink, cabinet is getting damaged. Needs urgent attention.",tenant:"Sipho Dlamini",unit:"Unit 4A",property:"Hillbrow Heights",category:"Plumbing",priority:"Urgent",status:"In Progress",worker:"James Mokoena",reportedOn:"2026-04-10",updatedOn:"2026-04-11",photo:true},
{id:2,title:"Broken bedroom window latch",description:"The latch on the main bedroom window is broken and cannot be locked.",tenant:"Lerato Mokoena",unit:"Unit 2B",property:"Hillbrow Heights",category:"Windows & Doors",priority:"Medium",status:"Needs Repair",worker:null,reportedOn:"2026-04-09",updatedOn:"2026-04-09",photo:false},
{id:3,title:"No hot water in bathroom",description:"Hot water geyser appears to have stopped working. Cold water only.",tenant:"Ahmed Patel",unit:"Unit 1C",property:"Berea Flats",category:"Electrical / Geyser",priority:"Urgent",status:"Completed",worker:"Thandi Electricals",reportedOn:"2026-04-05",updatedOn:"2026-04-08",photo:true},
{id:4,title:"Cracked ceiling in lounge",description:"Large crack running across the lounge ceiling, small bits of plaster falling.",tenant:"Nomsa Khumalo",unit:"Unit 3A",property:"Berea Flats",category:"Structural",priority:"High",status:"Needs Repair",worker:null,reportedOn:"2026-04-11",updatedOn:"2026-04-11",photo:true},
{id:5,title:"Stove burner not working",description:"Two of the four stove burners have stopped working.",tenant:"Priya Naidoo",unit:"Unit 2A",property:"Yeoville Corner",category:"Appliances",priority:"Medium",status:"In Progress",worker:"Fix-It Appliances",reportedOn:"2026-04-08",updatedOn:"2026-04-10",photo:false},
{id:6,title:"Damp patch on bedroom wall",description:"Large damp patch appeared on the exterior-facing bedroom wall after rain.",tenant:"Kabelo Sithole",unit:"Unit 6B",property:"Hillbrow Heights",category:"Structural",priority:"High",status:"Needs Repair",worker:null,reportedOn:"2026-04-12",updatedOn:"2026-04-12",photo:true},
{id:7,title:"Flickering lights in hallway",description:"Hallway light flickers constantly, likely a wiring issue.",tenant:"Zanele Moyo",unit:"Unit 1A",property:"Berea Flats",category:"Electrical / Geyser",priority:"Low",status:"Completed",worker:"Thandi Electricals",reportedOn:"2026-04-03",updatedOn:"2026-04-06",photo:false},
{id:8,title:"Toilet not flushing properly",description:"Toilet flush is very weak, sometimes needs two flushes.",tenant:"Thabo Nkosi",unit:"Unit 5D",property:"Yeoville Corner",category:"Plumbing",priority:"Medium",status:"Needs Repair",worker:null,reportedOn:"2026-04-13",updatedOn:"2026-04-13",photo:false}
];

// ─── Config ───────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  "Needs Repair": {
    badge: "bg-red-100 text-red-800 dark:bg-gray-700 dark:text-red-400 border border-red-100 dark:border-red-500",
    dot: "bg-red-500",
  },
  "In Progress": {
    badge: "bg-yellow-100 text-yellow-800 dark:bg-gray-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-500",
    dot: "bg-yellow-400",
  },
  "Completed": {
    badge: "bg-green-100 text-green-800 dark:bg-gray-700 dark:text-green-400 border border-green-100 dark:border-green-500",
    dot: "bg-green-500",
  },
};

const PRIORITY_CONFIG = {
  "Urgent": "bg-red-500 text-white",
  "High":   "bg-orange-400 text-white",
  "Medium": "bg-yellow-400 text-gray-900",
  "Low":    "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300",
};

const CATEGORY_ICONS = {
  "Plumbing":           "🔧",
  "Electrical / Geyser":"⚡",
  "Structural":         "🏗️",
  "Windows & Doors":   "🪟",
  "Appliances":         "🍳",
};

const FILTERS   = ["All", "Needs Repair", "In Progress", "Completed"];
const VIEWS     = ["list", "board"];
const SORT_OPTS = [
  { value: "newest",   label: "Newest first" },
  { value: "oldest",   label: "Oldest first" },
  { value: "priority", label: "Priority" },
];

const PRIORITY_ORDER = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function daysAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 sm:p-6 dark:bg-gray-800 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? {};
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-md ${cfg.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {status}
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

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({ request, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">{CATEGORY_ICONS[request.category] ?? "🔨"}</span>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-snug truncate">
                {request.title}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                #{request.id} · {request.category}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-3 flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Badges row */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>

          {/* Description */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Description</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{request.description}</p>
          </div>

          {/* Details grid */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
            {[
              ["Tenant",       request.tenant],
              ["Unit",         `${request.unit} · ${request.property}`],
              ["Reported",     `${request.reportedOn} (${daysAgo(request.reportedOn)})`],
              ["Last Updated", `${request.updatedOn} (${daysAgo(request.updatedOn)})`],
              ["Assigned To",  request.worker ?? "Not yet assigned"],
              ["Photo Uploaded", request.photo ? "✓ Yes" : "—"],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700/40 odd:bg-white odd:dark:bg-gray-800">
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white text-right ml-4">{val}</span>
              </div>
            ))}
          </div>

          {/* Note: landlord read-only */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <svg className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Maintenance tasks are managed by the caretaker. Status updates and worker assignments are handled in the Caretaker portal.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── List Row ─────────────────────────────────────────────────────────────────
function ListRow({ r, onView }) {
  return (
    <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      {/* Title + category */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="text-xl flex-shrink-0">{CATEGORY_ICONS[r.category] ?? "🔨"}</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{r.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{r.category}</p>
          </div>
        </div>
      </td>

      {/* Tenant + unit */}
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {initials(r.tenant)}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{r.tenant}</p>
            <p className="text-xs text-gray-400">{r.unit} · {r.property}</p>
          </div>
        </div>
      </td>

      {/* Priority */}
      <td className="px-6 py-4 whitespace-nowrap">
        <PriorityBadge priority={r.priority} />
      </td>

      {/* Status */}
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={r.status} />
      </td>

      {/* Worker */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {r.worker ?? <span className="italic text-gray-400 dark:text-gray-600">Unassigned</span>}
      </td>

      {/* Reported */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {daysAgo(r.reportedOn)}
      </td>

      {/* Action */}
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onView(r)}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
        >
          View
        </button>
      </td>
    </tr>
  );
}

// ─── Board Card ───────────────────────────────────────────────────────────────
function BoardCard({ r, onView }) {
  return (
    <div
      onClick={() => onView(r)}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xl">{CATEGORY_ICONS[r.category] ?? "🔨"}</span>
        <PriorityBadge priority={r.priority} />
      </div>

      <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug mb-1">
        {r.title}
      </p>
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-3 line-clamp-2">
        {r.description}
      </p>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
          {initials(r.tenant)}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">{r.tenant}</p>
          <p className="text-xs text-gray-400 truncate">{r.unit}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-700 pt-3">
        <span>{r.worker ? `👷 ${r.worker}` : "Unassigned"}</span>
        <span>{daysAgo(r.reportedOn)}</span>
      </div>
    </div>
  );
}

// ─── Board Column ─────────────────────────────────────────────────────────────
function BoardColumn({ status, requests, onView }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg?.dot}`} />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{status}</h3>
        <span className="ml-auto text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {requests.length}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {requests.length === 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center text-xs text-gray-400 dark:text-gray-600">
            No requests
          </div>
        )}
        {requests.map(r => <BoardCard key={r.id} r={r} onView={onView} />)}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Maintenance() {
  useDocumentTitle("Maintenance");

  const [filter, setFilter]     = useState("All");
  const [search, setSearch]     = useState("");
  const [sort, setSort]         = useState("newest");
  const [view, setView]         = useState("list");  // "list" | "board"
  const [selected, setSelected] = useState(null);    // for detail modal
  const [propertyFilter, setPropertyFilter] = useState("All");

  const properties = ["All", ...new Set(REQUESTS.map(r => r.property))];

  // ── Filter + sort ──────────────────────────────────────────────────────────
  const filtered = REQUESTS
    .filter(r => {
      const matchStatus   = filter === "All" || r.status === filter;
      const matchProperty = propertyFilter === "All" || r.property === propertyFilter;
      const q             = search.toLowerCase();
      const matchSearch   = !q || [r.title, r.tenant, r.unit, r.property, r.category, r.worker ?? ""]
        .some(s => s.toLowerCase().includes(q));
      return matchStatus && matchProperty && matchSearch;
    })
    .sort((a, b) => {
      if (sort === "newest")   return new Date(b.reportedOn) - new Date(a.reportedOn);
      if (sort === "oldest")   return new Date(a.reportedOn) - new Date(b.reportedOn);
      if (sort === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      return 0;
    });

  // ── Stats ──────────────────────────────────────────────────────────────────
  const needsRepair = REQUESTS.filter(r => r.status === "Needs Repair").length;
  const inProgress  = REQUESTS.filter(r => r.status === "In Progress").length;
  const completed   = REQUESTS.filter(r => r.status === "Completed").length;
  const urgent      = REQUESTS.filter(r => r.priority === "Urgent" && r.status !== "Completed").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* Detail modal */}
      {selected && <DetailModal request={selected} onClose={() => setSelected(null)} />}

      <div className="px-4 pt-6 max-w-screen-xl mx-auto pb-12">

        {/* ── Page header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              All properties · {REQUESTS.length} total requests
            </p>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            {VIEWS.map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize
                  ${view === v
                    ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"}`}
              >
                {v === "list" ? (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    List
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    Board
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
          <StatCard label="Needs Repair" value={needsRepair} sub="Awaiting assignment" color="bg-red-100 dark:bg-red-900/30"   icon="🔴" />
          <StatCard label="In Progress"  value={inProgress}  sub="Worker assigned"    color="bg-yellow-100 dark:bg-yellow-900/30" icon="🟡" />
          <StatCard label="Completed"    value={completed}   sub="Resolved this month" color="bg-green-100 dark:bg-green-900/30"  icon="🟢" />
          <StatCard label="Urgent Open"  value={urgent}      sub="Require immediate action" color="bg-orange-100 dark:bg-orange-900/30" icon="⚠️" />
        </div>

        {/* ── Toolbar ── */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">

            {/* Status filters */}
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
                      {REQUESTS.filter(r => r.status === f).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
              {/* Property filter */}
              <select
                value={propertyFilter}
                onChange={e => setPropertyFilter(e.target.value)}
                className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {properties.map(p => (
                  <option key={p} value={p}>{p === "All" ? "All Properties" : p}</option>
                ))}
              </select>

              {/* Sort */}
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {/* Search */}
              <div className="relative">
                <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 105 11a6 6 0 0012 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-44"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── BOARD VIEW ── */}
        {view === "board" && (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {["Needs Repair", "In Progress", "Completed"].map(status => (
              <BoardColumn
                key={status}
                status={status}
                requests={filtered.filter(r => r.status === status)}
                onView={setSelected}
              />
            ))}
          </div>
        )}

        {/* ── LIST VIEW ── */}
        {view === "list" && (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Issue</th>
                    <th className="px-6 py-3">Tenant / Unit</th>
                    <th className="px-6 py-3">Priority</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Assigned Worker</th>
                    <th className="px-6 py-3">Reported</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                        No maintenance requests match your filters.
                      </td>
                    </tr>
                  )}
                  {filtered.map(r => (
                    <ListRow key={r.id} r={r} onView={setSelected} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing{" "}
                <span className="font-medium text-gray-900 dark:text-white">{filtered.length}</span>
                {" "}of{" "}
                <span className="font-medium text-gray-900 dark:text-white">{REQUESTS.length}</span>
                {" "}requests
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
