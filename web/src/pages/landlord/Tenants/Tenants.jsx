/* eslint-disable react-hooks/purity */
/* eslint-disable no-unused-vars */
// LANDLORD TENANTS PAGE - FETCHES FROM API
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  CheckCircle, AlertTriangle, Calendar, X, Edit, Trash2, Plus,
  Search, ChevronRight, Mail, Phone, Home, CreditCard, Clock,
  AlertCircle, Info, Loader2, RefreshCw, FileX, DollarSign,
  Building2, ChevronDown, ChevronUp, LayoutGrid, List, User
} from "lucide-react";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { LandlordRegisterTenantModal } from "./LandlordRegisterTenant";

const API = "http://localhost:4000";

// CONFIG
const PROPERTIES = ["Hillbrow Heights", "Berea Flats", "Yeoville Corner"];
const FREQUENCIES = ["Monthly", "Weekly"];
const FILTERS = ["All", "Reliable", "Moderate Risk", "High Risk"];
const TERMINATION_REASONS = [
  "Non-payment of rent", "Repeated late payments", "Breach of property rules",
  "Property damage", "End of lease — not renewing", "Mutual agreement", "Other",
];

const SCORE_CONFIG = {
  "reliable":      { color: "text-green-600 dark:text-green-400",  bg: "bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-700",   dot: "bg-green-500",  bar: "bg-green-500",  icon: CheckCircle  },
  "moderate_risk": { color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700", dot: "bg-yellow-400", bar: "bg-yellow-400", icon: AlertTriangle },
  "high_risk":     { color: "text-red-600 dark:text-red-400",      bg: "bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700",             dot: "bg-red-500",    bar: "bg-red-500",    icon: AlertCircle  },
};

const PROPERTY_ACCENTS = {
  "Hillbrow Heights": { ring: "ring-blue-500",    dot: "bg-blue-500",    label: "text-blue-400",    headerBg: "bg-blue-600/10 dark:bg-blue-500/10",    border: "border-blue-500/20"    },
  "Berea Flats":      { ring: "ring-violet-500",  dot: "bg-violet-500",  label: "text-violet-400",  headerBg: "bg-violet-600/10 dark:bg-violet-500/10",  border: "border-violet-500/20"  },
  "Yeoville Corner":  { ring: "ring-emerald-500", dot: "bg-emerald-500", label: "text-emerald-400", headerBg: "bg-emerald-600/10 dark:bg-emerald-500/10", border: "border-emerald-500/20" },
};

// HELPERS
function format(n) { return `R ${Number(n).toLocaleString("en-ZA")}`; }
function initials(name = "") { return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(); }
function leaseExpiresSoon(endDate) {
  if (!endDate) return false;
  const days = Math.ceil((new Date(endDate) - Date.now()) / 86400000);
  return days >= 0 && days <= 60;
}
function leaseExpired(endDate) {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

// INPUT CLASS BUILDER 
function inputCls(errors, key, ring = "blue") {
  return `w-full text-sm rounded-lg px-3 py-2.5 border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-${ring}-500
    ${errors[key] ? "border-red-400 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`;
}

// MAP API DATA TO FRONTEND FORMAT
function mapTenantFromAPI(t) {
  return {
    id: t.id,
    name: `${t.first_name || ""} ${t.last_name || ""}`.trim(),
    email: t.email || "",
    phone: t.phone || "",
    unit: t.unit_number ? `Unit ${t.unit_number}` : "N/A",
    property: t.property_name || "Unknown",
    rentAmount: Number(t.rent_amount) || 0,
    frequency: t.payment_frequency || "monthly",
    leaseStart: t.lease_start_date || "",
    leaseEnd: t.lease_end_date || "",
    status: t.lease_status === "active" ? "Active" : "Inactive",
    reliabilityScore: (t.reliability_score || "reliable")
      .replace(/_/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase()),
    paymentHistory: {
      onTime:  Number(t.on_time_payments)  || 0,
      late:    Number(t.late_payments)     || 0,
      missed:  Number(t.missed_payments)   || 0,
    },
    balance:          Number(t.outstanding_balance) || 0,
    profile_complete: t.profile_complete,
    lease_id:         t.lease_id,
    unit_id:          t.unit_id,
    property_id:      t.property_id,
  };
}

// SUB-COMPONENTS
function ScoreBadge({ score }) {
  const cfg  = SCORE_CONFIG[score.replace(/\s+/g, "_").toLowerCase()] ?? SCORE_CONFIG["reliable"];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
      <Icon size={11} />{score}
    </span>
  );
}

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

function PaymentSparkline({ paymentHistory }) {
  const { onTime, late, missed } = paymentHistory;
  const dots = [
    ...Array(onTime).fill("green"),
    ...Array(late).fill("yellow"),
    ...Array(missed).fill("red"),
  ].slice(-12);
  const colorMap = { green: "bg-green-500", yellow: "bg-yellow-400", red: "bg-red-500" };
  return (
    <div className="flex items-center gap-0.5">
      {dots.map((c, i) => (
        <span key={i} className={`w-1.5 h-3 rounded-sm ${colorMap[c]} opacity-80`} />
      ))}
    </div>
  );
}

function LeaseHealthBar({ leaseStart, leaseEnd }) {
  if (!leaseStart || !leaseEnd) return null;
  const start    = new Date(leaseStart).getTime();
  const end      = new Date(leaseEnd).getTime();
  const now      = Date.now();
  const pct      = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  const daysLeft = Math.ceil((end - now) / 86400000);
  const color    = daysLeft < 0 ? "bg-red-500" : daysLeft < 60 ? "bg-yellow-400" : "bg-blue-500";
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs mb-1 text-gray-400 dark:text-gray-500">
        <span>Lease progress</span>
        <span className={daysLeft < 0 ? "text-red-400" : daysLeft < 60 ? "text-yellow-400" : "text-gray-400"}>
          {daysLeft < 0 ? "Expired" : `${daysLeft}d left`}
        </span>
      </div>
      <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// MODAL SHELL 
function ModalShell({ title, sub, icon: Icon, iconBg, onClose, children, footer, maxW = "max-w-lg" }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full ${maxW} border border-gray-200 dark:border-gray-700 flex flex-col max-h-[92vh]`}>
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
        {footer && (
          <div className="px-6 pb-6 flex gap-3 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// PROFILE MODAL 
function ProfileModal({ tenant, onClose, onEdit, onRepayment, onRenewal, onTermination }) {
  const cfg      = SCORE_CONFIG[tenant.reliabilityScore.replace(/\s+/g, "_").toLowerCase()] ?? SCORE_CONFIG["reliable"];
  const total    = tenant.paymentHistory.onTime + tenant.paymentHistory.late + tenant.paymentHistory.missed;
  const expiring = leaseExpiresSoon(tenant.leaseEnd);
  const expired  = leaseExpired(tenant.leaseEnd);

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

          {/* RELIABILITY SCORE SECTION */}
          <div className={`rounded-xl p-4 ${cfg.bg}`}>
            <div className="flex items-center justify-between mb-3">
              <p className={`text-sm font-bold ${cfg.color}`}>Reliability Score: {tenant.reliabilityScore}</p>
              <ScoreBadge score={tenant.reliabilityScore} />
            </div>
            <div className="space-y-2.5">
              <ScoreBar label="On-time payments" value={tenant.paymentHistory.onTime} max={total || 1} color="bg-green-500" />
              <ScoreBar label="Late payments"    value={tenant.paymentHistory.late}   max={total || 1} color="bg-yellow-400" />
              <ScoreBar label="Missed payments"  value={tenant.paymentHistory.missed} max={total || 1} color="bg-red-500" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{total} total payment periods tracked</p>
          </div>

          {/* LEASE EXPIRY WARNING */}
          {(expiring || expired) && (
            <div className={`flex items-start gap-2 p-3 rounded-lg border text-sm font-medium
              ${expired
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-400"
                : "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400"}`}>
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              {expired ? "Lease has expired — renewal required" : `Lease expires on ${tenant.leaseEnd} — expiring soon`}
            </div>
          )}

          {/* OUTSTANDING BALANCE WARNING */}
          {tenant.balance > 0 && (
            <div className="flex items-start gap-2 p-3 rounded-lg border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-sm font-medium text-red-700 dark:text-red-400">
              <CreditCard size={16} className="flex-shrink-0 mt-0.5" />
              Outstanding balance: {format(tenant.balance)}
            </div>
          )}

          {/* TENANT CONTACT + LEASE DETAILS */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Tenant Info</p>
            <div className="rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
              {[
                ["Email",       tenant.email,                                              Mail    ],
                ["Phone",       tenant.phone,                                              Phone   ],
                ["Unit",        `${tenant.unit} · ${tenant.property}`,                    Home    ],
                ["Rent",        `${format(tenant.rentAmount)} / ${tenant.frequency}`,      CreditCard],
                ["Lease Start", tenant.leaseStart || "—",                                 Calendar],
                ["Lease End",   tenant.leaseEnd   || "—",                                 Calendar],
              ].map(([label, val, Icon]) => (
                <div key={label} className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700/40 odd:bg-white odd:dark:bg-gray-800">
                  <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <Icon size={14} />{label}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white text-right ml-4">{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* LEASE ACTIONS — CONTEXTUAL BASED ON TENANT STATE */}
          <div>
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Lease Actions</p>
            <div className="space-y-2">

              {/* REPAYMENT PLAN — ONLY SHOWN WHEN BALANCE > 0 */}
              {tenant.balance > 0 && (
                <button
                  onClick={() => { onClose(); onRepayment(tenant); }}
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

              {/* RENEW LEASE — ONLY SHOWN WHEN EXPIRING OR ALREADY EXPIRED */}
              {(expiring || expired) && (
                <button
                  onClick={() => { onClose(); onRenewal(tenant); }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors text-left">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                    <RefreshCw size={16} className="text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-green-700 dark:text-green-300">Renew Lease</p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      {expired ? "Lease expired — renew now" : "Set new end date and rent"}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-green-400 ml-auto flex-shrink-0" />
                </button>
              )}

              {/* TERMINATE LEASE — ALWAYS AVAILABLE */}
              <button
                onClick={() => { onClose(); onTermination(tenant); }}
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
          <button
            onClick={onClose}
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
            Close
          </button>
          <button
            onClick={() => { onClose(); onEdit(tenant); }}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
            <Edit size={14} />Edit Tenant
          </button>
        </div>
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

  const instNum         = Math.max(1, Number(instalments) || 1);
  const amountPerPeriod = tenant.balance > 0 ? Math.ceil(tenant.balance / instNum) : 0;

  // BUILDS A PREVIEW OF EACH INSTALMENT DATE AND AMOUNT
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
          <button onClick={onClose} disabled={loading}
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
            {loading ? <><Loader2 size={15} className="animate-spin" />Creating...</> : <><DollarSign size={14} />Create Plan</>}
          </button>
        </>
      }
    >
      {/* OUTSTANDING BALANCE SUMMARY */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700">
        <div>
          <p className="text-xs text-red-600 dark:text-red-400 font-semibold uppercase tracking-wider">Outstanding Balance</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-0.5">{format(tenant.balance)}</p>
        </div>
        <CreditCard size={28} className="text-red-400 dark:text-red-600" />
      </div>

      {/* NUMBER OF INSTALMENTS */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          Number of Instalments{" "}
          {errors.instalments && <span className="text-red-500 normal-case font-normal ml-1">— {errors.instalments}</span>}
        </label>
        <input type="number" min="1" max="24" value={instalments}
          onChange={e => { setInstalments(e.target.value); setErrors(er => ({ ...er, instalments: undefined })); }}
          className={ic("instalments")} placeholder="e.g. 3" />
        {instNum > 0 && tenant.balance > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">≈ {format(amountPerPeriod)} per instalment</p>
        )}
      </div>

      {/* FREQUENCY RADIO */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Payment Frequency</label>
        <div className="flex gap-3">
          {["Monthly", "Weekly"].map(f => (
            <label key={f} className={`flex-1 flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors
              ${frequency === f
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500"
                : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
              <input type="radio" className="accent-blue-600 w-4 h-4" checked={frequency === f} onChange={() => setFrequency(f)} />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{f}</span>
            </label>
          ))}
        </div>
      </div>

      {/* FIRST PAYMENT DATE */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          First Payment Date{" "}
          {errors.startDate && <span className="text-red-500 normal-case font-normal ml-1">— {errors.startDate}</span>}
        </label>
        <input type="date" value={startDate}
          onChange={e => { setStartDate(e.target.value); setErrors(er => ({ ...er, startDate: undefined })); }}
          className={ic("startDate")} />
      </div>

      {/* LIVE SCHEDULE PREVIEW — APPEARS ONCE DATE IS SELECTED */}
      {startDate && instNum > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Payment Schedule Preview</p>
          <div className="rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
            {schedule.map(row => row && (
              <div key={row.no} className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700/40 odd:bg-white odd:dark:bg-gray-800">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {row.no}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{row.date}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{format(row.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INFO NOTE */}
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
    if (!newLeaseEnd)    e.newLeaseEnd = "Required";
    if (!newRent.trim()) e.newRent     = "Required";
    if (newLeaseEnd && tenant.leaseEnd && new Date(newLeaseEnd) <= new Date(tenant.leaseEnd))
      e.newLeaseEnd = "Must be after current lease end";
    return e;
  }

  function handleConfirm() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    // IN PRODUCTION: PUT /api/tenants/:id
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
          <button onClick={onClose} disabled={loading}
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
            {loading ? <><Loader2 size={15} className="animate-spin" />Renewing...</> : <><RefreshCw size={14} />Renew Lease</>}
          </button>
        </>
      }
    >
      {/* CURRENT LEASE SUMMARY */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700 overflow-hidden">
        {[
          ["Current Lease End", tenant.leaseEnd || "—"],
          ["Current Rent",      format(tenant.rentAmount)],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-gray-700/40 odd:bg-white odd:dark:bg-gray-800">
            <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-white">{val}</span>
          </div>
        ))}
      </div>

      {/* NEW LEASE END DATE */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          New Lease End Date{" "}
          {errors.newLeaseEnd && <span className="text-red-500 normal-case font-normal ml-1">— {errors.newLeaseEnd}</span>}
        </label>
        <input type="date" value={newLeaseEnd}
          onChange={e => { setNewLeaseEnd(e.target.value); setErrors(er => ({ ...er, newLeaseEnd: undefined })); }}
          className={ic("newLeaseEnd")} />
      </div>

      {/* NEW RENT WITH CHANGE INDICATOR */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          Monthly Rent (R){" "}
          {errors.newRent && <span className="text-red-500 normal-case font-normal ml-1">— {errors.newRent}</span>}
        </label>
        <input type="number" min="0" value={newRent}
          onChange={e => { setNewRent(e.target.value); setErrors(er => ({ ...er, newRent: undefined })); }}
          className={ic("newRent")} placeholder="e.g. 6500" />
        {rentChanged && Number(newRent) > 0 && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1 flex items-center gap-1">
            <AlertTriangle size={12} />
            Rent will change from {format(tenant.rentAmount)} → {format(Number(newRent))}
          </p>
        )}
      </div>

      {/* INFO NOTE */}
      <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
        <Info size={15} className="text-green-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-green-700 dark:text-green-300">
          The tenant will be notified of their renewal on the mobile app. The new end date and rent take effect immediately.
        </p>
      </div>
    </ModalShell>
  );
}

// LEASE TERMINATION MODAL — REASON + VACATE DATE + CONFIRMATION CHECKBOX
// IN PRODUCTION: POST /api/leases/:id/terminate  { reason, vacateDate }
function TerminationModal({ tenant, onClose, onConfirm }) {
  const [reason, setReason]       = useState("");
  const [vacateDate, setVacate]   = useState("");
  const [customNote, setNote]     = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [errors, setErrors]       = useState({});

  // SUBMIT BUTTON STAYS DISABLED UNTIL ALL THREE CONDITIONS ARE MET
  const canProceed = reason !== "" && vacateDate !== "" && confirmed;

  function validate() {
    const e = {};
    if (!reason)     e.reason    = "Please select a reason";
    if (!vacateDate) e.vacateDate = "Required";
    return e;
  }

  function handleConfirm() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    // IN PRODUCTION: POST /api/leases/:lease_id/terminate
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
          <button onClick={onClose} disabled={loading}
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={!canProceed || loading}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
            {loading ? <><Loader2 size={15} className="animate-spin" />Terminating...</> : <><FileX size={14} />Terminate Lease</>}
          </button>
        </>
      }
    >
      {/* TERMINATION REASON RADIO LIST */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          Reason for Termination{" "}
          {errors.reason && <span className="text-red-500 normal-case font-normal ml-1">— {errors.reason}</span>}
        </label>
        <div className="space-y-2">
          {TERMINATION_REASONS.map(r => (
            <label key={r} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
              ${reason === r
                ? "border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-500"
                : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
              <input type="radio" name="termination-reason" value={r} checked={reason === r}
                onChange={() => { setReason(r); setErrors(e => ({ ...e, reason: undefined })); }}
                className="accent-red-600 w-4 h-4" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{r}</span>
            </label>
          ))}
        </div>
      </div>

      {/* FREE TEXT — ONLY SHOWN WHEN "OTHER" IS SELECTED */}
      {reason === "Other" && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
            Describe the reason
          </label>
          <textarea rows={3} value={customNote} onChange={e => setNote(e.target.value)} placeholder="Provide details..."
            className="w-full text-sm rounded-lg px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" />
        </div>
      )}

      {/* VACATE DATE */}
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          Vacate Date{" "}
          {errors.vacateDate && <span className="text-red-500 normal-case font-normal ml-1">— {errors.vacateDate}</span>}
        </label>
        <input type="date" value={vacateDate}
          onChange={e => { setVacate(e.target.value); setErrors(er => ({ ...er, vacateDate: undefined })); }}
          className={ic("vacateDate")} />
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
          Unit marked Vacant and tenant mobile access deactivated on this date.
        </p>
      </div>

      {/* BALANCE WARNING — ONLY IF TENANT HAS OUTSTANDING AMOUNT */}
      {tenant.balance > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
          <AlertTriangle size={15} className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-orange-700 dark:text-orange-300">
            Outstanding balance of <span className="font-bold">{format(tenant.balance)}</span> will be flagged for collections on termination.
          </p>
        </div>
      )}

      {/* CONSEQUENCES LIST */}
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

      {/* CONFIRMATION CHECKBOX — MUST BE TICKED BEFORE SUBMITTING */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}
          className="accent-red-600 w-4 h-4 mt-0.5 flex-shrink-0" />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          I understand this will terminate <span className="font-semibold">{tenant.name}</span>'s lease and cannot be easily undone.
        </span>
      </label>
    </ModalShell>
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
          Are you sure you want to remove{" "}
          <span className="font-semibold text-gray-900 dark:text-white">{tenant?.name}</span>?
          Their lease record and payment history will be archived.
        </p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={14} className="animate-spin" />Removing...</> : <><Trash2 size={14} />Remove</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// TENANT CARD — USED IN GRID VIEW
function TenantCard({ tenant, onProfile, onEdit, onRepayment, onRenewal, onDelete, navigate }) {
  const isExpiring = leaseExpiresSoon(tenant.leaseEnd);
  const isExpired  = leaseExpired(tenant.leaseEnd);

  return (
    <div className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md transition-all duration-200">
      {/* TOP ACCENT LINE — COLOUR CODED BY ALERT SEVERITY */}
      {(isExpired || tenant.balance > 0 || tenant.reliabilityScore === "High Risk") && (
        <div className={`absolute top-0 left-4 right-4 h-0.5 rounded-full
          ${isExpired ? "bg-red-500" : tenant.reliabilityScore === "High Risk" ? "bg-red-400" : "bg-yellow-400"}`}
        />
      )}

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-sm font-bold flex-shrink-0">
            {initials(tenant.name)}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">{tenant.name}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5 mt-0.5">
              <Home size={10} className="flex-shrink-0" />{tenant.unit}
            </p>
          </div>
        </div>
        <ScoreBadge score={tenant.reliabilityScore} />
      </div>

      <div className="mb-3">
        <LeaseHealthBar leaseStart={tenant.leaseStart} leaseEnd={tenant.leaseEnd} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400 dark:text-gray-500">Payment history</span>
        <PaymentSparkline paymentHistory={tenant.paymentHistory} />
      </div>

      <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 mb-3">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Monthly rent</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{format(tenant.rentAmount)}</p>
        </div>
        <div className="w-px h-8 bg-gray-200 dark:bg-gray-600" />
        <div className="text-right">
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Balance</p>
          {tenant.balance > 0
            ? <p className="text-sm font-bold text-red-500">{format(tenant.balance)}</p>
            : <p className="text-sm font-bold text-green-500 flex items-center gap-1 justify-end"><CheckCircle size={12} />Clear</p>
          }
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <button onClick={() => onProfile(tenant)}
          className="flex-1 min-w-0 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-400 text-xs font-medium transition-colors">
          Profile
        </button>
        <button onClick={() => onEdit(tenant)}
          className="flex-1 min-w-0 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-medium transition-colors">
          <Edit size={11} />Edit
        </button>
        <button onClick={() => navigate("/landlord/payments")}
          className="flex-1 min-w-0 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 text-xs font-medium transition-colors">
          Payments
        </button>
        {tenant.balance > 0 && (
          <button onClick={() => onRepayment(tenant)}
            className="flex-1 min-w-0 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-medium transition-colors">
            Plan
          </button>
        )}
        {(isExpiring || isExpired) && (
          <button onClick={() => onRenewal(tenant)}
            className="flex-1 min-w-0 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-700 dark:text-green-400 text-xs font-medium transition-colors">
            <RefreshCw size={11} />Renew
          </button>
        )}
        <button onClick={() => onDelete(tenant)}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// PROPERTY GROUP — COLLAPSIBLE SECTION WITH GRID OR LIST VIEW
function PropertyGroup({ property, tenants, accent, onProfile, onEdit, onRepayment, onRenewal, onDelete, navigate, viewMode }) {
  const [collapsed, setCollapsed] = useState(false);
  const totalRent    = tenants.reduce((s, t) => s + t.rentAmount, 0);
  const totalBalance = tenants.reduce((s, t) => s + t.balance, 0);
  const alerts       = tenants.filter(t =>
    t.balance > 0 || leaseExpiresSoon(t.leaseEnd) || leaseExpired(t.leaseEnd) || t.reliabilityScore === "High Risk"
  ).length;

  return (
    <div className="mb-6">
      {/* COLLAPSIBLE PROPERTY HEADER */}
      <button onClick={() => setCollapsed(c => !c)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border mb-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${accent.headerBg} ${accent.border}`}>
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${accent.dot} flex-shrink-0`} />
          <Building2 size={16} className={accent.label} />
          <span className={`font-semibold text-sm ${accent.label}`}>{property}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-normal">
            {tenants.length} tenant{tenants.length !== 1 ? "s" : ""}
          </span>
          {alerts > 0 && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 px-2 py-0.5 rounded-full">
              <AlertTriangle size={10} />{alerts} alert{alerts !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Rent: <span className="font-semibold text-gray-700 dark:text-gray-300">{format(totalRent)}/mo</span></span>
            {totalBalance > 0 && <span>Owed: <span className="font-semibold text-red-500">{format(totalBalance)}</span></span>}
          </div>
          {collapsed ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronUp size={16} className="text-gray-400" />}
        </div>
      </button>

      {!collapsed && (
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {tenants.map(t => (
              <TenantCard
                key={t.id} tenant={t}
                onProfile={onProfile} onEdit={onEdit}
                onRepayment={onRepayment} onRenewal={onRenewal}
                onDelete={onDelete} navigate={navigate}
              />
            ))}
          </div>
        ) : (
          // LIST VIEW — COMPACT ROW LAYOUT
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
            {tenants.map(t => (
              <div key={t.id} className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {initials(t.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.unit}</p>
                </div>
                <div className="hidden sm:block w-24 text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{format(t.rentAmount)}</p>
                  {t.balance > 0 && <p className="text-xs text-red-500">{format(t.balance)} owed</p>}
                </div>
                <ScoreBadge score={t.reliabilityScore} />
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => onProfile(t)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">View</button>
                  <button onClick={() => onEdit(t)}    className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:underline">Edit</button>
                  <button onClick={() => onDelete(t)}  className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

// MAIN PAGE
export default function Tenants() {
  useDocumentTitle("Tenants");
  const navigate = useNavigate();

  // STATE
  
  const [tenants, setTenants]               = useState([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");
  const [filter, setFilter]                 = useState("All");
  const [search, setSearch]                 = useState("");
  const [viewMode, setViewMode]             = useState("grid");
  const [profileTenant, setProfile]         = useState(null);
  const [showAdd, setShowAdd]               = useState(false);
  const [deleteTenant, setDelete]           = useState(null);
  const [repaymentTenant, setRepayment]     = useState(null);
  const [renewalTenant, setRenewal]         = useState(null);
  const [terminationTenant, setTermination] = useState(null);

  // FETCH TENANTS FROM API
  const fetchTenants = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const { data } = await axios.get(`${API}/tenants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const mapped = (data.tenants || []).map(mapTenantFromAPI);
      setTenants(mapped);
    } catch (err) {
      console.error("Failed to fetch tenants:", err);
      setError(err.response?.data?.error || "Failed to load tenants");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  fetchTenants();
}, []);


  // HANDLERS
  const handleTenantCreated = () => fetchTenants();

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.delete(`${API}/tenants/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTenants(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error("Delete failed:", err);
      alert(err.response?.data?.error || "Failed to delete tenant");
    }
  };






  // REPAYMENT — IN PRODUCTION CALLS POST /api/repayment-plans
  function handleRepayment(id, plan) {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, repaymentPlan: plan } : t));
  }

  // RENEWAL — IN PRODUCTION CALLS PUT /api/tenants/:id
  function handleRenewal(id, { leaseEnd, rentAmount }) {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, leaseEnd, rentAmount } : t));
  }

  // TERMINATION — IN PRODUCTION CALLS POST /api/leases/:id/terminate
  function handleTermination(id, { reason, vacateDate }) {
    setTenants(prev => prev.map(t =>
      t.id === id ? { ...t, status: "Terminated", terminationReason: reason, vacateDate } : t
    ));
  }

  // FILTERING
  const filtered = tenants.filter(t => {
    const matchScore  = filter === "All" || t.reliabilityScore === filter;
    const q           = search.toLowerCase();
    const matchSearch = !q || [t.name, t.email, t.phone, t.unit, t.property]
      .some(s => (s || "").toLowerCase().includes(q));
    return matchScore && matchSearch;
  });

  // GROUP BY PROPERTY FOR THE COLLAPSIBLE SECTIONS
  const grouped = PROPERTIES.reduce((acc, prop) => {
    const group = filtered.filter(t => t.property === prop);
    if (group.length > 0) acc[prop] = group;
    return acc;
  }, {});

  const needsAttention = tenants.filter(t =>
    t.balance > 0 || leaseExpiresSoon(t.leaseEnd) || leaseExpired(t.leaseEnd) || t.reliabilityScore === "High Risk"
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* MODALS — ALL CONDITIONALLY RENDERED */}
      {profileTenant && (
        <ProfileModal
          tenant={profileTenant}
          onClose={() => setProfile(null)}
          onEdit={t => { setProfile(null); navigate(`/landlord/tenants/${t.id}/edit`); }}
          onRepayment={t => setRepayment(t)}
          onRenewal={t => setRenewal(t)}
          onTermination={t => setTermination(t)}
        />
      )}
      {showAdd && (
        <LandlordRegisterTenantModal
          onClose={() => setShowAdd(false)}
          onCreated={handleTenantCreated}
        />
      )}
      {deleteTenant && (
        <DeleteModal
          tenant={deleteTenant}
          onClose={() => setDelete(null)}
          onConfirm={handleDelete}
        />
      )}
      {repaymentTenant && (
        <RepaymentModal
          tenant={repaymentTenant}
          onClose={() => setRepayment(null)}
          onConfirm={handleRepayment}
        />
      )}
      {renewalTenant && (
        <RenewalModal
          tenant={renewalTenant}
          onClose={() => setRenewal(null)}
          onConfirm={handleRenewal}
        />
      )}
      {terminationTenant && (
        <TerminationModal
          tenant={terminationTenant}
          onClose={() => setTermination(null)}
          onConfirm={handleTermination}
        />
      )}

      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-12">

        {/* HEADER */}
        <div className="flex items-start justify-between mb-5 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User size={24} />
              Tenants
            </h1> 
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {loading ? "Loading..." : `${tenants.length} tenants across ${PROPERTIES.length} properties`}
              {!loading && needsAttention > 0 && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400">
                  <AlertTriangle size={11} />{needsAttention} need attention
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0">
            Add Tenant
          </button>
        </div>

        {/* ERROR STATE */}
        {error && (
          <div className="mb-5 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 flex items-center gap-3">
            <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-400 flex-1">{error}</p>
            <button onClick={fetchTenants} className="text-sm text-red-600 dark:text-red-400 hover:underline font-medium">
              Retry
            </button>
          </div>
        )}

        {/* LOADING STATE */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-blue-500" />
          </div>
        )}

        {/* MAIN CONTENT */}
        {!loading && !error && (
          <>
            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div className="flex flex-wrap gap-2">
                {FILTERS.map(f => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors
                      ${filter === f
                        ? "bg-blue-600 text-white"
                        : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                    {f}
                    {f !== "All" && (
                      <span className="ml-1.5 text-xs opacity-70">
                        {tenants.filter(t => t.reliabilityScore === f).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Search tenants..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-48" />
                </div>
                {/* GRID / LIST TOGGLE */}
                <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-0.5">
                  <button onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}>
                    <LayoutGrid size={15} />
                  </button>
                  <button onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}>
                    <List size={15} />
                  </button>
                </div>
              </div>
            </div>

            {/* EMPTY STATE */}
            {Object.keys(grouped).length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                  <Search size={24} className="text-gray-300 dark:text-gray-600" />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {search || filter !== "All" ? "No tenants match your filters" : "No tenants yet"}
                </p>
                <button onClick={() => { setFilter("All"); setSearch(""); }}
                  className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  Clear filters
                </button>
              </div>
            )}

            {/* PROPERTY GROUPS */}
            {Object.entries(grouped).map(([property, group]) => (
              <PropertyGroup
                key={property}
                property={property}
                tenants={group}
                accent={PROPERTY_ACCENTS[property] ?? PROPERTY_ACCENTS["Hillbrow Heights"]}
                viewMode={viewMode}
                onProfile={setProfile}
                onEdit={t => navigate(`/landlord/tenants/${t.id}/edit`)}
                onRepayment={setRepayment}
                onRenewal={setRenewal}
                onDelete={setDelete}
                navigate={navigate}
              />
            ))}

            {/* ROW COUNT FOOTER */}
            {Object.keys(grouped).length > 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-2">
                Showing {filtered.length} of {tenants.length} tenants
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}