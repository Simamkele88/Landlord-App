/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../contexts/ToastContext";
import {
  FiChevronRight, FiChevronDown, FiPlus, FiCheck, FiX
} from "react-icons/fi";

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const UNIT_TYPES = ["studio", "1_bedroom", "2_bedroom", "3_bedroom", "4_bedroom", "penthouse"];

const typeLabel = (t) =>
  ({ studio: "Studio", "1_bedroom": "1 Bed", "2_bedroom": "2 Bed", "3_bedroom": "3 Bed", "4_bedroom": "4 Bed", penthouse: "Penthouse" })[t] ?? t;

const statusOptions = ["vacant", "occupied", "maintenance", "reserved"];

const inputStyle = {
  width: '100%',
  fontSize: '14px',
  padding: '0.4rem 0.6rem',
  borderRadius: '2px',
  background: '#fdfdfd',
  border: '1px solid #dee2e6',
  color: '#000',
  fontFamily: FONT,
  outline: 'none',
  transition: 'border-color 0.15s',
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

const fieldWrap = { marginBottom: '0.6rem' };
const labelStyle = { display: 'block', fontSize: '13px', fontWeight: 500, color: '#000', marginBottom: '0.25rem' };
const sectionTitle = { fontSize: '14px', fontWeight: 600, color: '#000', margin: '1rem 0 0.6rem' };

const outlineBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '0.35rem',
  background: '#fdfdfd', color: '#000', border: '1px solid #ccc',
  padding: '0.3rem 0.6rem', fontSize: '14px', fontWeight: 400,
  cursor: 'pointer', borderRadius: '2px',
};

const primaryBtnStyle = {
  ...outlineBtnStyle,
  background: '#2c3e50',
  color: '#ffffff',
  border: '1px solid #2c3e50',
};

export default function AddUnitPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [properties, setProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    property_id: '',
    unit_number: '',
    unit_type: '1_bedroom',
    floor_number: '',
    bedrooms: '',
    bathrooms: '',
    square_meters: '',
    monthly_rent: '',
    deposit_amount: '',
    status: 'vacant',
    furnished: false,
    parking_bay: false,
    has_balcony: false,
    has_garden: false,
    available_from: '',
    notes: '',
  });

  const fetchProperties = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API}/properties`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProperties(data.properties || []);
    } catch (err) {
      toast.error('Failed to load properties.');
    } finally {
      setLoadingProperties(false);
    }
  }, [toast]);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const next = {};
    if (!form.property_id) next.property_id = 'Property is required';
    if (!String(form.unit_number).trim()) next.unit_number = 'Unit number is required';
    if (!form.monthly_rent || Number(form.monthly_rent) <= 0) next.monthly_rent = 'Valid rent amount required';
    if (form.available_from && new Date(form.available_from) < new Date()) next.available_from = 'Cannot be in the past';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        property_id: form.property_id,
        unit_number: String(form.unit_number),
        unit_type: form.unit_type,
        floor_number: form.floor_number ? parseInt(form.floor_number) : null,
        bedrooms: form.bedrooms ? parseInt(form.bedrooms) : null,
        bathrooms: form.bathrooms ? parseInt(form.bathrooms) : null,
        square_meters: form.square_meters ? parseFloat(form.square_meters) : null,
        monthly_rent: parseFloat(form.monthly_rent),
        deposit_amount: form.deposit_amount ? parseFloat(form.deposit_amount) : null,
        status: form.status,
        furnished: form.furnished,
        parking_bay: form.parking_bay,
        has_balcony: form.has_balcony,
        has_garden: form.has_garden,
        available_from: form.available_from || null,
        notes: form.notes || null,
      };

      const { data } = await axios.post(`${API}/properties/${form.property_id}/units`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success('Unit added successfully!');
      navigate('/landlord/units');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add unit.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ fontFamily: FONT, fontSize: '14px', fontWeight: 400, color: '#000', background: '#ffffff' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus, textarea:focus { border-color: #3498db !important; box-shadow: 0 0 0 2px rgba(52,152,219,0.1); }
      `}</style>

      {/* Breadcrumb */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem',
        fontSize: '14px', fontWeight: 400, color: '#333', padding: '0.55rem 0.8rem',
        background: '#fdfdfd', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', border: '1px solid #e9ecef',
      }}>
        <FiChevronRight size={13} style={{ color: '#555' }} />
        <Link to="/landlord/dashboard" style={{ color: '#2471a3', textDecoration: 'none' }}>Dashboard</Link>
        <span style={{ color: '#555' }}>/</span>
        <Link to="/landlord/units" style={{ color: '#2471a3', textDecoration: 'none' }}>Units</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>Add Unit</span>
      </div>

      {/* Main card */}
      <div style={{
        background: '#fdfdfd', border: '1px solid #dfe3e8', borderRadius: '3px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: '#f7f8fa', padding: '0.8rem 1.2rem', borderBottom: '3px solid #3498db',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 500, color: '#000', margin: 0 }}>Add New Unit</h2>
          <button onClick={() => navigate('/landlord/units')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#555' }}>
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.2rem' }}>
          {/* Property & basic info */}
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
            <div style={{ flex: '1 1 260px', minWidth: 220 }}>
              <label style={labelStyle}>Property *</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={form.property_id}
                  onChange={e => setField('property_id', e.target.value)}
                  style={{ ...selectStyle, borderColor: errors.property_id ? '#9e3a3a' : '#dee2e6' }}
                  disabled={loadingProperties}
                >
                  <option value="">Select property</option>
                  {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <FiChevronDown size={14} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#555' }} />
              </div>
              {errors.property_id && <div style={{ fontSize: '12px', color: '#9e3a3a', marginTop: '0.2rem' }}>{errors.property_id}</div>}
            </div>

            <div style={{ flex: '1 1 160px', minWidth: 120 }}>
              <label style={labelStyle}>Unit Number *</label>
              <input
                type="text"
                value={form.unit_number}
                onChange={e => setField('unit_number', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.unit_number ? '#9e3a3a' : '#dee2e6' }}
              />
              {errors.unit_number && <div style={{ fontSize: '12px', color: '#9e3a3a', marginTop: '0.2rem' }}>{errors.unit_number}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
            <div style={{ flex: '1 1 200px', minWidth: 140 }}>
              <label style={labelStyle}>Unit Type</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={form.unit_type}
                  onChange={e => setField('unit_type', e.target.value)}
                  style={selectStyle}
                >
                  {UNIT_TYPES.map(t => <option key={t} value={t}>{typeLabel(t)}</option>)}
                </select>
                <FiChevronDown size={14} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#555' }} />
              </div>
            </div>

            <div style={{ flex: '1 1 120px', minWidth: 90 }}>
              <label style={labelStyle}>Floor</label>
              <input
                type="number"
                min="0"
                value={form.floor_number}
                onChange={e => setField('floor_number', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 120px', minWidth: 90 }}>
              <label style={labelStyle}>Status</label>
              <div style={{ position: 'relative' }}>
                <select
                  value={form.status}
                  onChange={e => setField('status', e.target.value)}
                  style={selectStyle}
                >
                  {statusOptions.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                <FiChevronDown size={14} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#555' }} />
              </div>
            </div>
          </div>

          {/* Dimensions */}
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
            <div style={{ flex: '1 1 120px', minWidth: 90 }}>
              <label style={labelStyle}>Bedrooms</label>
              <input type="number" min="0" value={form.bedrooms} onChange={e => setField('bedrooms', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: '1 1 120px', minWidth: 90 }}>
              <label style={labelStyle}>Bathrooms</label>
              <input type="number" min="0" value={form.bathrooms} onChange={e => setField('bathrooms', e.target.value)} style={inputStyle} />
            </div>
            <div style={{ flex: '1 1 140px', minWidth: 100 }}>
              <label style={labelStyle}>Size (m²)</label>
              <input type="number" step="0.01" min="0" value={form.square_meters} onChange={e => setField('square_meters', e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Financials */}
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
            <div style={{ flex: '1 1 160px', minWidth: 120 }}>
              <label style={labelStyle}>Monthly Rent (R) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.monthly_rent}
                onChange={e => setField('monthly_rent', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.monthly_rent ? '#9e3a3a' : '#dee2e6' }}
              />
              {errors.monthly_rent && <div style={{ fontSize: '12px', color: '#9e3a3a', marginTop: '0.2rem' }}>{errors.monthly_rent}</div>}
            </div>
            <div style={{ flex: '1 1 160px', minWidth: 120 }}>
              <label style={labelStyle}>Deposit Amount (R)</label>
              <input type="number" min="0" step="0.01" value={form.deposit_amount} onChange={e => setField('deposit_amount', e.target.value)} style={inputStyle} />
            </div>
          </div>

          {/* Amenities */}
          <h3 style={sectionTitle}>Amenities</h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {[
              { key: 'furnished', label: 'Furnished' },
              { key: 'parking_bay', label: 'Parking Bay' },
              { key: 'has_balcony', label: 'Balcony' },
              { key: 'has_garden', label: 'Garden' },
            ].map(item => (
              <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '14px', color: '#000', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form[item.key]}
                  onChange={e => setField(item.key, e.target.checked)}
                />
                {item.label}
              </label>
            ))}
          </div>

          {/* Dates & notes */}
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '0.8rem' }}>
            <div style={{ flex: '1 1 200px', minWidth: 160 }}>
              <label style={labelStyle}>Available From</label>
              <input type="date" value={form.available_from} onChange={e => setField('available_from', e.target.value)} style={{ ...inputStyle, borderColor: errors.available_from ? '#9e3a3a' : '#dee2e6' }} />
              {errors.available_from && <div style={{ fontSize: '12px', color: '#9e3a3a', marginTop: '0.2rem' }}>{errors.available_from}</div>}
            </div>
            <div style={{ flex: '1 1 260px', minWidth: 200 }}>
              <label style={labelStyle}>Notes</label>
              <textarea rows={3} value={form.notes} onChange={e => setField('notes', e.target.value)} style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', paddingTop: '1rem', borderTop: '1px solid #e9ecef', marginTop: '1rem' }}>
            <button type="button" onClick={() => navigate('/landlord/units')} style={outlineBtnStyle}>
              Cancel
            </button>
            <button type="submit" disabled={saving || loadingProperties} style={primaryBtnStyle}>
              {saving ? (
                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              ) : (
                <FiPlus size={14} />
              )}
              {saving ? 'Adding...' : 'Add Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}