/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft, Loader2, AlertTriangle,
  CheckCircle, XCircle, Eye, Image, ArrowUpCircle
} from "lucide-react";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const STATUS_CONFIG = {
  "open":          { label: "Open",         color: "text-red-600",    bg: "bg-red-100 dark:bg-red-900/30",     dot: "bg-red-500"      },
  "under_review":  { label: "Under Review", color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30", dot: "bg-yellow-400"   },
  "awaiting_clarification": { label: "Needs Clarification", color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900/30", dot: "bg-orange-500" },
  "approved":      { label: "Approved",     color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/30",    dot: "bg-blue-500"    },
  "resolved":      { label: "Resolved",     color: "text-green-600",  bg: "bg-green-100 dark:bg-green-900/30",  dot: "bg-green-500"    },
  "dismissed":     { label: "Dismissed",    color: "text-gray-600",   bg: "bg-gray-100 dark:bg-gray-700/50",    dot: "bg-gray-400"     },
  "escalated":     { label: "Escalated",    color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30",dot: "bg-purple-500"   },
};

const SCOPE_LABELS = {
  specific_tenant: "Specific Unit / Tenant",
  common_area: "Common Area",
  unknown: "Unknown / General",
  property_wide: "Property-Wide Issue",
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["open"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color} border`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function fmtDate(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : ""; }
function timeAgo(d) {
  if (!d) return "";
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function VerdictModal({ complaint, onClose, onSubmit }) {
  const [verdictType, setVerdictType] = useState("warning");
  const [fineAmount, setFineAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!verdictType) { setError("Please select a verdict type"); return; }
    if (verdictType === "fine" && (!fineAmount || Number(fineAmount) <= 0)) { setError("Please enter a valid fine amount"); return; }
    setLoading(true);
    onSubmit({ verdict_type: verdictType, fine_amount: verdictType === "fine" ? Number(fineAmount) : null, notes: notes.trim() || null });
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center"><AlertTriangle size={18} className="text-orange-600 dark:text-orange-400" /></div>
            <div><h3 className="text-base font-semibold text-gray-900 dark:text-white">Issue Verdict</h3><p className="text-xs text-gray-500 dark:text-gray-400">{complaint.subject}</p></div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 text-sm text-red-700">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Verdict Type</label>
            <div className="grid grid-cols-2 gap-3">
              {[{ id: "warning", label: "Warning", desc: "Formal written warning" }, { id: "fine", label: "Fine", desc: "Monetary penalty" }].map(type => (
                <button key={type.id} onClick={() => { setVerdictType(type.id); setError(""); }}
                  className={`p-3 rounded-lg border text-left transition-colors ${verdictType === type.id ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{type.label}</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>
          {verdictType === "fine" && (
            <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Fine Amount (R) *</label>
              <input type="number" min="0" value={fineAmount} onChange={e => { setFineAmount(e.target.value); setError(""); }} placeholder="e.g. 500" className="w-full text-sm rounded-lg px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          )}
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Notes</label>
            <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Details about the verdict..." className="w-full text-sm rounded-lg px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl disabled:opacity-50">{loading ? <Loader2 size={15} className="animate-spin" /> : "Issue Verdict"}</button>
        </div>
      </div>
    </div>
  );
}

function DismissModal({ complaint, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  function handleSubmit() { if (!reason.trim()) { setError("Please provide a reason for dismissal"); return; } setLoading(true); onSubmit({ reason: reason.trim() }); setLoading(false); onClose(); }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-red-100 dark:bg-red-900/40 flex items-center justify-center"><XCircle size={18} className="text-red-600 dark:text-red-400" /></div><div><h3 className="text-base font-semibold text-gray-900 dark:text-white">Dismiss Complaint</h3><p className="text-xs text-gray-500 dark:text-gray-400">{complaint.subject}</p></div></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 text-sm text-red-700">{error}</div>}
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reason for Dismissal *</label><textarea rows={4} value={reason} onChange={e => { setReason(e.target.value); setError(""); }} placeholder="Explain why..." className="w-full text-sm rounded-lg px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" /></div>
        </div>
        <div className="px-6 pb-6 flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl disabled:opacity-50">{loading ? <Loader2 size={15} className="animate-spin" /> : "Dismiss Complaint"}</button>
        </div>
      </div>
    </div>
  );
}

function EscalateModal({ complaint, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  function handleSubmit() { if (!reason.trim()) { setError("Please provide a reason for escalation"); return; } setLoading(true); onSubmit({ reason: reason.trim() }); setLoading(false); onClose(); }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center"><ArrowUpCircle size={18} className="text-purple-600 dark:text-purple-400" /></div><div><h3 className="text-base font-semibold text-gray-900 dark:text-white">Escalate to Landlord</h3><p className="text-xs text-gray-500 dark:text-gray-400">{complaint.subject}</p></div></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 text-sm text-red-700">{error}</div>}
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Reason for Escalation *</label><textarea rows={4} value={reason} onChange={e => { setReason(e.target.value); setError(""); }} placeholder="Explain why..." className="w-full text-sm rounded-lg px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" /></div>
        </div>
        <div className="px-6 pb-6 flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl disabled:opacity-50">{loading ? <Loader2 size={15} className="animate-spin" /> : "Escalate to Landlord"}</button>
        </div>
      </div>
    </div>
  );
}

function ResolveModal({ complaint, onClose, onSubmit }) {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!notes.trim()) { setError("Please provide resolution notes"); return; }
    setLoading(true);
    onSubmit({ notes: notes.trim() });
    setLoading(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-green-100 dark:bg-green-900/40 flex items-center justify-center"><CheckCircle size={18} className="text-green-600 dark:text-green-400" /></div>
            <div><h3 className="text-base font-semibold text-gray-900 dark:text-white">Resolve Complaint</h3><p className="text-xs text-gray-500 dark:text-gray-400">{complaint.subject}</p></div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 text-sm text-red-700">{error}</div>}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
            <AlertTriangle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-green-700 dark:text-green-300">This complaint is not against a specific tenant. Provide details on how the issue was resolved.</p>
          </div>
          <div><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Resolution Notes *</label><textarea rows={5} value={notes} onChange={e => { setNotes(e.target.value); setError(""); }} placeholder="Describe how this issue was resolved..." className="w-full text-sm rounded-lg px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none" /></div>
        </div>
        <div className="px-6 pb-6 flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 px-4 rounded-xl disabled:opacity-50">{loading ? <Loader2 size={15} className="animate-spin" /> : "Mark Resolved"}</button>
        </div>
      </div>
    </div>
  );
}

function ImageViewerModal({ images, currentIndex, onClose, onPrev, onNext }) {
  const img = images[currentIndex];
  if (!img) return null;
  const imageUrl = img.document_url?.startsWith('http') ? img.document_url : `${API}${img.document_url || img.url || ''}`;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white p-2">✕</button>
      {currentIndex > 0 && <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-4 text-white/70 hover:text-white p-2">←</button>}
      {currentIndex < images.length - 1 && <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-4 text-white/70 hover:text-white p-2">→</button>}
      <img src={imageUrl} alt={`Evidence ${currentIndex + 1}`} className="max-w-full max-h-[85vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} onError={(e) => { console.error("Viewer failed to load:", imageUrl); }} />
      <div className="absolute bottom-4 text-white/70 text-sm">{currentIndex + 1} / {images.length}</div>
    </div>
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
      const response = await axios.get(`${API}/complaints/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setComplaint(response.data.complaint);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load complaint");
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchComplaint(); }, [fetchComplaint]);

  async function handleAction(endpoint, payload) {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}${endpoint}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      await fetchComplaint();
      setShowVerdict(false); setShowDismiss(false); setShowEscalate(false); setShowResolve(false);
      toast.success("Action completed successfully!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Action failed");
    } finally { setSaving(false); }
  }

  if (loading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center"><Loader2 size={32} className="animate-spin text-blue-500" /></div>;
  if (error || !complaint) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center"><AlertTriangle size={32} className="text-red-400 mx-auto mb-3" /><p className="text-gray-500">{error || "Complaint not found"}</p><button onClick={() => navigate("/caretaker/complaints")} className="text-blue-600 hover:underline mt-2">Back to Complaints</button></div>
    </div>
  );

  const isSpecificTenant = complaint.complaint_scope === "specific_tenant";
  const isCommonArea = complaint.complaint_scope === "common_area";
  const scopeLabel = SCOPE_LABELS[complaint.complaint_scope] || "Unknown";
  const hasAgainstParty = isSpecificTenant && complaint.against_name;
  const canMarkUnderReview = complaint.status === "open";
  const canIssueVerdict = ["under_review"].includes(complaint.status);
  const canMarkResolved = complaint.status === "under_review" && !hasAgainstParty;
  const canDismiss = ["open", "under_review"].includes(complaint.status);
  const canEscalate = ["open", "under_review"].includes(complaint.status);
  const canReopen = ["resolved", "dismissed"].includes(complaint.status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {saving && <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center"><div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex items-center gap-3 shadow-xl"><Loader2 size={20} className="animate-spin text-blue-500" /><span className="text-sm font-medium text-gray-900 dark:text-white">Saving...</span></div></div>}

      {showVerdict && <VerdictModal complaint={complaint} onClose={() => setShowVerdict(false)} onSubmit={(data) => handleAction(`/caretaker/complaints/${id}/verdict`, data)} />}
      {showDismiss && <DismissModal complaint={complaint} onClose={() => setShowDismiss(false)} onSubmit={(data) => handleAction(`/caretaker/complaints/${id}/dismiss`, data)} />}
      {showEscalate && <EscalateModal complaint={complaint} onClose={() => setShowEscalate(false)} onSubmit={(data) => handleAction(`/caretaker/complaints/${id}/escalate`, data)} />}
      {showResolve && <ResolveModal complaint={complaint} onClose={() => setShowResolve(false)} onSubmit={(data) => handleAction(`/caretaker/complaints/${id}/resolve`, data)} />}
      {viewerOpen && complaint.evidence?.length > 0 && <ImageViewerModal images={complaint.evidence} currentIndex={viewerIndex} onClose={() => setViewerOpen(false)} onPrev={() => setViewerIndex(prev => Math.max(0, prev - 1))} onNext={() => setViewerIndex(prev => Math.min(complaint.evidence.length - 1, prev + 1))} />}

      <div className="px-4 pt-6 max-w-screen-xl mx-auto pb-12">
        <button onClick={() => navigate("/caretaker/complaints")} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"><ArrowLeft size={16} />Back to Complaints</button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4"><StatusBadge status={complaint.status} /><span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 dark:bg-gray-700 dark:text-gray-300">{scopeLabel}</span></div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{complaint.subject}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{complaint.description}</p>
              {isCommonArea && complaint.common_area_location && <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-yellow-50 px-3 py-1.5 text-xs font-medium text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300">{complaint.common_area_location}</div>}
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Parties Involved</h3>
              <div className={`grid gap-4 ${hasAgainstParty ? 'grid-cols-1 sm:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800"><p className="text-xs text-blue-500 dark:text-blue-400 uppercase tracking-wider font-semibold">Filed By</p><p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{complaint.filed_by_name}</p></div>
                {hasAgainstParty && <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800"><p className="text-xs text-red-500 dark:text-red-400 uppercase tracking-wider font-semibold">Against</p><p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{complaint.against_name}</p>{complaint.against_unit_number && <p className="text-xs text-gray-500 mt-0.5">Unit {complaint.against_unit_number}</p>}</div>}
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-700"><p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Property</p><p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{complaint.property_name || "Property"}</p></div>
              </div>
            </div>

            {complaint.evidence?.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Image size={16} className="text-gray-400" />Evidence ({complaint.evidence.length})</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {complaint.evidence.map((item, idx) => {
                    const imageUrl = item.document_url?.startsWith('http') ? item.document_url : `${API}${item.document_url || item.url || ''}`;
                    return (
                      <button key={item.id || idx} onClick={() => { setViewerIndex(idx); setViewerOpen(true); }} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 group hover:ring-2 hover:ring-blue-400">
                        <img src={imageUrl} alt={`Evidence ${idx + 1}`} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center"><Eye size={18} className="text-white opacity-0 group-hover:opacity-100" /></div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {complaint.resolution_notes && (
              <div className={`rounded-xl p-6 border ${complaint.status === "resolved" ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}>
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">{complaint.status === "resolved" ? <CheckCircle size={14} className="text-green-600" /> : <XCircle size={14} className="text-red-600" />}<span>{complaint.status === "resolved" ? "Resolution" : "Dismissal Reason"}</span></h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">{complaint.resolution_notes}</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between"><span className="text-xs text-gray-500">Category</span><span className="text-xs font-medium text-gray-900 dark:text-white capitalize">{complaint.category?.replace(/_/g, ' ')}</span></div>
                <div className="flex justify-between"><span className="text-xs text-gray-500">Scope</span><span className="text-xs font-medium text-gray-900 dark:text-white">{scopeLabel}</span></div>
                <div className="flex justify-between"><span className="text-xs text-gray-500">Severity</span><span className="text-xs font-medium text-gray-900 dark:text-white">{complaint.severity}/5</span></div>
                <div className="flex justify-between"><span className="text-xs text-gray-500">Submitted</span><span className="text-xs font-medium text-gray-900 dark:text-white">{fmtDate(complaint.created_at)}</span></div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Actions</h3>
              {canMarkUnderReview && <button onClick={() => handleAction(`/caretaker/complaints/${id}/review`, {})} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-yellow-600 hover:bg-yellow-700 text-white text-sm font-medium rounded-xl transition-colors">Mark Under Review</button>}
              {canMarkResolved && <button onClick={() => setShowResolve(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors">Mark Resolved</button>}
              {canIssueVerdict && hasAgainstParty && <button onClick={() => setShowVerdict(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-xl transition-colors">Issue Verdict</button>}
              {canDismiss && <button onClick={() => setShowDismiss(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors">Dismiss Complaint</button>}
              {canEscalate && <button onClick={() => setShowEscalate(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors">Escalate to Landlord</button>}
              {canReopen && <button onClick={() => handleAction(`/complaints/${id}/reopen`, { reason: "Caretaker reopened" })} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"><AlertTriangle size={16} />Reopen Complaint</button>}
              {!canMarkUnderReview && !canMarkResolved && !canIssueVerdict && !canDismiss && !canEscalate && !canReopen && <p className="text-sm text-gray-400 text-center py-2">No actions available</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}