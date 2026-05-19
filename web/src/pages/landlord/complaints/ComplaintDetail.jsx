/* eslint-disable no-unused-vars */
import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  Eye,
  FileText,
  Loader2,
  ShieldAlert,
  X,
  XCircle,
} from "lucide-react";
import useDocumentTitle from "../../../hooks/useDocumentTitle";


const API = "http://localhost:4000";

const STATUS_CONFIG = {
  open:               { label: "Open",               color: "text-red-600",    bg: "bg-red-100 dark:bg-red-900/30",     dot: "bg-red-500"      },
  under_review:       { label: "Under Review",       color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30", dot: "bg-yellow-400"   },
  awaiting_clarification: { label: "Needs Clarification", color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30", dot: "bg-orange-500" },
  approved:           { label: "Approved",           color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/30",    dot: "bg-blue-500"    },
  resolved:           { label: "Resolved",           color: "text-green-600",  bg: "bg-green-100 dark:bg-green-900/30",  dot: "bg-green-500"   },
  rejected:           { label: "Rejected",           color: "text-gray-600",   bg: "bg-gray-100 dark:bg-gray-700/50",    dot: "bg-gray-400"    },
  escalated:          { label: "Escalated",          color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30",dot: "bg-purple-500"  },
  dismissed:          { label: "Dismissed",          color: "text-gray-600",   bg: "bg-gray-100 dark:bg-gray-700/50",    dot: "bg-gray-400"    },
};

const SCOPE_LABELS = {
  specific_tenant: "Specific Unit / Tenant",
  common_area: "Common Area",
  unknown: "Unknown / General",
  property_wide: "Property-Wide Issue",
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.open;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
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

function actorLabel(role) {
  const labels = { landlord: "Landlord", caretaker: "Caretaker", tenant: "Tenant" };
  return labels[role] || "System";
}

function TextActionModal({ title, subtitle, fieldLabel, placeholder, confirmLabel, confirmClassName, onClose, onSubmit }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div><h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3><p className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</p></div>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-4 px-6 py-5">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</div>}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">{fieldLabel}</label>
            <textarea rows={4} value={value} onChange={e => { setValue(e.target.value); setError(""); }} placeholder={placeholder}
              className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
        </div>
        <div className="flex gap-3 border-t border-gray-200 px-6 pb-6 pt-4 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50 ${confirmClassName}`}>{confirmLabel}</button>
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
    if (verdictType === "fine" && (!fineAmount || Number(fineAmount) <= 0)) { setError("Please enter a valid fine amount."); return; }
    onSubmit({ type: verdictType, fineAmount: verdictType === "fine" ? Number(fineAmount) : null, notes: notes.trim() || null });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <div><h3 className="text-base font-semibold text-gray-900 dark:text-white">Issue Verdict</h3><p className="text-xs text-gray-500 dark:text-gray-400">{complaint.subject}</p></div>
          <button onClick={onClose} className="rounded p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"><X size={18} /></button>
        </div>
        <div className="space-y-4 px-6 py-5">
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</div>}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Verdict type</label>
            <select value={verdictType} onChange={e => { setVerdictType(e.target.value); setError(""); }}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option value="warning">Warning</option>
              <option value="fine">Fine</option>
              <option value="final_warning">Final warning</option>
              <option value="eviction_notice">Eviction notice</option>
            </select>
          </div>
          {verdictType === "fine" && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Fine amount (R)</label>
              <input type="number" min="0" value={fineAmount} onChange={e => { setFineAmount(e.target.value); setError(""); }}
                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Notes</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Reason, terms, or follow-up instructions..."
              className="w-full resize-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
        </div>
        <div className="flex gap-3 border-t border-gray-200 px-6 pb-6 pt-4 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 rounded-xl bg-gray-100 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600">Cancel</button>
          <button onClick={handleSubmit} className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700">Save verdict</button>
        </div>
      </div>
    </div>
  );
}

function DetailCard({ title, children }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="mb-4 text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
      {children}
    </div>
  );
}

export default function LandlordComplaintDetail() {
  useDocumentTitle("Complaint Detail");
  const navigate = useNavigate();
  const { id } = useParams();

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
    } catch (err) {
      alert(err.response?.data?.error || "Action failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading complaint...</p>
        </div>
      </div>
    );
  }

  if (error || !complaint) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 pt-10 dark:bg-gray-900">
        <div className="mx-auto max-w-2xl rounded-xl border border-gray-200 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Complaint not found</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error || "This complaint could not be loaded."}</p>
          <button onClick={() => navigate("/landlord/complaints")} className="mt-5 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700">Back to complaints</button>
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

  // Build updates from the timeline (if you add a timeline table later, this comes from DB)
  const updates = [
    { statusTo: complaint.status, title: STATUS_CONFIG[complaint.status]?.label || "Update", notes: complaint.resolution_notes || "Complaint status", actorRole: "system", createdAt: complaint.updated_at || complaint.created_at },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {saving && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div className="flex items-center gap-3 rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <Loader2 size={20} className="animate-spin text-blue-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Updating complaint...</span>
          </div>
        </div>
      )}

      {activeModal === "clarify" && (
        <TextActionModal title="Request Clarification" subtitle={complaint.subject} fieldLabel="Clarification request"
          placeholder="Tell the tenant what details you need..." confirmLabel="Request clarification" confirmClassName="bg-amber-600 hover:bg-amber-700"
          onClose={() => setActiveModal(null)}
          onSubmit={value => handleAction(`/landlord/complaints/${id}/clarify`, { request: value })} />
      )}

      {activeModal === "reject" && (
        <TextActionModal title="Reject Complaint" subtitle={complaint.subject} fieldLabel="Reason for rejection"
          placeholder="Explain why..." confirmLabel="Reject complaint" confirmClassName="bg-gray-700 hover:bg-gray-800"
          onClose={() => setActiveModal(null)}
          onSubmit={value => handleAction(`/landlord/complaints/${id}/reject`, { reason: value })} />
      )}

      {activeModal === "note" && (
        <TextActionModal title="Add Internal Note" subtitle={complaint.subject} fieldLabel="Internal note"
          placeholder="Add a note..." confirmLabel="Add note" confirmClassName="bg-blue-600 hover:bg-blue-700"
          onClose={() => setActiveModal(null)}
          onSubmit={value => alert("Note: " + value)} />
      )}

      {activeModal === "verdict" && (
        <VerdictModal complaint={complaint} onClose={() => setActiveModal(null)}
          onSubmit={value => handleAction(`/landlord/complaints/${id}/verdict`, value)} />
      )}

      {viewerOpen && evidence.length > 0 && isImageEvidence(evidence[viewerIndex]) && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setViewerOpen(false)}>
          <button onClick={() => setViewerOpen(false)} className="absolute right-4 top-4 rounded p-2 text-white/70 hover:text-white"><X size={20} /></button>
          <img src={evidence[viewerIndex].document_url} alt={evidence[viewerIndex].label} className="max-h-[85vh] max-w-full rounded-lg object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}

      <div className="mx-auto max-w-screen-xl px-4 pb-12 pt-6">
        <button onClick={() => navigate("/landlord/complaints")} className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <ArrowLeft size={16} />Back to Complaints
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <StatusBadge status={complaint.status} />
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">{scopeLabel}</span>
              </div>
              <h2 className="mb-2 text-lg font-bold text-gray-900 dark:text-white">{complaint.subject}</h2>
              <p className="text-sm leading-relaxed text-gray-500 dark:text-gray-400">{complaint.description}</p>
              {isCommonArea && complaint.common_area_location && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">
                   {complaint.common_area_location}
                </div>
              )}
            </div>

            <DetailCard title="Parties Involved">
              <div className={`grid grid-cols-1 gap-4 ${hasAgainstParty ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
                  <p className="text-xs font-semibold uppercase text-blue-500">Filed by</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{complaint.filed_by_name}</p>
                </div>
                {hasAgainstParty && (
                  <div className="rounded-lg border border-red-100 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                    <p className="text-xs font-semibold uppercase text-red-500">Against</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{complaint.against_name}</p>
                    {complaint.against_unit_number && <p className="text-xs text-gray-500">Unit {complaint.against_unit_number}</p>}
                  </div>
                )}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-700/40">
                  <p className="text-xs font-semibold uppercase text-gray-500">Property</p>
                  <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{complaint.property_name}</p>
                  {isCommonArea && complaint.common_area_location && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">{complaint.common_area_location}</p>
                  )}
                </div>
              </div>
            </DetailCard>

            {evidence.length > 0 && (
              <DetailCard title={`Evidence (${evidence.length})`}>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {evidence.map((item, index) => (
                    <div key={item.id || index} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                      <div className="min-w-0"><p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.label || `Evidence ${index + 1}`}</p></div>
                      <div className="ml-3 flex gap-2">
                        {isImageEvidence(item) ? (
                          <button onClick={() => { setViewerIndex(index); setViewerOpen(true); }} className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300"><Eye size={14} />Preview</button>
                        ) : (
                          <a href={item.document_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"><FileText size={14} />Open</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </DetailCard>
            )}

            {complaint.resolution_notes && complaint.status === "resolved" && (
              <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-900/20">
                <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-green-700 dark:text-green-300"><CheckCircle size={14} />Resolution</h3>
                <p className="text-sm text-green-700 dark:text-green-300">{complaint.resolution_notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <DetailCard title="Details">
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-xs text-gray-500">Category</span><span className="text-xs font-medium capitalize text-gray-900 dark:text-white">{complaint.category?.replace(/_/g, " ")}</span></div>
                <div className="flex justify-between"><span className="text-xs text-gray-500">Severity</span><span className="text-xs font-medium text-gray-900 dark:text-white">{complaint.severity}/5</span></div>
                <div className="flex justify-between"><span className="text-xs text-gray-500">Submitted</span><span className="text-xs font-medium text-gray-900 dark:text-white">{fmtDate(complaint.created_at)}</span></div>
                <div className="flex justify-between"><span className="text-xs text-gray-500">Updated</span><span className="text-xs font-medium text-gray-900 dark:text-white">{fmtDate(complaint.updated_at)}</span></div>
              </div>
            </DetailCard>

            <DetailCard title="Actions">
              <div className="space-y-3">
                {canClarify && (
                  <button onClick={() => setActiveModal("clarify")} className="w-full rounded-xl bg-amber-600 px-4 py-3 text-sm font-medium text-white hover:bg-amber-700">Request clarification</button>
                )}
                {canApprove && (
                  <button onClick={() => handleAction(`/landlord/complaints/${id}/approve`, {})} className="w-full rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700">Approve complaint</button>
                )}
                {canIssueVerdict && (
                  <button onClick={() => setActiveModal("verdict")} className="w-full rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white hover:bg-red-700">Issue verdict</button>
                )}
                {!canIssueVerdict && complaint.status === "approved" && !hasAgainstParty && (
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 px-4 py-3 text-sm text-gray-500 dark:text-gray-300 text-center">
                    Verdict unavailable — no specific party identified.
                  </div>
                )}
                {canReject && (
                  <button onClick={() => setActiveModal("reject")} className="w-full rounded-xl bg-gray-700 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800">Reject complaint</button>
                )}
                {!isLandlordOwnedComplaint && (
                  <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-500 dark:bg-gray-700/40 dark:text-gray-300">Complaint currently being handled by the caretaker..</p>
                )}
              </div>
            </DetailCard>
          </div>
        </div>
      </div>
    </div>
  );
}