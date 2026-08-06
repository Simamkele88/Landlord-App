// LANDLORD COLLECTIONS PAGE 
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

const cardStyle = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: "6px", overflow: "hidden",
};
const btnPrimary = {
  background: C.gold, color: C.black, border: "none",
  padding: "0.55rem 1.2rem", fontSize: "0.74rem", fontWeight: 700,
  fontFamily: F.dm, letterSpacing: "0.04em", borderRadius: "3px",
  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "0.4rem",
};
const btnGhost = {
  background: "transparent", color: "rgba(245,240,232,0.5)",
  border: `1px solid ${C.border}`, padding: "0.55rem 1.1rem",
  fontSize: "0.74rem", fontWeight: 500, fontFamily: F.dm,
  letterSpacing: "0.04em", borderRadius: "3px", cursor: "pointer",
};
const inputStyle = {
  fontSize: "0.78rem", padding: "0.55rem 0.8rem", borderRadius: "3px",
  background: C.black, border: `1px solid ${C.border}`, color: C.white,
  fontFamily: F.dm, outline: "none", resize: "none",
};
const modalOverlay = {
  position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center",
  justifyContent: "center", padding: "1rem", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
};
const pillStyle = (color, bg, border) => ({
  display: "inline-flex", alignItems: "center", gap: "0.3rem",
  fontSize: "0.58rem", fontWeight: 700, padding: "0.12rem 0.5rem",
  borderRadius: "3px", fontFamily: F.mono, letterSpacing: "0.04em",
  textTransform: "uppercase", color, background: bg, border,
});

function fmt(n)        { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
function initials(n = "") { return (n || "").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase(); }
function daysAgo(d)    { if (!d) return 0; return Math.floor((Date.now() - new Date(d)) / 86400000); }


const STATUS_CONFIG = {
  flagged:           { color: C.redLight,   bg: "rgba(224,90,74,0.1)",   border: "1px solid rgba(224,90,74,0.2)",   label: "Flagged" },
  active:            { color: C.redLight,   bg: "rgba(224,90,74,0.1)",   border: "1px solid rgba(224,90,74,0.2)",   label: "In Collections" },
  collections:       { color: C.redLight,   bg: "rgba(224,90,74,0.1)",   border: "1px solid rgba(224,90,74,0.2)",   label: "Collections" },
  repayment_agreed:  { color: C.blue,       bg: "rgba(58,143,212,0.1)",  border: "1px solid rgba(58,143,212,0.2)",  label: "Repayment Agreed" },
  repayment_plan:    { color: C.blue,       bg: "rgba(58,143,212,0.1)",  border: "1px solid rgba(58,143,212,0.2)",  label: "Repayment Plan" },
  legal:             { color: C.purple,     bg: "rgba(139,92,246,0.1)",  border: "1px solid rgba(139,92,246,0.2)",  label: "Legal" },
  // "recovered" is what the backend sets on plan completion
  recovered:         { color: C.greenLight, bg: "rgba(26,122,74,0.1)",   border: "1px solid rgba(76,186,122,0.2)",  label: "Recovered" },
  resolved:          { color: C.greenLight, bg: "rgba(26,122,74,0.1)",   border: "1px solid rgba(76,186,122,0.2)",  label: "Resolved" },
  written_off:       { color: "rgba(245,240,232,0.35)", bg: "rgba(245,240,232,0.04)", border: "1px solid rgba(245,240,232,0.1)", label: "Written Off" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.flagged;
  return (
    <span style={pillStyle(cfg.color, cfg.bg, cfg.border)}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color }} />
      {cfg.label}
    </span>
  );
}


function SendToCollectionsModal({ account, onClose, onConfirm }) {
  const [note, setNote]       = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/collections`, {
        tenant_id:           account.tenant_id,
        lease_id:            account.lease_id,
        outstanding_balance: account.outstanding_balance || account.balance || 0,
        notes:               note.trim() || null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      onConfirm(account.id);
      onClose();
    } catch (err) { console.error("Send to collections:", err); }
    finally { setLoading(false); }
  }

  return (
    <div style={modalOverlay}>
      <div style={{ width: "100%", maxWidth: 420, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: "6px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <div style={{ width: 36, height: 36, borderRadius: "6px", background: "rgba(224,90,74,0.12)", border: "1px solid rgba(224,90,74,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="alert-circle" size={16} color={C.redLight} />
            </div>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: "0.04em" }}>Send to Collections</h3>
              <p style={{ fontSize: "0.65rem", color: "rgba(245,240,232,0.3)", fontFamily: F.mono }}>
                {account.tenant_name} · {fmt(account.outstanding_balance || account.balance)} outstanding
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: "0.2rem", background: "transparent", border: "none", cursor: "pointer", color: "rgba(245,240,232,0.3)" }}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ padding: "1.2rem 1.5rem" }}>
          <p style={{ fontSize: "0.78rem", color: "rgba(245,240,232,0.5)", lineHeight: 1.6, marginBottom: "0.8rem" }}>
            You are about to escalate{" "}
            <strong style={{ color: C.white }}>{account.tenant_name}</strong> to collections for{" "}
            <strong style={{ color: C.redLight }}>{fmt(account.outstanding_balance || account.balance)}</strong>.
            The tenant will be notified.
          </p>
          <textarea rows={3} value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note for your records (optional)..."
            style={{ ...inputStyle, width: "100%", minHeight: 60 }} />
        </div>
        <div style={{ display: "flex", gap: "0.8rem", padding: "0 1.5rem 1.5rem" }}>
          <button onClick={onClose} disabled={loading} style={{ ...btnGhost, flex: 1 }}>Cancel</button>
          <button onClick={handleConfirm} disabled={loading} style={{
            flex: 1, padding: "0.6rem", borderRadius: "3px", fontSize: "0.74rem", fontWeight: 600, fontFamily: F.dm,
            background: C.redLight, color: C.white, border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
          }}>
            {loading
              ? <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: C.white, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
              : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

function InvoiceBreakdownModal({ account, onClose }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API}/collections/${account.id}/invoices`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoices(data.invoices || []);
      } catch { /* show empty state */ }
      finally { setLoading(false); }
    }
    load();
  }, [account.id]);

  return (
    <div style={modalOverlay}>
      <div style={{ width: "100%", maxWidth: 520, background: C.muted2, border: `1px solid ${C.border}`, borderRadius: "6px", boxShadow: "0 20px 60px rgba(0,0,0,0.5)", display: "flex", flexDirection: "column", maxHeight: "80vh" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 1.5rem", borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: "0.04em" }}>Invoice Breakdown</h3>
            <p style={{ fontSize: "0.65rem", color: "rgba(245,240,232,0.3)", fontFamily: F.mono }}>{account.tenant_name} · {fmt(account.outstanding_balance || account.balance)} outstanding</p>
          </div>
          <button onClick={onClose} style={{ padding: "0.2rem", background: "transparent", border: "none", cursor: "pointer", color: "rgba(245,240,232,0.3)" }}>
            <Icon name="x" size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "rgba(245,240,232,0.3)" }}>Loading...</div>
          ) : invoices.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "rgba(245,240,232,0.25)" }}>No linked invoices found.</div>
          ) : (
            <table style={{ width: "100%", fontSize: "0.72rem", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Invoice #", "Period", "Amount Due", "Paid", "Remaining", "Status"].map(h => (
                    <th key={h} style={{ fontSize: "0.58rem", fontWeight: 600, color: "rgba(245,240,232,0.3)", fontFamily: F.mono, letterSpacing: "0.06em", textTransform: "uppercase", padding: "0.5rem 0.6rem", textAlign: "left", borderBottom: `1px solid ${C.border}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={inv.id || i} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: "0.5rem 0.6rem", fontWeight: 500, color: C.white, fontFamily: F.mono, fontSize: "0.68rem" }}>{inv.invoice_number}</td>
                    <td style={{ padding: "0.5rem 0.6rem", color: "rgba(245,240,232,0.4)" }}>
                      {inv.billing_period_start ? new Date(inv.billing_period_start).toLocaleDateString("en-ZA", { month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ padding: "0.5rem 0.6rem", fontWeight: 600, color: C.white }}>{fmt(inv.amount_due)}</td>
                    <td style={{ padding: "0.5rem 0.6rem", color: C.greenLight }}>{fmt(inv.paid_amount)}</td>
                    <td style={{ padding: "0.5rem 0.6rem", fontWeight: 600, color: Number(inv.remaining_balance) > 0 ? C.redLight : C.greenLight }}>
                      {Number(inv.remaining_balance) > 0 ? fmt(inv.remaining_balance) : "Settled"}
                    </td>
                    <td style={{ padding: "0.5rem 0.6rem" }}>
                      <span style={pillStyle(
                        inv.status === "paid" ? C.greenLight : inv.status === "overdue" ? C.redLight : C.gold,
                        inv.status === "paid" ? "rgba(26,122,74,0.08)" : "rgba(232,160,18,0.06)",
                        `1px solid ${inv.status === "paid" ? "rgba(76,186,122,0.15)" : "rgba(232,160,18,0.12)"}`,
                      )}>{inv.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ padding: "0.8rem 1.5rem", borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
          <button onClick={onClose} style={{ ...btnGhost, width: "100%" }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── FILTERS ───────────────────────────────────────────────────
const FILTERS = ["All", "Active", "Repayment Plan", "Legal", "Recovered", "Written Off"];

function matchesFilter(a, filter) {
  const s = a.status || "flagged";
  if (filter === "All")           return true;
  if (filter === "Active")        return ["flagged","active","collections"].includes(s);
  if (filter === "Repayment Plan") return ["repayment_agreed","repayment_plan"].includes(s);
  if (filter === "Legal")         return s === "legal";
  if (filter === "Recovered")     return s === "recovered" || s === "resolved";
  if (filter === "Written Off")   return s === "written_off";
  return true;
}

// ── MAIN ──────────────────────────────────────────────────────
export default function Collections() {
  useDocumentTitle("Collections");
  const navigate = useNavigate();
  const toast    = useToast();

  const [accounts, setAccounts] = useState([]);
  const [filter, setFilter]     = useState("All");
  const [search, setSearch]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [sendModal, setSendModal]       = useState(null);
  const [invoiceModal, setInvoiceModal] = useState(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/collections`, { headers: { Authorization: `Bearer ${token}` } });
      setAccounts(data.accounts || data.collections || []);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load collections";
      setError(msg);
      toast.error(msg);
    } finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  function handleSentToCollections(id) {
    setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: "collections" } : a));
    toast.success("Account sent to collections. Tenant notified.");
  }

  async function handleUpdateStatus(id, newStatus) {
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`${API}/collections/${id}/status`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
      toast.success("Status updated.");
    } catch { toast.error("Failed to update status."); }
  }

  const q = search.toLowerCase();
  const filtered = accounts
    .filter(a => matchesFilter(a, filter))
    .filter(a => !q || [a.tenant_name, a.unit_number, a.property_name].some(s => (s || "").toLowerCase().includes(q)));

  const inCollections   = accounts.filter(a => ["flagged","active","collections"].includes(a.status || "flagged")).length;
  const totalOutstanding= accounts
    .filter(a => ["flagged","active","collections"].includes(a.status || "flagged"))
    .reduce((s, a) => s + Number(a.outstanding_balance || a.balance || 0), 0);
  const onRepaymentPlan = accounts.filter(a => ["repayment_agreed","repayment_plan"].includes(a.status)).length;


  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    subtitle: {  fontSize: '1.2rem', color: 'white', fontWeight: 500, fontFamily: F.mono, marginTop: '0.3rem', opacity: 1, letterSpacing: '0.02em',},
    toolbarInner: { display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 1rem', flexWrap: 'wrap' },
    filterBtn: (active) => ({ padding: '0.4rem 0.8rem', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 600, fontFamily: F.mono, letterSpacing: '0.04em', border: `1px solid ${active ? C.gold : C.border}`, background: active ? 'rgba(232,160,18,0.12)' : 'transparent', color: active ? C.gold : 'rgba(245,240,232,0.4)', cursor: 'pointer', transition: 'all 0.15s' }),
    searchWrap: { position: 'relative', marginLeft: 'auto' },
    searchIcon: { position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.25)' },
    searchInput: { padding: '0.5rem 0.8rem 0.5rem 2.25rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, fontSize: '0.78rem', outline: 'none', width: 220 },
    table: { width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' },
    th: { fontSize: '0.6rem', fontWeight: 600, color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.7rem 1rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` },
    td: { padding: '0.7rem 1rem', borderBottom: `1px solid ${C.border}` },
    footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.8rem 1rem', fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono },
    loadMoreWrap: { display: 'flex', justifyContent: 'center', padding: '1rem' },
  };

  return (
    <div style={S.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {sendModal   && <SendToCollectionsModal  account={sendModal}   onClose={() => setSendModal(null)}   onConfirm={handleSentToCollections} />}
      {invoiceModal && <InvoiceBreakdownModal  account={invoiceModal} onClose={() => setInvoiceModal(null)} />}

      {/* HEADER */}
      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}><Icon name="alert-circle" size={24} color={C.gold} />Collections</h1>
          <p style={S.subtitle}>
            {inCollections} in collections · {fmt(totalOutstanding)} outstanding · {onRepaymentPlan} on repayment plans
          </p>
        </div>
        <button onClick={fetchAccounts} style={btnPrimary}><Icon name="refresh-cw" size={14} /> Refresh</button>
      </div>

    

      {error && (
        <div style={{ padding: "0.8rem 1rem", borderRadius: "3px", background: "rgba(224,90,74,0.08)", border: "1px solid rgba(224,90,74,0.2)", marginBottom: "1.2rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <Icon name="alert-circle" size={16} color={C.redLight} />
          <p style={{ fontSize: "0.75rem", color: C.redLight, flex: 1 }}>{error}</p>
          <button onClick={fetchAccounts} style={{ fontSize: "0.72rem", color: C.gold, background: "none", border: "none", cursor: "pointer", fontFamily: F.mono, fontWeight: 500 }}>Retry</button>
        </div>
      )}

      <div style={cardStyle}>
        <div style={S.toolbarInner}>
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)} style={S.filterBtn(filter === f)}>{f}</button>
            ))}
          </div>
          <div style={S.searchWrap}>
            <Icon name="search" size={14} style={{ position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)", color: "rgba(245,240,232,0.25)" }} />
            <input placeholder="Search tenant..." value={search} onChange={e => setSearch(e.target.value)} style={S.searchInput} />
          </div>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "5rem 0", color: "rgba(245,240,232,0.3)", gap: "0.8rem" }}>
            <span style={{ width: 20, height: 20, border: "2px solid rgba(245,240,232,0.1)", borderTopColor: C.gold, borderRadius: "50%", animation: "spin 0.6s linear infinite" }} />
            Loading accounts...
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", fontSize: "0.75rem", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Tenant", "Unit / Property", "Balance", "Days Overdue", "Status", "Last Payment", "Notes", "Actions"].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ ...S.td, textAlign: "center", padding: "3rem 0", color: "rgba(245,240,232,0.25)" }}>No accounts found.</td></tr>
                )}
                {filtered.map(a => {
                  const status   = a.status || "flagged";
                  const balance  = Number(a.outstanding_balance || a.balance || 0);
                  const overdue  = a.days_overdue || daysAgo(a.last_payment_date);
                  const isActive = ["flagged","active","collections"].includes(status);
                  return (
                    <tr key={a.id}
                      onMouseEnter={e => e.currentTarget.style.background = C.muted}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                      style={{ transition: "background 0.15s" }}>

                      <td style={S.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(232,160,18,0.1)", color: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.bebas, fontSize: "0.6rem", flexShrink: 0 }}>
                            {initials(a.tenant_name)}
                          </div>
                          <span style={{ fontWeight: 600, color: C.white }}>{a.tenant_name || "—"}</span>
                        </div>
                      </td>

                      <td style={S.td}>
                        <div style={{ color: "rgba(245,240,232,0.6)" }}>{a.unit_number ? `Unit ${a.unit_number}` : "—"}</div>
                        <div style={{ fontSize: "0.65rem", color: "rgba(245,240,232,0.25)", fontFamily: F.mono }}>{a.property_name || "—"}</div>
                      </td>

                      <td style={{ ...S.td, fontWeight: 700, color: balance > 0 ? C.redLight : C.greenLight }}>
                        {balance > 0 ? fmt(balance) : "Cleared"}
                      </td>

                      <td style={{ ...S.td, fontWeight: 600, color: overdue > 90 ? C.redLight : overdue > 30 ? C.gold : "rgba(245,240,232,0.5)" }}>
                        {overdue > 0 ? `${overdue}d` : "—"}
                      </td>

                      <td style={S.td}><StatusBadge status={status} /></td>

                      <td style={{ ...S.td, fontFamily: F.mono, fontSize: "0.7rem", color: "rgba(245,240,232,0.35)" }}>
                        {a.last_payment_date ? formatDate(a.last_payment_date) : "Never"}
                      </td>

                      <td style={{ ...S.td, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "rgba(245,240,232,0.3)", fontSize: "0.68rem" }}>
                        {a.notes || "—"}
                      </td>

                      <td style={S.td}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <button onClick={() => setInvoiceModal(a)}
                            style={{ fontSize: "0.68rem", fontWeight: 500, color: C.blue, background: "none", border: "none", cursor: "pointer", fontFamily: F.mono }}>
                            Invoices
                          </button>
                          <button onClick={() => navigate(`/landlord/tenants/${a.tenant_id}`)}
                            style={{ fontSize: "0.68rem", fontWeight: 500, color: C.blue, background: "none", border: "none", cursor: "pointer", fontFamily: F.mono }}>
                            Profile
                          </button>
                          {isActive && (
                            <button onClick={() => setSendModal(a)}
                              style={{ fontSize: "0.68rem", fontWeight: 500, color: C.redLight, background: "none", border: "none", cursor: "pointer", fontFamily: F.mono }}>
                              Send
                            </button>
                          )}
                          {status === "collections" && (
                            <>
                              <button onClick={() => handleUpdateStatus(a.id, "legal")}
                                style={{ fontSize: "0.68rem", fontWeight: 500, color: C.purple, background: "none", border: "none", cursor: "pointer", fontFamily: F.mono }}>
                                Legal
                              </button>
                              <button onClick={() => handleUpdateStatus(a.id, "written_off")}
                                style={{ fontSize: "0.68rem", fontWeight: 500, color: "rgba(245,240,232,0.3)", background: "none", border: "none", cursor: "pointer", fontFamily: F.mono }}>
                                Write Off
                              </button>
                            </>
                          )}
                          {["repayment_agreed","repayment_plan"].includes(status) && (
                            <button onClick={() => navigate("/landlord/payments/plans")}
                              style={{ fontSize: "0.68rem", fontWeight: 500, color: C.blue, background: "none", border: "none", cursor: "pointer", fontFamily: F.mono }}>
                              View Plan
                            </button>
                          )}
                          {["recovered","resolved"].includes(status) && (
                            <span style={{ fontSize: "0.65rem", color: C.greenLight, fontFamily: F.mono, fontStyle: "italic" }}>Cleared</span>
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

        <div style={S.footer}>
          <span>Showing <strong style={{ color: C.white }}>{filtered.length}</strong> of <strong style={{ color: C.white }}>{accounts.length}</strong> accounts</span>
        </div>
      </div>
    </div>
  );
}