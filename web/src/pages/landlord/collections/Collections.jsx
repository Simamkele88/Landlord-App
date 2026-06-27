/* eslint-disable no-unused-vars */
// LANDLORD COLLECTIONS PAGE 
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

const FILTERS = ["All", "Collections", "Repayment Plan", "Legal", "Recovered", "Written Off"];

function format(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
function initials(name = "") { return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(); }
function daysAgo(dateStr) { if (!dateStr) return 0; return Math.floor((Date.now() - new Date(dateStr)) / 86400000); }

const pillStyle = (color, bg, border) => ({
  display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
  fontSize: '0.58rem', fontWeight: 700, padding: '0.12rem 0.5rem',
  borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em',
  textTransform: 'uppercase', color, background: bg, border,
});

const STATUS_CONFIG = {
  "collections":    { color: C.redLight,   bg: 'rgba(224,90,74,0.1)',   border: '1px solid rgba(224,90,74,0.2)',  label: "Collections"   },
  "repayment_plan": { color: C.blue,       bg: 'rgba(58,143,212,0.1)',   border: '1px solid rgba(58,143,212,0.2)', label: "Repayment Plan" },
  "legal":          { color: C.purple,     bg: 'rgba(139,92,246,0.1)',   border: '1px solid rgba(139,92,246,0.2)', label: "Legal"          },
  "recovered":      { color: C.greenLight, bg: 'rgba(26,122,74,0.1)',    border: '1px solid rgba(76,186,122,0.2)', label: "Recovered"      },
  "written_off":    { color: 'rgba(245,240,232,0.4)', bg: 'rgba(245,240,232,0.04)', border: '1px solid rgba(245,240,232,0.1)', label: "Written Off" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["collections"];
  return <span style={pillStyle(cfg.color, cfg.bg, cfg.border)}><span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color }} />{cfg.label}</span>;
}

const cardStyle = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden',
};

const btnPrimary = {
  background: C.gold, color: C.black, border: 'none',
  padding: '0.55rem 1.2rem', fontSize: '0.74rem', fontWeight: 700,
  fontFamily: F.dm, letterSpacing: '0.04em', borderRadius: '3px',
  cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
};

const inputStyle = {
  fontSize: '0.78rem', padding: '0.55rem 0.8rem', borderRadius: '3px',
  background: C.black, border: `1px solid ${C.border}`, color: C.white,
  fontFamily: F.dm, outline: 'none', resize: 'none',
};


function SendToCollectionsModal({ account, onClose, onConfirm }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/collections/${account.id}/send`, { note: note.trim() || null }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onConfirm(account.id);
      onClose();
    } catch (err) { /* handle */ }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
      <div style={{ width: '100%', maxWidth: 420, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: '6px', background: 'rgba(224,90,74,0.12)', border: '1px solid rgba(224,90,74,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="warning" size={16} color={C.redLight} />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Send to Collections</h3>
              <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{account.tenant_name} · {format(account.balance)} outstanding</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '0.2rem', borderRadius: '3px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(245,240,232,0.3)' }}
            onMouseEnter={e => e.currentTarget.style.color = C.white}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(245,240,232,0.3)'}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: '1.2rem 1.5rem' }}>
          <p style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.5)', lineHeight: 1.6, marginBottom: '0.8rem' }}>
            You are about to send <strong style={{ color: C.white }}>{account.tenant_name}</strong> to collections for an outstanding balance of <strong style={{ color: C.redLight }}>{format(account.balance)}</strong>.
          </p>
          <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note for the collections agent (optional)..."
            style={{ ...inputStyle, width: '100%', minHeight: 60 }} />
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '0 1.5rem 1.5rem' }}>
          <button onClick={onClose} disabled={loading} style={{ flex: 1, padding: '0.6rem', borderRadius: '3px', fontSize: '0.74rem', fontWeight: 500, fontFamily: F.dm, background: 'transparent', border: `1px solid ${C.border}`, color: 'rgba(245,240,232,0.4)', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleConfirm} disabled={loading} style={{ flex: 1, padding: '0.6rem', borderRadius: '3px', fontSize: '0.74rem', fontWeight: 600, fontFamily: F.dm, background: C.red, color: C.white, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.2)', borderTopColor: C.white, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}


export default function Collections() {
  useDocumentTitle("Collections");
  const navigate = useNavigate();
  const toast = useToast();

  const [accounts, setAccounts] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sendModal, setSendModal] = useState(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/collections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts(data.accounts || []);
    } catch (err) {
    
      setAccounts([
        { id: 1, tenant_name: "Zandile Khumalo", tenant_id: 4, unit: "Unit 301", property: "Yeoville Corner", balance: 4200, days_overdue: 75, last_payment_date: new Date(Date.now() - 75 * 86400000).toISOString(), collections_status: "collections", notes: "Tenant unresponsive to calls" },
        { id: 2, tenant_name: "Michael Nkosi", tenant_id: 5, unit: "Unit 202", property: "Berea Flats", balance: 1500, days_overdue: 35, last_payment_date: new Date(Date.now() - 35 * 86400000).toISOString(), collections_status: "overdue", notes: null },
        { id: 3, tenant_name: "Sipho Dlamini", tenant_id: 1, unit: "Unit 101", property: "Hillbrow Heights", balance: 2800, days_overdue: 120, last_payment_date: new Date(Date.now() - 120 * 86400000).toISOString(), collections_status: "legal", notes: "Attorney notified — case pending" },
        { id: 4, tenant_name: "Lerato Mokoena", tenant_id: 2, unit: "Unit 102", property: "Hillbrow Heights", balance: 950, days_overdue: 21, last_payment_date: new Date(Date.now() - 21 * 86400000).toISOString(), collections_status: "repayment_plan", notes: "Agreed to pay R950 over 2 instalments" },
      ]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  async function handleSendToCollections(id) {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, collections_status: "collections" } : a));
    toast.success("Sent to collections!");
  }

  async function handleUpdateStatus(id, newStatus) {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/collections/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, collections_status: newStatus } : a));
      toast.success("Status updated!");
    } catch { toast.error("Failed to update"); }
  }

  const filtered = accounts.filter(a => {
    if (filter === "All") return true;
    if (filter === "Collections") return a.collections_status === "collections" || a.collections_status === "overdue";
    if (filter === "Repayment Plan") return a.collections_status === "repayment_plan";
    if (filter === "Legal") return a.collections_status === "legal";
    if (filter === "Recovered") return a.collections_status === "recovered";
    if (filter === "Written Off") return a.collections_status === "written_off";
    return true;
  }).filter(a => {
    const q = search.toLowerCase();
    return !q || [a.tenant_name, a.unit, a.property].some(s => (s || "").toLowerCase().includes(q));
  });

  const inCollections = accounts.filter(a => a.collections_status === "collections" || a.collections_status === "overdue").length;
  const totalOutstanding = accounts.filter(a => a.collections_status === "collections" || a.collections_status === "overdue").reduce((s, a) => s + (Number(a.balance) || 0), 0);
  const onRepaymentPlan = accounts.filter(a => a.collections_status === "repayment_plan").length;

  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    subtitle: { fontSize: '0.75rem', color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, marginTop: '0.3rem' },
    toolbarInner: { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', flexWrap: 'wrap', borderBottom: `1px solid ${C.border}` },
    filterBtn: (active) => ({ padding: '0.4rem 0.8rem', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 600, fontFamily: F.mono, letterSpacing: '0.04em', border: `1px solid ${active ? C.gold : C.border}`, background: active ? 'rgba(232,160,18,0.12)' : 'transparent', color: active ? C.gold : 'rgba(245,240,232,0.4)', cursor: 'pointer', transition: 'all 0.15s' }),
    searchWrap: { position: 'relative', marginLeft: 'auto' },
    searchIcon: { position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.25)' },
    searchInput: { padding: '0.5rem 0.8rem 0.5rem 2.25rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, fontSize: '0.78rem', outline: 'none', width: 220 },
    loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '5rem 0', color: 'rgba(245,240,232,0.3)', gap: '0.8rem' },
    th: { fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.7rem 1rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` },
    td: { padding: '0.7rem 1rem', borderBottom: `1px solid ${C.border}` },
    footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, borderTop: `1px solid ${C.border}` },
    statCard: (color, bg) => ({ background: bg, border: `1px solid ${color}20`, borderRadius: '6px', padding: '1rem 1.2rem', textAlign: 'center' }),
  };

  return (
    <div style={S.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input:focus { border-color: ${C.borderFocus} !important; }`}</style>

      {/* Modals */}
      {sendModal && <SendToCollectionsModal account={sendModal} onClose={() => setSendModal(null)} onConfirm={handleSendToCollections} />}

      {/* Header */}
      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}><Icon name="collections" size={24} color={C.gold} />Collections</h1>
          <p style={S.subtitle}>{inCollections} in collections · {format(totalOutstanding)} outstanding · {onRepaymentPlan} on repayment plans</p>
        </div>
        <button onClick={fetchAccounts} style={btnPrimary}><Icon name="refresh" size={14} /> Refresh</button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.6rem', marginBottom: '1.2rem' }}>
        {[
          { label: "In Collections", value: inCollections, color: C.redLight, bg: 'rgba(224,90,74,0.06)' },
          { label: "Outstanding", value: format(totalOutstanding), color: C.redLight, bg: 'rgba(224,90,74,0.06)' },
          { label: "Repayment Plans", value: onRepaymentPlan, color: C.blue, bg: 'rgba(58,143,212,0.06)' },
          { label: "Recovered", value: accounts.filter(a => a.collections_status === "recovered").length, color: C.greenLight, bg: 'rgba(26,122,74,0.06)' },
        ].map(s => (
          <div key={s.label} style={S.statCard(s.color, s.bg)}>
            <p style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '0.2rem' }}>{s.label}</p>
            <p style={{ fontSize: '1.3rem', fontWeight: 700, color: s.color, fontFamily: F.bebas, letterSpacing: '0.03em' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={cardStyle}>
        {/* Toolbar */}
        <div style={S.toolbarInner}>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={S.filterBtn(filter === f)}>{f}</button>
            ))}
          </div>
          <div style={S.searchWrap}>
            <Icon name="search" size={14} style={S.searchIcon} />
            <input placeholder="Search tenant..." value={search} onChange={e => setSearch(e.target.value)} style={S.searchInput} />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={S.loading}>
            <span style={{ width: 20, height: 20, border: '2px solid rgba(245,240,232,0.1)', borderTopColor: C.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            Loading accounts...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {["Tenant", "Unit/Property", "Balance", "Days Overdue", "Status", "Last Payment", "Notes", "Actions"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ ...S.td, textAlign: 'center', padding: '3rem 0', color: 'rgba(245,240,232,0.25)' }}>No accounts found.</td></tr>
                )}
                {filtered.map(a => (
                  <tr key={a.id} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.muted}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    
                    {/* Tenant */}
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(232,160,18,0.1)', color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.6rem', flexShrink: 0 }}>
                          {initials(a.tenant_name)}
                        </div>
                        <span style={{ fontWeight: 600, color: C.white }}>{a.tenant_name}</span>
                      </div>
                    </td>

                    {/* Unit/Property */}
                    <td style={S.td}>
                      <span style={{ color: 'rgba(245,240,232,0.5)', fontSize: '0.75rem' }}>{a.unit || "—"}</span>
                      <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono }}>{a.property || "—"}</p>
                    </td>

                    {/* Balance */}
                    <td style={{ ...S.td, fontWeight: 600, color: C.redLight }}>{format(a.balance)}</td>

                    {/* Days Overdue */}
                    <td style={{ ...S.td, fontWeight: 600, color: (a.days_overdue || daysAgo(a.last_payment_date)) > 90 ? C.redLight : C.gold }}>
                      {a.days_overdue || daysAgo(a.last_payment_date)}d
                    </td>

                    {/* Status */}
                    <td style={S.td}><StatusBadge status={a.collections_status} /></td>

                    {/* Last Payment */}
                    <td style={{ ...S.td, color: 'rgba(245,240,232,0.35)', fontSize: '0.7rem', fontFamily: F.mono }}>
                      {a.last_payment_date ? formatDate(a.last_payment_date) : "Never"}
                    </td>

                    {/* Notes */}
                    <td style={{ ...S.td, maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'rgba(245,240,232,0.3)', fontSize: '0.68rem' }}>
                      {a.notes || "—"}
                    </td>

                    {/* Actions */}
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button onClick={() => navigate(`/landlord/tenants/${a.tenant_id}`)}
                          style={{ fontSize: '0.68rem', fontWeight: 500, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>View</button>
                        
                        {(a.collections_status !== "collections" && a.collections_status !== "legal" && a.collections_status !== "written_off") && (
                          <button onClick={() => setSendModal(a)}
                            style={{ fontSize: '0.68rem', fontWeight: 500, color: C.redLight, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>Send</button>
                        )}
                        
                        {a.collections_status === "collections" && (
                          <>
                            <button onClick={() => handleUpdateStatus(a.id, "legal")}
                              style={{ fontSize: '0.68rem', fontWeight: 500, color: C.purple, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}
                              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>Legal</button>
                            <button onClick={() => handleUpdateStatus(a.id, "written_off")}
                              style={{ fontSize: '0.68rem', fontWeight: 500, color: 'rgba(245,240,232,0.3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}
                              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>Write Off</button>
                          </>
                        )}
                        
                        {a.collections_status === "repayment_plan" && (
                          <button onClick={() => navigate("/landlord/payments/plans")}
                            style={{ fontSize: '0.68rem', fontWeight: 500, color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>View Plan</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={S.footer}>
          <span>Showing <span style={{ color: C.white, fontWeight: 500 }}>{filtered.length}</span> of <span style={{ color: C.white, fontWeight: 500 }}>{accounts.length}</span> accounts</span>
        </div>
      </div>
    </div>
  );
}