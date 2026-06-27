/* eslint-disable react-hooks/exhaustive-deps */
// MODAL FOR REGISTERING A NEW TENANT BY THE LANDLORD 
import { useState, useEffect } from "react";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";
import axios from "axios";


const API = "http://localhost:4000";


const FREQUENCIES = ["monthly", "weekly"];


const inputStyle = (error) => ({
  width: '100%', fontSize: '0.82rem', padding: '0.6rem 0.9rem', borderRadius: '3px',
  background: C.black, border: `1px solid ${error ? 'rgba(224,90,74,0.5)' : C.border}`,
  color: C.white, fontFamily: F.dm, outline: 'none',
});

const selectStyle = (error) => ({
  ...inputStyle(error),
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.75rem center',
  paddingRight: '2rem',
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

const modalOverlay = {
  position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center',
  justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
};

const modalShell = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px',
  boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
  maxHeight: '92vh', width: '100%',
};

const modalHeader = {
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0,
};

const modalBody = {
  flex: 1, overflowY: 'auto', padding: '1.2rem 1.5rem', display: 'flex',
  flexDirection: 'column', gap: '0.9rem',
};

const modalFooter = {
  display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem',
  borderTop: `1px solid ${C.border}`, flexShrink: 0,
};

const sectionTitle = {
  fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)',
  fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase',
};

function Field({ label, error, children, optional, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
      <label style={{
        fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)',
        fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase',
      }}>
        {label}
        {optional && <span style={{ color: 'rgba(245,240,232,0.25)', fontWeight: 400, textTransform: 'none', marginLeft: '0.3rem' }}>(Optional)</span>}
        {error && <span style={{ color: C.redLight, fontWeight: 400, textTransform: 'none', marginLeft: '0.3rem' }}>— {error}</span>}
      </label>
      {children}
      {hint && !error && (
        <p style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginTop: '0.15rem' }}>{hint}</p>
      )}
    </div>
  );
}


function mapVacantUnit(u) {
  return {
    id: u.id,
    unit_number: u.unit_number || "N/A",
    property_name: u.property_name || "Unknown",
    monthly_rent: u.monthly_rent || 0,
  };
}


export function LandlordRegisterTenantModal({ onClose, onCreated }) {
  const toast = useToast();
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
    special_note: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
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
      const mapped = (data.units || []).map(mapVacantUnit);
      setUnits(mapped);
      toast.success(`Loaded ${mapped.length} vacant unit${mapped.length !== 1 ? "s" : ""}`);
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

  function validate() {
    const e = {};
    if (!form.first_name.trim()) e.first_name = "Required";
    if (!form.last_name.trim()) e.last_name = "Required";
    if (!form.email.trim()) e.email = "Required";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (form.phone.trim() && !/^\d{7,15}$/.test(form.phone.trim())) e.phone = "Invalid phone number";
    if (!form.unit_id) e.unit_id = "Select a unit";
    if (!form.rent_amount) e.rent_amount = "Required";
    if (isNaN(Number(form.rent_amount)) || Number(form.rent_amount) <= 0)
      e.rent_amount = "Must be a positive number";
    if (!form.lease_start_date) e.lease_start_date = "Required";
    if (!form.lease_end_date) e.lease_end_date = "Required";
    if (form.lease_start_date && form.lease_end_date &&
      new Date(form.lease_end_date) <= new Date(form.lease_start_date))
      e.lease_end_date = "Must be after start date";
    return e;
  }

  async function handleSubmit() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    setLoading(true);
    setApiErr("");

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      const { data } = await axios.post(
        `${API}/tenants/register`,
        {
          ...form,
          rent_amount: Number(form.rent_amount),
          deposit_amount: form.deposit_amount ? Number(form.deposit_amount) : Number(form.rent_amount),
          payment_due_day: Number(form.payment_due_day),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDone(true);
      onCreated?.(data);
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

  
  if (done) {
    return (
      <div style={modalOverlay}>
        <div style={{
          width: '100%', maxWidth: 380, background: C.muted2,
          border: `1px solid ${C.border}`, borderRadius: '6px',
          padding: '2rem', display: 'flex', flexDirection: 'column',
          alignItems: 'center', textAlign: 'center', gap: '1rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(26,122,74,0.1)', border: '1px solid rgba(76,186,122,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name="check" size={32} color={C.greenLight} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>
              Tenant Registered
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.4)', marginTop: '0.3rem', lineHeight: 1.5 }}>
              A welcome email with a temporary password has been sent to{" "}
              <span style={{ fontWeight: 600, color: C.white }}>{form.email}</span>.
            </p>
          </div>
          <div style={{
            width: '100%', padding: '0.8rem', borderRadius: '3px',
            background: 'rgba(58,143,212,0.06)', border: '1px solid rgba(58,143,212,0.15)',
            display: 'flex', alignItems: 'flex-start', gap: '0.5rem', textAlign: 'left',
          }}>
            <Icon name="info" size={13} color={C.blue} style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '0.62rem', color: 'rgba(58,143,212,0.7)', lineHeight: 1.4 }}>
              The tenant will be asked to complete their profile (personal details, ID, employment,
              emergency contact) after their first login.
            </p>
          </div>
          <button onClick={onClose} style={{ ...btnPrimary, width: '100%', justifyContent: 'center' }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  
  return (
    <div style={modalOverlay}>
      <div style={{ ...modalShell, maxWidth: 520 }}>
        {/* HEADER */}
        <div style={modalHeader}>
          <div>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>
              Register New Tenant
            </h3>
            <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, marginTop: '0.15rem' }}>
              The tenant will complete their own profile after first login
            </p>
          </div>
          <button onClick={onClose} style={{
            padding: '0.2rem', borderRadius: '3px', background: 'transparent',
            border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)',
            transition: 'color 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>

        {/* BODY */}
        <div style={modalBody}>
          {/* API ERROR */}
          {apiErr && (
            <div style={{
              padding: '0.7rem 0.9rem', borderRadius: '3px',
              background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)',
              fontSize: '0.72rem', color: C.redLight, lineHeight: 1.4,
            }}>
              {apiErr}
            </div>
          )}

          {/* SECTION: BASIC INFO */}
          <p style={{ ...sectionTitle, paddingTop: '0' }}>Basic Information</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field label="First Name" error={errors.first_name}>
              <input style={inputStyle(errors.first_name)} value={form.first_name}
                onChange={e => set("first_name", e.target.value)} placeholder="e.g. Sipho" />
            </Field>
            <Field label="Last Name" error={errors.last_name}>
              <input style={inputStyle(errors.last_name)} value={form.last_name}
                onChange={e => set("last_name", e.target.value)} placeholder="e.g. Dlamini" />
            </Field>
          </div>

          <Field label="Email Address" error={errors.email}
            hint="The tenant's welcome email and temporary password will be sent here">
            <input type="email" style={inputStyle(errors.email)} value={form.email}
              onChange={e => set("email", e.target.value)} placeholder="tenant@email.com" />
          </Field>

          <Field label="Phone Number" error={errors.phone}>
            <input type="tel" style={inputStyle(errors.phone)} value={form.phone}
              onChange={e => set("phone", e.target.value)} placeholder="0821234567" />
          </Field>

          <Field label="Special Notes" optional>
            <textarea rows={2} style={{ ...inputStyle(false), resize: 'none', minHeight: 56 }}
              value={form.special_note}
              onChange={e => set("special_note", e.target.value)}
              placeholder="Any notes for this tenant..." />
          </Field>

          {/* SECTION: UNIT & LEASE */}
          <p style={{ ...sectionTitle, paddingTop: '0.6rem' }}>Unit & Lease</p>

          <Field label="Unit" error={errors.unit_id}>
            <select style={selectStyle(errors.unit_id)} value={form.unit_id}
              onChange={e => handleUnitChange(e.target.value)}>
              <option value="">Select a vacant unit</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>
                  Unit {u.unit_number} — {u.property_name}
                  {u.monthly_rent ? ` (${formatRent(u.monthly_rent)}/mo)` : ""}
                </option>
              ))}
            </select>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field label="Monthly Rent (R)" error={errors.rent_amount}>
              <input type="number" min="0" style={inputStyle(errors.rent_amount)}
                value={form.rent_amount} onChange={e => set("rent_amount", e.target.value)}
                placeholder="e.g. 5800" />
            </Field>
            <Field label="Deposit Amount (R)" optional hint="Defaults to one month's rent">
              <input type="number" min="0" style={inputStyle(false)}
                value={form.deposit_amount} onChange={e => set("deposit_amount", e.target.value)}
                placeholder={form.rent_amount || "Same as rent"} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field label="Payment Frequency">
              <select style={selectStyle(false)} value={form.payment_frequency}
                onChange={e => set("payment_frequency", e.target.value)}>
                {FREQUENCIES.map(f => (
                  <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                ))}
              </select>
            </Field>
            <Field label="Payment Due Day" hint="Day of the month">
              <input type="number" min="1" max="31" style={inputStyle(false)}
                value={form.payment_due_day} onChange={e => set("payment_due_day", e.target.value)} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
            <Field label="Lease Start Date" error={errors.lease_start_date}>
              <input type="date" style={inputStyle(errors.lease_start_date)}
                value={form.lease_start_date} onChange={e => set("lease_start_date", e.target.value)} />
            </Field>
            <Field label="Lease End Date" error={errors.lease_end_date}>
              <input type="date" style={inputStyle(errors.lease_end_date)}
                value={form.lease_end_date} onChange={e => set("lease_end_date", e.target.value)} />
            </Field>
          </div>
        </div>

        {/* FOOTER */}
        <div style={modalFooter}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{ ...btnPrimary, flex: 1, justifyContent: 'center' }}>
            {loading ? (
              <>
                <span style={{
                  width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)',
                  borderTopColor: C.black, borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }} />
                Registering...
              </>
            ) : (
              "Register Tenant"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}