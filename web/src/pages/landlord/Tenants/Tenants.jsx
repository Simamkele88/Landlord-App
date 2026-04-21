/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/static-components */
// LANDLORD TENANTS PAGE, SHOWS A LIST OF TENANTS WITH THEIR DETAILS AND RELIABILITY SCORE, ALONG WITH A PROFILE MODAL AND ADD/EDIT FORM
// AUTHOR: SIMAMKELE WEKEZA
// IF YOU HAVE ANY QUESTIONS ABOUT THIS CODE, ASK ME.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle,
  AlertTriangle,
  Circle,
  Calendar,
  X,
  Edit,
  Trash2,
  Plus,
  Search,
  ChevronRight,
  Mail,
  Phone,
  Home,
  CreditCard,
  Clock,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";
import useDocumentTitle from "../../../hooks/useDocumentTitle";

// MOCK DATA
const INITIAL_TENANTS = [
  { id: 1, name: "Sipho Dlamini", email: "sipho@gmail.com", phone: "0821234567", unit: "Unit 4A", property: "Hillbrow Heights", rentAmount: 6500, frequency: "Monthly", leaseStart: "2025-01-01", leaseEnd: "2026-12-31", status: "Active", reliabilityScore: "Reliable", paymentHistory: { onTime: 14, late: 1, missed: 0 }, balance: 0 },
  { id: 2, name: "Lerato Mokoena", email: "lerato@gmail.com", phone: "0731234567", unit: "Unit 2B", property: "Hillbrow Heights", rentAmount: 5800, frequency: "Monthly", leaseStart: "2025-03-01", leaseEnd: "2026-02-28", status: "Active", reliabilityScore: "Reliable", paymentHistory: { onTime: 12, late: 1, missed: 0 }, balance: 0 },
  { id: 3, name: "Ahmed Patel", email: "ahmed@gmail.com", phone: "0611234567", unit: "Unit 1C", property: "Berea Flats", rentAmount: 7200, frequency: "Monthly", leaseStart: "2024-06-01", leaseEnd: "2026-05-31", status: "Active", reliabilityScore: "Moderate Risk", paymentHistory: { onTime: 8, late: 5, missed: 1 }, balance: 7200 },
  { id: 4, name: "Nomsa Khumalo", email: "nomsa@gmail.com", phone: "0841234567", unit: "Unit 3A", property: "Berea Flats", rentAmount: 6000, frequency: "Monthly", leaseStart: "2025-06-01", leaseEnd: "2026-05-31", status: "Active", reliabilityScore: "Reliable", paymentHistory: { onTime: 10, late: 0, missed: 0 }, balance: 0 },
  { id: 5, name: "Thabo Nkosi", email: "thabo@gmail.com", phone: "0761234567", unit: "Unit 5D", property: "Yeoville Corner", rentAmount: 5500, frequency: "Monthly", leaseStart: "2024-09-01", leaseEnd: "2025-08-31", status: "Active", reliabilityScore: "High Risk", paymentHistory: { onTime: 4, late: 5, missed: 3 }, balance: 16500 },
  { id: 6, name: "Priya Naidoo", email: "priya@gmail.com", phone: "0791234567", unit: "Unit 2A", property: "Yeoville Corner", rentAmount: 6800, frequency: "Monthly", leaseStart: "2025-07-01", leaseEnd: "2026-06-30", status: "Active", reliabilityScore: "Reliable", paymentHistory: { onTime: 9, late: 0, missed: 0 }, balance: 0 },
  { id: 7, name: "Kabelo Sithole", email: "kabelo@gmail.com", phone: "0851234567", unit: "Unit 6B", property: "Hillbrow Heights", rentAmount: 5200, frequency: "Monthly", leaseStart: "2025-02-01", leaseEnd: "2026-01-31", status: "Active", reliabilityScore: "Reliable", paymentHistory: { onTime: 13, late: 1, missed: 0 }, balance: 0 },
  { id: 8, name: "Zanele Moyo", email: "zanele@gmail.com", phone: "0721234567", unit: "Unit 1A", property: "Berea Flats", rentAmount: 7500, frequency: "Monthly", leaseStart: "2024-11-01", leaseEnd: "2026-10-31", status: "Active", reliabilityScore: "Moderate Risk", paymentHistory: { onTime: 6, late: 4, missed: 1 }, balance: 7500 },
];

// AVAILABLE OR VACANT UNITS THAT CAN BE ASSIGNED TO NEW TENANTS IN THE ADD/EDIT FORM
const VACANT_UNITS = [
  { unit: "Unit 3B", property: "Hillbrow Heights" },
  { unit: "Unit 4C", property: "Berea Flats" },
];

const PROPERTIES = ["Hillbrow Heights", "Berea Flats", "Yeoville Corner"];
const FREQUENCIES = ["Monthly", "Weekly"];
const FILTERS = ["All", "Reliable", "Moderate Risk", "High Risk"];

// CONFIG FOR RELIABILITY SCORE BADGES AND COLORS
const SCORE_CONFIG = {
  "Reliable": { color: "text-green-600 dark:text-green-400", bg: "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700", dot: "bg-green-500", icon: CheckCircle },
  "Moderate Risk": { color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700", dot: "bg-yellow-400", icon: AlertTriangle },
  "High Risk": { color: "text-red-600 dark:text-red-400", bg: "bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700", dot: "bg-red-500", icon: AlertCircle },
};

// HELPER FUNCTIONS FOR FORMATTING AND CALCULATIONS
function fmt(n) { return `R ${Number(n).toLocaleString("en-ZA")}`; }
function initials(name = "") {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}
function leaseExpiresSoon(endDate) {
  const days = Math.ceil((new Date(endDate) - Date.now()) / 86400000);
  return days >= 0 && days <= 60;
}
function leaseExpired(endDate) {
  return new Date(endDate) < new Date();
}

// SUB-COMPONENTS FOR TENANTS PAGE

// SCOREBADGE SUBCOMPONENT TO DISPLAY THE RELIABILITY SCORE WITH APPROPRIATE COLORS
function ScoreBadge({ score }) {
  const cfg = SCORE_CONFIG[score] ?? SCORE_CONFIG["Reliable"];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
      <Icon size={12} />
      {score}
    </span>
  );
}

// SCOREBAR SUBCOMPONENT TO DISPLAY THE PAYMENT HISTORY AS A PROGRESS BAR
function ScoreBar({ label, value, max, color }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-500 dark:text-gray-400">{label}</span>
        <span className="font-semibold text-gray-900 dark:text-white">{value}</span>
      </div>
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min((value / max) * 100, 100)}%` }} />
      </div>
    </div>
  );
}

// TENANT PROFILE MODAL
function ProfileModal({ tenant, onClose, onEdit }) {
  const cfg = SCORE_CONFIG[tenant.reliabilityScore];
  const total = tenant.paymentHistory.onTime + tenant.paymentHistory.late + tenant.paymentHistory.missed;
  const expiring = leaseExpiresSoon(tenant.leaseEnd);
  const expired = leaseExpired(tenant.leaseEnd);
  const ScoreIcon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold flex-shrink-0">
              {initials(tenant.name)}
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-tight">{tenant.name}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{tenant.unit} · {tenant.property}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* RELIABILITY SCORE */}
          <div className={`rounded-xl p-4 ${cfg.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-bold ${cfg.color}`}>Reliability Score: {tenant.reliabilityScore}</p>
              <ScoreBadge score={tenant.reliabilityScore} />
            </div>
            <div className="space-y-2.5">
              <ScoreBar label="On-time payments" value={tenant.paymentHistory.onTime} max={total} color="bg-green-500" />
              <ScoreBar label="Late payments" value={tenant.paymentHistory.late} max={total} color="bg-yellow-400" />
              <ScoreBar label="Missed payments" value={tenant.paymentHistory.missed} max={total} color="bg-red-500" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{total} total payment periods tracked</p>
          </div>

          {/* LEASE EXPIRY WARNING */}
          {(expiring || expired) && (
            <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm font-medium
              ${expired
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-400"
                : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400"
              }`}>
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              {expired ? "Lease has expired — renewal required" : `Lease expires on ${tenant.leaseEnd} — expiring soon`}
            </div>
          )}

          {/* BALANCE WARNING */}
          {tenant.balance > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-sm font-medium text-red-700 dark:text-red-400">
              <CreditCard size={16} className="flex-shrink-0 mt-0.5" />
              Outstanding balance: {fmt(tenant.balance)}
            </div>
          )}

          {/* TENANT DETAILS */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Tenant Info</p>
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
              {[
                ["Email", tenant.email, Mail],
                ["Phone", tenant.phone, Phone],
                ["Unit", `${tenant.unit} · ${tenant.property}`, Home],
                ["Rent", `${fmt(tenant.rentAmount)} / ${tenant.frequency}`, CreditCard],
                ["Lease Start", tenant.leaseStart, Calendar],
                ["Lease End", tenant.leaseEnd, Calendar],
              ].map(([label, val, Icon ]) => (
                <div key={label} className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700/40 odd:bg-white odd:dark:bg-gray-800">
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Icon size={14} />
                    {label}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white text-right ml-4">{val}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 pb-6 flex gap-3 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            onClick={() => { onClose(); onEdit(tenant); }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Edit size={14} />
            Edit Tenant
          </button>
        </div>
      </div>
    </div>
  );
}

// ADD / EDIT TENANT FORM MODAL, REUSED FOR BOTH ADDING NEW TENANTS AND EDITING EXISTING ONES
const EMPTY_FORM = {
  name: "", email: "", phone: "",
  unit: "", property: "",
  rentAmount: "", frequency: "Monthly",
  leaseStart: "", leaseEnd: "",
};

function TenantFormModal({ tenant, onClose, onSave }) {
  const isEdit = !!tenant;
  const [form, setForm] = useState(tenant ? {
    name: tenant.name, email: tenant.email, phone: tenant.phone,
    unit: tenant.unit, property: tenant.property,
    rentAmount: String(tenant.rentAmount), frequency: tenant.frequency,
    leaseStart: tenant.leaseStart, leaseEnd: tenant.leaseEnd,
  } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.unit.trim()) e.unit = "Required";
    if (!form.property.trim()) e.property = "Required";
    if (!form.rentAmount.trim()) e.rentAmount = "Required";
    if (!form.leaseStart) e.leaseStart = "Required";
    if (!form.leaseEnd) e.leaseEnd = "Required";
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => {
      onSave({
        ...form,
        rentAmount: Number(form.rentAmount),
        id: tenant?.id ?? Date.now(),
        status: "Active",
        reliabilityScore: tenant?.reliabilityScore ?? "Reliable",
        paymentHistory: tenant?.paymentHistory ?? { onTime: 0, late: 0, missed: 0 },
        balance: tenant?.balance ?? 0,
      });
      setLoading(false);
      onClose();
    }, 1000);
  }

  // ALL UNITS: OCCUPIED (CURRENT TENANT) + VACANT
  const allUnits = [
    ...VACANT_UNITS,
    ...(isEdit ? [{ unit: tenant.unit, property: tenant.property }] : []),
  ];

  // FIELD COMPONENT FOR REQUIRED FIELDS
  function Field({ label, error, children }) {
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          {label} {error && <span className="text-red-500 normal-case font-normal">— {error}</span>}
        </label>
        {children}
      </div>
    );
  }

  const inputCls = (key) =>
    `w-full text-sm rounded-lg px-3 py-2.5 border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
     placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
     ${errors[key] ? "border-red-400 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[92vh]">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEdit ? "Edit Tenant" : "Add New Tenant"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded">
            <X size={20} />
          </button>
        </div>

        {/* FORM */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Personal Info</p>

          <Field label="Full Name" error={errors.name}>
            <input className={inputCls("name")} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Sipho Dlamini" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" error={errors.email}>
              <input className={inputCls("email")} value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" type="email" />
            </Field>
            <Field label="Phone" error={errors.phone}>
              <input className={inputCls("phone")} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="0821234567" type="tel" />
            </Field>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Unit & Lease</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Unit" error={errors.unit}>
              <select className={inputCls("unit")} value={form.unit}
                onChange={e => {
                  const chosen = allUnits.find(u => u.unit === e.target.value);
                  set("unit", e.target.value);
                  if (chosen) set("property", chosen.property);
                }}>
                <option value="">Select unit</option>
                {allUnits.map(u => (
                  <option key={u.unit} value={u.unit}>{u.unit} — {u.property}</option>
                ))}
              </select>
            </Field>
            <Field label="Property" error={errors.property}>
              <select className={inputCls("property")} value={form.property} onChange={e => set("property", e.target.value)}>
                <option value="">Select property</option>
                {PROPERTIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Monthly Rent (R)" error={errors.rentAmount}>
              <input className={inputCls("rentAmount")} value={form.rentAmount} onChange={e => set("rentAmount", e.target.value)} placeholder="e.g. 5800" type="number" min="0" />
            </Field>
            <Field label="Frequency" error={errors.frequency}>
              <select className={inputCls("frequency")} value={form.frequency} onChange={e => set("frequency", e.target.value)}>
                {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Lease Start" error={errors.leaseStart}>
              <input className={inputCls("leaseStart")} value={form.leaseStart} onChange={e => set("leaseStart", e.target.value)} type="date" />
            </Field>
            <Field label="Lease End" error={errors.leaseEnd}>
              <input className={inputCls("leaseEnd")} value={form.leaseEnd} onChange={e => set("leaseEnd", e.target.value)} type="date" />
            </Field>
          </div>

          {/* INFO NOTE */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
            <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              The tenant will receive login credentials for the mobile app once their account is created. Credentials are tied to their email and phone number.
            </p>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 pb-6 flex gap-3 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">
          <button onClick={onClose} disabled={loading} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              <>
                <Edit size={14} />
                Save Changes
              </>
            ) : (
              <>
                <Plus size={14} />
                Add Tenant
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// DELETE CONFIRM MODAL
function DeleteModal({ tenant, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  function handleConfirm() {
    setLoading(true);
    setTimeout(() => { onConfirm(tenant.id); setLoading(false); onClose(); }, 800);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
            <Trash2 size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Remove Tenant</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">This cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Are you sure you want to remove <span className="font-semibold text-gray-900 dark:text-white">{tenant?.name}</span> from {tenant?.unit}? Their lease record and payment history will be archived.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Remove
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// MAIN TENANTS PAGE COMPONENT
export default function Tenants() {
  useDocumentTitle("Tenants");
  const navigate = useNavigate();

  const [tenants, setTenants] = useState(INITIAL_TENANTS);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [profileTenant, setProfileTenant] = useState(null);
  const [editTenant, setEditTenant] = useState(null);
  const [deleteTenant, setDeleteTenant] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  // DERIVED DATA
  const filtered = tenants.filter(t => {
    const matchScore = filter === "All" || t.reliabilityScore === filter;
    const q = search.toLowerCase();
    const matchSearch = !q || [t.name, t.email, t.phone, t.unit, t.property]
      .some(s => s.toLowerCase().includes(q));
    return matchScore && matchSearch;
  });

  const reliable = tenants.filter(t => t.reliabilityScore === "Reliable").length;
  const moderate = tenants.filter(t => t.reliabilityScore === "Moderate Risk").length;
  const highRisk = tenants.filter(t => t.reliabilityScore === "High Risk").length;
  const expiring = tenants.filter(t => leaseExpiresSoon(t.leaseEnd)).length;

  // HANDLERS FOR ADDING/EDITING/DELETING TENANTS
  function handleSave(data) {
    setTenants(prev => {
      const exists = prev.find(t => t.id === data.id);
      return exists ? prev.map(t => t.id === data.id ? data : t) : [...prev, data];
    });
  }

  function handleDelete(id) {
    setTenants(prev => prev.filter(t => t.id !== id));
  }

  // STATS CARD CONFIG
  const statCards = [
    { label: "Reliable", value: reliable, color: "text-green-500", bg: "bg-green-100 dark:bg-green-900/20", icon: CheckCircle },
    { label: "Moderate Risk", value: moderate, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/20", icon: AlertTriangle },
    { label: "High Risk", value: highRisk, color: "text-red-500", bg: "bg-red-100 dark:bg-red-900/20", icon: AlertCircle },
    { label: "Lease Expiring (60d)", value: expiring, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/20", icon: Clock },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* MODALS */}
      {profileTenant && (
        <ProfileModal
          tenant={profileTenant}
          onClose={() => setProfileTenant(null)}
          onEdit={(t) => { setEditTenant(t); }}
        />
      )}
      {(editTenant || showAdd) && (
        <TenantFormModal
          tenant={editTenant ?? null}
          onClose={() => { setEditTenant(null); setShowAdd(false); }}
          onSave={handleSave}
        />
      )}
      {deleteTenant && (
        <DeleteModal
          tenant={deleteTenant}
          onClose={() => setDeleteTenant(null)}
          onConfirm={handleDelete}
        />
      )}

      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-12">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {tenants.length} tenants across all properties
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Tenant
          </button>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statCards.map(card => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="p-4 sm:p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon size={18} className={card.color} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{card.label}</p>
                    <p className={`text-2xl font-bold mt-0.5 ${card.color}`}>{card.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* TABLE */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">

          {/* TOOLBAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
            {/* SCORE FILTERS */}
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
                      {tenants.filter(t => t.reliabilityScore === f).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* SEARCH */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
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
                  <th className="px-5 py-3">Tenant</th>
                  <th className="px-5 py-3">Unit / Property</th>
                  <th className="px-5 py-3">Rent</th>
                  <th className="px-5 py-3">Lease End</th>
                  <th className="px-5 py-3">Balance</th>
                  <th className="px-5 py-3">Reliability</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
                      No tenants match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map(t => {
                  const expiring = leaseExpiresSoon(t.leaseEnd);
                  const expired = leaseExpired(t.leaseEnd);
                  return (
                    <tr key={t.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">

                      {/* TENANT */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {initials(t.name)}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{t.name}</p>
                            <p className="text-xs text-gray-400">{t.phone}</p>
                          </div>
                        </div>
                      </td>

                      {/* UNIT */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="font-medium text-gray-900 dark:text-white">{t.unit}</p>
                        <p className="text-xs text-gray-400">{t.property}</p>
                      </td>

                      {/* RENT */}
                      <td className="px-5 py-4 whitespace-nowrap font-semibold text-gray-900 dark:text-white">
                        {fmt(t.rentAmount)}
                        <span className="text-xs font-normal text-gray-400 ml-1">/{t.frequency === "Monthly" ? "mo" : "wk"}</span>
                      </td>

                      {/* LEASE END */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={
                          expired ? "text-red-500 font-semibold" :
                          expiring ? "text-yellow-500 font-semibold" :
                          "text-gray-500 dark:text-gray-400"
                        }>
                          {t.leaseEnd}
                        </span>
                        {expired && <p className="text-xs text-red-400">Expired</p>}
                        {expiring && !expired && <p className="text-xs text-yellow-500">Expiring soon</p>}
                      </td>

                      {/* BALANCE */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {t.balance > 0
                          ? <span className="font-semibold text-red-500">{fmt(t.balance)}</span>
                          : <span className="text-green-500 font-medium flex items-center gap-1"><CheckCircle size={12} /> Clear</span>
                        }
                      </td>

                      {/* SCORE */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <ScoreBadge score={t.reliabilityScore} />
                      </td>

                      {/* ACTIONS */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setProfileTenant(t)}
                            className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Profile
                          </button>
                          <button
                            onClick={() => setEditTenant(t)}
                            className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => navigate("/landlord/payments")}
                            className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:underline"
                          >
                            Payments
                          </button>
                          <button
                            onClick={() => setDeleteTenant(t)}
                            className="text-xs font-medium text-red-500 dark:text-red-400 hover:underline"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="font-medium text-gray-900 dark:text-white">{filtered.length}</span>
              {" "}of{" "}
              <span className="font-medium text-gray-900 dark:text-white">{tenants.length}</span>
              {" "}tenants
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}