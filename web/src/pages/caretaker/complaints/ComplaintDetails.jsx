// CARETAKER COMPLAINT DETAIL PAGE 
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

const STATUS_CONFIG = {
  "open":                   { label: "Open",               color: C.redLight,   bg: 'rgba(224,90,74,0.06)',  border: '1px solid rgba(224,90,74,0.12)',  dot: C.redLight   },
  "under_review":           { label: "Under Review",       color: C.gold,       bg: 'rgba(232,160,18,0.04)',  border: '1px solid rgba(232,160,18,0.1)',   dot: C.gold       },
  "awaiting_clarification": { label: "Needs Clarification",color: '#f97316',    bg: 'rgba(249,115,22,0.06)',  border: '1px solid rgba(249,115,22,0.12)',  dot: '#f97316'    },
  "approved":               { label: "Approved",           color: C.blue,       bg: 'rgba(58,143,212,0.06)',  border: '1px solid rgba(58,143,212,0.12)',  dot: C.blue       },
  "resolved":               { label: "Resolved",           color: C.greenLight, bg: 'rgba(26,122,74,0.04)',   border: '1px solid rgba(76,186,122,0.1)',   dot: C.greenLight },
  "dismissed":              { label: "Dismissed",          color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.03)', border: '1px solid rgba(245,240,232,0.08)', dot: 'rgba(245,240,232,0.3)' },
  "escalated":              { label: "Escalated",          color: C.purple,     bg: 'rgba(139,92,246,0.06)',  border: '1px solid rgba(139,92,246,0.12)',  dot: C.purple     },
};

const SCOPE_LABELS = { specific_tenant: "Specific Unit / Tenant", common_area: "Common Area", unknown: "Unknown / General", property_wide: "Property-Wide Issue" };

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["open"];
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.58rem', fontWeight: 600, padding: '0.12rem 0.45rem', borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: cfg.border }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />{cfg.label}</span>;
}

function fmtDate(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : ""; }

const cardStyle = { background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.3rem' };
const inputStyle = { width: '100%', fontSize: '0.8rem', padding: '0.55rem 0.8rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, outline: 'none', resize: 'none' };
const btnStyle = (bg, color) => ({ width: '100%', padding: '0.65rem', borderRadius: '3px', background: bg, color, border: 'none', cursor: 'pointer', fontFamily: F.dm, fontWeight: 600, fontSize: '0.74rem', textAlign: 'center' });


function ModalShell({ title, sub, icon, iconBg, onClose, children, footer }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 440, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: '6px', ...iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name={icon} size={16} /></div>
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


function TextActionModal({ title, sub, icon, iconBg, label, placeholder, btnLabel, btnBg, onClose, onSubmit }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  function handleSubmit() { if (!value.trim()) { setError("Required"); return; } onSubmit(value.trim()); onClose(); }
  return (
    <ModalShell title={title} sub={sub} icon={icon} iconBg={iconBg} onClose={onClose}
      footer={<><button onClick={onClose} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: 'transparent', border: `1px solid ${C.border}`, color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontFamily: F.dm, fontSize: '0.74rem' }}>Cancel</button>
        <button onClick={handleSubmit} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: btnBg, color: C.white, border: 'none', cursor: 'pointer', fontFamily: F.dm, fontWeight: 600, fontSize: '0.74rem' }}>{btnLabel}</button></>}>
      {error && <div style={{ padding: '0.5rem 0.7rem', borderRadius: '3px', background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.12)', fontSize: '0.7rem', color: C.redLight }}>{error}</div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label} *</label><textarea rows={4} value={value} onChange={e => { setValue(e.target.value); setError(""); }} placeholder={placeholder} style={{ ...inputStyle, minHeight: 80 }} /></div>
    </ModalShell>
  );
}


function VerdictModal({ complaint, onClose, onSubmit }) {
  const [type, setType] = useState("warning");
  const [fine, setFine] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  function handleSubmit() { if (type === "fine" && (!fine || Number(fine) <= 0)) { setError("Enter valid fine amount"); return; } onSubmit({ verdict_type: type, fine_amount: type === "fine" ? Number(fine) : null, notes: notes.trim() || null }); onClose(); }
  return (
    <ModalShell title="Issue Verdict" sub={complaint.subject} icon="warning" iconBg={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)', color: '#f97316' }} onClose={onClose}
      footer={<><button onClick={onClose} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: 'transparent', border: `1px solid ${C.border}`, color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontFamily: F.dm, fontSize: '0.74rem' }}>Cancel</button><button onClick={handleSubmit} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: '#f97316', color: C.white, border: 'none', cursor: 'pointer', fontFamily: F.dm, fontWeight: 600, fontSize: '0.74rem' }}>Issue Verdict</button></>}>
      {error && <div style={{ padding: '0.5rem 0.7rem', borderRadius: '3px', background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.12)', fontSize: '0.7rem', color: C.redLight }}>{error}</div>}
      <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Verdict Type</p>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {[{ id: "warning", label: "Warning" }, { id: "fine", label: "Fine" }].map(t => (
          <button key={t.id} onClick={() => { setType(t.id); setError(""); }} style={{ flex: 1, padding: '0.6rem', borderRadius: '3px', border: `1px solid ${type === t.id ? '#f97316' : C.border}`, background: type === t.id ? 'rgba(249,115,22,0.06)' : 'transparent', color: type === t.id ? '#f97316' : 'rgba(245,240,232,0.4)', cursor: 'pointer', fontFamily: F.dm, fontSize: '0.78rem', fontWeight: 500 }}>{t.label}</button>
        ))}
      </div>
      {type === "fine" && <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Fine Amount (R) *</label><input type="number" value={fine} onChange={e => { setFine(e.target.value); setError(""); }} placeholder="e.g. 500" style={inputStyle} /></div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}><label style={{ fontSize: '0.62rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Notes</label><textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Details..." style={{ ...inputStyle, minHeight: 60 }} /></div>
    </ModalShell>
  );
}


export default function CaretakerComplaintDetail() {
  useDocumentTitle("Complaint Detail");
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [showVerdict, setShowVerdict] = useState(false);
  const [showDismiss, setShowDismiss] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const fetchComplaint = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/complaints/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setComplaint(data.complaint);
    } catch (err) { setError(err.response?.data?.error || "Failed to load"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchComplaint(); }, [fetchComplaint]);

  async function handleAction(endpoint, payload) {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}${endpoint}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      await fetchComplaint();
      setShowVerdict(false); setShowDismiss(false); setShowEscalate(false); setShowResolve(false);
      toast.success("Done!");
    } catch (err) { toast.error(err.response?.data?.error || "Failed"); }
    finally { setSaving(false); }
  }

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}><span style={{ width: 24, height: 24, border: '3px solid rgba(245,240,232,0.06)', borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /></div>;
  if (error || !complaint) return <div style={{ textAlign: 'center', padding: '4rem' }}><p style={{ color: 'rgba(245,240,232,0.4)', marginBottom: '1rem' }}>{error || "Not found"}</p><button onClick={() => navigate("/caretaker/complaints")} style={{ color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}>← Back</button></div>;

  const isSpecificTenant = complaint.complaint_scope === "specific_tenant";
  const scopeLabel = SCOPE_LABELS[complaint.complaint_scope] || "Unknown";
  const hasAgainstParty = isSpecificTenant && complaint.against_name;
  const canMarkUnderReview = complaint.status === "open";
  const canIssueVerdict = complaint.status === "under_review" && hasAgainstParty;
  const canMarkResolved = complaint.status === "under_review" && !hasAgainstParty;
  const canDismiss = ["open", "under_review"].includes(complaint.status);
  const canEscalate = ["open", "under_review"].includes(complaint.status);
  const canReopen = ["resolved", "dismissed"].includes(complaint.status);

  const S = { container: { maxWidth: 1200, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' }, backBtn: { display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, background: 'none', border: 'none', cursor: 'pointer', marginBottom: '1.2rem' }, sectionTitle: { fontSize: '0.68rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.7rem' } };

  return (
    <div style={S.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {saving && <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ background: C.muted2, padding: '1rem 1.5rem', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '0.6rem' }}><span style={{ width: 16, height: 16, border: '2px solid rgba(245,240,232,0.06)', borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /><span style={{ color: C.white, fontFamily: F.dm }}>Saving...</span></div></div>}

      {showVerdict && <VerdictModal complaint={complaint} onClose={() => setShowVerdict(false)} onSubmit={d => handleAction(`/caretaker/complaints/${id}/verdict`, d)} />}
      {showDismiss && <TextActionModal title="Dismiss Complaint" sub={complaint.subject} icon="x-circle" iconBg={{ background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.15)', color: C.redLight }} label="Reason for Dismissal" placeholder="Explain why..." btnLabel="Dismiss" btnBg={C.redLight} onClose={() => setShowDismiss(false)} onSubmit={v => handleAction(`/caretaker/complaints/${id}/dismiss`, { reason: v })} />}
      {showEscalate && <TextActionModal title="Escalate to Landlord" sub={complaint.subject} icon="arrow-up" iconBg={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', color: C.purple }} label="Reason for Escalation" placeholder="Explain why..." btnLabel="Escalate" btnBg={C.purple} onClose={() => setShowEscalate(false)} onSubmit={v => handleAction(`/caretaker/complaints/${id}/escalate`, { reason: v })} />}
      {showResolve && <TextActionModal title="Resolve Complaint" sub={complaint.subject} icon="check" iconBg={{ background: 'rgba(26,122,74,0.08)', border: '1px solid rgba(76,186,122,0.15)', color: C.greenLight }} label="Resolution Notes" placeholder="How was this resolved?" btnLabel="Mark Resolved" btnBg={C.greenLight} onClose={() => setShowResolve(false)} onSubmit={v => handleAction(`/caretaker/complaints/${id}/resolve`, { notes: v })} />}

      <button onClick={() => navigate("/caretaker/complaints")} style={S.backBtn} onMouseEnter={e => e.currentTarget.style.color = C.white} onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}><Icon name="chevron-left" size={13} /> Back</button>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem' }}>
        <style>{`@media (min-width: 1024px) { .comp-grid { grid-template-columns: 1fr 300px !important; } }`}</style>
        <div className="comp-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem', alignItems: 'start' }}>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
                <StatusBadge status={complaint.status} />
                <span style={{ fontSize: '0.6rem', fontWeight: 600, padding: '0.15rem 0.5rem', borderRadius: '3px', fontFamily: F.mono, color: 'rgba(245,240,232,0.4)', background: C.black, border: `1px solid ${C.border}` }}>{scopeLabel}</span>
              </div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: C.white, fontFamily: F.dm, marginBottom: '0.4rem' }}>{complaint.subject}</h2>
              <p style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.45)', lineHeight: 1.6 }}>{complaint.description}</p>
            </div>

            <div style={cardStyle}>
              <h3 style={S.sectionTitle}>Parties Involved</h3>
              <div style={{ display: 'grid', gridTemplateColumns: hasAgainstParty ? '1fr 1fr 1fr' : '1fr 1fr', gap: '0.6rem' }}>
                <div style={{ padding: '0.7rem', borderRadius: '3px', background: 'rgba(58,143,212,0.06)', border: '1px solid rgba(58,143,212,0.12)' }}><p style={{ fontSize: '0.58rem', fontWeight: 600, color: C.blue, fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '3px' }}>Filed By</p><p style={{ fontSize: '0.8rem', fontWeight: 600, color: C.white }}>{complaint.filed_by_name}</p></div>
                {hasAgainstParty && <div style={{ padding: '0.7rem', borderRadius: '3px', background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.12)' }}><p style={{ fontSize: '0.58rem', fontWeight: 600, color: C.redLight, fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '3px' }}>Against</p><p style={{ fontSize: '0.8rem', fontWeight: 600, color: C.white }}>{complaint.against_name}</p>{complaint.against_unit_number && <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>Unit {complaint.against_unit_number}</p>}</div>}
                <div style={{ padding: '0.7rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}` }}><p style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '3px' }}>Property</p><p style={{ fontSize: '0.8rem', fontWeight: 600, color: C.white }}>{complaint.property_name || "—"}</p></div>
              </div>
            </div>

            {complaint.evidence?.length > 0 && (
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Evidence ({complaint.evidence.length})</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '0.5rem' }}>
                  {complaint.evidence.map((item, idx) => (
                    <button key={item.id || idx} onClick={() => { setViewerIndex(idx); setViewerOpen(true); }} style={{ aspectRatio: '1', borderRadius: '4px', overflow: 'hidden', border: `1px solid ${C.border}`, cursor: 'pointer', background: C.black }}>
                      <img src={item.document_url?.startsWith('http') ? item.document_url : `${API}${item.document_url || ''}`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {complaint.resolution_notes && (
              <div style={{ ...cardStyle, background: complaint.status === "resolved" ? 'rgba(26,122,74,0.04)' : 'rgba(224,90,74,0.04)', border: `1px solid ${complaint.status === "resolved" ? 'rgba(76,186,122,0.15)' : 'rgba(224,90,74,0.15)'}` }}>
                <h3 style={{ ...S.sectionTitle, color: complaint.status === "resolved" ? C.greenLight : C.redLight }}>{complaint.status === "resolved" ? "Resolution" : "Dismissal Reason"}</h3>
                <p style={{ fontSize: '0.78rem', color: complaint.status === "resolved" ? C.greenLight : C.redLight }}>{complaint.resolution_notes}</p>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            <div style={cardStyle}>
              <h3 style={S.sectionTitle}>Details</h3>
              {[["Category", complaint.category?.replace(/_/g, " ")], ["Scope", scopeLabel], ["Severity", `${complaint.severity}/5`], ["Submitted", fmtDate(complaint.created_at)]].map(([l, v]) => (
                <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0', fontSize: '0.7rem' }}><span style={{ color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{l}</span><span style={{ color: C.white, fontWeight: 500 }}>{v}</span></div>
              ))}
            </div>

            <div style={cardStyle}>
              <h3 style={S.sectionTitle}>Actions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {canMarkUnderReview && <button onClick={() => handleAction(`/caretaker/complaints/${id}/review`, {})} style={btnStyle(C.gold, C.black)}>Mark Under Review</button>}
                {canMarkResolved && <button onClick={() => setShowResolve(true)} style={btnStyle(C.greenLight, C.white)}>Mark Resolved</button>}
                {canIssueVerdict && <button onClick={() => setShowVerdict(true)} style={btnStyle('#f97316', C.white)}>Issue Verdict</button>}
                {canDismiss && <button onClick={() => setShowDismiss(true)} style={btnStyle(C.redLight, C.white)}>Dismiss</button>}
                {canEscalate && <button onClick={() => setShowEscalate(true)} style={btnStyle(C.purple, C.white)}>Escalate to Landlord</button>}
                {canReopen && <button onClick={() => handleAction(`/complaints/${id}/reopen`, { reason: "Caretaker reopened" })} style={btnStyle(C.blue, C.white)}>Reopen</button>}
                {!canMarkUnderReview && !canMarkResolved && !canIssueVerdict && !canDismiss && !canEscalate && !canReopen && <p style={{ textAlign: 'center', color: 'rgba(245,240,232,0.2)', fontSize: '0.72rem', fontFamily: F.mono }}>No actions available</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {viewerOpen && complaint.evidence?.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setViewerOpen(false)}>
          <button onClick={() => setViewerOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none', cursor: 'pointer', zIndex: 10 }}><Icon name="x" size={22} /></button>
          {viewerIndex > 0 && <button onClick={e => { e.stopPropagation(); setViewerIndex(v => v - 1); }} style={{ position: 'absolute', left: '1rem', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="chevron-left" size={22} /></button>}
          {viewerIndex < complaint.evidence.length - 1 && <button onClick={e => { e.stopPropagation(); setViewerIndex(v => v + 1); }} style={{ position: 'absolute', right: '1rem', color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none', cursor: 'pointer' }}><Icon name="chevron-right" size={22} /></button>}
          <img src={complaint.evidence[viewerIndex]?.document_url?.startsWith('http') ? complaint.evidence[viewerIndex].document_url : `${API}${complaint.evidence[viewerIndex]?.document_url}`} alt="" style={{ maxHeight: '85vh', maxWidth: '90%', objectFit: 'contain', borderRadius: '4px' }} onClick={e => e.stopPropagation()} />
          <div style={{ position: 'absolute', bottom: '1.5rem', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>{viewerIndex + 1} / {complaint.evidence.length}</div>
        </div>
      )}
    </div>
  );
}