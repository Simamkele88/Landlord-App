import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

const STATUS_CONFIG = {
  "needs_repair":     { label: "Needs Repair",    color: C.redLight,   bg: 'rgba(224,90,74,0.1)',    border: '1px solid rgba(224,90,74,0.2)',   dot: C.redLight,   icon: 'alertCircle' },
  "assigned":         { label: "Assigned",         color: C.blue,       bg: 'rgba(58,143,212,0.1)',    border: '1px solid rgba(58,143,212,0.2)',   dot: C.blue,       icon: 'user-check' },
  "in_progress":      { label: "In Progress",      color: C.gold,       bg: 'rgba(232,160,18,0.08)',   border: '1px solid rgba(232,160,18,0.2)',   dot: C.gold,       icon: 'clock' },
  "completed":        { label: "Completed",        color: C.greenLight, bg: 'rgba(26,122,74,0.1)',    border: '1px solid rgba(76,186,122,0.2)',   dot: C.greenLight, icon: 'check-circle' },
  "closed":           { label: "Closed",           color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)', dot: 'rgba(245,240,232,0.3)', icon: 'lock' },
  "cancelled":        { label: "Cancelled",        color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)', dot: 'rgba(245,240,232,0.3)', icon: 'x-circle' },
  "pending_approval": { label: "Pending Approval", color: C.purple,     bg: 'rgba(139,92,246,0.1)',    border: '1px solid rgba(139,92,246,0.2)',   dot: C.purple,     icon: 'clock' },
};

const PRIORITY_CONFIG = {
  "emergency": { bg: 'rgba(224,90,74,0.25)', color: '#ffffff', label: 'Emergency' },
  "urgent":    { bg: 'rgba(224,90,74,0.2)', color: C.redLight, label: 'Urgent' },
  "high":      { bg: 'rgba(249,115,22,0.15)', color: '#f97316', label: 'High' },
  "medium":    { bg: 'rgba(58,143,212,0.15)', color: C.blue, label: 'Medium' },
  "low":       { bg: 'rgba(245,240,232,0.08)', color: 'rgba(245,240,232,0.4)', label: 'Low' },
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

function getFullUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API}${url}`;
}

function fmt(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function fmtDate(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
function fmtDateTime(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—"; }

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["needs_repair"];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.6rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: cfg.border }}>
      <Icon name={cfg.icon} size={10} />{cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG["low"];
  return <span style={{ fontSize: '0.58rem', fontWeight: 700, padding: '0.15rem 0.55rem', borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30` }}>{cfg.label}</span>;
}

const cardStyle = { background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.5rem' };

export default function LandlordMaintenanceDetail() {
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
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchRequest = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/landlord/maintenance/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setRequest(data.request || data);
    } catch (err) { setError(err.response?.data?.error || "Failed to load request"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchRequest(); }, [fetchRequest]);

  async function handleAction(endpoint, payload, successMsg) {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/landlord/maintenance/${id}${endpoint}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(successMsg || "Done");
      await fetchRequest();
      setShowReject(false);
      setRejectReason("");
    } catch (err) { toast.error(err.response?.data?.error || "Failed"); }
    finally { setSaving(false); }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
          <span style={{ width: 28, height: 28, border: '3px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          <span style={{ fontSize: '0.8rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>Loading request...</span>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(224,90,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Icon name="alertCircle" size={22} color={C.redLight} />
        </div>
        <h2 style={{ fontSize: '1rem', fontWeight: 600, color: C.white, marginBottom: '0.5rem' }}>Request not found</h2>
        <p style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.4)', marginBottom: '1.2rem' }}>{error || "This maintenance request could not be loaded."}</p>
        <button onClick={() => navigate("/landlord/maintenance")} style={{ padding: '0.6rem 1.4rem', background: C.gold, color: C.black, border: 'none', borderRadius: '3px', fontWeight: 700, cursor: 'pointer', fontFamily: F.dm, fontSize: '0.76rem' }}>Back to Maintenance</button>
      </div>
    );
  }

  const catCfg = CATEGORY_CONFIG[request.category] || CATEGORY_CONFIG.other;
  const photos = request.photos || [];
  const beforePhotos = photos.filter(p => p.photo_type === 'before' || !p.photo_type);
  const afterPhotos = photos.filter(p => p.photo_type === 'after');
  const timeline = request.updates || [];
  const isPendingApproval = request.status === "pending_approval";
  const isClosed = ["completed", "closed", "cancelled"].includes(request.status);
  const contractorName = request.contractor_name;

  const S = {
    container: { maxWidth: 1200, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    backBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1.2rem', transition: 'color 0.15s' },
    sectionTitle: { fontSize: '0.7rem', fontWeight: 600, color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.8rem' },
    infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.45rem 0', borderBottom: `1px solid ${C.border}20`, fontSize: '0.7rem' },
  };

  return (
    <div style={S.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {saving && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.2rem 1.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <span style={{ width: 18, height: 18, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: C.white, fontFamily: F.dm }}>Processing...</span>
          </div>
        </div>
      )}

      {showReject && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div style={{ width: '100%', maxWidth: 440, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: '6px', background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="x-circle" size={16} color={C.redLight} />
                </div>
                <div>
                  <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Reject Request</h3>
                  <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{request.title}</p>
                </div>
              </div>
              <button onClick={() => { setShowReject(false); setRejectReason(""); }} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}><Icon name="x" size={17} /></button>
            </div>
            <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Reason for Rejection *</label>
                <textarea rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain why this request is being rejected..." style={{ width: '100%', fontSize: '0.8rem', padding: '0.55rem 0.8rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, outline: 'none', resize: 'vertical', minHeight: 80 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.7rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}` }}>
              <button onClick={() => { setShowReject(false); setRejectReason(""); }} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: 'transparent', border: `1px solid ${C.border}`, color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontFamily: F.dm, fontSize: '0.74rem' }}>Cancel</button>
              <button onClick={() => handleAction("/reject", { reason: rejectReason }, "Request rejected")} disabled={!rejectReason.trim() || saving} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: 'rgba(224,90,74,0.12)', color: C.redLight, border: '1px solid rgba(224,90,74,0.2)', cursor: 'pointer', fontFamily: F.dm, fontWeight: 600, fontSize: '0.74rem', opacity: !rejectReason.trim() ? 0.5 : 1 }}>Reject Request</button>
            </div>
          </div>
        </div>
      )}

      {viewerOpen && photos.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.96)', padding: '1rem' }} onClick={() => setViewerOpen(false)}>
          <button onClick={() => setViewerOpen(false)} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', padding: '0.5rem', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}><Icon name="x" size={22} /></button>
          {viewerIndex > 0 && <button onClick={e => { e.stopPropagation(); setViewerIndex(v => v - 1); }} style={{ position: 'absolute', left: '1rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="chevronLeft" size={22} /></button>}
          {viewerIndex < photos.length - 1 && <button onClick={e => { e.stopPropagation(); setViewerIndex(v => v + 1); }} style={{ position: 'absolute', right: '1rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Icon name="chevronRight" size={22} /></button>}
          <img src={getFullUrl(photos[viewerIndex]?.document_url)} alt="" style={{ maxHeight: '85vh', maxWidth: '90%', borderRadius: '6px', objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
          <div style={{ position: 'absolute', bottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontFamily: F.mono }}>{viewerIndex + 1} / {photos.length}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', fontFamily: F.mono, textTransform: 'capitalize' }}>{photos[viewerIndex]?.photo_type || 'photo'}</span>
          </div>
        </div>
      )}

      <button onClick={() => navigate("/landlord/maintenance")} style={S.backBtn}
        onMouseEnter={e => e.currentTarget.style.color = C.white}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
        <Icon name="chevronLeft" size={14} /> Back to Maintenance
      </button>

     

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem' }}>
        <style>{`@media (min-width: 1024px) { .maint-grid { grid-template-columns: 1fr 340px !important; } }`}</style>
        <div className="maint-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem', alignItems: 'start' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

            <div style={cardStyle}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
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

            <div style={cardStyle}>
              <h3 style={S.sectionTitle}>Parties Involved</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                <div style={{ padding: '0.8rem', borderRadius: '3px', background: 'rgba(58,143,212,0.06)', border: '1px solid rgba(58,143,212,0.12)' }}>
                  <p style={{ fontSize: '0.55rem', fontWeight: 600, color: C.blue, fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Reported by</p>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: C.white, fontFamily: F.dm }}>{request.tenant_name || "—"}</p>
                  {request.unit_number && <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginTop: '3px' }}>Unit {request.unit_number}</p>}
                </div>
                <div style={{ padding: '0.8rem', borderRadius: '3px', background: contractorName ? 'rgba(58,143,212,0.06)' : 'rgba(245,240,232,0.03)', border: contractorName ? '1px solid rgba(58,143,212,0.12)' : `1px solid ${C.border}` }}>
                  <p style={{ fontSize: '0.55rem', fontWeight: 600, color: contractorName ? C.blue : 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Contractor</p>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: C.white, fontFamily: F.dm }}>{contractorName || "Unassigned"}</p>
                  {request.contractor_phone && <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginTop: '3px' }}>{request.contractor_phone}</p>}
                </div>
                <div style={{ padding: '0.8rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}` }}>
                  <p style={{ fontSize: '0.55rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Property</p>
                  <p style={{ fontSize: '0.8rem', fontWeight: 600, color: C.white, fontFamily: F.dm }}>{request.property_name || "—"}</p>
                  {request.property_address && <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, marginTop: '3px' }}>{request.property_address}</p>}
                </div>
              </div>
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
                <h3 style={{ ...S.sectionTitle, color: C.greenLight }}>After Photos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                  {afterPhotos.map((p, i) => (
                    <button key={p.id || i} onClick={() => { const idx = photos.indexOf(p); setViewerIndex(idx); setViewerOpen(true); }} style={{ aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(76,186,122,0.2)', cursor: 'pointer', background: C.black, position: 'relative' }}>
                      <img src={getFullUrl(p.document_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {timeline.length > 0 && (
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Timeline</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {timeline.map((u, i) => {
                    const toCfg = STATUS_CONFIG[u.status_to] ?? STATUS_CONFIG["needs_repair"];
                    const fromCfg = u.status_from ? STATUS_CONFIG[u.status_from] : null;
                    return (
                      <div key={i} style={{ display: 'flex', gap: '0.6rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div style={{ width: 22, height: 22, borderRadius: '50%', background: toCfg.bg, border: toCfg.border, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Icon name={toCfg.icon} size={10} color={toCfg.color} />
                          </div>
                          {i < timeline.length - 1 && <div style={{ width: 1.5, flex: 1, background: C.border, minHeight: 12 }} />}
                        </div>
                        <div style={{ flex: 1, paddingBottom: i < timeline.length - 1 ? '1rem' : '0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: toCfg.color, fontFamily: F.dm }}>{toCfg.label}</span>
                            {fromCfg && <><Icon name="arrow-right" size={10} color="rgba(245,240,232,0.2)" /><span style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>from {fromCfg.label}</span></>}
                            <span style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, marginLeft: 'auto' }}>{fmtDate(u.created_at)}</span>
                          </div>
                          {u.notes && <p style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.4)', lineHeight: 1.5 }}>{u.notes}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {photos.length === 0 && timeline.length === 0 && (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem' }}>
                <Icon name="image" size={28} color="rgba(245,240,232,0.08)" />
                <p style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginTop: '0.5rem' }}>No photos or updates yet</p>
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

            <div style={cardStyle}>
              <h3 style={S.sectionTitle}>Details</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.1rem' }}>
                {[
                  ["Request #", request.request_number || "—", true],
                  ["Category", catCfg.label],
                  ["Priority", request.priority],
                  ["Reported", fmtDate(request.created_at)],
                  ["Updated", fmtDate(request.updated_at)],
                  ...(request.completed_at ? [["Completed", fmtDateTime(request.completed_at)]] : []),
                  ...(request.tenant_confirmed_at ? [["Tenant Confirmed", fmtDateTime(request.tenant_confirmed_at)]] : []),
                  ...(request.scheduled_date ? [["Scheduled", fmtDate(request.scheduled_date)]] : []),
                ].map(([label, val, mono]) => (
                  <div key={label} style={S.infoRow}>
                    <span style={{ color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, fontSize: '0.68rem' }}>{label}</span>
                    <span style={{ fontWeight: 500, color: C.white, fontSize: '0.7rem', fontFamily: mono ? F.mono : F.dm }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {isPendingApproval && (
              <div style={cardStyle}>
                <h3 style={{ ...S.sectionTitle }}>Your Decision</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button onClick={() => handleAction("/approve", {}, "Request approved")} style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600, fontFamily: F.dm, background: 'rgba(26,122,74,0.12)', color: C.greenLight, border: '1px solid rgba(76,186,122,0.2)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(26,122,74,0.2)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(26,122,74,0.12)'}>
                    <Icon name="check-circle" size={14} /> Approve Request
                  </button>
                  <button onClick={() => setShowReject(true)} style={{ width: '100%', padding: '0.7rem 1rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600, fontFamily: F.dm, background: 'rgba(224,90,74,0.08)', color: C.redLight, border: '1px solid rgba(224,90,74,0.15)', cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(224,90,74,0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(224,90,74,0.08)'}>
                    <Icon name="x-circle" size={14} /> Reject Request
                  </button>
                </div>
              </div>
            )}

            {!isPendingApproval && !isClosed && (
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem' }}>
                  <Icon name="clock" size={16} color="rgba(245,240,232,0.3)" />
                </div>
                <p style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, lineHeight: 1.5 }}>Being handled by the caretaker.<br />You'll be notified if escalated.</p>
              </div>
            )}

            {isClosed && (
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem' }}>
                  <Icon name="check" size={16} color="rgba(245,240,232,0.3)" />
                </div>
                <p style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>This request has been {request.status.replace(/_/g, " ")}.</p>
                {request.tenant_confirmed_at && <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, marginTop: '0.3rem' }}>Tenant confirmed {fmtDateTime(request.tenant_confirmed_at)}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}