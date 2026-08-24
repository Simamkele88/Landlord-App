/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { FiChevronRight, FiSearch } from "react-icons/fi";
import { FaPlus } from "react-icons/fa";
import { c as COLORS } from "../../../styles/theme";

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const thStyle = {
  padding: "0.6rem 0.8rem",
  fontSize: "12px",
  fontWeight: 600,
  color: "#000",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  background: "#e9eced52",
  border: "1px solid #9a9d9e52",
  textAlign: "left",
  whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "0.6rem 0.8rem",
  fontSize: "12px",
  color: "#151515",
  border: "1px solid #9a9d9e52",
  verticalAlign: "middle",
  fontWeight: 400,
  background: "#e9eced52",
};

function formatAmount(n) {
  return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—";
}

function initials(name = "") {
  return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

function leaseExpiresSoon(endDate) {
  if (!endDate) return false;
  const days = Math.ceil((new Date(endDate) - Date.now()) / 86400000);
  return days >= 0 && days <= 60;
}

function leaseExpired(endDate) {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

function mapTenantFromAPI(t) {
  return {
    id: t.id,
    userId: t.user_id,
    name: t.full_name || `${t.first_name || ""} ${t.last_name || ""}`.trim(),
    email: t.email || "",
    phone: t.phone || "",
    unit: t.unit_number ? `Unit ${t.unit_number}` : "N/A",
    property: t.property_name || "Unknown",
    rentAmount: Number(t.rent_amount) || 0,
    frequency: t.payment_frequency || "monthly",
    leaseStart: t.lease_start_date || "",
    leaseEnd: t.lease_end_date || "",
    status: t.lease_status === "active" ? "Active" : "Inactive",
    reliabilityScore: (t.reliability_score || "reliable").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    scoreValue: Number(t.reliability_score_value) || 0,  
    balance: Number(t.outstanding_balance) || 0,
    lease_id: t.lease_id,
  };
}

function ReliabilityBadge({ score, value }) {
  const cfg =
    score === "Reliable"
      ? { color: "#2b7a4b", bg: "#eef5e8", border: "1px solid #c5d9b8" }
      : score === "Moderate Risk"
        ? { color: "#8b6e1a", bg: "#faf6ed", border: "1px solid #e5dbb8" }
        : { color: "#9e3a3a", bg: "#fbeaea", border: "1px solid #e5bdbd" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.3rem",
      fontSize: "12px", fontWeight: 500, padding: "0.15rem 0.6rem",
      borderRadius: "12px", color: cfg.color, background: cfg.bg, border: cfg.border,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: cfg.color }} />
      {score}
      {value != null && <span style={{ fontWeight: 700, marginLeft: "0.2rem" }}>{value.toFixed(1)}</span>}
    </span>
  );
}

export default function Tenants() {
  useDocumentTitle("Tenants");
  const navigate = useNavigate();
  const toast = useToast();

  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("default");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [editTenant, setEditTenant] = useState(null);
  const [deleteTenant, setDelete] = useState(null);
  const [repaymentTenant, setRepayment] = useState(null);
  const [renewalTenant, setRenewal] = useState(null);
  const [terminationTenant, setTermination] = useState(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/tenants`, { headers: { Authorization: `Bearer ${token}` } });
      setTenants((data.tenants || []).map(mapTenantFromAPI));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load tenants");
      toast.error("Failed to load tenants.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchTenants(); }, [fetchTenants]);

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/tenants/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setTenants(prev => prev.filter(t => t.id !== id));
      toast.success("Tenant removed.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to delete tenant");
    }
  };

  const filtered = tenants.filter(t => {
    const matchScore = filter === "All" || t.reliabilityScore === filter;
    const q = search.toLowerCase();
    return matchScore && (!q || [t.name, t.email, t.phone, t.unit, t.property].some(s => (s || "").toLowerCase().includes(q)));
  }).sort((a, b) => {
    if (sortBy === "score-desc") return (b.scoreValue ?? 0) - (a.scoreValue ?? 0);
    if (sortBy === "score-asc") return (a.scoreValue ?? 0) - (b.scoreValue ?? 0);
    if (sortBy === "balance-desc") return b.balance - a.balance;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedTenants = filtered.slice(startIndex, startIndex + pageSize);

  useEffect(() => { setPage(1); }, [filter, search, pageSize]);

  const outlineBtnStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.35rem",
    background: "#fdfdfd",
    color: "#000",
    border: "1px solid #ccc",
    padding: "0.3rem 0.6rem",
    fontSize: "14px",
    fontWeight: 400,
    cursor: "pointer",
    borderRadius: "2px",
  };

  return (
    <div style={{ fontFamily: FONT, color: "#000", background: "#ffffff", fontSize: "14px" }}>
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
        <Link to="/landlord/dashboard" className="rb-link">Dashboard</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>Tenants</span>
      </div>

      {/* Main card */}
      <div style={{
        background: "#fdfdfd",
        border: "1px solid #dfe3e8",
        borderRadius: "3px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        overflow: "hidden",
      }}>
        {/* Card header */}
        <div style={{
          background: "#f7f8fa",
          padding: "0.4rem 0 0.2rem 0.7rem",
          borderBottom: '3px solid #3498db',
        }}>
          <h4 style={{
            fontSize: "16px",
            color: "#000",
            fontFamily: FONT,
            background: "transparent",
            margin: 0,
          }}>
            List of Tenants
          </h4>
        </div>

        {/* Toolbar */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0.85rem 1.1rem",
          gap: "1rem",
          flexWrap: "wrap",
        }}>
          {/* Left side */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginLeft: "0.6rem" }}>
            <button
              onClick={() => navigate('/landlord/tenants/create')}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                background: "#ffffff",
                color: "#000",
                border: "1px solid #d0d1d3",
                borderRadius: "2px",
                padding: "0.3rem 0.6rem",
                fontSize: "14px",
                fontWeight: 400,
                cursor: "pointer",
                fontFamily: FONT,
              }}
            >
              <FaPlus size={14} />
              Add Tenant
            </button>
            <button
              onClick={fetchTenants}
              style={outlineBtnStyle}
            >
              <FiSearch size={14} /> Refresh
            </button>
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div style={{ position: "relative", width: "260px" }}>
              <FiSearch size={14} style={{
                position: "absolute",
                top: "50%",
                left: "0.6rem",
                transform: "translateY(-50%)",
                color: "#555",
              }} />
              <input
                type="text"
                placeholder="Search tenant....."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: "0.3rem 0.75rem 0.3rem 2rem",
                  fontSize: "14px",
                  border: "1px solid #d0d1d3",
                  borderRadius: "2px",
                  width: "260px",
                  fontFamily: FONT,
                  color: "#000",
                  outline: "none",
                }}
              />
            </div>

            {/* Filter dropdown */}
            <select
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{ border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.3rem 1.5rem 0.3rem 0.4rem', background: '#fdfdfd', color: '#000', fontFamily: FONT }}
            >
              <option value="All">All</option>
              <option value="Reliable">Reliable</option>
              <option value="Moderate Risk">Moderate Risk</option>
              <option value="High Risk">High Risk</option>
            </select>

            <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.3rem 1.5rem 0.3rem 0.4rem', background: '#fdfdfd', color: '#000', fontFamily: FONT }}>
              <option value="default">Sort: Default</option>
              <option value="score-desc">Score: High to Low</option>
              <option value="score-asc">Score: Low to High</option>
              <option value="balance-desc">Balance: Highest</option>
            </select>

            {/* Page size dropdown */}
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              style={{ border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.3rem 1.5rem 0.3rem 0.4rem', background: '#fdfdfd', color: '#000', fontFamily: FONT }}
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
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#555" }}>
            <span style={{
              width: 20,
              height: 20,
              border: "2px solid rgba(44,62,80,0.1)",
              borderTopColor: "#2c3e50",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
              display: "inline-block",
            }} />
            <span style={{ marginLeft: "0.5rem" }}>Loading tenants...</span>
          </div>
        ) : error ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
            <p style={{ color: "#c0392b" }}>{error}</p>
            <button
              onClick={fetchTenants}
              style={{
                background: 'transparent', color: '#2471a3', border: 'none',
                cursor: 'pointer', textDecoration: 'underline',
              }}
            >
              Try again
            </button>
          </div>
        ) : paginatedTenants.length === 0 ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#555" }}>
            <p>{search || filter !== "All" ? "No tenants match your filters" : "No tenants yet"}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", margin: "0 1.7rem 1.7rem 1.7rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}></th>
                  <th style={thStyle}>Tenant</th>
                  <th style={thStyle}>Contact</th>
                  <th style={thStyle}>Lease Details</th>
                  <th style={thStyle}>Financials</th>
                  <th style={thStyle}>Reliability</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTenants.map((t, i) => {
                  const tenantId = `TEN${String((currentPage - 1) * pageSize + i + 1).padStart(6, "0")}`;
                  return (
                    <tr key={t.id} className="rb-row">
                      <td style={tdStyle}>
                        <Link
                          to={`/landlord/tenants/${t.id}`}
                          style={{ fontWeight: 600, color: "#2471a3", textDecoration: "none", fontSize: "13px" }}
                          onMouseEnter={e => e.currentTarget.style.textDecoration = "underline"}
                          onMouseLeave={e => e.currentTarget.style.textDecoration = "none"}
                        >
                          {tenantId}
                        </Link>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>{t.name}</div>
                        <div style={{ marginTop: "2px" }}>{t.unit} · {t.property}</div>
                      </td>
                      <td style={tdStyle}>
                        <div>{t.email}</div>
                        <div style={{ fontSize: "11px", marginTop: "2px" }}>{t.phone}</div>
                      </td>
                      <td style={tdStyle}>
                        <div>Start: {formatDate(t.leaseStart)}</div>
                        <div style={{ fontSize: "11px", marginTop: "2px" }}>End: {formatDate(t.leaseEnd)}</div>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>{formatAmount(t.rentAmount)}/{t.frequency}</div>
                        {t.balance > 0 && <div style={{ fontSize: "11px", marginTop: "2px", color: "#9e3a3a" }}>{formatAmount(t.balance)} owed</div>}
                      </td>
                      <td style={tdStyle}>
                        <ReliabilityBadge score={t.reliabilityScore} value={t.scoreValue} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with pagination */}
        {!loading && paginatedTenants.length > 0 && (
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 1.7rem 1.7rem",
            marginTop: "-1.5rem",
            fontSize: "13px",
            color: "#333",
          }}>
            <span>
              Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} tenants
            </span>
            {totalPages > 1 && (
              <div style={{ display: "flex", gap: "0.3rem" }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  style={{ padding: "0.2rem 0.5rem", border: "1px solid #d0d1d3", background: "#fdfdfd", cursor: "pointer", fontSize: "13px", borderRadius: "2px", color: "#000" }}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, idx) => idx + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      padding: "0.2rem 0.5rem",
                      border: p === currentPage ? "1px solid #2c3e50" : "1px solid #d0d1d3",
                      background: p === currentPage ? "#2c3e50" : "#fdfdfd",
                      color: p === currentPage ? "#ffffff" : "#000",
                      cursor: "pointer",
                      fontSize: "13px",
                      fontWeight: p === currentPage ? 600 : 400,
                      borderRadius: "2px",
                    }}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  style={{ padding: "0.2rem 0.5rem", border: "1px solid #d0d1d3", background: "#fdfdfd", cursor: "pointer", fontSize: "13px", borderRadius: "2px", color: "#000" }}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {editTenant && <EditTenantModal tenant={editTenant} onClose={() => setEditTenant(null)} onSave={fetchTenants} />}
      {deleteTenant && <DeleteModal tenant={deleteTenant} onClose={() => setDelete(null)} onConfirm={handleDelete} />}
      {repaymentTenant && <RepaymentModal tenant={repaymentTenant} onClose={() => setRepayment(null)} onConfirm={(id, plan) => { setRepayment(null); toast.success("Repayment plan created!"); }} />}
      {renewalTenant && <RenewalModal tenant={renewalTenant} onClose={() => setRenewal(null)} onConfirm={(id, data) => { setTenants(prev => prev.map(t => t.id === id ? { ...t, leaseEnd: data.leaseEnd, rentAmount: data.rentAmount } : t)); setRenewal(null); toast.success("Lease renewed!"); }} />}
      {terminationTenant && <TerminationModal tenant={terminationTenant} onClose={() => setTermination(null)} onConfirm={(id, data) => { setTenants(prev => prev.map(t => t.id === id ? { ...t, status: "Terminated" } : t)); setTermination(null); toast.success("Lease terminated."); }} />}
    </div>
  );
}