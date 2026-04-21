/* eslint-disable no-unused-vars */
// LANDLORD DASHBOARD PAGE
// AUTHOR: SIMAMKELE WEKEZA
// IF YOU DO NOT UNDERSTAND THIS CODE, PLEASE ASK ME TO EXPLAIN AND DON'T ASSUME OTHERWISE.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Coins,
  CheckCircle,
  Clock,
  AlertTriangle,
  Building2,
  Wrench,
  ClipboardList,
  Users,
  UserPlus,
  Home,
  UserCog,
  MessageSquare,
  FolderArchive,
  FileBarChart,
  TrendingUp,
  ChevronRight,
  Bell,
  Circle,
} from "lucide-react";
import useDocumentTitle from "../../hooks/useDocumentTitle";

// MOCK DATA 
const LANDLORD = { name: "Simamkele Wekeza" };

const STATS = {
  totalExpected: 44800,
  totalCollected: 32500,
  pendingApproval: 2,
  lateOrOverdue: 3,
  totalUnits: 12,
  occupiedUnits: 11,
  vacantUnits: 1,
  openMaintenance: 4,
  openComplaints: 2,
  tenantsAtRisk: 1,
};

const RECENT_PAYMENTS = [
  { id: 2, tenant: "Lerato Mokoena", unit: "Unit 2B", property: "Hillbrow Heights", amount: 5800, status: "Pending Approval", paidOn: "2026-04-03" },
  { id: 6, tenant: "Priya Naidoo", unit: "Unit 2A", property: "Yeoville Corner", amount: 6800, status: "Pending Approval", paidOn: "2026-04-02" },
  { id: 1, tenant: "Sipho Dlamini", unit: "Unit 4A", property: "Hillbrow Heights", amount: 6500, status: "Paid", paidOn: "2026-04-01" },
  { id: 4, tenant: "Nomsa Khumalo", unit: "Unit 3A", property: "Berea Flats", amount: 6000, status: "Paid", paidOn: "2026-03-30" },
  { id: 3, tenant: "Ahmed Patel", unit: "Unit 1C", property: "Berea Flats", amount: 7200, status: "Late", paidOn: null },
];

const OPEN_MAINTENANCE = [
  { id: 1, title: "Burst pipe under kitchen sink", tenant: "Sipho Dlamini", unit: "Unit 4A", priority: "Urgent", status: "In Progress", daysAgo: 3 },
  { id: 2, title: "Broken bedroom window latch", tenant: "Lerato Mokoena", unit: "Unit 2B", priority: "Medium", status: "Needs Repair", daysAgo: 5 },
  { id: 4, title: "Cracked ceiling in lounge", tenant: "Nomsa Khumalo", unit: "Unit 3A", priority: "High", status: "Needs Repair", daysAgo: 1 },
  { id: 6, title: "Damp patch on bedroom wall", tenant: "Kabelo Sithole", unit: "Unit 6B", priority: "High", status: "Needs Repair", daysAgo: 0 },
];

const OPEN_COMPLAINTS = [
  { id: 1, from: "Sipho Dlamini", unit: "Unit 4A", about: "Noise disturbance from Unit 5D after midnight", filed: "2026-04-11" },
  { id: 2, from: "Lerato Mokoena", unit: "Unit 2B", about: "Neighbour playing loud music on weekday mornings", filed: "2026-04-10" },
];

const PROPERTIES = [
  { name: "Hillbrow Heights", units: 6, occupied: 6, collected: 14500, expected: 14500 },
  { name: "Berea Flats", units: 4, occupied: 4, collected: 10300, expected: 17900 },
  { name: "Yeoville Corner", units: 2, occupied: 1, collected: 7700, expected: 12300 },
];

// COLOUR MAPS FOR STATUS BADGES
const STATUS_STYLES = {
  "Paid": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
  "Pending Approval": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
  "Late": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
  "Collections": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800",
};

const MAINTENANCE_STATUS_STYLES = {
  "Needs Repair": "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800",
  "In Progress": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800",
  "Completed": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800",
};

const PRIORITY_STYLES = {
  "Urgent": "bg-red-500 text-white",
  "High": "bg-orange-400 text-white",
  "Medium": "bg-yellow-400 text-gray-900",
  "Low": "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white",
};

// ICON MAP FOR QUICK ACTIONS
const QUICK_ACTION_ICONS = {
  "Add Tenant": UserPlus,
  "Add Unit": Home,
  "Register Caretaker": UserCog,
  "Send Message": MessageSquare,
  "Collections": FolderArchive,
  "Export Report": FileBarChart,
};

// HELPER FUNCTIONS
function fmt(n) { return `R ${Number(n).toLocaleString("en-ZA")}`; }

function initials(name = "") {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function pct(a, b) {
  if (!b) return 0;
  return Math.round((a / b) * 100);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

// SUB COMPONENTS

// STATUS BADGE WITH COLOUR VARIANTS
function StatusBadge({ status, styleMap }) {
  const map = styleMap ?? STATUS_STYLES;
  return (
    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-md whitespace-nowrap ${map[status] ?? "bg-gray-100 text-gray-600"}`}>
      {status}
    </span>
  );
}

// BIG STAT CARD COMPONENT WITH OPTIONAL ACCENT AND ALERT
function StatCard({ label, value, sub, icon: Icon, accent, onClick, alert }) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-5 bg-white dark:bg-gray-800 border rounded-lg shadow-sm
        transition-all hover:shadow-md hover:-translate-y-0.5
        ${alert ? "border-red-300 dark:border-red-700" : "border-gray-200 dark:border-gray-700"}
        ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{label}</p>
          <p className={`text-2xl font-bold truncate ${accent ?? "text-gray-900 dark:text-white"}`}>{value}</p>
          {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
          ${alert ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
          <Icon size={20} />
        </div>
      </div>
      {alert && (
        <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
          <AlertTriangle size={14} className="flex-shrink-0" />
          {alert}
        </div>
      )}
    </button>
  );
}

// SECTION CARD WRAPPER WITH OPTIONAL HEADER AND ACTION
function Card({ title, actionLabel, onAction, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
      {(title || actionLabel) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          {title && <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>}
          {actionLabel && (
            <button
              onClick={onAction}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              {actionLabel}
              <ChevronRight size={14} />
            </button>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

// COLLECTION PROGRESS BAR COMPONENT FOR EACH PROPERTY
function CollectionBar({ property }) {
  const collected = pct(property.collected, property.expected);
  const isShort = collected < 100;
  return (
    <div className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">{property.name}</span>
          <span className="ml-2 text-xs text-gray-400">{property.occupied}/{property.units} units</span>
        </div>
        <div className="text-right">
          <span className={`text-sm font-semibold ${isShort ? "text-red-500" : "text-green-500"}`}>
            {fmt(property.collected)}
          </span>
          <span className="text-xs text-gray-400"> / {fmt(property.expected)}</span>
        </div>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${isShort ? "bg-red-500" : "bg-green-500"}`}
          style={{ width: `${Math.min(collected, 100)}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
        <TrendingUp size={12} />
        {collected}% collected
      </p>
    </div>
  );
}

// MAIN PAGE COMPONENT
export default function Dashboard() {
  useDocumentTitle("Dashboard");
  const navigate = useNavigate();

  const collectionRate = pct(STATS.totalCollected, STATS.totalExpected);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-12">

        {/*PAGE HEADER */}
        <div className="flex items-start justify-between mb-7">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{greeting()},</p>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-0.5 flex items-center gap-2">
              {LANDLORD.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              April 2026 — Here's what's happening across your properties.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/landlord/payments")}
              className="hidden sm:inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <FileBarChart size={16} />
              View Payments
            </button>
          </div>
        </div>

        {/* ALERT STRIP ONLY IF PENDING OR LATE PAYMENTS EXIST */}
        {(STATS.pendingApproval > 0 || STATS.lateOrOverdue > 0) && (
          <div className="flex flex-wrap gap-3 mb-6">
            {STATS.pendingApproval > 0 && (
              <button
                onClick={() => navigate("/landlord/payments")}
                className="flex items-center gap-2.5 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg px-4 py-2.5 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
              >
                <Clock size={16} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  {STATS.pendingApproval} payment{STATS.pendingApproval !== 1 ? "s" : ""} awaiting your approval
                </span>
                <ChevronRight size={14} className="text-yellow-600 dark:text-yellow-400" />
              </button>
            )}
            {STATS.lateOrOverdue > 0 && (
              <button
                onClick={() => navigate("/landlord/payments")}
                className="flex items-center gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg px-4 py-2.5 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <AlertTriangle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0" />
                <span className="text-sm font-medium text-red-800 dark:text-red-300">
                  {STATS.lateOrOverdue} tenant{STATS.lateOrOverdue !== 1 ? "s" : ""} with overdue rent
                </span>
                <ChevronRight size={14} className="text-red-600 dark:text-red-400" />
              </button>
            )}
          </div>
        )}

        {/* STAT CARDS - FINANCIALS*/}
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">
          Financial — April 2026
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <StatCard
            label="Total Expected"
            value={fmt(STATS.totalExpected)}
            sub={`${STATS.totalUnits} units billed`}
            icon={Coins}
            onClick={() => navigate("/landlord/payments")}
          />
          <StatCard
            label="Collected"
            value={fmt(STATS.totalCollected)}
            sub={`${collectionRate}% collection rate`}
            icon={CheckCircle}
            accent="text-green-500"
            onClick={() => navigate("/landlord/payments")}
          />
          <StatCard
            label="Pending Approval"
            value={STATS.pendingApproval}
            sub="Proof uploaded, review needed"
            icon={Clock}
            accent="text-yellow-500"
            alert={STATS.pendingApproval > 0 ? "Action required" : null}
            onClick={() => navigate("/landlord/payments")}
          />
          <StatCard
            label="Late / Overdue"
            value={STATS.lateOrOverdue}
            sub="May be eligible for collections"
            icon={AlertTriangle}
            accent="text-red-500"
            alert={STATS.lateOrOverdue > 0 ? "Requires attention" : null}
            onClick={() => navigate("/landlord/payments")}
          />
        </div>

        {/* STAT CARDS - OPERATIONS */}
        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 mt-5">
          Operations
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Units Occupied"
            value={`${STATS.occupiedUnits} / ${STATS.totalUnits}`}
            sub={STATS.vacantUnits > 0 ? `${STATS.vacantUnits} vacant` : "Fully occupied"}
            icon={Building2}
            onClick={() => navigate("/landlord/units")}
          />
          <StatCard
            label="Open Maintenance"
            value={STATS.openMaintenance}
            sub="Across all properties"
            icon={Wrench}
            accent={STATS.openMaintenance > 0 ? "text-yellow-500" : "text-gray-900 dark:text-white"}
            alert={STATS.openMaintenance > 2 ? "Some urgent" : null}
            onClick={() => navigate("/landlord/maintenance")}
          />
          <StatCard
            label="Open Complaints"
            value={STATS.openComplaints}
            sub="Tenant disputes filed"
            icon={ClipboardList}
            accent={STATS.openComplaints > 0 ? "text-orange-500" : "text-gray-900 dark:text-white"}
            onClick={() => navigate("/landlord/complaints")}
          />
          <StatCard
            label="High Risk Tenants"
            value={STATS.tenantsAtRisk}
            sub="Based on payment history"
            icon={Users}
            accent={STATS.tenantsAtRisk > 0 ? "text-red-500" : "text-green-500"}
            alert={STATS.tenantsAtRisk > 0 ? "Review reliability scores" : null}
            onClick={() => navigate("/landlord/tenants")}
          />
        </div>

        {/* MAIN CONTENT GRID */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* LEFT COLUMN - 2/3 WIDTH */}
          <div className="xl:col-span-2 space-y-6">

            {/* RECENT PAYMENTS */}
            <Card
              title="Recent Payments"
              actionLabel="View all"
              onAction={() => navigate("/landlord/payments")}
            >
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {RECENT_PAYMENTS.map(p => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    {/* AVATAR + NAME */}
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {initials(p.tenant)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{p.tenant}</p>
                        <p className="text-xs text-gray-400 truncate">{p.unit} · {p.property}</p>
                      </div>
                    </div>
                    {/* AMOUNT */}
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mx-4 flex-shrink-0">
                      {fmt(p.amount)}
                    </p>
                    {/* STATUS + ACTION */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <StatusBadge status={p.status} />
                      {p.status === "Pending Approval" && (
                        <button
                          onClick={() => navigate("/landlord/payments")}
                          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* OPEN MAINTENANCE REQUESTS */}
            <Card
              title="Open Maintenance Requests"
              actionLabel="View all"
              onAction={() => navigate("/landlord/maintenance")}
            >
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {OPEN_MAINTENANCE.map(m => (
                  <div key={m.id} className="flex items-start justify-between gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      {/* PRIORITY DOT */}
                      <div className="mt-1.5 flex-shrink-0">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded ${PRIORITY_STYLES[m.priority]}`}>
                          {m.priority}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">{m.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {m.tenant} · {m.unit} · {m.daysAgo === 0 ? "Today" : m.daysAgo === 1 ? "Yesterday" : `${m.daysAgo}d ago`}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={m.status} styleMap={MAINTENANCE_STATUS_STYLES} />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* RIGHT COLUMN - 1/3 WIDTH */}
          <div className="space-y-6">

            {/* COLLECTION BY PROPERTY */}
            <Card
              title="Collection by Property"
              actionLabel="Full report"
              onAction={() => navigate("/landlord/payments")}
            >
              <div className="px-5 py-4">
                {PROPERTIES.map(prop => (
                  <CollectionBar key={prop.name} property={prop} />
                ))}
              </div>
            </Card>

            {/* OPEN COMPLAINTS */}
            <Card
              title="Open Complaints"
              actionLabel="View all"
              onAction={() => navigate("/landlord/complaints")}
            >
              {OPEN_COMPLAINTS.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <CheckCircle size={32} className="mx-auto mb-2 text-green-500" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No open complaints</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {OPEN_COMPLAINTS.map(c => (
                    <div key={c.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {initials(c.from)}
                        </div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{c.from}</p>
                        <span className="text-xs text-gray-400">{c.unit}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-2 pl-8">
                        {c.about}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 pl-8">{c.filed}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* QUICK LINKS */}
            <Card title="Quick Actions">
              <div className="p-4 grid grid-cols-2 gap-2">
                {[
                  { label: "Add Tenant", path: "/landlord/tenants" },
                  { label: "Add Unit", path: "/landlord/units" },
                  { label: "Register Caretaker", path: "/landlord/caretakers" },
                  { label: "Send Message", path: "/landlord/messages" },
                  { label: "Collections", path: "/landlord/collections" },
                  { label: "Export Report", path: "/landlord/payments" },
                ].map(action => {
                  const IconComponent = QUICK_ACTION_ICONS[action.label] || Circle;
                  return (
                    <button
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-600 transition-colors"
                    >
                      <IconComponent size={22} className="text-gray-600 dark:text-gray-400" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">
                        {action.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}