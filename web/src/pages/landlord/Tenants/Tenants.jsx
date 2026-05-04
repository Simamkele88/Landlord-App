/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/static-components */
// LANDLORD TENANTS PAGE, SHOWS A LIST OF TENANTS WITH THEIR DETAILS AND RELIABILITY SCORE, ALONG WITH A PROFILE MODAL AND ADD/EDIT FORM
// AUTHOR: SIMAMKELE WEKEZA
// IF YOU HAVE ANY QUESTIONS ABOUT THIS CODE, ASK ME.

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle, AlertTriangle, Calendar, X, Edit, Trash2, Plus,
  Search, ChevronRight, Mail, Phone, Home, CreditCard, Clock,
  AlertCircle, Info, Loader2, RefreshCw, FileX, DollarSign,
} from "lucide-react";
import useDocumentTitle from "../../../hooks/useDocumentTitle";

// MOCK DATA
const INITIAL_TENANTS = [
  { id: 1, name: "Sipho Dlamini",  email: "sipho@gmail.com",  phone: "0821234567", unit: "Unit 4A", property: "Hillbrow Heights", rentAmount: 6500, frequency: "Monthly", leaseStart: "2025-01-01", leaseEnd: "2026-12-31", status: "Active", reliabilityScore: "Reliable",      paymentHistory: { onTime: 14, late: 1, missed: 0 }, balance: 0     },
  { id: 2, name: "Lerato Mokoena", email: "lerato@gmail.com", phone: "0731234567", unit: "Unit 2B", property: "Hillbrow Heights", rentAmount: 5800, frequency: "Monthly", leaseStart: "2025-03-01", leaseEnd: "2026-02-28", status: "Active", reliabilityScore: "Reliable",      paymentHistory: { onTime: 12, late: 1, missed: 0 }, balance: 0     },
  { id: 3, name: "Ahmed Patel",    email: "ahmed@gmail.com",  phone: "0611234567", unit: "Unit 1C", property: "Berea Flats",      rentAmount: 7200, frequency: "Monthly", leaseStart: "2024-06-01", leaseEnd: "2026-05-31", status: "Active", reliabilityScore: "Moderate Risk", paymentHistory: { onTime: 8,  late: 5, missed: 1 }, balance: 7200  },
  { id: 4, name: "Nomsa Khumalo",  email: "nomsa@gmail.com",  phone: "0841234567", unit: "Unit 3A", property: "Berea Flats",      rentAmount: 6000, frequency: "Monthly", leaseStart: "2025-06-01", leaseEnd: "2026-05-31", status: "Active", reliabilityScore: "Reliable",      paymentHistory: { onTime: 10, late: 0, missed: 0 }, balance: 0     },
  { id: 5, name: "Thabo Nkosi",    email: "thabo@gmail.com",  phone: "0761234567", unit: "Unit 5D", property: "Yeoville Corner",  rentAmount: 5500, frequency: "Monthly", leaseStart: "2024-09-01", leaseEnd: "2025-08-31", status: "Active", reliabilityScore: "High Risk",     paymentHistory: { onTime: 4,  late: 5, missed: 3 }, balance: 16500 },
  { id: 6, name: "Priya Naidoo",   email: "priya@gmail.com",  phone: "0791234567", unit: "Unit 2A", property: "Yeoville Corner",  rentAmount: 6800, frequency: "Monthly", leaseStart: "2025-07-01", leaseEnd: "2026-06-30", status: "Active", reliabilityScore: "Reliable",      paymentHistory: { onTime: 9,  late: 0, missed: 0 }, balance: 0     },
  { id: 7, name: "Kabelo Sithole", email: "kabelo@gmail.com", phone: "0851234567", unit: "Unit 6B", property: "Hillbrow Heights", rentAmount: 5200, frequency: "Monthly", leaseStart: "2025-02-01", leaseEnd: "2026-01-31", status: "Active", reliabilityScore: "Reliable",      paymentHistory: { onTime: 13, late: 1, missed: 0 }, balance: 0     },
  { id: 8, name: "Zanele Moyo",    email: "zanele@gmail.com", phone: "0721234567", unit: "Unit 1A", property: "Berea Flats",      rentAmount: 7500, frequency: "Monthly", leaseStart: "2024-11-01", leaseEnd: "2026-10-31", status: "Active", reliabilityScore: "Moderate Risk", paymentHistory: { onTime: 6,  late: 4, missed: 1 }, balance: 7500  },
];

const VACANT_UNITS = [
  { unit: "Unit 3B", property: "Hillbrow Heights" },
  { unit: "Unit 4C", property: "Berea Flats" },
];

const PROPERTIES         = ["Hillbrow Heights", "Berea Flats", "Yeoville Corner"];
const FREQUENCIES        = ["Monthly", "Weekly"];
const FILTERS            = ["All", "Reliable", "Moderate Risk", "High Risk"];
const TERMINATION_REASONS = [
  "Non-payment of rent",
  "Repeated late payments",
  "Breach of property rules",
  "Property damage",
  "End of lease — not renewing",
  "Mutual agreement",
  "Other",
];

// CONFIG SCORE TO STYLES AND ICONS
const SCORE_CONFIG = {
  "Reliable":      { color: "text-green-600 dark:text-green-400",  bg: "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700",   dot: "bg-green-500",  icon: CheckCircle  },
  "Moderate Risk": { color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700", dot: "bg-yellow-400", icon: AlertTriangle },
  "High Risk":     { color: "text-red-600 dark:text-red-400",      bg: "bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700",             dot: "bg-red-500",    icon: AlertCircle  },
};

// HELPER FUNCTIONS
function format(n) { return `R ${Number(n).toLocaleString("en-ZA")}`; }
function initials(name = "") { return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(); }
function leaseExpiresSoon(endDate) {
  const days = Math.ceil((new Date(endDate) - Date.now()) / 86400000);
  return days >= 0 && days <= 60;
}
function leaseExpired(endDate) { return new Date(endDate) < new Date(); }

function inputCls(errors, key, ring = "blue") {
  return `w-full text-sm rounded-lg px-3 py-2.5 border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-${ring}-500
    ${errors[key] ? "border-red-400 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`;
}

// SCOREBADGE COMPONENT
function ScoreBadge({ score }) {
  const cfg  = SCORE_CONFIG[score] ?? SCORE_CONFIG["Reliable"];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
      <Icon size={12} />{score}
    </span>
  );
}

// SCOREBAR COMPONENT
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

// MODAL SHELL - REUSABLE WRAPPER FOR CONSISTENT MODAL STYLING
function ModalShell({ title, sub, icon: Icon, iconBg, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[92vh]">
        {/* HEADER */}
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
            <X size={20} />
          </button>
        </div>
        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">{children}</div>
        {/* FOOTER */}
        {footer && <div className="px-6 pb-6 flex gap-3 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">{footer}</div>}
      </div>
    </div>
  );
}

// REPAYMENT PLAN MODAL 
function RepaymentModal({ tenant, onClose, onConfirm }) {
  const [instalments, setInstalments] = useState("3");
  const [startDate, setStartDate]     = useState("");
  const [frequency, setFrequency]     = useState("Monthly");
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState({});

  const instNum          = Math.max(1, Number(instalments) || 1);
  const amountPerPeriod  = tenant.balance > 0 ? Math.ceil(tenant.balance / instNum) : 0;

  const schedule = Array.from({ length: instNum }, (_, i) => {
    if (!startDate) return null;
    const d = new Date(startDate);
    if (frequency === "Monthly") d.setMonth(d.getMonth() + i);
    else d.setDate(d.getDate() + i * 7);
    const isLast = i === instNum - 1;
    return {
      no: i + 1,
      date: d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }),
      amount: isLast ? tenant.balance - amountPerPeriod * (instNum - 1) : amountPerPeriod,
    };
  });

  function validate() {
    const e = {};
    if (!instalments || instNum < 1) e.instalments = "Must be at least 1";
    if (!startDate)                  e.startDate   = "Required";
    return e;
  }

  function handleConfirm() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => {
      onConfirm(tenant.id, { instalments: instNum, startDate, frequency, amountPerPeriod });
      setLoading(false);
      onClose();
    }, 1200);
  }

  const ic = (key) => inputCls(errors, key, "blue");

  return (
    <ModalShell
      title="Create Repayment Plan"
      sub={`${tenant.name} · Outstanding: ${format(tenant.balance)}`}
      icon={DollarSign}
      iconBg="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} disabled={loading} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={handleConfirm} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
            {loading ? <><Loader2 size={15} className="animate-spin" />Creating...</> : <><DollarSign size={14} />Create Plan</>}
          </button>
        </>
      }
    >
      {/* Balance summary */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
        <div>
          <p className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider">Outstanding Balance</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-0.5">{format(tenant.balance)}</p>
        </div>
        <CreditCard size={28} className="text-red-400 dark:text-red-600" />
      </div>

      {/* Instalments */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          Number of Instalments {errors.instalments && <span className="text-red-500 normal-case font-normal ml-1">— {errors.instalments}</span>}
        </label>
        <input type="number" min="1" max="24" value={instalments}
          onChange={e => { setInstalments(e.target.value); setErrors(er => ({ ...er, instalments: undefined })); }}
          className={ic("instalments")} placeholder="e.g. 3" />
        {instNum > 0 && tenant.balance > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">≈ {format(amountPerPeriod)} per instalment</p>
        )}
      </div>

      {/* Frequency */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Payment Frequency</label>
        <div className="flex gap-3">
          {["Monthly", "Weekly"].map(f => (
            <label key={f} className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors
              ${frequency === f ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
              <input type="radio" className="accent-blue-600 w-4 h-4" checked={frequency === f} onChange={() => setFrequency(f)} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{f}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Start date */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          First Payment Date {errors.startDate && <span className="text-red-500 normal-case font-normal ml-1">— {errors.startDate}</span>}
        </label>
        <input type="date" value={startDate}
          onChange={e => { setStartDate(e.target.value); setErrors(er => ({ ...er, startDate: undefined })); }}
          className={ic("startDate")} />
      </div>

      {/* Schedule preview */}
      {startDate && instNum > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Payment Schedule Preview</p>
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
            {schedule.map(row => row && (
              <div key={row.no} className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/40 odd:bg-white odd:dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">{row.no}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{row.date}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{format(row.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
        <Info size={15} className="text-blue-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          The tenant will be notified on their mobile app. Each instalment tracks on the Payments page and the balance clears automatically when complete.
        </p>
      </div>
    </ModalShell>
  );
}

// LEASE RENEWAL MODAL
function RenewalModal({ tenant, onClose, onConfirm }) {
  const [newLeaseEnd, setNewLeaseEnd] = useState("");
  const [newRent, setNewRent]         = useState(String(tenant.rentAmount));
  const [loading, setLoading]         = useState(false);
  const [errors, setErrors]           = useState({});

  const rentChanged = Number(newRent) !== tenant.rentAmount;

  function validate() {
    const e = {};
    if (!newLeaseEnd) e.newLeaseEnd = "Required";
    if (!newRent.trim()) e.newRent = "Required";
    if (newLeaseEnd && new Date(newLeaseEnd) <= new Date(tenant.leaseEnd))
      e.newLeaseEnd = "Must be after current lease end";
    return e;
  }

  function handleConfirm() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => {
      onConfirm(tenant.id, { leaseEnd: newLeaseEnd, rentAmount: Number(newRent) });
      setLoading(false);
      onClose();
    }, 1000);
  }

  const ic = (key) => inputCls(errors, key, "green");

  return (
    <ModalShell
      title="Renew Lease"
      sub={`${tenant.name} · ${tenant.unit}`}
      icon={RefreshCw}
      iconBg="bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} disabled={loading} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={handleConfirm} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
            {loading ? <><Loader2 size={15} className="animate-spin" />Renewing...</> : <><RefreshCw size={14} />Renew Lease</>}
          </button>
        </>
      }
    >
      {/* Current lease summary */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
        {[["Current Lease End", tenant.leaseEnd], ["Current Rent", format(tenant.rentAmount)]].map(([label, val]) => (
          <div key={label} className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700/40 odd:bg-white odd:dark:bg-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{val}</span>
          </div>
        ))}
      </div>

      {/* New lease end */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          New Lease End Date {errors.newLeaseEnd && <span className="text-red-500 normal-case font-normal ml-1">— {errors.newLeaseEnd}</span>}
        </label>
        <input type="date" value={newLeaseEnd}
          onChange={e => { setNewLeaseEnd(e.target.value); setErrors(er => ({ ...er, newLeaseEnd: undefined })); }}
          className={ic("newLeaseEnd")} />
      </div>

      {/* New rent */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          Monthly Rent (R) {errors.newRent && <span className="text-red-500 normal-case font-normal ml-1">— {errors.newRent}</span>}
        </label>
        <input type="number" min="0" value={newRent}
          onChange={e => { setNewRent(e.target.value); setErrors(er => ({ ...er, newRent: undefined })); }}
          className={ic("newRent")} placeholder="e.g. 6500" />
        {rentChanged && Number(newRent) > 0 && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
            <AlertTriangle size={12} /> Rent will change from {format(tenant.rentAmount)} → {format(Number(newRent))}
          </p>
        )}
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
        <Info size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-green-700 dark:text-green-300">
          The tenant will be notified of their renewal on the mobile app. The new end date and rent take effect immediately.
        </p>
      </div>
    </ModalShell>
  );
}

// LEASE TERMINATION MODAL
function TerminationModal({ tenant, onClose, onConfirm }) {
  const [reason, setReason]       = useState("");
  const [vacateDate, setVacate]   = useState("");
  const [customNote, setNote]     = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState({});

  const canProceed = reason !== "" && vacateDate !== "" && confirmed;

  function validate() {
    const e = {};
    if (!reason)    e.reason    = "Please select a reason";
    if (!vacateDate) e.vacateDate = "Required";
    return e;
  }

  function handleConfirm() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => {
      onConfirm(tenant.id, { reason: reason === "Other" ? customNote : reason, vacateDate });
      setLoading(false);
      onClose();
    }, 1200);
  }

  const ic = (key) => inputCls(errors, key, "red");

  return (
    <ModalShell
      title="Terminate Lease"
      sub={`${tenant.name} · ${tenant.unit} · ${tenant.property}`}
      icon={FileX}
      iconBg="bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} disabled={loading} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={handleConfirm} disabled={!canProceed || loading}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
            {loading ? <><Loader2 size={15} className="animate-spin" />Terminating...</> : <><FileX size={14} />Terminate Lease</>}
          </button>
        </>
      }
    >
      {/* Reason picker */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Reason for Termination {errors.reason && <span className="text-red-500 normal-case font-normal ml-1">— {errors.reason}</span>}
        </label>
        <div className="space-y-2">
          {TERMINATION_REASONS.map(r => (
            <label key={r} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
              ${reason === r ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-500" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
              <input type="radio" name="termination-reason" value={r} checked={reason === r}
                onChange={() => { setReason(r); setErrors(e => ({ ...e, reason: undefined })); }}
                className="accent-red-600 w-4 h-4" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{r}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Custom note for "Other" */}
      {reason === "Other" && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Describe the reason</label>
          <textarea rows={3} value={customNote} onChange={e => setNote(e.target.value)} placeholder="Provide details..."
            className="w-full text-sm rounded-lg px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
        </div>
      )}

      {/* Vacate date */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          Vacate Date {errors.vacateDate && <span className="text-red-500 normal-case font-normal ml-1">— {errors.vacateDate}</span>}
        </label>
        <input type="date" value={vacateDate}
          onChange={e => { setVacate(e.target.value); setErrors(er => ({ ...er, vacateDate: undefined })); }}
          className={ic("vacateDate")} />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Unit marked Vacant and tenant mobile access deactivated on this date.</p>
      </div>

      {/* Balance warning if applicable */}
      {tenant.balance > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
          <AlertTriangle size={15} className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-700 dark:text-orange-300">
            Outstanding balance of <span className="font-bold">{format(tenant.balance)}</span> will be flagged for collections on termination.
          </p>
        </div>
      )}

      {/* Consequences */}
      <div className="rounded-xl border border-red-100 dark:border-red-900 bg-red-50 dark:bg-red-900/10 p-4 space-y-2">
        <p className="text-xs font-semibold text-red-700 dark:text-red-400 uppercase tracking-wider">What happens on termination</p>
        {[
          "Tenant's mobile app access is deactivated on the vacate date",
          "Unit is marked as Vacant and available for new tenants",
          "A termination record is archived for audit purposes",
          ...(tenant.balance > 0 ? ["Outstanding balance is flagged and sent to collections"] : []),
        ].map((item, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400">
            <span className="mt-0.5 flex-shrink-0">•</span>
            <span>{item}</span>
          </div>
        ))}
      </div>

      {/* Confirmation checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} className="accent-red-600 w-4 h-4 mt-0.5 flex-shrink-0" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          I understand this will terminate <span className="font-semibold">{tenant.name}</span>'s lease and cannot be easily undone.
        </span>
      </label>
    </ModalShell>
  );
}

// PROFILE MODAL
function ProfileModal({ tenant, onClose, onEdit, onRepayment, onRenewal, onTermination }) {
  const cfg       = SCORE_CONFIG[tenant.reliabilityScore];
  const total     = tenant.paymentHistory.onTime + tenant.paymentHistory.late + tenant.paymentHistory.missed;
  const expiring  = leaseExpiresSoon(tenant.leaseEnd);
  const expired   = leaseExpired(tenant.leaseEnd);

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
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded"><X size={20} /></button>
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
              <ScoreBar label="Late payments"    value={tenant.paymentHistory.late}   max={total} color="bg-yellow-400" />
              <ScoreBar label="Missed payments"  value={tenant.paymentHistory.missed} max={total} color="bg-red-500" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{total} total payment periods tracked</p>
          </div>

          {/* LEASE EXPIRY WARNING */}
          {(expiring || expired) && (
            <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm font-medium
              ${expired ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-400"
                        : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400"}`}>
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              {expired ? "Lease has expired — renewal required" : `Lease expires on ${tenant.leaseEnd} — expiring soon`}
            </div>
          )}

          {/* BALANCE WARNING */}
          {tenant.balance > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-sm font-medium text-red-700 dark:text-red-400">
              <CreditCard size={16} className="flex-shrink-0 mt-0.5" />
              Outstanding balance: {format(tenant.balance)}
            </div>
          )}

          {/* TENANT DETAILS */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Tenant Info</p>
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
              {[
                ["Email",       tenant.email,                              Mail],
                ["Phone",       tenant.phone,                              Phone],
                ["Unit",        `${tenant.unit} · ${tenant.property}`,    Home],
                ["Rent",        `${format(tenant.rentAmount)} / ${tenant.frequency}`, CreditCard],
                ["Lease Start", tenant.leaseStart,                        Calendar],
                ["Lease End",   tenant.leaseEnd,                          Calendar],
              ].map(([label, val, Icon]) => (
                <div key={label} className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700/40 odd:bg-white odd:dark:bg-gray-800">
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2"><Icon size={14} />{label}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white text-right ml-4">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* LEASE ACTIONS */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Lease Actions</p>
            <div className="space-y-2">

              {/* Repayment Plan — only if balance > 0 */}
              {tenant.balance > 0 && (
                <button onClick={() => { onClose(); onRepayment(tenant); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                    <DollarSign size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Create Repayment Plan</p>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Split {format(tenant.balance)} into instalments</p>
                  </div>
                  <ChevronRight size={16} className="text-blue-400 ml-auto flex-shrink-0" />
                </button>
              )}

              {/* Renew Lease — only if expiring or expired */}
              {(expiring || expired) && (
                <button onClick={() => { onClose(); onRenewal(tenant); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                    <RefreshCw size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300">Renew Lease</p>
                    <p className="text-xs text-green-600 dark:text-green-400">{expired ? "Lease expired — renew now" : "Set new end date and rent"}</p>
                  </div>
                  <ChevronRight size={16} className="text-green-400 ml-auto flex-shrink-0" />
                </button>
              )}

              {/* Terminate Lease — always available */}
              <button onClick={() => { onClose(); onTermination(tenant); }}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
                  <FileX size={16} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-red-700 dark:text-red-300">Terminate Lease</p>
                  <p className="text-xs text-red-600 dark:text-red-400">End tenancy and free the unit</p>
                </div>
                <ChevronRight size={16} className="text-red-400 ml-auto flex-shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 pb-6 flex gap-3 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">
          <button onClick={onClose} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">Close</button>
          <button onClick={() => { onClose(); onEdit(tenant); }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
            <Edit size={14} />Edit Tenant
          </button>
        </div>
      </div>
    </div>
  );
}

// ADD / EDIT TENANT FORM MODAL

const EMPTY_FORM = {
  // Personal Information
  name: "",
  surname: "",
  idNumber: "",
  passportNumber: "",
  dateOfBirth: "",
  nationality: "South African",
  gender: "",
  maritalStatus: "Single",
  email: "",
  phone: "",
  alternatePhone: "",
  
  // Residential Address (Previous)
  previousAddress: "",
  previousCity: "",
  previousPostalCode: "",
  
  // Employment Information
  employmentStatus: "Employed",
  employerName: "",
  employerContact: "",
  jobTitle: "",
  monthlyIncome: "",
  employmentStartDate: "",
  
  // Emergency Contact
  emergencyName: "",
  emergencyRelationship: "",
  emergencyPhone: "",
  emergencyEmail: "",
  
  // Unit & Lease
  unit: "",
  property: "",
  rentAmount: "",
  depositAmount: "",
  depositPaid: false,
  frequency: "Monthly",
  leaseStart: "",
  leaseEnd: "",
  
  // Additional Occupants
  occupants: "1",
  hasPets: false,
  petDetails: "",
  
  // Documents
  idDocument: null,
  proofOfIncome: null,
  leaseAgreement: null,
  
  // Notes
  specialNotes: "",
};

const NATIONALITIES = [
  "South African", "Zimbabwean", "Mozambican", "Botswanan", "Namibian",
  "Zambian", "Malawian", "Lesotho", "Eswatini", "Nigerian", "Other"
];

const GENDERS = ["Male", "Female", "Other", "Prefer not to say"];
const MARITAL_STATUS = ["Single", "Married", "Divorced", "Widowed", "Separated", "Domestic Partnership"];
const EMPLOYMENT_STATUSES = ["Employed", "Self-Employed", "Student", "Retired", "Unemployed", "Other"];

function TenantFormModal({ tenant, onClose, onSave }) {
  const isEdit = !!tenant;
  const [currentStep, setCurrentStep] = useState(1);
  const [form, setForm] = useState(tenant ? {
    // Personal Information
    name: tenant.name || "",
    surname: tenant.surname || "",
    idNumber: tenant.idNumber || "",
    passportNumber: tenant.passportNumber || "",
    dateOfBirth: tenant.dateOfBirth || "",
    nationality: tenant.nationality || "South African",
    gender: tenant.gender || "",
    maritalStatus: tenant.maritalStatus || "Single",
    email: tenant.email || "",
    phone: tenant.phone || "",
    alternatePhone: tenant.alternatePhone || "",
    
    // Previous Address
    previousAddress: tenant.previousAddress || "",
    previousCity: tenant.previousCity || "",
    previousPostalCode: tenant.previousPostalCode || "",
    
    // Employment
    employmentStatus: tenant.employmentStatus || "Employed",
    employerName: tenant.employerName || "",
    employerContact: tenant.employerContact || "",
    jobTitle: tenant.jobTitle || "",
    monthlyIncome: tenant.monthlyIncome || "",
    employmentStartDate: tenant.employmentStartDate || "",
    
    // Emergency Contact
    emergencyName: tenant.emergencyName || "",
    emergencyRelationship: tenant.emergencyRelationship || "",
    emergencyPhone: tenant.emergencyPhone || "",
    emergencyEmail: tenant.emergencyEmail || "",
    
    // Unit & Lease
    unit: tenant.unit || "",
    property: tenant.property || "",
    rentAmount: String(tenant.rentAmount || ""),
    depositAmount: String(tenant.depositAmount || tenant.rentAmount || ""),
    depositPaid: tenant.depositPaid || false,
    frequency: tenant.frequency || "Monthly",
    leaseStart: tenant.leaseStart || "",
    leaseEnd: tenant.leaseEnd || "",
    
    // Additional
    occupants: String(tenant.occupants || "1"),
    hasPets: tenant.hasPets || false,
    petDetails: tenant.petDetails || "",
    specialNotes: tenant.specialNotes || "",
  } : EMPTY_FORM);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const totalSteps = 4;
  const usePassport = form.nationality !== "South African";

  function set(key, val) { 
    setForm(f => ({ ...f, [key]: val })); 
    setErrors(e => ({ ...e, [key]: undefined })); 
  }

  function validateStep(step) {
    const e = {};
    
    if (step === 1) {
      if (!form.name.trim()) e.name = "Required";
      if (!form.surname.trim()) e.surname = "Required";
      if (!usePassport && !form.idNumber.trim()) e.idNumber = "ID number required";
      if (usePassport && !form.passportNumber.trim()) e.passportNumber = "Passport number required";
      if (!form.dateOfBirth) e.dateOfBirth = "Required";
      if (!form.gender) e.gender = "Required";
      if (!form.email.trim()) e.email = "Required";
      if (!form.phone.trim()) e.phone = "Required";
    }
    
    if (step === 2) {
      if (!form.employmentStatus) e.employmentStatus = "Required";
      if (form.employmentStatus === "Employed" || form.employmentStatus === "Self-Employed") {
        if (!form.employerName.trim()) e.employerName = "Required";
        if (!form.monthlyIncome.trim()) e.monthlyIncome = "Required";
      }
      if (!form.emergencyName.trim()) e.emergencyName = "Required";
      if (!form.emergencyPhone.trim()) e.emergencyPhone = "Required";
    }
    
    if (step === 3) {
      if (!form.unit.trim()) e.unit = "Required";
      if (!form.property.trim()) e.property = "Required";
      if (!form.rentAmount.trim()) e.rentAmount = "Required";
      if (!form.leaseStart) e.leaseStart = "Required";
      if (!form.leaseEnd) e.leaseEnd = "Required";
    }
    
    return e;
  }

  function handleNext() {
    const e = validateStep(currentStep);
    if (Object.keys(e).length) { setErrors(e); return; }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps));
  }

  function handleBack() {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  }

  function handleSave() {
    const e = validateStep(totalSteps);
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => {
      onSave({ 
        ...form, 
        rentAmount: Number(form.rentAmount),
        depositAmount: Number(form.depositAmount),
        monthlyIncome: form.monthlyIncome ? Number(form.monthlyIncome) : null,
        occupants: Number(form.occupants),
        id: tenant?.id ?? Date.now(), 
        status: "Active", 
        reliabilityScore: tenant?.reliabilityScore ?? "Reliable", 
        paymentHistory: tenant?.paymentHistory ?? { onTime: 0, late: 0, missed: 0 }, 
        balance: tenant?.balance ?? 0 
      });
      setLoading(false);
      onClose();
    }, 1200);
  }

  const allUnits = [...VACANT_UNITS, ...(isEdit ? [{ unit: tenant.unit, property: tenant.property }] : [])];

  function Field({ label, error, children, optional }) {
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          {label} {optional && <span className="text-gray-400 font-normal">(Optional)</span>}
          {error && <span className="text-red-500 normal-case font-normal ml-1">— {error}</span>}
        </label>
        {children}
      </div>
    );
  }

  const ic = (key) => inputCls(errors, key, "blue");

  // Progress steps
  const steps = [
    { number: 1, label: "Personal" },
    { number: 2, label: "Employment" },
    { number: 3, label: "Lease" },
    { number: 4, label: "Additional" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[92vh]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {isEdit ? "Edit Tenant" : "Add New Tenant"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Complete all required information for tenant onboarding
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded">
            <X size={20} />
          </button>
        </div>

        {/* PROGRESS STEPS */}
        <div className="px-6 pt-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, idx) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                    ${currentStep >= step.number 
                      ? "bg-blue-600 text-white" 
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                    {currentStep > step.number ? <CheckCircle size={14} /> : step.number}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium
                    ${currentStep >= step.number 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-gray-400 dark:text-gray-500"}`}>
                    {step.label}
                  </span>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-2 transition-colors
                    ${currentStep > step.number 
                      ? "bg-blue-600 dark:bg-blue-500" 
                      : "bg-gray-200 dark:bg-gray-700"}`} 
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* FORM BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          
          {/* STEP 1: PERSONAL INFORMATION */}
          {currentStep === 1 && (
            <>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Personal Information</p>
              
              <div className="grid grid-cols-2 gap-4">
                <Field label="First Name" error={errors.name}>
                  <input className={ic("name")} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Sipho" />
                </Field>
                <Field label="Surname" error={errors.surname}>
                  <input className={ic("surname")} value={form.surname} onChange={e => set("surname", e.target.value)} placeholder="e.g. Dlamini" />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Date of Birth" error={errors.dateOfBirth}>
                  <input type="date" className={ic("dateOfBirth")} value={form.dateOfBirth} onChange={e => set("dateOfBirth", e.target.value)} />
                </Field>
                <Field label="Gender" error={errors.gender}>
                  <select className={ic("gender")} value={form.gender} onChange={e => set("gender", e.target.value)}>
                    <option value="">Select gender</option>
                    {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Nationality" error={errors.nationality}>
                  <select className={ic("nationality")} value={form.nationality} onChange={e => set("nationality", e.target.value)}>
                    {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Field>
                <Field label="Marital Status" error={errors.maritalStatus}>
                  <select className={ic("maritalStatus")} value={form.maritalStatus} onChange={e => set("maritalStatus", e.target.value)}>
                    {MARITAL_STATUS.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </Field>
              </div>

              {!usePassport ? (
                <Field label="South African ID Number" error={errors.idNumber}>
                  <input className={ic("idNumber")} value={form.idNumber} onChange={e => set("idNumber", e.target.value)} placeholder="e.g. 8001015009087" />
                </Field>
              ) : (
                <Field label="Passport Number" error={errors.passportNumber}>
                  <input className={ic("passportNumber")} value={form.passportNumber} onChange={e => set("passportNumber", e.target.value)} placeholder="e.g. A12345678" />
                </Field>
              )}

              <div className="grid grid-cols-2 gap-4">
                <Field label="Email Address" error={errors.email}>
                  <input type="email" className={ic("email")} value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@example.com" />
                </Field>
                <Field label="Phone Number" error={errors.phone}>
                  <input type="tel" className={ic("phone")} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="0821234567" />
                </Field>
              </div>

              <Field label="Alternate Phone" optional>
                <input className={ic("alternatePhone")} value={form.alternatePhone} onChange={e => set("alternatePhone", e.target.value)} placeholder="Alternative contact number" />
              </Field>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Previous Address</p>
              </div>

              <Field label="Street Address" optional>
                <input className={ic("previousAddress")} value={form.previousAddress} onChange={e => set("previousAddress", e.target.value)} placeholder="Previous residential address" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="City" optional>
                  <input className={ic("previousCity")} value={form.previousCity} onChange={e => set("previousCity", e.target.value)} placeholder="e.g. Johannesburg" />
                </Field>
                <Field label="Postal Code" optional>
                  <input className={ic("previousPostalCode")} value={form.previousPostalCode} onChange={e => set("previousPostalCode", e.target.value)} placeholder="e.g. 2001" />
                </Field>
              </div>
            </>
          )}

          {/* STEP 2: EMPLOYMENT & EMERGENCY CONTACT */}
          {currentStep === 2 && (
            <>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Employment Information</p>

              <Field label="Employment Status" error={errors.employmentStatus}>
                <select className={ic("employmentStatus")} value={form.employmentStatus} onChange={e => set("employmentStatus", e.target.value)}>
                  {EMPLOYMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              {(form.employmentStatus === "Employed" || form.employmentStatus === "Self-Employed") && (
                <>
                  <Field label="Employer / Business Name" error={errors.employerName}>
                    <input className={ic("employerName")} value={form.employerName} onChange={e => set("employerName", e.target.value)} placeholder="Company or business name" />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Job Title" optional>
                      <input className={ic("jobTitle")} value={form.jobTitle} onChange={e => set("jobTitle", e.target.value)} placeholder="e.g. Software Developer" />
                    </Field>
                    <Field label="Monthly Income (R)" error={errors.monthlyIncome}>
                      <input type="number" min="0" className={ic("monthlyIncome")} value={form.monthlyIncome} onChange={e => set("monthlyIncome", e.target.value)} placeholder="e.g. 25000" />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Employer Contact" optional>
                      <input className={ic("employerContact")} value={form.employerContact} onChange={e => set("employerContact", e.target.value)} placeholder="HR phone number" />
                    </Field>
                    <Field label="Employment Start Date" optional>
                      <input type="date" className={ic("employmentStartDate")} value={form.employmentStartDate} onChange={e => set("employmentStartDate", e.target.value)} />
                    </Field>
                  </div>
                </>
              )}

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Emergency Contact</p>
              </div>

              <Field label="Full Name" error={errors.emergencyName}>
                <input className={ic("emergencyName")} value={form.emergencyName} onChange={e => set("emergencyName", e.target.value)} placeholder="Emergency contact full name" />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Relationship" error={errors.emergencyRelationship}>
                  <input className={ic("emergencyRelationship")} value={form.emergencyRelationship} onChange={e => set("emergencyRelationship", e.target.value)} placeholder="e.g. Spouse, Parent" />
                </Field>
                <Field label="Phone Number" error={errors.emergencyPhone}>
                  <input type="tel" className={ic("emergencyPhone")} value={form.emergencyPhone} onChange={e => set("emergencyPhone", e.target.value)} placeholder="Contact number" />
                </Field>
              </div>

              <Field label="Email Address" optional>
                <input type="email" className={ic("emergencyEmail")} value={form.emergencyEmail} onChange={e => set("emergencyEmail", e.target.value)} placeholder="Emergency contact email" />
              </Field>
            </>
          )}

          {/* STEP 3: UNIT & LEASE */}
          {currentStep === 3 && (
            <>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Unit Assignment</p>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Unit" error={errors.unit}>
                  <select className={ic("unit")} value={form.unit} onChange={e => { 
                    const chosen = allUnits.find(u => u.unit === e.target.value); 
                    set("unit", e.target.value); 
                    if (chosen) set("property", chosen.property); 
                  }}>
                    <option value="">Select unit</option>
                    {allUnits.map(u => <option key={u.unit} value={u.unit}>{u.unit} — {u.property}</option>)}
                  </select>
                </Field>
                <Field label="Property" error={errors.property}>
                  <select className={ic("property")} value={form.property} onChange={e => set("property", e.target.value)}>
                    <option value="">Select property</option>
                    {PROPERTIES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </Field>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Lease Terms</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Monthly Rent (R)" error={errors.rentAmount}>
                  <input type="number" min="0" className={ic("rentAmount")} value={form.rentAmount} onChange={e => set("rentAmount", e.target.value)} placeholder="e.g. 5800" />
                </Field>
                <Field label="Frequency" error={errors.frequency}>
                  <select className={ic("frequency")} value={form.frequency} onChange={e => set("frequency", e.target.value)}>
                    {FREQUENCIES.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Deposit Amount (R)" optional>
                  <input type="number" min="0" className={ic("depositAmount")} value={form.depositAmount} onChange={e => set("depositAmount", e.target.value)} placeholder="Usually equal to rent" />
                </Field>
                <Field label="Deposit Status">
                  <div className="flex items-center h-full pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.depositPaid} onChange={e => set("depositPaid", e.target.checked)} className="accent-blue-600 w-4 h-4" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Deposit paid</span>
                    </label>
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Lease Start Date" error={errors.leaseStart}>
                  <input type="date" className={ic("leaseStart")} value={form.leaseStart} onChange={e => set("leaseStart", e.target.value)} />
                </Field>
                <Field label="Lease End Date" error={errors.leaseEnd}>
                  <input type="date" className={ic("leaseEnd")} value={form.leaseEnd} onChange={e => set("leaseEnd", e.target.value)} />
                </Field>
              </div>
            </>
          )}

          {/* STEP 4: ADDITIONAL INFORMATION */}
          {currentStep === 4 && (
            <>
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Additional Occupants</p>

              <Field label="Number of Occupants" optional>
                <select className={ic("occupants")} value={form.occupants} onChange={e => set("occupants", e.target.value)}>
                  {[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>{n} {n === 1 ? "person" : "people"}</option>)}
                </select>
              </Field>

              <Field label="Pets">
                <div className="space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.hasPets} onChange={e => set("hasPets", e.target.checked)} className="accent-blue-600 w-4 h-4" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Tenant has pets</span>
                  </label>
                  {form.hasPets && (
                    <input className={ic("petDetails")} value={form.petDetails} onChange={e => set("petDetails", e.target.value)} placeholder="Describe pets (type, breed, size)..." />
                  )}
                </div>
              </Field>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Additional Notes</p>
              </div>

              <Field label="Special Notes or Requirements" optional>
                <textarea rows={3} className={ic("specialNotes") + " resize-none"} value={form.specialNotes} onChange={e => set("specialNotes", e.target.value)} placeholder="Any special arrangements, accessibility needs, or notes..." />
              </Field>

              {/* Info Box */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                <Info size={16} className="text-blue-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                  <p>The tenant will receive login credentials for the mobile app via email and SMS.</p>
                  <p>Please ensure all information is accurate before saving.</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 pb-6 flex gap-3 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">
          {currentStep > 1 ? (
            <button onClick={handleBack} disabled={loading} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">
              Back
            </button>
          ) : (
            <button onClick={onClose} disabled={loading} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">
              Cancel
            </button>
          )}
          
          {currentStep < totalSteps ? (
            <button onClick={handleNext} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
              Next <ChevronRight size={14} />
            </button>
          ) : (
            <button onClick={handleSave} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
              {loading ? <><Loader2 size={16} className="animate-spin" />Saving...</> : isEdit ? <><Edit size={14} />Save Changes</> : <><Plus size={14} />Add Tenant</>}
            </button>
          )}
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
          <button onClick={onClose} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 rounded-xl transition-colors">Cancel</button>
          <button onClick={handleConfirm} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={14} className="animate-spin" />Removing...</> : <><Trash2 size={14} />Remove</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// MAIN PAGE
export default function Tenants() {
  useDocumentTitle("Tenants");
  const navigate = useNavigate();

  const [tenants, setTenants]           = useState(INITIAL_TENANTS);
  const [filter, setFilter]             = useState("All");
  const [search, setSearch]             = useState("");
  const [profileTenant, setProfile]     = useState(null);
  const [editTenant, setEdit]           = useState(null);
  const [deleteTenant, setDelete]       = useState(null);
  const [showAdd, setShowAdd]           = useState(false);
  const [repaymentTenant, setRepayment] = useState(null);
  const [renewalTenant, setRenewal]     = useState(null);
  const [terminationTenant, setTermination] = useState(null);

  // DERIVED DATA
  const filtered = tenants.filter(t => {
    const matchScore  = filter === "All" || t.reliabilityScore === filter;
    const q           = search.toLowerCase();
    const matchSearch = !q || [t.name, t.email, t.phone, t.unit, t.property].some(s => s.toLowerCase().includes(q));
    return matchScore && matchSearch;
  });

  const reliable = tenants.filter(t => t.reliabilityScore === "Reliable").length;
  const moderate = tenants.filter(t => t.reliabilityScore === "Moderate Risk").length;
  const highRisk = tenants.filter(t => t.reliabilityScore === "High Risk").length;
  const expiring = tenants.filter(t => leaseExpiresSoon(t.leaseEnd)).length;

  // HANDLERS
  function handleSave(data) {
    setTenants(prev => {
      const exists = prev.find(t => t.id === data.id);
      return exists ? prev.map(t => t.id === data.id ? data : t) : [...prev, data];
    });
  }

  function handleDelete(id) { setTenants(prev => prev.filter(t => t.id !== id)); }

  function handleRepayment(id, plan) {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, repaymentPlan: plan } : t));
  }

  function handleRenewal(id, { leaseEnd, rentAmount }) {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, leaseEnd, rentAmount } : t));
  }

  function handleTermination(id, { reason, vacateDate }) {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, status: "Terminated", terminationReason: reason, vacateDate } : t));
  }

  const statCards = [
    { label: "Reliable",             value: reliable, color: "text-green-500",  bg: "bg-green-100 dark:bg-green-900/20",   icon: CheckCircle  },
    { label: "Moderate Risk",        value: moderate, color: "text-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/20", icon: AlertTriangle },
    { label: "High Risk",            value: highRisk, color: "text-red-500",    bg: "bg-red-100 dark:bg-red-900/20",       icon: AlertCircle  },
    { label: "Lease Expiring (60d)", value: expiring, color: "text-orange-500", bg: "bg-orange-100 dark:bg-orange-900/20", icon: Clock        },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* MODALS */}
      {profileTenant && (
        <ProfileModal
          tenant={profileTenant}
          onClose={() => setProfile(null)}
          onEdit={t => setEdit(t)}
          onRepayment={t => setRepayment(t)}
          onRenewal={t => setRenewal(t)}
          onTermination={t => setTermination(t)}
        />
      )}
      {(editTenant || showAdd) && (
        <TenantFormModal tenant={editTenant ?? null} onClose={() => { setEdit(null); setShowAdd(false); }} onSave={handleSave} />
      )}
      {deleteTenant    && <DeleteModal      tenant={deleteTenant}      onClose={() => setDelete(null)}      onConfirm={handleDelete}      />}
      {repaymentTenant && <RepaymentModal   tenant={repaymentTenant}   onClose={() => setRepayment(null)}   onConfirm={handleRepayment}   />}
      {renewalTenant   && <RenewalModal     tenant={renewalTenant}     onClose={() => setRenewal(null)}     onConfirm={handleRenewal}     />}
      {terminationTenant && <TerminationModal tenant={terminationTenant} onClose={() => setTermination(null)} onConfirm={handleTermination} />}

      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-12">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{tenants.length} tenants across all properties</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Plus size={16} />Add Tenant
          </button>
        </div>

        {/* STAT CARDS */}
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

        {/* TABLE CARD */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">

          {/* TOOLBAR */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}>
                  {f}{f !== "All" && <span className="ml-1.5 text-xs opacity-70">{tenants.filter(t => t.reliabilityScore === f).length}</span>}
                </button>
              ))}
            </div>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search tenant, unit..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
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
                  <tr><td colSpan={7} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">No tenants match your filters.</td></tr>
                )}
                {filtered.map(t => {
                  const isExpiring = leaseExpiresSoon(t.leaseEnd);
                  const isExpired  = leaseExpired(t.leaseEnd);
                  return (
                    <tr key={t.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">{initials(t.name)}</div>
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{t.name}</p>
                            <p className="text-xs text-gray-400">{t.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <p className="font-medium text-gray-900 dark:text-white">{t.unit}</p>
                        <p className="text-xs text-gray-400">{t.property}</p>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap font-semibold text-gray-900 dark:text-white">
                        {format(t.rentAmount)}<span className="text-xs font-normal text-gray-400 ml-1">/{t.frequency === "Monthly" ? "mo" : "wk"}</span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={isExpired ? "text-red-500 font-semibold" : isExpiring ? "text-yellow-500 font-semibold" : "text-gray-500 dark:text-gray-400"}>{t.leaseEnd}</span>
                        {isExpired  && <p className="text-xs text-red-400">Expired</p>}
                        {isExpiring && !isExpired && <p className="text-xs text-yellow-500">Expiring soon</p>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {t.balance > 0
                          ? <span className="font-semibold text-red-500">{format(t.balance)}</span>
                          : <span className="text-green-500 font-medium flex items-center gap-1"><CheckCircle size={12} />Clear</span>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap"><ScoreBadge score={t.reliabilityScore} /></td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button onClick={() => setProfile(t)}    className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">Profile</button>
                          <button onClick={() => setEdit(t)}       className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:underline">Edit</button>
                          {t.balance > 0       && <button onClick={() => setRepayment(t)}  className="text-xs font-medium text-blue-500 dark:text-blue-400 hover:underline">Repayment</button>}
                          {(isExpiring || isExpired) && <button onClick={() => setRenewal(t)} className="text-xs font-medium text-green-600 dark:text-green-400 hover:underline">Renew</button>}
                          <button onClick={() => navigate("/landlord/payments")} className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:underline">Payments</button>
                          <button onClick={() => setDelete(t)}     className="text-xs font-medium text-red-500 dark:text-red-400 hover:underline">Remove</button>
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
              Showing <span className="font-medium text-gray-900 dark:text-white">{filtered.length}</span> of <span className="font-medium text-gray-900 dark:text-white">{tenants.length}</span> tenants
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}