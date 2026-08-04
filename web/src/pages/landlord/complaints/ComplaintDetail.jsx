import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

const STATUS_CONFIG = {
  open:                   { label: "Open",               color: C.redLight,   bg: 'rgba(224,90,74,0.1)',    border: '1px solid rgba(224,90,74,0.2)',   dot: C.redLight,   icon: 'alert-circle' },
  under_review:           { label: "Under Review",       color: C.gold,       bg: 'rgba(232,160,18,0.08)',   border: '1px solid rgba(232,160,18,0.2)',   dot: C.gold,       icon: 'search' },
  awaiting_clarification: { label: "Needs Clarification",color: '#f59e0b',    bg: 'rgba(245,158,11,0.1)',    border: '1px solid rgba(245,158,11,0.2)',   dot: '#f59e0b',    icon: 'help-circle' },
  approved:               { label: "Approved",           color: C.blue,       bg: 'rgba(58,143,212,0.1)',    border: '1px solid rgba(58,143,212,0.2)',   dot: C.blue,       icon: 'thumbs-up' },
  resolved:               { label: "Resolved",           color: C.greenLight, bg: 'rgba(26,122,74,0.1)',    border: '1px solid rgba(76,186,122,0.2)',   dot: C.greenLight, icon: 'check-circle' },
  rejected:               { label: "Rejected",           color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)', dot: 'rgba(245,240,232,0.3)', icon: 'x-circle' },
  escalated:              { label: "Escalated",          color: C.purple,     bg: 'rgba(139,92,246,0.1)',    border: '1px solid rgba(139,92,246,0.2)',   dot: C.purple,     icon: 'trending-up' },
  dismissed:              { label: "Dismissed",          color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)', dot: 'rgba(245,240,232,0.3)', icon: 'archive' },
};

const CATEGORY_CONFIG = {
  noise:              { label: "Noise",              color: '#f97316', icon: 'volume-2' },
  cleanliness:        { label: "Cleanliness",        color: C.greenLight, icon: 'sparkles' },
  neighbor_dispute:   { label: "Neighbor Dispute",   color: C.purple, icon: 'users' },
  parking:            { label: "Parking",            color: C.blue, icon: 'truck' },
  security:           { label: "Security",           color: C.redLight, icon: 'shield' },
  pets:               { label: "Pets",               color: '#84CC16', icon: 'github' },
  smoking:            { label: "Smoking",            color: '#f97316', icon: 'wind' },
  property_damage:    { label: "Property Damage",    color: C.redLight, icon: 'tool' },
  maintenance_issue:  { label: "Maintenance",        color: C.gold, icon: 'wrench' },
  other:              { label: "Other",              color: 'rgba(245,240,232,0.4)', icon: 'more-horizontal' },
};

const SCOPE_LABELS = {
  specific_tenant: "Specific Unit / Tenant",
  common_area: "Common Area",
  unknown: "Unknown / General",
  property_wide: "Property-Wide Issue",
};

const VERDICT_LABELS = {
  warning: "Warning Issued",
  fine: "Fine Issued",
  dismissed: "Dismissed",
  final_warning: "Final Warning",
  eviction_notice: "Eviction Notice",
};

const VERDICT_COLORS = {
  warning: { color: C.gold, bg: 'rgba(232,160,18,0.08)', border: '1px solid rgba(232,160,18,0.2)', icon: 'alert-triangle' },
  fine: { color: C.redLight, bg: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)', icon: 'rand' },
  dismissed: { color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)', icon: 'x' },
  final_warning: { color: C.redLight, bg: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)', icon: 'alert-octagon' },
  eviction_notice: { color: C.redLight, bg: 'rgba(224,90,74,0.1)', border: '1px solid rgba(224,90,74,0.25)', icon: 'home' },
};

const ACTION_COLORS = {
  clarify: { bg: 'rgba(249,115,22,0.08)', color: '#f97316', hoverBg: 'rgba(249,115,22,0.15)' },
  verdict: { bg: 'rgba(249,115,22,0.08)', color: '#f97316', hoverBg: 'rgba(249,115,22,0.15)' },
  reject: { bg: 'rgba(224,90,74,0.08)', color: C.redLight, hoverBg: 'rgba(224,90,74,0.15)' },
  resolve: { bg: 'rgba(26,122,74,0.08)', color: C.greenLight, hoverBg: 'rgba(26,122,74,0.15)' },
  approve: { bg: 'rgba(58,143,212,0.08)', color: C.blue, hoverBg: 'rgba(58,143,212,0.15)' },
  escalation: { bg: 'rgba(139,92,246,0.08)', color: C.purple, hoverBg: 'rgba(139,92,246,0.15)' },
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

const actionBtnStyle = (colorKey) => ({
  width: '100%', padding: '0.7rem 1rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600,
  fontFamily: F.dm, background: ACTION_COLORS[colorKey].bg, color: ACTION_COLORS[colorKey].color,
  border: `1px solid ${ACTION_COLORS[colorKey].color}20`, cursor: 'pointer',
  transition: 'all 0.15s', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '0.5rem',
});

const cardStyle = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.5rem',
};

const modalOverlay = {
  position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
};

function getFullUrl(url) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API}${url}`;
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["open"];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
      fontSize: '0.6rem', fontWeight: 700, padding: '0.2rem 0.55rem',
      borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
      textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: cfg.border,
    }}>
      <Icon name={cfg.icon} size={10} />
      {cfg.label}
    </span>
  );
}

function fmt(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function fmtDate(dateValue) {
  return dateValue ? new Date(dateValue).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "";
}
function fmtDateTime(dateValue) {
  return dateValue ? new Date(dateValue).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
}

function isImageEvidence(item) {
  return item.mime_type?.startsWith("image/") || item.document_url?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
}

function TextActionModal({ title, sub, icon, iconBg, label, placeholder, btnLabel, btnColorKey, onClose, onSubmit }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const colors = ACTION_COLORS[btnColorKey] || ACTION_COLORS.verdict;

  function handleSubmit() {
    if (!value.trim()) { setError("This field is required"); return; }
    onSubmit(value.trim());
    onClose();
  }

  return (
    <div style={modalOverlay}>
      <div style={{ width: '100%', maxWidth: 440, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: '6px', ...iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={icon} size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>{title}</h3>
              {sub && <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{sub}</p>}
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={17} />
          </button>
        </div>
        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {error && (
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)', fontSize: '0.72rem', color: C.redLight, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icon name="alert-circle" size={12} /> {error}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label} *</label>
            <textarea rows={4} value={value} onChange={e => { setValue(e.target.value); setError(""); }} placeholder={placeholder} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
          <button onClick={handleSubmit} style={{ flex: 1, padding: '0.55rem', borderRadius: '3px', background: colors.bg, color: colors.color, border: `1px solid ${colors.color}30`, cursor: 'pointer', fontFamily: F.dm, fontWeight: 600, fontSize: '0.74rem' }}>
            {btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function VerdictModal({ complaint, isOverride, onClose, onSubmit }) {
  const [verdictType, setVerdictType] = useState("warning");
  const [fineAmount, setFineAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (verdictType === "fine" && (!fineAmount || Number(fineAmount) <= 0)) {
      setError("Please enter a valid fine amount.");
      return;
    }
    onSubmit({
      verdict_type: verdictType,
      fine_amount: verdictType === "fine" ? Number(fineAmount) : null,
      notes: notes.trim() || null,
    });
  }

  return (
    <div style={modalOverlay}>
      <div style={{ width: '100%', maxWidth: 460, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: '6px', background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="gavel" size={16} color="#f97316" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>
                {isOverride ? "Override Verdict" : "Issue Final Verdict"}
              </h3>
              <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{complaint.subject}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          {error && (
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)', fontSize: '0.72rem', color: C.redLight, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Icon name="alert-circle" size={12} /> {error}
            </div>
          )}
          
          {/* Warning about override */}
          {isOverride && (
            <div style={{ padding: '0.7rem 0.9rem', borderRadius: '3px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', fontSize: '0.7rem', color: C.purple, fontFamily: F.dm, lineHeight: 1.5 }}>
              <strong>Override Mode:</strong> You are overriding the caretaker's previous verdict. This will issue a new final verdict.
            </div>
          )}
          
          {/* Who verdict affects */}
          {complaint.against_name && (
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(224,90,74,0.04)', border: '1px solid rgba(224,90,74,0.1)', fontSize: '0.72rem', color: C.redLight, fontFamily: F.dm }}>
              This verdict will be issued against <strong>{complaint.against_name}</strong>
              {complaint.against_unit_number && <> (Unit {complaint.against_unit_number})</>}
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Verdict Type
            </label>
            <select value={verdictType} onChange={e => { setVerdictType(e.target.value); setError(""); }} style={selectStyle}>
              <option value="warning"> Warning</option>
              <option value="fine"> Fine</option>
              {isOverride && (
                <>
                  <option value="final_warning"> Final Warning</option>
                  <option value="eviction_notice"> Eviction Notice</option>
                </>
              )}
              <option value="dismissed"> Dismiss Complaint</option>
            </select>
          </div>
          
          {verdictType === "fine" && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Fine Amount (R)
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.3)', fontSize: '0.8rem', fontFamily: F.mono }}>R</span>
                <input type="number" min="0" value={fineAmount} onChange={e => { setFineAmount(e.target.value); setError(""); }}
                  style={{ ...inputStyle, paddingLeft: '2rem' }} placeholder="500" />
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Notes (optional)
            </label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason for this decision..."
              style={{ ...inputStyle, resize: 'vertical', minHeight: 60, fontSize: '0.72rem' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
          <button onClick={handleSubmit} style={{
            flex: 1, padding: '0.55rem', borderRadius: '3px', background: isOverride ? 'rgba(139,92,246,0.12)' : 'rgba(249,115,22,0.12)', 
            color: isOverride ? C.purple : '#f97316',
            border: `1px solid ${isOverride ? C.purple : '#f97316'}30`, cursor: 'pointer', fontFamily: F.dm, fontWeight: 600, fontSize: '0.74rem',
          }}>
            {isOverride ? "Override Verdict" : "Issue Verdict"}
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
  const [showVerdict, setShowVerdict] = useState(false);
  const [showClarify, setShowClarify] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [showEscalationReject, setShowEscalationReject] = useState(false);

  const fetchComplaint = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/landlord/complaints/${id}`, {
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
      const method = endpoint.includes('/verdict') || endpoint.includes('/override-verdict') ? 'post' : 'put';
      await axios({
        method,
        url: `${API}/landlord/complaints/${id}${endpoint}`,
        data: payload,
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchComplaint();
      setShowVerdict(false);
      setShowClarify(false);
      setShowReject(false);
      setShowResolve(false);
      setShowEscalationReject(false);
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
      fontSize: '0.7rem', fontWeight: 600, color: 'rgba(245,240,232,0.2)', fontFamily: F.mono,
      letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '0.8rem',
    },
    detailRow: {
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.55rem 0', borderBottom: `1px solid ${C.border}20`,
    },
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: C.black, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <span style={{ display: 'block', width: 32, height: 32, border: '3px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          <p style={{ fontSize: '0.82rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>Loading complaint...</p>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div style={{ minHeight: '100vh', background: C.black, padding: '2rem 1rem' }}>
        <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center' }}>
          <div style={cardStyle}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(224,90,74,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Icon name="alert-circle" size={22} color={C.redLight} />
            </div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: C.white, marginBottom: '0.5rem' }}>Complaint not found</h2>
            <p style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.4)', marginBottom: '1.2rem' }}>{error || "This complaint could not be loaded."}</p>
            <button onClick={() => navigate("/landlord/complaints")} style={btnPrimary}>
              <Icon name="chevronLeft" size={14} /> Back to Complaints
            </button>
          </div>
        </div>
      </div>
    );
  }

  const evidence = complaint.evidence || [];
  const verdict = complaint.verdict || null;
  const catCfg = CATEGORY_CONFIG[complaint.category] ?? CATEGORY_CONFIG.other;
  const isSpecificTenant = complaint.complaint_scope === "specific_tenant";
  const isCommonArea = complaint.complaint_scope === "common_area";
  const hasAgainstParty = isSpecificTenant && complaint.against_name;
  const scopeLabel = SCOPE_LABELS[complaint.complaint_scope] || "Unknown";
  const isEscalated = complaint.status === "escalated";
  const isClosed = ["resolved", "rejected", "dismissed"].includes(complaint.status);
  const canAct = isEscalated || ["open", "under_review", "awaiting_clarification", "approved"].includes(complaint.status);
  const canIssueVerdict = canAct && hasAgainstParty;

  return (
    <div style={{ minHeight: '100vh', background: C.black }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Saving overlay */}
      {saving && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.2rem 1.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <span style={{ width: 18, height: 18, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: C.white, fontFamily: F.dm }}>Processing...</span>
          </div>
        </div>
      )}

      {/* Modals */}
      {showVerdict && (
        <VerdictModal 
          complaint={complaint} 
          isOverride={isEscalated}
          onClose={() => setShowVerdict(false)}
          onSubmit={payload => handleAction(isEscalated ? "/override-verdict" : "/verdict", payload)} 
        />
      )}
      {showClarify && (
        <TextActionModal title="Request Clarification" sub={complaint.subject} icon="help-circle" 
          iconBg={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.15)', color: '#f97316' }}
          label="What do you need from the tenant?" placeholder="Describe what additional information is needed..." 
          btnLabel="Request Clarification" btnColorKey="clarify"
          onClose={() => setShowClarify(false)} 
          onSubmit={v => handleAction("/clarify", { clarification_notes: v })} />
      )}
      {showReject && (
        <TextActionModal title="Reject Complaint" sub={complaint.subject} icon="x-circle" 
          iconBg={{ background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.15)', color: C.redLight }}
          label="Reason for Rejection" placeholder="Explain why this complaint is being rejected..." 
          btnLabel="Reject Complaint" btnColorKey="reject"
          onClose={() => setShowReject(false)} 
          onSubmit={v => handleAction("/reject", { reason: v })} />
      )}
      {showResolve && (
        <TextActionModal title="Resolve Complaint" sub={complaint.subject} icon="check-circle" 
          iconBg={{ background: 'rgba(26,122,74,0.08)', border: '1px solid rgba(76,186,122,0.15)', color: C.greenLight }}
          label="Resolution Notes" placeholder="Describe how this complaint was resolved..." 
          btnLabel="Mark as Resolved" btnColorKey="resolve"
          onClose={() => setShowResolve(false)} 
          onSubmit={v => handleAction("/resolve", { resolution_notes: v })} />
      )}
      {showEscalationReject && (
        <TextActionModal title="Return to Caretaker" sub={complaint.subject} icon="corner-down-left" 
          iconBg={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', color: C.purple }}
          label="Reason for returning" placeholder="Explain why this is being sent back to the caretaker..." 
          btnLabel="Return to Caretaker" btnColorKey="escalation"
          onClose={() => setShowEscalationReject(false)} 
          onSubmit={v => handleAction("/reject-escalation", { notes: v })} />
      )}

      {/* Image viewer */}
      {viewerOpen && evidence.length > 0 && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.96)', padding: '1rem' }} onClick={() => setViewerOpen(false)}>
          <button onClick={() => setViewerOpen(false)} style={{ position: 'absolute', top: '1.2rem', right: '1.2rem', padding: '0.5rem', borderRadius: '3px', background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}>
            <Icon name="x" size={22} />
          </button>
          {viewerIndex > 0 && (
            <button onClick={e => { e.stopPropagation(); setViewerIndex(v => v - 1); }} style={{ position: 'absolute', left: '1rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Icon name="chevronLeft" size={22} />
            </button>
          )}
          {viewerIndex < evidence.length - 1 && (
            <button onClick={e => { e.stopPropagation(); setViewerIndex(v => v + 1); }} style={{ position: 'absolute', right: '1rem', color: 'rgba(255,255,255,0.5)', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Icon name="chevron-right" size={22} />
            </button>
          )}
          <img src={getFullUrl(evidence[viewerIndex]?.document_url)} alt={evidence[viewerIndex]?.label || "Evidence"} style={{ maxHeight: '85vh', maxWidth: '90%', borderRadius: '6px', objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
          <div style={{ position: 'absolute', bottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontFamily: F.mono }}>{viewerIndex + 1} / {evidence.length}</span>
            {evidence[viewerIndex]?.label && (
              <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.7rem', fontFamily: F.dm }}>{evidence[viewerIndex].label}</span>
            )}
          </div>
        </div>
      )}

      <div style={S.container}>
        <button onClick={() => navigate("/landlord/complaints")} style={S.backBtn}
          onMouseEnter={e => e.currentTarget.style.color = C.white}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
          <Icon name="chevronLeft" size={14} /> Back to Complaints
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem' }}>
          <style>{`@media (min-width: 1024px) { .complaint-grid { grid-template-columns: 1fr 340px !important; } }`}</style>
          
          <div className="complaint-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem', alignItems: 'start' }}>

            {/* LEFT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

              {/* Main card */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <StatusBadge status={complaint.status} />
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    fontSize: '0.58rem', fontWeight: 600, padding: '0.2rem 0.55rem',
                    borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
                    textTransform: 'uppercase', color: 'rgba(245,240,232,0.4)',
                    background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)',
                  }}>
                    {scopeLabel}
                  </span>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                    fontSize: '0.58rem', fontWeight: 600, padding: '0.2rem 0.55rem',
                    borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
                    textTransform: 'uppercase', color: catCfg.color,
                    background: `${catCfg.color}10`, border: `1px solid ${catCfg.color}25`,
                  }}>
                    <Icon name={catCfg.icon} size={9} /> {catCfg.label}
                  </span>
                </div>
                
                <h2 style={{ fontSize: '1.05rem', fontWeight: 600, color: C.white, fontFamily: F.dm, marginBottom: '0.5rem' }}>
                  {complaint.subject}
                </h2>
                
                <p style={{ fontSize: '0.82rem', color: 'rgba(245,240,232,0.45)', lineHeight: 1.7 }}>
                  {complaint.description}
                </p>
                
                {isCommonArea && complaint.common_area_location && (
                  <div style={{ marginTop: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.62rem', fontWeight: 600, padding: '0.25rem 0.7rem', borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em', color: C.gold, background: 'rgba(232,160,18,0.06)', border: '1px solid rgba(232,160,18,0.15)' }}>
                    <Icon name="map-pin" size={10} /> {complaint.common_area_location}
                  </div>
                )}
                
                {/* Clarification notes */}
                {complaint.clarification_requested && complaint.clarification_notes && (
                  <div style={{ marginTop: '0.8rem', padding: '0.7rem 0.9rem', borderRadius: '3px', background: 'rgba(249,115,22,0.06)', border: '1px solid rgba(249,115,22,0.12)' }}>
                    <p style={{ fontSize: '0.58rem', fontWeight: 600, color: '#f97316', fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Clarification Requested</p>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(249,115,22,0.7)', lineHeight: 1.4 }}>{complaint.clarification_notes}</p>
                  </div>
                )}
              </div>

              {/* Parties */}
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Parties Involved</h3>
                <div style={{ display: 'grid', gridTemplateColumns: hasAgainstParty ? '1fr 1fr 1fr' : '1fr 1fr', gap: '0.8rem' }}>
                  <div style={{ padding: '0.8rem', borderRadius: '3px', background: 'rgba(58,143,212,0.06)', border: '1px solid rgba(58,143,212,0.12)' }}>
                    <p style={{ fontSize: '0.55rem', fontWeight: 600, color: C.blue, fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Filed by</p>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: C.white, fontFamily: F.dm }}>{complaint.filed_by_name || "—"}</p>
                    {complaint.filed_by_email && <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginTop: '3px' }}>{complaint.filed_by_email}</p>}
                    {complaint.filed_by_phone && <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono }}>{complaint.filed_by_phone}</p>}
                  </div>
                  {hasAgainstParty && (
                    <div style={{ padding: '0.8rem', borderRadius: '3px', background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.12)' }}>
                      <p style={{ fontSize: '0.55rem', fontWeight: 600, color: C.redLight, fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Against</p>
                      <p style={{ fontSize: '0.8rem', fontWeight: 600, color: C.white, fontFamily: F.dm }}>{complaint.against_name}</p>
                      {complaint.against_unit_number && <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginTop: '3px' }}>Unit {complaint.against_unit_number}</p>}
                    </div>
                  )}
                  <div style={{ padding: '0.8rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}` }}>
                    <p style={{ fontSize: '0.55rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Property</p>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: C.white, fontFamily: F.dm }}>{complaint.property_name || "—"}</p>
                    {complaint.property_address && <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, marginTop: '3px' }}>{complaint.property_address}</p>}
                  </div>
                </div>
              </div>

              {/* Evidence */}
              {evidence.length > 0 ? (
                <div style={cardStyle}>
                  <h3 style={S.sectionTitle}>Evidence ({evidence.length} {evidence.length === 1 ? 'file' : 'files'})</h3>
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
                            transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(58,143,212,0.1)'; e.currentTarget.style.borderColor = C.blue; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = C.border; }}>
                            <Icon name="eye" size={12} /> Preview
                          </button>
                        ) : (
                          <a href={getFullUrl(item.document_url)} target="_blank" rel="noreferrer" style={{
                            marginLeft: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0.35rem 0.6rem', borderRadius: '3px', fontSize: '0.65rem', fontWeight: 500,
                            fontFamily: F.mono, letterSpacing: '0.04em', border: `1px solid ${C.border}`,
                            background: 'transparent', color: 'rgba(245,240,232,0.4)', cursor: 'pointer',
                            textDecoration: 'none', whiteSpace: 'nowrap', transition: 'all 0.15s'
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(245,240,232,0.05)'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                            <Icon name="external-link" size={12} /> Open
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ ...cardStyle, textAlign: 'center', padding: '2rem' }}>
                  <Icon name="image" size={28} color="rgba(245,240,232,0.08)" />
                  <p style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginTop: '0.5rem' }}>No evidence attached</p>
                </div>
              )}

              {/* Verdict */}
              {verdict && (
                <div style={{ ...cardStyle, background: VERDICT_COLORS[verdict.verdict_type]?.bg || 'rgba(26,122,74,0.04)', border: VERDICT_COLORS[verdict.verdict_type]?.border || '1px solid rgba(76,186,122,0.2)' }}>
                  <h3 style={{ ...S.sectionTitle, color: VERDICT_COLORS[verdict.verdict_type]?.color || C.greenLight, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Icon name={VERDICT_COLORS[verdict.verdict_type]?.icon || 'check'} size={14} />
                    Verdict: {VERDICT_LABELS[verdict.verdict_type] || verdict.verdict_type}
                  </h3>
                  {verdict.fine_amount > 0 && (
                    <p style={{ fontSize: '1.1rem', fontWeight: 700, color: C.redLight, fontFamily: F.bebas, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                      {fmt(verdict.fine_amount)}
                    </p>
                  )}
                  {verdict.notes && (
                    <p style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.5)', lineHeight: 1.6 }}>{verdict.notes}</p>
                  )}
                  {verdict.issued_at && (
                    <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, marginTop: '0.5rem' }}>
                      Issued {fmtDateTime(verdict.issued_at)}
                    </p>
                  )}
                </div>
              )}

              {/* Resolution / Rejection */}
              {complaint.resolution_notes && !verdict && (
                <div style={{ ...cardStyle, background: complaint.status === "rejected" ? 'rgba(224,90,74,0.04)' : 'rgba(26,122,74,0.04)', border: `1px solid ${complaint.status === "rejected" ? 'rgba(224,90,74,0.15)' : 'rgba(76,186,122,0.15)'}` }}>
                  <h3 style={{ ...S.sectionTitle, color: complaint.status === "rejected" ? C.redLight : C.greenLight }}>
                    {complaint.status === "rejected" ? "Rejection Reason" : "Resolution"}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: complaint.status === "rejected" ? C.redLight : C.greenLight, lineHeight: 1.5 }}>
                    {complaint.resolution_notes}
                  </p>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              
              {/* Details */}
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Details</h3>
                <div>
                  {[
                    ["Category", catCfg.label],
                    ["Scope", scopeLabel],
                    ["Severity", `${complaint.severity || 3}/5`],
                    ["Submitted", fmtDate(complaint.created_at)],
                    ["Updated", fmtDate(complaint.updated_at)],
                    ...(complaint.resolved_at ? [["Resolved", fmtDateTime(complaint.resolved_at)]] : []),
                  ].map(([label, val]) => (
                    <div key={label} style={S.detailRow}>
                      <span style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{label}</span>
                      <span style={{ fontSize: '0.7rem', fontWeight: 500, color: C.white, fontFamily: F.dm }}>{val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              {!isClosed && (
                <div style={cardStyle}>
                  <h3 style={S.sectionTitle}>{isEscalated ? "Your Decision" : "Landlord Actions"}</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    
                    {/* Escalation-specific actions */}
                    {isEscalated && (
                      <>
                        <button onClick={() => handleAction("/approve", {})} style={actionBtnStyle('approve')}
                          onMouseEnter={e => e.currentTarget.style.background = ACTION_COLORS.approve.hoverBg}
                          onMouseLeave={e => e.currentTarget.style.background = ACTION_COLORS.approve.bg}>
                          <Icon name="thumbs-up" size={14} /> Approve Escalation
                        </button>
                        <button onClick={() => setShowEscalationReject(true)} style={actionBtnStyle('escalation')}
                          onMouseEnter={e => e.currentTarget.style.background = ACTION_COLORS.escalation.hoverBg}
                          onMouseLeave={e => e.currentTarget.style.background = ACTION_COLORS.escalation.bg}>
                          <Icon name="corner-down-left" size={14} /> Return to Caretaker
                        </button>
                      </>
                    )}
                    
                    {/* Standard actions */}
                    {canIssueVerdict && (
                      <button onClick={() => setShowVerdict(true)} style={actionBtnStyle('verdict')}
                        onMouseEnter={e => e.currentTarget.style.background = ACTION_COLORS.verdict.hoverBg}
                        onMouseLeave={e => e.currentTarget.style.background = ACTION_COLORS.verdict.bg}>
                        <Icon name="gavel" size={14} /> {isEscalated ? "Override Verdict" : "Issue Verdict"}
                      </button>
                    )}
                    <button onClick={() => setShowClarify(true)} style={actionBtnStyle('clarify')}
                      onMouseEnter={e => e.currentTarget.style.background = ACTION_COLORS.clarify.hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = ACTION_COLORS.clarify.bg}>
                      <Icon name="help-circle" size={14} /> Request Clarification
                    </button>
                    <button onClick={() => setShowReject(true)} style={actionBtnStyle('reject')}
                      onMouseEnter={e => e.currentTarget.style.background = ACTION_COLORS.reject.hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = ACTION_COLORS.reject.bg}>
                      <Icon name="x-circle" size={14} /> Reject Complaint
                    </button>
                    <button onClick={() => setShowResolve(true)} style={actionBtnStyle('resolve')}
                      onMouseEnter={e => e.currentTarget.style.background = ACTION_COLORS.resolve.hoverBg}
                      onMouseLeave={e => e.currentTarget.style.background = ACTION_COLORS.resolve.bg}>
                      <Icon name="check-circle" size={14} /> Mark as Resolved
                    </button>
                  </div>
                </div>
              )}

              {/* Status info */}
              {!isEscalated && !isClosed && (
                <div style={{ ...cardStyle, textAlign: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem' }}>
                    <Icon name="clock" size={16} color="rgba(245,240,232,0.3)" />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, lineHeight: 1.5 }}>
                    Being handled by the caretaker.<br />You'll be notified if escalated.
                  </p>
                </div>
              )}

              {/* Closed status */}
              {isClosed && (
                <div style={{ ...cardStyle, textAlign: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.6rem' }}>
                    <Icon name="check" size={16} color="rgba(245,240,232,0.3)" />
                  </div>
                  <p style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>
                    This complaint has been <strong style={{ color: 'rgba(245,240,232,0.5)' }}>{complaint.status.replace(/_/g, " ")}</strong>.
                  </p>
                  {complaint.resolved_at && (
                    <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, marginTop: '0.3rem' }}>
                      {fmtDateTime(complaint.resolved_at)}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}