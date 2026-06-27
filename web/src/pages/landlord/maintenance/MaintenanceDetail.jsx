/* eslint-disable no-unused-vars */
// LANDLORD MAINTENANCE DETAIL PAGE 
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

const STATUS_CONFIG = {
  "needs_repair":     { label: "Needs Repair",    color: C.redLight,   bg: 'rgba(224,90,74,0.1)',    border: '1px solid rgba(224,90,74,0.2)',   dot: C.redLight      },
  "assigned":         { label: "Assigned",         color: C.blue,       bg: 'rgba(58,143,212,0.1)',    border: '1px solid rgba(58,143,212,0.2)',   dot: C.blue          },
  "in_progress":      { label: "In Progress",      color: C.gold,       bg: 'rgba(232,160,18,0.08)',   border: '1px solid rgba(232,160,18,0.2)',   dot: C.gold          },
  "completed":        { label: "Completed",        color: C.greenLight, bg: 'rgba(26,122,74,0.1)',    border: '1px solid rgba(76,186,122,0.2)',   dot: C.greenLight    },
  "cancelled":        { label: "Closed",           color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)', dot: 'rgba(245,240,232,0.3)' },
  "pending_approval": { label: "Pending Approval", color: C.purple,     bg: 'rgba(139,92,246,0.1)',    border: '1px solid rgba(139,92,246,0.2)',   dot: C.purple        },
};

const PRIORITY_CONFIG = {
  "urgent": { bg: C.redLight, color: C.white },
  "high":   { bg: 'rgba(232,160,18,0.2)', color: C.gold },
  "medium": { bg: 'rgba(58,143,212,0.15)', color: C.blue },
  "low":    { bg: 'rgba(245,240,232,0.08)', color: 'rgba(245,240,232,0.4)' },
};

function fmt(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
function fmtDateTime(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"; }
function timeAgo(d) { if (!d) return ""; const diff = (Date.now() - new Date(d)) / 1000; if (diff < 60) return "Just now"; if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`; return `${Math.floor(diff / 86400)}d ago`; }
function isImageEvidence(item) { return item.mime_type?.startsWith("image/") || item.document_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i); }

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["needs_repair"];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.58rem', fontWeight: 700, padding: '0.12rem 0.5rem',
      borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
      textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: cfg.border,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG["low"];
  return <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '0.12rem 0.5rem', borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase', background: cfg.bg, color: cfg.color }}>{priority}</span>;
}


const cardStyle = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.5rem',
};

const inputStyle = {
  width: '100%', fontSize: '0.82rem', padding: '0.6rem 0.9rem', borderRadius: '3px',
  background: C.black, border: `1px solid ${C.border}`, color: C.white,
  fontFamily: F.dm, outline: 'none', resize: 'none',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2rem',
};

const modalOverlay = {
  position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
};


function DetailCard({ title, children }) {
  return (
    <div style={cardStyle}>
      <h3 style={{ fontSize: '0.78rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', marginBottom: '1rem' }}>{title}</h3>
      {children}
    </div>
  );
}


function EscalateModal({ request, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!reason.trim()) { setError("Please provide a reason"); return; }
    setLoading(true);
    onSubmit({ reason: reason.trim() });
    setLoading(false);
    onClose();
  }

  return (
    <div style={modalOverlay}>
      <div style={{ width: '100%', maxWidth: 440, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '6px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="arrow-up" size={16} color={C.purple} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Escalate to Landlord</h3>
              <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{request.request_number} · {request.title}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {error && <div style={{ padding: '0.5rem 0.7rem', borderRadius: '3px', background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)', fontSize: '0.7rem', color: C.redLight }}>{error}</div>}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)' }}>
            <Icon name="info" size={13} color={C.purple} style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '0.65rem', color: C.purple, lineHeight: 1.4 }}>This will notify the landlord that this request needs their attention due to high costs or complexity.</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Reason <span style={{ color: C.redLight }}>*</span>
            </label>
            <textarea rows={4} value={reason} onChange={e => { setReason(e.target.value); setError(""); }} placeholder="Why does this need landlord attention?"
              style={{ ...inputStyle, minHeight: 70, fontSize: '0.72rem' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} disabled={loading} style={{ flex: 1, padding: '0.6rem', borderRadius: '3px', fontSize: '0.74rem', fontWeight: 500, fontFamily: F.dm, background: 'transparent', border: `1px solid ${C.border}`, color: 'rgba(245,240,232,0.4)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, padding: '0.6rem', borderRadius: '3px', fontSize: '0.74rem', fontWeight: 600, fontFamily: F.dm, background: C.purple, color: C.white, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: C.white, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <><Icon name="arrow-up" size={14} /> Escalate</>}
          </button>
        </div>
      </div>
    </div>
  );
}


function StatusUpdateModal({ request, onClose, onSubmit }) {
  const [newStatus, setNewStatus] = useState(request.status || "needs_repair");
  const [workerName, setWorkerName] = useState(request.contractor_name || "");
  const [costEstimate, setCostEstimate] = useState(request.estimated_cost ? String(request.estimated_cost) : "");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit() {
    setLoading(true);
    onSubmit({
      status: newStatus,
      worker_name: workerName || undefined,
      estimated_cost: costEstimate ? Number(costEstimate) : undefined,
      note: note.trim() || undefined,
    });
    setLoading(false);
    onClose();
  }

  return (
    <div style={modalOverlay}>
      <div style={{ width: '100%', maxWidth: 460, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Update Status</h3>
            <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{request.request_number} · {request.title}</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Status</label>
            <select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={selectStyle}>
              <option value="needs_repair">Needs Repair</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Closed</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Worker Name</label>
            <input value={workerName} onChange={e => setWorkerName(e.target.value)} placeholder="e.g. Mike's Plumbing" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Estimated Cost (R)</label>
            <input type="number" min="0" value={costEstimate} onChange={e => setCostEstimate(e.target.value)} placeholder="e.g. 2800" style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Note</label>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note about this update..."
              style={{ ...inputStyle, minHeight: 50, fontSize: '0.72rem' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} disabled={loading} style={{ flex: 1, padding: '0.6rem', borderRadius: '3px', fontSize: '0.74rem', fontWeight: 500, fontFamily: F.dm, background: 'transparent', border: `1px solid ${C.border}`, color: 'rgba(245,240,232,0.4)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ flex: 1, padding: '0.6rem', borderRadius: '3px', fontSize: '0.74rem', fontWeight: 600, fontFamily: F.dm, background: C.gold, color: C.black, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: C.black, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : "Update Status"}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function MaintenanceDetail() {
  useDocumentTitle("Maintenance Detail");
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [statusModal, setStatusModal] = useState(false);
  const [escalateModal, setEscalateModal] = useState(false);
  const [internalNote, setInternalNote] = useState("");

  const fetchRequest = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/maintenance/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setRequest(data.request || data);
    } catch (err) {
      setRequest({
        id, request_number: `MNT-${String(id).padStart(4, "0")}`,
        title: "Burst geyser replacement — Unit 301",
        description: "The geyser in Unit 301 burst on Saturday evening. Water leaked through the ceiling into the flat below. Tenant reports no hot water and water damage to the ceiling panels.",
        category: "Plumbing", priority: "urgent", status: "in_progress",
        tenant_name: "Zandile Khumalo", tenant_id: 4, unit_number: "301", property_name: "Yeoville Corner",
        contractor_name: "Mike's Plumbing Services", estimated_cost: 2800, actual_cost: null,
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        updated_at: new Date(Date.now() - 1 * 86400000).toISOString(),
        evidence: [],
        timeline: [
          { status: "needs_repair", title: "Maintenance Requested", note: "Tenant reported burst geyser with water damage to ceiling.", actor: "Zandile Khumalo (Tenant)", created_at: new Date(Date.now() - 3 * 86400000).toISOString() },
          { status: "assigned", title: "Contractor Assigned", note: "Assigned to Mike's Plumbing Services. Estimated cost: R2,800.", actor: "Caretaker", created_at: new Date(Date.now() - 2 * 86400000).toISOString(), cost: 2800 },
          { status: "in_progress", title: "Repair In Progress", note: "Mike arrived on site. Geyser needs full replacement. Parts ordered for delivery tomorrow.", actor: "Mike's Plumbing", created_at: new Date(Date.now() - 1 * 86400000).toISOString() },
        ],
      });
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchRequest(); }, [fetchRequest]);

  async function handleAction(endpoint, payload) {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}${endpoint}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Updated!");
      await fetchRequest();
    } catch { toast.error("Action failed"); }
    finally { setSaving(false); }
  }

  async function handleAddNote() {
    if (!internalNote.trim()) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/maintenance/${id}/notes`, { note: internalNote }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Note added!");
      setInternalNote("");
      fetchRequest();
    } catch { toast.error("Failed"); }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'rgba(245,240,232,0.3)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ width: 24, height: 24, border: '3px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          <span style={{ fontSize: '0.85rem' }}>Loading request...</span>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: C.white, marginBottom: '0.5rem' }}>Request not found</h2>
        <p style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.4)', marginBottom: '1.2rem' }}>This maintenance request could not be loaded.</p>
        <button onClick={() => navigate("/landlord/maintenance")} style={{ padding: '0.6rem 1.4rem', background: C.gold, color: C.black, border: 'none', borderRadius: '3px', fontWeight: 700, cursor: 'pointer', fontFamily: F.dm }}>Back to Maintenance</button>
      </div>
    );
  }

  const evidence = request.evidence || [];
  const timeline = request.timeline || [];
  const canUpdate = !["completed", "cancelled"].includes(request.status);
  const canEscalate = ["assigned", "in_progress"].includes(request.status) && (request.estimated_cost > 5000);

  const S = {
    container: { maxWidth: 1200, padding: '1.5rem 1rem 3rem', margin: '-2rem -2.8rem' },
    backBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1.2rem', transition: 'color 0.15s' },
    infoRow: { display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.7rem' },
  };

  return (
    <div style={S.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Saving overlay */}
      {saving && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.2rem 1.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <span style={{ width: 18, height: 18, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: C.white, fontFamily: F.dm }}>Updating request...</span>
          </div>
        </div>
      )}

      {/* Modals */}
      {statusModal && <StatusUpdateModal request={request} onClose={() => setStatusModal(false)} onSubmit={payload => handleAction(`/maintenance/${id}/status`, payload)} />}
      {escalateModal && <EscalateModal request={request} onClose={() => setEscalateModal(false)} onSubmit={payload => handleAction(`/maintenance/${id}/escalate`, payload)} />}

      {/* Image viewer */}
      {viewerOpen && evidence.length > 0 && isImageEvidence(evidence[viewerIndex]) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.95)', padding: '1rem' }} onClick={() => setViewerOpen(false)}>
          <button onClick={() => setViewerOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
            <Icon name="x" size={20} />
          </button>
          <img src={`${API}${evidence[viewerIndex].document_url}`} alt={evidence[viewerIndex].label || 'Evidence'} style={{ maxHeight: '85vh', maxWidth: '100%', borderRadius: '6px', objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
        </div>
      )}

      {/* Back */}
      <button onClick={() => navigate("/landlord/maintenance")} style={S.backBtn}
        onMouseEnter={e => e.currentTarget.style.color = C.white}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
        <Icon name="chevron-left" size={14} /> Back to Maintenance
      </button>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem' }}>
        <style>{`@media (min-width: 1024px) { .maint-grid { grid-template-columns: 1fr 340px !important; } }`}</style>
        <div className="maint-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem', alignItems: 'start' }}>

          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

            {/* Main Card */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <StatusBadge status={request.status} />
                <PriorityBadge priority={request.priority} />
              </div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: C.white, fontFamily: F.dm, marginBottom: '0.6rem' }}>{request.title}</h2>
              <p style={{ fontSize: '0.82rem', color: 'rgba(245,240,232,0.4)', lineHeight: 1.7 }}>{request.description}</p>
            </div>

            {/* Parties Card */}
            <DetailCard title="Parties Involved">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                <div style={{ padding: '0.8rem', borderRadius: '3px', background: 'rgba(58,143,212,0.06)', border: '1px solid rgba(58,143,212,0.12)' }}>
                  <p style={{ fontSize: '0.58rem', fontWeight: 600, color: C.blue, fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Reported by</p>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: C.white }}>{request.tenant_name || "—"}</p>
                  {request.unit_number && <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, marginTop: '2px' }}>Unit {request.unit_number}</p>}
                </div>
                <div style={{ padding: '0.8rem', borderRadius: '3px', background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.12)' }}>
                  <p style={{ fontSize: '0.58rem', fontWeight: 600, color: C.redLight, fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Contractor</p>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: C.white }}>{request.contractor_name || "Unassigned"}</p>
                </div>
                <div style={{ padding: '0.8rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Property</p>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: C.white }}>{request.property_name}</p>
                </div>
              </div>
            </DetailCard>

            {/* Timeline */}
            <DetailCard title="Timeline">
              {timeline.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.25)', textAlign: 'center', padding: '1rem' }}>No updates yet.</p>
              ) : (
                <div>
                  {timeline.map((item, i) => {
                    const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG["needs_repair"];
                    return (
                      <div key={i} style={{ display: 'flex', gap: '0.8rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 24 }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: cfg.bg, border: cfg.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot }} />
                          </div>
                          {i < timeline.length - 1 && <div style={{ width: 1, flex: 1, background: C.border }} />}
                        </div>
                        <div style={{ flex: 1, paddingBottom: i < timeline.length - 1 ? '1rem' : '0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: C.white }}>{item.title || cfg.label}</span>
                            <StatusBadge status={item.status} />
                          </div>
                          {item.note && <p style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.4)', lineHeight: 1.5, marginBottom: '0.2rem' }}>{item.note}</p>}
                          <div style={{ display: 'flex', gap: '0.8rem', fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, flexWrap: 'wrap' }}>
                            {item.actor && <span>{item.actor}</span>}
                            {item.created_at && <span>{fmtDateTime(item.created_at)}</span>}
                            {item.cost && <span style={{ color: C.gold }}>{fmt(item.cost)}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </DetailCard>

            {/* Evidence */}
            {evidence.length > 0 && (
              <DetailCard title={`Evidence (${evidence.length})`}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                  {evidence.map((item, index) => (
                    <div key={item.id || index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 0.8rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}` }}>
                      <p style={{ fontSize: '0.75rem', fontWeight: 500, color: C.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
                        {item.label || `Evidence ${index + 1}`}
                      </p>
                      {isImageEvidence(item) ? (
                        <button onClick={() => { setViewerIndex(index); setViewerOpen(true); }} style={{ marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.6rem', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 500, fontFamily: F.mono, letterSpacing: '0.04em', border: `1px solid ${C.border}`, background: 'transparent', color: C.blue, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                          <Icon name="eye" size={12} /> Preview
                        </button>
                      ) : (
                        <a href={`${API}${item.document_url}`} target="_blank" rel="noreferrer" style={{ marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.35rem 0.6rem', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 500, fontFamily: F.mono, letterSpacing: '0.04em', border: `1px solid ${C.border}`, background: 'transparent', color: 'rgba(245,240,232,0.4)', cursor: 'pointer', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                          <Icon name="file" size={12} /> Open
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </DetailCard>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>

            {/* Details */}
            <DetailCard title="Details">
              {[
                ["Request #", request.request_number || `MNT-${String(id).padStart(4, "0")}`],
                ["Category", (request.category || "—").replace(/_/g, " ")],
                ["Priority", request.priority],
                ["Reported", fmtDate(request.created_at)],
                ["Updated", fmtDate(request.updated_at)],
                ["Est. Cost", fmt(request.estimated_cost)],
                ["Actual Cost", request.actual_cost ? fmt(request.actual_cost) : "—"],
              ].map(([label, val]) => (
                <div key={label} style={S.infoRow}>
                  <span style={{ color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{label}</span>
                  <span style={{ fontWeight: 500, color: C.white }}>{val}</span>
                </div>
              ))}
            </DetailCard>

            {/* Actions */}
            <DetailCard title="Actions">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {canUpdate && (
                  <button onClick={() => setStatusModal(true)} style={{ width: '100%', padding: '0.7rem', borderRadius: '3px', fontSize: '0.78rem', fontWeight: 600, fontFamily: F.dm, background: C.gold, color: C.black, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <Icon name="edit" size={14} /> Update Status
                  </button>
                )}
                {canEscalate && (
                  <button onClick={() => setEscalateModal(true)} style={{ width: '100%', padding: '0.7rem', borderRadius: '3px', fontSize: '0.78rem', fontWeight: 600, fontFamily: F.dm, background: C.purple, color: C.white, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <Icon name="arrow-up" size={14} /> Escalate to Landlord
                  </button>
                )}
                {!canUpdate && (
                  <div style={{ padding: '0.7rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, textAlign: 'center', fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>
                    This request is complete and cannot be modified.
                  </div>
                )}
              </div>
            </DetailCard>

            {/* Internal Notes */}
            <DetailCard title="Internal Notes">
              <textarea rows={3} value={internalNote} onChange={e => setInternalNote(e.target.value)} placeholder="Add a note visible only to you..."
                style={{ ...inputStyle, minHeight: 60, fontSize: '0.72rem', marginBottom: '0.5rem' }} />
              <button onClick={handleAddNote} disabled={!internalNote.trim()} style={{ width: '100%', padding: '0.5rem', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 500, fontFamily: F.mono, background: 'rgba(58,143,212,0.1)', border: '1px solid rgba(58,143,212,0.2)', color: C.blue, cursor: 'pointer', opacity: internalNote.trim() ? 1 : 0.4 }}>
                <Icon name="plus" size={12} /> Add Note
              </button>
            </DetailCard>
          </div>
        </div>
      </div>
    </div>
  );
}