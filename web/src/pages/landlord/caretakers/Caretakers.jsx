/* eslint-disable no-unused-vars */
// LANDLORD CARETAKERS PAGE 
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

function initials(name = "") { return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(); }
function formatDate(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
function timeAgo(d) { if (!d) return ""; const diff = (Date.now() - new Date(d)) / 1000; if (diff < 60) return "Just now"; if (diff < 3600) return `${Math.floor(diff / 60)}m ago`; if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`; return `${Math.floor(diff / 86400)}d ago`; }

const cardStyle = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden',
};

const inputStyle = (error) => ({
  width: '100%', fontSize: '0.82rem', padding: '0.6rem 0.9rem', borderRadius: '3px',
  background: C.black, border: `1px solid ${error ? 'rgba(224,90,74,0.5)' : C.border}`,
  color: C.white, fontFamily: F.dm, outline: 'none',
});

const selectStyle = (error) => ({
  ...inputStyle(error),
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2rem',
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

const pillStyle = (color, bg, border) => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  fontSize: '0.58rem', fontWeight: 700, padding: '0.12rem 0.5rem',
  borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
  textTransform: 'uppercase', color, background: bg, border,
});

function StatusBadge({ status }) {
  const config = {
    active:  { color: C.greenLight, bg: 'rgba(26,122,74,0.08)', border: '1px solid rgba(76,186,122,0.15)', dot: C.greenLight, label: "Active" },
    inactive:{ color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)', dot: 'rgba(245,240,232,0.3)', label: "Inactive" },
  };
  const cfg = config[status] || config.inactive;
  return (
    <span style={pillStyle(cfg.color, cfg.bg, cfg.border)}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

function RegisterCaretakerModal({ properties, onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    assigned_property: "", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: undefined })); }

  function validate() {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "Required";
    if (!form.last_name.trim()) e.last_name = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (!form.phone.trim()) e.phone = "Required";
    if (!form.assigned_property) e.assigned_property = "Select a property";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); toast.warning("Please fill all required fields."); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.post(`${API}/landlord/caretakers`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Caretaker registered!");
      onCreated(data.caretaker);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to register caretaker");
    } finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 500, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '6px', background: 'rgba(58,143,212,0.12)', border: '1px solid rgba(58,143,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="user-plus" size={16} color={C.blue} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Register Caretaker</h3>
              <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>They will receive a welcome email with login details</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                First Name{errors.first_name && <span style={{ color: C.redLight, textTransform: 'none', marginLeft: '0.3rem' }}>— {errors.first_name}</span>}
              </label>
              <input value={form.first_name} onChange={e => set("first_name", e.target.value)} style={inputStyle(errors.first_name)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Last Name{errors.last_name && <span style={{ color: C.redLight, textTransform: 'none', marginLeft: '0.3rem' }}>— {errors.last_name}</span>}
              </label>
              <input value={form.last_name} onChange={e => set("last_name", e.target.value)} style={inputStyle(errors.last_name)} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Email{errors.email && <span style={{ color: C.redLight, textTransform: 'none', marginLeft: '0.3rem' }}>— {errors.email}</span>}
            </label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)} style={inputStyle(errors.email)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Phone{errors.phone && <span style={{ color: C.redLight, textTransform: 'none', marginLeft: '0.3rem' }}>— {errors.phone}</span>}
            </label>
            <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} style={inputStyle(errors.phone)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Assigned Property{errors.assigned_property && <span style={{ color: C.redLight, textTransform: 'none', marginLeft: '0.3rem' }}>— {errors.assigned_property}</span>}
            </label>
            <select value={form.assigned_property} onChange={e => set("assigned_property", e.target.value)} style={selectStyle(errors.assigned_property)}>
              <option value="">Select a property</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.caretaker_name ? `(Current: ${p.caretaker_name})` : ""}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Notes <span style={{ color: 'rgba(245,240,232,0.25)', textTransform: 'none', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)} placeholder="Any notes about this caretaker..."
              style={{ ...inputStyle(false), resize: 'vertical', minHeight: 50, fontSize: '0.72rem' }} />
          </div>

          {/* Info box */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(58,143,212,0.06)', border: '1px solid rgba(58,143,212,0.15)' }}>
            <Icon name="info" size={13} color={C.blue} style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '0.62rem', color: 'rgba(58,143,212,0.7)', lineHeight: 1.4 }}>
              The caretaker will receive a welcome email with a temporary password. They will manage maintenance and complaints for their assigned property only.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading} style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: C.black, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <><Icon name="user-plus" size={14} /> Register Caretaker</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function AssignPropertyModal({ caretaker, properties, onClose, onAssign }) {
  const [propertyId, setPropertyId] = useState(caretaker.assigned_property_id || "");
  const [loading, setLoading] = useState(false);

  async function handleAssign() {
    if (!propertyId) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/landlord/caretakers/${caretaker.id}/assign-property`, { property_id: propertyId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onAssign(caretaker.id, propertyId);
      onClose();
    } catch (err) { /* handle */ }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 400, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', marginBottom: '0.3rem' }}>Assign Property</h3>
        <p style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.4)', marginBottom: '1rem' }}>{caretaker.name} — current: {caretaker.property_name || "None"}</p>
        <select value={propertyId} onChange={e => setPropertyId(e.target.value)} style={{ ...selectStyle(false), marginBottom: '1rem' }}>
          <option value="">Select property</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={onClose} style={{ flex: 1, padding: '0.6rem', borderRadius: '3px', background: 'transparent', border: `1px solid ${C.border}`, color: 'rgba(245,240,232,0.4)', cursor: 'pointer', fontSize: '0.74rem' }}>Cancel</button>
          <button onClick={handleAssign} disabled={!propertyId || loading} style={{ flex: 1, padding: '0.6rem', borderRadius: '3px', background: C.blue, color: C.white, border: 'none', cursor: 'pointer', fontSize: '0.74rem', fontWeight: 600, opacity: propertyId ? 1 : 0.5 }}>Assign</button>
        </div>
      </div>
    </div>
  );
}

export default function LandlordCaretakers() {
  useDocumentTitle("Caretakers");
  const navigate = useNavigate();
  const toast = useToast();

  const [caretakers, setCaretakers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [showRegister, setShowRegister] = useState(false);
  const [assignModal, setAssignModal] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const [caretakersRes, propertiesRes] = await Promise.all([
        axios.get(`${API}/landlord/caretakers`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/properties`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setCaretakers((caretakersRes.data.caretakers || []).map(c => ({
        ...c,
        name: `${c.first_name || ""} ${c.last_name || ""}`.trim(),
        initials: `${(c.first_name || "").charAt(0)}${(c.last_name || "").charAt(0)}`.toUpperCase(),
      })));
      setProperties(propertiesRes.data.properties || []);
    } catch (err) {
      setError("Failed to load caretakers");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleCreated(newCaretaker) {
    setCaretakers(prev => [{
      ...newCaretaker,
      name: `${newCaretaker.first_name || ""} ${newCaretaker.last_name || ""}`.trim(),
      initials: `${(newCaretaker.first_name || "").charAt(0)}${(newCaretaker.last_name || "").charAt(0)}`.toUpperCase(),
    }, ...prev]);
  }

  function handleAssign(caretakerId, propertyId) {
    const property = properties.find(p => p.id === propertyId);
    setCaretakers(prev => prev.map(c => 
      c.id === caretakerId ? { ...c, assigned_property_id: propertyId, property_name: property?.name || "Unknown" } : c
    ));
    toast.success("Property assigned!");
  }

  async function handleToggleStatus(caretakerId, currentStatus) {
    try {
      const token = localStorage.getItem("token");
      const newStatus = currentStatus === "active" ? "inactive" : "active";
      await axios.put(`${API}/landlord/caretakers/${caretakerId}/toggle-status`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCaretakers(prev => prev.map(c => c.id === caretakerId ? { ...c, status: newStatus } : c));
      toast.success(`Caretaker ${newStatus === "active" ? "activated" : "deactivated"}`);
    } catch { toast.error("Failed to update status"); }
  }

  const filtered = caretakers.filter(c => {
    if (filter === "Active") return c.status === "active";
    if (filter === "Inactive") return c.status === "inactive";
    if (filter === "Assigned") return !!c.property_name;
    if (filter === "Unassigned") return !c.property_name;
    return true;
  }).filter(c => {
    const q = search.toLowerCase();
    return !q || [c.name, c.email, c.phone, c.property_name].some(s => (s || "").toLowerCase().includes(q));
  });

  const activeCount = caretakers.filter(c => c.status === "active").length;
  const assignedCount = caretakers.filter(c => c.property_name).length;

  const FILTERS = ["All", "Active", "Inactive", "Assigned", "Unassigned"];

  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    subtitle: { fontSize: '0.75rem', color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, marginTop: '0.3rem' },
    toolbar: { ...cardStyle, padding: '0', marginBottom: '1.2rem' },
    toolbarInner: { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', flexWrap: 'wrap' },
    filterBtn: (active) => ({ padding: '0.4rem 0.8rem', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 600, fontFamily: F.mono, letterSpacing: '0.04em', border: `1px solid ${active ? C.gold : C.border}`, background: active ? 'rgba(232,160,18,0.12)' : 'transparent', color: active ? C.gold : 'rgba(245,240,232,0.4)', cursor: 'pointer', transition: 'all 0.15s' }),
    searchWrap: { position: 'relative', marginLeft: 'auto' },
    searchIcon: { position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.25)' },
    searchInput: { padding: '0.5rem 0.8rem 0.5rem 2.25rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, fontSize: '0.78rem', outline: 'none', width: 220 },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: 'rgba(245,240,232,0.3)', gap: '0.8rem' },
    table: { width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' },
    th: { fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.7rem 1rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` },
    td: { padding: '0.7rem 1rem', borderBottom: `1px solid ${C.border}` },
    footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono },
  };

  return (
    <div style={S.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input:focus, select:focus { border-color: ${C.borderFocus} !important; }`}</style>

      {/* Modals */}
      {showRegister && <RegisterCaretakerModal properties={properties} onClose={() => setShowRegister(false)} onCreated={handleCreated} />}
      {assignModal && <AssignPropertyModal caretaker={assignModal} properties={properties} onClose={() => setAssignModal(null)} onAssign={handleAssign} />}

      {/* Header */}
      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}><Icon name="caretakers" size={24} color={C.gold} />Caretakers</h1>
          <p style={S.subtitle}>
            {caretakers.length} total · {activeCount} active · {assignedCount} assigned to properties
          </p>
        </div>
        <button onClick={() => setShowRegister(true)} style={btnPrimary}>
          <Icon name="plus" size={14} /> Register Caretaker
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: '0.8rem 1rem', borderRadius: '3px', background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name="warning" size={16} color={C.redLight} />
          <p style={{ fontSize: '0.75rem', color: C.redLight, flex: 1 }}>{error}</p>
          <button onClick={fetchData} style={{ fontSize: '0.72rem', color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono, fontWeight: 500 }}>Retry</button>
        </div>
      )}

      {/* Table */}
      <div style={cardStyle}>
        <div style={S.toolbarInner}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={S.filterBtn(filter === f)}>{f}</button>
            ))}
          </div>
          <div style={S.searchWrap}>
            <Icon name="search" size={14} style={S.searchIcon} />
            <input placeholder="Search caretakers..." value={search} onChange={e => setSearch(e.target.value)} style={S.searchInput} />
          </div>
        </div>

        {loading ? (
          <div style={S.loading}>
            <span style={{ width: 20, height: 20, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            Loading caretakers...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["Caretaker", "Contact", "Assigned Property", "Status", "Registered", "Actions"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', padding: '3rem 0', color: 'rgba(245,240,232,0.25)' }}>No caretakers found.</td></tr>
                )}
                {filtered.map(c => (
                  <tr key={c.id} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.muted}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    
                    {/* Caretaker */}
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(58,143,212,0.1)', color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.7rem', flexShrink: 0 }}>
                          {c.initials}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600, color: C.white, fontSize: '0.8rem' }}>{c.name}</p>
                          {c.notes && <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.notes}>{c.notes}</p>}
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td style={S.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.5)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Icon name="mail" size={10} /> {c.email || "—"}
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.5)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Icon name="phone" size={10} /> {c.phone || "—"}
                        </span>
                      </div>
                    </td>

                    {/* Assigned Property */}
                    <td style={S.td}>
                      {c.property_name ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: C.greenLight }}>{c.property_name}</span>
                      ) : (
                        <span style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.2)', fontStyle: 'italic' }}>Unassigned</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={S.td}><StatusBadge status={c.status} /></td>

                    {/* Registered */}
                    <td style={{ ...S.td, fontSize: '0.7rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>
                      {formatDate(c.created_at)}
                    </td>

                    {/* Actions */}
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button onClick={() => setAssignModal(c)} style={{ fontSize: '0.68rem', fontWeight: 500, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                          Assign
                        </button>
                        <button onClick={() => handleToggleStatus(c.id, c.status)} style={{ fontSize: '0.68rem', fontWeight: 500, color: c.status === 'active' ? C.redLight : C.greenLight, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                          {c.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={S.footer}>
          <span>Showing <span style={{ color: C.white, fontWeight: 500 }}>{filtered.length}</span> of <span style={{ color: C.white, fontWeight: 500 }}>{caretakers.length}</span> caretakers</span>
        </div>
      </div>
    </div>
  );
}