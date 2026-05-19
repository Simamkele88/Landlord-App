/* eslint-disable react-hooks/exhaustive-deps */
// MODAL FOR REGISTERING A NEW TENANT BY THE LANDLORD
import { useState, useEffect } from "react";  
import { X, Plus, Loader2, CheckCircle, Info } from "lucide-react";
import axios from "axios";
import { useToast } from "../../../contexts/ToastContext";

 
// API_URL
const API = "http://localhost:4000";

// PAYMENT FREQUENCIES
const FREQUENCIES = ["monthly", "weekly"];
 
// UTILITY COMPONENTS
function inputCls(error) {
  return `w-full text-sm rounded-lg px-3 py-2.5 border bg-gray-50 dark:bg-gray-700
    text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2
    focus:ring-blue-500 ${error ? "border-red-400 dark:border-red-500" : "border-gray-300 dark:border-gray-600"}`;
}
 
// FIELD COMPONENT WITH LABEL, ERROR, AND HINT
function Field({ label, error, children, optional, hint }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
        {label}
        {optional && <span className="text-gray-400 font-normal ml-1">(Optional)</span>}
        {error && <span className="text-red-500 normal-case font-normal ml-1">— {error}</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

// MAP API UNIT TO LOCAL FORMAT
function mapVacantUnit(u) {
  return {
    id: u.id,
    unit_number: u.unit_number || "N/A",
    property_name: u.property_name || "Unknown",
    monthly_rent: u.monthly_rent || 0,
  };
}

// MAIN COMPONENT
export function LandlordRegisterTenantModal({ onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState({
    first_name:        "",
    last_name:         "",
    email:             "",
    phone:             "",
    unit_id:           "",
    rent_amount:       "",
    deposit_amount:    "",
    payment_frequency: "monthly",
    payment_due_day:   "1",
    lease_start_date:  "",
    lease_end_date:    "",
    special_note:      "",
  });
  const [errors,  setErrors]  = useState({});
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);
  const [apiErr,  setApiErr]  = useState("");
  const [units,   setUnits]   = useState([]);  
 
  useEffect(() => {
    fetchVacantUnits();
  }, []);

  // FETCH VACANT UNITS FOR THE UNIT DROPDOWN
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
 
  // VALIDATION
  function validate() {
    const e = {};
    if (!form.first_name.trim())    e.first_name       = "Required";
    if (!form.last_name.trim())     e.last_name        = "Required";
    if (!form.email.trim())         e.email            = "Required";
    if (!/\S+@\S+\.\S+/.test(form.email)) e.email     = "Invalid email";
    if (!form.phone.trim() && !/^\d{7,15}$/.test(form.phone.trim())) e.phone = "Invalid phone number";
    if (!form.unit_id)              e.unit_id          = "Select a unit";
    if (!form.rent_amount)          e.rent_amount      = "Required";
    if (isNaN(Number(form.rent_amount)) || Number(form.rent_amount) <= 0)
      e.rent_amount                                    = "Must be a positive number";
    if (!form.lease_start_date)     e.lease_start_date = "Required";
    if (!form.lease_end_date)       e.lease_end_date   = "Required";
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
          rent_amount:     Number(form.rent_amount),
          deposit_amount:  form.deposit_amount ? Number(form.deposit_amount) : Number(form.rent_amount),
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
 
  // SUCCESS SCREEN
  if (done) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle size={34} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tenant Registered</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              A welcome email with a temporary password has been sent to{" "}
              <span className="font-semibold text-gray-700 dark:text-gray-300">{form.email}</span>.
            </p>
          </div>
          <div className="w-full p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-left">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">
                The tenant will be asked to complete their profile (personal details, ID, employment,
                emergency contact) after their first login.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    );
  }
 
  // REGISTRATION FORM
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg border border-gray-200 dark:border-gray-700 flex flex-col max-h-[92vh]">
 
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Register New Tenant</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              The tenant will complete their own profile after first login
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white p-1 rounded">
            <X size={20} />
          </button>
        </div>
 
        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
 
          {/* API ERROR */}
          {apiErr && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 text-sm text-red-700 dark:text-red-400">
              {apiErr}
            </div>
          )}
 
          {/* SECTION: BASIC INFO */}
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Basic Information
          </p>
 
          <div className="grid grid-cols-2 gap-4">
            <Field label="First Name" error={errors.first_name}>
              <input className={inputCls(errors.first_name)} value={form.first_name}
                onChange={e => set("first_name", e.target.value)} placeholder="e.g. Sipho" />
            </Field>
            <Field label="Last Name" error={errors.last_name}>
              <input className={inputCls(errors.last_name)} value={form.last_name}
                onChange={e => set("last_name", e.target.value)} placeholder="e.g. Dlamini" />
            </Field>
          </div>
 
          <Field label="Email Address" error={errors.email}
            hint="The tenant's welcome email and temporary password will be sent here">
            <input type="email" className={inputCls(errors.email)} value={form.email}
              onChange={e => set("email", e.target.value)} placeholder="tenant@email.com" />
          </Field>
 
          <Field label="Phone Number" error={errors.phone} >
            <input type="tel" className={inputCls(errors.phone)} value={form.phone}
              onChange={e => set("phone", e.target.value)} placeholder="0821234567" />
          </Field>
 
          <Field label="Special Notes" optional>
            <textarea rows={2} className={inputCls(false) + " resize-none"} value={form.special_note}
              onChange={e => set("special_note", e.target.value)}
              placeholder="Any notes for this tenant..." />
          </Field>
 
          {/* SECTION: UNIT & LEASE */}
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider pt-2">
            Unit & Lease
          </p>
 
          
          <Field label="Unit" error={errors.unit_id}>
            <select className={inputCls(errors.unit_id)} value={form.unit_id}
              onChange={e => handleUnitChange(e.target.value)}>
              <option value="">Select a vacant unit</option>
              {units.map(u => (
                <option key={u.id} value={u.id}>
                  Unit {u.unit_number} — {u.property_name}
                  {u.monthly_rent ? ` (R ${Number(u.monthly_rent).toLocaleString("en-ZA")}/mo)` : ""}
                </option>
              ))}
            </select>
          </Field>
 
          <div className="grid grid-cols-2 gap-4">
            <Field label="Monthly Rent (R)" error={errors.rent_amount}>
              <input type="number" min="0" className={inputCls(errors.rent_amount)}
                value={form.rent_amount} onChange={e => set("rent_amount", e.target.value)}
                placeholder="e.g. 5800" />
            </Field>
            <Field label="Deposit Amount (R)" optional
              hint="Defaults to one month's rent">
              <input type="number" min="0" className={inputCls(false)}
                value={form.deposit_amount} onChange={e => set("deposit_amount", e.target.value)}
                placeholder={form.rent_amount || "Same as rent"} />
            </Field>
          </div>
 
          <div className="grid grid-cols-2 gap-4">
            <Field label="Payment Frequency">
              <select className={inputCls(false)} value={form.payment_frequency}
                onChange={e => set("payment_frequency", e.target.value)}>
                {FREQUENCIES.map(f => (
                  <option key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                ))}
              </select>
            </Field>
            <Field label="Payment Due Day" hint="Day of the month">
              <input type="number" min="1" max="31" className={inputCls(false)}
                value={form.payment_due_day} onChange={e => set("payment_due_day", e.target.value)} />
            </Field>
          </div>
 
          <div className="grid grid-cols-2 gap-4">
            <Field label="Lease Start Date" error={errors.lease_start_date}>
              <input type="date" className={inputCls(errors.lease_start_date)}
                value={form.lease_start_date} onChange={e => set("lease_start_date", e.target.value)} />
            </Field>
            <Field label="Lease End Date" error={errors.lease_end_date}>
              <input type="date" className={inputCls(errors.lease_end_date)}
                value={form.lease_end_date} onChange={e => set("lease_end_date", e.target.value)} />
            </Field>
          </div>

        </div>
 
        {/* FOOTER */}
        <div className="px-6 pb-6 flex gap-3 flex-shrink-0 border-t border-gray-200 dark:border-gray-700 pt-4">
          <button onClick={onClose} disabled={loading}
            className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-colors">
            {loading
              ? <><Loader2 size={16} className="animate-spin" />Registering...</>
              : "Register Tenant"
            }
          </button>
        </div>
      </div>
    </div>
  );
}