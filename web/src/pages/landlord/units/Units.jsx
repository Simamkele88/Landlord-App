/* eslint-disable no-unused-vars */
// LANDLORD UNITS PAGE
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";


const API = "http://localhost:4000";
const STATUSES = ["All", "Occupied", "Vacant", "Maintenance"];
const VIEWS = ["grid"];

const STATUS_MAP = {
  "All": "All",
  "Occupied": "occupied",
  "Vacant": "vacant",
  "Maintenance": "maintenance",
};

const statusConfig = {
  "occupied":    { color: C.greenLight, bg: 'rgba(26,122,74,0.1)', border: '1px solid rgba(76,186,122,0.2)', dot: C.greenLight, icon: 'check', label: "Occupied" },
  "vacant":      { color: C.blue,       bg: 'rgba(58,143,212,0.1)',  border: '1px solid rgba(58,143,212,0.2)',  dot: C.blue,       icon: 'home', label: "Vacant" },
  "maintenance": { color: C.gold,       bg: 'rgba(232,160,18,0.08)', border: '1px solid rgba(232,160,18,0.2)',  dot: C.gold,       icon: 'wrench', label: "Maintenance" },
  "reserved":    { color: C.purple,     bg: 'rgba(139,92,246,0.1)',  border: '1px solid rgba(139,92,246,0.2)',  dot: C.purple,     icon: 'lock', label: "Reserved" },
};


function format(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function initials(name = "") { return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(); }

const inputStyle = (error) => ({
  width: '100%', fontSize: '0.82rem', padding: '0.6rem 0.9rem', borderRadius: '3px',
  background: C.black, border: `1px solid ${error ? 'rgba(224,90,74,0.5)' : C.border}`,
  color: C.white, fontFamily: F.dm, outline: 'none',
});

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
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden',
};

const pillStyle = (cfg) => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  fontSize: '0.6rem', fontWeight: 700, padding: '0.15rem 0.5rem',
  borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
  textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: cfg.border,
});

function StatusBadge({ status }) {
  const cfg = statusConfig[status] ?? statusConfig["vacant"];
  return (
    <span style={pillStyle(cfg)}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function Field({ label, error, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}{error && <span style={{ color: C.redLight, fontWeight: 400, textTransform: 'none' }}> — {error}</span>}
      </label>
      {children}
    </div>
  );
}

const selectStyle = (error) => ({
  width: '100%',
  fontSize: '0.82rem',
  padding: '0.6rem 0.9rem',
  borderRadius: '3px',
  background: C.black,
  border: `1px solid ${error ? 'rgba(224,90,74,0.5)' : C.border}`,
  color: C.white,
  fontFamily: F.dm,
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  cursor: 'pointer',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='rgba(245,240,232,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.75rem center',
  paddingRight: '2.5rem',
});

const toolbarSelectStyle = {
  padding: '0.4rem 0.8rem',
  paddingRight: '2rem',
  borderRadius: '3px',
  fontSize: '0.72rem',
  fontWeight: 600,
  fontFamily: F.dm,
  letterSpacing: '0.02em',
  border: `1px solid ${C.border}`,
  background: 'transparent',
  color: 'rgba(245,240,232,0.5)',
  cursor: 'pointer',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(245,240,232,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.5rem center',
  transition: 'all 0.15s',
};

function UnitFormModal({ unit, properties, onClose, onSave }) {
  const toast = useToast();
  const isEdit = !!unit;
  const [form, setForm] = useState({
    unit_number: unit?.unit_number ?? "", property_id: unit?.property_id ?? "",
    unit_type: unit?.unit_type ?? "1_bedroom", monthly_rent: unit?.monthly_rent ?? "",
    floor_number: unit?.floor_number ?? "", parking_bay: unit?.parking_bay ?? false,
    status: unit?.status ?? "vacant", notes: unit?.notes ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: undefined })); }
  function validate() { const e = {}; if (!form.unit_number) e.unit_number = "Required"; if (!form.property_id) e.property_id = "Required"; if (!form.monthly_rent) e.monthly_rent = "Required"; return e; }

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
    } catch (err) { toast.error(err.response?.data?.error || "Failed to save unit."); }
    finally { setLoading(false); }
  }

  const UNIT_TYPES = ["studio", "1_bedroom", "2_bedroom", "3_bedroom", "4_bedroom", "penthouse"];
  const typeLabel = (t) => ({ studio: "Studio", "1_bedroom": "1 Bed", "2_bedroom": "2 Bed", "3_bedroom": "3 Bed", "4_bedroom": "4 Bed", penthouse: "Penthouse" })[t] ?? t;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 440, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', display: 'flex', flexDirection: 'column', maxHeight: '90vh', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>{isEdit ? `Edit Unit ${unit.unit_number}` : "Add New Unit"}</h3>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field label="Unit Number" error={errors.unit_number}><input style={inputStyle(errors.unit_number)} value={form.unit_number} onChange={e => set("unit_number", e.target.value)} type="number" /></Field>
            <Field label="Floor" error={errors.floor_number}><input style={inputStyle(errors.floor_number)} value={form.floor_number} onChange={e => set("floor_number", e.target.value)} type="number" min="0" /></Field>
          </div>
          <Field label="Property" error={errors.property_id}>
            <select style={inputStyle(errors.property_id)} value={form.property_id} onChange={e => set("property_id", e.target.value)}>
              <option value="">Select property</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field label="Unit Type">
              <select style={inputStyle(false)} value={form.unit_type} onChange={e => set("unit_type", e.target.value)}>
                {UNIT_TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
              </select>
            </Field>
            <Field label="Monthly Rent (R)" error={errors.monthly_rent}><input style={inputStyle(errors.monthly_rent)} value={form.monthly_rent} onChange={e => set("monthly_rent", e.target.value)} type="number" min="0" /></Field>
          </div>
          <Field label="Status">
            <select style={inputStyle(false)} value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="vacant">Vacant</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="reserved">Reserved</option>
            </select>
          </Field>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 0.9rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Icon name="car" size={16} color="rgba(245,240,232,0.4)" />
              <div>
                <p style={{ fontSize: '0.78rem', fontWeight: 500, color: C.white }}>Parking Bay</p>
                <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>Does this unit include a parking bay?</p>
              </div>
            </div>
            <button type="button" onClick={() => set("parking_bay", !form.parking_bay)}
              style={{ width: 44, height: 24, borderRadius: '12px', background: form.parking_bay ? C.gold : C.border, border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
              <span style={{ position: 'absolute', top: 2, left: form.parking_bay ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: C.white, transition: 'left 0.2s' }} />
            </button>
          </div>
          <Field label="Notes (optional)">
            <textarea style={{ ...inputStyle(false), resize: 'vertical', minHeight: 70 }} rows={3} value={form.notes} onChange={e => set("notes", e.target.value)} />
          </Field>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: C.black, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : (isEdit ? "Save Changes" : "Add Unit")}
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
    try { await onConfirm(unit.id); toast.success(`Unit ${unit.unit_number} removed.`); onClose(); }
    catch { toast.error("Failed to delete unit."); }
    finally { setLoading(false); }
  }
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 380, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(224,90,74,0.1)', border: '1px solid rgba(224,90,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="trash" size={18} color={C.redLight} />
          </div>
          <div><h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: C.white }}>Remove Unit</h3><p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>This cannot be undone</p></div>
        </div>
        <p style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.5)', marginBottom: '1.2rem', lineHeight: 1.5 }}>
          Are you sure you want to remove <span style={{ fontWeight: 600, color: C.white }}>Unit {unit?.unit_number}</span>?
          {unit?.tenant_name && <span style={{ color: C.redLight }}> This unit is currently occupied by {unit.tenant_name}.</span>}
        </p>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button onClick={onClose} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
          <button onClick={handle} disabled={loading} style={{ flex: 1, padding: '0.6rem 1.2rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600, fontFamily: F.dm, letterSpacing: '0.04em', border: 'none', cursor: 'pointer', background: C.red, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: C.white, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <Icon name="trash" size={14} />}
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function UnitGridCard({ unit, onEdit, onDelete, onNavigateTenant }) {
  const cfg = statusConfig[unit.status] ?? statusConfig["vacant"];
  return (
    <div style={{ ...cardStyle, borderColor: cfg.border, transition: 'box-shadow 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}>
      <div style={{ padding: '1rem', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
          <div>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.03em' }}>Unit {unit.unit_number}</p>
            <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, marginTop: '0.15rem' }}>{unit.property_name}</p>
          </div>
          <StatusBadge status={unit.status} />
        </div>
      </div>
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
        {[
          ["Type", unit.unit_type?.replace(/_/g, " ")],
          ["Floor", unit.floor_number || "—"],
          ["Rent", `${format(unit.monthly_rent)}/mo`],
          ["Parking", unit.parking_bay ? "Yes" : "—"],
        ].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
            <span style={{ color: 'rgba(245,240,232,0.4)' }}>{label}</span>
            <span style={{ fontWeight: 500, color: label === "Parking" && val === "Yes" ? C.greenLight : C.white }}>{label === "Parking" && val === "Yes" ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><Icon name="check" size={10} color={C.greenLight} /> Yes</span> : val}</span>
          </div>
        ))}
        {unit.tenant_name ? (
          <button onClick={() => onNavigateTenant(unit)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', borderRadius: '3px', background: 'rgba(232,160,18,0.06)', border: `1px solid rgba(232,160,18,0.12)`, cursor: 'pointer', width: '100%', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,160,18,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(232,160,18,0.06)'}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(232,160,18,0.2)', color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.65rem', flexShrink: 0 }}>{initials(unit.tenant_name)}</div>
            <span style={{ fontSize: '0.78rem', fontWeight: 500, color: C.gold }}>{unit.tenant_name}</span>
          </button>
        ) : (
          <div style={{ width: '100%', padding: '0.5rem', borderRadius: '3px', textAlign: 'center', fontSize: '0.65rem', fontWeight: 600, background: unit.status === "maintenance" ? 'rgba(232,160,18,0.06)' : C.black, color: unit.status === "maintenance" ? C.gold : 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
            <Icon name={unit.status === "maintenance" ? "wrench" : "home"} size={10} /> {unit.status === "maintenance" ? "Under maintenance" : "Available for tenancy"}
          </div>
        )}
        {unit.notes && <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.3rem' }} title={unit.notes}><Icon name="info" size={10} />{unit.notes}</p>}
      </div>
      <div style={{ padding: '0 1rem 1rem', display: 'flex', gap: '0.4rem' }}>
        <button onClick={() => onEdit(unit)} style={{ flex: 1, padding: '0.5rem', borderRadius: '3px', fontSize: '0.68rem', fontWeight: 500, fontFamily: F.mono, letterSpacing: '0.04em', background: C.black, border: `1px solid ${C.border}`, color: 'rgba(245,240,232,0.4)', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
          onMouseEnter={e => { e.currentTarget.style.background = C.muted; e.currentTarget.style.color = C.white; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.black; e.currentTarget.style.color = 'rgba(245,240,232,0.4)'; }}>
          <Icon name="edit" size={11} /> Edit
        </button>
        <button onClick={() => onDelete(unit)} style={{ padding: '0.5rem 0.7rem', borderRadius: '3px', fontSize: '0.68rem', fontWeight: 500, fontFamily: F.mono, letterSpacing: '0.04em', background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.15)', color: C.redLight, cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(224,90,74,0.15)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(224,90,74,0.08)'}>
          <Icon name="trash" size={11} /> Remove
        </button>
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
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("token");
      const [unitsRes, propRes] = await Promise.all([
        axios.get(`${API}/units`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/properties`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      
      setUnits(unitsRes.data.units || []);
      setProperties(propRes.data.properties || []);
    } catch (err) { 
      setError(err.response?.data?.error || "Failed to load units"); 
      toast.error("Failed to load units."); 
    } finally { 
      setLoading(false); 
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = units.filter(u => {
    const actualStatus = STATUS_MAP[statusFilter];
    const matchStatus = actualStatus === "All" || u.status === actualStatus;
    const matchProperty = propertyFilter === "All" || u.property_name === propertyFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || [
      String(u.unit_number), 
      u.property_name, 
      u.unit_type, 
      u.tenant_name ?? ""
    ].some(s => (s || "").toLowerCase().includes(q));
    return matchStatus && matchProperty && matchSearch;
  });

  function getStatusCount(statusLabel) {
    if (statusLabel === "All") return units.length;
    const actualStatus = STATUS_MAP[statusLabel];
    return units.filter(u => u.status === actualStatus).length;
  }

  function handleNavigateToTenant(unit) {
    if (unit.tenant_id) {
      navigate(`/landlord/tenants/${unit.tenant_id}`);
    } else if (unit.current_tenant_id) {
      navigate(`/landlord/tenants/${unit.current_tenant_id}`);
    } else {
      navigate("/landlord/tenants");
    }
  }

  function handleSave(saved) {
    setUnits(prev => {
      const exists = prev.find(u => u.id === saved.id);
      if (exists) {
        return prev.map(u => u.id === saved.id 
          ? { ...u, ...saved, property_name: properties.find(p => p.id === (saved.property_id || u.property_id))?.name || u.property_name }
          : u
        );
      }
      return [...prev, { 
        ...saved, 
        property_name: properties.find(p => p.id === saved.property_id)?.name || "" 
      }];
    });
    setEditUnit(null); setShowAdd(false);
  }

  async function handleDelete(id) {
    const token = localStorage.getItem("token");
    await axios.delete(`${API}/units/${id}`, { headers: { Authorization: `Bearer ${token}` } });
    setUnits(prev => prev.filter(u => u.id !== id));
  }

  const propertyNames = ["All", ...new Set(units.map(u => u.property_name).filter(Boolean))];

  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    subtitle: { fontSize: '0.75rem', color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, marginTop: '0.3rem' },
    actions: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
    viewToggle: { display: 'flex', background: C.muted, borderRadius: '3px', padding: '2px' },
    viewBtn: (active) => ({ padding: '0.4rem 0.7rem', borderRadius: '2px', fontSize: '0.72rem', fontWeight: 500, fontFamily: F.mono, letterSpacing: '0.04em', border: 'none', cursor: 'pointer', background: active ? C.muted2 : 'transparent', color: active ? C.gold : 'rgba(245,240,232,0.3)', display: 'flex', alignItems: 'center', gap: '0.3rem', transition: 'all 0.15s' }),
    refreshBtn: { padding: '0.5rem', borderRadius: '3px', background: C.muted, border: `1px solid ${C.border}`, cursor: 'pointer', color: 'rgba(245,240,232,0.3)', display: 'flex', transition: 'all 0.15s' },
    toolbar: { ...cardStyle, padding: '0', marginBottom: '1.2rem' },
    toolbarInner: { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', flexWrap: 'wrap' },
    filterBtn: (active) => ({ 
      padding: '0.4rem 0.8rem', 
      borderRadius: '3px', 
      fontSize: '0.72rem', 
      fontWeight: 600, 
      fontFamily: F.mono, 
      letterSpacing: '0.04em', 
      border: `1px solid ${active ? C.gold : C.border}`, 
      background: active ? 'rgba(232,160,18,0.12)' : 'transparent', 
      color: active ? C.gold : 'rgba(245,240,232,0.5)',
      cursor: 'pointer', 
      transition: 'all 0.15s' 
    }),
    searchWrap: { position: 'relative', marginLeft: 'auto' },
    searchIcon: { position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.25)' },
    searchInput: { 
      padding: '0.5rem 0.8rem 0.5rem 2.25rem', 
      borderRadius: '3px', 
      background: C.black, 
      border: `1px solid ${C.border}`, 
      color: C.white, 
      fontFamily: F.dm, 
      fontSize: '0.78rem', 
      outline: 'none', 
      width: 200,
    },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: 'rgba(245,240,232,0.3)', gap: '0.8rem' },
    empty: { padding: '4rem 0', textAlign: 'center', color: 'rgba(245,240,232,0.3)', fontSize: '0.85rem' },
    grid: { display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' },
    table: { width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' },
    th: { fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.7rem 1rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` },
    td: { padding: '0.7rem 1rem', borderBottom: `1px solid ${C.border}` },
    footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', borderTop: `1px solid ${C.border}`, fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono },
  };

  return (
    <div style={S.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 640px) { .units-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (min-width: 1024px) { .units-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (min-width: 1280px) { .units-grid { grid-template-columns: repeat(4, 1fr) !important; } }
        
        select option {
          background: #1a1a1a !important;
          color: #F5F0E8 !important;
          padding: 8px 12px !important;
        }
        
        select:hover {
          border-color: rgba(232,160,18,0.4) !important;
        }
        
        select:focus {
          border-color: rgba(232,160,18,0.6) !important;
        }
        
        .filter-count {
          display: inline-block;
          margin-left: 0.3rem;
          opacity: 0.5;
          font-size: 0.65rem;
        }
      `}</style>

      {(editUnit || showAdd) && (
        <UnitFormModal 
          unit={editUnit ?? null} 
          properties={properties} 
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

      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}><Icon name="home" size={22} color={C.gold} />Units</h1>
          <p style={S.subtitle}>{units.length} units across {properties.length} properties</p>
        </div>
        <div style={S.actions}>
          <button onClick={() => setShowAdd(true)} style={btnPrimary}><Icon name="plus" size={14} />Add Unit</button>
          <button onClick={fetchData} style={S.refreshBtn} title="Refresh"
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="refresh" size={15} />
          </button>
        </div>
      </div>

      <div style={S.toolbar}>
        <div style={S.toolbarInner}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatus(s)} style={S.filterBtn(statusFilter === s)}>
                {s}
                <span className="filter-count">
                  ({getStatusCount(s)})
                </span>
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto', flexWrap: 'wrap' }}>
            <select 
              value={propertyFilter} 
              onChange={e => setProperty(e.target.value)} 
              style={toolbarSelectStyle}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(232,160,18,0.4)'; e.currentTarget.style.color = C.white; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = 'rgba(245,240,232,0.5)'; }}
            >
              {propertyNames.map(p => (
                <option key={p} value={p}>{p === "All" ? "All Properties" : p}</option>
              ))}
            </select>

            <div style={S.searchWrap}>
              <Icon name="search" size={14} style={S.searchIcon} />
              <input 
                type="text" 
                value={search} 
                placeholder="Search..."
                onChange={e => setSearch(e.target.value)} 
                style={S.searchInput} 
              />
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={S.loading}>
          <span style={{ width: 20, height: 20, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
          Loading units...
        </div>
      ) : error ? (
        <div style={{ padding: '4rem 0', textAlign: 'center' }}>
          <p style={{ color: C.redLight, fontSize: '0.85rem' }}>{error}</p>
          <button onClick={fetchData} style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', fontSize: '0.75rem', fontFamily: F.mono, marginTop: '0.5rem' }}>Try again</button>
        </div>
      ) : (
        <>
          {view === "grid" && (
            filtered.length === 0 ? (
              <div style={S.empty}>
                <Icon name="home" size={32} color="rgba(245,240,232,0.1)" />
                <p style={{ marginTop: '0.8rem' }}>No units match your filters.</p>
                <button onClick={() => { setStatus("All"); setProperty("All"); setSearch(""); }} style={{ background: 'none', border: 'none', color: C.gold, cursor: 'pointer', fontSize: '0.75rem', fontFamily: F.mono, marginTop: '0.5rem' }}>Clear all filters</button>
              </div>
            ) : (
              <div className="units-grid" style={S.grid}>
                {filtered.map(u => (
                  <UnitGridCard 
                    key={u.id} 
                    unit={u} 
                    onEdit={setEditUnit} 
                    onDelete={setDeleteUnit} 
                    onNavigateTenant={handleNavigateToTenant} 
                  />
                ))}
              </div>
            )
          )}
        </>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div style={S.footer}>
          <span>Showing {filtered.length} of {units.length} units</span>
          {search && <span>Search: &quot;{search}&quot;</span>}
        </div>
      )}
    </div>
  );
}