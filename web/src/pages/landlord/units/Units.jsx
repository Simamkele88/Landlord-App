/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import {
  FiChevronRight, FiSearch, FiRefreshCw
} from "react-icons/fi";
import { FaPlus } from "react-icons/fa"

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';
const PAGE_SIZE = 10;

const STATUS_MAP = {
  "All": "All",
  "Occupied": "occupied",
  "Vacant": "vacant",
  "Maintenance": "maintenance",
};

const statusConfig = {
  "occupied":    { color: "#2b7a4b", bg: "#eef5e8", border: "1px solid #c5d9b8", dot: "#2b7a4b", label: "Occupied" },
  "vacant":      { color: "#2c6b9b", bg: "#e8f0f5", border: "1px solid #b0cfe0", dot: "#2c6b9b", label: "Vacant" },
  "maintenance": { color: "#8b6e1a", bg: "#faf6ed", border: "1px solid #e5dbb8", dot: "#8b6e1a", label: "Maintenance" },
  "reserved":    { color: "#54326b", bg: "#eee7f3", border: "1px solid #d1c2dc", dot: "#54326b", label: "Reserved" },
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

function StatusBadge({ status }) {
  const cfg = statusConfig[status] ?? statusConfig["vacant"];
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

export default function Units() {
  useDocumentTitle("Units");
  const navigate = useNavigate();
  const toast = useToast();

  const [units, setUnits] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [propertyFilter, setPropertyFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const [unitsRes, propRes] = await Promise.all([
        axios.get(`${API}/units`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/properties`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setUnits(unitsRes.data.units || []);
      setProperties(propRes.data.properties || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load units");
      toast.error("Failed to load units.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = units.filter(u => {
    const actualStatus = STATUS_MAP[statusFilter];
    const matchStatus = actualStatus === "All" || u.status === actualStatus;
    const matchProperty = propertyFilter === "All" || u.property_name === propertyFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || [
      String(u.unit_number),
      u.property_name,
      u.unit_type,
      u.tenant_name ?? "",
    ].some(s => (s || "").toLowerCase().includes(q));
    return matchStatus && matchProperty && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUnits = filtered.slice(startIndex, startIndex + pageSize);

  useEffect(() => { setPage(1); }, [statusFilter, propertyFilter, search, pageSize]);

  const propertyNames = ["All", ...new Set(units.map(u => u.property_name).filter(Boolean))];

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
        <Link to="/landlord/dashboard" className="rb-link">Dashboard</Link>
        <span style={{ color: '#555' }}>/</span>
        <span style={{ color: '#000' }}>Units</span>
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
            List of Units
          </h4>
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.85rem 1.1rem', gap: '1rem', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '0.6rem' }}>
            <button
              onClick={() => navigate('/landlord/units/add')}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.4rem',
                background: '#ffffff', color: '#000', border: '1px solid #d0d1d3',
                borderRadius: '2px', padding: '0.3rem 0.6rem', fontSize: '14px',
                fontWeight: 400, cursor: 'pointer', fontFamily: FONT,
              }}
            >
              <FaPlus size={14} /> Add Unit
            </button>
            <button onClick={fetchData} style={outlineBtnStyle}>
              <FiRefreshCw size={14} /> Refresh
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ position: 'relative', width: '240px' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input
                type="text"
                placeholder="Search units..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  padding: '0.3rem 0.75rem 0.3rem 2rem', fontSize: '14px',
                  border: '1px solid #d0d1d3', borderRadius: '2px', width: '240px',
                  fontFamily: FONT, color: '#000', outline: 'none',
                }}
              />
            </div>

            {/* Status filter dropdown */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              style={{ border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.3rem 1.5rem 0.3rem 0.5rem', background: '#fdfdfd', color: '#000', fontFamily: FONT }}
            >
              {Object.keys(STATUS_MAP).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Property filter dropdown */}
            <select
              value={propertyFilter}
              onChange={e => setPropertyFilter(e.target.value)}
              style={{ border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px', padding: '0.3rem 1.5rem 0.3rem 0.5rem', background: '#fdfdfd', color: '#000', fontFamily: FONT }}
            >
              {propertyNames.map(p => <option key={p} value={p}>{p === "All" ? "All Properties" : p}</option>)}
            </select>

            {/* Page size dropdown */}
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
            <span style={{ marginLeft: '0.5rem' }}>Loading units...</span>
          </div>
        ) : error ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <p style={{ color: '#c0392b' }}>{error}</p>
            <button onClick={fetchData} style={{ background: 'none', border: 'none', color: '#2471a3', cursor: 'pointer', textDecoration: 'underline', marginTop: '0.5rem' }}>
              Try again
            </button>
          </div>
        ) : paginatedUnits.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#555' }}>
            <p>No units match your filters.</p>
            <button onClick={() => { setStatusFilter("All"); setPropertyFilter("All"); setSearch(""); }} style={{ background: 'none', border: 'none', color: '#2471a3', cursor: 'pointer', textDecoration: 'underline', marginTop: '0.5rem' }}>
              Clear all filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', margin: '0 1.7rem 1.7rem 1.7rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}></th>
                  <th style={thStyle}>Property/Tenant</th>
                  <th style={thStyle}>Details</th>
                  <th style={thStyle}>Financials</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUnits.map((u, index) => {
                  const unitId = `UNIT${String((currentPage - 1) * pageSize + index + 1).padStart(6, "0")}`;
                  return (
                    <tr
                      key={u.id}
                      className="rb-row"
                      style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/landlord/units/${u.id}`)}
                    >
                      {/* First column: Unit ID link */}
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: '#2471a3', fontSize: '13px' }}>
                          {unitId}
                        </span>
                      </td>

                      {/* Property column with tenant subline */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>{u.property_name || "—"}</div>
                        <div style={{ marginTop: '2px', fontSize: '11px', color: '#333' }}>
                          {u.tenant_name ? `Tenant: ${u.tenant_name}` : 'No tenant'}
                        </div>
                      </td>

                      {/* Details column */}
                      <td style={tdStyle}>
                        <div style={{ textTransform: 'capitalize', fontWeight: 500 }}>
                          {(u.unit_type || "").replace(/_/g, " ")}
                        </div>
                        <div style={{ marginTop: '2px', fontSize: '11px', color: '#333' }}>
                          {[
                            u.floor_number != null && `Floor ${u.floor_number}`,
                            u.bedrooms != null && `${u.bedrooms} bed`,
                            u.bathrooms != null && `${u.bathrooms} bath`,
                            u.square_meters != null && `${u.square_meters} m²`,
                          ].filter(Boolean).join(' · ') || 'No additional details'}
                        </div>
                      </td>

                      {/* Financials column with explicit labels */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>
                          Rent: {formatAmount(u.monthly_rent)}
                        </div>
                        {u.deposit_amount != null && (
                          <div style={{ marginTop: '2px', fontSize: '11px', color: '#333' }}>
                            Deposit: {formatAmount(u.deposit_amount)}
                          </div>
                        )}
                      </td>

                      {/* Status column */}
                      <td style={tdStyle}>
                        <StatusBadge status={u.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with pagination */}
        {!loading && !error && paginatedUnits.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0 1.7rem 1.7rem', marginTop: '-1.5rem', fontSize: '13px', color: '#333',
          }}>
            <span>
              Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} units
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