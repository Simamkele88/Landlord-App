import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../contexts/ToastContext";
import { FiChevronRight, FiSearch, FiChevronDown } from "react-icons/fi";
import { FaPlus } from "react-icons/fa";
import useDocumentTitle from "../../../hooks/useDocumentTitle";

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

function getDisplayId(index) {
  return `PRO${String(index + 1).padStart(6, '0')}`;
}

function getOccupiedCount(property) {
  const units = property.units || [];
  return units.filter(u => u.status === 'occupied').length;
}

function getTotalUnits(property) {
  return (property.units && property.units.length) || property.total_units || 0;
}

export default function PropertiesPage() {

  useDocumentTitle("Properties");

  const toast = useToast();
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchProperties = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/properties`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProperties(data.properties || []);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to load properties");
      toast.error("Failed to load properties.");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const filtered = properties.filter(p =>
    !search.trim() ||
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.address_line1?.toLowerCase().includes(search.toLowerCase()) ||
    p.city?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProperties = filtered.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  const outlineBtnStyle = {
    display: "flex",
    alignItems: "center",
    gap: "0.4rem",
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
        <span style={{ color: '#000' }}>Properties</span>
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
            List of Properties
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
          {/* Left side: Add property + Refresh */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginLeft: "0.6rem" }}>
            <button
              onClick={() => navigate('/landlord/properties/create')}
              style={outlineBtnStyle}
            >
              <FaPlus size={14} />
              Add a property
            </button>
            <button
              onClick={fetchProperties}
              style={outlineBtnStyle}
            >
              <FiSearch size={14} /> Refresh
            </button>
          </div>

          {/* Right side: search, filter, page size */}
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
                value={search}
                placeholder="Search properties...."
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
              defaultValue="active"
              style={{
                border: '1px solid #d0d1d3',
                borderRadius: '2px',
                fontSize: '14px',
                padding: '0.3rem 1.5rem 0.3rem 0.4rem',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                background: '#fdfdfd',
                color: '#000',
                fontFamily: FONT,
              }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="All">All</option>
            </select>

            {/* Page size dropdown */}
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              style={{
                border: '1px solid #d0d1d3',
                borderRadius: '2px',
                fontSize: '14px',
                padding: '0.3rem 1.5rem 0.3rem 0.4rem',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                background: '#fdfdfd',
                color: '#000',
                fontFamily: FONT,
              }}
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
            <span style={{ marginLeft: "0.5rem" }}>Loading properties...</span>
          </div>
        ) : error ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center" }}>
            <p style={{ color: "#c0392b" }}>{error}</p>
            <button onClick={fetchProperties} style={{
              background: 'transparent', color: '#2471a3', border: 'none',
              cursor: 'pointer', textDecoration: 'underline',
            }}>
              Try again
            </button>
          </div>
        ) : paginatedProperties.length === 0 ? (
          <div style={{ padding: "3rem 1rem", textAlign: "center", color: "#555" }}>
            <p>{search ? "No properties match your search" : "No properties yet"}</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto", margin: "0 1.7rem 1.7rem 1.7rem" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={thStyle}></th>
                  <th style={thStyle}>Property</th>
                  <th style={thStyle}>Details</th>
                  <th style={thStyle}>Financials</th>
                  <th style={thStyle}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProperties.map((property, index) => {
                  const occupied = getOccupiedCount(property);
                  const total = getTotalUnits(property);
                  return (
                    <tr
                      key={property.id}
                      className="rb-row"
                      style={{ cursor: "pointer" }}
                      onClick={() => navigate(`/landlord/properties/${property.id}`)}
                    >
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 600, color: "#2471a3", fontSize: "13px" }}>
                          {getDisplayId((currentPage - 1) * pageSize + index)}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>{property.name}</div>
                        <div style={{ marginTop: "2px" }}>
                          {[property.address_line1, property.city].filter(Boolean).join(', ')}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div>{property.property_type?.replace(/_/g, ' ') || "—"}</div>
                        <div style={{ fontSize: "11px", marginTop: "2px" }}>
                          {property.total_floors ? `${property.total_floors} floor(s), ` : ""}
                          {total} unit(s)
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div>Rates: {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(property.monthly_rates || 0)}</div>
                        <div style={{ fontSize: "11px" }}>
                          Levies: {new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(property.monthly_levies || 0)}
                        </div>
                      </td>
                      <td style={tdStyle}>
                        {occupied > 0 ? (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.2rem",
                            padding: "0.1rem 0.5rem",
                            fontSize: "11px",
                            fontWeight: 500,
                            background: "#eafaf1",
                            color: "#27ae60",
                            border: "1px solid #a3e4bc",
                            borderRadius: "12px",
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#27ae60" }} />
                            Occupied ({occupied}/{total})
                          </span>
                        ) : (
                          <span>Vacant</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with pagination */}
        {!loading && paginatedProperties.length > 0 && (
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
              Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} properties
            </span>
            {totalPages > 1 && (
              <div style={{ display: "flex", gap: "0.3rem" }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  style={{
                    padding: "0.2rem 0.5rem",
                    border: "1px solid #d0d1d3",
                    background: "#fdfdfd",
                    cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    borderRadius: "2px",
                    color: "#000",
                  }}
                >
                  ‹
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
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
                  style={{
                    padding: "0.2rem 0.5rem",
                    border: "1px solid #d0d1d3",
                    background: "#fdfdfd",
                    cursor: currentPage >= totalPages ? "not-allowed" : "pointer",
                    fontSize: "13px",
                    borderRadius: "2px",
                    color: "#000",
                  }}
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