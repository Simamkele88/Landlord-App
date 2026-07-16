/* eslint-disable react-hooks/purity */
/* eslint-disable no-unused-vars */
// LANDLORD TENANTS PAGE 

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { LandlordRegisterTenantModal } from "./LandlordRegisterTenant";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

const PROPERTIES = ["Hillbrow Heights", "Berea Flats", "Yeoville Corner"];
const FILTERS = ["All", "Reliable", "Moderate Risk", "High Risk"];
const TERMINATION_REASONS = [
  "Non-payment of rent", "Repeated late payments", "Breach of property rules",
  "Property damage", "End of lease — not renewing", "Mutual agreement", "Other",
];

const scoreConfig = {
  "reliable":      { color: C.greenLight, bg: 'rgba(26,122,74,0.1)',   border: '1px solid rgba(76,186,122,0.2)',  dot: C.greenLight, icon: 'check'  },
  "moderate risk": { color: C.gold,       bg: 'rgba(232,160,18,0.08)',  border: '1px solid rgba(232,160,18,0.2)',  dot: C.gold,       icon: 'warning' },
  "high risk":     { color: C.redLight,   bg: 'rgba(224,90,74,0.1)',    border: '1px solid rgba(224,90,74,0.2)',   dot: C.redLight,   icon: 'warning' },
};

const propertyAccents = {
  "Hillbrow Heights": { dot: C.blue,       headerBg: 'rgba(58,143,212,0.06)',  border: '1px solid rgba(58,143,212,0.15)'  },
  "Berea Flats":      { dot: C.purple,     headerBg: 'rgba(139,92,246,0.06)',  border: '1px solid rgba(139,92,246,0.15)' },
  "Yeoville Corner":  { dot: C.greenLight, headerBg: 'rgba(26,122,74,0.06)',   border: '1px solid rgba(76,186,122,0.15)' },
};

function format(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
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
function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

const inputStyle = (error) => ({
  width: '100%', fontSize: '0.82rem', padding: '0.6rem 0.9rem', borderRadius: '3px',
  background: C.black, border: `1px solid ${error ? 'rgba(224,90,74,0.5)' : C.border}`,
  color: C.white, fontFamily: F.dm, outline: 'none',
});

const selectStyle = (error) => ({
  ...inputStyle(error),
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.75rem center',
  paddingRight: '2rem',
});

const btnPrimary = {
  background: C.gold, color: C.black, border: 'none',
  padding: '0.6rem 1.4rem', fontSize: '0.76rem', fontWeight: 700,
  fontFamily: F.dm, letterSpacing: '0.04em', borderRadius: '3px',
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
};

const btnGhost = {
  background: 'transparent', color: 'rgba(245,240,232,0.5)',
  border: `1px solid ${C.border}`, padding: '0.6rem 1.2rem',
  fontSize: '0.76rem', fontWeight: 500, fontFamily: F.dm,
  letterSpacing: '0.04em', borderRadius: '3px', cursor: 'pointer',
};

const btnDanger = {
  background: C.red, color: C.white, border: 'none',
  padding: '0.6rem 1.4rem', fontSize: '0.76rem', fontWeight: 600,
  fontFamily: F.dm, letterSpacing: '0.04em', borderRadius: '3px',
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
};

const cardStyle = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden',
};

const modalOverlay = {
  position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
};

const modalShell = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
  maxHeight: '92vh',
};

const modalHeader = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
};

const modalBody = {
  flex: 1, overflowY: 'auto', padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem',
};

const modalFooter = {
  display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0,
};

const pillStyle = (cfg) => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.5rem',
  borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
  textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: cfg.border,
});


function mapTenantFromAPI(t) {
  return {
    id: t.id,
    userId: t.user_id,
    firstName: t.first_name || "",
    lastName: t.last_name || "",
    name: `${t.first_name || ""} ${t.last_name || ""}`.trim(),
    email: t.email || "",
    phone: t.phone || "",
    idNumber: t.id_number || "",
    dateOfBirth: t.date_of_birth || "",
    employmentStatus: t.employment_status || "",
    monthlyIncome: t.monthly_income || 0,
    unit: t.unit_number ? `Unit ${t.unit_number}` : "N/A",
    property: t.property_name || "Unknown",
    rentAmount: Number(t.rent_amount) || 0,
    frequency: t.payment_frequency || "monthly",
    leaseStart: t.lease_start_date || "",
    leaseEnd: t.lease_end_date || "",
    status: t.lease_status === "active" ? "Active" : "Inactive",
    reliabilityScore: (t.reliability_score || "reliable").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    paymentHistory: {
      onTime: Number(t.on_time_payments) || 0,
      late: Number(t.late_payments) || 0,
      missed: Number(t.missed_payments) || 0,
    },
    balance: Number(t.outstanding_balance) || 0,
    profile_complete: t.profile_complete,
    lease_id: t.lease_id,
    unit_id: t.unit_id,
    property_id: t.property_id,
  };
}


function ScoreBadge({ score }) {
  const key = score.replace(/\s+/g, " ").toLowerCase();
  const cfg = scoreConfig[key] ?? scoreConfig["reliable"];
  return (
    <span style={pillStyle(cfg)}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />
      {score}
    </span>
  );
}

function ScoreBar({ label, value, max, color }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
        <span style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.35)', fontFamily: F.mono }}>{label}</span>
        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: C.white }}>{value}</span>
      </div>
      <div style={{ width: '100%', height: 4, borderRadius: '2px', background: 'rgba(245,240,232,0.08)' }}>
        <div style={{ height: 4, borderRadius: '2px', background: color, width: `${Math.min((value / max) * 100, 100)}%` }} />
      </div>
    </div>
  );
}

function PaymentPunchRow({ paymentHistory }) {
  const { onTime, late, missed } = paymentHistory;
  const marks = [...Array(onTime).fill({ c: C.greenLight, l: "on-time" }),
                 ...Array(late).fill({ c: C.gold, l: "late" }),
                 ...Array(missed).fill({ c: C.redLight, l: "missed" })].slice(-14);
  return (
    <div style={{ display: 'flex', gap: '3px' }}>
      {marks.map((m, i) => (
        <span key={i} title={m.l} style={{
          width: 7, height: 7, borderRadius: '1px',
          background: m.c, opacity: 0.85,
        }} />
      ))}
    </div>
  );
}

function LeaseTicker({ leaseStart, leaseEnd }) {
  if (!leaseStart || !leaseEnd) return null;
  const start = new Date(leaseStart).getTime();
  const end = new Date(leaseEnd).getTime();
  const now = Date.now();
  const pct = Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  const daysLeft = Math.ceil((end - now) / 86400000);
  const color = daysLeft < 0 ? C.redLight : daysLeft < 60 ? C.gold : C.blue;
  const TOTAL = 24;
  const filled = Math.round((pct / 100) * TOTAL);
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Lease</span>
        <span style={{ fontSize: '0.62rem', color, fontFamily: F.mono, fontWeight: 600 }}>
          {daysLeft < 0 ? "Expired" : `${daysLeft}d left`}
        </span>
      </div>
      <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: 10 }}>
        {Array.from({ length: TOTAL }).map((_, i) => (
          <span key={i} style={{
            flex: 1,
            height: i % 6 === 0 ? 10 : 6,
            background: i < filled ? color : 'rgba(245,240,232,0.08)',
            borderRadius: '1px',
          }} />
        ))}
      </div>
    </div>
  );
}

function ReliabilityStamp({ score }) {
  const key = score.replace(/\s+/g, " ").toLowerCase();
  const cfg = scoreConfig[key] ?? scoreConfig["reliable"];
  const label = key === "reliable" ? "RELIABLE" : key === "moderate risk" ? "WATCH" : "AT RISK";
  return (
    <div style={{
      position: 'absolute', top: 12, right: 12,
      transform: 'rotate(-6deg)',
      border: `2px solid ${cfg.color}`,
      borderRadius: '4px',
      padding: '0.15rem 0.5rem',
      fontFamily: F.mono,
      fontSize: '0.58rem',
      fontWeight: 800,
      letterSpacing: '0.1em',
      color: cfg.color,
      opacity: 0.9,
      pointerEvents: 'none',
      boxShadow: `inset 0 0 0 1px ${cfg.color}33`,
    }}>
      {label}
    </div>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}{error && <span style={{ color: C.redLight, fontWeight: 400, textTransform: 'none', marginLeft: '0.3rem' }}>— {error}</span>}
      </label>
      {children}
    </div>
  );
}


function EditTenantModal({ tenant, onClose, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState({
    first_name: tenant.firstName || "",
    last_name: tenant.lastName || "",
    email: tenant.email || "",
    phone: tenant.phone || "",
    id_number: tenant.idNumber || "",
    date_of_birth: tenant.dateOfBirth || "",
    employment_status: tenant.employmentStatus || "",
    monthly_income: String(tenant.monthlyIncome || ""),
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: undefined })); }

  function validate() {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "Required";
    if (!form.last_name.trim()) e.last_name = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!form.phone.trim()) e.phone = "Required";
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); toast.warning("Please fill all required fields."); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/tenants/${tenant.id}`, form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Tenant updated!");
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update tenant.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={modalOverlay}>
      <div style={{ ...modalShell, width: '100%', maxWidth: 440 }}>
        <div style={modalHeader}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Edit Tenant</h3>
            <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{tenant.name} · {tenant.unit}</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={modalBody}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field label="First Name" error={errors.first_name}>
              <input style={inputStyle(errors.first_name)} value={form.first_name} onChange={e => set("first_name", e.target.value)} placeholder="First name" />
            </Field>
            <Field label="Last Name" error={errors.last_name}>
              <input style={inputStyle(errors.last_name)} value={form.last_name} onChange={e => set("last_name", e.target.value)} placeholder="Last name" />
            </Field>
          </div>
          <Field label="Email" error={errors.email}>
            <input style={inputStyle(errors.email)} value={form.email} onChange={e => set("email", e.target.value)} placeholder="Email address" type="email" />
          </Field>
          <Field label="Phone" error={errors.phone}>
            <input style={inputStyle(errors.phone)} value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="Phone number" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field label="ID Number">
              <input style={inputStyle(false)} value={form.id_number} onChange={e => set("id_number", e.target.value)} placeholder="ID number" />
            </Field>
            <Field label="Date of Birth">
              <input type="date" style={inputStyle(false)} value={form.date_of_birth} onChange={e => set("date_of_birth", e.target.value)} />
            </Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field label="Employment">
              <select style={selectStyle(false)} value={form.employment_status} onChange={e => set("employment_status", e.target.value)}>
                <option value="">Select</option>
                <option value="employed">Employed</option>
                <option value="self_employed">Self-Employed</option>
                <option value="student">Student</option>
                <option value="retired">Retired</option>
                <option value="unemployed">Unemployed</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Monthly Income (R)">
              <input type="number" style={inputStyle(false)} value={form.monthly_income} onChange={e => set("monthly_income", e.target.value)} placeholder="e.g. 25000" />
            </Field>
          </div>
        </div>
        <div style={modalFooter}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: C.black, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}


function ProfileModal({ tenant, onClose, onEdit, onRepayment, onRenewal, onTermination }) {
  const key = tenant.reliabilityScore.replace(/\s+/g, " ").toLowerCase();
  const cfg = scoreConfig[key] ?? scoreConfig["reliable"];
  const total = tenant.paymentHistory.onTime + tenant.paymentHistory.late + tenant.paymentHistory.missed;
  const expiring = leaseExpiresSoon(tenant.leaseEnd);
  const expired = leaseExpired(tenant.leaseEnd);

  return (
    <div style={modalOverlay}>
      <div style={{ ...modalShell, width: '100%', maxWidth: 480 }}>
        <div style={modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(58,143,212,0.15)', color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.75rem', flexShrink: 0 }}>
              {initials(tenant.name)}
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>{tenant.name}</h3>
              <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{tenant.unit} · {tenant.property}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={modalBody}>
          {/* Reliability Score Card */}
          <div style={{ padding: '1rem', borderRadius: '4px', background: cfg.bg, border: cfg.border }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: 700, color: cfg.color, fontFamily: F.bebas, letterSpacing: '0.03em' }}>Reliability Score: {tenant.reliabilityScore}</p>
              <ScoreBadge score={tenant.reliabilityScore} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <ScoreBar label="On-time payments" value={tenant.paymentHistory.onTime} max={total || 1} color={C.greenLight} />
              <ScoreBar label="Late payments" value={tenant.paymentHistory.late} max={total || 1} color={C.gold} />
              <ScoreBar label="Missed payments" value={tenant.paymentHistory.missed} max={total || 1} color={C.redLight} />
            </div>
            <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginTop: '0.5rem' }}>{total} total payment periods tracked</p>
          </div>

          {/* Alerts */}
          {(expiring || expired) && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.7rem 0.9rem', borderRadius: '3px', background: expired ? 'rgba(224,90,74,0.08)' : 'rgba(232,160,18,0.06)', border: `1px solid ${expired ? 'rgba(224,90,74,0.2)' : 'rgba(232,160,18,0.15)'}`, color: expired ? C.redLight : C.gold, fontSize: '0.72rem', fontWeight: 500 }}>
              <Icon name="warning" size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              {expired ? "Lease has expired — renewal required" : `Lease expires on ${tenant.leaseEnd} — expiring soon`}
            </div>
          )}
          {tenant.balance > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.7rem 0.9rem', borderRadius: '3px', background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.15)', color: C.redLight, fontSize: '0.72rem', fontWeight: 500 }}>
              <Icon name="credit-card" size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
              Outstanding balance: {format(tenant.balance)}
            </div>
          )}

          {/* Tenant Info Table */}
          <div>
            <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Tenant Info</p>
            <div style={{ borderRadius: '3px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              {[
                ["Email", tenant.email, "mail"],
                ["Phone", tenant.phone, "phone"],
                ["Unit", `${tenant.unit} · ${tenant.property}`, "home"],
                ["Rent", `${format(tenant.rentAmount)} / ${tenant.frequency}`, "credit-card"],
                ["Lease Start", tenant.leaseStart || "—", "calendar"],
                ["Lease End", tenant.leaseEnd || "—", "calendar"],
              ].map(([label, val, icon]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0.9rem', background: 'rgba(245,240,232,0.02)', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.4)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Icon name={icon} size={12} /> {label}
                  </span>
                  <span style={{ fontSize: '0.72rem', fontWeight: 500, color: C.white, textAlign: 'right' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lease Actions */}
          <div>
            <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Lease Actions</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {tenant.balance > 0 && (
                <button onClick={() => { onClose(); onRepayment(tenant); }} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.7rem 0.9rem', borderRadius: '3px', background: 'rgba(58,143,212,0.06)', border: '1px solid rgba(58,143,212,0.15)', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(58,143,212,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(58,143,212,0.06)'}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(58,143,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="rand" size={14} color={C.blue} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: C.blue }}>Create Repayment Plan</p>
                    <p style={{ fontSize: '0.65rem', color: 'rgba(58,143,212,0.6)' }}>Split {format(tenant.balance)} into instalments</p>
                  </div>
                  <Icon name="chevron-right" size={14} color="rgba(58,143,212,0.5)" />
                </button>
              )}
              {(expiring || expired) && (
                <button onClick={() => { onClose(); onRenewal(tenant); }} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.7rem 0.9rem', borderRadius: '3px', background: 'rgba(26,122,74,0.06)', border: '1px solid rgba(76,186,122,0.15)', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,122,74,0.12)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(26,122,74,0.06)'}>
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(76,186,122,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="refresh" size={14} color={C.greenLight} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 600, color: C.greenLight }}>Renew Lease</p>
                    <p style={{ fontSize: '0.65rem', color: 'rgba(76,186,122,0.6)' }}>{expired ? "Lease expired — renew now" : "Set new end date and rent"}</p>
                  </div>
                  <Icon name="chevron-right" size={14} color="rgba(76,186,122,0.5)" />
                </button>
              )}
              <button onClick={() => { onClose(); onTermination(tenant); }} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.7rem 0.9rem', borderRadius: '3px', background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.15)', cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(224,90,74,0.12)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(224,90,74,0.06)'}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(224,90,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="file-x" size={14} color={C.redLight} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: C.redLight }}>Terminate Lease</p>
                  <p style={{ fontSize: '0.65rem', color: 'rgba(224,90,74,0.6)' }}>End tenancy and free the unit</p>
                </div>
                <Icon name="chevron-right" size={14} color="rgba(224,90,74,0.5)" />
              </button>
            </div>
          </div>
        </div>
        <div style={modalFooter}>
          <button onClick={onClose} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Close</button>
          <button onClick={() => { onClose(); onEdit(tenant); }} style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }}>Edit Tenant</button>
        </div>
      </div>
    </div>
  );
}


function TenantCard({ tenant, onProfile, onEdit, onRepayment, onRenewal, onDelete, navigate }) {
  const isExpiring = leaseExpiresSoon(tenant.leaseEnd);
  const isExpired = leaseExpired(tenant.leaseEnd);
  const total = tenant.paymentHistory.onTime + tenant.paymentHistory.late + tenant.paymentHistory.missed;

  const actionBtnStyle = (bg, color) => ({
    flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
    padding: '0.45rem 0.4rem', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 500,
    fontFamily: F.mono, letterSpacing: '0.03em', border: 'none', cursor: 'pointer',
    background: bg, color: color, transition: 'all 0.15s', whiteSpace: 'nowrap',
  });

  return (
    <div style={{ ...cardStyle, position: 'relative', transition: 'box-shadow 0.2s, border-color 0.2s' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'; e.currentTarget.style.borderColor = 'rgba(245,240,232,0.15)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = C.border; }}>

      <ReliabilityStamp score={tenant.reliabilityScore} />

      <div style={{ padding: '1.1rem' }}>
        {/* Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem', paddingRight: '4.5rem' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(232,160,18,0.12)', color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.68rem', flexShrink: 0 }}>
            {initials(tenant.name)}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 600, color: C.white, fontFamily: F.dm, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tenant.name}</p>
            <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, marginTop: '1px' }}>{tenant.unit} · {tenant.property}</p>
          </div>
        </div>

        {/* Rent / balance */}
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem', marginBottom: '0.6rem' }}>
          <div>
            <span style={{ fontSize: '1.05rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.02em' }}>{format(tenant.rentAmount)}</span>
            <span style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, marginLeft: '0.3rem' }}>/{tenant.frequency}</span>
          </div>
          {tenant.balance > 0 ? (
            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: C.redLight, fontFamily: F.mono }}>{format(tenant.balance)} owed</span>
          ) : (
            <span style={{ fontSize: '0.72rem', fontWeight: 500, color: C.greenLight, fontFamily: F.mono, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Icon name="check" size={10} /> Paid up
            </span>
          )}
        </div>

        {/* Lease dates */}
        <p style={{ fontSize: '0.68rem', color: isExpired ? C.redLight : isExpiring ? C.gold : 'rgba(245,240,232,0.35)', fontFamily: F.mono, marginBottom: '0.5rem' }}>
          {isExpired ? "Lease expired: " : "Lease ends: "}
          {formatDate(tenant.leaseEnd)}
        </p>

        {/* Payment summary */}
        <p style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, marginBottom: '1rem' }}>
          {tenant.paymentHistory.onTime}/{total || 0} payments on time
          {tenant.paymentHistory.missed > 0 && <span style={{ color: C.redLight }}> · {tenant.paymentHistory.missed} missed</span>}
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', flexWrap: 'wrap', paddingTop: '0.8rem', borderTop: `1px solid ${C.border}` }}>
          <button onClick={() => navigate(`/landlord/tenants/${tenant.id}`)} style={actionBtnStyle('rgba(58,143,212,0.12)', C.blue)}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(58,143,212,0.22)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(58,143,212,0.12)'}>
            <Icon name="user" size={11} /> Profile
          </button>
          <button onClick={() => onEdit(tenant)} style={actionBtnStyle(C.black, 'rgba(245,240,232,0.4)')}
            onMouseEnter={e => { e.currentTarget.style.background = C.muted; e.currentTarget.style.color = C.white; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.black; e.currentTarget.style.color = 'rgba(245,240,232,0.4)'; }}>
            <Icon name="edit" size={11} /> Edit
          </button>
          <button onClick={() => navigate("/landlord/payments")} style={actionBtnStyle(C.black, 'rgba(245,240,232,0.4)')}
            onMouseEnter={e => { e.currentTarget.style.background = C.muted; e.currentTarget.style.color = C.white; }}
            onMouseLeave={e => { e.currentTarget.style.background = C.black; e.currentTarget.style.color = 'rgba(245,240,232,0.4)'; }}>
            <Icon name="credit-card" size={11} /> Payments
          </button>
          {tenant.balance > 0 && (
            <button onClick={() => onRepayment(tenant)} style={actionBtnStyle('rgba(58,143,212,0.08)', C.blue)}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(58,143,212,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(58,143,212,0.08)'}>
              <Icon name="rand" size={11} /> Plan
            </button>
          )}
          {(isExpiring || isExpired) && (
            <button onClick={() => onRenewal(tenant)} style={actionBtnStyle('rgba(26,122,74,0.08)', C.greenLight)}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,122,74,0.18)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(26,122,74,0.08)'}>
              <Icon name="refresh" size={11} /> Renew
            </button>
          )}
          <button onClick={() => onDelete(tenant)} style={{ padding: '0.45rem', borderRadius: '3px', background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.12)', cursor: 'pointer', color: C.redLight, transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(224,90,74,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(224,90,74,0.08)'}>
            <Icon name="trash" size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}


function PropertyGroup({ property, tenants, accent, onProfile, onEdit, onRepayment, onRenewal, onDelete, navigate, viewMode }) {
  const [collapsed, setCollapsed] = useState(false);
  const totalRent = tenants.reduce((s, t) => s + t.rentAmount, 0);
  const totalBalance = tenants.reduce((s, t) => s + t.balance, 0);
  const alerts = tenants.filter(t => t.balance > 0 || leaseExpiresSoon(t.leaseEnd) || leaseExpired(t.leaseEnd) || t.reliabilityScore === "High Risk").length;

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <button onClick={() => setCollapsed(c => !c)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.8rem 1rem', borderRadius: '4px', border: accent.border,
        background: accent.headerBg, cursor: 'pointer', marginBottom: '0.8rem',
        transition: 'background 0.15s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,240,232,0.04)'}
        onMouseLeave={e => e.currentTarget.style.background = accent.headerBg}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: accent.dot, flexShrink: 0 }} />
          <Icon name="building" size={14} color={accent.dot} />
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: accent.dot, fontFamily: F.bebas, letterSpacing: '0.03em' }}>{property}</span>
          <span style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{tenants.length} tenant{tenants.length !== 1 ? "s" : ""}</span>
          {alerts > 0 && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.58rem', fontWeight: 600, fontFamily: F.mono, letterSpacing: '0.04em', color: C.gold, background: 'rgba(232,160,18,0.1)', border: '1px solid rgba(232,160,18,0.2)', padding: '0.1rem 0.4rem', borderRadius: '3px' }}>
              <Icon name="warning" size={8} /> {alerts}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.68rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>
            <span>Rent: <span style={{ fontWeight: 600, color: C.white }}>{format(totalRent)}/mo</span></span>
            {totalBalance > 0 && <span>Owed: <span style={{ fontWeight: 600, color: C.redLight }}>{format(totalBalance)}</span></span>}
          </div>
          <Icon name={collapsed ? "chevron-down" : "chevron-up"} size={14} color="rgba(245,240,232,0.3)" />
        </div>
      </button>
      
      {!collapsed && (
        viewMode === "grid" ? (
          <div className="tenants-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.8rem' }}>
            {tenants.map(t => <TenantCard key={t.id} tenant={t} accent={accent} onProfile={onProfile} onEdit={onEdit} onRepayment={onRepayment} onRenewal={onRenewal} onDelete={onDelete} navigate={navigate} />)}
          </div>
        ) : (
          <div style={cardStyle}>
            {tenants.map(t => (
              <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.7rem 1rem', borderBottom: `1px solid ${C.border}`, transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = C.muted}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(58,143,212,0.12)', color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.6rem', flexShrink: 0 }}>
                  {initials(t.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: C.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.name}</p>
                  <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{t.unit}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, color: C.white }}>{format(t.rentAmount)}</p>
                  {t.balance > 0 && <p style={{ fontSize: '0.62rem', color: C.redLight }}>{format(t.balance)} owed</p>}
                </div>
                <ScoreBadge score={t.reliabilityScore} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                  <button onClick={() => onProfile(t)} style={{ fontSize: '0.68rem', fontWeight: 500, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>View</button>
                  <button onClick={() => onEdit(t)} style={{ fontSize: '0.68rem', fontWeight: 500, color: 'rgba(245,240,232,0.4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}
                    onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                    onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>Edit</button>
                  <button onClick={() => onDelete(t)} style={{ padding: '0.2rem', borderRadius: '3px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.25)' }}
                    onMouseEnter={e => e.currentTarget.style.color = C.redLight}
                    onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.25)'}>
                    <Icon name="trash" size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}


function DeleteModal({ tenant, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  return (
    <div style={modalOverlay}>
      <div style={{ width: '100%', maxWidth: 380, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(224,90,74,0.1)', border: '1px solid rgba(224,90,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="trash" size={18} color={C.redLight} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: C.white }}>Remove Tenant</h3>
            <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>This cannot be undone</p>
          </div>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.5)', marginBottom: '1.2rem', lineHeight: 1.5 }}>
          Are you sure you want to remove <span style={{ fontWeight: 600, color: C.white }}>{tenant?.name}</span>?
        </p>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button onClick={onClose} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
          <button onClick={() => { onConfirm(tenant.id); onClose(); }} disabled={loading} style={{ ...btnDanger, flex: 1, justifyContent: 'center' }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: C.white, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <><Icon name="trash" size={14} /> Remove</>}
          </button>
        </div>
      </div>
    </div>
  );
}


function RepaymentModal({ tenant, onClose, onConfirm }) {
  const [instalments, setInstalments] = useState("3");
  const [startDate, setStartDate] = useState("");
  const [frequency, setFrequency] = useState("Monthly");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const instNum = Math.max(1, Number(instalments) || 1);
  const amountPerPeriod = tenant.balance > 0 ? Math.ceil(tenant.balance / instNum) : 0;

  const schedule = Array.from({ length: instNum }, (_, i) => {
    if (!startDate) return null;
    const d = new Date(startDate);
    if (frequency === "Monthly") d.setMonth(d.getMonth() + i);
    else d.setDate(d.getDate() + i * 7);
    const isLast = i === instNum - 1;
    return { no: i + 1, date: d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }), amount: isLast ? tenant.balance - amountPerPeriod * (instNum - 1) : amountPerPeriod };
  });

  function handleConfirm() {
    const e = {};
    if (!instalments || instNum < 1) e.instalments = "Must be at least 1";
    if (!startDate) e.startDate = "Required";
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => { onConfirm(tenant.id, { instalments: instNum, startDate, frequency, amountPerPeriod }); setLoading(false); onClose(); }, 1200);
  }

  const radioStyle = (active) => ({
    flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem',
    borderRadius: '3px', border: `1px solid ${active ? 'rgba(58,143,212,0.4)' : C.border}`,
    background: active ? 'rgba(58,143,212,0.08)' : 'transparent',
    cursor: 'pointer', transition: 'all 0.15s',
  });

  return (
    <div style={modalOverlay}>
      <div style={{ ...modalShell, width: '100%', maxWidth: 460 }}>
        <div style={modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '6px', background: 'rgba(58,143,212,0.12)', border: '1px solid rgba(58,143,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="rand" size={16} color={C.blue} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Create Repayment Plan</h3>
              <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{tenant.name} · Outstanding: {format(tenant.balance)}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={modalBody}>
          {/* Balance */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1rem', borderRadius: '4px', background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.2)' }}>
            <div>
              <p style={{ fontSize: '0.58rem', fontWeight: 600, color: C.redLight, fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Outstanding Balance</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 700, color: C.redLight, fontFamily: F.bebas, letterSpacing: '0.03em', marginTop: '0.15rem' }}>{format(tenant.balance)}</p>
            </div>
            <Icon name="credit-card" size={24} color="rgba(224,90,74,0.4)" />
          </div>

          <Field label="Number of Instalments" error={errors.instalments}>
            <input type="number" min="1" max="24" value={instalments} onChange={e => { setInstalments(e.target.value); setErrors(er => ({ ...er, instalments: undefined })); }} style={inputStyle(errors.instalments)} placeholder="e.g. 3" />
            {instNum > 0 && tenant.balance > 0 && <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginTop: '0.3rem' }}>≈ {format(amountPerPeriod)} per instalment</p>}
          </Field>

          <Field label="Payment Frequency">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {["Monthly", "Weekly"].map(f => (
                <label key={f} style={radioStyle(frequency === f)}>
                  <input type="radio" style={{ accentColor: C.blue, width: 14, height: 14 }} checked={frequency === f} onChange={() => setFrequency(f)} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: C.white }}>{f}</span>
                </label>
              ))}
            </div>
          </Field>

          <Field label="First Payment Date" error={errors.startDate}>
            <input type="date" value={startDate} onChange={e => { setStartDate(e.target.value); setErrors(er => ({ ...er, startDate: undefined })); }} style={inputStyle(errors.startDate)} />
          </Field>

          {startDate && instNum > 0 && (
            <div>
              <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Payment Schedule Preview</p>
              <div style={{ borderRadius: '3px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
                {schedule.map(row => row && (
                  <div key={row.no} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.6rem 0.8rem', background: 'rgba(245,240,232,0.02)', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(58,143,212,0.15)', color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.6rem' }}>{row.no}</span>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.4)' }}>{row.date}</span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: C.white }}>{format(row.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(58,143,212,0.06)', border: '1px solid rgba(58,143,212,0.15)' }}>
            <Icon name="info" size={13} color={C.blue} style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '0.62rem', color: 'rgba(58,143,212,0.7)', lineHeight: 1.4 }}>The tenant will be notified on their mobile app. Each instalment tracks on the Payments page.</p>
          </div>
        </div>
        <div style={modalFooter}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
          <button onClick={handleConfirm} disabled={loading} style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: C.black, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <><Icon name="rand" size={14} /> Create Plan</>}
          </button>
        </div>
      </div>
    </div>
  );
}


function RenewalModal({ tenant, onClose, onConfirm }) {
  const [newLeaseEnd, setNewLeaseEnd] = useState("");
  const [newRent, setNewRent] = useState(String(tenant.rentAmount));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const rentChanged = Number(newRent) !== tenant.rentAmount;

  function validate() { const e = {}; if (!newLeaseEnd) e.newLeaseEnd = "Required"; if (!newRent.trim()) e.newRent = "Required"; if (newLeaseEnd && tenant.leaseEnd && new Date(newLeaseEnd) <= new Date(tenant.leaseEnd)) e.newLeaseEnd = "Must be after current lease end"; return e; }
  function handleConfirm() { const e = validate(); if (Object.keys(e).length) { setErrors(e); return; } setLoading(true); setTimeout(() => { onConfirm(tenant.id, { leaseEnd: newLeaseEnd, rentAmount: Number(newRent) }); setLoading(false); onClose(); }, 1000); }

  return (
    <div style={modalOverlay}>
      <div style={{ ...modalShell, width: '100%', maxWidth: 440 }}>
        <div style={modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '6px', background: 'rgba(26,122,74,0.12)', border: '1px solid rgba(76,186,122,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="refresh" size={16} color={C.greenLight} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Renew Lease</h3>
              <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{tenant.name} · {tenant.unit}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={modalBody}>
          <div style={{ borderRadius: '3px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            {[
              ["Current Lease End", tenant.leaseEnd || "—"],
              ["Current Rent", format(tenant.rentAmount)]
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0.9rem', background: 'rgba(245,240,232,0.02)', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.4)' }}>{label}</span>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: C.white }}>{val}</span>
              </div>
            ))}
          </div>
          <Field label="New Lease End Date" error={errors.newLeaseEnd}>
            <input type="date" value={newLeaseEnd} onChange={e => { setNewLeaseEnd(e.target.value); setErrors(er => ({ ...er, newLeaseEnd: undefined })); }} style={inputStyle(errors.newLeaseEnd)} />
          </Field>
          <Field label="Monthly Rent (R)" error={errors.newRent}>
            <input type="number" min="0" value={newRent} onChange={e => { setNewRent(e.target.value); setErrors(er => ({ ...er, newRent: undefined })); }} style={inputStyle(errors.newRent)} placeholder="e.g. 6500" />
            {rentChanged && Number(newRent) > 0 && (
              <p style={{ fontSize: '0.62rem', color: C.gold, marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Icon name="warning" size={10} /> Rent will change from {format(tenant.rentAmount)} → {format(Number(newRent))}
              </p>
            )}
          </Field>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(26,122,74,0.06)', border: '1px solid rgba(76,186,122,0.15)' }}>
            <Icon name="info" size={13} color={C.greenLight} style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '0.62rem', color: 'rgba(76,186,122,0.7)', lineHeight: 1.4 }}>The tenant will be notified of their renewal on the mobile app.</p>
          </div>
        </div>
        <div style={modalFooter}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
          <button onClick={handleConfirm} disabled={loading} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', background: C.greenLight }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: C.black, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <><Icon name="refresh" size={14} /> Renew Lease</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function TerminationModal({ tenant, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [vacateDate, setVacate] = useState("");
  const [customNote, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const canProceed = reason !== "" && vacateDate !== "" && confirmed;

  function validate() { const e = {}; if (!reason) e.reason = "Please select a reason"; if (!vacateDate) e.vacateDate = "Required"; return e; }
  function handleConfirm() { const e = validate(); if (Object.keys(e).length) { setErrors(e); return; } setLoading(true); setTimeout(() => { onConfirm(tenant.id, { reason: reason === "Other" ? customNote : reason, vacateDate }); setLoading(false); onClose(); }, 1200); }

  return (
    <div style={modalOverlay}>
      <div style={{ ...modalShell, width: '100%', maxWidth: 460 }}>
        <div style={modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '6px', background: 'rgba(224,90,74,0.12)', border: '1px solid rgba(224,90,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="file-x" size={16} color={C.redLight} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Terminate Lease</h3>
              <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{tenant.name} · {tenant.unit} · {tenant.property}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={modalBody}>
          <Field label="Reason for Termination" error={errors.reason}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {TERMINATION_REASONS.map(r => (
                <label key={r} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.8rem', borderRadius: '3px', border: `1px solid ${reason === r ? 'rgba(224,90,74,0.4)' : C.border}`, background: reason === r ? 'rgba(224,90,74,0.08)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s' }}>
                  <input type="radio" name="termination-reason" value={r} checked={reason === r} onChange={() => { setReason(r); setErrors(e => ({ ...e, reason: undefined })); }} style={{ accentColor: C.redLight, width: 14, height: 14 }} />
                  <span style={{ fontSize: '0.75rem', color: C.white }}>{r}</span>
                </label>
              ))}
            </div>
          </Field>
          {reason === "Other" && (
            <Field label="Describe the reason">
              <textarea rows={3} value={customNote} onChange={e => setNote(e.target.value)} placeholder="Provide details..." style={{ ...inputStyle(false), resize: 'vertical', minHeight: 60 }} />
            </Field>
          )}
          <Field label="Vacate Date" error={errors.vacateDate}>
            <input type="date" value={vacateDate} onChange={e => { setVacate(e.target.value); setErrors(er => ({ ...er, vacateDate: undefined })); }} style={inputStyle(errors.vacateDate)} />
            <p style={{ fontSize: '0.58rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, marginTop: '0.2rem' }}>Unit marked Vacant and tenant mobile access deactivated on this date.</p>
          </Field>
          {tenant.balance > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(232,160,18,0.06)', border: '1px solid rgba(232,160,18,0.15)' }}>
              <Icon name="warning" size={13} color={C.gold} style={{ flexShrink: 0, marginTop: '1px' }} />
              <p style={{ fontSize: '0.62rem', color: C.gold }}>Outstanding balance of <span style={{ fontWeight: 700 }}>{format(tenant.balance)}</span> will be flagged for collections on termination.</p>
            </div>
          )}
          <div style={{ padding: '0.8rem', borderRadius: '4px', background: 'rgba(224,90,74,0.04)', border: '1px solid rgba(224,90,74,0.12)' }}>
            <p style={{ fontSize: '0.62rem', fontWeight: 600, color: C.redLight, fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>What happens on termination</p>
            {[
              "Tenant's mobile app access is deactivated on the vacate date",
              "Unit is marked as Vacant and available for new tenants",
              "A termination record is archived for audit purposes",
              ...(tenant.balance > 0 ? ["Outstanding balance is flagged and sent to collections"] : []),
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontSize: '0.62rem', color: 'rgba(224,90,74,0.6)', marginTop: i > 0 ? '0.3rem' : 0 }}>
                <span style={{ flexShrink: 0 }}>•</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ accentColor: C.redLight, width: 14, height: 14, marginTop: '2px', flexShrink: 0 }} />
            <span style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.5)', lineHeight: 1.4 }}>I understand this will terminate <span style={{ fontWeight: 600, color: C.white }}>{tenant.name}</span>'s lease and cannot be easily undone.</span>
          </label>
        </div>
        <div style={modalFooter}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
          <button onClick={handleConfirm} disabled={!canProceed || loading} style={{ ...btnDanger, flex: 1, justifyContent: 'center', opacity: canProceed ? 1 : 0.5, cursor: canProceed ? 'pointer' : 'not-allowed' }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: C.white, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <><Icon name="file-x" size={14} /> Terminate Lease</>}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function Tenants() {
  useDocumentTitle("Tenants");
  const navigate = useNavigate();
  const toast = useToast();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [profileTenant, setProfile] = useState(null);
  const [editTenant, setEditTenant] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [deleteTenant, setDelete] = useState(null);
  const [repaymentTenant, setRepayment] = useState(null);
  const [renewalTenant, setRenewal] = useState(null);
  const [terminationTenant, setTermination] = useState(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const { data } = await axios.get(`${API}/tenants`, { headers: { Authorization: `Bearer ${token}` } });
      setTenants((data.tenants || []).map(mapTenantFromAPI));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load tenants");
      toast.error("Failed to load tenants.");
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const handleTenantCreated = () => { fetchTenants(); toast.success("Tenant registered!"); };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.delete(`${API}/tenants/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setTenants(prev => prev.filter(t => t.id !== id));
      toast.success("Tenant removed.");
    } catch (err) { toast.error(err.response?.data?.error || "Failed to delete tenant"); }
  };

  const filtered = tenants.filter(t => {
    const matchScore = filter === "All" || t.reliabilityScore === filter;
    const q = search.toLowerCase();
    return matchScore && (!q || [t.name, t.email, t.phone, t.unit, t.property].some(s => (s || "").toLowerCase().includes(q)));
  });

  const grouped = PROPERTIES.reduce((acc, prop) => {
    const group = filtered.filter(t => t.property === prop);
    if (group.length > 0) acc[prop] = group;
    return acc;
  }, {});
  
  const needsAttention = tenants.filter(t => t.balance > 0 || leaseExpiresSoon(t.leaseEnd) || leaseExpired(t.leaseEnd) || t.reliabilityScore === "High Risk").length;

  
  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    subtitle: { fontSize: '0.75rem', color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, marginTop: '0.3rem' },
    actions: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    viewToggle: { display: 'flex', background: C.muted, borderRadius: '3px', padding: '2px' },
    viewBtn: (active) => ({ padding: '0.4rem 0.7rem', borderRadius: '2px', fontSize: '0.72rem', fontWeight: 500, fontFamily: F.mono, letterSpacing: '0.04em', border: 'none', cursor: 'pointer', background: active ? C.muted2 : 'transparent', color: active ? C.gold : 'rgba(245,240,232,0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.15s' }),
    refreshBtn: { padding: '0.5rem', borderRadius: '3px', background: C.muted, border: `1px solid ${C.border}`, cursor: 'pointer', color: 'rgba(245,240,232,0.3)', display: 'flex', transition: 'all 0.15s' },
    toolbar: { ...cardStyle, padding: '0', marginBottom: '1.2rem' },
    toolbarInner: { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', flexWrap: 'wrap' },
    filterBtn: (active) => ({ padding: '0.4rem 0.8rem', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 600, fontFamily: F.mono, letterSpacing: '0.04em', border: `1px solid ${active ? C.gold : C.border}`, background: active ? 'rgba(232,160,18,0.12)' : 'transparent', color: active ? C.gold : 'rgba(245,240,232,0.4)', cursor: 'pointer', transition: 'all 0.15s' }),
    searchWrap: { position: 'relative', marginLeft: 'auto' },
    searchIcon: { position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.25)' },
    searchInput: { padding: '0.5rem 0.8rem 0.5rem 2.25rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, fontSize: '0.78rem', outline: 'none', width: 200 },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: 'rgba(245,240,232,0.3)', gap: '0.8rem' },
    empty: { padding: '4rem 0', textAlign: 'center', color: 'rgba(245,240,232,0.3)', fontSize: '0.85rem' },
    footer: { fontSize: '0.65rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, textAlign: 'center', marginTop: '1rem' },
  };

  return (
    <div style={S.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 640px) { .tenants-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (min-width: 1024px) { .tenants-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (min-width: 1280px) { .tenants-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        input:focus, select:focus { border-color: ${C.borderFocus} !important; }
      `}</style>

      {editTenant && <EditTenantModal tenant={editTenant} onClose={() => setEditTenant(null)} onSave={fetchTenants} />}
      {showAdd && <LandlordRegisterTenantModal onClose={() => setShowAdd(false)} onCreated={handleTenantCreated} />}
      {deleteTenant && <DeleteModal tenant={deleteTenant} onClose={() => setDelete(null)} onConfirm={handleDelete} />}
      {repaymentTenant && <RepaymentModal tenant={repaymentTenant} onClose={() => setRepayment(null)} onConfirm={(id, plan) => { setRepayment(null); toast.success("Repayment plan created!"); }} />}
      {renewalTenant && <RenewalModal tenant={renewalTenant} onClose={() => setRenewal(null)} onConfirm={(id, data) => { setTenants(prev => prev.map(t => t.id === id ? { ...t, leaseEnd: data.leaseEnd, rentAmount: data.rentAmount } : t)); setRenewal(null); toast.success("Lease renewed!"); }} />}
      {terminationTenant && <TerminationModal tenant={terminationTenant} onClose={() => setTermination(null)} onConfirm={(id, data) => { setTenants(prev => prev.map(t => t.id === id ? { ...t, status: "Terminated", terminationReason: data.reason, vacateDate: data.vacateDate } : t)); setTermination(null); toast.success("Lease terminated."); }} />}

      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}><Icon name="user" size={24} color={C.gold} />Tenants</h1>
          <p style={S.subtitle}>
            {loading ? "Loading..." : `${tenants.length} tenants across ${PROPERTIES.length} properties`}
            {!loading && needsAttention > 0 && (
              <span style={{ marginLeft: '0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.65rem', fontWeight: 600, color: C.gold }}>
                <Icon name="warning" size={10} /> {needsAttention} need attention
              </span>
            )}
          </p>
        </div>
        <div style={S.actions}>
          <div style={S.viewToggle}>
            {["grid", "list"].map(v => (
              <button key={v} onClick={() => setViewMode(v)} style={S.viewBtn(viewMode === v)}>
                <Icon name={v === "grid" ? "grid" : "list"} size={13} /> {v}
              </button>
            ))}
          </div>
          <button onClick={() => setShowAdd(true)} style={btnPrimary}><Icon name="plus" size={14} />Add Tenant</button>
          <button onClick={fetchTenants} style={S.refreshBtn} title="Refresh"
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="refresh" size={15} />
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.8rem 1rem', borderRadius: '3px', background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name="warning" size={16} color={C.redLight} />
          <p style={{ fontSize: '0.75rem', color: C.redLight, flex: 1 }}>{error}</p>
          <button onClick={fetchTenants} style={{ fontSize: '0.72rem', color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono, fontWeight: 500 }}>Retry</button>
        </div>
      )}
      
      {loading && (
        <div style={S.loading}>
          <span style={{ width: 20, height: 20, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          Loading tenants...
        </div>
      )}

      {!loading && !error && (
        <>
          <div style={S.toolbar}>
            <div style={S.toolbarInner}>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {FILTERS.map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={S.filterBtn(filter === f)}>
                    {f}{f !== "All" && <span style={{ marginLeft: '0.3rem', opacity: 0.6 }}>{tenants.filter(t => t.reliabilityScore === f).length}</span>}
                  </button>
                ))}
              </div>
              <div style={S.searchWrap}>
                <Icon name="search" size={14} style={S.searchIcon} />
                <input type="text" placeholder="Search tenants..." value={search} onChange={e => setSearch(e.target.value)} style={S.searchInput} />
              </div>
            </div>
          </div>

          {Object.keys(grouped).length === 0 && (
            <div style={S.empty}>
              <p style={{ marginBottom: '0.5rem' }}>{search || filter !== "All" ? "No tenants match your filters" : "No tenants yet"}</p>
              <button onClick={() => { setFilter("All"); setSearch(""); }} style={{ fontSize: '0.7rem', color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}>Clear filters</button>
            </div>
          )}

          {Object.entries(grouped).map(([property, group]) => (
            <PropertyGroup key={property} property={property} tenants={group} accent={propertyAccents[property] ?? propertyAccents["Hillbrow Heights"]} viewMode={viewMode}
              onProfile={setProfile} onEdit={setEditTenant} onRepayment={setRepayment} onRenewal={setRenewal} onDelete={setDelete} navigate={navigate} />
          ))}

          {Object.keys(grouped).length > 0 && (
            <p style={S.footer}>Showing {filtered.length} of {tenants.length} tenants</p>
          )}
        </>
      )}
    </div>
  );
}