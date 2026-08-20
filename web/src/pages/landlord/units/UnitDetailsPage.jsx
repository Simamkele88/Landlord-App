import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import {
  FiChevronRight, FiEdit, FiFileText, FiTool, FiHome,
  FiDollarSign, FiUser, FiLayers, FiMaximize, FiTruck,
  FiShield, FiDroplet, FiCheck, FiX, FiSearch,
  FiSave, FiTrash2, FiAlertTriangle
} from "react-icons/fi";
import { IoMdCash } from "react-icons/io";

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const TABS = [
  { id: "unit", label: "Unit", icon: FiHome },
  { id: "financials", label: "Financials", icon: IoMdCash },
  { id: "maintenance", label: "Maintenance", icon: FiTool },
];

const statusConfig = {
  "occupied":    { color: "#2b7a4b", bg: "#eef5e8", border: "1px solid #c5d9b8", dot: "#2b7a4b", label: "Occupied" },
  "vacant":      { color: "#2c6b9b", bg: "#e8f0f5", border: "1px solid #b0cfe0", dot: "#2c6b9b", label: "Vacant" },
  "maintenance": { color: "#8b6e1a", bg: "#faf6ed", border: "1px solid #e5dbb8", dot: "#8b6e1a", label: "Maintenance" },
  "reserved":    { color: "#54326b", bg: "#eee7f3", border: "1px solid #d1c2dc", dot: "#54326b", label: "Reserved" },
};

function formatAmount(n) {
  return n ? `R ${Number(n).toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";
}
function fmtDate(d) {
  return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function InfoRow({ label, children, compact }) {
  const labelWidth = compact ? "110px" : "150px";
  return (
    <div style={{
      display: 'flex', overflow: 'hidden', border: '1px solid #e2e3e4',
      marginBottom: '0.4rem', fontSize: '14px', fontWeight: 400,
      flex: compact ? 1 : undefined,
    }}>
      <div style={{
        width: labelWidth, flexShrink: 0, padding: '0.4rem 0.6rem',
        color: '#000', fontWeight: 500, background: '#fdfdfd',
        borderRight: '1px solid #e9ecef', display: 'flex', alignItems: 'center',
      }}>
        {label}
      </div>
      <div style={{
        padding: '0.4rem 0.6rem', color: '#000', background: '#f5f5f5',
        flex: 1, display: 'flex', alignItems: 'center', fontWeight: 400,
      }}>
        {children}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = statusConfig[status] ?? statusConfig["vacant"];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '12px', fontWeight: 500, padding: '0.15rem 0.6rem',
      borderRadius: '12px', color: cfg.color, background: cfg.bg, border: cfg.border,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

const thStyle = {
  padding: '0.6rem 0.8rem', fontSize: '12px', fontWeight: 600, color: '#000',
  textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e9eced52',
  border: '1px solid #9a9d9e52', textAlign: 'left', whiteSpace: 'nowrap',
};
const tdStyle = {
  padding: '0.6rem 0.8rem', fontSize: '12px', color: '#151515',
  border: '1px solid #9a9d9e52', verticalAlign: 'middle', fontWeight: 400,
  background: '#e9eced52',
};

const inputStyle = {
  width: '100%',
  fontSize: '14px',
  padding: '0.4rem 0.7rem',
  borderRadius: '2px',
  background: '#fdfdfd',
  border: '1px solid #dee2e6',
  color: '#000',
  fontFamily: FONT,
  outline: 'none',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.5rem center',
  paddingRight: '1.8rem',
};

export default function UnitDetailPage() {
  useDocumentTitle("Unit Details");
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [unit, setUnit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("unit");

  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchUnit = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/units/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnit(data.unit || data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load unit");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchUnit(); }, [fetchUnit]);

  function startEdit() {
    setForm({
      unit_number: unit.unit_number || "",
      unit_type: unit.unit_type || "studio",
      floor_number: unit.floor_number ?? "",
      bedrooms: unit.bedrooms ?? "",
      bathrooms: unit.bathrooms ?? "",
      square_meters: unit.square_meters ?? "",
      monthly_rent: unit.monthly_rent ?? "",
      deposit_amount: unit.deposit_amount ?? "",
      status: unit.status || "vacant",
      furnished: unit.furnished || false,
      parking_bay: unit.parking_bay || false,
      has_balcony: unit.has_balcony || false,
      has_garden: unit.has_garden || false,
      available_from: unit.available_from || "",
      notes: unit.notes || "",
    });
    setEditMode(true);
  }

  function handleFormChange(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  async function saveEdit() {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        unit_number: String(form.unit_number),
        unit_type: form.unit_type,
        floor_number: form.floor_number ? parseInt(form.floor_number) : null,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        square_meters: form.square_meters ? parseFloat(form.square_meters) : null,
        monthly_rent: parseFloat(form.monthly_rent),
        deposit_amount: form.deposit_amount ? parseFloat(form.deposit_amount) : null,
        status: form.status,
        furnished: form.furnished || false,
        parking_bay: form.parking_bay || false,
        has_balcony: form.has_balcony || false,
        has_garden: form.has_garden || false,
        available_from: form.available_from || null,
        notes: form.notes || null,
      };
      await axios.put(`${API}/units/${id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Unit updated!");
      setEditMode(false);
      fetchUnit();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update unit.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/units/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Unit deleted.");
      navigate("/landlord/units");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete unit.");
      setDeleteModalOpen(false);
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '4rem 2rem', color: '#555', fontFamily: FONT }}>
        <span style={{ width: 22, height: 22, border: '2px solid rgba(44,62,80,0.1)', borderTopColor: '#2c3e50', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
        <span style={{ fontSize: '14px' }}>Loading unit...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !unit) {
    return (
      <div style={{ padding: '3rem 2rem', textAlign: 'center', fontFamily: FONT }}>
        <p style={{ fontSize: '14px', color: '#c0392b', marginBottom: '0.8rem' }}>{error || "Unit not found"}</p>
        <button onClick={fetchUnit} style={{ background: 'transparent', color: '#2471a3', border: 'none', cursor: 'pointer', fontSize: '14px', textDecoration: 'underline' }}>
          Try again
        </button>
      </div>
    );
  }

  const deletable = !unit.lease_id || unit.lease_status !== "active";

  return (
    <div style={{ fontSize: '14px', fontWeight: 400, fontFamily: FONT, color: '#000' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .rb-link { color: #2471a3; text-decoration: none; font-size: 14px; }
        .rb-link:hover { text-decoration: underline; }
        .rb-row:hover { background: #fafbfc; }
      `}</style>

      {/* Breadcrumb */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem',
        fontSize: '14px', fontWeight: 400, color: '#333', padding: '0.55rem 0.8rem',
        background: '#fdfdfd', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', border: '1px solid #e9ecef',
      }}>
        <FiChevronRight size={13} style={{ color: '#555' }} />
        <Link to="/landlord/dashboard" className="rb-link">Dashboard</Link>
        <span style={{ color: '#555' }}>/</span>
        <Link to="/landlord/units" className="rb-link">Units</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>Unit {unit.unit_number}</span>
      </div>

      {/* Main card */}
      <div style={{
        background: '#fdfdfd', border: '1px solid #dfe3e8', borderRadius: '3px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden',
      }}>
        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'flex-end', background: '#eee' }}>
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 0.8rem',
                  fontSize: '14px', fontWeight: active ? 500 : 400,
                  color: active ? '#000' : '#333',
                  background: active ? '#fdfdfd' : 'transparent',
                  border: active ? '1px solid #e9ecef' : '1px solid transparent',
                  borderBottom: active ? '1px solid #fdfdfd' : 'none',
                  borderTop: active ? '2px solid #3498db' : '2px solid transparent',
                  cursor: 'pointer', marginBottom: active ? '-1px' : '0',
                  position: 'relative', zIndex: active ? 2 : 1,
                  transition: 'background 0.15s, border-color 0.15s',
                }}
              >
                <TabIcon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ border: '1px solid #e9ecef', minHeight: '300px', margin: '0.8rem 0.6rem 1.6rem', boxShadow: '1px 1px 1px 1px rgba(0,0,0,0.05)', borderRadius: '2px' }}>
          {/* Unit Tab */}
          {activeTab === "unit" && (
            <div style={{ padding: '1.2rem' }}>
              {/* Deletability notice */}
              {!deletable && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.6rem 0.9rem', marginBottom: '0.8rem',
                  background: '#fbeaea', border: '1px solid #e5bdbd',
                  borderRadius: '2px', color: '#9e3a3a', fontSize: '13px',
                }}>
                  <FiAlertTriangle size={14} />
                  This unit has an active lease and cannot be deleted. Please terminate the lease first.
                </div>
              )}

              {editMode ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Unit Number</label>
                      <input
                        type="text"
                        value={form.unit_number}
                        onChange={e => handleFormChange('unit_number', e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Floor</label>
                      <input
                        type="number"
                        value={form.floor_number}
                        onChange={e => handleFormChange('floor_number', e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Unit Type</label>
                      <select
                        value={form.unit_type}
                        onChange={e => handleFormChange('unit_type', e.target.value)}
                        style={selectStyle}
                      >
                        {["studio", "1_bedroom", "2_bedroom", "3_bedroom", "4_bedroom", "penthouse"].map(t => (
                          <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Status</label>
                      <select
                        value={form.status}
                        onChange={e => handleFormChange('status', e.target.value)}
                        style={selectStyle}
                      >
                        {["vacant", "occupied", "maintenance", "reserved"].map(s => (
                          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Bedrooms</label>
                      <input
                        type="number"
                        value={form.bedrooms}
                        onChange={e => handleFormChange('bedrooms', e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Bathrooms</label>
                      <input
                        type="number"
                        value={form.bathrooms}
                        onChange={e => handleFormChange('bathrooms', e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 150 }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Size (m²)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={form.square_meters}
                        onChange={e => handleFormChange('square_meters', e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Monthly Rent (R)</label>
                      <input
                        type="number"
                        value={form.monthly_rent}
                        onChange={e => handleFormChange('monthly_rent', e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                      <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Deposit Amount (R)</label>
                      <input
                        type="number"
                        value={form.deposit_amount}
                        onChange={e => handleFormChange('deposit_amount', e.target.value)}
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '14px', color: '#000' }}>
                      <input
                        type="checkbox"
                        checked={form.furnished}
                        onChange={e => handleFormChange('furnished', e.target.checked)}
                      /> Furnished
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '14px', color: '#000' }}>
                      <input
                        type="checkbox"
                        checked={form.parking_bay}
                        onChange={e => handleFormChange('parking_bay', e.target.checked)}
                      /> Parking Bay
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '14px', color: '#000' }}>
                      <input
                        type="checkbox"
                        checked={form.has_balcony}
                        onChange={e => handleFormChange('has_balcony', e.target.checked)}
                      /> Balcony
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '14px', color: '#000' }}>
                      <input
                        type="checkbox"
                        checked={form.has_garden}
                        onChange={e => handleFormChange('has_garden', e.target.checked)}
                      /> Garden
                    </label>
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Available From</label>
                    <input
                      type="date"
                      value={form.available_from}
                      onChange={e => handleFormChange('available_from', e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.3rem' }}>Notes</label>
                    <textarea
                      rows={3}
                      value={form.notes}
                      onChange={e => handleFormChange('notes', e.target.value)}
                      style={{ ...inputStyle, resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '0.5rem' }}>
                    <button
                      onClick={() => setEditMode(false)}
                      style={{ background: '#fdfdfd', color: '#000', border: '1px solid #ccc', padding: '0.4rem 0.8rem', borderRadius: '2px', cursor: 'pointer', fontSize: '14px' }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      style={{ background: '#2c3e50', color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '2px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      {saving ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <FiSave size={14} />}
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <InfoRow label="Property" compact>{unit.property_name || "—"}</InfoRow>
                    <InfoRow label="Status" compact><StatusBadge status={unit.status} /></InfoRow>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <InfoRow label="Unit Type" compact>{(unit.unit_type || "").replace(/_/g, " ")}</InfoRow>
                    <InfoRow label="Floor" compact>{unit.floor_number || "—"}</InfoRow>
                  </div>
                  <InfoRow label="Size">{unit.square_meters ? `${unit.square_meters} m²` : "—"}</InfoRow>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <InfoRow label="Bedrooms" compact>{unit.bedrooms || "—"}</InfoRow>
                    <InfoRow label="Bathrooms" compact>{unit.bathrooms || "—"}</InfoRow>
                  </div>
                  <InfoRow label="Rent">{formatAmount(unit.monthly_rent)}</InfoRow>
                  <InfoRow label="Deposit">{formatAmount(unit.deposit_amount || unit.total_deposit)}</InfoRow>
                  <InfoRow label="Available From">{fmtDate(unit.available_from)}</InfoRow>

                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <InfoRow label="Furnished" compact>{unit.furnished ? "Yes" : "No"}</InfoRow>
                    <InfoRow label="Parking Bay" compact>{unit.parking_bay ? "Yes" : "No"}</InfoRow>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <InfoRow label="Balcony" compact>{unit.has_balcony ? "Yes" : "No"}</InfoRow>
                    <InfoRow label="Garden" compact>{unit.has_garden ? "Yes" : "No"}</InfoRow>
                  </div>

                  {unit.notes && <InfoRow label="Notes">{unit.notes}</InfoRow>}

                  {unit.tenant_name && (
                    <>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <InfoRow label="Tenant" compact>
                          <Link to={`/landlord/tenants/${unit.tenant_id}`} className="rb-link">{unit.tenant_name}</Link>
                        </InfoRow>
                        <InfoRow label="Phone" compact>{unit.tenant_phone || "—"}</InfoRow>
                      </div>
                      <InfoRow label="Email">{unit.tenant_email || "—"}</InfoRow>
                      <InfoRow label="Lease Term">
                        {fmtDate(unit.lease_start_date)} to {fmtDate(unit.lease_end_date)}
                      </InfoRow>
                    </>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', marginTop: '1rem' }}>
                    <button
                      onClick={startEdit}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#fdfdfd',
                        color: '#000', border: '1px solid #ccc', padding: '0.3rem 0.6rem',
                        fontSize: '14px', fontWeight: 400, cursor: 'pointer', borderRadius: '2px',
                      }}
                    >
                      <FiEdit size={14} /> Edit Unit
                    </button>
                    <button
                      onClick={() => setDeleteModalOpen(true)}
                      disabled={!deletable}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem', background: deletable ? '#fbeaea' : '#f5f5f5',
                        color: deletable ? '#9e3a3a' : '#999', border: '1px solid #ccc', padding: '0.3rem 0.6rem',
                        fontSize: '14px', fontWeight: 400, cursor: deletable ? 'pointer' : 'not-allowed', borderRadius: '2px',
                      }}
                    >
                      <FiTrash2 size={14} /> Delete Unit
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Financials Tab */}
          {activeTab === "financials" && (
            <div style={{ padding: '1.2rem' }}>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div style={{ flex: 1, minWidth: 200, border: '1px solid #ccc', borderRadius: '2px', overflow: 'hidden', boxShadow: '1px 1px 2px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', borderBottom: '2px solid #3498db', fontSize: '16px', fontWeight: 500, color: '#000' }}>
                    <IoMdCash size={16} /> Outstanding
                  </div>
                  <div style={{ padding: '0.8rem', textAlign: 'center', fontSize: '14px', color: '#000' }}>
                    <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '0.2rem' }}>
                      {formatAmount(unit.outstanding_balance)}
                    </div>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 200, border: '1px solid #ccc', borderRadius: '2px', overflow: 'hidden', boxShadow: '1px 1px 2px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', padding: '0.6rem', borderBottom: '2px solid #3498db', fontSize: '16px', fontWeight: 500, color: '#000' }}>
                    <FiFileText size={16} /> Deposit
                  </div>
                  <div style={{ padding: '0.8rem', textAlign: 'center', fontSize: '14px', color: '#000' }}>
                    <div style={{ fontSize: '18px', fontWeight: 600, marginBottom: '0.2rem' }}>
                      {formatAmount(unit.total_deposit)}
                    </div>
                  </div>
                </div>
              </div>

              {unit.invoices.length > 0 && (
                <>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: '0 0 0.5rem' }}>Recent Invoices</h3>
                  <div style={{ border: '1px solid #9a9d9e52', overflow: 'hidden', marginBottom: '1rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Invoice #</th>
                          <th style={thStyle}>Due Date</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Remaining</th>
                          <th style={thStyle}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unit.invoices.map(inv => (
                          <tr key={inv.id} className="rb-row">
                            <td style={tdStyle}>{inv.invoice_number}</td>
                            <td style={tdStyle}>{fmtDate(inv.due_date)}</td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>{formatAmount(inv.amount_due)}</td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>{formatAmount(inv.remaining_balance)}</td>
                            <td style={{ ...tdStyle, textTransform: 'capitalize' }}>{inv.status.replace(/_/g, " ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {unit.payments.length > 0 && (
                <>
                  <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: '0 0 0.5rem' }}>Recent Payments</h3>
                  <div style={{ border: '1px solid #9a9d9e52', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={thStyle}>Date</th>
                          <th style={thStyle}>Method</th>
                          <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                          <th style={thStyle}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unit.payments.map(pay => (
                          <tr key={pay.id} className="rb-row">
                            <td style={tdStyle}>{fmtDate(pay.payment_date)}</td>
                            <td style={tdStyle}>{pay.payment_method}</td>
                            <td style={{ ...tdStyle, textAlign: 'right' }}>{formatAmount(pay.amount_paid)}</td>
                            <td style={{ ...tdStyle, textTransform: 'capitalize' }}>{pay.status.replace(/_/g, " ")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {!unit.invoices.length && !unit.payments.length && (
                <p style={{ color: '#555', textAlign: 'center', padding: '2rem' }}>No financial activity yet.</p>
              )}
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === "maintenance" && (
            <div style={{ padding: '1.2rem' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#000', margin: '0 0 0.5rem' }}>Maintenance History</h3>
              {unit.maintenance_requests.length > 0 ? (
                <div style={{ border: '1px solid #9a9d9e52', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Title</th>
                        <th style={thStyle}>Category</th>
                        <th style={thStyle}>Priority</th>
                        <th style={thStyle}>Status</th>
                        <th style={thStyle}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unit.maintenance_requests.map(m => (
                        <tr key={m.id} className="rb-row">
                          <td style={tdStyle}>{m.title}</td>
                          <td style={{ ...tdStyle, textTransform: 'capitalize' }}>{m.category?.replace(/_/g, " ")}</td>
                          <td style={{ ...tdStyle, textTransform: 'capitalize' }}>{m.priority}</td>
                          <td style={{ ...tdStyle, textTransform: 'capitalize' }}>{m.status.replace(/_/g, " ")}</td>
                          <td style={tdStyle}>{fmtDate(m.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p style={{ color: '#555', textAlign: 'center', padding: '2rem' }}>No maintenance requests for this unit.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 50, display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '1rem',
          background: 'rgba(44,62,80,0.5)',
        }}>
          <div style={{
            width: '100%', maxWidth: 420, background: '#fdfdfd',
            border: '1px solid #e9ecef', borderRadius: '3px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)', padding: '1.2rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '1rem' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#fbeaea', border: '1px solid #e5bdbd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FiTrash2 size={18} color="#9e3a3a" />
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#000', margin: 0 }}>Delete Unit</h3>
                <p style={{ fontSize: '13px', color: '#333', margin: '0.2rem 0 0' }}>
                  Unit {unit.unit_number} · {unit.property_name}
                </p>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: '#333', lineHeight: 1.5, marginBottom: '1.2rem' }}>
              Are you sure you want to permanently delete this unit? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.8rem' }}>
              <button
                onClick={() => setDeleteModalOpen(false)}
                style={{ flex: 1, padding: '0.4rem', borderRadius: '2px', fontSize: '14px', fontWeight: 400, background: '#fdfdfd', color: '#000', border: '1px solid #ccc', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                style={{ flex: 1, padding: '0.4rem', borderRadius: '2px', fontSize: '14px', fontWeight: 500, border: 'none', cursor: 'pointer', background: '#9e3a3a', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
              >
                {deleting ? (
                  <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                ) : (
                  <FiTrash2 size={14} />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}