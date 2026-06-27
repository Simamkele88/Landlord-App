/* eslint-disable no-unused-vars */
// LANDLORD LEASES PAGE 
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

const FILTERS = ["All", "Active", "Expiring Soon", "Expired", "Month-to-Month"];

function format(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
function initials(name = "") { return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(); }
function daysUntil(dateStr) { if (!dateStr) return null; return Math.ceil((new Date(dateStr) - Date.now()) / 86400000); }
function daysBetween(start, end) { if (!start || !end) return null; return Math.ceil((new Date(end) - new Date(start)) / 86400000); }

const cardStyle = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden',
};


const pillStyle = (color, bg, border) => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  fontSize: '0.58rem', fontWeight: 700, padding: '0.12rem 0.5rem',
  borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
  textTransform: 'uppercase', color, background: bg, border,
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

function LeaseStatusBadge({ lease }) {
  const days = daysUntil(lease.end_date);
  const now = new Date();
  const end = new Date(lease.end_date);
  const start = new Date(lease.start_date);
  const isExpired = end < now;
  const isExpiringSoon = !isExpired && days !== null && days <= 60;
  const isMonthToMonth = lease.type === "month_to_month";

  if (isExpired) {
    return <span style={pillStyle(C.redLight, 'rgba(224,90,74,0.08)', '1px solid rgba(224,90,74,0.2)')}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.redLight }} /> Expired
    </span>;
  }
  if (isMonthToMonth) {
    return <span style={pillStyle(C.blue, 'rgba(58,143,212,0.08)', '1px solid rgba(58,143,212,0.15)')}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.blue }} /> Month-to-Month
    </span>;
  }
  if (isExpiringSoon) {
    return <span style={pillStyle(C.gold, 'rgba(232,160,18,0.06)', '1px solid rgba(232,160,18,0.15)')}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.gold }} /> {days}d left
    </span>;
  }
  return <span style={pillStyle(C.greenLight, 'rgba(26,122,74,0.06)', '1px solid rgba(76,186,122,0.12)')}>
    <span style={{ width: 5, height: 5, borderRadius: '50%', background: C.greenLight }} /> Active
  </span>;
}

function RenewalModal({ lease, onClose, onConfirm }) {
  const [newLeaseEnd, setNewLeaseEnd] = useState("");
  const [newRent, setNewRent] = useState(String(lease.rent_amount || ""));
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const rentChanged = Number(newRent) !== Number(lease.rent_amount);

  function validate() {
    const e = {};
    if (!newLeaseEnd) e.newLeaseEnd = "Required";
    if (!newRent.trim()) e.newRent = "Required";
    if (newLeaseEnd && lease.end_date && new Date(newLeaseEnd) <= new Date(lease.end_date))
      e.newLeaseEnd = "Must be after current lease end";
    return e;
  }

  function handleConfirm() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    setLoading(true);
    setTimeout(() => {
      onConfirm(lease.id, { leaseEnd: newLeaseEnd, rentAmount: Number(newRent) });
      setLoading(false);
      onClose();
    }, 1000);
  }

  const inputStyle = (error) => ({
    width: '100%', fontSize: '0.82rem', padding: '0.6rem 0.9rem', borderRadius: '3px',
    background: C.black, border: `1px solid ${error ? 'rgba(224,90,74,0.5)' : C.border}`,
    color: C.white, fontFamily: F.dm, outline: 'none',
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 440, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '6px', background: 'rgba(26,122,74,0.12)', border: '1px solid rgba(76,186,122,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="refresh" size={16} color={C.greenLight} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Renew Lease</h3>
              <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{lease.tenant_name} · {lease.unit_number ? `Unit ${lease.unit_number}` : "N/A"}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <div style={{ borderRadius: '3px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            {[
              ["Current Lease End", formatDate(lease.end_date)],
              ["Current Rent", format(lease.rent_amount)],
            ].map(([label, val]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.55rem 0.8rem', background: 'rgba(245,240,232,0.02)', borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.4)' }}>{label}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: C.white }}>{val}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              New Lease End Date{errors.newLeaseEnd && <span style={{ color: C.redLight, textTransform: 'none', marginLeft: '0.3rem' }}>— {errors.newLeaseEnd}</span>}
            </label>
            <input type="date" value={newLeaseEnd} onChange={e => { setNewLeaseEnd(e.target.value); setErrors(er => ({ ...er, newLeaseEnd: undefined })); }} style={inputStyle(errors.newLeaseEnd)} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '0.65rem', fontWeight: 600, color: 'rgba(245,240,232,0.5)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Monthly Rent (R){errors.newRent && <span style={{ color: C.redLight, textTransform: 'none', marginLeft: '0.3rem' }}>— {errors.newRent}</span>}
            </label>
            <input type="number" min="0" value={newRent} onChange={e => { setNewRent(e.target.value); setErrors(er => ({ ...er, newRent: undefined })); }} style={inputStyle(errors.newRent)} placeholder="e.g. 6500" />
            {rentChanged && Number(newRent) > 0 && (
              <p style={{ fontSize: '0.62rem', color: C.gold, marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Icon name="warning" size={10} /> Rent will change from {format(lease.rent_amount)} → {format(Number(newRent))}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', padding: '0.5rem 0.7rem', borderRadius: '3px', background: 'rgba(26,122,74,0.06)', border: '1px solid rgba(76,186,122,0.12)' }}>
            <Icon name="info" size={12} color={C.greenLight} style={{ flexShrink: 0, marginTop: '1px' }} />
            <p style={{ fontSize: '0.6rem', color: 'rgba(76,186,122,0.6)' }}>The tenant will be notified of their renewal on the mobile app.</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1, textAlign: 'center' }}>Cancel</button>
          <button onClick={handleConfirm} disabled={loading} style={{ ...btnPrimary, flex: 1, justifyContent: 'center', background: C.greenLight }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: C.black, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : <><Icon name="refresh" size={14} /> Renew Lease</>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Leases() {
  useDocumentTitle("Leases");
  const navigate = useNavigate();
  const toast = useToast();

  const [leases, setLeases] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [renewalLease, setRenewalLease] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchLeases = useCallback(async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/leases`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const mapped = (data.leases || []).map(l => ({
        id: l.id,
        tenant_id: l.tenant_id,
        tenant_name: l.tenant_name || `${l.first_name || ""} ${l.last_name || ""}`.trim(),
        unit_id: l.unit_id,
        unit_number: l.unit_number,
        property_name: l.property_name || "Unknown",
        start_date: l.lease_start_date || l.start_date,
        end_date: l.lease_end_date || l.end_date,
        rent_amount: Number(l.rent_amount) || 0,
        frequency: l.payment_frequency || "monthly",
        payment_due_day: l.payment_due_day || 1,
        type: l.lease_type || "fixed",
        status: l.lease_status || "active",
      }));
      setLeases(mapped);
    } catch (err) {
      console.error("Failed to fetch leases:", err);
      
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API}/tenants`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const mapped = (data.tenants || []).map(t => ({
          id: t.lease_id || t.id,
          tenant_id: t.user_id || t.id,
          tenant_name: `${t.first_name || ""} ${t.last_name || ""}`.trim(),
          unit_id: t.unit_id,
          unit_number: t.unit_number,
          property_name: t.property_name || "Unknown",
          start_date: t.lease_start_date,
          end_date: t.lease_end_date,
          rent_amount: Number(t.rent_amount) || 0,
          frequency: t.payment_frequency || "monthly",
          payment_due_day: t.payment_due_day || 1,
          type: t.lease_type || "fixed",
          status: t.lease_status || "active",
        }));
        setLeases(mapped);
      } catch (fallbackErr) {
        setError(err.response?.data?.error || "Unable to connect to server");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchLeases(); }, [fetchLeases]);

  function handleRefresh() {
    setRefreshing(true);
    fetchLeases(true);
  }

  async function handleRenew(id, data) {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/leases/${id}/renew`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setLeases(prev => prev.map(l => l.id === id ? { ...l, end_date: data.leaseEnd, rent_amount: data.rentAmount } : l));
      toast.success("Lease renewed!");
    } catch (err) {
      toast.error("Failed to renew lease.");
    } finally {
      setSaving(false);
      setRenewalLease(null);
    }
  }

  
  const now = new Date();
  const filtered = leases.filter(l => {
    const end = new Date(l.end_date);
    const days = daysUntil(l.end_date);

    if (filter === "Active") return end >= now && l.type !== "month_to_month" && (days === null || days > 60);
    if (filter === "Expiring Soon") return end >= now && days !== null && days <= 60 && l.type !== "month_to_month";
    if (filter === "Expired") return end < now;
    if (filter === "Month-to-Month") return l.type === "month_to_month";
    return true;
  }).filter(l => {
    const q = search.toLowerCase();
    if (!q) return true;
    return [l.tenant_name, l.unit_number?.toString(), l.property_name]
      .some(s => (s || "").toLowerCase().includes(q));
  });


  const expiringSoon = leases.filter(l => {
    const days = daysUntil(l.end_date);
    const end = new Date(l.end_date);
    return end >= now && days !== null && days <= 60 && l.type !== "month_to_month";
  }).length;
  const expired = leases.filter(l => new Date(l.end_date) < now).length;
  const activeCount = leases.filter(l => new Date(l.end_date) >= now).length;
  const monthToMonth = leases.filter(l => l.type === "month_to_month").length;

  
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
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus, select:focus { border-color: ${C.borderFocus} !important; }
      `}</style>

      {/* SAVING OVERLAY */}
      {saving && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', padding: '1.2rem 1.8rem', display: 'flex', alignItems: 'center', gap: '0.8rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <span style={{ width: 18, height: 18, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 500, color: C.white, fontFamily: F.dm }}>Processing...</span>
          </div>
        </div>
      )}

      {/* RENEWAL MODAL */}
      {renewalLease && (
        <RenewalModal
          lease={renewalLease}
          onClose={() => setRenewalLease(null)}
          onConfirm={handleRenew}
        />
      )}

      {/* HEADER */}
      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}><Icon name="file-text" size={24} color={C.gold} />Leases</h1>
          <p style={S.subtitle}>
            {leases.length} leases · {activeCount} active · {expiringSoon} expiring soon · {expired} expired
          </p>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} style={btnPrimary}>
          <Icon name="refresh" size={14} /> {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div style={{ padding: '0.8rem 1rem', borderRadius: '3px', background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)', marginBottom: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name="warning" size={16} color={C.redLight} />
          <p style={{ fontSize: '0.75rem', color: C.redLight, flex: 1 }}>{error}</p>
          <button onClick={() => fetchLeases()} style={{ fontSize: '0.72rem', color: C.gold, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono, fontWeight: 500 }}>Retry</button>
        </div>
      )}

      {/* TABLE CARD */}
      <div style={cardStyle}>
        {/* TOOLBAR */}
        <div style={S.toolbarInner}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={S.filterBtn(filter === f)}>
                {f}
                {f === "Expiring Soon" && expiringSoon > 0 && <span style={{ marginLeft: '0.3rem', opacity: 0.7 }}>{expiringSoon}</span>}
              </button>
            ))}
          </div>
          <div style={S.searchWrap}>
            <Icon name="search" size={14} style={S.searchIcon} />
            <input type="text" placeholder="Search tenant, unit..." value={search} onChange={e => setSearch(e.target.value)} style={S.searchInput} />
          </div>
        </div>

        {/* TABLE */}
        {loading ? (
          <div style={S.loading}>
            <span style={{ width: 20, height: 20, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            Loading leases...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead>
                <tr>
                  {["Tenant", "Unit / Property", "Start Date", "End Date", "Remaining", "Rent", "Due Day", "Status", "Actions"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ ...S.td, textAlign: 'center', padding: '3rem 0', color: 'rgba(245,240,232,0.25)' }}>
                      No leases match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map(l => {
                  const remaining = daysUntil(l.end_date);
                  const isExpired = remaining !== null && remaining < 0;
                  const totalDays = daysBetween(l.start_date, l.end_date);
                  const elapsed = totalDays ? Math.round(((totalDays - (remaining || 0)) / totalDays) * 100) : 0;

                  return (
                    <tr key={l.id} style={{ transition: 'background 0.15s' }}
                      onMouseEnter={e => e.currentTarget.style.background = C.muted}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>

                      {/* Tenant */}
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(232,160,18,0.1)', color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.6rem', flexShrink: 0 }}>
                            {initials(l.tenant_name)}
                          </div>
                          <span style={{ fontWeight: 600, color: C.white, fontSize: '0.78rem' }}>{l.tenant_name}</span>
                        </div>
                      </td>

                      {/* Unit / Property */}
                      <td style={S.td}>
                        <span style={{ fontWeight: 500, color: C.white, fontSize: '0.75rem' }}>
                          {l.unit_number ? `Unit ${l.unit_number}` : "N/A"}
                        </span>
                        <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{l.property_name}</p>
                      </td>

                      {/* Start Date */}
                      <td style={{ ...S.td, color: 'rgba(245,240,232,0.4)', fontSize: '0.75rem' }}>
                        {formatDate(l.start_date)}
                      </td>

                      {/* End Date */}
                      <td style={{ ...S.td, fontSize: '0.75rem' }}>
                        <span style={{ fontWeight: 500, color: isExpired ? C.redLight : C.white }}>
                          {formatDate(l.end_date)}
                        </span>
                      </td>

                      {/* Remaining */}
                      <td style={S.td}>
                        {l.type === "month_to_month" ? (
                          <span style={{ color: C.blue, fontSize: '0.7rem', fontFamily: F.mono }}>Ongoing</span>
                        ) : isExpired ? (
                          <div>
                            <span style={{ color: C.redLight, fontSize: '0.7rem', fontWeight: 600 }}>
                              {Math.abs(remaining)}d ago
                            </span>
                            <div style={{ width: 80, height: 3, borderRadius: '2px', background: 'rgba(245,240,232,0.06)', marginTop: '0.3rem', overflow: 'hidden' }}>
                              <div style={{ height: 3, background: C.redLight, width: '100%' }} />
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span style={{ color: remaining <= 30 ? C.gold : C.greenLight, fontSize: '0.7rem', fontWeight: 600 }}>
                              {remaining}d left
                            </span>
                            <div style={{ width: 80, height: 3, borderRadius: '2px', background: 'rgba(245,240,232,0.06)', marginTop: '0.3rem', overflow: 'hidden' }}>
                              <div style={{
                                height: 3, borderRadius: '2px',
                                background: remaining <= 30 ? C.gold : C.greenLight,
                                width: `${Math.min(elapsed, 100)}%`,
                              }} />
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Rent */}
                      <td style={{ ...S.td, fontWeight: 600, color: C.white, fontSize: '0.78rem' }}>
                        {format(l.rent_amount)}
                        <span style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginLeft: '0.2rem' }}>
                          /{l.frequency === "monthly" ? "mo" : "wk"}
                        </span>
                      </td>

                      {/* Due Day */}
                      <td style={{ ...S.td, color: 'rgba(245,240,232,0.4)', fontFamily: F.mono, fontSize: '0.7rem' }}>
                        Day {l.payment_due_day || 1}
                      </td>

                      {/* Status */}
                      <td style={S.td}>
                        <LeaseStatusBadge lease={l} />
                      </td>

                      {/* Actions */}
                      <td style={S.td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button onClick={() => navigate(`/landlord/tenants/${l.tenant_id}`)}
                            style={{ fontSize: '0.7rem', fontWeight: 500, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                            Tenant
                          </button>
                          {(isExpired || (remaining !== null && remaining <= 60)) && l.type !== "month_to_month" && (
                            <button onClick={() => setRenewalLease(l)}
                              style={{ fontSize: '0.7rem', fontWeight: 500, color: C.greenLight, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}
                              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                              Renew
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* FOOTER */}
        <div style={S.footer}>
          <span>
            Showing <span style={{ color: C.white, fontWeight: 500 }}>{filtered.length}</span> of{" "}
            <span style={{ color: C.white, fontWeight: 500 }}>{leases.length}</span> leases
          </span>
        </div>
      </div>
    </div>
  );
}