// LANDLORD COLLECTIONS PAGE (Styled like Units)
import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import {
  FiChevronRight, FiSearch, FiRefreshCw
} from "react-icons/fi";
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";

const API = "http://localhost:4000";
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';
const PAGE_SIZE = 10;

const STATUS_MAP = {
  "All": "All",
  "Active": "active",
  "Repayment Plan": "repayment",
  "Legal": "legal",
  "Recovered": "recovered",
  "Written Off": "written_off",
};

const statusConfig = {
  "flagged":           { color: "#9e3a3a", bg: "#fdf0ee", border: "1px solid #f0cfcb", dot: "#9e3a3a", label: "Flagged" },
  "active":            { color: "#9e3a3a", bg: "#fdf0ee", border: "1px solid #f0cfcb", dot: "#9e3a3a", label: "In Collections" },
  "collections":       { color: "#9e3a3a", bg: "#fdf0ee", border: "1px solid #f0cfcb", dot: "#9e3a3a", label: "Collections" },
  "repayment_agreed":  { color: "#2c6b9b", bg: "#e8f0f5", border: "1px solid #b0cfe0", dot: "#2c6b9b", label: "Repayment Agreed" },
  "repayment_plan":    { color: "#2c6b9b", bg: "#e8f0f5", border: "1px solid #b0cfe0", dot: "#2c6b9b", label: "Repayment Plan" },
  "legal":             { color: "#54326b", bg: "#eee7f3", border: "1px solid #d1c2dc", dot: "#54326b", label: "Legal" },
  "recovered":         { color: "#2b7a4b", bg: "#eef5e8", border: "1px solid #c5d9b8", dot: "#2b7a4b", label: "Recovered" },
  "resolved":          { color: "#2b7a4b", bg: "#eef5e8", border: "1px solid #c5d9b8", dot: "#2b7a4b", label: "Resolved" },
  "written_off":       { color: "#6c757d", bg: "#f8f9fa", border: "1px solid #dee2e6", dot: "#6c757d", label: "Written Off" },
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
function initials(n = "") {
  return (n || "").split(" ").map(x => x[0]).join("").slice(0, 2).toUpperCase();
}
function daysAgo(d) {
  if (!d) return 0;
  return Math.floor((Date.now() - new Date(d)) / 86400000);
}

function StatusBadge({ status }) {
  const cfg = statusConfig[status] ?? statusConfig["flagged"];
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

function SendToCollectionsModal({ account, onClose, onConfirm }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API}/collections`, {
        tenant_id: account.tenant_id,
        lease_id: account.lease_id,
        outstanding_balance: account.outstanding_balance || account.balance || 0,
        notes: note.trim() || null,
      }, { headers: { Authorization: `Bearer ${token}` } });
      onConfirm(account.id);
      onClose();
    } catch (err) {
      console.error("Send to collections:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center",
      justifyContent: "center", padding: "1rem", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
    }}>
      <div style={{
        width: "100%", maxWidth: 420, background: "#ffffff", border: "1px solid #dfe3e8",
        borderRadius: "6px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1rem 1.5rem", borderBottom: "1px solid #e9ecef",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <div style={{
              width: 36, height: 36, borderRadius: "6px", background: "#fdf0ee",
              border: "1px solid #f0cfcb", display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <FaExclamationTriangle size={16} color="#9e3a3a" />
            </div>
            <div>
              <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#000", fontFamily: FONT, letterSpacing: "0.02em" }}>
                Send to Collections
              </h3>
              <p style={{ fontSize: "0.65rem", color: "#6c757d", fontFamily: FONT }}>
                {account.tenant_name} · {formatAmount(account.outstanding_balance || account.balance)} outstanding
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: "0.2rem", background: "transparent", border: "none", cursor: "pointer", color: "#6c757d" }}>
            <FaTimes size={18} />
          </button>
        </div>
        <div style={{ padding: "1.2rem 1.5rem" }}>
          <p style={{ fontSize: "0.78rem", color: "#333", lineHeight: 1.6, marginBottom: "0.8rem" }}>
            You are about to escalate{" "}
            <strong style={{ color: "#000" }}>{account.tenant_name}</strong> to collections for{" "}
            <strong style={{ color: "#9e3a3a" }}>{formatAmount(account.outstanding_balance || account.balance)}</strong>.
            The tenant will be notified.
          </p>
          <textarea
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add a note for your records (optional)..."
            style={{
              width: "100%", minHeight: 60, fontSize: "0.78rem", padding: "0.55rem 0.8rem",
              borderRadius: "3px", background: "#f4f5f7", border: "1px solid #d0d1d3",
              color: "#000", fontFamily: FONT, outline: "none", resize: "none",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: "0.8rem", padding: "0 1.5rem 1.5rem" }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1, padding: "0.6rem", borderRadius: "3px", fontSize: "0.74rem", fontWeight: 500,
              fontFamily: FONT, background: "transparent", color: "#6c757d",
              border: "1px solid #d0d1d3", cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              flex: 1, padding: "0.6rem", borderRadius: "3px", fontSize: "0.74rem", fontWeight: 600,
              fontFamily: FONT, background: "#9e3a3a", color: "#fff", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
            }}
          >
            {loading ? (
              <span style={{
                width: 14, height: 14, border: "2px solid rgba(255,255,255,0.2)",
                borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.6s linear infinite",
              }} />
            ) : (
              "Confirm"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function InvoiceBreakdownModal({ account, onClose }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API}/collections/${account.id}/invoices`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setInvoices(data.invoices || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    load();
  }, [account.id]);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center",
      justifyContent: "center", padding: "1rem", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
    }}>
      <div style={{
        width: "100%", maxWidth: 600, background: "#ffffff", border: "1px solid #dfe3e8",
        borderRadius: "6px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        display: "flex", flexDirection: "column", maxHeight: "80vh",
      }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1rem 1.5rem", borderBottom: "1px solid #e9ecef",
        }}>
          <div>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 600, color: "#000", fontFamily: FONT }}>
              Invoice Breakdown
            </h3>
            <p style={{ fontSize: "0.65rem", color: "#6c757d", fontFamily: FONT }}>
              {account.tenant_name} · {formatAmount(account.outstanding_balance || account.balance)} outstanding
            </p>
          </div>
          <button onClick={onClose} style={{ padding: "0.2rem", background: "transparent", border: "none", cursor: "pointer", color: "#6c757d" }}>
            <FaTimes size={18} />
          </button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1rem 1.5rem" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#6c757d" }}>Loading...</div>
          ) : invoices.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#6c757d" }}>No linked invoices found.</div>
          ) : (
            <table style={{ width: "100%", fontSize: "0.72rem", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["Invoice #", "Period", "Amount Due", "Paid", "Remaining", "Status"].map(h => (
                    <th key={h} style={{
                      fontSize: "0.58rem", fontWeight: 600, color: "#555", textTransform: "uppercase",
                      letterSpacing: "0.06em", padding: "0.5rem 0.6rem", textAlign: "left",
                      borderBottom: "1px solid #dee2e6", background: "#f8f9fa",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, i) => (
                  <tr key={inv.id || i} style={{ borderBottom: "1px solid #dee2e6" }}>
                    <td style={{ padding: "0.5rem 0.6rem", fontWeight: 500, color: "#000", fontFamily: FONT, fontSize: "0.68rem" }}>
                      {inv.invoice_number}
                    </td>
                    <td style={{ padding: "0.5rem 0.6rem", color: "#555" }}>
                      {inv.billing_period_start ? new Date(inv.billing_period_start).toLocaleDateString("en-ZA", { month: "short", year: "numeric" }) : "—"}
                    </td>
                    <td style={{ padding: "0.5rem 0.6rem", fontWeight: 600, color: "#000" }}>{formatAmount(inv.amount_due)}</td>
                    <td style={{ padding: "0.5rem 0.6rem", color: "#2b7a4b" }}>{formatAmount(inv.paid_amount)}</td>
                    <td style={{
                      padding: "0.5rem 0.6rem", fontWeight: 600,
                      color: Number(inv.remaining_balance) > 0 ? "#9e3a3a" : "#2b7a4b",
                    }}>
                      {Number(inv.remaining_balance) > 0 ? formatAmount(inv.remaining_balance) : "Settled"}
                    </td>
                    <td style={{ padding: "0.5rem 0.6rem" }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                        fontSize: '12px', fontWeight: 500, padding: '0.15rem 0.6rem',
                        borderRadius: '12px',
                        color: inv.status === "paid" ? "#2b7a4b" : inv.status === "overdue" ? "#9e3a3a" : "#8b6e1a",
                        background: inv.status === "paid" ? "#eef5e8" : "#faf6ed",
                        border: inv.status === "paid" ? "1px solid #c5d9b8" : "1px solid #e5dbb8",
                      }}>
                        {inv.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div style={{ padding: "0.8rem 1.5rem", borderTop: "1px solid #e9ecef" }}>
          <button
            onClick={onClose}
            style={{
              width: "100%", padding: "0.55rem", borderRadius: "3px", fontSize: "0.74rem",
              fontWeight: 500, fontFamily: FONT, background: "transparent", color: "#6c757d",
              border: "1px solid #d0d1d3", cursor: "pointer",
            }}
          >
            Close
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
  const [invoiceModal, setInvoiceModal] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/collections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAccounts(data.accounts || data.collections || []);
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to load collections";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
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
    } catch {
      toast.error("Failed to update status.");
    }
  }

  const filtered = accounts.filter(a => {
    const actualStatus = STATUS_MAP[filter];
    const matchStatus = actualStatus === "All" || a.status === actualStatus ||
      (actualStatus === "repayment" && ["repayment_agreed", "repayment_plan"].includes(a.status));
    const q = search.toLowerCase();
    const matchSearch = !q || [a.tenant_name, a.unit_number, a.property_name].some(s => (s || "").toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedAccounts = filtered.slice(startIndex, startIndex + pageSize);

  useEffect(() => { setPage(1); }, [filter, search, pageSize]);

  const inCollections = accounts.filter(a => ["flagged","active","collections"].includes(a.status || "flagged")).length;
  const totalOutstanding = accounts
    .filter(a => ["flagged","active","collections"].includes(a.status || "flagged"))
    .reduce((s, a) => s + Number(a.outstanding_balance || a.balance || 0), 0);
  const onRepaymentPlan = accounts.filter(a => ["repayment_agreed","repayment_plan"].includes(a.status)).length;

  const outlineBtnStyle = {
    display: 'flex', alignItems: 'center', gap: '0.35rem',
    background: '#fdfdfd', color: '#000', border: '1px solid #ccc',
    padding: '0.3rem 0.6rem', fontSize: '14px', fontWeight: 400,
    cursor: 'pointer', borderRadius: '2px',
  };

  const linkStyle = {
    color: '#2471a3', textDecoration: 'none', fontSize: '14px', cursor: 'pointer',
    background: 'none', border: 'none', padding: 0, fontFamily: FONT,
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
        <span style={{ color: '#000' }}>Collections</span>
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
            Collections
          </h4>
          <p style={{ fontSize: '13px', color: '#555', margin: '0.2rem 0 0.4rem 0', fontFamily: FONT }}>
            {inCollections} in collections · {formatAmount(totalOutstanding)} outstanding · {onRepaymentPlan} on repayment plans
          </p>
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.85rem 1.1rem', gap: '1rem', flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '0.6rem' }}>
            <button onClick={fetchAccounts} style={outlineBtnStyle}>
              <FiRefreshCw size={14} /> Refresh
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ position: 'relative', width: '240px' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input
                type="text"
                placeholder="Search tenant..."
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
              value={filter}
              onChange={e => setFilter(e.target.value)}
              style={{
                border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px',
                padding: '0.3rem 1.5rem 0.3rem 0.5rem', background: '#fdfdfd', color: '#000', fontFamily: FONT,
              }}
            >
              {Object.keys(STATUS_MAP).map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Page size dropdown */}
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              style={{
                border: '1px solid #d0d1d3', borderRadius: '2px', fontSize: '14px',
                padding: '0.3rem 1.5rem 0.3rem 0.5rem', background: '#fdfdfd', color: '#000', fontFamily: FONT,
                marginRight: '0.6rem',
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Table area */}
        {loading ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#555' }}>
            <span style={{
              width: 20, height: 20, border: '2px solid rgba(44,62,80,0.1)',
              borderTopColor: '#2c3e50', borderRadius: '50%', animation: 'spin 0.6s linear infinite', display: 'inline-block',
            }} />
            <span style={{ marginLeft: '0.5rem' }}>Loading accounts...</span>
          </div>
        ) : error ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
            <p style={{ color: '#c0392b' }}>{error}</p>
            <button
              onClick={fetchAccounts}
              style={{ background: 'none', border: 'none', color: '#2471a3', cursor: 'pointer', textDecoration: 'underline', marginTop: '0.5rem' }}
            >
              Try again
            </button>
          </div>
        ) : paginatedAccounts.length === 0 ? (
          <div style={{ padding: '3rem 1rem', textAlign: 'center', color: '#555' }}>
            <p>No accounts found.</p>
            <button
              onClick={() => { setFilter("All"); setSearch(""); }}
              style={{ background: 'none', border: 'none', color: '#2471a3', cursor: 'pointer', textDecoration: 'underline', marginTop: '0.5rem' }}
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', margin: '0 1.7rem 1.7rem 1.7rem' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Tenant</th>
                  <th style={thStyle}>Unit / Property</th>
                  <th style={thStyle}>Balance</th>
                  <th style={thStyle}>Days Overdue</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Last Payment</th>
                  <th style={thStyle}>Notes</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedAccounts.map(a => {
                  const status = a.status || "flagged";
                  const balance = Number(a.outstanding_balance || a.balance || 0);
                  const overdue = a.days_overdue || daysAgo(a.last_payment_date);
                  const isActive = ["flagged","active","collections"].includes(status);
                  return (
                    <tr key={a.id} className="rb-row" style={{ cursor: 'pointer' }}>
                      {/* Tenant column */}
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%', background: '#f0f0f0',
                            color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontFamily: FONT, fontSize: '0.6rem', fontWeight: 600,
                          }}>
                            {initials(a.tenant_name)}
                          </div>
                          <span style={{ fontWeight: 600 }}>{a.tenant_name || "—"}</span>
                        </div>
                      </td>

                      {/* Unit / Property column */}
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500 }}>{a.unit_number ? `Unit ${a.unit_number}` : "—"}</div>
                        <div style={{ marginTop: '2px', fontSize: '11px', color: '#555' }}>{a.property_name || "—"}</div>
                      </td>

                      {/* Balance column */}
                      <td style={tdStyle}>
                        <span style={{ fontWeight: 700, color: balance > 0 ? '#9e3a3a' : '#2b7a4b' }}>
                          {balance > 0 ? formatAmount(balance) : "Cleared"}
                        </span>
                      </td>

                      {/* Days Overdue column */}
                      <td style={tdStyle}>
                        <span style={{
                          fontWeight: 600,
                          color: overdue > 90 ? '#9e3a3a' : overdue > 30 ? '#8b6e1a' : '#555',
                        }}>
                          {overdue > 0 ? `${overdue}d` : "—"}
                        </span>
                      </td>

                      {/* Status column */}
                      <td style={tdStyle}><StatusBadge status={status} /></td>

                      {/* Last Payment column */}
                      <td style={{ ...tdStyle, fontSize: '0.7rem', color: '#555' }}>
                        {a.last_payment_date ? formatDate(a.last_payment_date) : "Never"}
                      </td>

                      {/* Notes column */}
                      <td style={{ ...tdStyle, maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#555' }}>
                        {a.notes || "—"}
                      </td>

                      {/* Actions column */}
                      <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button onClick={() => setInvoiceModal(a)} style={linkStyle}>Invoices</button>
                          <button onClick={() => navigate(`/landlord/tenants/${a.tenant_id}`)} style={linkStyle}>Profile</button>
                          {isActive && (
                            <button onClick={() => setSendModal(a)} style={{ ...linkStyle, color: '#9e3a3a' }}>Send</button>
                          )}
                          {status === "collections" && (
                            <>
                              <button onClick={() => handleUpdateStatus(a.id, "legal")} style={{ ...linkStyle, color: '#54326b' }}>Legal</button>
                              <button onClick={() => handleUpdateStatus(a.id, "written_off")} style={{ ...linkStyle, color: '#6c757d' }}>Write Off</button>
                            </>
                          )}
                          {["repayment_agreed","repayment_plan"].includes(status) && (
                            <button onClick={() => navigate("/landlord/payments/plans")} style={linkStyle}>View Plan</button>
                          )}
                          {["recovered","resolved"].includes(status) && (
                            <span style={{ fontSize: '0.65rem', color: '#2b7a4b', fontStyle: 'italic' }}>Cleared</span>
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

        {/* Footer with pagination */}
        {!loading && !error && paginatedAccounts.length > 0 && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0 1.7rem 1.7rem', marginTop: '-1.5rem', fontSize: '13px', color: '#333',
          }}>
            <span>
              Showing {startIndex + 1}-{Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} accounts
            </span>
            {totalPages > 1 && (
              <div style={{ display: 'flex', gap: '0.3rem' }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  style={{
                    padding: '0.2rem 0.5rem', border: '1px solid #d0d1d3', background: '#fdfdfd',
                    color: '#000', cursor: 'pointer', fontSize: '13px', borderRadius: '2px',
                  }}
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
                  style={{
                    padding: '0.2rem 0.5rem', border: '1px solid #d0d1d3', background: '#fdfdfd',
                    color: '#000', cursor: 'pointer', fontSize: '13px', borderRadius: '2px',
                  }}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {sendModal && <SendToCollectionsModal account={sendModal} onClose={() => setSendModal(null)} onConfirm={handleSentToCollections} />}
      {invoiceModal && <InvoiceBreakdownModal account={invoiceModal} onClose={() => setInvoiceModal(null)} />}
    </div>
  );
}