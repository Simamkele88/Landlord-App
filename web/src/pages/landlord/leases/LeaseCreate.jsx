/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import {
  FiChevronRight, FiSave, FiX, FiDroplet, FiZap, FiWifi, FiCheck,
} from "react-icons/fi";

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

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

const labelStyle = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#000',
  marginBottom: '0.3rem',
};

const fieldWrap = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.3rem',
};

export default function LeaseCreate() {
  useDocumentTitle("Create Lease");
  const navigate = useNavigate();
  const toast = useToast();

  const [tenants, setTenants] = useState([]);
  const [units, setUnits] = useState([]);
  const [form, setForm] = useState({
    tenant_id: "",
    unit_id: "",
    lease_start_date: "",
    lease_end_date: "",
    rent_amount: "",
    deposit_amount: "",
    payment_frequency: "monthly",
    payment_due_day: "",
    lease_type: "fixed",
    water_included: false,
    electricity_included: false,
    internet_included: false,
    late_fee_amount: "250",
    grace_period_days: "5",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function fetchOptions() {
      try {
        const token = localStorage.getItem("token");
        const [tenantsRes, unitsRes] = await Promise.all([
          axios.get(`${API}/tenants`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API}/units`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        const filteredTenants = (tenantsRes.data.tenants || []).filter(t => {
          const hasActiveLease =
            t.lease_status === "active" ||
            t.active_lease_id != null ||
            t.active_lease === true;
          return !hasActiveLease;
        });

        const filteredUnits = (unitsRes.data.units || []).filter(u => u.status !== "occupied");

        setTenants(filteredTenants);
        setUnits(filteredUnits);
      } catch (err) {
        toast.error("Failed to load tenants or units.");
      }
    }
    fetchOptions();
  }, [toast]);

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.tenant_id) e.tenant_id = "Select a tenant";
    if (!form.unit_id) e.unit_id = "Select a unit";
    if (!form.lease_start_date) e.lease_start_date = "Required";
    if (!form.lease_end_date) e.lease_end_date = "Required";
    if (form.lease_start_date && form.lease_end_date && new Date(form.lease_end_date) <= new Date(form.lease_start_date)) {
      e.lease_end_date = "End date must be after start date";
    }
    if (!form.rent_amount || Number(form.rent_amount) <= 0) e.rent_amount = "Enter a valid rent";
    if (form.deposit_amount && Number(form.deposit_amount) < 0) e.deposit_amount = "Invalid deposit";
    if (form.payment_frequency !== "weekly") {
      const dueDay = Number(form.payment_due_day);
      if (!form.payment_due_day || isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
        e.payment_due_day = "Between 1 and 31";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const payload = {
        tenant_id: form.tenant_id,
        unit_id: form.unit_id,
        lease_start_date: form.lease_start_date,
        lease_end_date: form.lease_end_date,
        rent_amount: Number(form.rent_amount),
        deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : null,
        payment_frequency: form.payment_frequency,
        payment_due_day: form.payment_frequency === "weekly" ? 1 : Number(form.payment_due_day),
        lease_type: form.lease_type,
        water_included: form.water_included,
        electricity_included: form.electricity_included,
        internet_included: form.internet_included,
        late_fee_amount: Number(form.late_fee_amount),
        grace_period_days: Number(form.grace_period_days),
        notes: form.notes || null,
      };

      const { data } = await axios.post(`${API}/leases`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Lease created!");
      navigate(`/landlord/leases/${data.lease?.id || data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create lease.");
    } finally {
      setSaving(false);
    }
  }

  const selectedTenant = tenants.find(t => t.id === form.tenant_id);
  const selectedUnit = units.find(u => u.id === form.unit_id);
  const isWeekly = form.payment_frequency === "weekly";

  return (
    <div style={{ fontSize: '14px', fontWeight: 400, fontFamily: FONT, color: '#000' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Breadcrumb */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem',
        fontSize: '14px', fontWeight: 400, color: '#333', padding: '0.55rem 0.8rem',
        background: '#fdfdfd', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', border: '1px solid #e9ecef',
      }}>
        <FiChevronRight size={13} style={{ color: '#555' }} />
        <Link to="/landlord/dashboard" className="rb-link">Dashboard</Link>
        <span style={{ color: '#555' }}>/</span>
        <Link to="/landlord/leases" className="rb-link">Leases</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>Create Lease</span>
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
          <h4 style={{ fontSize: '16px', color: '#000', margin: 0, fontFamily: FONT, fontWeight: 500 }}>
            Create a new lease
          </h4>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Tenant */}
            <div style={{ flex: '1 1 300px', ...fieldWrap }}>
              <label style={labelStyle}>Tenant{errors.tenant_id && <span style={{ color: '#c0392b', marginLeft: '0.4rem' }}>— {errors.tenant_id}</span>}</label>
              <select
                value={form.tenant_id}
                onChange={e => setField('tenant_id', e.target.value)}
                style={{ ...selectStyle, borderColor: errors.tenant_id ? '#c0392b' : '#dee2e6' }}
              >
                <option value="">Select tenant...</option>
                {tenants.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.full_name || `${t.first_name || ''} ${t.last_name || ''}`.trim()}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit */}
            <div style={{ flex: '1 1 300px', ...fieldWrap }}>
              <label style={labelStyle}>Unit{errors.unit_id && <span style={{ color: '#c0392b', marginLeft: '0.4rem' }}>— {errors.unit_id}</span>}</label>
              <select
                value={form.unit_id}
                onChange={e => setField('unit_id', e.target.value)}
                style={{ ...selectStyle, borderColor: errors.unit_id ? '#c0392b' : '#dee2e6' }}
              >
                <option value="">Select unit...</option>
                {units.map(u => (
                  <option key={u.id} value={u.id}>
                    Unit {u.unit_number} : {u.property_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* InfoRow summary of selected tenant and unit */}
          {(selectedTenant || selectedUnit) && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
              {selectedTenant && (
                <InfoRow label="Tenant" compact>
                  {selectedTenant.full_name || `${selectedTenant.first_name || ''} ${selectedTenant.last_name || ''}`.trim()}
                </InfoRow>
              )}
              {selectedUnit && (
                <InfoRow label="Unit" compact>
                  Unit {selectedUnit.unit_number} : {selectedUnit.property_name}
                </InfoRow>
              )}
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Start Date */}
            <div style={{ flex: '1 1 200px', ...fieldWrap }}>
              <label style={labelStyle}>Lease Start{errors.lease_start_date && <span style={{ color: '#c0392b', marginLeft: '0.4rem' }}>— {errors.lease_start_date}</span>}</label>
              <input
                type="date"
                value={form.lease_start_date}
                onChange={e => setField('lease_start_date', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.lease_start_date ? '#c0392b' : '#dee2e6' }}
              />
            </div>

            {/* End Date */}
            <div style={{ flex: '1 1 200px', ...fieldWrap }}>
              <label style={labelStyle}>Lease End{errors.lease_end_date && <span style={{ color: '#c0392b', marginLeft: '0.4rem' }}>— {errors.lease_end_date}</span>}</label>
              <input
                type="date"
                value={form.lease_end_date}
                onChange={e => setField('lease_end_date', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.lease_end_date ? '#c0392b' : '#dee2e6' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Rent Amount */}
            <div style={{ flex: '1 1 200px', ...fieldWrap }}>
              <label style={labelStyle}>Monthly Rent (R){errors.rent_amount && <span style={{ color: '#c0392b', marginLeft: '0.4rem' }}>— {errors.rent_amount}</span>}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.rent_amount}
                onChange={e => setField('rent_amount', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.rent_amount ? '#c0392b' : '#dee2e6' }}
              />
            </div>

            {/* Deposit Amount */}
            <div style={{ flex: '1 1 200px', ...fieldWrap }}>
              <label style={labelStyle}>Deposit Amount (R)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.deposit_amount}
                onChange={e => setField('deposit_amount', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Payment Frequency */}
            <div style={{ flex: '1 1 200px', ...fieldWrap }}>
              <label style={labelStyle}>Payment Frequency</label>
              <select
                value={form.payment_frequency}
                onChange={e => setField('payment_frequency', e.target.value)}
                style={selectStyle}
              >
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>

            {/* Due Day */}
            <div style={{ flex: '1 1 200px', ...fieldWrap }}>
              <label style={labelStyle}>Payment Due Day{errors.payment_due_day && <span style={{ color: '#c0392b', marginLeft: '0.4rem' }}>— {errors.payment_due_day}</span>}</label>
              <input
                type="number"
                min="1"
                max="31"
                disabled={isWeekly}
                value={isWeekly ? "" : form.payment_due_day}
                onChange={e => setField('payment_due_day', e.target.value)}
                style={{
                  ...inputStyle,
                  borderColor: errors.payment_due_day ? '#c0392b' : '#dee2e6',
                  background: isWeekly ? '#f5f5f5' : '#fdfdfd',
                  cursor: isWeekly ? 'not-allowed' : 'text',
                }}
              />
            </div>
          </div>

          {/* Utilities & Lease Type */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: '1 1 200px', ...fieldWrap }}>
              <label style={labelStyle}>Lease Type</label>
              <select
                value={form.lease_type}
                onChange={e => setField('lease_type', e.target.value)}
                style={selectStyle}
              >
                <option value="fixed">Fixed Term</option>
                <option value="month_to_month">Month-to-Month</option>
              </select>
            </div>

            <div style={{ flex: '1 1 200px', ...fieldWrap }}>
              <label style={labelStyle}>Late Fee (R)</label>
              <input
                type="number"
                min="0"
                value={form.late_fee_amount}
                onChange={e => setField('late_fee_amount', e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ flex: '1 1 200px', ...fieldWrap }}>
              <label style={labelStyle}>Grace Period (Days)</label>
              <input
                type="number"
                min="0"
                value={form.grace_period_days}
                onChange={e => setField('grace_period_days', e.target.value)}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Included Utilities */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Included Utilities</label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {[
                { key: 'water_included', label: 'Water', icon: FiDroplet },
                { key: 'electricity_included', label: 'Electricity', icon: FiZap },
                { key: 'internet_included', label: 'Internet', icon: FiWifi },
              ].map(u => {
                const IconComp = u.icon;
                const isActive = form[u.key];
                return (
                  <button
                    key={u.key}
                    type="button"
                    onClick={() => setField(u.key, !isActive)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      padding: '0.3rem 0.6rem',
                      borderRadius: '2px',
                      border: `1px solid ${isActive ? '#2b7a4b' : '#ccc'}`,
                      background: isActive ? '#eef5e8' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: isActive ? '#2b7a4b' : '#000',
                    }}
                  >
                    <IconComp size={14} />
                    {u.label}
                    {isActive && <FiCheck size={12} style={{ marginLeft: 'auto' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Deposit invoice notice */}
          {Number(form.deposit_amount) > 0 && (
            <div style={{
              padding: '0.6rem 0.9rem',
              background: '#eaf2f8',
              border: '1px solid #b0cfe0',
              borderRadius: '2px',
              marginBottom: '1.5rem',
              color: '#1e4a6b',
              fontSize: '13px',
            }}>
              A deposit invoice for R {Number(form.deposit_amount).toLocaleString("en-ZA")} will be generated automatically.
            </div>
          )}

          {/* Notes */}
          <div style={{ ...fieldWrap, marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Notes <span style={{ color: '#555', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Footer buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', borderTop: '1px solid #e9ecef', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/landlord/leases')}
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#fdfdfd',
                color: '#000', border: '1px solid #ccc', padding: '0.3rem 0.6rem',
                fontSize: '14px', fontWeight: 400, cursor: 'pointer', borderRadius: '2px',
              }}
            >
              <FiX size={14} /> Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem', background: '#2c3e50',
                color: '#ffffff', border: 'none', padding: '0.4rem 0.8rem',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer', borderRadius: '2px',
              }}
            >
              {saving ? (
                <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
              ) : (
                <FiSave size={14} />
              )}
              Create Lease
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}