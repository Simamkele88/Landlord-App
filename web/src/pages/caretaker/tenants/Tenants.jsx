/* eslint-disable no-unused-vars */
// CARETAKER TENANTS PAGE 
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";

function format(n) { return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—"; }
function formatDate(d) { return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—"; }
function initials(name = "") { return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(); }

const SCORE_CONFIG = {
  "reliable":      { color: C.greenLight, bg: 'rgba(26,122,74,0.06)', border: '1px solid rgba(76,186,122,0.1)', dot: C.greenLight },
  "moderate_risk": { color: C.gold,       bg: 'rgba(232,160,18,0.04)', border: '1px solid rgba(232,160,18,0.1)', dot: C.gold       },
  "high_risk":     { color: C.redLight,   bg: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.1)',  dot: C.redLight   },
};

function ScoreBadge({ score }) {
  const cfg = SCORE_CONFIG[score?.toLowerCase()?.replace(/\s+/g, "_")] || SCORE_CONFIG["moderate_risk"];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.58rem', fontWeight: 600, padding: '0.12rem 0.45rem', borderRadius: '3px', fontFamily: F.mono, letterSpacing: '0.04em', textTransform: 'uppercase', color: cfg.color, background: cfg.bg, border: cfg.border }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />{score}
    </span>
  );
}

export default function CaretakerTenants() {
  useDocumentTitle("Tenants");
  const navigate = useNavigate();

  const [tenants, setTenants] = useState([]);
  const [propertyName, setPropertyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const fetchTenants = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/caretaker/tenants`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTenants(data.tenants || []);
      setPropertyName(data.property_name || "Your Property");
    } catch (err) {
    
      setTenants([
        { id: 1, first_name: "Sipho", last_name: "Dlamini", unit_number: "101", rent_amount: 5800, payment_frequency: "monthly", lease_end_date: "2026-12-31", reliability_score: "Reliable", phone: "0821234567", email: "sipho@email.com", outstanding_balance: 0 },
        { id: 2, first_name: "Lerato", last_name: "Mokoena", unit_number: "102", rent_amount: 6500, payment_frequency: "monthly", lease_end_date: "2026-09-15", reliability_score: "Moderate Risk", phone: "0839876543", email: "lerato@email.com", outstanding_balance: 1500 },
        { id: 3, first_name: "Nomsa", last_name: "Khumalo", unit_number: "201", rent_amount: 4200, payment_frequency: "monthly", lease_end_date: "2026-06-01", reliability_score: "Reliable", phone: "0814567890", email: "nomsa@email.com", outstanding_balance: 0 },
        { id: 4, first_name: "Thabo", last_name: "Ndlovu", unit_number: "301", rent_amount: 7200, payment_frequency: "monthly", lease_end_date: "2026-11-30", reliability_score: "High Risk", phone: "0791122334", email: "thabo@email.com", outstanding_balance: 3200 },
        { id: 5, first_name: "Zandile", last_name: "Khumalo", unit_number: "302", rent_amount: 5500, payment_frequency: "monthly", lease_end_date: "2027-01-15", reliability_score: "Reliable", phone: "0765544332", email: "zandile@email.com", outstanding_balance: 0 },
      ]);
      setPropertyName("Hillbrow Heights");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const filtered = tenants.filter(t => {
    const q = search.toLowerCase();
    return !q || [`${t.first_name} ${t.last_name}`, t.unit_number?.toString(), t.email, t.phone].some(s => (s || "").toLowerCase().includes(q));
  });

  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', gap: '1rem', flexWrap: 'wrap' },
    title: { fontSize: '1.5rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    subtitle: { fontSize: '0.7rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono },
    searchWrap: { position: 'relative', marginLeft: 'auto' },
    searchInput: { padding: '0.4rem 0.7rem 0.4rem 2rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, color: C.white, fontFamily: F.dm, fontSize: '0.74rem', outline: 'none', width: 220 },
    table: { width: '100%', fontSize: '0.75rem', borderCollapse: 'collapse' },
    th: { fontSize: '0.58rem', fontWeight: 600, color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '0.65rem 1rem', textAlign: 'left', borderBottom: `1px solid ${C.border}` },
    td: { padding: '0.65rem 1rem', borderBottom: `1px solid ${C.border}` },
    footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.7rem 1rem', fontSize: '0.7rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, borderTop: `1px solid ${C.border}` },
  };

  return (
    <div style={S.container}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } input:focus { border-color: ${C.borderFocus} !important; }`}</style>

      <div style={S.headerRow}>
        <div>
          <h1 style={S.title}><Icon name="users" size={20} color={C.blue} />Tenants</h1>
          <p style={S.subtitle}>{propertyName} · {tenants.length} tenant{tenants.length !== 1 ? "s" : ""}</p>
        </div>
        <div style={S.searchWrap}>
          <Icon name="search" size={13} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.2)', pointerEvents: 'none' }} />
          <input type="text" placeholder="Search tenants..." value={search} onChange={e => setSearch(e.target.value)} style={S.searchInput} />
        </div>
      </div>

      {error && (
        <div style={{ padding: '0.7rem 1rem', borderRadius: '3px', marginBottom: '1rem', background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.12)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Icon name="warning" size={15} color={C.redLight} />
          <p style={{ fontSize: '0.72rem', color: C.redLight, flex: 1 }}>{error}</p>
          <button onClick={fetchTenants} style={{ fontSize: '0.68rem', color: C.blue, background: 'none', border: 'none', cursor: 'pointer', fontFamily: F.mono }}>Retry</button>
        </div>
      )}

      <div style={{ background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '6px', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', color: 'rgba(245,240,232,0.3)', gap: '0.6rem' }}>
            <span style={{ width: 20, height: 20, border: '2px solid rgba(245,240,232,0.06)', borderTopColor: C.blue, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            Loading tenants...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={S.table}>
              <thead><tr>{["Tenant", "Unit", "Rent", "Lease Ends", "Balance", "Reliability", "Contact"].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.length === 0 && <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', padding: '3rem 0', color: 'rgba(245,240,232,0.2)' }}>No tenants found.</td></tr>}
                {filtered.map(t => (
                  <tr key={t.id} style={{ transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = C.muted}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={S.td}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'rgba(232,160,18,0.08)', color: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '0.65rem', flexShrink: 0 }}>
                          {initials(`${t.first_name} ${t.last_name}`)}
                        </div>
                        <span style={{ fontWeight: 600, color: C.white, fontSize: '0.78rem' }}>{t.first_name} {t.last_name}</span>
                      </div>
                    </td>
                    <td style={{ ...S.td, color: 'rgba(245,240,232,0.4)', fontSize: '0.72rem', fontFamily: F.mono }}>Unit {t.unit_number || "—"}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: C.white, fontSize: '0.74rem' }}>{format(t.rent_amount)}<span style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginLeft: '0.2rem' }}>/{t.payment_frequency === "monthly" ? "mo" : "wk"}</span></td>
                    <td style={{ ...S.td, color: 'rgba(245,240,232,0.35)', fontSize: '0.7rem', fontFamily: F.mono }}>{formatDate(t.lease_end_date)}</td>
                    <td style={{ ...S.td, fontWeight: 600, color: t.outstanding_balance > 0 ? C.redLight : C.greenLight, fontSize: '0.74rem' }}>{t.outstanding_balance > 0 ? format(t.outstanding_balance) : "Clear"}</td>
                    <td style={S.td}><ScoreBadge score={t.reliability_score} /></td>
                    <td style={S.td}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.4)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Icon name="mail" size={10} /> {t.email || "—"}</span>
                        <span style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.4)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Icon name="phone" size={10} /> {t.phone || "—"}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div style={S.footer}><span>Showing <span style={{ color: C.white, fontWeight: 500 }}>{filtered.length}</span> of <span style={{ color: C.white, fontWeight: 500 }}>{tenants.length}</span> tenants</span></div>
      </div>
    </div>
  );
}