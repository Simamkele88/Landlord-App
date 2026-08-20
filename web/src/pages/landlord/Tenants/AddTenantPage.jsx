/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../contexts/ToastContext";
import {
  FiChevronRight,
  FiChevronDown,
  FiCheck,
  FiDroplet,
  FiZap,
  FiWifi,
} from "react-icons/fi";
import { c as COLORS } from "../../../styles/theme";

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const FREQUENCIES = ["weekly", "monthly", "quarterly", "annually"];

function Field({ label, error, children, optional, hint, compact }) {
  const labelWidth = compact ? "100px" : "150px";
  return (
    <div style={{ marginBottom: "0.4rem", flex: compact ? 1 : undefined }}>
      <div style={{
        display: "flex",
        overflow: "hidden",
        border: `1px solid ${error ? "#e5bdbd" : "#e2e3e4"}`,
        fontSize: "14px",
        fontWeight: 400,
        color: "#000",
      }}>
        <div style={{
          width: labelWidth,
          flexShrink: 0,
          padding: "0.4rem 0.6rem",
          color: "#000",
          fontWeight: 500,
          background: "#fdfdfd",
          borderRight: "1px solid #e9ecef",
          display: "flex",
          alignItems: "center",
        }}>
          {label}
          {optional && (
            <span style={{ color: "#666", fontWeight: 400, marginLeft: "0.3rem", fontSize: "0.8rem" }}>
              (Optional)
            </span>
          )}
        </div>
        <div style={{
          padding: "0.4rem 0.6rem",
          color: "#000",
          background: "#f5f5f5",
          flex: 1,
          display: "flex",
          alignItems: "center",
          fontWeight: 400,
        }}>
          {children}
        </div>
      </div>
      {error && (
        <p style={{ fontSize: "12px", color: "#9e3a3a", marginTop: "0.2rem" }}>— {error}</p>
      )}
      {hint && !error && (
        <p style={{ fontSize: "12px", color: "#666", marginTop: "0.2rem" }}>{hint}</p>
      )}
    </div>
  );
}

const innerInputStyle = {
  width: "100%",
  fontSize: "14px",
  color: "#000",
  background: "transparent",
  border: "none",
  outline: "none",
  padding: 0,
  fontFamily: FONT,
};

const innerSelectStyle = {
  ...innerInputStyle,
  appearance: "none",
  WebkitAppearance: "none",
  MozAppearance: "none",
  backgroundImage: "none",
  paddingRight: "1.5rem",
};

const btnPrimary = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.4rem",
  background: "#2c3e50",
  color: "#ffffff",
  border: "1px solid #2c3e50",
  padding: "0.4rem 1rem",
  fontSize: "14px",
  fontWeight: 500,
  fontFamily: FONT,
  borderRadius: "2px",
  cursor: "pointer",
};

const btnGhost = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.4rem",
  background: "#fdfdfd",
  color: "#000",
  border: "1px solid #ccc",
  padding: "0.4rem 1rem",
  fontSize: "14px",
  fontWeight: 400,
  fontFamily: FONT,
  borderRadius: "2px",
  cursor: "pointer",
};

function mapVacantUnit(u) {
  return {
    id: u.id,
    unit_number: u.unit_number || "N/A",
    property_name: u.property_name || "Unknown",
    monthly_rent: u.monthly_rent || 0,
  };
}

export default function AddTenantPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    unit_id: "",
    rent_amount: "",
    deposit_amount: "",
    payment_frequency: "monthly",
    payment_due_day: "1",
    lease_start_date: "",
    lease_end_date: "",
    water_included: false,
    electricity_included: false,
    internet_included: false,
    late_fee_amount: "250",
    grace_period_days: "5",
    special_note: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [apiErr, setApiErr] = useState("");
  const [units, setUnits] = useState([]);

  useEffect(() => {
    fetchVacantUnits();
  }, []);

  async function fetchVacantUnits() {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const { data } = await axios.get(`${API}/units/vacant`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUnits((data.units || []).map(mapVacantUnit));
    } catch (err) {
      console.error("Failed to fetch vacant units:", err);
      toast.error("Failed to load vacant units. Please refresh and try again.");
    }
  }

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
    setApiErr("");
  }

  function validateStep1() {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "Required";
    if (!form.last_name.trim()) e.last_name = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (form.phone.trim() && !/^\d{7,15}$/.test(form.phone.trim())) e.phone = "Invalid phone number";
    return e;
  }

  function validateStep2() {
    const e = {};
    if (!form.unit_id) e.unit_id = "Select a unit";
    if (!form.rent_amount) e.rent_amount = "Required";
    if (isNaN(Number(form.rent_amount)) || Number(form.rent_amount) <= 0)
      e.rent_amount = "Must be a positive number";
    if (!form.lease_start_date) e.lease_start_date = "Required";
    if (!form.lease_end_date) e.lease_end_date = "Required";
    if (form.lease_start_date && form.lease_end_date &&
      new Date(form.lease_end_date) <= new Date(form.lease_start_date))
      e.lease_end_date = "Must be after start date";
    if (form.payment_frequency !== "weekly") {
      const dueDay = Number(form.payment_due_day);
      if (!form.payment_due_day || isNaN(dueDay) || dueDay < 1 || dueDay > 31)
        e.payment_due_day = "Between 1 and 31";
    }
    return e;
  }

  function handleNext() {
    const e = validateStep1();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setStep(2);
    setErrors({});
    window.scrollTo(0, 0);
  }

  async function handleSubmit() {
    const e = validateStep2();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setLoading(true);
    setApiErr("");

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const { data } = await axios.post(
        `${API}/tenants/register`,
        {
          first_name: form.first_name,
          last_name: form.last_name,
          email: form.email,
          phone: form.phone || null,
          unit_id: form.unit_id,
          rent_amount: Number(form.rent_amount),
          deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : Number(form.rent_amount),
          payment_frequency: form.payment_frequency,
          payment_due_day: form.payment_frequency === "weekly" ? 1 : Number(form.payment_due_day),
          lease_start_date: form.lease_start_date,
          lease_end_date: form.lease_end_date,
          water_included: form.water_included,
          electricity_included: form.electricity_included,
          internet_included: form.internet_included,
          late_fee_amount: Number(form.late_fee_amount),
          grace_period_days: Number(form.grace_period_days),
          special_note: form.special_note || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Tenant registered successfully!");
      navigate("/landlord/tenants");
    } catch (err) {
      setApiErr(err.response?.data?.error || "Failed to register tenant. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleUnitChange(unitId) {
    set("unit_id", unitId);
    const unit = units.find(u => u.id === unitId);
    if (unit?.monthly_rent && !form.rent_amount) {
      set("rent_amount", String(unit.monthly_rent));
    }
  }

  function formatRent(n) {
    return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "";
  }

  function toggleUtility(key) {
    setForm(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const isWeekly = form.payment_frequency === "weekly";

  return (
    <div style={{ fontFamily: FONT, color: "#000", background: "#ffffff" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus, textarea:focus { outline: none; }
      `}</style>

      {/* Breadcrumb */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        marginBottom: '0.75rem',
        fontSize: '14px',
        fontWeight: 300,
        color: '#333',
        padding: '0.55rem 0.8rem',
        background: '#fdfdfd',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        border: '1px solid #e9ecef',
      }}>
        <FiChevronRight size={13} style={{ color: '#555' }} />
        <Link to="/landlord/dashboard" style={{ color: '#2471a3', textDecoration: 'none' }}>Dashboard</Link>
        <span style={{ color: '#555' }}>/</span>
        <Link to="/landlord/tenants" style={{ color: '#2471a3', textDecoration: 'none' }}>Tenants</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>Add Tenant</span>
      </div>

      {/* Main card */}
      <div style={{
        background: '#fdfdfd',
        border: '1px solid #dfe3e8',
        borderRadius: '3px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          background: '#f7f8fa',
          padding: '0.8rem 1.2rem',
          borderBottom: '3px solid #3498db',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 500, margin: 0, color: '#000' }}>
              Register New Tenant
            </h2>
            <p style={{ fontSize: '13px', color: '#333', margin: '0.2rem 0 0' }}>
              Step {step} of 2 : {step === 1 ? "Basic Information" : "Unit & Lease"}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => navigate('/landlord/tenants')} style={btnGhost}>
              Cancel
            </button>
          </div>
        </div>

        <form onSubmit={e => e.preventDefault()} style={{ padding: '1.2rem' }}>
          {/* API error banner */}
          {apiErr && (
            <div style={{
              padding: '0.7rem 0.9rem',
              borderRadius: '2px',
              background: '#fbeaea',
              border: '1px solid #e5bdbd',
              fontSize: '13px',
              color: '#9e3a3a',
              marginBottom: '1rem',
            }}>
              {apiErr}
            </div>
          )}

          {/* Step 1 */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#000', margin: '0 0 0.4rem' }}>Basic Information</h3>

              {/* First & Last Name side by side */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Field label="First Name" error={errors.first_name} compact>
                  <input
                    style={innerInputStyle}
                    value={form.first_name}
                    onChange={e => set("first_name", e.target.value)}
                  />
                </Field>
                <Field label="Last Name" error={errors.last_name} compact>
                  <input
                    style={innerInputStyle}
                    value={form.last_name}
                    onChange={e => set("last_name", e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Email Address" error={errors.email} hint="The tenant's welcome email and temporary password will be sent here">
                <input
                  type="email"
                  style={innerInputStyle}
                  value={form.email}
                  onChange={e => set("email", e.target.value)}
                />
              </Field>

              <Field label="Phone Number" error={errors.phone}>
                <input
                  type="tel"
                  style={innerInputStyle}
                  value={form.phone}
                  onChange={e => set("phone", e.target.value)}
                />
              </Field>

              <Field label="Special Notes" optional>
                <textarea
                  rows={2}
                  style={{ ...innerInputStyle, resize: 'vertical', minHeight: 40 }}
                  value={form.special_note}
                  onChange={e => set("special_note", e.target.value)}
                />
              </Field>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#000', margin: '0 0 0.4rem' }}>Unit & Lease</h3>

              <Field label="Unit" error={errors.unit_id}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <select
                    style={innerSelectStyle}
                    value={form.unit_id}
                    onChange={e => handleUnitChange(e.target.value)}
                  >
                    <option value="">Select a vacant unit</option>
                    {units.map(u => (
                      <option key={u.id} value={u.id}>
                        Unit {u.unit_number} — {u.property_name}
                        {u.monthly_rent ? ` (${formatRent(u.monthly_rent)}/mo)` : ""}
                      </option>
                    ))}
                  </select>
                  <FiChevronDown size={14} style={{ position: 'absolute', right: '0.3rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#555' }} />
                </div>
              </Field>

              {/* Rent & Deposit side by side */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Field label="Monthly Rent (R)" error={errors.rent_amount} compact>
                  <input
                    type="number"
                    min="0"
                    style={innerInputStyle}
                    value={form.rent_amount}
                    onChange={e => set("rent_amount", e.target.value)}
                  />
                </Field>
                <Field label="Deposit Amount (R)" optional compact hint="Defaults to one month's rent">
                  <input
                    type="number"
                    min="0"
                    style={innerInputStyle}
                    value={form.deposit_amount}
                    onChange={e => set("deposit_amount", e.target.value)}
                  />
                </Field>
              </div>

              {/* Frequency & Due Day side by side */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Field label="Payment Frequency" compact>
                  <div style={{ position: 'relative', width: '100%' }}>
                    <select
                      style={innerSelectStyle}
                      value={form.payment_frequency}
                      onChange={e => set("payment_frequency", e.target.value)}
                    >
                      {FREQUENCIES.map(f => (
                        <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                      ))}
                    </select>
                    <FiChevronDown size={14} style={{ position: 'absolute', right: '0.3rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: '#555' }} />
                  </div>
                </Field>
                <Field label="Payment Due Day" compact hint={isWeekly ? "N/A for weekly" : "Day of the month"}>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    disabled={isWeekly}
                    style={{
                      ...innerInputStyle,
                      background: isWeekly ? '#f5f5f5' : 'transparent',
                      cursor: isWeekly ? 'not-allowed' : 'text',
                    }}
                    value={isWeekly ? "" : form.payment_due_day}
                    onChange={e => set("payment_due_day", e.target.value)}
                  />
                </Field>
              </div>

              {/* Start & End Dates side by side */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Field label="Lease Start Date" error={errors.lease_start_date} compact>
                  <input
                    type="date"
                    style={innerInputStyle}
                    value={form.lease_start_date}
                    onChange={e => set("lease_start_date", e.target.value)}
                  />
                </Field>
                <Field label="Lease End Date" error={errors.lease_end_date} compact>
                  <input
                    type="date"
                    style={innerInputStyle}
                    value={form.lease_end_date}
                    onChange={e => set("lease_end_date", e.target.value)}
                  />
                </Field>
              </div>

              {/* Late Fee & Grace Period side by side */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <Field label="Late Fee (R)" compact hint="Charged after grace period">
                  <input
                    type="number"
                    min="0"
                    style={innerInputStyle}
                    value={form.late_fee_amount}
                    onChange={e => set("late_fee_amount", e.target.value)}
                  />
                </Field>
                <Field label="Grace Period (Days)" compact hint="Days before late fee applies">
                  <input
                    type="number"
                    min="0"
                    style={innerInputStyle}
                    value={form.grace_period_days}
                    onChange={e => set("grace_period_days", e.target.value)}
                  />
                </Field>
              </div>

              <Field label="Included Utilities">
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
                        onClick={() => toggleUtility(u.key)}
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
              </Field>

              {/* Deposit invoice notice */}
              {Number(form.deposit_amount) > 0 && (
                <div style={{
                  padding: '0.6rem 0.9rem',
                  background: '#eaf2f8',
                  border: '1px solid #b0cfe0',
                  borderRadius: '2px',
                  marginTop: '0.5rem',
                  color: '#1e4a6b',
                  fontSize: '13px',
                }}>
                  A deposit invoice for {formatRent(Number(form.deposit_amount))} will be generated automatically.
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.6rem',
            paddingTop: '1rem',
            borderTop: '1px solid #e9ecef',
            marginTop: '1rem',
          }}>
            {step === 2 && (
              <button type="button" onClick={() => setStep(1)} style={btnGhost}>
                Back
              </button>
            )}
            <button
              type="button"
              onClick={step === 1 ? handleNext : handleSubmit}
              disabled={loading}
              style={btnPrimary}
            >
              {loading ? (
                <>
                  <span style={{
                    width: 14,
                    height: 14,
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite',
                  }} />
                  {step === 1 ? "Loading..." : "Registering..."}
                </>
              ) : step === 1 ? 'Next' : 'Register Tenant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}