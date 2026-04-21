/* eslint-disable no-unused-vars */
// LANDLORD MAINTENANCE DASHBOARD
// AUTHOR: SIMAMKELE WEKEZA
// IF YOU DO NOT UNDERSTAND THIS CODE, PLEASE ASK ME TO EXPLAIN AND DON'T ASSUME OTHERWISE.
import { useState } from "react";
import { 
  Wrench, 
  Zap, 
  Building, 
  DoorOpen, 
  CookingPot,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  LayoutList,
  Kanban,
  Search,
  User,
  Calendar,
  MapPin,
  Home,
  UserCircle
} from "lucide-react";
import useDocumentTitle from "../../../hooks/useDocumentTitle";

// MOCK DATA
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

// STATUS CONFIGURATION FOR BADGES AND ICONS
const STATUS_CONFIG = {
  "Needs Repair": {
    badge: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
    dot: "bg-red-500",
    icon: AlertCircle,
    iconColor: "text-red-500"
  },
  "In Progress": {
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
    dot: "bg-yellow-400",
    icon: Clock,
    iconColor: "text-yellow-500"
  },
  "Completed": {
    badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
    dot: "bg-green-500",
    icon: CheckCircle,
    iconColor: "text-green-500"
  },
};

const PRIORITY_CONFIG = {
  "Urgent": "bg-red-500 text-white",
  "High": "bg-orange-400 text-white",
  "Medium": "bg-yellow-400 text-gray-900",
  "Low": "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300",
};

// CATEGORY ICONS
const CATEGORY_ICONS = {
  "Plumbing": Wrench,
  "Electrical / Geyser": Zap,
  "Structural": Building,
  "Windows & Doors": DoorOpen,
  "Appliances": CookingPot,
};

const FILTERS = ["All", "Needs Repair", "In Progress", "Completed"];
const VIEWS = ["list", "board"];
const SORT_OPTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "priority", label: "Priority" },
];

const PRIORITY_ORDER = { Urgent: 0, High: 1, Medium: 2, Low: 3 };

// HELPER FUNCTIONS
function initials(name = "") {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function daysAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return `${diff}d ago`;
}

// THESE ARE SUB-COMPONENTS LIKE STAT CARD, STATUS BADGE, PRIORITY BADGE, DETAIL MODAL, LIST ROW, BOARD CARD, BOARD COLUMN

// STAT CARD COMPONENT
function StatCard({ label, value, sub, color, icon: Icon }) {
  return (
    <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm dark:border-gray-700 sm:p-6 dark:bg-gray-800 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        {sub && <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

// STATUS BADGE COMPONENT
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? {};
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-md ${cfg.badge}`}>
      {Icon && <Icon size={12} className={cfg.iconColor} />}
      {status}
    </span>
  );
}

// PRIORITY BADGE COMPONENT
function PriorityBadge({ priority }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${PRIORITY_CONFIG[priority] ?? ""}`}>
      {priority}
    </span>
  );
}

// DETAIL MODAL COMPONENT
function DetailModal({ request, onClose }) {
  const CategoryIcon = CATEGORY_ICONS[request.category] || Wrench;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <CategoryIcon size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
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
            <XCircle size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* BADGES ROW */}
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>

          {/* DESCRIPTION */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Description</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{request.description}</p>
          </div>

          {/* DETAILS GRID */}
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
            {[
              ["Tenant", request.tenant],
              ["Unit", `${request.unit} · ${request.property}`],
              ["Reported", `${request.reportedOn} (${daysAgo(request.reportedOn)})`],
              ["Last Updated", `${request.updatedOn} (${daysAgo(request.updatedOn)})`],
              ["Assigned To", request.worker ?? "Not yet assigned"],
              ["Photo Uploaded", request.photo ? "✓ Yes" : "—"],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700/40 odd:bg-white odd:dark:bg-gray-800">
                <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white text-right ml-4">{val}</span>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <AlertCircle size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Maintenance tasks are managed by the caretaker. Status updates and worker assignments are handled in the Caretaker portal.
            </p>
          </div>
        </div>

        {/* FOOTER */}
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

// LIST ROW COMPONENT
function ListRow({ r, onView }) {
  const CategoryIcon = CATEGORY_ICONS[r.category] || Wrench;
  
  return (
    <tr className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
      {/* TITLE + CATEGORY */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
            <CategoryIcon size={14} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white leading-snug">{r.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">{r.category}</p>
          </div>
        </div>
      </td>

      {/* TENANT + UNIT */}
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

      {/* PRIORITY */}
      <td className="px-6 py-4 whitespace-nowrap">
        <PriorityBadge priority={r.priority} />
      </td>

      {/* STATUS */}
      <td className="px-6 py-4 whitespace-nowrap">
        <StatusBadge status={r.status} />
      </td>

      {/* WORKER */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        {r.worker ?? <span className="italic text-gray-400 dark:text-gray-600">Unassigned</span>}
      </td>

      {/* REPORTED */}
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          {daysAgo(r.reportedOn)}
        </div>
      </td>

      {/* ACTION */}
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          onClick={() => onView(r)}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          View
          <ChevronRight size={12} />
        </button>
      </td>
    </tr>
  );
}

// BOARD CARD COMPONENT
function BoardCard({ r, onView }) {
  const CategoryIcon = CATEGORY_ICONS[r.category] || Wrench;
  
  return (
    <div
      onClick={() => onView(r)}
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <CategoryIcon size={14} className="text-blue-600 dark:text-blue-400" />
        </div>
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
        <span className="flex items-center gap-1">
          <User size={12} />
          {r.worker ? r.worker : "Unassigned"}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {daysAgo(r.reportedOn)}
        </span>
      </div>
    </div>
  );
}

// BOARD COLUMN COMPONENT
function BoardColumn({ status, requests, onView }) {
  const cfg = STATUS_CONFIG[status];
  const Icon = cfg?.icon || AlertCircle;
  
  return (
    <div className="flex flex-col min-w-[280px] flex-1">
      <div className="flex items-center gap-2 mb-3 px-1">
        <Icon size={16} className={cfg?.iconColor} />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{status}</h3>
        <span className="ml-auto text-xs font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full">
          {requests.length}
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {requests.length === 0 && (
          <div className="bg-gray-50 dark:bg-gray-800/50 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 text-center text-xs text-gray-400 dark:text-gray-600">
            <div className="flex flex-col items-center gap-2">
              <CheckCircle size={24} className="opacity-50" />
              No requests
            </div>
          </div>
        )}
        {requests.map(r => <BoardCard key={r.id} r={r} onView={onView} />)}
      </div>
    </div>
  );
}

// MAIN COMPONENT
export default function Maintenance() {
   console.log("Maintenance component rendering");
  useDocumentTitle("Maintenance");

  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(null);
  const [propertyFilter, setPropertyFilter] = useState("All");

  const properties = ["All", ...new Set(REQUESTS.map(r => r.property))];

  // FILTER AND SORT REQUESTS, REQUESTS ARE ALWAYS FILTERED
  const filtered = REQUESTS
    .filter(r => {
      const matchStatus = filter === "All" || r.status === filter;
      const matchProperty = propertyFilter === "All" || r.property === propertyFilter;
      const q = search.toLowerCase();
      const matchSearch = !q || [r.title, r.tenant, r.unit, r.property, r.category, r.worker ?? ""]
        .some(s => s.toLowerCase().includes(q));
      return matchStatus && matchProperty && matchSearch;
    })
    .sort((a, b) => {
      if (sort === "newest") return new Date(b.reportedOn) - new Date(a.reportedOn);
      if (sort === "oldest") return new Date(a.reportedOn) - new Date(b.reportedOn);
      if (sort === "priority") return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      return 0;
    });

  // STATISTICS FOR TOP CARDS
  const needsRepair = REQUESTS.filter(r => r.status === "Needs Repair").length;
  const inProgress = REQUESTS.filter(r => r.status === "In Progress").length;
  const completed = REQUESTS.filter(r => r.status === "Completed").length;
  const urgent = REQUESTS.filter(r => r.priority === "Urgent" && r.status !== "Completed").length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* DETAIL MODAL */}
      {selected && <DetailModal request={selected} onClose={() => setSelected(null)} />}

      <div className="px-4 pt-6 max-w-screen-xl mx-auto pb-12">
        {/* PAGE HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              All properties · {REQUESTS.length} total requests
            </p>
          </div>

          {/* VIEW TOGGLE */}
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
                <span className="flex items-center gap-1.5">
                  {v === "list" ? <LayoutList size={16} /> : <Kanban size={16} />}
                  {v}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* STATISTICS CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
          <StatCard label="Needs Repair" value={needsRepair} sub="Awaiting assignment" color="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" icon={AlertCircle} />
          <StatCard label="In Progress" value={inProgress} sub="Worker assigned" color="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400" icon={Clock} />
          <StatCard label="Completed" value={completed} sub="Resolved this month" color="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400" icon={CheckCircle} />
          <StatCard label="Urgent Open" value={urgent} sub="Require immediate action" color="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" icon={AlertCircle} />
        </div>

        {/* FILTER AND SORT TOOLBAR */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
            {/* STATUS FILTERS */}
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
              {/* PROPERTY FILTER */}
              <select
                value={propertyFilter}
                onChange={e => setPropertyFilter(e.target.value)}
                className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {properties.map(p => (
                  <option key={p} value={p}>{p === "All" ? "All Properties" : p}</option>
                ))}
              </select>

              {/* SORT */}
              <select
                value={sort}
                onChange={e => setSort(e.target.value)}
                className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>

              {/* SEARCH */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                />
              </div>
            </div>
          </div>
        </div>

        {/* BOARD VIEW */}
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

        {/* LIST VIEW */}
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
                        <div className="flex flex-col items-center gap-2">
                          <Search size={32} className="opacity-50" />
                          No maintenance requests match your filters.
                        </div>
                      </td>
                    </tr>
                  )}
                  {filtered.map(r => (
                    <ListRow key={r.id} r={r} onView={setSelected} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* TABLE FOOTER */}
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