/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { F, STATUS_CONFIG, FONT, TEXT, C } from "./complaintStyles";

const API = "http://localhost:4000";

function fmt(n) {
  return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—";
}
function fmtDate(d) {
  return d
    ? new Date(d).toLocaleDateString("en-ZA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";
}
function fmtDateTime(d) {
  return d
    ? new Date(d).toLocaleDateString("en-ZA", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["open"];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        fontSize: "0.6rem",
        fontWeight: 600,
        padding: "0.2rem 0.55rem",
        borderRadius: "3px",
        fontFamily: F.mono,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: cfg.color,
        background: cfg.bg,
        border: cfg.border,
      }}
    >
      <Icon name={cfg.icon} size={10} />
      {cfg.label}
    </span>
  );
}

const cardStyle = {
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: "6px",
  padding: "1.3rem",
};
const inputStyle = {
  width: "100%",
  fontSize: "0.8rem",
  padding: "0.55rem 0.8rem",
  borderRadius: "3px",
  background: C.background,
  border: `1px solid ${C.border}`,
  color: TEXT,
  fontFamily: F.dm,
  outline: "none",
  resize: "none",
};

function ModalShell({ title, sub, icon, iconBg, onClose, children, footer }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1rem",
        background: "rgba(0,0,0,0.4)",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 440,
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: "6px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "1rem 1.5rem",
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "6px",
                ...iconBg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name={icon} size={16} />
            </div>
            <div>
              <h3
                style={{
                  fontSize: "0.9rem",
                  fontWeight: 600,
                  color: TEXT,
                  fontFamily: F.bebas,
                  letterSpacing: "0.04em",
                }}
              >
                {title}
              </h3>
              {sub && (
                <p
                  style={{
                    fontSize: "0.62rem",
                    color: SECONDARY_TEXT,
                    fontFamily: F.mono,
                  }}
                >
                  {sub}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: "0.2rem",
              borderRadius: "3px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: SECONDARY_TEXT,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = TEXT)}
            onMouseLeave={(e) => (e.currentTarget.style.color = SECONDARY_TEXT)}
          >
            <Icon name="x" size={17} />
          </button>
        </div>
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "1.2rem 1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.8rem",
          }}
        >
          {children}
        </div>
        {footer && (
          <div
            style={{
              display: "flex",
              gap: "0.7rem",
              padding: "1rem 1.5rem 1.5rem",
              borderTop: `1px solid ${C.border}`,
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function TextActionModal({
  title,
  sub,
  icon,
  iconBg,
  label,
  placeholder,
  btnLabel,
  btnBg,
  onClose,
  onSubmit,
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  function handleSubmit() {
    if (!value.trim()) {
      setError("This field is required");
      return;
    }
    onSubmit(value.trim());
    onClose();
  }
  return (
    <ModalShell
      title={title}
      sub={sub}
      icon={icon}
      iconBg={iconBg}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "0.55rem",
              borderRadius: "3px",
              background: "transparent",
              border: `1px solid ${C.border}`,
              color: SECONDARY_TEXT,
              cursor: "pointer",
              fontFamily: F.dm,
              fontSize: "0.74rem",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              flex: 1,
              padding: "0.55rem",
              borderRadius: "3px",
              background: `${btnBg}20`,
              color: btnBg,
              border: `1px solid ${btnBg}30`,
              cursor: "pointer",
              fontFamily: F.dm,
              fontWeight: 600,
              fontSize: "0.74rem",
            }}
          >
            {btnLabel}
          </button>
        </>
      }
    >
      {error && (
        <div
          style={{
            padding: "0.5rem 0.7rem",
            borderRadius: "3px",
            background: "rgba(158,58,58,0.06)",
            border: "1px solid rgba(158,58,58,0.12)",
            fontSize: "0.7rem",
            color: C.red,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Icon name="alert-circle" size={12} /> {error}
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <label
          style={{
            fontSize: "0.62rem",
            fontWeight: 600,
            color: SECONDARY_TEXT,
            fontFamily: F.mono,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {label} *
        </label>
        <textarea
          rows={4}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError("");
          }}
          placeholder={placeholder}
          style={{ ...inputStyle, minHeight: 80 }}
        />
      </div>
    </ModalShell>
  );
}

function VerdictModal({ complaint, isOverride = false, onClose, onSubmit }) {
  const [type, setType] = useState(isOverride ? "final_warning" : "warning");
  const [fine, setFine] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  function handleSubmit() {
    if (type === "fine" && (!fine || Number(fine) <= 0)) {
      setError("Enter a valid fine amount");
      return;
    }
    onSubmit({
      verdict_type: type,
      fine_amount: type === "fine" ? Number(fine) : null,
      notes: notes.trim() || null,
    });
    onClose();
  }

  const verdictOptions = isOverride
    ? [
        { id: "final_warning", label: "Final Warning", icon: "alert-octagon" },
        { id: "eviction_notice", label: "Eviction Notice", icon: "home" },
        { id: "fine", label: "Fine", icon: "rand" },
        { id: "dismissed", label: "Dismiss", icon: "x" },
      ]
    : [
        { id: "warning", label: "Warning", icon: "alert-triangle" },
        { id: "fine", label: "Fine", icon: "rand" },
        { id: "dismissed", label: "Dismiss", icon: "x" },
      ];

  return (
    <ModalShell
      title={isOverride ? "Override Verdict" : "Issue Verdict"}
      sub={complaint.subject}
      icon="gavel"
      iconBg={{
        background: isOverride
          ? "rgba(111,66,193,0.08)"
          : "rgba(44,62,80,0.08)",
        border: `1px solid ${isOverride ? C.purple : C.primary}30`,
        color: isOverride ? C.purple : C.primary,
      }}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "0.55rem",
              borderRadius: "3px",
              background: "transparent",
              border: `1px solid ${C.border}`,
              color: SECONDARY_TEXT,
              cursor: "pointer",
              fontFamily: F.dm,
              fontSize: "0.74rem",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            style={{
              flex: 1,
              padding: "0.55rem",
              borderRadius: "3px",
              background: isOverride
                ? "rgba(111,66,193,0.12)"
                : "rgba(44,62,80,0.12)",
              color: isOverride ? C.purple : C.primary,
              border: `1px solid ${isOverride ? C.purple : C.primary}30`,
              cursor: "pointer",
              fontFamily: F.dm,
              fontWeight: 600,
              fontSize: "0.74rem",
            }}
          >
            {isOverride ? "Override Verdict" : "Issue Verdict"}
          </button>
        </>
      }
    >
      {error && (
        <div
          style={{
            padding: "0.5rem 0.7rem",
            borderRadius: "3px",
            background: "rgba(158,58,58,0.06)",
            border: "1px solid rgba(158,58,58,0.12)",
            fontSize: "0.7rem",
            color: C.red,
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <Icon name="alert-circle" size={12} /> {error}
        </div>
      )}

      {complaint.against_name && (
        <div
          style={{
            padding: "0.6rem 0.8rem",
            borderRadius: "3px",
            background: "rgba(158,58,58,0.04)",
            border: "1px solid rgba(158,58,58,0.1)",
            fontSize: "0.72rem",
            color: C.red,
            fontFamily: F.dm,
          }}
        >
          This verdict will be issued against{" "}
          <strong>{complaint.against_name}</strong>
          {complaint.against_unit_number && (
            <> (Unit {complaint.against_unit_number})</>
          )}
        </div>
      )}

      <p
        style={{
          fontSize: "0.6rem",
          fontWeight: 600,
          color: SECONDARY_TEXT,
          fontFamily: F.mono,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        Verdict Type
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
        {verdictOptions.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setType(t.id);
              setError("");
            }}
            style={{
              flex: 1,
              minWidth: "80px",
              padding: "0.6rem",
              borderRadius: "3px",
              border: `1px solid ${type === t.id ? (isOverride ? C.purple : C.primary) : C.border}`,
              background:
                type === t.id
                  ? isOverride
                    ? "rgba(111,66,193,0.06)"
                    : "rgba(44,62,80,0.06)"
                  : "transparent",
              color:
                type === t.id
                  ? isOverride
                    ? C.purple
                    : C.primary
                  : SECONDARY_TEXT,
              cursor: "pointer",
              fontFamily: F.dm,
              fontSize: "0.72rem",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.35rem",
              transition: "all 0.15s",
            }}
          >
            <Icon name={t.icon} size={12} /> {t.label}
          </button>
        ))}
      </div>

      {type === "fine" && (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}
        >
          <label
            style={{
              fontSize: "0.62rem",
              fontWeight: 600,
              color: SECONDARY_TEXT,
              fontFamily: F.mono,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            Fine Amount (R) *
          </label>
          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "0.8rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: SECONDARY_TEXT,
                fontSize: "0.8rem",
                fontFamily: F.mono,
              }}
            >
              R
            </span>
            <input
              type="number"
              value={fine}
              onChange={(e) => {
                setFine(e.target.value);
                setError("");
              }}
              placeholder="500"
              style={{ ...inputStyle, paddingLeft: "2rem" }}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        <label
          style={{
            fontSize: "0.62rem",
            fontWeight: 600,
            color: SECONDARY_TEXT,
            fontFamily: F.mono,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Notes (optional)
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional details about this verdict..."
          style={{ ...inputStyle, minHeight: 60 }}
        />
      </div>
    </ModalShell>
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
  const [showVerdict, setShowVerdict] = useState(false);
  const [showClarify, setShowClarify] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showResolve, setShowResolve] = useState(false);
  const [showEscalationReject, setShowEscalationReject] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const fetchComplaint = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/landlord/complaints/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setComplaint(data.complaint);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load complaint details");
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
      const method = endpoint === "/override-verdict" ? "post" : "put";
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
      toast.success("Action completed successfully");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to complete action");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          flexDirection: "column",
          gap: "1rem",
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            border: "3px solid rgba(0,0,0,0.1)",
            borderTopColor: C.primary,
            borderRadius: "50%",
            animation: "spin 0.6s linear infinite",
          }}
        />
        <span
          style={{
            fontSize: "0.75rem",
            color: SECONDARY_TEXT,
            fontFamily: F.mono,
          }}
        >
          Loading complaint...
        </span>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "4rem",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "rgba(158,58,58,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="alert-circle" size={22} color={C.red} />
        </div>
        <p
          style={{
            color: SECONDARY_TEXT,
            fontFamily: F.dm,
            fontSize: "0.85rem",
          }}
        >
          {error || "Complaint not found"}
        </p>
        <button
          onClick={() => navigate("/landlord/complaints")}
          style={{
            color: C.primary,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontFamily: F.mono,
            fontSize: "0.75rem",
          }}
        >
          ← Back to Complaints
        </button>
      </div>
    );
  }

  const catCfg = CATEGORY_CONFIG[complaint.category] ?? CATEGORY_CONFIG.other;
  const scopeIcon = SCOPE_ICONS[complaint.complaint_scope] || "help-circle";
  const isSpecificTenant = complaint.complaint_scope === "specific_tenant";
  const isCommonArea = complaint.complaint_scope === "common_area";
  const scopeLabel = SCOPE_LABELS[complaint.complaint_scope] || "Unknown";
  const hasAgainstParty = isSpecificTenant && complaint.against_name;
  const verdict = complaint.verdict || null;
  const isClosed = ["resolved", "rejected", "dismissed"].includes(
    complaint.status,
  );
  const isEscalated = complaint.status === "escalated";
  const isAwaitingClarification = complaint.status === "awaiting_clarification";

  const canAct = isEscalated;
  const canIssueVerdict = isEscalated && hasAgainstParty;

  const S = {
    container: {
      maxWidth: 1200,
      padding: "1.5rem 1rem 3rem",
      margin: "-1rem -1.8rem",
    },
    backBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: "0.4rem",
      fontSize: "0.72rem",
      color: SECONDARY_TEXT,
      fontFamily: F.mono,
      background: "none",
      border: "none",
      cursor: "pointer",
      marginBottom: "1.2rem",
      transition: "color 0.15s",
    },
    sectionTitle: {
      fontSize: "0.62rem",
      fontWeight: 600,
      color: TEXT,
      fontFamily: F.mono,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      marginBottom: "0.7rem",
    },
  };

  return (
    <div style={S.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {saving && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              background: C.card,
              padding: "1rem 1.5rem",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              border: `1px solid ${C.border}`,
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                border: "2px solid rgba(0,0,0,0.1)",
                borderTopColor: C.primary,
                borderRadius: "50%",
                animation: "spin 0.6s linear infinite",
              }}
            />
            <span style={{ color: TEXT, fontFamily: F.dm, fontSize: "0.8rem" }}>
              Processing...
            </span>
          </div>
        </div>
      )}

      {showVerdict && (
        <VerdictModal
          complaint={complaint}
          isOverride={isEscalated}
          onClose={() => setShowVerdict(false)}
          onSubmit={(d) => handleAction("/override-verdict", d)}
        />
      )}
      {showClarify && (
        <TextActionModal
          title="Request Clarification"
          sub={complaint.subject}
          icon="help-circle"
          iconBg={{
            background: "rgba(44,62,80,0.08)",
            border: "1px solid rgba(44,62,80,0.15)",
            color: C.primary,
          }}
          label="What do you need from the tenant?"
          placeholder="Describe what additional information is needed to process this complaint..."
          btnLabel="Request Clarification"
          btnBg={C.primary}
          onClose={() => setShowClarify(false)}
          onSubmit={(v) => handleAction("/clarify", { clarification_notes: v })}
        />
      )}
      {showReject && (
        <TextActionModal
          title="Reject Complaint"
          sub={complaint.subject}
          icon="x-circle"
          iconBg={{
            background: "rgba(158,58,58,0.08)",
            border: "1px solid rgba(158,58,58,0.15)",
            color: C.red,
          }}
          label="Reason for Rejection"
          placeholder="Explain why this complaint is being rejected..."
          btnLabel="Reject Complaint"
          btnBg={C.red}
          onClose={() => setShowReject(false)}
          onSubmit={(v) => handleAction("/reject", { reason: v })}
        />
      )}
      {showResolve && (
        <TextActionModal
          title="Resolve Complaint"
          sub={complaint.subject}
          icon="check-circle"
          iconBg={{
            background: "rgba(43,122,75,0.08)",
            border: "1px solid rgba(43,122,75,0.15)",
            color: C.green,
          }}
          label="Resolution Notes"
          placeholder="Describe how this complaint was resolved..."
          btnLabel="Mark as Resolved"
          btnBg={C.green}
          onClose={() => setShowResolve(false)}
          onSubmit={(v) => handleAction("/resolve", { resolution_notes: v })}
        />
      )}
      {showEscalationReject && (
        <TextActionModal
          title="Return to Caretaker"
          sub={complaint.subject}
          icon="corner-down-left"
          iconBg={{
            background: "rgba(111,66,193,0.08)",
            border: "1px solid rgba(111,66,193,0.15)",
            color: C.purple,
          }}
          label="Reason for returning"
          placeholder="Explain why this is being sent back to the caretaker..."
          btnLabel="Return to Caretaker"
          btnBg={C.purple}
          onClose={() => setShowEscalationReject(false)}
          onSubmit={(v) => handleAction("/reject-escalation", { notes: v })}
        />
      )}

      <button
        onClick={() => navigate("/landlord/complaints")}
        style={S.backBtn}
        onMouseEnter={(e) => (e.currentTarget.style.color = TEXT)}
        onMouseLeave={(e) => (e.currentTarget.style.color = SECONDARY_TEXT)}
      >
        <Icon name="chevronLeft" size={13} /> Back to Complaints
      </button>

      {isEscalated && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.8rem 1rem",
            borderRadius: "4px",
            marginBottom: "1rem",
            background: "rgba(111,66,193,0.06)",
            border: "1px solid rgba(111,66,193,0.15)",
          }}
        >
          <Icon name="trending-up" size={16} color={C.purple} />
          <div>
            <p
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: C.purple,
                fontFamily: F.dm,
              }}
            >
              Escalated to Landlord
            </p>
            <p
              style={{
                fontSize: "0.62rem",
                color: C.purple,
                fontFamily: F.mono,
              }}
            >
              The landlord will review and make a final decision.
            </p>
          </div>
        </div>
      )}

      {isAwaitingClarification && complaint.clarification_requested && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            padding: "0.8rem 1rem",
            borderRadius: "4px",
            marginBottom: "1rem",
            background: "rgba(44,62,80,0.06)",
            border: "1px solid rgba(44,62,80,0.15)",
          }}
        >
          <Icon name="clock" size={16} color={C.primary} />
          <div>
            <p
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: C.primary,
                fontFamily: F.dm,
              }}
            >
              Awaiting Tenant Response
            </p>
            <p
              style={{
                fontSize: "0.62rem",
                color: C.primary,
                fontFamily: F.mono,
              }}
            >
              Clarification has been requested from the tenant.
            </p>
          </div>
        </div>
      )}

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.2rem" }}
      >
        <style>{`@media (min-width: 1024px) { .comp-grid { grid-template-columns: 1fr 320px !important; } }`}</style>
        <div
          className="comp-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: "1.2rem",
            alignItems: "start",
          }}
        >
          {/* LEFT COLUMN */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {/* Main card */}
            <div style={cardStyle}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.8rem",
                  flexWrap: "wrap",
                }}
              >
                <StatusBadge status={complaint.status} />
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontSize: "0.58rem",
                    fontWeight: 600,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "3px",
                    fontFamily: F.mono,
                    color: SECONDARY_TEXT,
                    background: C.background,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <Icon name={scopeIcon} size={9} /> {scopeLabel}
                </span>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    fontSize: "0.58rem",
                    fontWeight: 600,
                    padding: "0.15rem 0.5rem",
                    borderRadius: "3px",
                    fontFamily: F.mono,
                    color: catCfg.color,
                    background: `${catCfg.color}10`,
                    border: `1px solid ${catCfg.color}25`,
                  }}
                >
                  <Icon name={catCfg.icon} size={9} /> {catCfg.label}
                </span>
              </div>

              <h2
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: TEXT,
                  fontFamily: F.dm,
                  marginBottom: "0.3rem",
                }}
              >
                {complaint.subject}
              </h2>

              <p
                style={{
                  fontSize: "0.78rem",
                  color: SECONDARY_TEXT,
                  lineHeight: 1.6,
                }}
              >
                {complaint.description}
              </p>

              {isCommonArea && complaint.common_area_location && (
                <div
                  style={{
                    marginTop: "0.8rem",
                    padding: "0.6rem 0.8rem",
                    borderRadius: "3px",
                    background: "rgba(217,158,11,0.06)",
                    border: "1px solid rgba(217,158,11,0.15)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <Icon name="map-pin" size={12} color={C.gold} />
                  <span
                    style={{
                      fontSize: "0.7rem",
                      color: C.gold,
                      fontFamily: F.dm,
                    }}
                  >
                    {complaint.common_area_location}
                  </span>
                </div>
              )}

              {complaint.clarification_requested &&
                complaint.clarification_notes && (
                  <div
                    style={{
                      marginTop: "0.8rem",
                      padding: "0.6rem 0.8rem",
                      borderRadius: "3px",
                      background: "rgba(44,62,80,0.06)",
                      border: "1px solid rgba(44,62,80,0.12)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.58rem",
                        fontWeight: 600,
                        color: C.primary,
                        fontFamily: F.mono,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                        marginBottom: "0.2rem",
                      }}
                    >
                      Clarification Requested
                    </p>
                    <p
                      style={{
                        fontSize: "0.7rem",
                        color: C.primary,
                        lineHeight: 1.4,
                      }}
                    >
                      {complaint.clarification_notes}
                    </p>
                  </div>
                )}
            </div>

            {/* Parties */}
            <div style={cardStyle}>
              <h3 style={S.sectionTitle}>Parties Involved</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: hasAgainstParty
                    ? "1fr 1fr 1fr"
                    : "1fr 1fr",
                  gap: "0.6rem",
                }}
              >
                <div
                  style={{
                    padding: "0.7rem",
                    borderRadius: "3px",
                    background: "rgba(52,152,219,0.06)",
                    border: "1px solid rgba(52,152,219,0.12)",
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.55rem",
                      fontWeight: 600,
                      color: C.blue,
                      fontFamily: F.mono,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: "3px",
                    }}
                  >
                    Filed By
                  </p>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: TEXT,
                      fontFamily: F.dm,
                    }}
                  >
                    {complaint.filed_by_name || "—"}
                  </p>
                  {complaint.filed_by_email && (
                    <p
                      style={{
                        fontSize: "0.62rem",
                        color: SECONDARY_TEXT,
                        fontFamily: F.mono,
                        marginTop: 2,
                      }}
                    >
                      {complaint.filed_by_email}
                    </p>
                  )}
                </div>
                {hasAgainstParty && (
                  <div
                    style={{
                      padding: "0.7rem",
                      borderRadius: "3px",
                      background: "rgba(158,58,58,0.06)",
                      border: "1px solid rgba(158,58,58,0.12)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "0.55rem",
                        fontWeight: 600,
                        color: C.red,
                        fontFamily: F.mono,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        marginBottom: "3px",
                      }}
                    >
                      Against
                    </p>
                    <p
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: TEXT,
                        fontFamily: F.dm,
                      }}
                    >
                      {complaint.against_name}
                    </p>
                    {complaint.against_unit_number && (
                      <p
                        style={{
                          fontSize: "0.62rem",
                          color: SECONDARY_TEXT,
                          fontFamily: F.mono,
                          marginTop: 2,
                        }}
                      >
                        Unit {complaint.against_unit_number}
                      </p>
                    )}
                  </div>
                )}
                <div
                  style={{
                    padding: "0.7rem",
                    borderRadius: "3px",
                    background: C.background,
                    border: `1px solid ${C.border}`,
                  }}
                >
                  <p
                    style={{
                      fontSize: "0.55rem",
                      fontWeight: 600,
                      color: SECONDARY_TEXT,
                      fontFamily: F.mono,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: "3px",
                    }}
                  >
                    Property
                  </p>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      color: TEXT,
                      fontFamily: F.dm,
                    }}
                  >
                    {complaint.property_name || "—"}
                  </p>
                  {complaint.property_address && (
                    <p
                      style={{
                        fontSize: "0.62rem",
                        color: SECONDARY_TEXT,
                        fontFamily: F.mono,
                        marginTop: 2,
                      }}
                    >
                      {complaint.property_address}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Evidence */}
            {complaint.evidence?.length > 0 ? (
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>
                  Evidence ({complaint.evidence.length}{" "}
                  {complaint.evidence.length === 1 ? "file" : "files"})
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                    gap: "0.5rem",
                  }}
                >
                  {complaint.evidence.map((item, idx) => (
                    <button
                      key={item.id || idx}
                      onClick={() => {
                        setViewerIndex(idx);
                        setViewerOpen(true);
                      }}
                      style={{
                        aspectRatio: "1",
                        borderRadius: "4px",
                        overflow: "hidden",
                        border: `1px solid ${C.border}`,
                        cursor: "pointer",
                        background: C.background,
                        position: "relative",
                        transition: "border-color 0.15s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.borderColor = C.primary)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.borderColor = C.border)
                      }
                    >
                      <img
                        src={
                          item.document_url?.startsWith("http")
                            ? item.document_url
                            : `${API}${item.document_url || ""}`
                        }
                        alt={item.label || `Evidence ${idx + 1}`}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: "0.25rem 0.4rem",
                          background:
                            "linear-gradient(transparent, rgba(0,0,0,0.7))",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.55rem",
                            color: "#fff",
                            fontFamily: F.mono,
                          }}
                        >
                          {idx + 1}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div
                style={{ ...cardStyle, textAlign: "center", padding: "2rem" }}
              >
                <Icon name="image" size={24} color={SECONDARY_TEXT} />
                <p
                  style={{
                    fontSize: "0.7rem",
                    color: SECONDARY_TEXT,
                    fontFamily: F.mono,
                    marginTop: "0.5rem",
                  }}
                >
                  No evidence attached
                </p>
              </div>
            )}

            {/* Verdict */}
            {verdict && (
              <div
                style={{
                  ...cardStyle,
                  background: VERDICT_COLORS[verdict.verdict_type]?.bg,
                  border: VERDICT_COLORS[verdict.verdict_type]?.border,
                }}
              >
                <h3
                  style={{
                    ...S.sectionTitle,
                    color: VERDICT_COLORS[verdict.verdict_type]?.color,
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  <Icon
                    name={VERDICT_COLORS[verdict.verdict_type]?.icon || "check"}
                    size={13}
                  />
                  Verdict:{" "}
                  {VERDICT_LABELS[verdict.verdict_type] || verdict.verdict_type}
                </h3>
                {verdict.fine_amount > 0 && (
                  <p
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      color: C.red,
                      fontFamily: F.bebas,
                      letterSpacing: "0.04em",
                      marginBottom: "0.3rem",
                    }}
                  >
                    {fmt(verdict.fine_amount)}
                  </p>
                )}
                {verdict.notes && (
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: SECONDARY_TEXT,
                      lineHeight: 1.5,
                    }}
                  >
                    {verdict.notes}
                  </p>
                )}
                {verdict.issued_at && (
                  <p
                    style={{
                      fontSize: "0.6rem",
                      color: SECONDARY_TEXT,
                      fontFamily: F.mono,
                      marginTop: "0.5rem",
                    }}
                  >
                    Issued {fmtDateTime(verdict.issued_at)}
                  </p>
                )}
              </div>
            )}

            {/* Resolution / Rejection */}
            {complaint.resolution_notes && !verdict && (
              <div
                style={{
                  ...cardStyle,
                  background:
                    complaint.status === "rejected"
                      ? "rgba(158,58,58,0.04)"
                      : "rgba(43,122,75,0.04)",
                  border: `1px solid ${complaint.status === "rejected" ? "rgba(158,58,58,0.15)" : "rgba(43,122,75,0.15)"}`,
                }}
              >
                <h3
                  style={{
                    ...S.sectionTitle,
                    color: complaint.status === "rejected" ? C.red : C.green,
                  }}
                >
                  {complaint.status === "rejected"
                    ? "Rejection Reason"
                    : "Resolution"}
                </h3>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: complaint.status === "rejected" ? C.red : C.green,
                    lineHeight: 1.5,
                  }}
                >
                  {complaint.resolution_notes}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}
          >
            {/* Details */}
            <div style={cardStyle}>
              <h3 style={S.sectionTitle}>Details</h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.15rem",
                }}
              >
                {[
                  ["Category", catCfg.label],
                  ["Scope", scopeLabel],
                  ["Severity", `${complaint.severity || 3}/5`],
                  ["Submitted", fmtDate(complaint.created_at)],
                  ...(complaint.resolved_at
                    ? [["Resolved", fmtDateTime(complaint.resolved_at)]]
                    : []),
                ].map(([l, v]) => (
                  <div
                    key={l}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.4rem 0",
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    <span
                      style={{
                        color: SECONDARY_TEXT,
                        fontFamily: F.mono,
                        fontSize: "0.68rem",
                      }}
                    >
                      {l}
                    </span>
                    <span
                      style={{
                        color: TEXT,
                        fontWeight: 500,
                        fontSize: "0.7rem",
                        fontFamily: F.dm,
                      }}
                    >
                      {v}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Landlord Actions */}
            {!isClosed && isEscalated && (
              <div style={cardStyle}>
                <h3 style={S.sectionTitle}>Your Decision</h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                  }}
                >
                  <button
                    onClick={() => handleAction("/approve", {})}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                      padding: "0.55rem",
                      borderRadius: "3px",
                      background: "rgba(52,152,219,0.08)",
                      color: C.blue,
                      border: "1px solid rgba(52,152,219,0.15)",
                      cursor: "pointer",
                      fontFamily: F.dm,
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(52,152,219,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(52,152,219,0.08)";
                    }}
                  >
                    <Icon name="thumbs-up" size={12} /> Approve Escalation
                  </button>
                  {canIssueVerdict && (
                    <button
                      onClick={() => setShowVerdict(true)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4rem",
                        padding: "0.55rem",
                        borderRadius: "3px",
                        background: "rgba(111,66,193,0.08)",
                        color: C.purple,
                        border: "1px solid rgba(111,66,193,0.15)",
                        cursor: "pointer",
                        fontFamily: F.dm,
                        fontWeight: 600,
                        fontSize: "0.7rem",
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background =
                          "rgba(111,66,193,0.15)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background =
                          "rgba(111,66,193,0.08)";
                      }}
                    >
                      <Icon name="gavel" size={12} /> Override Verdict
                    </button>
                  )}
                  <button
                    onClick={() => setShowEscalationReject(true)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.4rem",
                      padding: "0.55rem",
                      borderRadius: "3px",
                      background: "rgba(158,58,58,0.08)",
                      color: C.red,
                      border: "1px solid rgba(158,58,58,0.15)",
                      cursor: "pointer",
                      fontFamily: F.dm,
                      fontWeight: 600,
                      fontSize: "0.7rem",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(158,58,58,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(158,58,58,0.08)";
                    }}
                  >
                    <Icon name="corner-down-left" size={12} /> Return to
                    Caretaker
                  </button>
                </div>
              </div>
            )}

            {/* Being handled by caretaker */}
            {!isClosed && !isEscalated && (
              <div style={{ ...cardStyle, textAlign: "center" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 0.6rem",
                  }}
                >
                  <Icon name="clock" size={18} color={SECONDARY_TEXT} />
                </div>
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: SECONDARY_TEXT,
                    fontFamily: F.dm,
                    lineHeight: 1.5,
                  }}
                >
                  Being handled by the caretaker.
                  <br />
                  You'll be notified if escalated.
                </p>
              </div>
            )}

            {/* Closed status */}
            {isClosed && (
              <div style={{ ...cardStyle, textAlign: "center" }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 0.6rem",
                  }}
                >
                  <Icon name="check" size={18} color={SECONDARY_TEXT} />
                </div>
                <p
                  style={{
                    fontSize: "0.72rem",
                    color: SECONDARY_TEXT,
                    fontFamily: F.dm,
                  }}
                >
                  This complaint has been{" "}
                  <strong style={{ color: TEXT }}>
                    {complaint.status.replace(/_/g, " ")}
                  </strong>
                  .
                </p>
                {complaint.resolved_at && (
                  <p
                    style={{
                      fontSize: "0.62rem",
                      color: SECONDARY_TEXT,
                      fontFamily: F.mono,
                      marginTop: "0.3rem",
                    }}
                  >
                    {fmtDateTime(complaint.resolved_at)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Image viewer */}
      {viewerOpen && complaint.evidence?.length > 0 && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setViewerOpen(false)}
        >
          <button
            onClick={() => setViewerOpen(false)}
            style={{
              position: "absolute",
              top: "1.2rem",
              right: "1.2rem",
              color: "#fff",
              background: "none",
              border: "none",
              cursor: "pointer",
              zIndex: 10,
              padding: "0.4rem",
            }}
          >
            <Icon name="x" size={24} />
          </button>
          {viewerIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewerIndex((v) => v - 1);
              }}
              style={{
                position: "absolute",
                left: "1rem",
                color: "#fff",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "50%",
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Icon name="chevronLeft" size={22} />
            </button>
          )}
          {viewerIndex < complaint.evidence.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setViewerIndex((v) => v + 1);
              }}
              style={{
                position: "absolute",
                right: "1rem",
                color: "#fff",
                background: "rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "50%",
                width: 40,
                height: 40,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Icon name="chevron-right" size={22} />
            </button>
          )}
          <img
            src={
              complaint.evidence[viewerIndex]?.document_url?.startsWith("http")
                ? complaint.evidence[viewerIndex].document_url
                : `${API}${complaint.evidence[viewerIndex]?.document_url || ""}`
            }
            alt=""
            style={{
              maxHeight: "85vh",
              maxWidth: "90%",
              objectFit: "contain",
              borderRadius: "4px",
            }}
            onClick={(e) => e.stopPropagation()}
          />
          <div
            style={{
              position: "absolute",
              bottom: "1.5rem",
              display: "flex",
              alignItems: "center",
              gap: "0.8rem",
            }}
          >
            <span
              style={{ color: "#fff", fontSize: "0.8rem", fontFamily: F.mono }}
            >
              {viewerIndex + 1} / {complaint.evidence.length}
            </span>
            {complaint.evidence[viewerIndex]?.label && (
              <span
                style={{ color: "#fff", fontSize: "0.7rem", fontFamily: F.dm }}
              >
                {complaint.evidence[viewerIndex].label}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
