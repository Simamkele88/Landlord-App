/* eslint-disable no-unused-vars */
// LANDLORD REPAYMENT PLANS PAGE 
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

const cardStyle = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: "6px", overflow: "hidden",
};
const btnPrimary = {
  background: C.gold, color: C.black, border: "none",
  padding: "0.6rem 1.4rem", fontSize: "0.76rem", fontWeight: 700,
  fontFamily: F.dm, letterSpacing: "0.04em", borderRadius: "3px",
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem",
};
const btnGhost = {
  background: "transparent", color: "rgba(245,240,232,0.5)",
  border: `1px solid ${C.border}`, padding: "0.6rem 1.2rem",
  fontSize: "0.76rem", fontWeight: 500, fontFamily: F.dm,
  letterSpacing: "0.04em", borderRadius: "3px", cursor: "pointer",
};

function fmt(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
function initials(name = "") { return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(); }

const inputStyle = (error) => ({
  width: "100%", fontSize: "0.82rem", padding: "0.6rem 0.9rem", borderRadius: "3px",
  background: C.black, border: `1px solid ${error ? "rgba(224,90,74,0.5)" : C.border}`,
  color: C.white, fontFamily: F.dm, outline: "none",
});
const selectStyle = (error) => ({
  ...inputStyle(error),
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat", backgroundPosition: "right 0.75rem center", paddingRight: "2rem",
});
const pillStyle = (color, bg, border) => ({
  display: "inline-flex", alignItems: "center", gap: "0.3rem",
  fontSize: "0.58rem", fontWeight: 700, padding: "0.12rem 0.5rem",
  borderRadius: "3px", fontFamily: F.mono, letterSpacing: "0.04em",
  textTransform: "uppercase", color, background: bg, border,
});

const PLAN_STATUS = {
  pending:   { color: C.gold,       bg: "rgba(232,160,18,0.08)", border: "1px solid rgba(232,160,18,0.15)", label: "Pending Approval" },
  active:    { color: C.blue,       bg: "rgba(58,143,212,0.08)", border: "1px solid rgba(58,143,212,0.15)", label: "Active" },
  completed: { color: C.greenLight, bg: "rgba(26,122,74,0.06)",  border: "1px solid rgba(76,186,122,0.12)", label: "Completed" },
  defaulted: { color: C.redLight,   bg: "rgba(224,90,74,0.08)",  border: "1px solid rgba(224,90,74,0.15)", label: "Defaulted" },
  rejected:  { color: "rgba(245,240,232,0.3)", bg: "rgba(245,240,232,0.04)", border: "1px solid rgba(245,240,232,0.08)", label: "Rejected" },
};

function PlanStatusBadge({ status }) {
  const cfg = PLAN_STATUS[status] || PLAN_STATUS.active;
  return (
    <span style={pillStyle(cfg.color, cfg.bg, cfg.border)}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function InstalmentBadge({ status }) {
  const config = {
    paid:    { color: C.greenLight },
    pending: { color: C.gold },
    overdue: { color: C.redLight },
  };
  const cfg = config[status] || { color: "rgba(245,240,232,0.3)" };
  return (
    <span style={pillStyle(cfg.color, `${cfg.color}15`, `1px solid ${cfg.color}25`)}>
      {status}
    </span>
  );
}

function CreatePlanModal({ tenants, onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({ tenant_id: "", total_amount: "", instalments: "3", frequency: "monthly", start_date: "", note: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});

  const instNum = Math.max(1, Number(form.instalments) || 1);
  const amountPer = form.total_amount && instNum > 0 ? Math.ceil(Number(form.total_amount) / instNum) : 0;

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: undefined })); }

  function validate() {
    const e = {};
    if (!form.tenant_id)                             e.tenant_id    = "Required";
    if (!form.total_amount || Number(form.total_amount) <= 0) e.total_amount = "Enter a valid amount";
    if (!form.instalments  || instNum < 1)           e.instalments  = "Min 1";
    if (!form.start_date)                            e.start_date   = "Required";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`${API}/repayment-plans`, {
        tenant_id: form.tenant_id, total_amount: Number(form.total_amount),
        instalments: instNum, frequency: form.frequency,
        start_date: form.start_date, note: form.note || undefined,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Repayment plan created!");
      onCreated(data.plan);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create plan");
    } finally { setLoading(false); }
  }

  const preview = Array.from({ length: Math.min(instNum, 6) }, (_, i) => {
    if (!form.start_date) return null;
    const d = new Date(form.start_date);
    if (form.frequency === "monthly")   d.setMonth(d.getMonth() + i);
    else if (form.frequency === "biweekly") d.setDate(d.getDate() + i * 14);
    else d.setDate(d.getDate() + i * 7);
    const isLast = i === instNum - 1;
    const last   = Number(form.total_amount) - amountPer * (instNum - 1);
    return { no: i + 1, date: d.toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }), amount: isLast ? last : amountPer };
  }).filter(Boolean);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div style={{ width: "100%", maxWidth: 520, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: "6px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: "0.04em" }}>Create Repayment Plan</h3>
          <button onClick={onClose} style={{ padding: "0.2rem", background: "transparent", border: "none", cursor: "pointer", color: "rgba(245,240,232,0.3)" }}><Icon name="x" size={18} /></button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "1.2rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {/* Tenant */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <label style={{ fontSize: "0.65rem", fontWeight: 600, color: "rgba(245,240,232,0.5)", fontFamily: F.mono, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Tenant{errors.tenant_id && <span style={{ color: C.redLight, fontWeight: 400, textTransform: "none", marginLeft: "0.4rem" }}>— {errors.tenant_id}</span>}
            </label>
            <select value={form.tenant_id} onChange={e => {
              set("tenant_id", e.target.value);
              const t = tenants.find(tn => tn.id === e.target.value);
              if (t?.balance) set("total_amount", String(t.balance));
            }} style={selectStyle(errors.tenant_id)}>
              <option value="">Select tenant...</option>
              {tenants.filter(t => Number(t.balance || 0) > 0).map(t => (
                <option key={t.id} value={t.id}>{t.name} — {t.unit} ({fmt(t.balance)} owed)</option>
              ))}
              {tenants.filter(t => !Number(t.balance || 0)).map(t => (
                <option key={t.id} value={t.id}>{t.name} — {t.unit}</option>
              ))}
            </select>
          </div>

          {/* Amount + Instalments */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            {[
              { key: "total_amount", label: "Total Amount (R)", type: "number", placeholder: "e.g. 15000" },
              { key: "instalments",  label: "Instalments",      type: "number", placeholder: "e.g. 3", min: 1, max: 24 },
            ].map(f => (
              <div key={f.key} style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                <label style={{ fontSize: "0.65rem", fontWeight: 600, color: "rgba(245,240,232,0.5)", fontFamily: F.mono, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  {f.label}{errors[f.key] && <span style={{ color: C.redLight, fontWeight: 400, textTransform: "none", marginLeft: "0.4rem" }}>— {errors[f.key]}</span>}
                </label>
                <input type={f.type} min={f.min} max={f.max} value={form[f.key]} onChange={e => set(f.key, e.target.value)} style={inputStyle(errors[f.key])} placeholder={f.placeholder} />
                {f.key === "instalments" && amountPer > 0 && (
                  <p style={{ fontSize: "0.6rem", color: "rgba(245,240,232,0.2)", fontFamily: F.mono }}>≈ {fmt(amountPer)} per instalment</p>
                )}
              </div>
            ))}
          </div>

          {/* Frequency + Start Date */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.65rem", fontWeight: 600, color: "rgba(245,240,232,0.5)", fontFamily: F.mono, letterSpacing: "0.06em", textTransform: "uppercase" }}>Frequency</label>
              <select value={form.frequency} onChange={e => set("frequency", e.target.value)} style={selectStyle(false)}>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
              <label style={{ fontSize: "0.65rem", fontWeight: 600, color: "rgba(245,240,232,0.5)", fontFamily: F.mono, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                First Payment Date{errors.start_date && <span style={{ color: C.redLight, fontWeight: 400, textTransform: "none", marginLeft: "0.4rem" }}>— {errors.start_date}</span>}
              </label>
              <input type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} style={inputStyle(errors.start_date)} />
            </div>
          </div>

          {/* Note */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
            <label style={{ fontSize: "0.65rem", fontWeight: 600, color: "rgba(245,240,232,0.5)", fontFamily: F.mono, letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Note <span style={{ color: "rgba(245,240,232,0.25)", fontWeight: 400, textTransform: "none" }}>(optional)</span>
            </label>
            <textarea rows={2} value={form.note} onChange={e => set("note", e.target.value)} placeholder="e.g. Tenant agreed to pay on the 15th of each month"
              style={{ ...inputStyle(false), resize: "vertical", minHeight: 50, fontSize: "0.72rem" }} />
          </div>

          {/* Schedule Preview */}
          {preview.length > 0 && (
            <div>
              <p style={{ fontSize: "0.6rem", fontWeight: 600, color: "rgba(245,240,232,0.3)", fontFamily: F.mono, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                Schedule Preview {instNum > 6 ? `(first 6 of ${instNum})` : ""}
              </p>
              <div style={{ borderRadius: "3px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
                {preview.map(row => (
                  <div key={row.no} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.45rem 0.7rem", borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(58,143,212,0.12)", color: C.blue, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.bebas, fontSize: "0.6rem" }}>{row.no}</span>
                      <span style={{ fontSize: "0.68rem", color: "rgba(245,240,232,0.4)" }}>{row.date}</span>
                    </div>
                    <span style={{ fontSize: "0.7rem", fontWeight: 600, color: C.white }}>{fmt(row.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: "0.8rem", padding: "1rem 1.5rem 1.5rem", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1 }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ ...btnPrimary, flex: 1, justifyContent: "center" }}>
            {loading ? <span style={btnPrimary} /> : <><Icon name="plus" size={14} /> Create Plan</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanDetailModal({ plan, onClose, onMarkPaid, onApprove, onReject }) {
  const toast                     = useToast();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [actioning, setActioning] = useState(false);

  const instalments = plan.instalments || [];
  const paidCount   = instalments.filter(i => i.status === "paid").length;
  const progress    = instalments.length > 0 ? Math.round((paidCount / instalments.length) * 100) : 0;
  const isPending   = plan.status === "pending";

  async function handleApprove() {
    setActioning(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/repayment-plans/${plan.id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Repayment plan approved — tenant has been notified.");
      onApprove(plan.id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to approve plan");
    } finally { setActioning(false); }
  }

  async function handleReject() {
    if (!rejectReason.trim()) { toast.error("Please enter a reason for rejection."); return; }
    setActioning(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/repayment-plans/${plan.id}/reject`, { rejection_reason: rejectReason }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Repayment plan rejected — tenant has been notified.");
      onReject(plan.id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to reject plan");
    } finally { setActioning(false); }
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div style={{ width: "100%", maxWidth: 520, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: "6px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", maxHeight: "90vh" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(232,160,18,0.1)", color: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.bebas, fontSize: "0.7rem", flexShrink: 0 }}>
              {initials(plan.tenant_name)}
            </div>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: "0.04em" }}>{plan.tenant_name}</h3>
              <p style={{ fontSize: "0.65rem", color: "rgba(245,240,232,0.3)", fontFamily: F.mono }}>{plan.unit} · {plan.property}</p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <PlanStatusBadge status={plan.status} />
            <button onClick={onClose} style={{ padding: "0.2rem", background: "transparent", border: "none", cursor: "pointer", color: "rgba(245,240,232,0.3)" }}><Icon name="x" size={18} /></button>
          </div>
        </div>

        {/* Pending approval banner */}
        {isPending && (
          <div style={{ padding: "0.8rem 1.5rem", background: "rgba(232,160,18,0.06)", borderBottom: `1px solid rgba(232,160,18,0.15)`, display: "flex", alignItems: "center", gap: "0.5rem", flexShrink: 0 }}>
            <Icon name="clock" size={14} color={C.gold} />
            <p style={{ fontSize: "0.72rem", color: C.gold, flex: 1 }}>
              This plan was requested by the tenant and is awaiting your approval.
            </p>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "1.2rem 1.5rem", display: "flex", flexDirection: "column", gap: "0.9rem" }}>
          {/* Summary grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            {[
              ["Total Amount",  fmt(plan.total_amount)],
              ["Paid So Far",   fmt(plan.paid_amount || 0)],
              ["Remaining",     fmt((plan.total_amount || 0) - (plan.paid_amount || 0))],
              ["Per Instalment",fmt(plan.amount_per_period || plan.amount_per_instalment)],
              ["Frequency",     plan.frequency || "Monthly"],
              ["Start Date",    formatDate(plan.start_date)],
            ].map(([label, val]) => (
              <div key={label} style={{ padding: "0.5rem 0.7rem", borderRadius: "3px", background: C.black, border: `1px solid ${C.border}` }}>
                <p style={{ fontSize: "0.58rem", color: "rgba(245,240,232,0.3)", fontFamily: F.mono, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "2px" }}>{label}</p>
                <div style={{ fontSize: "0.75rem", fontWeight: 600, color: C.white }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          {plan.status !== "pending" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "0.62rem", color: "rgba(245,240,232,0.3)", fontFamily: F.mono }}>Progress</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 600, color: C.gold, fontFamily: F.mono }}>{paidCount}/{instalments.length} paid ({progress}%)</span>
              </div>
              <div style={{ width: "100%", height: 6, borderRadius: "3px", background: "rgba(245,240,232,0.06)", overflow: "hidden" }}>
                <div style={{ height: 6, borderRadius: "3px", background: progress === 100 ? C.greenLight : C.gold, width: `${progress}%`, transition: "width 0.3s" }} />
              </div>
            </div>
          )}

          {/* Instalment table */}
          <div>
            <p style={{ fontSize: "0.6rem", fontWeight: 600, color: "rgba(245,240,232,0.3)", fontFamily: F.mono, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              {isPending ? "Proposed Schedule" : "Instalments"}
            </p>
            <div style={{ borderRadius: "3px", border: `1px solid ${C.border}`, overflow: "hidden" }}>
              <div style={{ display: "flex", padding: "0.4rem 0.7rem", background: C.black, borderBottom: `1px solid ${C.border}` }}>
                {["#", "Due Date", "Amount", "Status", ""].map(h => (
                  <span key={h} style={{ flex: h === "#" ? "0 0 30px" : h === "" ? "0 0 70px" : 1, fontSize: "0.58rem", fontWeight: 600, color: "rgba(245,240,232,0.3)", fontFamily: F.mono, letterSpacing: "0.04em", textTransform: "uppercase" }}>{h}</span>
                ))}
              </div>
              {instalments.map((inst, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", padding: "0.5rem 0.7rem", borderBottom: i < instalments.length - 1 ? `1px solid ${C.border}` : "none", background: i % 2 === 0 ? "transparent" : "rgba(245,240,232,0.02)" }}>
                  <span style={{ flex: "0 0 30px", fontSize: "0.65rem", fontWeight: 600, color: "rgba(245,240,232,0.4)", fontFamily: F.mono }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: "0.68rem", color: "rgba(245,240,232,0.5)" }}>{formatDate(inst.due_date)}</span>
                  <span style={{ flex: 1, fontSize: "0.7rem", fontWeight: 500, color: C.white }}>{fmt(inst.amount)}</span>
                  <span style={{ flex: 1 }}>
                    {isPending ? <span style={{ fontSize: "0.6rem", color: "rgba(245,240,232,0.25)", fontFamily: F.mono }}>pending approval</span> : <InstalmentBadge status={inst.status} />}
                  </span>
                  <span style={{ flex: "0 0 70px", textAlign: "right" }}>
                    {!isPending && inst.status === "pending" && (
                      <button onClick={() => onMarkPaid(plan.id, inst.id)} style={{ fontSize: "0.62rem", fontWeight: 500, color: C.greenLight, background: "none", border: "none", cursor: "pointer", fontFamily: F.mono }}>
                        Mark Paid
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tenant note */}
          {plan.note && (
            <div style={{ padding: "0.6rem 0.8rem", borderRadius: "3px", background: "rgba(232,160,18,0.04)", border: "1px solid rgba(232,160,18,0.1)", fontSize: "0.68rem", color: "rgba(245,240,232,0.4)", lineHeight: 1.5 }}>
              <span style={{ fontSize: "0.58rem", fontWeight: 600, color: C.gold, fontFamily: F.mono, letterSpacing: "0.04em", textTransform: "uppercase", marginRight: "0.5rem" }}>Note from tenant:</span>
              {plan.note}
            </div>
          )}

          {/* Reject reason input */}
          {showRejectInput && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <label style={{ fontSize: "0.65rem", fontWeight: 600, color: C.redLight, fontFamily: F.mono, letterSpacing: "0.06em", textTransform: "uppercase" }}>Reason for rejection</label>
              <textarea rows={2} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                placeholder="Explain why this plan cannot be approved..."
                style={{ width: "100%", fontSize: "0.78rem", padding: "0.6rem 0.9rem", borderRadius: "3px", background: C.black, border: "1px solid rgba(224,90,74,0.4)", color: C.white, fontFamily: F.dm, outline: "none", resize: "vertical", minHeight: 52 }} />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "1rem 1.5rem 1.5rem", borderTop: `1px solid ${C.border}`, flexShrink: 0, display: "flex", gap: "0.6rem" }}>
          {isPending ? (
            <>
              <button onClick={onClose} style={{ ...btnGhost, flex: 1 }}>Cancel</button>
              {!showRejectInput ? (
                <>
                  <button onClick={() => setShowRejectInput(true)} style={{ flex: 1, padding: "0.6rem 1.2rem", borderRadius: "3px", fontSize: "0.76rem", fontWeight: 600, fontFamily: F.dm, border: `1px solid rgba(224,90,74,0.3)`, background: "transparent", color: C.redLight, cursor: "pointer" }}>
                    Reject
                  </button>
                  <button onClick={handleApprove} disabled={actioning} style={{ ...btnPrimary, flex: 1, justifyContent: "center" }}>
                    {actioning ? <span style={{ width: 14, height: 14, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: C.black, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> : <><Icon name="check" size={14} /> Approve</>}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setShowRejectInput(false)} style={{ ...btnGhost, flex: 1 }}>Back</button>
                  <button onClick={handleReject} disabled={actioning || !rejectReason.trim()} style={{ flex: 1, padding: "0.6rem 1.2rem", borderRadius: "3px", fontSize: "0.76rem", fontWeight: 600, fontFamily: F.dm, border: "none", background: C.redLight, color: C.white, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                    {actioning ? <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: C.white, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} /> : "Confirm Rejection"}
                  </button>
                </>
              )}
            </>
          ) : (
            <button onClick={onClose} style={{ ...btnGhost, width: "100%" }}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

const FILTERS = ["All", "Pending Approval", "Active", "Completed", "Defaulted", "Rejected"];

export default function RepaymentPlans() {
  useDocumentTitle("Repayment Plans");
  const toast    = useToast();
  const navigate = useNavigate();

  const [plans, setPlans]       = useState([]);
  const [tenants, setTenants]   = useState([]);
  const [filter, setFilter]     = useState("All");
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [detailPlan, setDetailPlan] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("token");
      const [plansRes, tenantsRes] = await Promise.all([
        axios.get(`${API}/repayment-plans`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/tenants`,         { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      setPlans((plansRes.data.plans || []).map(p => ({
        id: p.id, tenant_id: p.tenant_id,
        tenant_name: p.tenant_name || "Unknown",
        unit:     p.unit_number ? `Unit ${p.unit_number}` : "N/A",
        property: p.property_name || "Unknown",
        total_amount:        Number(p.total_amount) || 0,
        paid_amount:         Number(p.paid_amount)  || 0,
        amount_per_period:   Number(p.amount_per_period) || 0,
        frequency:  p.frequency  || "monthly",
        start_date: p.start_date,
        status:     p.status     || "active",
        note:       p.note       || "",
        created_at: p.created_at,
        instalments: (p.instalments || []).map(i => ({
          id: i.id, instalment_number: i.instalment_number,
          due_date: i.due_date, amount: Number(i.amount || i.amount_due || 0),
          status: i.status || "pending", paid_date: i.paid_date,
        })),
      })));

      setTenants((tenantsRes.data.tenants || []).map(t => ({
        id:      t.id || t.tenant_id,
        name:    `${t.first_name || ""} ${t.last_name || ""}`.trim(),
        unit:    t.unit_number ? `Unit ${t.unit_number}` : "N/A",
        balance: Number(t.outstanding_balance || t.balance || 0),
      })));
    } catch (err) {
      console.error("Fetch plans:", err);
      setError("Unable to load repayment plans");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handlePlanCreated(newPlan) {
    setPlans(prev => [{ ...newPlan, instalments: newPlan.instalments || [] }, ...prev]);
  }
  function handlePlanApproved(id) {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, status: "active" } : p));
  }
  function handlePlanRejected(id) {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, status: "rejected" } : p));
  }

  async function handleMarkPaid(planId, instalmentId) {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/repayment-plans/${planId}/instalments/${instalmentId}/pay`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlans(prev => prev.map(p => {
        if (p.id !== planId) return p;
        const updated  = p.instalments.map(i => i.id === instalmentId ? { ...i, status: "paid" } : i);
        const newPaid  = updated.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
        const allDone  = updated.every(i => i.status === "paid");
        return { ...p, instalments: updated, paid_amount: newPaid, status: allDone ? "completed" : p.status };
      }));
      setDetailPlan(prev => {
        if (!prev || prev.id !== planId) return prev;
        const updated = prev.instalments.map(i => i.id === instalmentId ? { ...i, status: "paid" } : i);
        const newPaid = updated.filter(i => i.status === "paid").reduce((s, i) => s + i.amount, 0);
        return { ...prev, instalments: updated, paid_amount: newPaid };
      });
      toast.success("Instalment marked as paid!");
    } catch { toast.error("Failed to mark instalment as paid"); }
  }

  const pendingCount = plans.filter(p => p.status === "pending").length;
  const activePlans  = plans.filter(p => p.status === "active").length;
  const totalOwed    = plans.filter(p => p.status === "active").reduce((s, p) => s + (p.total_amount - p.paid_amount), 0);

  const filtered = plans.filter(p => {
    if (filter === "Pending Approval") return p.status === "pending";
    if (filter === "Active")           return p.status === "active";
    if (filter === "Completed")        return p.status === "completed";
    if (filter === "Defaulted")        return p.status === "defaulted";
    if (filter === "Rejected")         return p.status === "rejected";
    return true;
  }).filter(p => {
    const q = search.toLowerCase();
    return !q || [p.tenant_name, p.unit, p.property].some(s => (s || "").toLowerCase().includes(q));
  });

  const S = {
    container: { maxWidth: 1280, padding: "1.5rem 1rem 3rem", margin: "-1rem -1.8rem" },
    headerRow: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem", gap: "1rem", flexWrap: "wrap" },
    title:     { fontSize: "1.8rem", fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "0.5rem" },
    subtitle:  { fontSize: "0.75rem", color: "rgba(245,240,232,0.35)", fontFamily: F.mono, marginTop: "0.3rem" },
    toolbarInner: { display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.8rem 1rem", flexWrap: "wrap", borderBottom: `1px solid ${C.border}` },
    filterBtn: (active) => ({
      padding: "0.4rem 0.8rem", borderRadius: "3px", fontSize: "0.72rem", fontWeight: 600, fontFamily: F.mono,
      letterSpacing: "0.04em", border: `1px solid ${active ? C.gold : C.border}`,
      background: active ? "rgba(232,160,18,0.12)" : "transparent", color: active ? C.gold : "rgba(245,240,232,0.4)",
      cursor: "pointer", transition: "all 0.15s",
    }),
    searchWrap:  { position: "relative", marginLeft: "auto" },
    searchInput: { padding: "0.5rem 0.8rem 0.5rem 2.25rem", borderRadius: "3px", background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, fontSize: "0.78rem", outline: "none", width: 220 },
    th: { fontSize: "0.6rem", fontWeight: 600, color: "rgba(245,240,232,0.3)", fontFamily: F.mono, letterSpacing: "0.06em", textTransform: "uppercase", padding: "0.7rem 1rem", textAlign: "left", borderBottom: `1px solid ${C.border}` },
    td: { padding: "0.7rem 1rem", borderBottom: `1px solid ${C.border}` },
    footer: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.8rem 1rem", fontSize: "0.72rem", color: "rgba(245,240,232,0.3)", fontFamily: F.mono },
  };

  return (
    <div style={S.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {showCreate && <CreatePlanModal tenants={tenants} onClose={() => setShowCreate(false)} onCreated={handlePlanCreated} />}
      {detailPlan && (
        <PlanDetailModal
          plan={detailPlan}
          onClose={() => setDetailPlan(null)}
          onMarkPaid={handleMarkPaid}
          onApprove={handlePlanApproved}
          onReject={handlePlanRejected}
        />
      )}

      {/* HEADER */}
      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}><Icon name="calendar" size={24} color={C.gold} />Repayment Plans</h1>
          <p style={S.subtitle}>
            {activePlans} active · {fmt(totalOwed)} outstanding
            {pendingCount > 0 && <span style={{ color: C.gold, marginLeft: "0.5rem" }}>· {pendingCount} awaiting approval</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button onClick={fetchData} style={btnGhost}><Icon name="refresh" size={14} /> Refresh</button>
          <button onClick={() => setShowCreate(true)} style={{ ...btnPrimary}}>
            <Icon name="plus" size={14} /> Create Plan
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: "0.8rem 1rem", borderRadius: "3px", background: "rgba(224,90,74,0.08)", border: "1px solid rgba(224,90,74,0.2)", marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Icon name="warning" size={16} color={C.redLight} />
          <p style={{ fontSize: "0.75rem", color: C.redLight, flex: 1 }}>{error}</p>
          <button onClick={fetchData} style={{ fontSize: "0.72rem", color: C.gold, background: "none", border: "none", cursor: "pointer", fontFamily: F.mono, fontWeight: 500 }}>Retry</button>
        </div>
      )}

      <div style={cardStyle}>
        <div style={S.toolbarInner}>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {FILTERS.map(f => {
              const count = f === "Pending Approval" ? pendingCount : null;
              return (
                <button key={f} onClick={() => setFilter(f)} style={S.filterBtn(filter === f)}>
                  {f}
                  {count != null && count > 0 && (
                    <span style={{ marginLeft: "0.3rem", background: C.gold, color: C.black, padding: "0.1rem 0.35rem", borderRadius: "6px", fontSize: "0.58rem", fontWeight: 700 }}>{count}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div style={S.searchWrap}>
            <Icon name="search" size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(245,240,232,0.25)" }} />
            <input placeholder="Search tenant..." value={search} onChange={e => setSearch(e.target.value)} style={S.searchInput} />
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "5rem 0", color: "rgba(245,240,232,0.3)", gap: "0.8rem" }}>
            <span style={{ width: 20, height: 20, border: "2px solid rgba(245,240,232,0.1)", borderTopColor: C.gold, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
            Loading plans...
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.75rem", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Tenant", "Total", "Paid", "Remaining", "Progress", "Frequency", "Status", ""].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", padding: "3rem 0", color: "rgba(245,240,232,0.25)" }}>No plans found.</td></tr>
                )}
                {filtered.map(p => {
                  const remaining = p.total_amount - p.paid_amount;
                  const progress  = p.total_amount > 0 ? Math.round((p.paid_amount / p.total_amount) * 100) : 0;
                  return (
                    <tr key={p.id}
                      onMouseEnter={e => e.currentTarget.style.background = C.muted}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      style={{ transition: "background 0.15s" }}>
                      <td style={S.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(232,160,18,0.1)", color: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.bebas, fontSize: "0.6rem", flexShrink: 0 }}>
                            {initials(p.tenant_name)}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, color: C.white, fontSize: "0.78rem" }}>{p.tenant_name}</p>
                            <p style={{ fontSize: "0.62rem", color: "rgba(245,240,232,0.25)", fontFamily: F.mono }}>{p.unit} · {p.property}</p>
                          </div>
                        </div>
                      </td>
                      <td style={{ ...S.td, fontWeight: 600, color: C.white }}>{fmt(p.total_amount)}</td>
                      <td style={{ ...S.td, color: C.greenLight }}>{fmt(p.paid_amount)}</td>
                      <td style={{ ...S.td, fontWeight: 600, color: remaining > 0 ? C.redLight : C.greenLight }}>
                        {remaining > 0 ? fmt(remaining) : "Settled"}
                      </td>
                      <td style={S.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <div style={{ flex: 1, height: 4, borderRadius: "2px", background: "rgba(245,240,232,0.06)", overflow: "hidden", minWidth: 60 }}>
                            <div style={{ height: 4, borderRadius: "2px", background: progress === 100 ? C.greenLight : C.gold, width: `${progress}%` }} />
                          </div>
                          <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "rgba(245,240,232,0.4)", fontFamily: F.mono }}>{progress}%</span>
                        </div>
                      </td>
                      <td style={{ ...S.td, color: "rgba(245,240,232,0.4)", fontSize: "0.7rem", textTransform: "capitalize" }}>{p.frequency}</td>
                      <td style={S.td}><PlanStatusBadge status={p.status} /></td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button onClick={() => setDetailPlan(p)} style={{ fontSize: "0.7rem", fontWeight: 500, color: C.blue, background: "none", border: "none", cursor: "pointer", fontFamily: F.mono }}>
                            {p.status === "pending" ? "Review" : "View"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={S.footer}>
          <span>Showing <strong style={{ color: C.white }}>{filtered.length}</strong> of <strong style={{ color: C.white }}>{plans.length}</strong> plans</span>
        </div>
      </div>
    </div>
  );
}