/* eslint-disable no-unused-vars */

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Home,
  Key,
  Wrench,
  Plus,
  Search,
  X,
  Loader2,
  Trash2,
  Edit,
  LayoutGrid,
  List,
  CheckCircle,
  Car,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";

const API = "http://localhost:4000";

const STATUSES = ["All", "Occupied", "Vacant", "Maintenance"];
const VIEWS = ["grid", "list"];

const STATUS_CONFIG = {
  "occupied":    { badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-100 dark:border-green-700",  dot: "bg-green-500", icon: CheckCircle, label: "Occupied" },
  "vacant":      { badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-700",        dot: "bg-blue-400",  icon: Key, label: "Vacant" },
  "maintenance": { badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-100 dark:border-orange-700", dot: "bg-orange-400", icon: Wrench, label: "Maintenance" },
  "reserved":    { badge: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-100 dark:border-purple-700", dot: "bg-purple-400", icon: Key, label: "Reserved" },
};

function format(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function initials(name = "") { return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(); }

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["vacant"];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md ${cfg.badge}`}>
      {Icon && <Icon size={12} />}
      {cfg.label || status}
    </span>
  );
}

function UnitFormModal({ unit, properties, onClose, onSave }) {
  const toast = useToast();
  const isEdit = !!unit;
  const [form, setForm] = useState({
    unit_number: unit?.unit_number ?? "",
    property_id: unit?.property_id ?? "",
    unit_type: unit?.unit_type ?? "1_bedroom",
    monthly_rent: unit?.monthly_rent ?? "",
    floor_number: unit?.floor_number ?? "",
    parking_bay: unit?.parking_bay ?? false,
    status: unit?.status ?? "vacant",
    notes: unit?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: undefined })); }

  function validate() {
    const e = {};
    if (!form.unit_number) e.unit_number = "Required";
    if (!form.property_id) e.property_id = "Required";
    if (!form.monthly_rent) e.monthly_rent = "Required";
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); toast.warning("Please fill all required fields."); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = { ...form, monthly_rent: Number(form.monthly_rent), floor_number: form.floor_number ? Number(form.floor_number) : null };
      const { data } = isEdit
        ? await axios.put(`${API}/units/${unit.id}`, payload, { headers: { Authorization: `Bearer ${token}` } })
        : await axios.post(`${API}/properties/${form.property_id}/units`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(isEdit ? "Unit updated!" : "Unit added!");
      onSave(data.unit ?? data);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save unit.");
    } finally {
      setLoading(false);
    }
  }

  function Field({ label, error, children }) {
    return (
      <div>
        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
          {label}{error && <span className="text-red-500 normal-case font-normal ml-1">— {error}</span>}
        </label>
        {children}
      </div>
    );
  }

  const cls = (key) =>
    `w-full text-sm rounded-lg px-3 py-2.5 border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors[key] ? "border-red-400 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`;

  const UNIT_TYPES = ["studio", "1_bedroom", "2_bedroom", "3_bedroom", "4_bedroom", "penthouse"];
  const typeLabel = (t) => ({ studio: "Studio", "1_bedroom": "1 Bed", "2_bedroom": "2 Bed", "3_bedroom": "3 Bed", "4_bedroom": "4 Bed", penthouse: "Penthouse" })[t] ?? t;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">{isEdit ? `Edit Unit ${unit.unit_number}` : "Add New Unit"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Unit Number" error={errors.unit_number}>
              <input className={cls("unit_number")} value={form.unit_number} onChange={e => set("unit_number", e.target.value)} placeholder="e.g. 101" type="number" />
            </Field>
            <Field label="Floor" error={errors.floor_number}>
              <input className={cls("floor_number")} value={form.floor_number} onChange={e => set("floor_number", e.target.value)} placeholder="e.g. 3" type="number" min="0" />
            </Field>
          </div>
          <Field label="Property" error={errors.property_id}>
            <select className={cls("property_id")} value={form.property_id} onChange={e => set("property_id", e.target.value)}>
              <option value="">Select property</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Unit Type">
              <select className={cls("unit_type")} value={form.unit_type} onChange={e => set("unit_type", e.target.value)}>
                {UNIT_TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
              </select>
            </Field>
            <Field label="Monthly Rent (R)" error={errors.monthly_rent}>
              <input className={cls("monthly_rent")} value={form.monthly_rent} onChange={e => set("monthly_rent", e.target.value)} placeholder="e.g. 6500" type="number" min="0" />
            </Field>
          </div>
          <Field label="Status">
            <select className={cls("status")} value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="reserved">Reserved</option>
            </select>
          </Field>
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2">
              <Car size={18} className="text-gray-500" />
              <div><p className="text-sm font-medium text-gray-900 dark:text-white">Parking Bay</p><p className="text-xs text-gray-500 dark:text-gray-400">Does this unit include a parking bay?</p></div>
            </div>
            <button type="button" onClick={() => set("parking_bay", !form.parking_bay)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${form.parking_bay ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.parking_bay ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
          <Field label="Notes (optional)">
            <textarea className={cls("notes") + " resize-none"} rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="e.g. Freshly painted, available immediately..." />
          </Field>
        </div>
        <div className="px-6 pb-6 flex gap-3 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">
          <button onClick={onClose} disabled={loading} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
            {loading ? <><Loader2 size={16} className="animate-spin" />Saving...</> : isEdit ? <>Save Changes</> : <>Add Unit</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ unit, onClose, onConfirm }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  async function handle() {
    setLoading(true);
    try {
      await onConfirm(unit.id);
      toast.success(`${unit.unit_number ? `Unit ${unit.unit_number}` : "Unit"} removed.`);
      onClose();
    } catch {
      toast.error("Failed to delete unit.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0"><Trash2 size={20} className="text-red-600 dark:text-red-400" /></div>
          <div><h3 className="text-base font-semibold text-gray-900 dark:text-white">Remove Unit</h3><p className="text-xs text-gray-500 dark:text-gray-400">This cannot be undone</p></div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Are you sure you want to remove <span className="font-semibold text-gray-900 dark:text-white">Unit {unit?.unit_number}</span>?
          {unit?.tenant_name && <span className="text-red-500"> This unit is currently occupied by {unit.tenant_name}.</span>}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 rounded-xl transition-colors">Cancel</button>
          <button onClick={handle} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={14} className="animate-spin" />Removing...</> : <><Trash2 size={14} />Remove</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function UnitGridCard({ unit, onEdit, onDelete, onNavigateTenant }) {
  const cfg = STATUS_CONFIG[unit.status] ?? STATUS_CONFIG["vacant"];
  return (
    <div className={`bg-white dark:bg-gray-800 border rounded-xl shadow-sm hover:shadow-md transition-all ${unit.status === "vacant" ? "border-blue-200 dark:border-blue-800" : unit.status === "maintenance" ? "border-orange-200 dark:border-orange-800" : "border-gray-200 dark:border-gray-700"}`}>
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between gap-2">
          <div><p className="text-base font-bold text-gray-900 dark:text-white">Unit {unit.unit_number}</p><p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{unit.property_name}</p></div>
          <StatusBadge status={unit.status} />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Type</span><span className="font-medium text-gray-900 dark:text-white">{unit.unit_type?.replace(/_/g, " ")}</span></div>
        <div className="flex items-center justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Floor</span><span className="font-medium text-gray-900 dark:text-white">{unit.floor_number || "—"}</span></div>
        <div className="flex items-center justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Rent</span><span className="font-semibold text-gray-900 dark:text-white">{format(unit.monthly_rent)}<span className="text-xs font-normal text-gray-400">/mo</span></span></div>
        <div className="flex items-center justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Parking</span><span className={unit.parking_bay ? "text-green-500 font-medium flex items-center gap-1" : "text-gray-400"}>{unit.parking_bay ? <><CheckCircle size={12} /> Yes</> : "—"}</span></div>
        {unit.tenant_name ? (
          <button onClick={() => onNavigateTenant(unit)} className="w-full flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <div className="w-7 h-7 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">{initials(unit.tenant_name)}</div>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">{unit.tenant_name}</span>
          </button>
        ) : (
          <div className={`w-full p-2 rounded-lg text-center text-xs font-medium flex items-center justify-center gap-1.5 ${unit.status === "maintenance" ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" : "bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500"}`}>
            {unit.status === "maintenance" ? <><Wrench size={12} /> Under maintenance</> : <><Key size={12} /> Available for tenancy</>}
          </div>
        )}
        {unit.notes && <p className="text-xs text-gray-400 dark:text-gray-500 italic truncate flex items-center gap-1" title={unit.notes}><AlertCircle size={12} />{unit.notes}</p>}
      </div>
      <div className="px-4 pb-4 flex gap-2">
        <button onClick={() => onEdit(unit)} className="flex-1 text-xs font-medium py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-center gap-1">Edit</button>
        <button onClick={() => onDelete(unit)} className="text-xs font-medium py-2 px-3 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors flex items-center justify-center gap-1">Remove</button>
      </div>
    </div>
  );
}

export default function Units() {
  useDocumentTitle("Units");
  const navigate = useNavigate();
  const toast = useToast();

  const [units, setUnits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatus] = useState("All");
  const [propertyFilter, setProperty] = useState("All");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");
  const [editUnit, setEditUnit] = useState(null);
  const [deleteUnit, setDeleteUnit] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const [propRes] = await Promise.all([
        axios.get(`${API}/properties`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setProperties(propRes.data.properties || []);
      
      // Collect all units from all properties
      const allUnits = [];
      for (const prop of propRes.data.properties || []) {
        if (prop.units) {
          allUnits.push(...prop.units.map(u => ({ ...u, property_name: prop.name })));
        }
      }
      setUnits(allUnits);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load units");
      toast.error("Failed to load units.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = units.filter(u => {
    const matchStatus = statusFilter === "All" || u.status === statusFilter;
    const matchProperty = propertyFilter === "All" || u.property_name === propertyFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || [String(u.unit_number), u.property_name, u.unit_type, u.tenant_name ?? ""].some(s => (s || "").toLowerCase().includes(q));
    return matchStatus && matchProperty && matchSearch;
  });

  function handleSave(saved) {
    setUnits(prev => {
      const exists = prev.find(u => u.id === saved.id);
      if (exists) return prev.map(u => u.id === saved.id ? { ...u, ...saved, property_name: properties.find(p => p.id === saved.property_id)?.name || u.property_name } : u);
      return [...prev, { ...saved, property_name: properties.find(p => p.id === saved.property_id)?.name || "" }];
    });
    setEditUnit(null);
    setShowAdd(false);
  }

  async function handleDelete(id) {
    const token = localStorage.getItem("token");
    await axios.delete(`${API}/units/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setUnits(prev => prev.filter(u => u.id !== id));
  }

  const propertyNames = ["All", ...new Set(units.map(u => u.property_name).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {(editUnit || showAdd) && (
        <UnitFormModal unit={editUnit ?? null} properties={properties} onClose={() => { setEditUnit(null); setShowAdd(false); }} onSave={handleSave} />
      )}
      {deleteUnit && <DeleteModal unit={deleteUnit} onClose={() => setDeleteUnit(null)} onConfirm={handleDelete} />}

      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2"><Home size={24} />Units</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{units.length} units across {properties.length} properties</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {VIEWS.map(v => (
                <button key={v} onClick={() => setView(v)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${view === v ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm" : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"}`}>
                  <span className="flex items-center gap-1.5">{v === "grid" ? <LayoutGrid size={14} /> : <List size={14} />}{v}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowAdd(true)} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"><Plus size={14} />Add Unit</button>
            <button onClick={fetchData} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 transition-colors" title="Refresh"><RefreshCw size={16} /></button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${statusFilter === s ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"}`}>
                  {s}{s !== "All" && <span className="ml-1.5 text-xs opacity-70">{units.filter(u => u.status === s).length}</span>}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
              <select value={propertyFilter} onChange={e => setProperty(e.target.value)} className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {propertyNames.map(p => <option key={p} value={p}>{p === "All" ? "All Properties" : p}</option>)}
              </select>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search unit, tenant..." value={search} onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56" />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-blue-500" /><span className="ml-3 text-gray-500 dark:text-gray-400">Loading units...</span></div>
        ) : error ? (
          <div className="py-16 text-center"><p className="text-red-500">{error}</p><button onClick={fetchData} className="text-blue-600 hover:underline mt-2">Try again</button></div>
        ) : (
          <>
            {view === "grid" && (
              filtered.length === 0 ? (
                <div className="py-16 text-center text-gray-400 dark:text-gray-500">No units match your filters.</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filtered.map(u => <UnitGridCard key={u.id} unit={u} onEdit={setEditUnit} onDelete={setDeleteUnit} onNavigateTenant={() => navigate("/landlord/tenants")} />)}
                </div>
              )
            )}
            {view === "list" && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                      <tr><th className="px-5 py-3">Unit</th><th className="px-5 py-3">Property</th><th className="px-5 py-3">Type</th><th className="px-5 py-3">Floor</th><th className="px-5 py-3">Rent</th><th className="px-5 py-3">Parking</th><th className="px-5 py-3">Tenant</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Actions</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filtered.length === 0 && <tr><td colSpan={9} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">No units match your filters.</td></tr>}
                      {filtered.map(u => (
                        <tr key={u.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                          <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">Unit {u.unit_number}</td>
                          <td className="px-5 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{u.property_name}</td>
                          <td className="px-5 py-4 whitespace-nowrap">{u.unit_type?.replace(/_/g, " ")}</td>
                          <td className="px-5 py-4 whitespace-nowrap">{u.floor_number || "—"}</td>
                          <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{format(u.monthly_rent)}</td>
                          <td className="px-5 py-4 whitespace-nowrap">{u.parking_bay ? <span className="text-green-500 font-medium flex items-center gap-1"><CheckCircle size={12} /> Yes</span> : <span className="text-gray-400">—</span>}</td>
                          <td className="px-5 py-4 whitespace-nowrap">{u.tenant_name ? (
                            <button onClick={() => navigate("/landlord/tenants")} className="flex items-center gap-2 hover:underline text-blue-600 dark:text-blue-400">
                              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">{initials(u.tenant_name)}</div>{u.tenant_name}
                            </button>
                          ) : <span className="text-gray-400 italic text-xs">No tenant</span>}</td>
                          <td className="px-5 py-4 whitespace-nowrap"><StatusBadge status={u.status} /></td>
                          <td className="px-5 py-4 whitespace-nowrap"><div className="flex items-center gap-3"><button onClick={() => setEditUnit(u)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">Edit</button><button onClick={() => setDeleteUnit(u)} className="text-xs font-medium text-red-500 dark:text-red-400 hover:underline">Remove</button></div></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-700">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Showing <span className="font-medium text-gray-900 dark:text-white">{filtered.length}</span> of <span className="font-medium text-gray-900 dark:text-white">{units.length}</span> units</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}