/* eslint-disable no-unused-vars */
// LANDLORD COMPLAINT DETAIL PAGE 
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

const STATUS_CONFIG = {
  open:                   { label: "Open",               color: C.redLight,   bg: 'rgba(224,90,74,0.1)',    border: '1px solid rgba(224,90,74,0.2)',   dot: C.redLight   },
  under_review:           { label: "Under Review",       color: C.gold,       bg: 'rgba(232,160,18,0.08)',   border: '1px solid rgba(232,160,18,0.2)',   dot: C.gold       },
  awaiting_clarification: { label: "Needs Clarification",color: '#f59e0b',    bg: 'rgba(245,158,11,0.1)',    border: '1px solid rgba(245,158,11,0.2)',   dot: '#f59e0b'    },
  approved:               { label: "Approved",           color: C.blue,       bg: 'rgba(58,143,212,0.1)',    border: '1px solid rgba(58,143,212,0.2)',   dot: C.blue       },
  resolved:               { label: "Resolved",           color: C.greenLight, bg: 'rgba(26,122,74,0.1)',    border: '1px solid rgba(76,186,122,0.2)',   dot: C.greenLight },
  rejected:               { label: "Rejected",           color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)', dot: 'rgba(245,240,232,0.3)' },
  escalated:              { label: "Escalated",          color: C.purple,     bg: 'rgba(139,92,246,0.1)',    border: '1px solid rgba(139,92,246,0.2)',   dot: C.purple     },
  dismissed:              { label: "Dismissed",          color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)', dot: 'rgba(245,240,232,0.3)' },
};

const SCOPE_LABELS = {
  specific_tenant: "Specific Unit / Tenant",
  common_area: "Common Area",
  unknown: "Unknown / General",
  property_wide: "Property-Wide Issue",
};


const inputStyle = {
  width: '100%', fontSize: '0.82rem', padding: '0.6rem 0.9rem', borderRadius: '3px',
  background: C.black, border: `1px solid ${C.border}`, color: C.white,
  fontFamily: F.dm, outline: 'none',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.75rem center',
  paddingRight: '2rem',
};

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

const cardStyle = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.5rem',
};

const modalOverlay = {
  position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
};


function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["open"];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.58rem', fontWeight: 700, padding: '0.12rem 0.45rem',
      borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
      textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: cfg.border,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function fmtDate(dateValue) {
  return dateValue ? new Date(dateValue).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "";
}

function timeAgo(dateValue) {
  if (!dateValue) return "";
  const seconds = (Date.now() - new Date(dateValue).getTime()) / 1000;
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function isImageEvidence(item) {
  return item.mimeType?.startsWith("image/");
}


function TextActionModal({ title, subtitle, fieldLabel, placeholder, confirmLabel, confirmColor, onClose, onSubmit }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!value.trim()) { setError("Please provide a response."); return; }
    setLoading(true);
    onSubmit(value.trim());
    setLoading(false);
  }

  return (
    <div style={modalOverlay}>
      <div style={{ width: '100%', maxWidth: 440, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>{title}</h3>
            <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{subtitle}</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {error && (
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)', fontSize: '0.72rem', color: C.redLight }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {fieldLabel}
            </label>
            <textarea rows={4} value={value} onChange={e => { setValue(e.target.value); setError(""); }} placeholder={placeholder}
              style={{ ...inputStyle, resize: 'vertical', minHeight: 80, fontSize: '0.72rem' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{
            flex: 1, padding: '0.6rem 1.2rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600,
            fontFamily: F.dm, letterSpacing: '0.04em', border: 'none', cursor: 'pointer',
            background: confirmColor, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function VerdictModal({ complaint, onClose, onSubmit }) {
  const [verdictType, setVerdictType] = useState("warning");
  const [fineAmount, setFineAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (verdictType === "fine" && (!fineAmount || Number(fineAmount) <= 0)) {
      setError("Please enter a valid fine amount.");
      return;
    }
    onSubmit({ type: verdictType, fineAmount: verdictType === "fine" ? Number(fineAmount) : null, notes: notes.trim() || null });
  }

  return (
    <div style={modalOverlay}>
      <div style={{ width: '100%', maxWidth: 440, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Issue Verdict</h3>
            <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{complaint.subject}</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {error && (
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)', fontSize: '0.72rem', color: C.redLight }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Verdict type
            </label>
            <select value={verdictType} onChange={e => { setVerdictType(e.target.value); setError(""); }} style={selectStyle}>
              <option value="warning">Warning</option>
              <option value="fine">Fine</option>
              <option value="final_warning">Final warning</option>
              <option value="eviction_notice">Eviction notice</option>
            </select>
          </div>
          {verdictType === "fine" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Fine amount (R)
              </label>
              <input type="number" min="0" value={fineAmount} onChange={e => { setFineAmount(e.target.value); setError(""); }}
                style={inputStyle} />
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Notes
            </label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason, terms, or follow-up instructions..."
              style={{ ...inputStyle, resize: 'vertical', minHeight: 60, fontSize: '0.72rem' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
          <button onClick={handleSubmit} style={{
            flex: 1, padding: '0.6rem 1.2rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600,
            fontFamily: F.dm, letterSpacing: '0.04em', border: 'none', cursor: 'pointer',
            background: C.red, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            Save verdict
          </button>
        </div>
      </div>
    </div>
  );
}


export default function LandlordComplaintDetail() {
  useDocumentTitle("Complaint Detail");
  const navigate = useNavigate();
  const { id } = useParams();
  const toast = useToast();

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [activeModal, setActiveModal] = useState(null);

  const fetchComplaint = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/complaints/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaint(response.data.complaint);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load complaint");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaint();
  }, [fetchComplaint]);

  async function handleAction(endpoint, payload) {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}${endpoint}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchComplaint();
      setActiveModal(null);
      toast.success("Action completed successfully.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Action failed");
    } finally {
      setSaving(false);
    }
  }

  
  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    backBtn: {
      display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem',
      color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, background: 'none',
      border: 'none', cursor: 'pointer', marginBottom: '1.2rem', transition: 'color 0.15s',
    },
    sectionTitle: {
      fontSize: '0.78rem', fontWeight: 600, color: C.white, fontFamily: F.bebas,
      letterSpacing: '0.03em', marginBottom: '0.8rem',
    },
    detailRow: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.55rem 0', borderBottom: `1px solid ${C.border}`,
    },
    pill: (color, bg, border) => ({
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '0.6rem', fontWeight: 600, padding: '0.2rem 0.6rem',
      borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
      textTransform: 'uppercase', color, background: bg, border,
    }),
    actionBtn: (bg, color, hoverBg) => ({
      width: '100%', padding: '0.7rem 1rem', borderRadius: '3px',
      fontSize: '0.78rem', fontWeight: 600, fontFamily: F.dm,
      letterSpacing: '0.04em', border: 'none', cursor: 'pointer',
      background: bg, color: color, transition: 'background 0.15s',
    }),
  };

  
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ display: 'block', width: 32, height: 32, border: '3px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite', margin: '0 auto 0.8rem' }} />
          <p style={{ fontSize: '0.82rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>Loading complaint...</p>
        </div>
      </div>
    );
  }

  
  if (error || !complaint) {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, padding: '2rem 1rem' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={cardStyle}>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: C.white, marginBottom: '0.5rem' }}>Complaint not found</h2>
            <p style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.4)', marginBottom: '1.2rem' }}>{error || "This complaint could not be loaded."}</p>
            <button onClick={() => navigate("/landlord/complaints")} style={btnPrimary}>
              <Icon name="chevron-left" size={14} /> Back to complaints
            </button>
          </div>
        </div>
      </div>
    );
  }

  const evidence = complaint.evidence || [];
  const isSpecificTenant = complaint.complaint_scope === "specific_tenant";
  const isCommonArea = complaint.complaint_scope === "common_area";
  const hasAgainstParty = isSpecificTenant && complaint.against_name;
  const scopeLabel = SCOPE_LABELS[complaint.complaint_scope] || "Unknown";
  const isLandlordOwnedComplaint = ["escalated", "approved", "awaiting_clarification"].includes(complaint.status);
  const canClarify = ["escalated", "awaiting_clarification", "approved"].includes(complaint.status);
  const canApprove = ["escalated", "awaiting_clarification"].includes(complaint.status);
  const canReject = ["escalated", "awaiting_clarification"].includes(complaint.status);
  const canIssueVerdict = complaint.status === "approved" && !complaint.resolution_notes && hasAgainstParty;

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* SAVING OVERLAY */}
      {saving && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.2rem 1.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <span style={{ width: 18, height: 18, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: C.white, fontFamily: F.dm }}>Updating complaint...</span>
          </div>
        </div>
      )}

      {/* MODALS */}
      {activeModal === "clarify" && (
        <TextActionModal title="Request Clarification" subtitle={complaint.subject} fieldLabel="Clarification request"
          placeholder="Tell the tenant what details you need..." confirmLabel="Request clarification" confirmColor="#d97706"
          onClose={() => setActiveModal(null)}
          onSubmit={value => handleAction(`/landlord/complaints/${id}/clarify`, { request: value })} />
      )}

      {activeModal === "reject" && (
        <TextActionModal title="Reject Complaint" subtitle={complaint.subject} fieldLabel="Reason for rejection"
          placeholder="Explain why..." confirmLabel="Reject complaint" confirmColor="rgba(245,240,232,0.3)"
          onClose={() => setActiveModal(null)}
          onSubmit={value => handleAction(`/landlord/complaints/${id}/reject`, { reason: value })} />
      )}

      {activeModal === "note" && (
        <TextActionModal title="Add Internal Note" subtitle={complaint.subject} fieldLabel="Internal note"
          placeholder="Add a note..." confirmLabel="Add note" confirmColor={C.blue}
          onClose={() => setActiveModal(null)}
          onSubmit={value => toast.success("Note added.")} />
      )}

      {activeModal === "verdict" && (
        <VerdictModal complaint={complaint} onClose={() => setActiveModal(null)}
          onSubmit={value => handleAction(`/landlord/complaints/${id}/verdict`, value)} />
      )}

      {/* IMAGE VIEWER */}
      {viewerOpen && evidence.length > 0 && isImageEvidence(evidence[viewerIndex]) && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.95)', padding: '1rem' }} onClick={() => setViewerOpen(false)}>
          <button onClick={() => setViewerOpen(false)} style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
            <Icon name="x" size={20} />
          </button>
          <img src={evidence[viewerIndex].document_url} alt={evidence[viewerIndex].label} style={{ maxHeight: '85vh', maxWidth: '100%', borderRadius: '6px', objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
        </div>
      )}

      <div style={S.container}>
        {/* BACK BUTTON */}
        <button onClick={() => navigate("/landlord/complaints")} style={S.backBtn}
          onMouseEnter={e => e.currentTarget.style.color = C.white}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
          <Icon name="chevron-left" size={14} /> Back to Complaints
        </button>

        {/* MAIN GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem' }}>
          <style>{`@media (min-width: 1024px) { .complaint-grid { grid-template-columns: 1fr 320px !important; } }`}</style>
          
          <div className="complaint-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem', alignItems: 'start' }}>

            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {/* MAIN CARD */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <StatusBadge status={complaint.status} />
                  <span style={S.pill('rgba(245,240,232,0.4)', 'rgba(245,240,232,0.04)', '1px solid rgba(245,240,232,0.1)')}>
                    {scopeLabel}
                  </span>
                </div>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: C.white, fontFamily: F.dm, marginBottom: '0.6rem' }}>
                  {complaint.subject}
                </h2>
                <p style={{ fontSize: '0.82rem', color: 'rgba(245,240,232,0.4)', lineHeight: 1.7 }}>
                  {complaint.description}
                </p>
                {isCommonArea && complaint.common_area_location && (
                  <div style={{ marginTop: '0.8rem', ...S.pill(C.gold, 'rgba(232,160,18,0.06)', '1px solid rgba(232,160,18,0.15)') }}>
                    <Icon name="map-pin" size={10} /> {complaint.common_area_location}
                  </div>
                )}
              </div>

              {/* PARTIES CARD */}
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Parties Involved</h3>
                <div style={{ display: 'grid', gridTemplateColumns: hasAgainstParty ? '1fr 1fr 1fr' : '1fr 1fr', gap: '0.8rem' }}>
                  <div style={{ padding: '0.8rem', borderRadius: '3px', background: 'rgba(58,143,212,0.06)', border: '1px solid rgba(58,143,212,0.12)' }}>
                    <p style={{ fontSize: '0.58rem', fontWeight: 600, color: C.blue, fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Filed by</p>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: C.white }}>{complaint.filed_by_name}</p>
                  </div>
                  {hasAgainstParty && (
                    <div style={{ padding: '0.8rem', borderRadius: '3px', background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.12)' }}>
                      <p style={{ fontSize: '0.58rem', fontWeight: 600, color: C.redLight, fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Against</p>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: C.white }}>{complaint.against_name}</p>
                      {complaint.against_unit_number && <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, marginTop: '2px' }}>Unit {complaint.against_unit_number}</p>}
                    </div>
                  )}
                  <div style={{ padding: '0.8rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: '0.58rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Property</p>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: C.white }}>{complaint.property_name}</p>
                    {isCommonArea && complaint.common_area_location && (
                      <p style={{ fontSize: '0.65rem', color: C.gold, fontFamily: F.mono, marginTop: '2px' }}>{complaint.common_area_location}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* EVIDENCE CARD */}
              {evidence.length > 0 && (
                <div style={cardStyle}>
                  <h3 style={S.sectionTitle}>Evidence ({evidence.length})</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                    {evidence.map((item, index) => (
                      <div key={item.id || index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 0.8rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}` }}>
                        <p style={{ fontSize: '0.75rem', fontWeight: 500, color: C.white, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1, minWidth: 0 }}>
                          {item.label || `Evidence ${index + 1}`}
                        </p>
                        {isImageEvidence(item) ? (
                          <button onClick={() => { setViewerIndex(index); setViewerOpen(true); }} style={{
                            marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.35rem 0.6rem', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 500,
                            fontFamily: F.mono, letterSpacing: '0.04em', border: `1px solid ${C.border}`,
                            background: 'transparent', color: C.blue, cursor: 'pointer', whiteSpace: 'nowrap',
                          }}>
                            <Icon name="eye" size={12} /> Preview
                          </button>
                        ) : (
                          <a href={item.document_url} target="_blank" rel="noreferrer" style={{
                            marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.35rem 0.6rem', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 500,
                            fontFamily: F.mono, letterSpacing: '0.04em', border: `1px solid ${C.border}`,
                            background: 'transparent', color: 'rgba(245,240,232,0.4)', cursor: 'pointer',
                            textDecoration: 'none', whiteSpace: 'nowrap',
                          }}>
                            <Icon name="file" size={12} /> Open
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RESOLUTION */}
              {complaint.resolution_notes && complaint.status === "resolved" && (
                <div style={{ ...cardStyle, background: 'rgba(26,122,74,0.04)', border: '1px solid rgba(76,186,122,0.2)' }}>
                  <h3 style={{ ...S.sectionTitle, color: C.greenLight, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icon name="check" size={14} /> Resolution
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: C.greenLight, lineHeight: 1.6 }}>{complaint.resolution_notes}</p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {/* DETAILS CARD */}
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Details</h3>
                <div>
                  {[
                    ["Category", (complaint.category || "").replace(/_/g, " ")],
                    ["Severity", `${complaint.severity}/5`],
                    ["Submitted", fmtDate(complaint.created_at)],
                    ["Updated", fmtDate(complaint.updated_at)],
                  ].map(([label, val]) => (
                    <div key={label} style={S.detailRow}>
                      <span style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{label}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 500, color: C.white }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTIONS CARD */}
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Actions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {canClarify && (
                    <button onClick={() => setActiveModal("clarify")} style={S.actionBtn('#d97706', C.white)}
                      onMouseEnter={e => e.currentTarget.style.background = '#b45309'}
                      onMouseLeave={e => e.currentTarget.style.background = '#d97706'}>
                      Request clarification
                    </button>
                  )}
                  {canApprove && (
                    <button onClick={() => handleAction(`/landlord/complaints/${id}/approve`, {})} style={S.actionBtn(C.greenLight, C.black)}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                      Approve complaint
                    </button>
                  )}
                  {canIssueVerdict && (
                    <button onClick={() => setActiveModal("verdict")} style={S.actionBtn(C.red, C.white)}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                      Issue verdict
                    </button>
                  )}
                  {!canIssueVerdict && complaint.status === "approved" && !hasAgainstParty && (
                    <div style={{ padding: '0.7rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, textAlign: 'center', fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>
                      Verdict unavailable — no specific party identified.
                    </div>
                  )}
                  {canReject && (
                    <button onClick={() => setActiveModal("reject")} style={S.actionBtn('rgba(245,240,232,0.08)', 'rgba(245,240,232,0.4)')}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,240,232,0.15)'; e.currentTarget.style.color = C.white; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(245,240,232,0.08)'; e.currentTarget.style.color = 'rgba(245,240,232,0.4)'; }}>
                      Reject complaint
                    </button>
                  )}
                  {!isLandlordOwnedComplaint && (
                    <p style={{ padding: '0.7rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, textAlign: 'center', fontSize: '0.68rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono }}>
                      Complaint currently being handled by the caretaker.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}