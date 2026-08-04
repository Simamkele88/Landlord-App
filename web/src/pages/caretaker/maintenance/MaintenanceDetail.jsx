import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

const STATUS_CONFIG = {
  "needs_repair":     { label: "Needs Repair",    color: C.redLight,   bg: 'rgba(224,90,74,0.06)',  border: '1px solid rgba(224,90,74,0.12)',  dot: C.redLight,   icon: 'alertCircle' },
  "assigned":         { label: "Assigned",         color: C.blue,       bg: 'rgba(58,143,212,0.06)',  border: '1px solid rgba(58,143,212,0.12)',  dot: C.blue,       icon: 'user-check' },
  "in_progress":      { label: "In Progress",      color: C.gold,       bg: 'rgba(232,160,18,0.04)',  border: '1px solid rgba(232,160,18,0.1)',   dot: C.gold,       icon: 'clock' },
  "completed":        { label: "Completed",        color: C.greenLight, bg: 'rgba(26,122,74,0.04)',   border: '1px solid rgba(76,186,122,0.1)',   dot: C.greenLight, icon: 'check-circle' },
  "closed":           { label: "Closed",           color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.08)', dot: 'rgba(245,240,232,0.3)', icon: 'lock' },
  "cancelled":        { label: "Cancelled",        color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.08)', dot: 'rgba(245,240,232,0.3)', icon: 'x-circle' },
  "pending_approval": { label: "Pending Approval", color: C.purple,     bg: 'rgba(139,92,246,0.06)',  border: '1px solid rgba(139,92,246,0.12)',  dot: C.purple,     icon: 'clock' },
};

const PRIORITY_CONFIG = {
  low:      { color: C.blue,       bg: 'rgba(58,143,212,0.1)',  label: 'Low' },
  medium:   { color: C.gold,       bg: 'rgba(232,160,18,0.1)',  label: 'Medium' },
  high:     { color: '#f97316',    bg: 'rgba(249,115,22,0.1)',  label: 'High' },
  urgent:   { color: C.redLight,   bg: 'rgba(224,90,74,0.12)',  label: 'Urgent' },
  emergency:{ color: '#ffffff',    bg: 'rgba(224,90,74,0.2)',   label: 'Emergency' },
};

const CATEGORY_CONFIG = {
  plumbing:     { label: "Plumbing",     icon: 'droplet',  color: C.blue },
  electrical:   { label: "Electrical",   icon: 'zap',      color: C.gold },
  structural:   { label: "Structural",   icon: 'home',     color: C.purple },
  appliance:    { label: "Appliance",    icon: 'tv',       color: '#48ecb5' },
  hvac:         { label: "HVAC",         icon: 'wind',     color: '#062fd4' },
  painting:     { label: "Painting",     icon: 'pen-tool', color: '#84CC16' },
  cleaning:     { label: "Cleaning",     icon: 'sparkles', color: C.greenLight },
  pest_control: { label: "Pest Control", icon: 'shield',   color: C.redLight },
  other:        { label: "Other",        icon: 'more-horizontal', color: 'rgba(245,240,232,0.4)' },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);
const ACTION_COLORS = {
  assign:    { bg: 'rgba(58,143,212,0.12)', color: C.blue,    hoverBg: 'rgba(58,143,212,0.2)' },
  status:    { bg: 'rgba(232,160,18,0.12)', color: C.gold,    hoverBg: 'rgba(232,160,18,0.2)' },
  escalate:  { bg: 'rgba(139,92,246,0.12)', color: C.purple,  hoverBg: 'rgba(139,92,246,0.2)' },
  complete:  { bg: 'rgba(26,122,74,0.12)',  color: C.greenLight, hoverBg: 'rgba(26,122,74,0.2)' },
};

function getFullUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API}${url}`;
}

function fmt(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : ""; }
function fmtDateTime(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""; }
function timeAgo(d) { if (!d) return ""; const s = (Date.now() - new Date(d).getTime()) / 1000; if (s < 60) return "Just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`; }

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["needs_repair"];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.6rem', fontWeight: 600, padding: '0.2rem 0.55rem', borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: cfg.border }}>
      <Icon name={cfg.icon} size={10} />{cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;
  return (
    <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '2px', fontFamily: F.mono, textTransform: 'uppercase', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>
      {cfg.label}
    </span>
  );
}

const cardStyle = { background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.5rem' };
const inputStyle = { width: '100%', fontSize: '0.8rem', padding: '0.55rem 0.8rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, outline: 'none', resize: 'none' };
const modalOverlay = { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' };

const actionBtnStyle = (colorKey) => ({
  width: '100%', padding: '0.7rem 1rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600,
  fontFamily: F.dm, background: ACTION_COLORS[colorKey].bg, color: ACTION_COLORS[colorKey].color,
  border: `1px solid ${ACTION_COLORS[colorKey].color}30`, cursor: 'pointer',
  transition: 'all 0.15s', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem',
});

function ModalShell({ title, sub, icon, iconBg, onClose, children, footer }) {
  return (
    <div style={modalOverlay}>
      <div style={{ width: '100%', maxWidth: 460, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: '6px', ...iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={16} />
            </div>
            <div><h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>{title}</h3>{sub && <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{sub}</p>}</div>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }} onMouseEnter={e => e.currentTarget.style.color = C.white} onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}><Icon name="x" size={17} /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>{children}</div>
        {footer && <div style={{ display: 'flex', gap: '0.7rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>{footer}</div>}
      </div>
    </div>
  );
}

function AssignModal({ request, onClose, onSubmit }) {
  const [name, setName] = useState(request.contractor_name || "");
  const [phone, setPhone] = useState(request.contractor_phone || "");
  const [date, setDate] = useState(request.scheduled_date || "");
  const [cost, setCost] = useState(request.estimated_cost ? String(request.estimated_cost) : "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!name.trim()) { setError("Contractor name is required"); return; }
    onSubmit({ contractorName: name.trim(), contractorPhone: phone.trim() || null, scheduledDate: date || null, estimatedCost: cost ? Number(cost) : null, notes: notes.trim() || null });
    onClose();
  }

  return (
    <ModalShell title={request.contractor_name ? "Reassign Contractor" : "Assign Contractor"} sub={`${request.request_number} · ${request.title}`} icon="user" iconBg={{ background: 'rgba(58,143,212,0.1)', border: '1px solid rgba(58,143,212,0.15)', color: C.blue }}
      onClose={onClose}
      footer={<><button onClick={onClose} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: 'transparent', border: `1px solid ${C.border}`, color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontFamily: F.dm, fontSize: '0.74rem' }}>Cancel</button>
        <button onClick={handleSubmit} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: 'rgba(58,143,212,0.15)', color: C.blue, border: '1px solid rgba(58,143,212,0.2)', cursor: 'pointer', fontFamily: F.dm, fontWeight: 600, fontSize: '0.74rem' }}>{request.contractor_name ? "Reassign" : "Assign"}</button></>}>
      {error && <div style={{ padding: '0.5rem 0.7rem', borderRadius: '3px', background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.12)', fontSize: '0.7rem', color: C.redLight, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icon name="alertCircle" size={12} /> {error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Contractor Name *</label><input value={name} onChange={e => { setName(e.target.value); setError(""); }} style={inputStyle} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Scheduled Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Estimated Cost (R)</label><input type="number" value={cost} onChange={e => setCost(e.target.value)} style={inputStyle} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Notes</label><textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, minHeight: 50 }} /></div>
    </ModalShell>
  );
}

function StatusModal({ request, onClose, onSubmit }) {
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [error, setError] = useState("");

  const availableStatuses = ALL_STATUSES.filter(s => s !== request.status && !["closed", "cancelled", "pending_approval"].includes(s));

  function handleSubmit() {
    if (!newStatus) { setError("Select a status"); return; }
    onSubmit({ status: newStatus, notes: notes.trim() || null, actualCost: actualCost ? Number(actualCost) : null });
    onClose();
  }

  return (
    <ModalShell title="Update Status" sub={request.request_number} icon="clock" iconBg={{ background: 'rgba(232,160,18,0.08)', border: '1px solid rgba(232,160,18,0.12)', color: C.gold }}
      onClose={onClose}
      footer={<><button onClick={onClose} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: 'transparent', border: `1px solid ${C.border}`, color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontFamily: F.dm, fontSize: '0.74rem' }}>Cancel</button>
        <button onClick={handleSubmit} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: 'rgba(232,160,18,0.15)', color: C.gold, border: '1px solid rgba(232,160,18,0.2)', cursor: 'pointer', fontFamily: F.dm, fontWeight: 600, fontSize: '0.74rem' }}>Update Status</button></>}>
      {error && <div style={{ padding: '0.5rem 0.7rem', borderRadius: '3px', background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.12)', fontSize: '0.7rem', color: C.redLight, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icon name="alertCircle" size={12} /> {error}</div>}
      <p style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Select New Status</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {availableStatuses.map(s => {
          const cfg = STATUS_CONFIG[s] ?? STATUS_CONFIG["needs_repair"];
          const active = newStatus === s;
          return (
            <button key={s} onClick={() => { setNewStatus(s); setError(""); }} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.8rem', borderRadius: '3px', border: `1px solid ${active ? cfg.color : C.border}`, background: active ? cfg.bg : 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%', transition: 'all 0.15s' }}>
              <div style={{ width: 28, height: 28, borderRadius: '4px', background: cfg.bg, border: cfg.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={cfg.icon} size={12} color={cfg.color} /></div>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: active ? cfg.color : C.white, fontFamily: F.dm, display: 'block' }}>{cfg.label}</span>
                <span style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>Current: {STATUS_CONFIG[request.status]?.label}</span>
              </div>
            </button>
          );
        })}
      </div>
      {newStatus === "completed" && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', padding: '0.7rem', borderRadius: '3px', background: 'rgba(26,122,74,0.04)', border: '1px solid rgba(76,186,122,0.12)' }}>
          <p style={{ fontSize: '0.65rem', color: C.greenLight, fontFamily: F.dm, marginBottom: '0.5rem' }}>Completing this request will notify the tenant to confirm.</p>
          <label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Actual Cost (R)</label>
          <input type="number" value={actualCost} onChange={e => setActualCost(e.target.value)} style={inputStyle} />
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Notes</label>
        <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} style={{ ...inputStyle, minHeight: 60 }} />
      </div>
    </ModalShell>
  );
}

function EscalateModal({ request, onClose, onSubmit }) {
  const [cost, setCost] = useState(request.estimated_cost ? String(request.estimated_cost) : "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!cost || Number(cost) <= 0) { setError("Enter estimated cost"); return; }
    if (!reason.trim()) { setError("Enter reason for escalation"); return; }
    onSubmit({ estimatedCost: Number(cost), reason: reason.trim() });
    onClose();
  }

  return (
    <ModalShell title="Escalate to Landlord" sub="Requires landlord approval" icon="trending-up" iconBg={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', color: C.purple }}
      onClose={onClose}
      footer={<><button onClick={onClose} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: 'transparent', border: `1px solid ${C.border}`, color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontFamily: F.dm, fontSize: '0.74rem' }}>Cancel</button>
        <button onClick={handleSubmit} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: 'rgba(139,92,246,0.15)', color: C.purple, border: '1px solid rgba(139,92,246,0.2)', cursor: 'pointer', fontFamily: F.dm, fontWeight: 600, fontSize: '0.74rem' }}>Escalate</button></>}>
      {error && <div style={{ padding: '0.5rem 0.7rem', borderRadius: '3px', background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.12)', fontSize: '0.7rem', color: C.redLight, display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Icon name="alertCircle" size={12} /> {error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Estimated Cost (R) *</label><input type="number" value={cost} onChange={e => { setCost(e.target.value); setError(""); }}  style={inputStyle} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Reason for Escalation *</label><textarea rows={4} value={reason} onChange={e => { setReason(e.target.value); setError(""); }}  style={{ ...inputStyle, minHeight: 70 }} /></div>
    </ModalShell>
  );
}

export default function CaretakerMaintenanceDetail() {
  useDocumentTitle("Maintenance Detail");
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const fetchRequest = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/caretaker/maintenance/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setRequest(data.request || data);
    } catch (err) { setError(err.response?.data?.error || "Failed to load"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchRequest(); }, [fetchRequest]);

  async function handleAction(endpoint, payload, successMsg) {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/caretaker/maintenance/${id}${endpoint}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(successMsg || "Updated successfully");
      await fetchRequest();
      setShowAssign(false); setShowStatus(false); setShowEscalate(false);
    } catch (err) { toast.error(err.response?.data?.error || "Action failed"); }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <span style={{ width: 28, height: 28, border: '3px solid rgba(245,240,232,0.06)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
        <span style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>Loading request...</span>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(224,90,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="alertCircle" size={22} color={C.redLight} />
        </div>
        <p style={{ color: 'rgba(245,240,232,0.4)', fontFamily: F.dm }}>{error || "Request not found"}</p>
        <button onClick={() => navigate("/caretaker/maintenance")} style={{ color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono, fontSize: '0.75rem' }}>← Back to Maintenance</button>
      </div>
    );
  }

  const catCfg = CATEGORY_CONFIG[request.category] || CATEGORY_CONFIG.other;
  const photos = request.photos || [];
  const beforePhotos = photos.filter(p => p.photo_type === 'before' || !p.photo_type);
  const afterPhotos = photos.filter(p => p.photo_type === 'after');
  const isClosed = ["completed", "closed", "cancelled"].includes(request.status);
  const isPendingApproval = request.status === "pending_approval";
  const canAssign = ["needs_repair", "pending_approval"].includes(request.status);
  const canReassign = ["assigned", "in_progress"].includes(request.status);
  const canStatus = !isClosed && !isPendingApproval && request.status !== "needs_repair";
  const canEscalate = !isClosed && !isPendingApproval;
  const contractorName = request.contractor_name;

  const S = {
    container: { maxWidth: 1200, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    backBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1.2rem', transition: 'color 0.15s' },
    sectionTitle: { fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.7rem' },
  };

  return (
    <div style={S.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {saving && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: C.muted2, padding: '1rem 1.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.6rem', border: `1px solid ${C.border}` }}>
            <span style={{ width: 16, height: 16, border: '2px solid rgba(245,240,232,0.06)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <span style={{ color: C.white, fontFamily: F.dm, fontSize: '0.8rem' }}>Processing...</span>
          </div>
        </div>
      )}

      {viewerOpen && photos.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.96)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewerOpen(false)}>
          <button onClick={() => setViewerOpen(false)} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.3)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 10 }}><Icon name="x" size={22} /></button>
          {viewerIndex > 0 && <button onClick={e => { e.stopPropagation(); setViewerIndex(v => v - 1); }} style={{ position: 'absolute', left: '1rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="chevronLeft" size={22} /></button>}
          {viewerIndex < photos.length - 1 && <button onClick={e => { e.stopPropagation(); setViewerIndex(v => v + 1); }} style={{ position: 'absolute', right: '1rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="chevronRight" size={22} /></button>}
          <img src={getFullUrl(photos[viewerIndex]?.document_url)} alt="" style={{ maxHeight: '85vh', maxWidth: '90%', objectFit: 'contain', borderRadius: '4px' }} onClick={e => e.stopPropagation()} />
          <div style={{ position: 'absolute', bottom: '1.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontFamily: F.mono }}>{viewerIndex + 1} / {photos.length}</div>
        </div>
      )}

      {showAssign && <AssignModal request={request} onClose={() => setShowAssign(false)} onSubmit={p => handleAction('/assign', p, "Contractor assigned")} />}
      {showStatus && <StatusModal request={request} onClose={() => setShowStatus(false)} onSubmit={p => handleAction('/status', p, "Status updated")} />}
      {showEscalate && <EscalateModal request={request} onClose={() => setShowEscalate(false)} onSubmit={p => handleAction('/escalate', p, "Escalated to landlord")} />}

      <button onClick={() => navigate("/caretaker/maintenance")} style={S.backBtn} onMouseEnter={e => e.currentTarget.style.color = C.white} onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
        <Icon name="chevronLeft" size={13} /> Back to Maintenance
      </button>

      {isPendingApproval && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.9rem 1.2rem', borderRadius: '4px', marginBottom: '1rem', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
          <Icon name="clock" size={18} color={C.purple} />
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: C.purple, fontFamily: F.dm }}>Awaiting Landlord Approval</p>
            <p style={{ fontSize: '0.62rem', color: 'rgba(139,92,246,0.6)', fontFamily: F.mono }}>This request has been escalated. You'll be notified when the landlord responds.</p>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem' }}>
        <style>{`@media (min-width: 1024px) { .detail-grid { grid-template-columns: 1fr 320px !important; } }`}</style>
        <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                <StatusBadge status={request.status} />
                <PriorityBadge priority={request.priority} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.58rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '3px', fontFamily: F.mono, color: catCfg.color, background: `${catCfg.color}10`, border: `1px solid ${catCfg.color}25` }}>
                  <Icon name={catCfg.icon} size={9} /> {catCfg.label}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.62rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono }}>{request.request_number}</span>
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: C.white, fontFamily: F.dm, marginBottom: '0.5rem' }}>{request.title}</h2>
              <p style={{ fontSize: '0.82rem', color: 'rgba(245,240,232,0.45)', lineHeight: 1.7 }}>{request.description}</p>
              {request.completion_notes && (
                <div style={{ marginTop: '0.8rem', padding: '0.7rem 0.9rem', borderRadius: '3px', background: 'rgba(26,122,74,0.04)', border: '1px solid rgba(76,186,122,0.12)' }}>
                  <p style={{ fontSize: '0.58rem', fontWeight: 600, color: C.greenLight, fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Completion Notes</p>
                  <p style={{ fontSize: '0.72rem', color: C.greenLight, lineHeight: 1.5 }}>{request.completion_notes}</p>
                </div>
              )}
            </div>

            {beforePhotos.length > 0 && (
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Before Photos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                  {beforePhotos.map((p, i) => (
                    <button key={p.id || i} onClick={() => { const idx = photos.indexOf(p); setViewerIndex(idx); setViewerOpen(true); }} style={{ aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', border: `1px solid ${C.border}`, cursor: 'pointer', background: C.black, position: 'relative' }}>
                      <img src={getFullUrl(p.document_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {afterPhotos.length > 0 && (
              <div style={cardStyle}>
                <h3 style={{ ...S.sectionTitle, color: C.greenLight }}>After Photos </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                  {afterPhotos.map((p, i) => (
                    <button key={p.id || i} onClick={() => { const idx = photos.indexOf(p); setViewerIndex(idx); setViewerOpen(true); }} style={{ aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(76,186,122,0.2)', cursor: 'pointer', background: C.black, position: 'relative' }}>
                      <img src={getFullUrl(p.document_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={cardStyle}>
              <h3 style={S.sectionTitle}>Tenant & Unit</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                {[
                  { label: 'Tenant', value: request.tenant_name || "—" },
                  { label: 'Unit', value: request.unit_number ? `Unit ${request.unit_number}` : "—" },
                  { label: 'Property', value: request.property_name || "—" }
                ].map(i => (
                  <div key={i.label} style={{ padding: '0.7rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: '0.55rem', fontWeight: 600, color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>{i.label}</p>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: C.white, fontFamily: F.dm }}>{i.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {contractorName && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={S.sectionTitle}>Contractor</h3>
                  {canReassign && (
                    <button onClick={() => setShowAssign(true)} style={{ fontSize: '0.62rem', color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono, transition: 'color 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.color = C.white}
                      onMouseLeave={e => e.currentTarget.style.color = C.blue}>
                      Reassign
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '6px', background: 'rgba(58,143,212,0.08)', border: '1px solid rgba(58,143,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="user" size={18} color={C.blue} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: C.white, fontSize: '0.85rem', fontFamily: F.dm }}>{contractorName}</p>
                    {request.contractor_phone && <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{request.contractor_phone}</p>}
                  </div>
                  {request.scheduled_date && (
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: '0.55rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, textTransform: 'uppercase' }}>Scheduled</p>
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: C.white, fontFamily: F.dm }}>{fmtDate(request.scheduled_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {request.updates?.length > 0 && (
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Timeline</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {request.updates.map((u, i) => {
                    const fromCfg = u.status_from ? STATUS_CONFIG[u.status_from] : null;
                    const toCfg = STATUS_CONFIG[u.status_to] ?? STATUS_CONFIG["needs_repair"];
                    return (
                      <div key={i} style={{ display: 'flex', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 20, height: 20, borderRadius: '50%', background: toCfg.bg, border: toCfg.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name={toCfg.icon} size={9} color={toCfg.color} />
                          </div>
                          {i < request.updates.length - 1 && <div style={{ width: 1.5, flex: 1, background: C.border, minHeight: 12 }} />}
                        </div>
                        <div style={{ flex: 1, paddingBottom: i < request.updates.length - 1 ? '1rem' : '0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 600, color: toCfg.color, fontFamily: F.dm }}>{toCfg.label}</span>
                            {fromCfg && (
                              <>
                                <Icon name="arrowRight" size={10} color="rgba(245,240,232,0.2)" />
                                <span style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>from {fromCfg.label}</span>
                              </>
                            )}
                            <span style={{ fontSize: '0.58rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, marginLeft: fromCfg ? 'auto' : '0' }}>{timeAgo(u.created_at)}</span>
                          </div>
                          {u.notes && <p style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.4)', marginTop: '3px', lineHeight: 1.5 }}>{u.notes}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {(request.estimated_cost || request.actual_cost) && (
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Cost</h3>
                <div style={{ display: 'grid', gridTemplateColumns: request.estimated_cost && request.actual_cost ? '1fr 1fr' : '1fr', gap: '0.5rem' }}>
                  {request.estimated_cost ? (
                    <div style={{ padding: '0.7rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}` }}>
                      <p style={{ fontSize: '0.55rem', fontWeight: 600, color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Estimated</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: C.gold, fontFamily: F.bebas, letterSpacing: '0.03em' }}>{fmt(request.estimated_cost)}</p>
                    </div>
                  ) : null}
                  {request.actual_cost ? (
                    <div style={{ padding: '0.7rem', borderRadius: '3px', background: 'rgba(26,122,74,0.04)', border: '1px solid rgba(76,186,122,0.12)' }}>
                      <p style={{ fontSize: '0.55rem', fontWeight: 600, color: C.greenLight, fontFamily: F.mono, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '4px' }}>Actual</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 700, color: C.greenLight, fontFamily: F.bebas, letterSpacing: '0.03em' }}>{fmt(request.actual_cost)}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {!isClosed && (
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {canAssign && (
                    <button onClick={() => setShowAssign(true)} style={actionBtnStyle('assign')}
                      onMouseEnter={e => e.currentTarget.style.background = ACTION_COLORS.assign.hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = ACTION_COLORS.assign.bg}>
                      <Icon name="user" size={14} /> Assign Contractor
                    </button>
                  )}
                  {canStatus && (
                    <button onClick={() => setShowStatus(true)} style={actionBtnStyle('status')}
                      onMouseEnter={e => e.currentTarget.style.background = ACTION_COLORS.status.hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = ACTION_COLORS.status.bg}>
                      <Icon name="clock" size={14} /> Update Status
                    </button>
                  )}
                  {canEscalate && (
                    <button onClick={() => setShowEscalate(true)} style={actionBtnStyle('escalate')}
                      onMouseEnter={e => e.currentTarget.style.background = ACTION_COLORS.escalate.hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = ACTION_COLORS.escalate.bg}>
                      <Icon name="trending-up" size={14} /> Escalate to Landlord
                    </button>
                  )}
                  {isPendingApproval && (
                    <div style={{ textAlign: 'center', padding: '0.6rem', color: C.purple, fontSize: '0.68rem', fontFamily: F.mono }}>
                      Awaiting landlord approval
                    </div>
                  )}
                </div>
              </div>
            )}

            {isClosed && (
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem' }}>
                  <Icon name="check" size={16} color="rgba(245,240,232,0.3)" />
                </div>
                <p style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>This request has been {request.status.replace(/_/g, " ")}.</p>
              </div>
            )}

            <div style={cardStyle}>
              <h3 style={S.sectionTitle}>Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                {[
                  ["Category", catCfg.label],
                  ["Priority", request.priority],
                  ["Reported", fmtDate(request.created_at)],
                  ...(request.completed_at ? [["Completed", fmtDateTime(request.completed_at)]] : []),
                  ...(request.tenant_confirmed_at ? [["Confirmed", fmtDateTime(request.tenant_confirmed_at)]] : []),
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: `1px solid ${C.border}20` }}>
                    <span style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{l}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 500, color: C.white, fontFamily: F.dm, textTransform: 'capitalize' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}