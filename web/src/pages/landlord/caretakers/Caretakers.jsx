/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import {
  FiChevronRight, FiSearch, FiRefreshCw,
  FiMail, FiPhone, FiUserPlus, FiX, FiInfo, FiAlertCircle,
  FiChevronDown
} from "react-icons/fi";
import { FaPlus } from "react-icons/fa";

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';
const PAGE_SIZE = 10;

const statusConfig = {
  active:   { color: "#1a4a30", bg: "#eef5e8", border: "1px solid #c5d9b8", dot: "#2b7a4b", label: "Active" },
  inactive: { color: "#6a6a6a", bg: "#f5f5f5", border: "1px solid #e0e0e0", dot: "#7a7a7a", label: "Inactive" },
};

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function StatusBadge({ status }) {
  const cfg = statusConfig[status] ?? statusConfig["inactive"];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '12px',
      fontWeight: 500, padding: '0.15rem 0.6rem', color: cfg.color, background: cfg.bg,
      border: cfg.border, borderRadius: '12px',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

const thStyle = {
  padding: '0.6rem 0.8rem',
  fontSize: '12px',
  fontWeight: 600,
  color: '#000',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  background: '#e9eced52',
  border: '1px solid #9a9d9e52',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '0.6rem 0.8rem',
  fontSize: '12px',
  color: '#151515',
  border: '1px solid #9a9d9e52',
  verticalAlign: 'middle',
  fontWeight: 400,
  background: '#e9eced52',
};

const outlineBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '0.4rem',
  background: '#fdfdfd', color: '#000', border: '1px solid #ccc',
  padding: '0.3rem 0.6rem', fontSize: '14px', fontWeight: 400,
  cursor: 'pointer', borderRadius: '2px',
};

const primaryBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '0.4rem',
  background: '#2c3e50', color: '#ffffff', border: 'none',
  padding: '0.4rem 1rem', fontSize: '14px', fontWeight: 500,
  cursor: 'pointer', borderRadius: '2px',
};

const inputStyle = (hasError) => ({
  width: '100%',
  fontSize: '14px',
  padding: '0.4rem 0.7rem',
  background: '#fdfdfd',
  border: `1px solid ${hasError ? '#c0392b' : '#d0d1d3'}`,
  color: '#000',
  outline: 'none',
  borderRadius: '2px',
  fontFamily: FONT,
});

const selectStyle = (hasError) => ({
  ...inputStyle(hasError),
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  paddingRight: '1.8rem',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.5rem center',
});

function RegisterCaretakerModal({ properties, onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    assigned_property: "", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  }

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
    if (Object.keys(e).length) {
      setErrors(e);
      toast.warning("Please fill all required fields.");
      return;
    }
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', background: 'rgba(44,62,80,0.5)',
    }}>
      <div style={{
        width: '100%', maxWidth: 500, background: '#fdfdfd',
        border: '1px solid #e9ecef', borderRadius: '3px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.9rem 1.2rem', borderBottom: '1px solid #e9ecef',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FiUserPlus size={18} color="#2c3e50" />
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#000', margin: 0 }}>
                Register Caretaker
              </h3>
              <p style={{ fontSize: '11px', color: '#555', margin: 0 }}>
                They will receive a welcome email with login details
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: '#555', fontSize: '18px', lineHeight: 1,
          }}>
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: '1rem 1.2rem',
          display: 'flex', flexDirection: 'column', gap: '0.8rem',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{
                fontSize: '11px', fontWeight: 600, color: '#333',
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                First Name{errors.first_name && <span style={{ color: '#c0392b', textTransform: 'none', marginLeft: '0.3rem' }}>— {errors.first_name}</span>}
              </label>
              <input value={form.first_name} onChange={e => set("first_name", e.target.value)}
                style={inputStyle(errors.first_name)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
              <label style={{
                fontSize: '11px', fontWeight: 600, color: '#333',
                textTransform: 'uppercase', letterSpacing: '0.04em',
              }}>
                Last Name{errors.last_name && <span style={{ color: '#c0392b', textTransform: 'none', marginLeft: '0.3rem' }}>— {errors.last_name}</span>}
              </label>
              <input value={form.last_name} onChange={e => set("last_name", e.target.value)}
                style={inputStyle(errors.last_name)} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{
              fontSize: '11px', fontWeight: 600, color: '#333',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Email{errors.email && <span style={{ color: '#c0392b', textTransform: 'none', marginLeft: '0.3rem' }}>— {errors.email}</span>}
            </label>
            <input type="email" value={form.email} onChange={e => set("email", e.target.value)}
              style={inputStyle(errors.email)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{
              fontSize: '11px', fontWeight: 600, color: '#333',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Phone{errors.phone && <span style={{ color: '#c0392b', textTransform: 'none', marginLeft: '0.3rem' }}>— {errors.phone}</span>}
            </label>
            <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)}
              style={inputStyle(errors.phone)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{
              fontSize: '11px', fontWeight: 600, color: '#333',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Assigned Property{errors.assigned_property && <span style={{ color: '#c0392b', textTransform: 'none', marginLeft: '0.3rem' }}>— {errors.assigned_property}</span>}
            </label>
            <select value={form.assigned_property} onChange={e => set("assigned_property", e.target.value)}
              style={selectStyle(errors.assigned_property)}>
              <option value="">Select a property</option>
              {properties.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}{p.caretaker_name ? ` (Current: ${p.caretaker_name})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{
              fontSize: '11px', fontWeight: 600, color: '#333',
              textTransform: 'uppercase', letterSpacing: '0.04em',
            }}>
              Notes <span style={{ color: '#555', textTransform: 'none', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea rows={2} value={form.notes} onChange={e => set("notes", e.target.value)}
              placeholder="Any notes about this caretaker..."
              style={{ ...inputStyle(false), resize: 'vertical', minHeight: 50 }} />
          </div>

          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.4rem',
            padding: '0.6rem 0.8rem', borderRadius: '2px',
            background: '#eaf2f8', border: '1px solid #b0cfe0',
          }}>
            <FiInfo size={13} color="#2c6b9b" style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '11px', color: '#1e4a6b', lineHeight: 1.4, margin: 0 }}>
              The caretaker will receive a welcome email with a temporary password.
              They will manage maintenance and complaints for their assigned property only.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: '0.8rem', padding: '0.9rem 1.2rem 1.2rem',
          borderTop: '1px solid #e9ecef',
        }}>
          <button onClick={onClose} disabled={loading}
            style={{ ...outlineBtnStyle, flex: 1, justifyContent: 'center' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            style={{
              ...primaryBtnStyle, flex: 1, justifyContent: 'center',
              opacity: loading ? 0.7 : 1,
            }}>
            {loading ? (
              <span style={{
                width: 14, height: 14,
                border: '2px solid rgba(255,255,255,0.3)',
                borderTopColor: '#ffffff', borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }} />
            ) : (
              <><FiUserPlus size={14} /> Register Caretaker</>
            )}
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
      await axios.put(`${API}/landlord/caretakers/${caretaker.id}/assign-property`,
        { property_id: propertyId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onAssign(caretaker.id, propertyId);
      onClose();
    } catch (err) {
      /* handle error */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1rem', background: 'rgba(44,62,80,0.5)',
    }}>
      <div style={{
        width: '100%', maxWidth: 400, background: '#fdfdfd',
        border: '1px solid #e9ecef', borderRadius: '3px',
        padding: '1.2rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        <h3 style={{ fontSize: '15px', fontWeight: 500, color: '#000', margin: '0 0 0.3rem' }}>
          Assign Property
        </h3>
        <p style={{ fontSize: '11px', color: '#555', margin: '0 0 1rem' }}>
          {caretaker.name} — current: {caretaker.property_name || "None"}
        </p>
        <select value={propertyId} onChange={e => setPropertyId(e.target.value)}
          style={{ ...selectStyle(false), marginBottom: '1rem' }}>
          <option value="">Select property</option>
          {properties.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button onClick={onClose}
            style={{ ...outlineBtnStyle, flex: 1, justifyContent: 'center' }}>
            Cancel
          </button>
          <button onClick={handleAssign} disabled={!propertyId || loading}
            style={{
              ...primaryBtnStyle, flex: 1, justifyContent: 'center',
              opacity: propertyId ? 1 : 0.5,
            }}>
            Assign
          </button>
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
  const [statusFilter, setStatusFilter] = useState("All");
  const [propertyFilter, setPropertyFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
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
    } finally {
      setLoading(false);
    }
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
    } catch {
      toast.error("Failed to update status");
    }
  }

  const FILTERS = ["All", "Active", "Inactive", "Assigned", "Unassigned"];
  const propertyNames = ["All", ...new Set(properties.map(p => p.name))];

  const filtered = caretakers.filter(c => {
    if (statusFilter === "Active") return c.status === "active";
    if (statusFilter === "Inactive") return c.status === "inactive";
    if (statusFilter === "Assigned") return !!c.property_name;
    if (statusFilter === "Unassigned") return !c.property_name;
    if (propertyFilter !== "All" && c.property_name !== propertyFilter) return false;
    const q = search.toLowerCase();
    return !q || [c.name, c.email, c.phone, c.property_name].some(s => (s || "").toLowerCase().includes(q));
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCaretakers = filtered.slice(startIndex, startIndex + pageSize);

  useEffect(() => { setPage(1); }, [statusFilter, propertyFilter, search, pageSize]);

  return (
    <div style={{ fontFamily: FONT, fontSize: '14px', fontWeight: 400, color: '#000', background: '#ffffff', padding: '1rem' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Modals */}
      {showRegister && <RegisterCaretakerModal properties={properties} onClose={() => setShowRegister(false)} onCreated={handleCreated} />}
      {assignModal && <AssignPropertyModal caretaker={assignModal} properties={properties} onClose={() => setAssignModal(null)} onAssign={handleAssign} />}

      {/* Breadcrumb */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem',
        fontSize: '14px', color: '#333', padding: '0.55rem 0.8rem',
        background: '#fdfdfd', boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        border: '1px solid #e9ecef',
      }}>
        <FiChevronRight size={13} style={{ color: '#555' }} />
        <Link to="/landlord/dashboard" style={{ color: '#2471a3', textDecoration: 'none' }}>Dashboard</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>Caretakers</span>
      </div>

      {/* Main card */}
      <div style={{
        background: '#fdfdfd', border: '1px solid #dfe3e8', borderRadius: '3px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{
          background: '#f7f8fa', padding: '0.4rem 0 0.2rem 0.7rem', borderBottom: '3px solid #3498db',
        }}>
          <h4 style={{
            fontSize: "16px",
            color: "#000",
            fontFamily: FONT,
            background: "transparent",
            margin: 0,
          }}>
            List of caretakers
          </h4>
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.85rem 1.1rem', gap: '1rem', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '0.6rem' }}>
            <button
              onClick={() => setShowRegister(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: '#ffffff', color: '#000', border: '1px solid #d0d1d3',
                borderRadius: '2px', padding: '0.3rem 0.6rem', fontSize: '14px',
                fontWeight: 400, cursor: 'pointer', fontFamily: FONT,
              }}
            >
              <FaPlus size={14} /> Add Caretaker
            </button>
            <button onClick={fetchData} style={outlineBtnStyle}>
              <FiRefreshCw size={14} /> Refresh
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ position: 'relative', width: '240px' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input
                type="text"
                placeholder="Search caretakers..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: '0.3rem 0.75rem 0.3rem 2rem', fontSize: '14px',
                  border: '1px solid #d0d1d3', borderRadius: '2px', width: '240px',
                  fontFamily: FONT, color: '#000', outline: 'none',
                }}
              />
            </div>

            {/* Status filter dropdown */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rb-select"
              style={{ border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.3rem 1.5rem 0.3rem 0.5rem', background: '#fdfdfd', color: '#000', fontFamily: FONT }}
            >
              {FILTERS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>

            {/* Property filter dropdown */}
            <select
              value={propertyFilter}
              onChange={e => setPropertyFilter(e.target.value)}
              className="rb-select"
              style={{ border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.3rem 1.5rem 0.3rem 0.5rem', background: '#fdfdfd', color: '#000', fontFamily: FONT }}
            >
              {propertyNames.map(p => <option key={p} value={p}>{p === "All" ? "All Properties" : p}</option>)}
            </select>

            {/* Page size dropdown */}
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="rb-select"
              style={{ border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.3rem 1.5rem 0.3rem 0.5rem', background: '#fdfdfd', color: '#000', fontFamily: FONT, marginRight: '0.6rem' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.6rem',
            padding: '0.6rem 1rem', margin: '0 0 1rem',
            background: '#fbeaea', border: '1px solid #e5bdbd',
          }}>
            <FiAlertCircle size={14} color="#9e3a3a" />
            <span style={{ fontSize: '14px', color: '#9e3a3a', flex: 1 }}>{error}</span>
            <button onClick={fetchData} style={{ ...outlineBtnStyle, padding: '0.25rem 0.8rem', fontSize: '13px' }}>
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#555' }}>
            <span style={{
              width: 20, height: 20,
              border: '2px solid rgba(44,62,80,0.1)',
              borderTopColor: '#2c3e50', borderRadius: '50%',
              animation: 'spin 0.6s linear infinite', display: 'inline-block',
            }} />
            <span style={{ marginLeft: '0.5rem' }}>Loading caretakers...</span>
          </div>
        ) : paginatedCaretakers.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#555' }}>
            <p>No caretakers match your filters.</p>
            <button onClick={() => { setSearch(""); setStatusFilter("All"); setPropertyFilter("All"); }} style={{ background: 'none', border: 'none', color: '#2471a3', cursor: 'pointer', textDecoration: 'underline', marginTop: '0.5rem' }}>
              Clear all filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', margin: '0 1.7rem 1.7rem 1.7rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}></th>
                  <th style={thStyle}>Caretaker</th>
                  <th style={thStyle}>Contact</th>
                  <th style={thStyle}>Assigned Property</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Registered</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCaretakers.map((c, index) => {
                  const caretakerId = `CAR${String((currentPage - 1) * pageSize + index + 1).padStart(6, "0")}`;
                  return (
                    <tr key={c.id}
                      className="rb-row"
                      onMouseEnter={e => e.currentTarget.style.background = '#fafbfc'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: '#2471a3', fontSize: '13px' }}>
                          {caretakerId}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: '#eaf2f8', color: '#2c6b9b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 600, fontSize: '14px', flexShrink: 0,
                          }}>
                            {c.initials}
                          </div>
                          <div>
                            <p style={{ fontWeight: 600, color: '#000', fontSize: '13px', margin: 0 }}>{c.name}</p>
                            {c.notes && (
                              <p style={{ fontSize: '11px', color: '#555', margin: 0, maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.notes}>
                                {c.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '12px', color: '#333', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FiMail size={10} /> {c.email || "—"}
                          </span>
                          <span style={{ fontSize: '12px', color: '#333', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FiPhone size={10} /> {c.phone || "—"}
                          </span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {c.property_name ? (
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#1a4a30' }}>{c.property_name}</span>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#555', fontStyle: 'italic' }}>Unassigned</span>
                        )}
                      </td>
                      <td style={tdStyle}><StatusBadge status={c.status} /></td>
                      <td style={{ ...tdStyle, fontSize: '12px', color: '#333' }}>
                        {formatDate(c.created_at)}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                          <button onClick={() => setAssignModal(c)}
                            style={{ fontSize: '12px', fontWeight: 500, color: '#2471a3', background: 'none', border: 'none', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                            Assign
                          </button>
                          <button onClick={() => handleToggleStatus(c.id, c.status)}
                            style={{ fontSize: '12px', fontWeight: 500, color: c.status === 'active' ? '#9e3a3a' : '#2b7a4b', background: 'none', border: 'none', cursor: 'pointer' }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                            {c.status === 'active' ? 'Deactivate' : 'Activate'}
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

        {/* Footer with pagination */}
        {!loading && paginatedCaretakers.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0 1.7rem 1.7rem', marginTop: '-1.5rem',
            fontSize: '13px', color: '#333',
          }}>
            <span>
              Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} caretakers
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  style={{ padding: '0.2rem 0.5rem', border: '1px solid #d0d1d3', background: '#fdfdfd', color: '#000', cursor: 'pointer', fontSize: '13px', borderRadius: '2px' }}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: '0.2rem 0.5rem',
                      border: p === currentPage ? '1px solid #2c3e50' : '1px solid #d0d1d3',
                      background: p === currentPage ? '#2c3e50' : '#fdfdfd',
                      color: p === currentPage ? '#ffffff' : '#000',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: p === currentPage ? 600 : 400,
                      borderRadius: '2px',
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  style={{ padding: '0.2rem 0.5rem', border: '1px solid #d0d1d3', background: '#fdfdfd', color: '#000', cursor: 'pointer', fontSize: '13px', borderRadius: '2px' }}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}