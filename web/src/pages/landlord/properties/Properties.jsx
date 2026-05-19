/* eslint-disable no-unused-vars */
// LANDLORD PROPERTIES PAGE 

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Building2, Plus, Search, MoreVertical, Edit, Trash2,
  X, Loader2, ChevronRight, MapPin, Users,
  CheckCircle, AlertTriangle,
  Grid3x3, List, Eye, ArrowLeft,
} from "lucide-react";
import { useToast } from "../../../contexts/ToastContext";

const API = "http://localhost:4000";

const PROPERTY_TYPES = ["residential", "commercial", "mixed_use"];
const UNIT_TYPES = ["studio", "1_bedroom", "2_bedroom", "3_bedroom", "4_bedroom", "penthouse"];
const UNIT_STATUSES = ["occupied", "vacant", "maintenance", "reserved"];

function fmt(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }

function unitTypeLabel(t) {
  const m = { studio: "Studio", "1_bedroom": "1 Bed", "2_bedroom": "2 Bed", "3_bedroom": "3 Bed", "4_bedroom": "4 Bed", penthouse: "Penthouse" };
  return m[t] ?? t;
}

const UNIT_STATUS = {
  occupied:    { label: "Occupied",    color: "text-green-600 dark:text-green-400",  bg: "bg-green-100 dark:bg-green-900/30",  border: "border-green-200 dark:border-green-800",  dot: "bg-green-500" },
  vacant:      { label: "Vacant",      color: "text-blue-600 dark:text-blue-400",   bg: "bg-blue-100 dark:bg-blue-900/30",    border: "border-blue-200 dark:border-blue-800",    dot: "bg-blue-500"  },
  maintenance: { label: "Maintenance", color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-100 dark:bg-yellow-900/30", border: "border-yellow-200 dark:border-yellow-800", dot: "bg-yellow-400" },
  reserved:    { label: "Reserved",    color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-100 dark:bg-purple-900/30", border: "border-purple-200 dark:border-purple-800", dot: "bg-purple-500" },
};

function inputCls(error) {
  return [
    "w-full text-sm rounded-lg px-3.5 py-2.5 border transition-all",
    "bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500",
    "focus:outline-none focus:ring-2 focus:ring-blue-500",
    error ? "border-red-300 dark:border-red-700 focus:ring-red-500" : "border-gray-300 dark:border-gray-600",
  ].join(" ");
}

function Field({ label, error, children, optional }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2">
        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</label>
        {!optional && <span className="text-red-500">*</span>}
        {optional && <span className="text-xs text-gray-400 dark:text-gray-500">(optional)</span>}
        {error && <span className="text-xs text-red-500 ml-auto">— {error}</span>}
      </div>
      {children}
    </div>
  );
}

function OccupancyRing({ total, occupied, size = 52 }) {
  const pct = total > 0 ? occupied / total : 0;
  const r = 20;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = pct >= 0.9 ? "#22C55E" : pct >= 0.6 ? "#F59E0B" : "#3B82F6";

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" className="rotate-[-90deg]">
      <circle cx="24" cy="24" r={r} fill="none" stroke="#E5E7EB" strokeWidth="4" className="dark:stroke-gray-600" />
      <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s ease" }} />
    </svg>
  );
}

function UnitCell({ unit }) {
  const cfg = UNIT_STATUS[unit.status] ?? UNIT_STATUS.vacant;
  return (
    <div className={`relative rounded-xl border p-3 flex flex-col gap-1.5 ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-900 dark:text-white">Unit {unit.unit_number}</span>
        <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">{unitTypeLabel(unit.unit_type)}</span>
      <span className="text-sm font-semibold text-gray-900 dark:text-white">{fmt(unit.monthly_rent)}</span>
      {unit.tenant_name && <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{unit.tenant_name}</span>}
    </div>
  );
}

function PropertyCard({ property, onView, onEdit, onDelete }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const units = property.units || [];
  const occupied = units.filter(u => u.status === "occupied").length;
  const vacant = units.filter(u => u.status === "vacant").length;
  const maintenance = units.filter(u => u.status === "maintenance").length;
  const occupiedRent = units.filter(u => u.status === "occupied").reduce((s, u) => s + (Number(u.monthly_rent) || 0), 0);

  return (
    <div className="group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 shadow-sm">
      <div className="h-1 w-full bg-gradient-to-r from-blue-500 to-blue-300" />
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="relative flex-shrink-0">
            <OccupancyRing total={units.length} occupied={occupied} />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs font-bold text-gray-900 dark:text-white leading-none">{occupied}</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">/{units.length}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">{property.name}</h3>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={10} className="text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{property.address_line1}, {property.city}</span>
            </div>
            {property.caretaker_name && (
              <div className="flex items-center gap-1 mt-1">
                <Users size={10} className="text-gray-400 flex-shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400">{property.caretaker_name}</span>
              </div>
            )}
          </div>
          <div className="relative">
            <button onClick={() => setMenuOpen(o => !o)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <MoreVertical size={15} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-7 z-20 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden"
                onMouseLeave={() => setMenuOpen(false)}>
                {[
                  { icon: Eye, label: "View Units", action: () => { setMenuOpen(false); onView(property); }, cls: "text-gray-700 dark:text-gray-300" },
                  { icon: Edit, label: "Edit Property", action: () => { setMenuOpen(false); onEdit(property); }, cls: "text-gray-700 dark:text-gray-300" },
                  { icon: Trash2, label: "Delete", action: () => { setMenuOpen(false); onDelete(property); }, cls: "text-red-600" },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${item.cls}`}>
                    <item.icon size={13} />{item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          {[
            { label: `${occupied} Occupied`, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/20", border: "border-green-100 dark:border-green-800" },
            { label: `${vacant} Vacant`, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-100 dark:border-blue-800" },
            ...(maintenance > 0 ? [{ label: `${maintenance} Maintenance`, color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-50 dark:bg-yellow-900/20", border: "border-yellow-100 dark:border-yellow-800" }] : []),
          ].map(b => (
            <span key={b.label} className={`flex-1 text-center text-[10px] font-bold py-1.5 rounded-lg border ${b.color} ${b.bg} ${b.border}`}>
              {b.label}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Monthly Income</p>
            <p className="text-base font-bold text-gray-900 dark:text-white mt-0.5">{fmt(occupiedRent)}</p>
          </div>
          <button onClick={() => onView(property)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
            View Units <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function PropertyFormModal({ property, onClose, onSave }) {
  const toast = useToast();
  const isEdit = !!property;
  const [form, setForm] = useState({
    name: property?.name ?? "", property_type: property?.property_type ?? "residential",
    address_line1: property?.address_line1 ?? "", address_line2: property?.address_line2 ?? "",
    city: property?.city ?? "", province: property?.province ?? "",
    postal_code: property?.postal_code ?? "", country: property?.country ?? "South Africa",
    total_floors: property?.total_floors ?? "", total_units: property?.total_units ?? "",
    has_elevator: property?.has_elevator ?? false, has_parking: property?.has_parking ?? false,
    has_security: property?.has_security ?? false, has_pool: property?.has_pool ?? false,
    pet_friendly: property?.pet_friendly ?? false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: undefined })); }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!form.address_line1.trim()) e.address_line1 = "Required";
    if (!form.city.trim()) e.city = "Required";
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { 
      setErrors(e); 
      toast.warning("Please fill in all required fields.");
      return; 
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...form,
        total_floors: form.total_floors ? Number(form.total_floors) : null,
        total_units: form.total_units ? Number(form.total_units) : null,
      };
      const { data } = isEdit
        ? await axios.put(`${API}/properties/${property.id}`, payload, { headers: { Authorization: `Bearer ${token}` } })
        : await axios.post(`${API}/properties`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(isEdit ? "Property updated successfully!" : "Property added successfully!");
      onSave(data.property ?? data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save property.");
    } finally {
      setLoading(false);
    }
  }

  const AMENITIES = [
    { key: "has_elevator", label: "Elevator" }, { key: "has_parking", label: "Parking" },
    { key: "has_security", label: "Security" }, { key: "has_pool", label: "Pool" },
    { key: "pet_friendly", label: "Pet-friendly" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col shadow-xl max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{isEdit ? "Edit Property" : "Add Property"}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{isEdit ? "Update property details" : "Register a new property"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <Field label="Property Name" error={errors.name}><input className={inputCls(errors.name)} value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Hillbrow Heights" /></Field>
          <Field label="Property Type"><select className={inputCls(false)} value={form.property_type} onChange={e => set("property_type", e.target.value)}>{PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ")}</option>)}</select></Field>
          <Field label="Street Address" error={errors.address_line1}><input className={inputCls(errors.address_line1)} value={form.address_line1} onChange={e => set("address_line1", e.target.value)} placeholder="45 Claim Street" /></Field>
          <Field label="Address Line 2" optional><input className={inputCls(false)} value={form.address_line2} onChange={e => set("address_line2", e.target.value)} placeholder="Complex, building name…" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" error={errors.city}><input className={inputCls(errors.city)} value={form.city} onChange={e => set("city", e.target.value)} placeholder="Johannesburg" /></Field>
            <Field label="Province" optional><input className={inputCls(false)} value={form.province} onChange={e => set("province", e.target.value)} placeholder="Gauteng" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Postal Code" optional><input className={inputCls(false)} value={form.postal_code} onChange={e => set("postal_code", e.target.value)} placeholder="2001" /></Field>
            <Field label="Total Floors" optional><input type="number" min="1" className={inputCls(false)} value={form.total_floors} onChange={e => set("total_floors", e.target.value)} placeholder="e.g. 4" /></Field>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {AMENITIES.map(a => {
                const on = form[a.key];
                return (
                  <button key={a.key} type="button" onClick={() => set(a.key, !on)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${on ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400" : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600"}`}>
                    {on ? "✓ " : ""}{a.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50">
            {loading ? <><Loader2 size={15} className="animate-spin" />Saving…</> : <>{isEdit ? "Save Changes" : "Add Property"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function UnitFormModal({ unit, propertyId, onClose, onSave }) {
  const toast = useToast();
  const isEdit = !!unit;
  const [form, setForm] = useState({
    unit_number: unit?.unit_number ?? "", unit_type: unit?.unit_type ?? "1_bedroom",
    floor_number: unit?.floor_number ?? "", bedrooms: unit?.bedrooms ?? "",
    bathrooms: unit?.bathrooms ?? "", square_meters: unit?.square_meters ?? "",
    monthly_rent: unit?.monthly_rent ?? "", deposit_amount: unit?.deposit_amount ?? "",
    status: unit?.status ?? "vacant", furnished: unit?.furnished ?? false,
    parking_bay: unit?.parking_bay ?? false, has_balcony: unit?.has_balcony ?? false,
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: undefined })); }

  function validate() {
    const e = {};
    if (!form.unit_number.trim()) e.unit_number = "Required";
    if (!form.monthly_rent) e.monthly_rent = "Required";
    return e;
  }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { 
      setErrors(e); 
      toast.warning("Please fill in all required fields.");
      return; 
    }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        ...form,
        floor_number: form.floor_number ? Number(form.floor_number) : null,
        bedrooms: form.bedrooms ? Number(form.bedrooms) : null,
        bathrooms: form.bathrooms ? Number(form.bathrooms) : null,
        square_meters: form.square_meters ? Number(form.square_meters) : null,
        monthly_rent: Number(form.monthly_rent),
        deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : null,
      };
      const { data } = isEdit
        ? await axios.put(`${API}/units/${unit.id}`, payload, { headers: { Authorization: `Bearer ${token}` } })
        : await axios.post(`${API}/properties/${propertyId}/units`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(isEdit ? "Unit updated successfully!" : "Unit added successfully!");
      onSave(data.unit ?? data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save unit.");
      onSave({ ...form, id: unit?.id ?? Date.now().toString(), monthly_rent: Number(form.monthly_rent) });
    } finally {
      setLoading(false);
    }
  }

  const EXTRAS = [
    { key: "furnished", label: "Furnished" }, { key: "parking_bay", label: "Parking Bay" }, { key: "has_balcony", label: "Balcony" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col shadow-xl max-h-[92vh]">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">{isEdit ? "Edit Unit" : "Add Unit"}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{isEdit ? `Editing Unit ${unit.unit_number}` : "Add a new unit"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"><X size={18} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit Number" error={errors.unit_number}><input className={inputCls(errors.unit_number)} value={form.unit_number} onChange={e => set("unit_number", e.target.value)} placeholder="e.g. 101" /></Field>
            <Field label="Floor" optional><input type="number" min="0" className={inputCls(false)} value={form.floor_number} onChange={e => set("floor_number", e.target.value)} placeholder="e.g. 1" /></Field>
          </div>
          <Field label="Unit Type"><select className={inputCls(false)} value={form.unit_type} onChange={e => set("unit_type", e.target.value)}>{UNIT_TYPES.map(t => <option key={t} value={t}>{unitTypeLabel(t)}</option>)}</select></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Bedrooms" optional><input type="number" min="0" className={inputCls(false)} value={form.bedrooms} onChange={e => set("bedrooms", e.target.value)} placeholder="e.g. 2" /></Field>
            <Field label="Bathrooms" optional><input type="number" min="0" className={inputCls(false)} value={form.bathrooms} onChange={e => set("bathrooms", e.target.value)} placeholder="e.g. 1" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Monthly Rent (R)" error={errors.monthly_rent}><input type="number" min="0" className={inputCls(errors.monthly_rent)} value={form.monthly_rent} onChange={e => set("monthly_rent", e.target.value)} placeholder="e.g. 5800" /></Field>
            <Field label="Deposit (R)" optional><input type="number" min="0" className={inputCls(false)} value={form.deposit_amount} onChange={e => set("deposit_amount", e.target.value)} placeholder="e.g. 5800" /></Field>
          </div>
          <Field label="Status"><select className={inputCls(false)} value={form.status} onChange={e => set("status", e.target.value)}>{UNIT_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></Field>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Features</p>
            <div className="flex gap-2">
              {EXTRAS.map(a => {
                const on = form[a.key];
                return (
                  <button key={a.key} type="button" onClick={() => set(a.key, !on)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${on ? "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400" : "bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600"}`}>
                    {on ? "✓ " : ""}{a.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button onClick={onClose} disabled={loading} className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-40">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="flex-[2] flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50">
            {loading ? <><Loader2 size={15} className="animate-spin" />Saving…</> : <>{isEdit ? "Save Changes" : "Add Unit"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ title, sub, onClose, onConfirm }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  
  function go() { 
    setLoading(true); 
    onConfirm(); 
    setLoading(false);
    toast.success(`${title} completed.`);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <Trash2 size={18} className="text-red-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{sub}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg text-sm font-medium border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
          <button onClick={go} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50">
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function UnitsView({ property, onBack, onAddUnit, onEditUnit, onDeleteUnit }) {
  const [unitView, setUnitView] = useState("grid");
  const [filter, setFilter] = useState("all");
  const units = property.units || [];
  const occupied = units.filter(u => u.status === "occupied").length;
  const vacant = units.filter(u => u.status === "vacant").length;
  const maintenance = units.filter(u => u.status === "maintenance").length;
  const totalRent = units.filter(u => u.status === "occupied").reduce((s, u) => s + (Number(u.monthly_rent) || 0), 0);
  const filtered = units.filter(u => filter === "all" || u.status === filter);

  const FILTERS = [
    { id: "all", label: "All Units" }, { id: "vacant", label: "Vacant" },
    { id: "occupied", label: "Occupied" }, { id: "maintenance", label: "Maintenance" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
          <ArrowLeft size={16} />Properties
        </button>
        <span className="text-gray-300 dark:text-gray-600">/</span>
        <span className="text-sm font-semibold text-gray-900 dark:text-white">{property.name}</span>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{property.name}</h2>
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={12} className="text-gray-400" />
              <span className="text-xs text-gray-500 dark:text-gray-400">{property.address_line1}, {property.city}</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: "Units", value: units.length },
              { label: "Occupied", value: occupied },
              { label: "Vacant", value: vacant },
              { label: "Monthly", value: fmt(totalRent) },
            ].map(s => (
              <div key={s.label} className="text-center">
                <p className="text-base font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">{s.label}</p>
              </div>
            ))}
            <button onClick={onAddUnit} className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors">
              Add Unit
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-2">
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${filter === f.id ? "bg-blue-600 text-white border-blue-600" : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {[{ id: "grid", Icon: Grid3x3 }, { id: "list", Icon: List }].map(({ id, Icon }) => (
            <button key={id} onClick={() => setUnitView(id)}
              className={`p-2 rounded-lg transition-colors ${unitView === id ? "bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {unitView === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map(unit => (
            <div key={unit.id} className="group relative">
              <UnitCell unit={unit} />
              <div className="absolute inset-0 rounded-xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button onClick={() => onEditUnit(unit)} className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"><Edit size={12} /></button>
                <button onClick={() => onDeleteUnit(unit)} className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {unitView === "list" && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
              <tr>{["Unit","Type","Floor","Rent","Status","Tenant",""].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filtered.map(unit => {
                const cfg = UNIT_STATUS[unit.status] ?? UNIT_STATUS.vacant;
                return (
                  <tr key={unit.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group">
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">#{unit.unit_number}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{unitTypeLabel(unit.unit_type)}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{unit.floor_number ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{fmt(unit.monthly_rent)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{unit.tenant_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEditUnit(unit)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-400 hover:text-blue-600"><Edit size={13} /></button>
                        <button onClick={() => onDeleteUnit(unit)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">No units match this filter</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  const toast = useToast();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [viewProperty, setViewProperty] = useState(null);
  const [editProperty, setEditProperty] = useState(null);
  const [showAddProp, setShowAddProp] = useState(false);
  const [deleteProp, setDeleteProp] = useState(null);
  const [editUnit, setEditUnit] = useState(null);
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [deleteUnit, setDeleteUnit] = useState(null);

  const fetchProperties = useCallback(async () => {
    setLoading(true); 
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/properties`, { headers: { Authorization: `Bearer ${token}` } });
      setProperties(data.properties || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load properties");
      toast.error("Failed to load properties. Please try again.");
    } finally { 
      setLoading(false); 
    }
  }, [toast]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const filtered = properties.filter(p =>
    !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.city?.toLowerCase().includes(search.toLowerCase()) || p.address_line1?.toLowerCase().includes(search.toLowerCase())
  );

  function handleSaveProperty(saved) {
    setProperties(prev => {
      const exists = prev.find(p => p.id === saved.id);
      if (exists) return prev.map(p => p.id === saved.id ? { ...p, ...saved } : p);
      return [...prev, saved];
    });
    setEditProperty(null); 
    setShowAddProp(false);
  }

  async function handleDeleteProperty(id) {
    try { 
      const token = localStorage.getItem("token"); 
      await axios.delete(`${API}/properties/${id}`, { headers: { Authorization: `Bearer ${token}` } }); 
      toast.success("Property deleted successfully!");
    } catch { 
      toast.error("Failed to delete property. It may have active units.");
    }
    setProperties(prev => prev.filter(p => p.id !== id));
    if (viewProperty?.id === id) setViewProperty(null);
    setDeleteProp(null);
  }

  function handleSaveUnit(saved) {
    setProperties(prev => prev.map(p => {
      if (p.id !== viewProperty.id) return p;
      const exists = (p.units || []).find(u => u.id === saved.id);
      const units = exists ? (p.units || []).map(u => u.id === saved.id ? { ...u, ...saved } : u) : [...(p.units || []), saved];
      return { ...p, units };
    }));
    setViewProperty(prev => prev ? { ...prev, units: prev.units ? prev.units.map(u => u.id === saved.id ? { ...u, ...saved } : u) : [saved] } : prev);
    setEditUnit(null); 
    setShowAddUnit(false);
  }

  async function handleDeleteUnit(unitId) {
    try { 
      const token = localStorage.getItem("token"); 
      await axios.delete(`${API}/units/${unitId}`, { headers: { Authorization: `Bearer ${token}` } }); 
      toast.success("Unit deleted successfully!");
    } catch { 
      toast.error("Failed to delete unit. It may have an active lease.");
    }
    setProperties(prev => prev.map(p => p.id !== viewProperty.id ? p : { ...p, units: (p.units || []).filter(u => u.id !== unitId) }));
    setViewProperty(prev => prev ? { ...prev, units: (prev.units || []).filter(u => u.id !== unitId) } : prev);
    setDeleteUnit(null);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {(showAddProp || editProperty) && <PropertyFormModal property={editProperty} onClose={() => { setShowAddProp(false); setEditProperty(null); }} onSave={handleSaveProperty} />}
      {deleteProp && <DeleteModal title="Delete Property" sub={`Remove ${deleteProp.name}? This cannot be undone.`} onClose={() => setDeleteProp(null)} onConfirm={() => handleDeleteProperty(deleteProp.id)} />}
      {(showAddUnit || editUnit) && viewProperty && <UnitFormModal unit={editUnit} propertyId={viewProperty.id} onClose={() => { setShowAddUnit(false); setEditUnit(null); }} onSave={handleSaveUnit} />}
      {deleteUnit && <DeleteModal title="Delete Unit" sub={`Remove Unit ${deleteUnit.unit_number}?`} onClose={() => setDeleteUnit(null)} onConfirm={() => handleDeleteUnit(deleteUnit.id)} />}

      <div className="max-w-screen-xl mx-auto px-4 pt-6 pb-12">
        {viewProperty ? (
          <UnitsView property={viewProperty} onBack={() => setViewProperty(null)}
            onAddUnit={() => setShowAddUnit(true)} onEditUnit={unit => setEditUnit(unit)} onDeleteUnit={unit => setDeleteUnit(unit)} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-6 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Properties</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{properties.length} propert{properties.length !== 1 ? "ies" : "y"} · {properties.reduce((s, p) => s + (p.units || []).length, 0)} units in total</p>
              </div>
              <button onClick={() => setShowAddProp(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors">
                Add Property
              </button>
            </div>

            <div className="relative mb-6">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search properties..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-blue-500" /><span className="ml-3 text-gray-500 dark:text-gray-400">Loading properties...</span></div>
            ) : error ? (
              <div className="flex flex-col items-center py-20 gap-4">
                <AlertTriangle size={32} className="text-red-400" />
                <p className="text-sm text-red-500">{error}</p>
                <button onClick={fetchProperties} className="text-sm text-blue-600 hover:underline">Try again</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center"><Building2 size={28} className="text-gray-400" /></div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{search ? "No properties match" : "No properties yet"}</p>
                {!search && <button onClick={() => setShowAddProp(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold"><Plus size={14} />Add your first property</button>}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map(property => (
                  <PropertyCard key={property.id} property={property}
                    onView={p => setViewProperty(p)} onEdit={p => setEditProperty(p)} onDelete={p => setDeleteProp(p)} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}