/* eslint-disable react-hooks/static-components */
// LANDLORD UNITS PAGE, SHOWS A LIST OF ALL UNITS WITH THEIR DETAILS, STATUS, AND TENANT INFORMATION
// AUTHOR: SIMAMKELE WEKEZA
// IF YOU HAVE ANY QUESTIONS ABOUT THIS CODE, ASK ME.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Home,
  Key,
  Wrench,
  Coins,
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
  User,
  AlertCircle,
} from "lucide-react";
import useDocumentTitle from "../../../hooks/useDocumentTitle";

// MOCK DATA 
const INITIAL_UNITS = [
  { id: 1,  unit: "Unit 1A", property: "Berea Flats",      type: "1 Bedroom",  rent: 7500, status: "Occupied", tenant: "Zanele Moyo",    tenantId: 8, floor: 1, parking: false, notes: "" },
  { id: 2,  unit: "Unit 1C", property: "Berea Flats",      type: "2 Bedroom",  rent: 7200, status: "Occupied", tenant: "Ahmed Patel",    tenantId: 3, floor: 1, parking: true,  notes: "" },
  { id: 3,  unit: "Unit 2B", property: "Hillbrow Heights", type: "1 Bedroom",  rent: 5800, status: "Occupied", tenant: "Lerato Mokoena", tenantId: 2, floor: 2, parking: false, notes: "" },
  { id: 4,  unit: "Unit 2A", property: "Yeoville Corner",  type: "2 Bedroom",  rent: 6800, status: "Occupied", tenant: "Priya Naidoo",   tenantId: 6, floor: 2, parking: true,  notes: "" },
  { id: 5,  unit: "Unit 3A", property: "Berea Flats",      type: "2 Bedroom",  rent: 6000, status: "Occupied", tenant: "Nomsa Khumalo",  tenantId: 4, floor: 3, parking: false, notes: "" },
  { id: 6,  unit: "Unit 3B", property: "Hillbrow Heights", type: "Studio",     rent: 4200, status: "Vacant",   tenant: null,             tenantId: null, floor: 3, parking: false, notes: "Freshly painted, available immediately" },
  { id: 7,  unit: "Unit 4A", property: "Hillbrow Heights", type: "2 Bedroom",  rent: 6500, status: "Occupied", tenant: "Sipho Dlamini",  tenantId: 1, floor: 4, parking: true,  notes: "" },
  { id: 8,  unit: "Unit 4C", property: "Berea Flats",      type: "1 Bedroom",  rent: 6800, status: "Vacant",   tenant: null,             tenantId: null, floor: 4, parking: false, notes: "Needs minor touch-up before move-in" },
  { id: 9,  unit: "Unit 5D", property: "Yeoville Corner",  type: "1 Bedroom",  rent: 5500, status: "Occupied", tenant: "Thabo Nkosi",    tenantId: 5, floor: 5, parking: false, notes: "" },
  { id: 10, unit: "Unit 6B", property: "Hillbrow Heights", type: "2 Bedroom",  rent: 5200, status: "Occupied", tenant: "Kabelo Sithole", tenantId: 7, floor: 6, parking: true,  notes: "" },
  { id: 11, unit: "Unit 7A", property: "Hillbrow Heights", type: "3 Bedroom",  rent: 9500, status: "Maintenance", tenant: null,          tenantId: null, floor: 7, parking: true,  notes: "Geyser replacement underway" },
  { id: 12, unit: "Unit 8C", property: "Berea Flats",      type: "Studio",     rent: 4000, status: "Vacant",   tenant: null,             tenantId: null, floor: 8, parking: false, notes: "" },
];

const PROPERTIES  = ["Hillbrow Heights", "Berea Flats", "Yeoville Corner"];
const UNIT_TYPES  = ["Studio", "1 Bedroom", "2 Bedroom", "3 Bedroom"];
const STATUSES    = ["All", "Occupied", "Vacant", "Maintenance"];
const VIEWS       = ["grid", "list"];

// CONFIG FOR STATUS BADGES AND COLORS 
const STATUS_CONFIG = {
  "Occupied":    { badge: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-100 dark:border-green-700",  dot: "bg-green-500", icon: CheckCircle },
  "Vacant":      { badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-100 dark:border-blue-700",        dot: "bg-blue-400",  icon: Key },
  "Maintenance": { badge: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-100 dark:border-orange-700", dot: "bg-orange-400", icon: Wrench },
};

// HELPER FUNCTIONS FOR FORMATTING AND CALCULATIONS 
function format(n) { return `R ${Number(n).toLocaleString("en-ZA")}`; }
function initials(name = "") {
  return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

// STATUS BADGE COMPONENT 
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? {};
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md ${cfg.badge}`}>
      {Icon && <Icon size={12} />}
      {status}
    </span>
  );
}

// UNIT FORM MODAL FOR ADDING AND EDITING UNITS 
const EMPTY_FORM = {
  unit: "", property: "", type: "1 Bedroom",
  rent: "", floor: "", parking: false,
  status: "Vacant", notes: "",
};

function UnitFormModal({ unit, onClose, onSave }) {
  const isEdit = !!unit;
  const [form, setForm] = useState(unit ? {
    unit: unit.unit, property: unit.property, type: unit.type,
    rent: String(unit.rent), floor: String(unit.floor),
    parking: unit.parking, status: unit.status, notes: unit.notes,
  } : EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.unit.trim())     e.unit     = "Required";
    if (!form.property.trim()) e.property = "Required";
    if (!form.type.trim())     e.type     = "Required";
    if (!form.rent.trim())     e.rent     = "Required";
    if (!form.floor.toString().trim()) e.floor = "Required";
    return e;
  }

  function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => {
      onSave({
        ...form,
        rent:    Number(form.rent),
        floor:   Number(form.floor),
        id:      unit?.id ?? Date.now(),
        tenant:  unit?.tenant ?? null,
        tenantId: unit?.tenantId ?? null,
      });
      setLoading(false);
      onClose();
    }, 900);
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
    `w-full text-sm rounded-lg px-3 py-2.5 border bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white
     placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500
     ${errors[key] ? "border-red-400 dark:border-red-600" : "border-gray-300 dark:border-gray-600"}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">
            {isEdit ? `Edit ${unit.unit}` : "Add New Unit"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded">
            <X size={20} />
          </button>
        </div>

        {/* FORM BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

          <div className="grid grid-cols-2 gap-4">
            <Field label="Unit Number" error={errors.unit}>
              <input className={cls("unit")} value={form.unit} onChange={e => set("unit", e.target.value)} placeholder="e.g. Unit 3B" />
            </Field>
            <Field label="Floor" error={errors.floor}>
              <input className={cls("floor")} value={form.floor} onChange={e => set("floor", e.target.value)} placeholder="e.g. 3" type="number" min="0" />
            </Field>
          </div>

          <Field label="Property" error={errors.property}>
            <select className={cls("property")} value={form.property} onChange={e => set("property", e.target.value)}>
              <option value="">Select property</option>
              {PROPERTIES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Unit Type" error={errors.type}>
              <select className={cls("type")} value={form.type} onChange={e => set("type", e.target.value)}>
                {UNIT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Monthly Rent (R)" error={errors.rent}>
              <input className={cls("rent")} value={form.rent} onChange={e => set("rent", e.target.value)} placeholder="e.g. 6500" type="number" min="0" />
            </Field>
          </div>

          <Field label="Status" error={errors.status}>
            <select className={cls("status")} value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="Vacant">Vacant</option>
              <option value="Occupied">Occupied</option>
              <option value="Maintenance">Under Maintenance</option>
            </select>
          </Field>

          {/* PARKING TOGGLE */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-2">
              <Car size={18} className="text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Parking Bay</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Does this unit include a parking bay?</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => set("parking", !form.parking)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                ${form.parking ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                ${form.parking ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>

          <Field label="Notes (optional)">
            <textarea
              className={cls("notes") + " resize-none"}
              rows={3}
              value={form.notes}
              onChange={e => set("notes", e.target.value)}
              placeholder="e.g. Freshly painted, available immediately..."
            />
          </Field>
        </div>

        {/* FOOTER */}
        <div className="px-6 pb-6 flex gap-3 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">
          <button onClick={onClose} disabled={loading} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : isEdit ? (
              <>
                <Edit size={14} />
                Save Changes
              </>
            ) : (
              <>
            
                Add Unit
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// DELETE CONFIRMATION MODAL 
function DeleteModal({ unit, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  function handle() {
    setLoading(true);
    setTimeout(() => { onConfirm(unit.id); setLoading(false); onClose(); }, 700);
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center flex-shrink-0">
            <Trash2 size={20} className="text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Remove Unit</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">This cannot be undone</p>
          </div>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-5">
          Are you sure you want to remove <span className="font-semibold text-gray-900 dark:text-white">{unit?.unit}</span> from {unit?.property}?
          {unit?.tenant && (
            <span className="text-red-500"> This unit is currently occupied by {unit.tenant}.</span>
          )}
        </p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
            Cancel
          </button>
          <button onClick={handle} disabled={loading} className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Removing...
              </>
            ) : (
              <>
                <Trash2 size={14} />
                Remove
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// GRID CARD COMPONENT
function UnitGridCard({ unit, onEdit, onDelete, onNavigateTenant }) {
  const cfg = STATUS_CONFIG[unit.status];
  const StatusIcon = cfg?.icon;
  
  return (
    <div className={`bg-white dark:bg-gray-800 border rounded-xl shadow-sm hover:shadow-md transition-all
      ${unit.status === "Vacant" ? "border-blue-200 dark:border-blue-800" :
        unit.status === "Maintenance" ? "border-orange-200 dark:border-orange-800" :
        "border-gray-200 dark:border-gray-700"}`}
    >
      {/* CARD HEADER */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-base font-bold text-gray-900 dark:text-white">{unit.unit}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{unit.property}</p>
          </div>
          <StatusBadge status={unit.status} />
        </div>
      </div>

      {/* CARD BODY */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Type</span>
          <span className="font-medium text-gray-900 dark:text-white">{unit.type}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Floor</span>
          <span className="font-medium text-gray-900 dark:text-white">{unit.floor}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Rent</span>
          <span className="font-semibold text-gray-900 dark:text-white">{format(unit.rent)}<span className="text-xs font-normal text-gray-400">/mo</span></span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Parking</span>
          <span className={unit.parking ? "text-green-500 font-medium flex items-center gap-1" : "text-gray-400"}>
            {unit.parking ? <><CheckCircle size={12} /> Yes</> : "—"}
          </span>
        </div>

        {/* TENANT CHIP */}
        {unit.tenant ? (
          <button
            onClick={() => onNavigateTenant(unit)}
            className="w-full flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold flex-shrink-0">
              {initials(unit.tenant)}
            </div>
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300 truncate">{unit.tenant}</span>
          </button>
        ) : (
          <div className={`w-full p-2 rounded-lg text-center text-xs font-medium flex items-center justify-center gap-1.5
            ${unit.status === "Maintenance"
              ? "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400"
              : "bg-gray-50 dark:bg-gray-700/50 text-gray-400 dark:text-gray-500"}`}>
            {unit.status === "Maintenance" ? (
              <><Wrench size={12} /> Under maintenance</>
            ) : (
              <><Key size={12} /> Available for tenancy</>
            )}
          </div>
        )}

        {/* NOTES */}
        {unit.notes && (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic truncate flex items-center gap-1" title={unit.notes}>
            <AlertCircle size={12} />
            {unit.notes}
          </p>
        )}
      </div>

      {/* CARD FOOTER */}
      <div className="px-4 pb-4 flex gap-2">
        <button
          onClick={() => onEdit(unit)}
          className="flex-1 text-xs font-medium py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors flex items-center justify-center gap-1"
        >
          <Edit size={12} />
          Edit
        </button>
        <button
          onClick={() => onDelete(unit)}
          className="text-xs font-medium py-2 px-3 rounded-lg bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors flex items-center justify-center gap-1"
        >
          <Trash2 size={12} />
          Remove
        </button>
      </div>
    </div>
  );
}

// MAIN UNITS PAGE COMPONENT
export default function Units() {
  useDocumentTitle("Units");
  const navigate = useNavigate();

  const [units, setUnits] = useState(INITIAL_UNITS);
  const [statusFilter, setStatus] = useState("All");
  const [propertyFilter, setProperty] = useState("All");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("grid");
  const [editUnit, setEditUnit] = useState(null);
  const [deleteUnit, setDeleteUnit] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  // DERIVED DATA 
  const filtered = units.filter(u => {
    const matchStatus = statusFilter === "All" || u.status === statusFilter;
    const matchProperty = propertyFilter === "All" || u.property === propertyFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || [u.unit, u.property, u.type, u.tenant ?? ""]
      .some(s => s.toLowerCase().includes(q));
    return matchStatus && matchProperty && matchSearch;
  });


  // HANDLERS FOR ADDING/EDITING/DELETING UNITS
  function handleSave(data) {
    setUnits(prev => {
      const exists = prev.find(u => u.id === data.id);
      return exists ? prev.map(u => u.id === data.id ? data : u) : [...prev, data];
    });
  }

  function handleDelete(id) {
    setUnits(prev => prev.filter(u => u.id !== id));
  }

  const properties = ["All", ...PROPERTIES];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">

      {/* MODALS */}
      {(editUnit || showAdd) && (
        <UnitFormModal
          unit={editUnit ?? null}
          onClose={() => { setEditUnit(null); setShowAdd(false); }}
          onSave={handleSave}
        />
      )}
      {deleteUnit && (
        <DeleteModal
          unit={deleteUnit}
          onClose={() => setDeleteUnit(null)}
          onConfirm={handleDelete}
        />
      )}

      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-12">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Home size={24} />
              Units
            </h1> 
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {units.length} units across {PROPERTIES.length} properties
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* VIEW TOGGLE */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {VIEWS.map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors capitalize
                    ${view === v
                      ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"}`}
                >
                  <span className="flex items-center gap-1.5">
                    {v === "grid" ? <LayoutGrid size={14} /> : <List size={14} />}
                    {v}
                  </span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              
              Add Unit
            </button>
          </div>
        </div>

        
        {/* TOOLBAR */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm mb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">

            {/* STATUS FILTER */}
            <div className="flex flex-wrap gap-2">
              {STATUSES.map(s => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors ${
                    statusFilter === s
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  }`}
                >
                  {s}
                  {s !== "All" && (
                    <span className="ml-1.5 text-xs opacity-70">
                      {units.filter(u => u.status === s).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:ml-auto flex-wrap">
              {/* PROPERTY FILTER */}
              <select
                value={propertyFilter}
                onChange={e => setProperty(e.target.value)}
                className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {properties.map(p => (
                  <option key={p} value={p}>{p === "All" ? "All Properties" : p}</option>
                ))}
              </select>

              {/* SEARCH */}
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search unit, tenant..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
                />
              </div>
            </div>
          </div>
        </div>

        {/* GRID VIEW */}
        {view === "grid" && (
          <>
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400 dark:text-gray-500">No units match your filters.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filtered.map(u => (
                  <UnitGridCard
                    key={u.id}
                    unit={u}
                    onEdit={setEditUnit}
                    onDelete={setDeleteUnit}
                    onNavigateTenant={() => navigate("/landlord/tenants")}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* LIST VIEW */}
        {view === "list" && (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-5 py-3">Unit</th>
                    <th className="px-5 py-3">Property</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Floor</th>
                    <th className="px-5 py-3">Rent</th>
                    <th className="px-5 py-3">Parking</th>
                    <th className="px-5 py-3">Tenant</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-5 py-12 text-center text-gray-400 dark:text-gray-500">
                        No units match your filters.
                      </td>
                    </tr>
                  )}
                  {filtered.map(u => (
                    <tr key={u.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{u.unit}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">{u.property}</td>
                      <td className="px-5 py-4 whitespace-nowrap">{u.type}</td>
                      <td className="px-5 py-4 whitespace-nowrap">{u.floor}</td>
                      <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">{format(u.rent)}</td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {u.parking ? <span className="text-green-500 font-medium flex items-center gap-1"><CheckCircle size={12} /> Yes</span> : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {u.tenant ? (
                          <button
                            onClick={() => navigate("/landlord/tenants")}
                            className="flex items-center gap-2 hover:underline text-blue-600 dark:text-blue-400"
                          >
                            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                              {initials(u.tenant)}
                            </div>
                            {u.tenant}
                          </button>
                        ) : (
                          <span className="text-gray-400 italic text-xs">No tenant</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap"><StatusBadge status={u.status} /></td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <button onClick={() => setEditUnit(u)} className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">Edit</button>
                          <button onClick={() => setDeleteUnit(u)} className="text-xs font-medium text-red-500 dark:text-red-400 hover:underline">Remove</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-medium text-gray-900 dark:text-white">{filtered.length}</span> of <span className="font-medium text-gray-900 dark:text-white">{units.length}</span> units
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}