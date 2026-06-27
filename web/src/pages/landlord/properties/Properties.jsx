/* eslint-disable no-unused-vars */
// LANDLORD PROPERTIES PAGE 

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

const PROPERTY_TYPES = ["residential", "commercial", "mixed_use"];
const UNIT_TYPES = ["studio", "1_bedroom", "2_bedroom", "3_bedroom", "4_bedroom", "penthouse"];
const UNIT_STATUSES = ["occupied", "vacant", "maintenance", "reserved"];

function fmt(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }

function unitTypeLabel(t) {
  const m = { studio: "Studio", "1_bedroom": "1 Bed", "2_bedroom": "2 Bed", "3_bedroom": "3 Bed", "4_bedroom": "4 Bed", penthouse: "Penthouse" };
  return m[t] ?? t;
}

const unitStatusColors = {
  occupied:    { color: C.greenLight, bg: 'rgba(26,122,74,0.1)', border: '1px solid rgba(76,186,122,0.2)', dot: C.greenLight },
  vacant:      { color: C.blue,       bg: 'rgba(58,143,212,0.1)',  border: '1px solid rgba(58,143,212,0.2)',  dot: C.blue },
  maintenance: { color: C.gold,       bg: 'rgba(232,160,18,0.08)', border: '1px solid rgba(232,160,18,0.2)',  dot: C.gold },
  reserved:    { color: C.purple,     bg: 'rgba(139,92,246,0.1)',  border: '1px solid rgba(139,92,246,0.2)',  dot: C.purple },
};

const inputStyle = (error) => ({
  width: '100%', fontSize: '0.82rem', padding: '0.6rem 0.9rem', borderRadius: '3px',
  background: C.black, border: `1px solid ${error ? 'rgba(224,90,74,0.5)' : C.border}`,
  color: C.white, fontFamily: F.dm, outline: 'none',
  transition: 'border-color 0.2s',
});

const btnPrimary = {
  background: C.gold, color: C.black, border: 'none',
  padding: '0.6rem 1.4rem', fontSize: '0.76rem', fontWeight: 700,
  fontFamily: F.dm, letterSpacing: '0.04em', borderRadius: '3px',
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem',
  transition: 'background 0.2s',
};

const btnGhost = {
  background: 'transparent', color: 'rgba(245,240,232,0.5)',
  border: `1px solid ${C.border}`, padding: '0.6rem 1.2rem',
  fontSize: '0.76rem', fontWeight: 500, fontFamily: F.dm,
  letterSpacing: '0.04em', borderRadius: '3px', cursor: 'pointer',
  transition: 'all 0.2s',
};

const modalOverlay = {
  position: 'fixed', inset: 0, zIndex: 50,
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
};

const modalCard = (maxW = 480) => ({
  width: '100%', maxWidth: maxW, background: C.muted2,
  border: `1px solid ${C.border}`, borderRadius: '6px',
  display: 'flex', flexDirection: 'column', maxHeight: '92vh',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
});

const modalHeader = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '1.2rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
};

const modalBody = {
  flex: 1, overflowY: 'auto', padding: '1.2rem 1.5rem',
  display: 'flex', flexDirection: 'column', gap: '1rem',
};

const modalFooter = {
  display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem',
  borderTop: `1px solid ${C.border}`, flexShrink: 0,
};

const cardStyle = {
  background: C.muted2, border: `1px solid ${C.border}`,
  borderRadius: '6px', overflow: 'hidden',
  transition: 'border-color 0.2s',
};

const pillStyle = (color, bg, border) => ({
  fontSize: '0.62rem', fontWeight: 700, padding: '0.2rem 0.6rem',
  borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
  textTransform: 'uppercase', color, background: bg, border,
  display: 'flex', alignItems: 'center', gap: '0.3rem', whiteSpace: 'nowrap',
});

function Field({ label, error, children, optional }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
        <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{label}</label>
        {!optional && <span style={{ color: C.redLight, fontSize: '0.6rem' }}>*</span>}
        {optional && <span style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.25)' }}>(optional)</span>}
        {error && <span style={{ fontSize: '0.6rem', color: C.redLight, marginLeft: 'auto' }}>— {error}</span>}
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
  const color = pct >= 0.9 ? C.greenLight : pct >= 0.6 ? C.gold : C.blue;

  return (
    <svg width={size} height={size} viewBox="0 0 48 48" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="24" cy="24" r={r} fill="none" stroke={C.border} strokeWidth="4" />
      <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }} />
    </svg>
  );
}

function UnitCell({ unit }) {
  const cfg = unitStatusColors[unit.status] ?? unitStatusColors.vacant;
  return (
    <div style={{ borderRadius: '6px', border: cfg.border, padding: '0.7rem', background: cfg.bg, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: C.white }}>Unit {unit.unit_number}</span>
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot }} />
      </div>
      <span style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.4)', fontFamily: F.mono }}>{unitTypeLabel(unit.unit_type)}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: C.white }}>{fmt(unit.monthly_rent)}</span>
      {unit.tenant_name && <span style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.3)' }}>{unit.tenant_name}</span>}
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
    <div style={{ ...cardStyle, position: 'relative' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = C.gold}
      onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
      <div style={{ height: 3, width: '100%', background: `linear-gradient(90deg, ${C.gold}, transparent)` }} />
      <div style={{ padding: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.8rem', marginBottom: '1rem' }}>
          <OccupancyRing total={units.length} occupied={occupied} />
          <div style={{ position: 'absolute', top: 'calc(1.2rem + 6px)', left: 'calc(1.2rem + 6px)', width: 40, height: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: C.white, lineHeight: 1 }}>{occupied}</span>
            <span style={{ fontSize: '0.5rem', color: 'rgba(245,240,232,0.3)' }}>/{units.length}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0, marginLeft: '0.8rem' }}>
            <h3 style={{ fontSize: '0.88rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.03em' }}>{property.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
              <Icon name="mapPin" size={10} color="rgba(245,240,232,0.3)" />
              <span style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.4)' }}>{property.address_line1}, {property.city}</span>
            </div>
            {property.caretaker_name && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                <Icon name="user" size={10} color="rgba(245,240,232,0.3)" />
                <span style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.4)' }}>{property.caretaker_name}</span>
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button onClick={() => setMenuOpen(o => !o)}
              style={{ padding: '0.3rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
              onMouseEnter={e => e.currentTarget.style.background = C.muted}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <Icon name="moreVertical" size={14} />
            </button>
            {menuOpen && (
              <div style={{ position: 'absolute', right: 0, top: 28, zIndex: 20, width: 160, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}
                onMouseLeave={() => setMenuOpen(false)}>
                {[
                  { icon: 'eye', label: "View Units", action: () => { setMenuOpen(false); onView(property); }, color: 'rgba(245,240,232,0.5)' },
                  { icon: 'edit', label: "Edit Property", action: () => { setMenuOpen(false); onEdit(property); }, color: 'rgba(245,240,232,0.5)' },
                  { icon: 'trash', label: "Delete", action: () => { setMenuOpen(false); onDelete(property); }, color: C.redLight },
                ].map(item => (
                  <button key={item.label} onClick={item.action}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%', padding: '0.6rem 0.8rem', background: 'transparent', border: 'none', cursor: 'pointer', color: item.color, fontSize: '0.7rem', fontFamily: F.mono, letterSpacing: '0.04em', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.muted}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Icon name={item.icon} size={12} /> {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.8rem' }}>
          {[
            { label: `${occupied} Occ.`, color: C.greenLight, bg: 'rgba(26,122,74,0.08)', border: '1px solid rgba(76,186,122,0.15)' },
            { label: `${vacant} Vac.`, color: C.blue, bg: 'rgba(58,143,212,0.08)', border: '1px solid rgba(58,143,212,0.15)' },
            ...(maintenance > 0 ? [{ label: `${maintenance} Mnt.`, color: C.gold, bg: 'rgba(232,160,18,0.06)', border: '1px solid rgba(232,160,18,0.12)' }] : []),
          ].map(b => (
            <span key={b.label} style={{ flex: 1, textAlign: 'center', fontSize: '0.58rem', fontWeight: 700, padding: '0.3rem', borderRadius: '3px', color: b.color, background: b.bg, border: b.border, fontFamily: F.mono, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
              {b.label}
            </span>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.8rem', borderTop: `1px solid ${C.border}` }}>
          <div>
            <p style={{ fontSize: '0.55rem', fontWeight: 600, color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Monthly Income</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.03em', marginTop: '0.2rem' }}>{fmt(occupiedRent)}</p>
          </div>
          <button onClick={() => onView(property)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', padding: '0.5rem 0.8rem', borderRadius: '3px', background: 'rgba(232,160,18,0.08)', border: '1px solid rgba(232,160,18,0.15)', color: C.gold, fontSize: '0.68rem', fontWeight: 600, fontFamily: F.mono, letterSpacing: '0.04em', cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(232,160,18,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(232,160,18,0.08)'}>
            View Units <Icon name="chevronRight" size={10} />
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

  function validate() { const e = {}; if (!form.name.trim()) e.name = "Required"; if (!form.address_line1.trim()) e.address_line1 = "Required"; if (!form.city.trim()) e.city = "Required"; return e; }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); toast.warning("Please fill in all required fields."); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = { ...form, total_floors: form.total_floors ? Number(form.total_floors) : null, total_units: form.total_units ? Number(form.total_units) : null };
      const { data } = isEdit
        ? await axios.put(`${API}/properties/${property.id}`, payload, { headers: { Authorization: `Bearer ${token}` } })
        : await axios.post(`${API}/properties`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(isEdit ? "Property updated successfully!" : "Property added successfully!");
      onSave(data.property ?? data);
    } catch (err) { toast.error(err.response?.data?.error || "Failed to save property."); }
    finally { setLoading(false); }
  }

  const AMENITIES = [
    { key: "has_elevator", label: "Elevator" }, { key: "has_parking", label: "Parking" },
    { key: "has_security", label: "Security" }, { key: "has_pool", label: "Pool" }, { key: "pet_friendly", label: "Pet-friendly" },
  ];

  return (
    <div style={modalOverlay}>
      <div style={modalCard(520)}>
        <div style={modalHeader}>
          <div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>{isEdit ? "Edit Property" : "Add Property"}</h2>
            <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, marginTop: '0.2rem' }}>{isEdit ? "Update property details" : "Register a new property"}</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.3rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div style={modalBody}>
          <Field label="Property Name" error={errors.name}><input style={inputStyle(errors.name)} value={form.name} onChange={e => set("name", e.target.value)} /></Field>
          <Field label="Property Type"><select style={inputStyle(false)} value={form.property_type} onChange={e => set("property_type", e.target.value)}>{PROPERTY_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace("_", " ")}</option>)}</select></Field>
          <Field label="Street Address" error={errors.address_line1}><input style={inputStyle(errors.address_line1)} value={form.address_line1} onChange={e => set("address_line1", e.target.value)} /></Field>
          <Field label="Address Line 2" optional><input style={inputStyle(false)} value={form.address_line2} onChange={e => set("address_line2", e.target.value)} /></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field label="City" error={errors.city}><input style={inputStyle(errors.city)} value={form.city} onChange={e => set("city", e.target.value)} /></Field>
            <Field label="Province" optional><input style={inputStyle(false)} value={form.province} onChange={e => set("province", e.target.value)}  /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field label="Postal Code" optional><input style={inputStyle(false)} value={form.postal_code} onChange={e => set("postal_code", e.target.value)}  /></Field>
            <Field label="Total Floors" optional><input type="number" min="1" style={inputStyle(false)} value={form.total_floors} onChange={e => set("total_floors", e.target.value)}  /></Field>
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Amenities</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {AMENITIES.map(a => {
                const on = form[a.key];
                return (
                  <button key={a.key} type="button" onClick={() => set(a.key, !on)}
                    style={{ padding: '0.4rem 0.8rem', borderRadius: '3px', fontSize: '0.68rem', fontWeight: 600, fontFamily: F.mono, letterSpacing: '0.04em', border: `1px solid ${on ? C.gold : C.border}`, background: on ? 'rgba(232,160,18,0.1)' : 'transparent', color: on ? C.gold : 'rgba(245,240,232,0.4)', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {on ? "✓ " : ""}{a.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div style={modalFooter}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1, display: 'flex', justifyContent: 'center' }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} style={{ ...btnPrimary, flex: 2, display: 'flex', justifyContent: 'center' }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: C.black, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : null}
            {isEdit ? "Save Changes" : "Add Property"}
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
  function validate() { const e = {}; if (!form.unit_number.trim()) e.unit_number = "Required"; if (!form.monthly_rent) e.monthly_rent = "Required"; return e; }

  async function handleSave() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); toast.warning("Please fill in all required fields."); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const payload = { ...form, floor_number: form.floor_number ? Number(form.floor_number) : null, bedrooms: form.bedrooms ? Number(form.bedrooms) : null, bathrooms: form.bathrooms ? Number(form.bathrooms) : null, square_meters: form.square_meters ? Number(form.square_meters) : null, monthly_rent: Number(form.monthly_rent), deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : null };
      const { data } = isEdit
        ? await axios.put(`${API}/units/${unit.id}`, payload, { headers: { Authorization: `Bearer ${token}` } })
        : await axios.post(`${API}/properties/${propertyId}/units`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(isEdit ? "Unit updated successfully!" : "Unit added successfully!");
      onSave(data.unit ?? data);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save unit.");
      onSave({ ...form, id: unit?.id ?? Date.now().toString(), monthly_rent: Number(form.monthly_rent) });
    } finally { setLoading(false); }
  }

  const EXTRAS = [{ key: "furnished", label: "Furnished" }, { key: "parking_bay", label: "Parking Bay" }, { key: "has_balcony", label: "Balcony" }];

  return (
    <div style={modalOverlay}>
      <div style={modalCard(440)}>
        <div style={modalHeader}>
          <div>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>{isEdit ? "Edit Unit" : "Add Unit"}</h2>
            <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, marginTop: '0.2rem' }}>{isEdit ? `Editing Unit ${unit.unit_number}` : "Add a new unit"}</p>
          </div>
          <button onClick={onClose} style={{ padding: '0.3rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div style={modalBody}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field label="Unit Number" error={errors.unit_number}><input style={inputStyle(errors.unit_number)} value={form.unit_number} onChange={e => set("unit_number", e.target.value)} /></Field>
            <Field label="Floor" optional><input type="number" min="0" style={inputStyle(false)} value={form.floor_number} onChange={e => set("floor_number", e.target.value)}  /></Field>
          </div>
          <Field label="Unit Type"><select style={inputStyle(false)} value={form.unit_type} onChange={e => set("unit_type", e.target.value)}>{UNIT_TYPES.map(t => <option key={t} value={t}>{unitTypeLabel(t)}</option>)}</select></Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field label="Bedrooms" optional><input type="number" min="0" style={inputStyle(false)} value={form.bedrooms} onChange={e => set("bedrooms", e.target.value)} /></Field>
            <Field label="Bathrooms" optional><input type="number" min="0" style={inputStyle(false)} value={form.bathrooms} onChange={e => set("bathrooms", e.target.value)}  /></Field>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field label="Monthly Rent (R)" error={errors.monthly_rent}><input type="number" min="0" style={inputStyle(errors.monthly_rent)} value={form.monthly_rent} onChange={e => set("monthly_rent", e.target.value)} /></Field>
            <Field label="Deposit (R)" optional><input type="number" min="0" style={inputStyle(false)} value={form.deposit_amount} onChange={e => set("deposit_amount", e.target.value)} /></Field>
          </div>
          <Field label="Status"><select style={inputStyle(false)} value={form.status} onChange={e => set("status", e.target.value)}>{UNIT_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}</select></Field>
          <div>
            <p style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Features</p>
            <div style={{ display: 'flex', gap: '0.4rem' }}>
              {EXTRAS.map(a => {
                const on = form[a.key];
                return (
                  <button key={a.key} type="button" onClick={() => set(a.key, !on)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '3px', fontSize: '0.68rem', fontWeight: 600, fontFamily: F.mono, letterSpacing: '0.04em', border: `1px solid ${on ? C.gold : C.border}`, background: on ? 'rgba(232,160,18,0.1)' : 'transparent', color: on ? C.gold : 'rgba(245,240,232,0.4)', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {on ? "✓ " : ""}{a.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div style={modalFooter}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1, display: 'flex', justifyContent: 'center' }}>Cancel</button>
          <button onClick={handleSave} disabled={loading} style={{ ...btnPrimary, flex: 2, display: 'flex', justifyContent: 'center' }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: C.black, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : null}
            {isEdit ? "Save Changes" : "Add Unit"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteModal({ title, sub, onClose, onConfirm }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  function go() { setLoading(true); onConfirm(); setLoading(false); toast.success(`${title} completed.`); }

  return (
    <div style={modalOverlay}>
      <div style={{ ...modalCard(380), padding: '1.5rem', maxHeight: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(224,90,74,0.1)', border: '1px solid rgba(224,90,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon name="trash" size={18} color={C.redLight} />
          </div>
          <div>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: C.white }}>{title}</h3>
            <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{sub}</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1rem' }}>
          <button onClick={onClose} style={{ ...btnGhost, flex: 1, display: 'flex', justifyContent: 'center' }}>Cancel</button>
          <button onClick={go} disabled={loading} style={{ flex: 1, padding: '0.6rem 1.2rem', borderRadius: '3px', fontSize: '0.76rem', fontWeight: 600, fontFamily: F.dm, letterSpacing: '0.04em', border: 'none', cursor: 'pointer', background: C.red, color: C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: C.white, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <Icon name="trash" size={14} />}
            Delete
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.4)', fontSize: '0.78rem', fontFamily: F.mono, letterSpacing: '0.04em' }}
          onMouseEnter={e => e.currentTarget.style.color = C.white}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.4)'}>
          <Icon name="arrowLeft" size={14} /> Properties
        </button>
        <span style={{ color: 'rgba(245,240,232,0.2)' }}>/</span>
        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: C.white }}>{property.name}</span>
      </div>

      <div style={{ ...cardStyle, padding: '1.2rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>{property.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
              <Icon name="mapPin" size={12} color="rgba(245,240,232,0.3)" />
              <span style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.4)' }}>{property.address_line1}, {property.city}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[{ label: "Units", value: units.length }, { label: "Occupied", value: occupied }, { label: "Vacant", value: vacant }, { label: "Monthly", value: fmt(totalRent) }].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1rem', fontWeight: 700, color: C.white, fontFamily: F.bebas }}>{s.value}</p>
                <p style={{ fontSize: '0.5rem', fontWeight: 600, color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</p>
              </div>
            ))}
            <button onClick={onAddUnit} style={{ ...btnPrimary, fontSize: '0.68rem', padding: '0.5rem 1rem' }}>Add Unit</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '3px', fontSize: '0.68rem', fontWeight: 600, fontFamily: F.mono, letterSpacing: '0.04em', border: `1px solid ${filter === f.id ? C.gold : C.border}`, background: filter === f.id ? 'rgba(232,160,18,0.12)' : 'transparent', color: filter === f.id ? C.gold : 'rgba(245,240,232,0.4)', cursor: 'pointer', transition: 'all 0.2s' }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', background: C.muted, borderRadius: '3px', padding: '2px' }}>
          {[{ id: "grid", icon: 'grid' }, { id: "list", icon: 'list' }].map(({ id, icon }) => (
            <button key={id} onClick={() => setUnitView(id)}
              style={{ padding: '0.4rem 0.6rem', borderRadius: '2px', background: unitView === id ? C.muted2 : 'transparent', border: 'none', cursor: 'pointer', color: unitView === id ? C.gold : 'rgba(245,240,232,0.3)', transition: 'all 0.2s', display: 'flex' }}>
              <Icon name={icon} size={14} />
            </button>
          ))}
        </div>
      </div>

      {unitView === "grid" && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.8rem' }}>
          {filtered.map(unit => (
            <div key={unit.id} style={{ position: 'relative' }}>
              <UnitCell unit={unit} />
              <div style={{ position: 'absolute', inset: 0, borderRadius: '6px', background: 'rgba(0,0,0,0.6)', opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                <button onClick={() => onEditUnit(unit)} style={{ padding: '0.5rem', borderRadius: '3px', background: C.gold, border: 'none', cursor: 'pointer', color: C.black, display: 'flex' }}><Icon name="edit" size={12} /></button>
                <button onClick={() => onDeleteUnit(unit)} style={{ padding: '0.5rem', borderRadius: '3px', background: C.red, border: 'none', cursor: 'pointer', color: C.white, display: 'flex' }}><Icon name="trash" size={12} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {unitView === "list" && (
        <div style={{ ...cardStyle, overflow: 'hidden' }}>
          <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: `1px solid ${C.border}` }}>
                {["Unit","Type","Floor","Rent","Status","Tenant",""].map(h => <th key={h} style={{ padding: '0.7rem 1rem', textAlign: 'left' }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(unit => {
                const cfg = unitStatusColors[unit.status] ?? unitStatusColors.vacant;
                return (
                  <tr key={unit.id} style={{ borderBottom: `1px solid ${C.border}`, transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.muted}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '0.7rem 1rem', fontWeight: 600, color: C.white }}>#{unit.unit_number}</td>
                    <td style={{ padding: '0.7rem 1rem', color: 'rgba(245,240,232,0.4)' }}>{unitTypeLabel(unit.unit_type)}</td>
                    <td style={{ padding: '0.7rem 1rem', color: 'rgba(245,240,232,0.4)' }}>{unit.floor_number ?? "—"}</td>
                    <td style={{ padding: '0.7rem 1rem', fontWeight: 600, color: C.white }}>{fmt(unit.monthly_rent)}</td>
                    <td style={{ padding: '0.7rem 1rem' }}>
                      <span style={pillStyle(cfg.color, cfg.bg, cfg.border)}>
                        <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />
                        {unit.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.7rem 1rem', color: 'rgba(245,240,232,0.3)', fontSize: '0.68rem' }}>{unit.tenant_name ?? "—"}</td>
                    <td style={{ padding: '0.7rem 1rem' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', opacity: 0, transition: 'opacity 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0}>
                        <button onClick={() => onEditUnit(unit)} style={{ padding: '0.3rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
                          onMouseEnter={e => e.currentTarget.style.color = C.gold}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
                          <Icon name="edit" size={13} />
                        </button>
                        <button onClick={() => onDeleteUnit(unit)} style={{ padding: '0.3rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
                          onMouseEnter={e => e.currentTarget.style.color = C.redLight}
                          onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
                          <Icon name="trash" size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/properties`, { headers: { Authorization: `Bearer ${token}` } });
      setProperties(data.properties || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load properties");
      toast.error("Failed to load properties. Please try again.");
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  const filtered = properties.filter(p =>
    !search.trim() || p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.city?.toLowerCase().includes(search.toLowerCase()) || p.address_line1?.toLowerCase().includes(search.toLowerCase())
  );

  function handleSaveProperty(saved) {
    setProperties(prev => { const exists = prev.find(p => p.id === saved.id); if (exists) return prev.map(p => p.id === saved.id ? { ...p, ...saved } : p); return [...prev, saved]; });
    setEditProperty(null); setShowAddProp(false);
  }

  async function handleDeleteProperty(id) {
    try { const token = localStorage.getItem("token"); await axios.delete(`${API}/properties/${id}`, { headers: { Authorization: `Bearer ${token}` } }); toast.success("Property deleted successfully!"); }
    catch { toast.error("Failed to delete property. It may have active units."); }
    setProperties(prev => prev.filter(p => p.id !== id));
    if (viewProperty?.id === id) setViewProperty(null);
    setDeleteProp(null);
  }

  function handleSaveUnit(saved) {
    setProperties(prev => prev.map(p => { if (p.id !== viewProperty.id) return p; const exists = (p.units || []).find(u => u.id === saved.id); const units = exists ? (p.units || []).map(u => u.id === saved.id ? { ...u, ...saved } : u) : [...(p.units || []), saved]; return { ...p, units }; }));
    setViewProperty(prev => prev ? { ...prev, units: prev.units ? prev.units.map(u => u.id === saved.id ? { ...u, ...saved } : u) : [saved] } : prev);
    setEditUnit(null); setShowAddUnit(false);
  }

  async function handleDeleteUnit(unitId) {
    try { const token = localStorage.getItem("token"); await axios.delete(`${API}/units/${unitId}`, { headers: { Authorization: `Bearer ${token}` } }); toast.success("Unit deleted successfully!"); }
    catch { toast.error("Failed to delete unit. It may have an active lease."); }
    setProperties(prev => prev.map(p => p.id !== viewProperty.id ? p : { ...p, units: (p.units || []).filter(u => u.id !== unitId) }));
    setViewProperty(prev => prev ? { ...prev, units: (prev.units || []).filter(u => u.id !== unitId) } : prev);
    setDeleteUnit(null);
  }

  const S = {
    container: { maxWidth: 1280, margin: '-1rem -1.6rem', padding: '1.5rem 1rem 3rem' },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' },
    subtitle: { fontSize: '0.75rem', color: 'rgba(245,240,232,0.35)', marginTop: '0.3rem', fontFamily: F.mono },
    searchWrap: { position: 'relative', marginBottom: '1.5rem' },
    searchIcon: { position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.25)' },
    searchInput: { width: '100%', padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '3px', background: C.muted2, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, fontSize: '0.82rem', outline: 'none' },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: 'rgba(245,240,232,0.3)', gap: '0.8rem' },
    error: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '5rem 0', gap: '1rem' },
    errorText: { fontSize: '0.82rem', color: C.redLight },
    retryBtn: { background: 'none', border: 'none', color: C.gold, cursor: 'pointer', fontSize: '0.75rem', fontFamily: F.mono, letterSpacing: '0.04em', textDecoration: 'underline' },
    empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '6rem 0', gap: '1rem' },
    emptyIcon: { width: 60, height: 60, borderRadius: '12px', background: C.muted2, border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontSize: '0.85rem', fontWeight: 500, color: 'rgba(245,240,232,0.4)' },
    grid: { display: 'grid', gridTemplateColumns: '1fr', gap: '1.2rem' },
  };

  return (
    <div style={S.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (min-width: 640px) { .props-grid { grid-template-columns: repeat(2, 1fr) !important; } }
        @media (min-width: 1280px) { .props-grid { grid-template-columns: repeat(3, 1fr) !important; } }
        input:focus { border-color: ${C.borderFocus} !important; }
      `}</style>

      {(showAddProp || editProperty) && <PropertyFormModal property={editProperty} onClose={() => { setShowAddProp(false); setEditProperty(null); }} onSave={handleSaveProperty} />}
      {deleteProp && <DeleteModal title="Delete Property" sub={`Remove ${deleteProp.name}? This cannot be undone.`} onClose={() => setDeleteProp(null)} onConfirm={() => handleDeleteProperty(deleteProp.id)} />}
      {(showAddUnit || editUnit) && viewProperty && <UnitFormModal unit={editUnit} propertyId={viewProperty.id} onClose={() => { setShowAddUnit(false); setEditUnit(null); }} onSave={handleSaveUnit} />}
      {deleteUnit && <DeleteModal title="Delete Unit" sub={`Remove Unit ${deleteUnit.unit_number}?`} onClose={() => setDeleteUnit(null)} onConfirm={() => handleDeleteUnit(deleteUnit.id)} />}

      {viewProperty ? (
        <UnitsView property={viewProperty} onBack={() => setViewProperty(null)} onAddUnit={() => setShowAddUnit(true)} onEditUnit={unit => setEditUnit(unit)} onDeleteUnit={unit => setDeleteUnit(unit)} />
      ) : (
        <>
          <div style={S.headerRow}>
            <div>
              <h1 style={S.title}>Properties</h1>
              <p style={S.subtitle}>{properties.length} propert{properties.length !== 1 ? "ies" : "y"} · {properties.reduce((s, p) => s + (p.units || []).length, 0)} units in total</p>
            </div>
            <button onClick={() => setShowAddProp(true)} style={btnPrimary}>Add Property</button>
          </div>

          <div style={S.searchWrap}>
            <Icon name="search" size={14} style={S.searchIcon} />
            <input type="text" placeholder="Search properties..." value={search} onChange={e => setSearch(e.target.value)} style={S.searchInput} />
          </div>

          {loading ? (
            <div style={S.loading}>
              <span style={{ width: 20, height: 20, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              Loading properties...
            </div>
          ) : error ? (
            <div style={S.error}>
              <Icon name="alertCircle" size={28} color={C.redLight} />
              <p style={S.errorText}>{error}</p>
              <button onClick={fetchProperties} style={S.retryBtn}>Try again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div style={S.empty}>
              <div style={S.emptyIcon}><Icon name="properties" size={24} color="rgba(245,240,232,0.2)" /></div>
              <p style={S.emptyText}>{search ? "No properties match" : "No properties yet"}</p>
              {!search && <button onClick={() => setShowAddProp(true)} style={btnPrimary}>Add your first property</button>}
            </div>
          ) : (
            <div className="props-grid" style={S.grid}>
              {filtered.map(property => (
                <PropertyCard key={property.id} property={property} onView={p => setViewProperty(p)} onEdit={p => setEditProperty(p)} onDelete={p => setDeleteProp(p)} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}