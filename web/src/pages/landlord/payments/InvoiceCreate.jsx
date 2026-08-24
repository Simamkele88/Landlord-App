/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { FiChevronRight, FiSave, FiX, FiChevronDown } from "react-icons/fi";

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

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

export default function CreateInvoice() {
  useDocumentTitle("Create Invoice");
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  const [leases, setLeases] = useState([]);
  const [form, setForm] = useState({
    lease_id: searchParams.get("lease_id") || "",
    invoice_type: searchParams.get("type") || "other",
    amount: searchParams.get("amount") || "",
    due_date: searchParams.get("due_date") || "",
    notes: searchParams.get("notes") || "",
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function fetchLeases() {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API}/leases`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLeases(data.leases || []);
      } catch (err) {
        toast.error("Failed to load leases.");
      }
    }
    fetchLeases();
  }, [toast]);

  function setField(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.lease_id) e.lease_id = "Select a lease";
    if (!form.amount || Number(form.amount) <= 0) e.amount = "Enter a valid amount";
    if (!form.due_date) e.due_date = "Required";
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
      await axios.post(
        `${API}/landlord/payments/invoices`,
        {
          lease_id: form.lease_id,
          invoice_type: form.invoice_type,
          amount: Number(form.amount),
          due_date: form.due_date,
          notes: form.notes || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Invoice created!");
      navigate("/landlord/payments/invoices");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create invoice.");
    } finally {
      setSaving(false);
    }
  }

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
        <Link to="/landlord/payments" className="rb-link">Payments</Link>
        <span style={{ color: '#555' }}>/</span>
        <Link to="/landlord/payments/invoices" className="rb-link">Invoices</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>Create Invoice</span>
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
            Create a custom invoice
          </h4>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '1.2rem' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Lease */}
            <div style={{ flex: '1 1 300px', ...fieldWrap }}>
              <label style={labelStyle}>Lease{errors.lease_id && <span style={{ color: '#c0392b', marginLeft: '0.4rem' }}>— {errors.lease_id}</span>}</label>
              <select
                value={form.lease_id}
                onChange={e => setField('lease_id', e.target.value)}
                style={{ ...selectStyle, borderColor: errors.lease_id ? '#c0392b' : '#dee2e6' }}
              >
                <option value="">Select lease...</option>
                {leases.map(l => (
                  <option key={l.id} value={l.id}>
                    {l.tenant_name} - {l.property_name} (Unit {l.unit_number})
                  </option>
                ))}
              </select>
            </div>

            {/* Invoice Type */}
            <div style={{ flex: '1 1 200px', ...fieldWrap }}>
              <label style={labelStyle}>Invoice Type</label>
              <select
                value={form.invoice_type}
                onChange={e => setField('invoice_type', e.target.value)}
                style={selectStyle}
              >
                <option value="other">Other</option>
                <option value="damage">Damage / Repair</option>
                <option value="utility">Utility</option>
                <option value="deposit">Deposit</option>
                <option value="rent">Rent</option>
                <option value="fine">Fine</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
            {/* Amount */}
            <div style={{ flex: '1 1 200px', ...fieldWrap }}>
              <label style={labelStyle}>Amount (R){errors.amount && <span style={{ color: '#c0392b', marginLeft: '0.4rem' }}>— {errors.amount}</span>}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={e => setField('amount', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.amount ? '#c0392b' : '#dee2e6' }}
              />
            </div>

            {/* Due Date */}
            <div style={{ flex: '1 1 200px', ...fieldWrap }}>
              <label style={labelStyle}>Due Date{errors.due_date && <span style={{ color: '#c0392b', marginLeft: '0.4rem' }}>— {errors.due_date}</span>}</label>
              <input
                type="date"
                value={form.due_date}
                onChange={e => setField('due_date', e.target.value)}
                style={{ ...inputStyle, borderColor: errors.due_date ? '#c0392b' : '#dee2e6' }}
              />
            </div>
          </div>

          {/* Notes */}
          <div style={{ ...fieldWrap, marginBottom: '1.5rem' }}>
            <label style={labelStyle}>Notes <span style={{ color: '#555', fontWeight: 400 }}>(optional)</span></label>
            <textarea
              rows={3}
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
              placeholder="e.g., Repair for damaged window in living room"
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>

          {/* Footer buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.6rem', borderTop: '1px solid #e9ecef', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={() => navigate('/landlord/payments/invoices')}
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
              Create Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}