import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const STATUS_CONFIG = {
  "needs_repair":     { label: "Needs Repair",    color: "#9e3a3a", bg: "#fbeaea", border: "1px solid #e5bdbd", dot: "#9e3a3a", icon: "alertCircle" },
  "assigned":         { label: "Assigned",         color: "#2c6b9b", bg: "#e8f0f5", border: "1px solid #b0cfe0", dot: "#2c6b9b", icon: "user-check" },
  "in_progress":      { label: "In Progress",      color: "#8b6e1a", bg: "#faf6ed", border: "1px solid #e5dbb8", dot: "#8b6e1a", icon: "clock" },
  "completed":        { label: "Completed",        color: "#2b7a4b", bg: "#eef5e8", border: "1px solid #c5d9b8", dot: "#2b7a4b", icon: "check-circle" },
  "closed":           { label: "Closed",           color: "#5a5a5a", bg: "#f2f2f2", border: "1px solid #d0d0d0", dot: "#6b6b6b", icon: "lock" },
  "cancelled":        { label: "Cancelled",        color: "#5a5a5a", bg: "#f2f2f2", border: "1px solid #d0d0d0", dot: "#6b6b6b", icon: "x-circle" },
  "pending_approval": { label: "Pending Approval", color: "#54326b", bg: "#eee7f3", border: "1px solid #d1c2dc", dot: "#54326b", icon: "clock" },
};

const PRIORITY_CONFIG = {
  "emergency": { bg: "#fbeaea", color: "#9e3a3a", label: "Emergency" },
  "urgent":    { bg: "#fdf0f0", color: "#9e3a3a", label: "Urgent" },
  "high":      { bg: "#fef9e7", color: "#c25e1a", label: "High" },
  "medium":    { bg: "#e8f0f5", color: "#2c6b9b", label: "Medium" },
  "low":       { bg: "#f5f5f5", color: "#5f6b7a", label: "Low" },
};

const CATEGORY_CONFIG = {
  plumbing:     { label: "Plumbing",     icon: "droplet",  color: "#2c6b9b" },
  electrical:   { label: "Electrical",   icon: "zap",      color: "#8b6e1a" },
  structural:   { label: "Structural",   icon: "home",     color: "#54326b" },
  appliance:    { label: "Appliance",    icon: "tv",       color: "#1a7a4a" },
  hvac:         { label: "HVAC",         icon: "wind",     color: "#062fd4" },
  painting:     { label: "Painting",     icon: "pen-tool", color: "#84CC16" },
  cleaning:     { label: "Cleaning",     icon: "sparkles", color: "#2b7a4b" },
  pest_control: { label: "Pest Control", icon: "shield",   color: "#9e3a3a" },
  other:        { label: "Other",        icon: "more-horizontal", color: "#5f6b7a" },
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
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '12px', fontWeight: 500, padding: '0.15rem 0.6rem',
      borderRadius: '12px', color: cfg.color, background: cfg.bg, border: cfg.border,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  const cfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG["low"];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '12px', fontWeight: 500, padding: '0.15rem 0.55rem',
      borderRadius: '12px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}30`,
    }}>
      {cfg.label}
    </span>
  );
}

const cardStyle = {
  background: '#fdfdfd',
  border: '1px solid #dfe3e8',
  borderRadius: '3px',
  padding: '1rem',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
};

const btnPrimary = {
  background: '#2c3e50',
  color: '#ffffff',
  border: '1px solid #2c3e50',
  padding: '0.4rem 0.8rem',
  fontSize: '14px',
  fontWeight: 500,
  fontFamily: FONT,
  borderRadius: '2px',
  cursor: 'pointer',
};

const btnGhost = {
  background: '#fdfdfd',
  color: '#000',
  border: '1px solid #ccc',
  padding: '0.4rem 0.8rem',
  fontSize: '14px',
  fontWeight: 400,
  fontFamily: FONT,
  borderRadius: '2px',
  cursor: 'pointer',
};

const inputStyle = {
  width: '100%',
  fontSize: '14px',
  padding: '0.4rem 0.7rem',
  borderRadius: '2px',
  background: '#fdfdfd',
  border: '1px solid #dee2e6',
  color: '#000',
  fontFamily: FONT,
  outline: 'none',
};

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
      console.log("The error here: ", data.request);
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
          <span style={{ width: 28, height: 28, border: '3px solid rgba(44,62,80,0.1)', borderTopColor: '#2c3e50', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          <span style={{ fontSize: '14px', color: '#333', fontFamily: FONT }}>Loading request...</span>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div style={{ padding: '4rem 0', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fbeaea', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
          <Icon name="alertCircle" size={22} color="#9e3a3a" />
        </div>
        <h2 style={{ fontSize: '1rem', fontWeight: 500, color: '#000', marginBottom: '0.5rem' }}>Request not found</h2>
        <p style={{ fontSize: '14px', color: '#333', marginBottom: '1.2rem' }}>{error || "This maintenance request could not be loaded."}</p>
        <button onClick={() => navigate("/landlord/maintenance")} style={btnPrimary}>Back to Maintenance</button>
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
    container: { maxWidth: 1200, padding: '1.2rem 1rem 2rem', margin: '-1rem -1.8rem', fontFamily: FONT },
    backBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '14px', color: '#333', fontFamily: FONT, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1rem' },
    sectionTitle: { fontSize: '13px', fontWeight: 600, color: '#333', fontFamily: FONT, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.6rem' },
    infoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.4rem 0', borderBottom: '1px solid #f1f3f5', fontSize: '14px', color: '#000' },
  };

  return (
    <div style={S.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {saving && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fdfdfd', border: '1px solid #e9ecef', borderRadius: '3px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <span style={{ width: 18, height: 18, border: '2px solid rgba(44,62,80,0.1)', borderTopColor: '#2c3e50', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <span style={{ fontSize: '14px', fontWeight: 500, color: '#000' }}>Processing...</span>
          </div>
        </div>
      )}

      {showReject && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(44,62,80,0.5)' }}>
          <div style={{ width: '100%', maxWidth: 420, background: '#fdfdfd', border: '1px solid #e9ecef', borderRadius: '3px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.9rem 1.2rem', borderBottom: '1px solid #e9ecef' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: '6px', background: '#fbeaea', border: '1px solid #e5bdbd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="x-circle" size={15} color="#9e3a3a" />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#000' }}>Reject Request</h3>
                  <p style={{ fontSize: '12px', color: '#333' }}>{request.title}</p>
                </div>
              </div>
              <button onClick={() => { setShowReject(false); setRejectReason(""); }} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: '#555' }}>
                <Icon name="x" size={16} />
              </button>
            </div>
            <div style={{ padding: '1rem 1.2rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>Reason for Rejection *</label>
                <textarea rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="" style={{ ...inputStyle, resize: 'vertical', minHeight: 80 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.7rem', padding: '0.9rem 1.2rem 1.2rem', borderTop: '1px solid #e9ecef' }}>
              <button onClick={() => { setShowReject(false); setRejectReason(""); }} style={{ flex: 1, ...btnGhost }}>Cancel</button>
              <button onClick={() => handleAction("/reject", { reason: rejectReason }, "Request rejected")} disabled={!rejectReason.trim() || saving}
                style={{ flex: 1, padding: '0.4rem', fontSize: '14px', fontWeight: 500, borderRadius: '2px', background: '#9e3a3a', color: '#ffffff', border: 'none', cursor: 'pointer', opacity: !rejectReason.trim() ? 0.5 : 1 }}>
                Reject Request
              </button>
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
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', fontFamily: FONT }}>{viewerIndex + 1} / {photos.length}</span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', fontFamily: FONT, textTransform: 'capitalize' }}>{photos[viewerIndex]?.photo_type || 'photo'}</span>
          </div>
        </div>
      )}

      <button onClick={() => navigate("/landlord/maintenance")} style={S.backBtn}>
        <Icon name="chevronLeft" size={14} /> Back to Maintenance
      </button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
        <style>{`@media (min-width: 1024px) { .maint-grid { grid-template-columns: 1fr 340px !important; } }`}</style>
        <div className="maint-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', alignItems: 'start' }}>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            <div style={cardStyle}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
                <StatusBadge status={request.status} />
                <PriorityBadge priority={request.priority} />
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '12px', fontWeight: 500, padding: '0.15rem 0.5rem', borderRadius: '12px', color: catCfg.color, background: `${catCfg.color}15`, border: `1px solid ${catCfg.color}30` }}>
                  <Icon name={catCfg.icon} size={11} /> {catCfg.label}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '13px', color: '#333' }}>{request.request_number}</span>
              </div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 500, color: '#000', margin: '0 0 0.4rem' }}>{request.title}</h2>
              <p style={{ fontSize: '14px', color: '#333', lineHeight: 1.6 }}>{request.description}</p>
              {request.completion_notes && (
                <div style={{ marginTop: '0.8rem', padding: '0.7rem 0.9rem', borderRadius: '2px', background: '#eef5e8', border: '1px solid #c5d9b8' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#2b7a4b', marginBottom: '0.2rem' }}>Completion Notes</p>
                  <p style={{ fontSize: '14px', color: '#2b7a4b', lineHeight: 1.5 }}>{request.completion_notes}</p>
                </div>
              )}
            </div>

            <div style={cardStyle}>
              <h3 style={S.sectionTitle}>Parties Involved</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                <div style={{ padding: '0.8rem', borderRadius: '2px', background: '#e8f0f5', border: '1px solid #b0cfe0' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#2c6b9b', marginBottom: '0.3rem' }}>Reported by</p>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#000' }}>{request.tenant_name || "—"}</p>
                  {request.unit_number && <p style={{ fontSize: '12px', color: '#333', marginTop: '3px' }}>Unit {request.unit_number}</p>}
                </div>
                <div style={{ padding: '0.8rem', borderRadius: '2px', background: contractorName ? '#e8f0f5' : '#f5f5f5', border: contractorName ? '1px solid #b0cfe0' : '1px solid #ddd' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: contractorName ? '#2c6b9b' : '#555', marginBottom: '0.3rem' }}>Contractor</p>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#000' }}>{contractorName || "Unassigned"}</p>
                  {request.contractor_phone && <p style={{ fontSize: '12px', color: '#333', marginTop: '3px' }}>{request.contractor_phone}</p>}
                </div>
                <div style={{ padding: '0.8rem', borderRadius: '2px', background: '#f5f5f5', border: '1px solid #ddd' }}>
                  <p style={{ fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '0.3rem' }}>Property</p>
                  <p style={{ fontSize: '14px', fontWeight: 500, color: '#000' }}>{request.property_name || "—"}</p>
                  {request.property_address && <p style={{ fontSize: '12px', color: '#333', marginTop: '3px' }}>{request.property_address}</p>}
                </div>
              </div>
            </div>

            {beforePhotos.length > 0 && (
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Before Photos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                  {beforePhotos.map((p, i) => (
                    <button key={p.id || i} onClick={() => { const idx = photos.indexOf(p); setViewerIndex(idx); setViewerOpen(true); }}
                      style={{ aspectRatio: '1', borderRadius: '2px', overflow: 'hidden', border: '1px solid #ddd', cursor: 'pointer', background: '#f5f5f5', position: 'relative' }}>
                      <img src={getFullUrl(p.document_url)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {afterPhotos.length > 0 && (
              <div style={cardStyle}>
                <h3 style={{ ...S.sectionTitle, color: '#2b7a4b' }}>After Photos</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                  {afterPhotos.map((p, i) => (
                    <button key={p.id || i} onClick={() => { const idx = photos.indexOf(p); setViewerIndex(idx); setViewerOpen(true); }}
                      style={{ aspectRatio: '1', borderRadius: '2px', overflow: 'hidden', border: '1px solid #c5d9b8', cursor: 'pointer', background: '#f5f5f5', position: 'relative' }}>
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
                          {i < timeline.length - 1 && <div style={{ width: 1.5, flex: 1, background: '#ddd', minHeight: 12 }} />}
                        </div>
                        <div style={{ flex: 1, paddingBottom: i < timeline.length - 1 ? '0.8rem' : '0' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '2px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, color: toCfg.color }}>{toCfg.label}</span>
                            {fromCfg && <><Icon name="arrowRight" size={10} color="#999" /><span style={{ fontSize: '12px', color: '#333' }}>from {fromCfg.label}</span></>}
                            <span style={{ fontSize: '12px', color: '#555', marginLeft: 'auto' }}>{fmtDate(u.created_at)}</span>
                          </div>
                          {u.notes && <p style={{ fontSize: '13px', color: '#333', lineHeight: 1.5 }}>{u.notes}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {photos.length === 0 && timeline.length === 0 && (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem' }}>
                <Icon name="image" size={28} color="#ccc" />
                <p style={{ fontSize: '14px', color: '#555', marginTop: '0.5rem' }}>No photos or updates yet</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>

            {(request.estimated_cost || request.actual_cost) && (
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Cost</h3>
                <div style={{ display: 'grid', gridTemplateColumns: request.estimated_cost && request.actual_cost ? '1fr 1fr' : '1fr', gap: '0.5rem' }}>
                  {request.estimated_cost ? (
                    <div style={{ padding: '0.7rem', borderRadius: '2px', background: '#f5f5f5', border: '1px solid #ddd' }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#555', marginBottom: '4px' }}>Estimated</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#8b6e1a' }}>{fmt(request.estimated_cost)}</p>
                    </div>
                  ) : null}
                  {request.actual_cost ? (
                    <div style={{ padding: '0.7rem', borderRadius: '2px', background: '#eef5e8', border: '1px solid #c5d9b8' }}>
                      <p style={{ fontSize: '12px', fontWeight: 600, color: '#2b7a4b', marginBottom: '4px' }}>Actual</p>
                      <p style={{ fontSize: '1.1rem', fontWeight: 600, color: '#2b7a4b' }}>{fmt(request.actual_cost)}</p>
                    </div>
                  ) : null}
                </div>
              </div>
            )}

            {/* NEW: Create Invoice action */}
            <div style={cardStyle}>
              <h3 style={S.sectionTitle}>Actions</h3>
              <button
                onClick={() => {
                  const amount = request.actual_cost || request.estimated_cost || "";
                  const notes = `Maintenance request: ${request.title}`;
                  navigate(
                    `/landlord/payments/invoices/create?lease_id=${request.lease_id}&amount=${amount}&type=damage&notes=${encodeURIComponent(notes)}`
                  );
                }}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.8rem',
                  borderRadius: '2px',
                  fontSize: '14px',
                  fontWeight: 500,
                  background: '#2c3e50',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                }}
              >
                <Icon name="file-text" size={14} /> Create Invoice
              </button>
            </div>

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
                ].map(([label, val]) => (
                  <div key={label} style={S.infoRow}>
                    <span style={{ color: '#555', fontSize: '13px' }}>{label}</span>
                    <span style={{ fontWeight: 500, color: '#000', fontSize: '14px' }}>{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {isPendingApproval && (
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Your Decision</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button onClick={() => handleAction("/approve", {}, "Request approved")}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '2px', fontSize: '14px', fontWeight: 500, background: '#eef5e8', color: '#2b7a4b', border: '1px solid #c5d9b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#dff0e0'}
                    onMouseLeave={e => e.currentTarget.style.background = '#eef5e8'}>
                    <Icon name="check-circle" size={14} /> Approve Request
                  </button>
                  <button onClick={() => setShowReject(true)}
                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '2px', fontSize: '14px', fontWeight: 500, background: '#fbeaea', color: '#9e3a3a', border: '1px solid #e5bdbd', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f9dedb'}
                    onMouseLeave={e => e.currentTarget.style.background = '#fbeaea'}>
                    <Icon name="x-circle" size={14} /> Reject Request
                  </button>
                </div>
              </div>
            )}

            {!isPendingApproval && !isClosed && (
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f5f5f5', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem' }}>
                  <Icon name="clock" size={16} color="#555" />
                </div>
                <p style={{ fontSize: '14px', color: '#333', lineHeight: 1.5 }}>Being handled by the caretaker.<br />You'll be notified if escalated.</p>
              </div>
            )}

            {isClosed && (
              <div style={{ ...cardStyle, textAlign: 'center' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f5f5f5', border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem' }}>
                  <Icon name="check" size={16} color="#555" />
                </div>
                <p style={{ fontSize: '14px', color: '#333' }}>This request has been {request.status.replace(/_/g, " ")}.</p>
                {request.tenant_confirmed_at && <p style={{ fontSize: '13px', color: '#555', marginTop: '0.3rem' }}>Tenant confirmed {fmtDateTime(request.tenant_confirmed_at)}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}