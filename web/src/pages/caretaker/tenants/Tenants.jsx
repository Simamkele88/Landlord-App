/* eslint-disable no-unused-vars */
// CARETAKER TENANTS PAGE 
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import {
  FiChevronRight, FiSearch, FiRefreshCw
} from "react-icons/fi";

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';
const PAGE_SIZE = 10;

const RELIABILITY_MAP = {
  "All": "All",
  "Reliable": "reliable",
  "Moderate Risk": "moderate_risk",
  "High Risk": "high_risk",
};

const reliabilityConfig = {
  "reliable":      { color: "#2b7a4b", bg: "#eef5e8", border: "1px solid #c5d9b8", dot: "#2b7a4b", label: "Reliable" },
  "moderate_risk": { color: "#8b6e1a", bg: "#faf6ed", border: "1px solid #e5dbb8", dot: "#8b6e1a", label: "Moderate Risk" },
  "high_risk":     { color: "#9e3a3a", bg: "#fbeaea", border: "1px solid #e5bdbd", dot: "#9e3a3a", label: "High Risk" },
};

const thStyle = {
  padding: '0.6rem 0.8rem',
  fontSize: '12px',
  fontWeight: 600,
  color: '#000',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  background: '#e9eced52',
  border: '1px solid #9a9d9e52',
  textAlign: 'left',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '0.6rem 0.8rem',
  fontSize: '12px',
  color: '#151515',
  border: '1px solid #9a9d9e52',
  verticalAlign: 'middle',
  fontWeight: 400,
  background: '#e9eced52',
};

function formatAmount(n) {
  return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—";
}

function formatDate(d) {
  return d ? new Date(d).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" }) : "—";
}

function initials(name = "") {
  return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function ReliabilityBadge({ score }) {
  const cfg = reliabilityConfig[score?.toLowerCase()?.replace(/\s+/g, "_")] ?? reliabilityConfig["moderate_risk"];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
      fontSize: '12px', fontWeight: 500, padding: '0.15rem 0.6rem',
      borderRadius: '12px', color: cfg.color, background: cfg.bg, border: cfg.border,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot }} />
      {cfg.label}
    </span>
  );
}

export default function CaretakerTenants() {
  useDocumentTitle("Tenants");
  const navigate = useNavigate();
  const toast = useToast();

  const [tenants, setTenants] = useState([]);
  const [propertyName, setPropertyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [reliabilityFilter, setReliabilityFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError("");
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
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const filtered = tenants.filter(t => {
    const actualReliability = RELIABILITY_MAP[reliabilityFilter];
    const matchReliability = actualReliability === "All" || (t.reliability_score || "").toLowerCase().replace(/\s+/g, "_") === actualReliability;
    const q = search.toLowerCase();
    const matchSearch = !q || [
      `${t.first_name} ${t.last_name}`,
      t.unit_number?.toString(),
      t.email,
      t.phone,
    ].some(s => (s || "").toLowerCase().includes(q));
    return matchReliability && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTenants = filtered.slice(startIndex, startIndex + pageSize);

  useEffect(() => { setPage(1); }, [reliabilityFilter, search, pageSize]);

  const outlineBtnStyle = {
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    background: '#fdfdfd', color: '#000', border: '1px solid #ccc',
    padding: '0.3rem 0.6rem', fontSize: '14px', fontWeight: 400,
    cursor: 'pointer', borderRadius: '2px',
  };

  return (
    <div style={{ fontFamily: FONT, fontSize: '14px', fontWeight: 400, color: '#000', background: '#ffffff' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .rb-link { color: #2471a3; text-decoration: none; font-size: 14px; }
        .rb-link:hover { text-decoration: underline; }
        .rb-row:hover { background: #fafbfc; }
      `}</style>

      {/* Breadcrumb */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem',
        fontSize: '14px', fontWeight: 400, color: '#333', padding: '0.55rem 0.8rem',
        background: '#fdfdfd', boxShadow: '0 1px 3px rgba(0,0,0,0.03)', border: '1px solid #e9ecef',
      }}>
        <FiChevronRight size={13} style={{ color: '#555' }} />
        <Link to="/caretaker/dashboard" className="rb-link">Dashboard</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>Tenants</span>
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
            List of Tenants
          </h4>
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.85rem 1.1rem', gap: '1rem', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '0.6rem' }}>
            <button onClick={fetchTenants} style={outlineBtnStyle}>
              <FiRefreshCw size={14} /> Refresh
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {/* Search */}
            <div style={{ position: 'relative', width: '240px' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input
                type="text"
                placeholder="Search tenants..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: '0.3rem 0.75rem 0.3rem 2rem', fontSize: '14px',
                  border: '1px solid #d0d1d3', borderRadius: '2px', width: '240px',
                  fontFamily: FONT, color: '#000', outline: 'none',
                }}
              />
            </div>

            {/* Reliability filter */}
            <select
              value={reliabilityFilter}
              onChange={e => setReliabilityFilter(e.target.value)}
              style={{ border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.3rem 1.5rem 0.3rem 0.5rem', background: '#fdfdfd', color: '#000', fontFamily: FONT }}
            >
              {Object.keys(RELIABILITY_MAP).map(r => <option key={r} value={r}>{r}</option>)}
            </select>

            {/* Page size */}
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              style={{ border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.3rem 1.5rem 0.3rem 0.5rem', background: '#fdfdfd', color: '#000', fontFamily: FONT, marginRight: '0.6rem' }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#555' }}>
            <span style={{ width: 20, height: 20, border: '2px solid rgba(44,62,80,0.1)', borderTopColor: '#2c3e50', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block' }} />
            <span style={{ marginLeft: '0.5rem' }}>Loading tenants...</span>
          </div>
        ) : error ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <p style={{ color: '#c0392b' }}>{error}</p>
            <button onClick={fetchTenants} style={{ background: 'none', border: 'none', color: '#2471a3', cursor: 'pointer', textDecoration: 'underline', marginTop: '0.5rem' }}>
              Try again
            </button>
          </div>
        ) : paginatedTenants.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#555' }}>
            <p>No tenants match your filters.</p>
            <button onClick={() => { setReliabilityFilter("All"); setSearch(""); }} style={{ background: 'none', border: 'none', color: '#2471a3', cursor: 'pointer', textDecoration: 'underline', marginTop: '0.5rem' }}>
              Clear all filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', margin: '0 1.7rem 1.7rem 1.7rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}></th> {/* Tenant ID link */}
                  <th style={thStyle}>Tenant</th>
                  <th style={thStyle}>Unit</th>
                  <th style={thStyle}>Rent</th>
                  <th style={thStyle}>Lease Ends</th>
                  <th style={thStyle}>Balance</th>
                  <th style={thStyle}>Reliability</th>
                  <th style={thStyle}>Contact</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTenants.map((t, index) => {
                  const tenantId = `TEN${String((currentPage - 1) * pageSize + index + 1).padStart(6, "0")}`;
                  return (
                    <tr
                      key={t.id}
                      className="rb-row"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/caretaker/tenants/${t.id}`)}
                    >
                      {/* Tenant ID */}
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: '#2471a3', fontSize: '13px' }}>
                          {tenantId}
                        </span>
                      </td>

                      {/* Tenant name with avatar */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'rgba(44,62,80,0.08)', color: '#2c3e50',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: FONT, fontSize: '12px', fontWeight: 600,
                          }}>
                            {initials(`${t.first_name} ${t.last_name}`)}
                          </div>
                          <span style={{ fontWeight: 600, color: '#151515' }}>
                            {t.first_name} {t.last_name}
                          </span>
                        </div>
                      </td>

                      {/* Unit */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>
                          Unit {t.unit_number || "—"}
                        </div>
                      </td>

                      {/* Rent */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>
                          {formatAmount(t.rent_amount)}
                          <span style={{ fontSize: '11px', color: '#333', marginLeft: '0.2rem' }}>
                            /{t.payment_frequency === "monthly" ? "mo" : "wk"}
                          </span>
                        </div>
                      </td>

                      {/* Lease ends */}
                      <td style={tdStyle}>
                        <div style={{ fontSize: '11px', color: '#333' }}>
                          {formatDate(t.lease_end_date)}
                        </div>
                      </td>

                      {/* Balance */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: t.outstanding_balance > 0 ? '#9e3a3a' : '#2b7a4b' }}>
                          {t.outstanding_balance > 0 ? formatAmount(t.outstanding_balance) : "Clear"}
                        </div>
                      </td>

                      {/* Reliability */}
                      <td style={tdStyle}>
                        <ReliabilityBadge score={t.reliability_score} />
                      </td>

                      {/* Contact */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontSize: '11px', color: '#333', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FiSearch size={10} style={{ color: '#555' }} /> {t.email || "—"}
                          </span>
                          <span style={{ fontSize: '11px', color: '#333', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <FiSearch size={10} style={{ color: '#555' }} /> {t.phone || "—"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        {!loading && !error && paginatedTenants.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0 1.7rem 1.7rem', marginTop: '-1.5rem', fontSize: '13px', color: '#333',
          }}>
            <span>
              Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} tenants
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  style={{ padding: '0.2rem 0.5rem', border: '1px solid #d0d1d3', background: '#fdfdfd', color: '#000', cursor: 'pointer', fontSize: '13px', borderRadius: '2px' }}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: '0.2rem 0.5rem',
                      border: p === currentPage ? '1px solid #2c3e50' : '1px solid #d0d1d3',
                      background: p === currentPage ? '#2c3e50' : '#fdfdfd',
                      color: p === currentPage ? '#ffffff' : '#000',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: p === currentPage ? 600 : 400,
                      borderRadius: '2px',
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  style={{ padding: '0.2rem 0.5rem', border: '1px solid #d0d1d3', background: '#fdfdfd', color: '#000', cursor: 'pointer', fontSize: '13px', borderRadius: '2px' }}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}