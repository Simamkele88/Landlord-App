/* eslint-disable no-unused-vars */
// CARETAKER MAINTENANCE DETAIL PAGE — 
import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowLeft, Wrench, User, Home, Calendar, DollarSign,
  Clock, CheckCircle, AlertCircle, ArrowUpCircle,
  Loader2, Edit2, Plus, X, Info, Phone, Image, Eye,
} from "lucide-react";
import useDocumentTitle from "../../../hooks/useDocumentTitle";

// API BASE URL
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

// CONFIGURATION FOR STATUS BADGES
const STATUS_CONFIG = {
  "needs_repair":     { label: "Needs Repair",    color: "text-red-600",    bg: "bg-red-100 dark:bg-red-900/30",     border: "border-red-200 dark:border-red-800",    dot: "bg-red-500"      },
  "assigned":         { label: "Assigned",         color: "text-blue-600",   bg: "bg-blue-100 dark:bg-blue-900/30",    border: "border-blue-200 dark:border-blue-800",   dot: "bg-blue-500"     },
  "in_progress":      { label: "In Progress",      color: "text-yellow-600", bg: "bg-yellow-100 dark:bg-yellow-900/30",  border: "border-yellow-200 dark:border-yellow-800", dot: "bg-yellow-400"   },
  "completed":        { label: "Completed",        color: "text-green-600",  bg: "bg-green-100 dark:bg-green-900/30",   border: "border-green-200 dark:border-green-800",  dot: "bg-green-500"    },
  "cancelled":        { label: "Cancelled",        color: "text-gray-600",   bg: "bg-gray-100 dark:bg-gray-700/50",     border: "border-gray-200 dark:border-gray-700",    dot: "bg-gray-400"     },
  "pending_approval": { label: "Pending Approval", color: "text-purple-600", bg: "bg-purple-100 dark:bg-purple-900/30", border: "border-purple-200 dark:border-purple-800", dot: "bg-purple-500" },
};

// CONFIGURATION FOR PRIORITY BADGES
const PRIORITY_CONFIG = {
  "urgent":    "bg-red-500 text-white",
  "high":      "bg-orange-400 text-white",
  "medium":    "bg-yellow-400 text-gray-900",
  "low":       "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-white",
};

// VALID STATUS TRANSITIONS
const VALID_TRANSITIONS = {
  needs_repair:     ["assigned", "in_progress"],
  assigned:         ["in_progress", "needs_repair"],
  in_progress:      ["completed", "needs_repair"],
  completed:        ["in_progress"],
  pending_approval: ["assigned", "in_progress"],
  cancelled:        [],
};

// HIGH COST THRESHOLD FOR ESCALATION
const HIGH_COST_THRESHOLD = 5000;
// HELPER FUNCTIONS
function fmt(n) { 
  if (!n) return "—";
  return `R ${Number(n).toLocaleString("en-ZA")}`; 
}

function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "";
}

function timeAgo(d) {
  if (!d) return "";
  const s = (Date.now() - new Date(d).getTime()) / 1000;
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["needs_repair"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function PriorityBadge({ priority }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${PRIORITY_CONFIG[priority] ?? ""}`}>
      {priority}
    </span>
  );
}

// MODAL SHELL
function ModalShell({ title, sub, icon: Icon, iconBg, onClose, children, footer }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                <Icon size={18} />
              </div>
            )}
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{title}</h3>
              {sub && <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">{children}</div>
        {footer && (
          <div className="px-6 pb-6 flex gap-3 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

// IMAGE VIEWER MODAL
function ImageViewerModal({ images, currentIndex, onClose, onPrev, onNext }) {
  const img = images[currentIndex];
  
  if (!img) return null;

  const imageUrl = img.document_url?.startsWith('http') 
    ? img.document_url 
    : img.url?.startsWith('http')
      ? img.url
      : `${API}${img.document_url || img.url}`;
  
  console.log("Viewer image URL:", imageUrl);
  
  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" 
      onClick={onClose}
    >
      {/* CLOSE BUTTON */}
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-10"
      >
        <X size={24} />
      </button>
      
      {/* PREVIOUS BUTTON */}
      {currentIndex > 0 && (
        <button 
          onClick={(e) => { e.stopPropagation(); onPrev(); }} 
          className="absolute left-4 text-white/70 hover:text-white p-2 z-10"
        >
          <ArrowLeft size={24} />
        </button>
      )}
      
      {/* NEXT BUTTON */}
      {currentIndex < images.length - 1 && (
        <button 
          onClick={(e) => { e.stopPropagation(); onNext(); }} 
          className="absolute right-4 text-white/70 hover:text-white p-2 z-10"
        >
          <ChevronRight size={24} />
        </button>
      )}
      
      {/* IMAGE */}
      <img
        src={imageUrl}
        alt={`Maintenance photo ${currentIndex + 1}`}
        className="max-w-full max-h-[85vh] object-contain rounded-lg"
        onClick={(e) => e.stopPropagation()}
        onError={(e) => {
          console.error("Failed to load viewer image:", imageUrl);
          e.target.style.display = 'none';
        }}
      />
      
      {/* COUNTER */}
      <div className="absolute bottom-4 text-white/70 text-sm">
        {currentIndex + 1} / {images.length}
        {img.photo_type && (
          <span className="ml-2 capitalize">· {img.photo_type}</span>
        )}
      </div>
    </div>
  );
}

// ASSIGN CONTRACTOR MODAL
function AssignContractorModal({ request, onClose, onSubmit }) {
  const [contractorName, setContractorName] = useState(request.contractor_name || "");
  const [contractorPhone, setContractorPhone] = useState(request.contractor_phone || "");
  const [scheduledDate, setScheduledDate] = useState(request.scheduled_date ? request.scheduled_date.split('T')[0] : "");
  const [estCost, setEstCost] = useState(request.estimated_cost ? String(request.estimated_cost) : "");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!contractorName.trim()) { setError("Please enter a contractor or worker name"); return; }
    
    onSubmit({
      contractorName: contractorName.trim(),
      contractorPhone: contractorPhone.trim() || null,
      scheduledDate: scheduledDate || null,
      estimatedCost: estCost ? Number(estCost) : null,
      notes: notes.trim() || null,
    });
    onClose();
  }

  return (
    <ModalShell
      title={request.contractor_name ? "Reassign Contractor" : "Assign Contractor"}
      sub={`${request.request_number} · ${request.title}`}
      icon={User}
      iconBg="bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} disabled={loading} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
            {loading ? <><Loader2 size={15} className="animate-spin" />Assigning...</> : <><User size={14} />{request.contractor_name ? "Update Assignment" : "Assign"}</>}
          </button>
        </>
      }
    >
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          Contractor / Worker Name *
        </label>
        <input 
          type="text" 
          value={contractorName} 
          onChange={e => { setContractorName(e.target.value); setError(""); }} 
          placeholder="e.g. Sipho Ndlovu or ABC Plumbing"
          className="w-full text-sm rounded-lg px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          Phone Number (Optional)
        </label>
        <input 
          type="tel" 
          value={contractorPhone} 
          onChange={e => setContractorPhone(e.target.value)} 
          placeholder="e.g. 0821234567"
          className="w-full text-sm rounded-lg px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Scheduled Date (Optional)</label>
        <input 
          type="date" 
          value={scheduledDate} 
          onChange={e => setScheduledDate(e.target.value)}
          className="w-full text-sm rounded-lg px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Estimated Cost (R) (Optional)</label>
        <input 
          type="number" 
          value={estCost} 
          onChange={e => setEstCost(e.target.value)} 
          placeholder="e.g. 850"
          className="w-full text-sm rounded-lg px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
        />
        {estCost && Number(estCost) >= HIGH_COST_THRESHOLD && (
          <p className="text-xs text-orange-500 mt-1.5 flex items-center gap-1">
            <Info size={12} />
            This exceeds the R{HIGH_COST_THRESHOLD} threshold and may need landlord approval
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Notes (Optional)</label>
        <textarea 
          rows={3} 
          value={notes} 
          onChange={e => setNotes(e.target.value)} 
          placeholder="Special instructions, access details..."
          className="w-full text-sm rounded-lg px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
        />
      </div>
    </ModalShell>
  );
}

// UPDATE STATUS MODAL
function UpdateStatusModal({ request, onClose, onSubmit }) {
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [actualCost, setActualCost] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nextStatuses = VALID_TRANSITIONS[request.status] ?? [];

  function handleSubmit() {
    if (!newStatus) { setError("Please select a status"); return; }
    if (newStatus === "completed" && !notes.trim()) { setError("Please add completion notes"); return; }
    
    onSubmit({ 
      status: newStatus, 
      notes: notes.trim() || null, 
      actualCost: actualCost ? Number(actualCost) : null 
    });
    onClose();
  }

  return (
    <ModalShell
      title="Update Status"
      sub={request.request_number}
      icon={Clock}
      iconBg="bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} disabled={loading} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
            {loading ? <><Loader2 size={15} className="animate-spin" />Updating...</> : <><CheckCircle size={14} />Update Status</>}
          </button>
        </>
      }
    >
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Select New Status</p>
      {nextStatuses.map(s => {
        const cfg = STATUS_CONFIG[s] ?? STATUS_CONFIG["needs_repair"];
        const active = newStatus === s;
        return (
          <button
            key={s}
            onClick={() => { setNewStatus(s); setError(""); }}
            className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left
              ${active ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cfg.bg}`}>
              <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            </div>
            <span className={`text-sm font-semibold ${active ? cfg.color : "text-gray-900 dark:text-white"}`}>{cfg.label}</span>
          </button>
        );
      })}

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          Notes {newStatus === "completed" && <span className="text-red-500">*</span>}
        </label>
        <textarea 
          rows={3} 
          value={notes} 
          onChange={e => { setNotes(e.target.value); setError(""); }}
          placeholder="Describe what was done, materials used..."
          className="w-full text-sm rounded-lg px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
        />
      </div>

      {newStatus === "completed" && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Actual Cost (R) (Optional)</label>
          <input 
            type="number" 
            value={actualCost} 
            onChange={e => setActualCost(e.target.value)} 
            placeholder="e.g. 750"
            className="w-full text-sm rounded-lg px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>
      )}

      {newStatus === "completed" && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
          <Info size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-green-700 dark:text-green-300">The tenant will be notified to confirm the repair is satisfactory.</p>
        </div>
      )}
    </ModalShell>
  );
}

// ESCALATE MODAL
function EscalateModal({ request, onClose, onSubmit }) {
  const [cost, setCost] = useState(request.estimated_cost ? String(request.estimated_cost) : "");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit() {
    if (!cost || isNaN(Number(cost))) { setError("Please enter the estimated cost"); return; }
    if (!reason.trim()) { setError("Please describe the reason"); return; }
    
    onSubmit({ 
      estimatedCost: Number(cost), 
      reason: reason.trim() 
    });
    onClose();
  }

  return (
    <ModalShell
      title="Escalate to Landlord"
      sub="High-cost repair requires approval"
      icon={ArrowUpCircle}
      iconBg="bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400"
      onClose={onClose}
      footer={
        <>
          <button onClick={onClose} disabled={loading} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
            {loading ? <><Loader2 size={15} className="animate-spin" />Escalating...</> : <><ArrowUpCircle size={14} />Notify Landlord</>}
          </button>
        </>
      }
    >
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-400">{error}</div>
      )}

      <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700">
        <Info size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-orange-700 dark:text-orange-300">
          The landlord will receive a notification with the estimated cost and your reason. The request will be paused until approved.
        </p>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Estimated Repair Cost (R) *</label>
        <input 
          type="number" 
          value={cost} 
          onChange={e => { setCost(e.target.value); setError(""); }} 
          placeholder="e.g. 7500"
          className="w-full text-sm rounded-lg px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500" 
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Reason & Notes *</label>
        <textarea 
          rows={4} 
          value={reason} 
          onChange={e => { setReason(e.target.value); setError(""); }}
          placeholder="Describe why this requires landlord approval — scope of work, materials, contractor quotes..."
          className="w-full text-sm rounded-lg px-3 py-2.5 border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" 
        />
      </div>
    </ModalShell>
  );
}

// MAIN PAGE
export default function CaretakerMaintenanceDetail() {
  useDocumentTitle("Maintenance Detail");
  const navigate = useNavigate();
  const { id } = useParams();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAssign, setShowAssign] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // FETCH REQUEST DETAIL
  const fetchRequest = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/caretaker/maintenance/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setRequest(response.data.request || response.data);
    } catch (err) {
      console.error("Failed to fetch maintenance request:", err);
      setError(err.response?.data?.error || "Failed to load request details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchRequest();
  }, [fetchRequest]);

  // HANDLE ASSIGN CONTRACTOR
  async function handleAssign(data) {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/caretaker/maintenance/${id}/assign`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchRequest();
      setShowAssign(false);
    } catch (err) {
      console.error("Failed to assign:", err);
      alert(err.response?.data?.error || "Failed to assign contractor");
    } finally {
      setSaving(false);
    }
  }

  // HANDLE STATUS UPDATE
  async function handleStatusUpdate(data) {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/caretaker/maintenance/${id}/status`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchRequest();
      setShowStatus(false);
    } catch (err) {
      console.error("Failed to update status:", err);
      alert(err.response?.data?.error || "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  // HANDLE ESCALATE
  async function handleEscalate(data) {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/caretaker/maintenance/${id}/escalate`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchRequest();
      setShowEscalate(false);
    } catch (err) {
      console.error("Failed to escalate:", err);
      alert(err.response?.data?.error || "Failed to escalate request");
    } finally {
      setSaving(false);
    }
  }

  // LOADING STATE
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-blue-500 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading request details...</p>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (error || !request) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-900 dark:text-white mb-2">Error Loading Request</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{error || "Request not found"}</p>
          <button
            onClick={() => navigate("/caretaker/maintenance")}
            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Back to Maintenance List
          </button>
        </div>
      </div>
    );
  }

  // VET PHOTOS FOR DISPLAY
  const photos = request.photos || [];

  const canAssign = ["needs_repair", "pending_approval"].includes(request.status);
  const canReassign = ["assigned", "in_progress"].includes(request.status);
  const canStatus = !["completed", "cancelled"].includes(request.status);
  const canEscalate = !["pending_approval", "completed", "cancelled"].includes(request.status);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* IMAGE VIEWER */}
      {viewerOpen && photos.length > 0 && (
        <ImageViewerModal
          images={photos}
          currentIndex={viewerIndex}
          onClose={() => setViewerOpen(false)}
          onPrev={() => setViewerIndex(prev => Math.max(0, prev - 1))}
          onNext={() => setViewerIndex(prev => Math.min(photos.length - 1, prev + 1))}
        />
      )}

      {/* SAVING OVERLAY */}
      {saving && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 flex items-center gap-3 shadow-xl">
            <Loader2 size={20} className="animate-spin text-blue-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">Saving changes...</span>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showAssign && (
        <AssignContractorModal request={request} onClose={() => setShowAssign(false)} onSubmit={handleAssign} />
      )}
      {showStatus && (
        <UpdateStatusModal request={request} onClose={() => setShowStatus(false)} onSubmit={handleStatusUpdate} />
      )}
      {showEscalate && (
        <EscalateModal request={request} onClose={() => setShowEscalate(false)} onSubmit={handleEscalate} />
      )}

      <div className="px-4 pt-6 max-w-screen-xl mx-auto pb-12">
        {/* BACK BUTTON */}
        <button
          onClick={() => navigate("/caretaker/maintenance")}
          className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Maintenance
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN — DETAILS */}
          <div className="lg:col-span-2 space-y-6">
            {/* HEADER */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <StatusBadge status={request.status} />
                <PriorityBadge priority={request.priority} />
                <span className="text-xs text-gray-400 ml-auto">{request.request_number}</span>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{request.title}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{request.description}</p>
            </div>

            {/* PHOTOS SECTION */}
            {photos.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Image size={16} className="text-gray-400" />
                  Photos ({photos.length})
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {photos.map((photo, idx) => {
                    const thumbnailUrl = photo.document_url?.startsWith('http') 
                      ? photo.document_url 
                      : `${API}${photo.document_url}`;
                    
                    return (
                      <button
                        key={photo.id || idx}
                        onClick={() => { 
                          console.log("Opening photo:", idx, thumbnailUrl);
                          setViewerIndex(idx); 
                          setViewerOpen(true); 
                        }}
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 group hover:ring-2 hover:ring-blue-400 transition-all"
                      >
                        <img
                          src={thumbnailUrl}
                          alt={`Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            console.error("Thumbnail failed to load:", thumbnailUrl);
                            e.target.style.display = 'none';
                          }}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Eye size={18} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {photo.photo_type && (
                          <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1.5 py-0.5 rounded capitalize">
                            {photo.photo_type}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TENANT INFO */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Tenant & Unit</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Tenant</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{request.tenant_name}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Unit</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">
                    {request.unit_number ? `Unit ${request.unit_number}` : "—"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Property</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white mt-1">{request.property_name}</p>
                </div>
              </div>
            </div>

            {/* ASSIGNED CONTRACTOR */}
            {request.contractor_name && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Assigned Contractor</h3>
                  {canReassign && (
                    <button onClick={() => setShowAssign(true)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                      <Edit2 size={12} /> Reassign
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-400">
                    <User size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{request.contractor_name}</p>
                    {request.contractor_phone && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-0.5">
                        <Phone size={10} /> {request.contractor_phone}
                      </p>
                    )}
                  </div>
                  {request.scheduled_date && (
                    <div className="ml-auto text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Scheduled</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{fmtDate(request.scheduled_date)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* COMPLETION NOTES */}
            {request.completion_notes && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-green-700 dark:text-green-400 mb-2 flex items-center gap-2">
                  <CheckCircle size={14} /> Completion Notes
                </h3>
                <p className="text-sm text-green-600 dark:text-green-400">{request.completion_notes}</p>
              </div>
            )}

            {/* TIMELINE */}
            {request.updates && request.updates.length > 0 && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Activity Timeline</h3>
                <div className="space-y-0">
                  {request.updates.map((u, idx) => {
                    const cfg = STATUS_CONFIG[u.status_to] ?? STATUS_CONFIG["needs_repair"];
                    const isLast = idx === request.updates.length - 1;
                    return (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`w-5 h-5 rounded-full border-2 ${cfg.border} flex items-center justify-center`}>
                            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                          </div>
                          {!isLast && <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />}
                        </div>
                        <div className={`${!isLast ? "pb-5" : ""}`}>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
                            <span className="text-xs text-gray-400">{timeAgo(u.created_at)}</span>
                          </div>
                          {u.notes && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{u.notes}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">
            {/* COST SUMMARY */}
            {(request.estimated_cost || request.actual_cost) && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Cost Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  {request.estimated_cost && (
                    <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Estimated</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{fmt(request.estimated_cost)}</p>
                    </div>
                  )}
                  {request.actual_cost && (
                    <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                      <p className="text-xs text-green-600 dark:text-green-400">Actual</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400 mt-1">{fmt(request.actual_cost)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Actions</h3>

              {canAssign && (
                <button
                  onClick={() => setShowAssign(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
                >
                   Assign Contractor
                </button>
              )}

              {canStatus && (
                <button
                  onClick={() => setShowStatus(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
                >
                   Update Status
                </button>
              )}

              {canEscalate && (
                <button
                  onClick={() => setShowEscalate(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-xl transition-colors"
                >
                   Escalate to Landlord
                </button>
              )}

              {!canAssign && !canStatus && !canEscalate && (
                <p className="text-sm text-gray-400 text-center py-2">No actions available for this request</p>
              )}
            </div>

            {/* DETAILS CARD */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Category</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white capitalize">
                    {request.category?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Reported</span>
                  <span className="text-xs font-medium text-gray-900 dark:text-white">
                    {fmtDate(request.created_at)}
                  </span>
                </div>
                {request.completed_at && (
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Completed</span>
                    <span className="text-xs font-medium text-gray-900 dark:text-white">
                      {fmtDate(request.completed_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}