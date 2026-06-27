/* eslint-disable no-unused-vars */
// CARETAKER MAINTENANCE DETAIL PAGE 
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

const STATUS_CONFIG = {
  "needs_repair":     { label: "Needs Repair",    color: C.redLight,   bg: 'rgba(224,90,74,0.06)',  border: '1px solid rgba(224,90,74,0.12)',  dot: C.redLight   },
  "assigned":         { label: "Assigned",         color: C.blue,       bg: 'rgba(58,143,212,0.06)',  border: '1px solid rgba(58,143,212,0.12)',  dot: C.blue       },
  "in_progress":      { label: "In Progress",      color: C.gold,       bg: 'rgba(232,160,18,0.04)',  border: '1px solid rgba(232,160,18,0.1)',   dot: C.gold       },
  "completed":        { label: "Completed",        color: C.greenLight, bg: 'rgba(26,122,74,0.04)',   border: '1px solid rgba(76,186,122,0.1)',   dot: C.greenLight },
  "cancelled":        { label: "Cancelled",        color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.08)', dot: 'rgba(245,240,232,0.3)' },
  "pending_approval": { label: "Pending Approval", color: C.purple,     bg: 'rgba(139,92,246,0.06)',  border: '1px solid rgba(139,92,246,0.12)',  dot: C.purple     },
};

const VALID_TRANSITIONS = {
  needs_repair:     ["assigned", "in_progress"],
  assigned:         ["in_progress", "needs_repair"],
  in_progress:      ["completed", "needs_repair"],
  completed:        ["in_progress"],
  pending_approval: ["assigned", "in_progress"],
};

function fmt(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : ""; }
function timeAgo(d) { if (!d) return ""; const s = (Date.now() - new Date(d).getTime()) / 1000; if (s < 60) return "Just now"; if (s < 3600) return `${Math.floor(s / 60)}m ago`; if (s < 86400) return `${Math.floor(s / 3600)}h ago`; return `${Math.floor(s / 86400)}d ago`; }

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["needs_repair"];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.58rem', fontWeight: 600, padding: '0.12rem 0.45rem', borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: cfg.border }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />{cfg.label}
    </span>
  );
}

const cardStyle = { background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.3rem' };
const inputStyle = { width: '100%', fontSize: '0.8rem', padding: '0.55rem 0.8rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, outline: 'none', resize: 'none' };
const selectStyle = { ...inputStyle, appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2rem' };
const modalOverlay = { position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' };


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
  const [date, setDate] = useState("");
  const [cost, setCost] = useState(request.estimated_cost ? String(request.estimated_cost) : "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() { if (!name.trim()) { setError("Contractor name required"); return; } onSubmit({ contractorName: name.trim(), contractorPhone: phone.trim() || null, scheduledDate: date || null, estimatedCost: cost ? Number(cost) : null, notes: notes.trim() || null }); onClose(); }

  return (
    <ModalShell title={request.contractor_name ? "Reassign Contractor" : "Assign Contractor"} sub={`${request.request_number} · ${request.title}`} icon="user" iconBg={{ background: 'rgba(58,143,212,0.1)', border: '1px solid rgba(58,143,212,0.15)', color: C.blue }}
      onClose={onClose}
      footer={<><button onClick={onClose} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: 'transparent', border: `1px solid ${C.border}`, color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontFamily: F.dm, fontSize: '0.74rem' }}>Cancel</button>
        <button onClick={handleSubmit} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: C.blue, color: C.white, border: 'none', cursor: 'pointer', fontFamily: F.dm, fontWeight: 600, fontSize: '0.74rem' }}>Assign</button></>}>
      {error && <div style={{ padding: '0.5rem 0.7rem', borderRadius: '3px', background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.12)', fontSize: '0.7rem', color: C.redLight }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Contractor Name *</label><input value={name} onChange={e => { setName(e.target.value); setError(""); }} placeholder="e.g. Mike's Plumbing" style={inputStyle} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Phone (Optional)</label><input value={phone} onChange={e => setPhone(e.target.value)} placeholder="0821234567" style={inputStyle} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Scheduled Date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={inputStyle} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Estimated Cost (R)</label><input type="number" value={cost} onChange={e => setCost(e.target.value)} placeholder="e.g. 850" style={inputStyle} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Notes (Optional)</label><textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Special instructions..." style={{ ...inputStyle, minHeight: 50 }} /></div>
    </ModalShell>
  );
}


function StatusModal({ request, onClose, onSubmit }) {
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [error, setError] = useState("");
  const nextStatuses = VALID_TRANSITIONS[request.status] ?? [];

  function handleSubmit() { if (!newStatus) { setError("Select a status"); return; } onSubmit({ status: newStatus, notes: notes.trim() || null, actualCost: actualCost ? Number(actualCost) : null }); onClose(); }

  return (
    <ModalShell title="Update Status" sub={request.request_number} icon="clock" iconBg={{ background: 'rgba(232,160,18,0.08)', border: '1px solid rgba(232,160,18,0.12)', color: C.gold }}
      onClose={onClose}
      footer={<><button onClick={onClose} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: 'transparent', border: `1px solid ${C.border}`, color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontFamily: F.dm, fontSize: '0.74rem' }}>Cancel</button>
        <button onClick={handleSubmit} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: C.blue, color: C.white, border: 'none', cursor: 'pointer', fontFamily: F.dm, fontWeight: 600, fontSize: '0.74rem' }}>Update</button></>}>
      {error && <div style={{ padding: '0.5rem 0.7rem', borderRadius: '3px', background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.12)', fontSize: '0.7rem', color: C.redLight }}>{error}</div>}
      <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Select New Status</p>
      {nextStatuses.map(s => { const cfg = STATUS_CONFIG[s] ?? STATUS_CONFIG["needs_repair"]; const active = newStatus === s; return (
        <button key={s} onClick={() => { setNewStatus(s); setError(""); }} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.6rem 0.8rem', borderRadius: '3px', border: `1px solid ${active ? C.blue : C.border}`, background: active ? 'rgba(58,143,212,0.06)' : 'transparent', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
          <div style={{ width: 28, height: 28, borderRadius: '4px', background: cfg.bg, border: cfg.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} /></div>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: active ? C.blue : C.white, fontFamily: F.dm }}>{cfg.label}</span>
        </button>
      )})}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Notes</label><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Describe what was done..." style={{ ...inputStyle, minHeight: 60 }} /></div>
      {newStatus === "completed" && <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Actual Cost (R)</label><input type="number" value={actualCost} onChange={e => setActualCost(e.target.value)} placeholder="e.g. 750" style={inputStyle} /></div>}
    </ModalShell>
  );
}

function EscalateModal({ request, onClose, onSubmit }) {
  const [cost, setCost] = useState(request.estimated_cost ? String(request.estimated_cost) : "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() { if (!cost) { setError("Enter estimated cost"); return; } if (!reason.trim()) { setError("Enter reason"); return; } onSubmit({ estimatedCost: Number(cost), reason: reason.trim() }); onClose(); }

  return (
    <ModalShell title="Escalate to Landlord" sub="High-cost repair needs approval" icon="arrow-up" iconBg={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)', color: C.orange }}
      onClose={onClose}
      footer={<><button onClick={onClose} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: 'transparent', border: `1px solid ${C.border}`, color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontFamily: F.dm, fontSize: '0.74rem' }}>Cancel</button>
        <button onClick={handleSubmit} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: '#f97316', color: C.white, border: 'none', cursor: 'pointer', fontFamily: F.dm, fontWeight: 600, fontSize: '0.74rem' }}>Escalate</button></>}>
      {error && <div style={{ padding: '0.5rem 0.7rem', borderRadius: '3px', background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.12)', fontSize: '0.7rem', color: C.redLight }}>{error}</div>}
      <div style={{ padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(249,115,22,0.04)', border: '1px solid rgba(249,115,22,0.1)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem' }}><Icon name="info" size={13} color="#f97316" style={{ flexShrink: 0, marginTop: '1px' }} /><p style={{ fontSize: '0.65rem', color: '#f97316', fontFamily: F.mono, lineHeight: 1.4 }}>The landlord will be notified. Request pauses until approved.</p></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Estimated Cost (R) *</label><input type="number" value={cost} onChange={e => { setCost(e.target.value); setError(""); }} placeholder="e.g. 7500" style={inputStyle} /></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Reason *</label><textarea rows={4} value={reason} onChange={e => { setReason(e.target.value); setError(""); }} placeholder="Why does this need approval?" style={{ ...inputStyle, minHeight: 70 }} /></div>
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
      toast.success(successMsg || "Updated!");
      await fetchRequest();
      setShowAssign(false); setShowStatus(false); setShowEscalate(false);
    } catch (err) { toast.error(err.response?.data?.error || "Failed"); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><span style={{ width: 24, height: 24, border: '3px solid rgba(245,240,232,0.06)', borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /></div>;
  if (error || !request) return <div style={{ textAlign: 'center', padding: '4rem' }}><p style={{ color: 'rgba(245,240,232,0.4)', marginBottom: '1rem' }}>{error || "Not found"}</p><button onClick={() => navigate("/caretaker/maintenance")} style={{ color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}>← Back</button></div>;

  const photos = request.photos || [];
  const canAssign = ["needs_repair", "pending_approval"].includes(request.status);
  const canReassign = ["assigned", "in_progress"].includes(request.status);
  const canStatus = !["completed", "cancelled"].includes(request.status);
  const canEscalate = !["pending_approval", "completed", "cancelled"].includes(request.status);

  const S = {
    container: { maxWidth: 1200, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    backBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1.2rem' },
    sectionTitle: { fontSize: '0.68rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.7rem' },
  };

  return (
    <div style={S.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {saving && <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ background: C.muted2, padding: '1rem 1.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><span style={{ width: 16, height: 16, border: '2px solid rgba(245,240,232,0.06)', borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /><span style={{ color: C.white, fontFamily: F.dm }}>Saving...</span></div></div>}

      {viewerOpen && photos.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewerOpen(false)}>
          <button onClick={() => setViewerOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', zIndex: 10 }}><Icon name="x" size={22} /></button>
          {viewerIndex > 0 && <button onClick={e => { e.stopPropagation(); setViewerIndex(v => v - 1); }} style={{ position: 'absolute', left: '1rem', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="chevron-left" size={22} /></button>}
          {viewerIndex < photos.length - 1 && <button onClick={e => { e.stopPropagation(); setViewerIndex(v => v + 1); }} style={{ position: 'absolute', right: '1rem', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="chevron-right" size={22} /></button>}
          <img src={photos[viewerIndex]?.document_url?.startsWith('http') ? photos[viewerIndex].document_url : `${API}${photos[viewerIndex]?.document_url}`} alt="" style={{ maxHeight: '85vh', maxWidth: '90%', objectFit: 'contain', borderRadius: '4px' }} onClick={e => e.stopPropagation()} />
          <div style={{ position: 'absolute', bottom: '1.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{viewerIndex + 1} / {photos.length}</div>
        </div>
      )}

      {showAssign && <AssignModal request={request} onClose={() => setShowAssign(false)} onSubmit={p => handleAction('/assign', p, "Contractor assigned!")} />}
      {showStatus && <StatusModal request={request} onClose={() => setShowStatus(false)} onSubmit={p => handleAction('/status', p, "Status updated!")} />}
      {showEscalate && <EscalateModal request={request} onClose={() => setShowEscalate(false)} onSubmit={p => handleAction('/escalate', p, "Escalated to landlord!")} />}

      <button onClick={() => navigate("/caretaker/maintenance")} style={S.backBtn} onMouseEnter={e => e.currentTarget.style.color = C.white} onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}><Icon name="chevron-left" size={13} /> Back</button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem' }}>
        <style>{`@media (min-width: 1024px) { .detail-grid { grid-template-columns: 1fr 320px !important; } }`}</style>
        <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem', alignItems: 'start' }}>
          
          {/* LEFT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                <StatusBadge status={request.status} />
                <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '0.1rem 0.45rem', borderRadius: '2px', fontFamily: F.mono, textTransform: 'uppercase', background: request.priority === 'urgent' ? C.redLight : request.priority === 'high' ? C.gold : C.blue, color: request.priority === 'high' ? C.black : C.white }}>{request.priority}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.6rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono }}>{request.request_number}</span>
              </div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: C.white, fontFamily: F.dm, marginBottom: '0.4rem' }}>{request.title}</h2>
              <p style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.45)', lineHeight: 1.6 }}>{request.description}</p>
            </div>

            {photos.length > 0 && (
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Photos ({photos.length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                  {photos.map((p, i) => (
                    <button key={i} onClick={() => { setViewerIndex(i); setViewerOpen(true); }} style={{ aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', border: `1px solid ${C.border}`, cursor: 'pointer', background: C.black }}>
                      <img src={p.document_url?.startsWith('http') ? p.document_url : `${API}${p.document_url}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={cardStyle}>
              <h3 style={S.sectionTitle}>Tenant & Unit</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem' }}>
                {[{ label: 'Tenant', value: request.tenant_name }, { label: 'Unit', value: request.unit_number ? `Unit ${request.unit_number}` : "—" }, { label: 'Property', value: request.property_name }].map(i => (
                  <div key={i.label} style={{ padding: '0.6rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: '0.58rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, textTransform: 'uppercase', marginBottom: '2px' }}>{i.label}</p>
                    <p style={{ fontSize: '0.75rem', fontWeight: 500, color: C.white }}>{i.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {request.contractor_name && (
              <div style={cardStyle}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <h3 style={S.sectionTitle}>Contractor</h3>
                  {canReassign && <button onClick={() => setShowAssign(true)} style={{ fontSize: '0.62rem', color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}>Reassign</button>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '6px', background: 'rgba(58,143,212,0.08)', border: '1px solid rgba(58,143,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="user" size={16} color={C.blue} /></div>
                  <div><p style={{ fontWeight: 600, color: C.white, fontSize: '0.8rem' }}>{request.contractor_name}</p>{request.contractor_phone && <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{request.contractor_phone}</p>}</div>
                  {request.scheduled_date && <div style={{ marginLeft: 'auto', textAlign: 'right' }}><p style={{ fontSize: '0.58rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono }}>Scheduled</p><p style={{ fontSize: '0.72rem', fontWeight: 600, color: C.white }}>{fmtDate(request.scheduled_date)}</p></div>}
                </div>
              </div>
            )}

            {request.updates?.length > 0 && (
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Timeline</h3>
                {request.updates.map((u, i) => {
                  const cfg = STATUS_CONFIG[u.status_to] ?? STATUS_CONFIG["needs_repair"];
                  return (
                    <div key={i} style={{ display: 'flex', gap: '0.6rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: cfg.bg, border: cfg.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} /></div>
                        {i < request.updates.length - 1 && <div style={{ width: 1, flex: 1, background: C.border }} />}
                      </div>
                      <div style={{ paddingBottom: i < request.updates.length - 1 ? '1rem' : '0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><span style={{ fontSize: '0.7rem', fontWeight: 600, color: cfg.color, fontFamily: F.mono }}>{cfg.label}</span><span style={{ fontSize: '0.58rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono }}>{timeAgo(u.created_at)}</span></div>
                        {u.notes && <p style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.4)', marginTop: '2px' }}>{u.notes}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* RIGHT */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {(request.estimated_cost || request.actual_cost) && (
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Cost</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {request.estimated_cost && <div style={{ padding: '0.6rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}` }}><p style={{ fontSize: '0.58rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, textTransform: 'uppercase' }}>Estimated</p><p style={{ fontSize: '1rem', fontWeight: 700, color: C.gold, fontFamily: F.bebas }}>{fmt(request.estimated_cost)}</p></div>}
                  {request.actual_cost && <div style={{ padding: '0.6rem', borderRadius: '3px', background: 'rgba(26,122,74,0.04)', border: '1px solid rgba(76,186,122,0.12)' }}><p style={{ fontSize: '0.58rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, textTransform: 'uppercase' }}>Actual</p><p style={{ fontSize: '1rem', fontWeight: 700, color: C.greenLight, fontFamily: F.bebas }}>{fmt(request.actual_cost)}</p></div>}
                </div>
              </div>
            )}

            <div style={cardStyle}>
              <h3 style={S.sectionTitle}>Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {canAssign && <button onClick={() => setShowAssign(true)} style={{ width: '100%', padding: '0.65rem', borderRadius: '3px', background: C.blue, color: C.white, border: 'none', cursor: 'pointer', fontFamily: F.dm, fontWeight: 600, fontSize: '0.74rem' }}>Assign Contractor</button>}
                {canStatus && <button onClick={() => setShowStatus(true)} style={{ width: '100%', padding: '0.65rem', borderRadius: '3px', background: C.gold, color: C.black, border: 'none', cursor: 'pointer', fontFamily: F.dm, fontWeight: 600, fontSize: '0.74rem' }}>Update Status</button>}
                {canEscalate && <button onClick={() => setShowEscalate(true)} style={{ width: '100%', padding: '0.65rem', borderRadius: '3px', background: '#f97316', color: C.white, border: 'none', cursor: 'pointer', fontFamily: F.dm, fontWeight: 600, fontSize: '0.74rem' }}>Escalate to Landlord</button>}
                {!canAssign && !canStatus && !canEscalate && <p style={{ textAlign: 'center', color: 'rgba(245,240,232,0.2)', fontSize: '0.72rem', fontFamily: F.mono }}>No actions available</p>}
              </div>
            </div>

            <div style={cardStyle}>
              <h3 style={S.sectionTitle}>Details</h3>
              {[["Category", request.category?.replace(/_/g, " ")], ["Reported", fmtDate(request.created_at)], ["Completed", request.completed_at ? fmtDate(request.completed_at) : "—"]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.7rem' }}>
                  <span style={{ color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{l}</span><span style={{ color: C.white, fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}