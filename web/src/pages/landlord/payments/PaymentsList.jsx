/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { FiSearch, FiRefreshCcw, FiChevronDown, FiChevronRight } from "react-icons/fi";
import { c as C, f as F } from "../../../styles/theme";

const API = "http://localhost:4000";
const PAGE_SIZE = 8;
const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const statusConfig = {
  "paid":             { color: "#1a4a30", bg: "#eef5e8", border: "1px solid #c5d9b8", dot: "#2b7a4b", label: "Paid" },
  "pending":          { color: "#5b4a0b", bg: "#faf6ed", border: "1px solid #e5dbb8", dot: "#8b6e1a", label: "Pending" },
  "pending_approval": { color: "#5b4a0b", bg: "#faf6ed", border: "1px solid #e5dbb8", dot: "#8b6e1a", label: "Pending" },
  "late":             { color: "#7a2b2b", bg: "#fbeaea", border: "1px solid #e5bdbd", dot: "#9e3a3a", label: "Late" },
  "rejected":         { color: "#7a2b2b", bg: "#fbeaea", border: "1px solid #e5bdbd", dot: "#9e3a3a", label: "Rejected" },
  "collections":      { color: "#3d2252", bg: "#eee7f3", border: "1px solid #d1c2dc", dot: "#54326b", label: "Collections" },
  "partial":          { color: "#1e4a6b", bg: "#e8f0f5", border: "1px solid #b0cfe0", dot: "#2c6b9b", label: "Partial" },
};

const FILTERS = ["All", "Paid", "Pending", "Late", "Collections", "Rejected", "Partial"];
const FILTER_MAP = {
  "All": null,
  "Paid": ["paid"],
  "Pending": ["pending", "pending_approval"],
  "Late": ["late"],
  "Collections": ["collections"],
  "Rejected": ["rejected"],
  "Partial": ["partial"],
};

function formatAmount(amount) {
  return amount === null || amount === undefined || amount === ""
    ? "—"
    : `R ${Number(amount).toLocaleString("en-ZA")}`;
}

function initials(name = "") {
  return (name || "").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
}

const thStyle = {
  padding: '0.6rem 0.8rem', fontSize: '12px', fontWeight: 600, color: '#000',
  textTransform: 'uppercase', letterSpacing: '0.06em', background: '#e9eced52',
  border: '1px solid #9a9d9e52', textAlign: 'left', whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '0.6rem 0.8rem', fontSize: '12px', color: '#151515',
  border: '1px solid #9a9d9e52', verticalAlign: 'middle', fontWeight: 400,
  background: '#e9eced52',
};

const outlineBtnStyle = {
  display: 'flex', alignItems: 'center', gap: '0.4rem',
  background: '#fdfdfd', color: '#2c3e50', border: '1px solid #ccc',
  padding: '0.2rem 0.3rem', fontSize: '14.5px', fontWeight: 400,
  cursor: 'pointer', borderRadius: '2px',
};

function StatusBadge({ status }) {
  const cfg = statusConfig[status] ?? statusConfig["pending"];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '12px',
      fontWeight: 500, padding: '0.15rem 0.6rem', color: cfg.color, background: cfg.bg,
      border: cfg.border, borderRadius: '12px',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
      padding: '0.6rem 1rem', margin: '0 0 1rem', background: '#fde8e5', border: '1px solid #f5c8c2',
    }}>
      <span style={{ fontSize: '14px', color: '#c0392b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <Icon name="alertCircle" size={14} /> {message}
      </span>
      <button onClick={onRetry} style={{ ...outlineBtnStyle, padding: '0.25rem 0.8rem', fontSize: '13px' }}>Retry</button>
    </div>
  );
}

function CollectionsModal({ payment, onClose, onConfirm }) {
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const tenantName = payment.tenant_name || payment.tenant || "Unknown";
  const unitInfo = payment.unit_number || payment.unit || "—";
  const amount = payment.amount_paid || payment.amount || 0;

  async function handleConfirm() {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/landlord/payments/${payment.id}/collections`, { notes: note }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onConfirm(payment.id);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.error || "Failed to escalate to collections.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(44,62,80,0.5)' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#fdfdfd', border: '1px solid #e9ecef', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid #e9ecef' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#2c3e50' }}>Send to Collections</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#95a5a6' }}><Icon name="x" size={18} /></button>
        </div>
        <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
          <p style={{ fontSize: '15px', color: '#495057', lineHeight: 1.6 }}>
            You are escalating <strong style={{ color: '#2c3e50' }}>{tenantName}</strong> ({unitInfo}) to collections for an outstanding balance of <strong style={{ color: '#7a2b2b' }}>{formatAmount(amount)}</strong>.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#7f8c8d', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Note for collections agent <span style={{ color: '#95a5a6', fontWeight: 400, textTransform: 'none' }}>(optional)</span>
            </label>
            <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
              style={{ width: '100%', fontSize: '14px', padding: '0.5rem 0.8rem', background: '#fdfdfd', border: '1px solid #dee2e6', color: '#2c3e50', outline: 'none', resize: 'vertical', minHeight: 60 }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem', borderTop: '1px solid #e9ecef' }}>
          <button onClick={onClose} disabled={loading} style={{ ...outlineBtnStyle, flex: 1, justifyContent: 'center' }}>Cancel</button>
          <button onClick={handleConfirm} disabled={loading} style={{
            flex: 1, padding: '0.5rem 1.2rem', fontSize: '15px', fontWeight: 500, border: 'none', cursor: 'pointer',
            background: '#3d2252', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          }}>
            {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentsListPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState(null);
  const [paymentsPagination, setPaymentsPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [paymentsSummary, setPaymentsSummary] = useState(null);
  const [filter, setFilter] = useState("All");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef(null);
  const [collectionsPayment, setCollectionsPayment] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(PAGE_SIZE);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setDebouncedSearch(searchInput.trim()), 400);
    return () => clearTimeout(searchTimer.current);
  }, [searchInput]);

  const fetchPayments = useCallback(async (page = 1, statusFilter = filter, searchTerm = debouncedSearch) => {
    setLoading(true);
    setPaymentsError(null);
    try {
      const token = localStorage.getItem("token");
      const params = { page, limit: pageSize };
      const statuses = FILTER_MAP[statusFilter];
      if (statuses) params.status = statuses.join(",");
      if (searchTerm) params.search = searchTerm;

      const { data } = await axios.get(`${API}/landlord/payments`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setPayments(data.payments || []);
      setPaymentsPagination(data.pagination || { page: 1, total: 0, totalPages: 1 });
    } catch (err) {
      setPaymentsError("Couldn't load payments.");
      toast.error("Couldn't load payments. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [toast, filter, debouncedSearch, pageSize]);

  const fetchPaymentsSummary = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`${API}/landlord/payments/summary`, { headers: { Authorization: `Bearer ${token}` } });
      setPaymentsSummary(data.summary || null);
    } catch (err) { /* hello */ }
  }, []);

  useEffect(() => {
    fetchPayments(1, filter, debouncedSearch);
  }, [filter, debouncedSearch, pageSize]);

  useEffect(() => { fetchPaymentsSummary(); }, [fetchPaymentsSummary]);

  function handleCollections(id) {
    setPayments(prev => prev.map(p => p.id === id ? { ...p, status: 'collections' } : p));
    fetchPaymentsSummary();
    toast.warning("Account escalated to collections.");
  }

  const pendingPayments = paymentsSummary?.pending_count ?? payments.filter(p => p.status === 'pending' || p.status === 'pending_approval').length;

  return (
    <div style={{ padding: '1rem', fontFamily: FONT, color: '#000', background: '#ffffff' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table tbody tr:hover { background: #fafbfc; }
        .rb-link { color: #2471a3; text-decoration: none; font-size: 14px; background: none; border: none; cursor: pointer; padding: 0; }
        .rb-link:hover { text-decoration: underline; }
        .rb-select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          padding-right: 1.8rem;
        }
      `}</style>

      {collectionsPayment && (
        <CollectionsModal payment={collectionsPayment} onClose={() => setCollectionsPayment(null)} onConfirm={handleCollections} />
      )}

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
            List of Payments
          </h4>
        </div>

        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0.85rem 1.1rem', gap: '1rem', flexWrap: 'wrap',
        }}>
          {/* Left side: Refresh */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: '0.6rem' }}>
            <button
              onClick={() => fetchPayments(1)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#ffffff', color: '#000', border: '1px solid #d0d1d3',
                borderRadius: '2px', padding: '0.3rem 0.6rem', fontSize: '14px',
                fontWeight: 400, cursor: 'pointer', fontFamily: FONT,
              }}
            >
              <FiRefreshCcw size={18} />
            </button>
          </div>

          {/* Right side: search, filter, page size */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ position: 'relative', width: '240px' }}>
              <FiSearch size={14} style={{ position: 'absolute', left: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#555' }} />
              <input
                type="text"
                placeholder="Search tenant, unit..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                style={{
                  padding: '0.3rem 0.75rem 0.3rem 2rem', fontSize: '14px',
                  border: '1px solid #d0d1d3', borderRadius: '2px', width: '240px',
                  fontFamily: FONT, color: '#000', outline: 'none',
                }}
              />
            </div>

            {/* Filter dropdown */}
            <div style={{ position: 'relative' }}>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rb-select"
                style={{
                  border: '1px solid #d0d1d3',
                  borderRadius: '2px',
                  fontSize: '14px',
                  padding: '0.3rem 1.8rem 0.3rem 0.6rem',
                  background: '#fdfdfd',
                  color: '#000',
                  fontFamily: FONT,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                }}
              >
                {FILTERS.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
              <FiChevronDown size={14} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', color: '#555', pointerEvents: 'none' }} />
            </div>

            {/* Page size dropdown */}
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="rb-select"
              style={{
                border: '1px solid #d0d1d3',
                borderRadius: '2px',
                fontSize: '14px',
                padding: '0.3rem 1.8rem 0.3rem 0.6rem',
                background: '#fdfdfd',
                color: '#000',
                fontFamily: FONT,
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
              }}
            >
              <option value={8}>8</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {paymentsError && <ErrorBanner message={paymentsError} onRetry={() => fetchPayments(1)} />}

        {/* Payments Table */}
        <div style={{ border: '1px solid #9a9d9e52', overflow: 'hidden', margin: '0 1.7rem 1.7rem 1.7rem' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={thStyle}></th>
                <th style={thStyle}>Tenant</th>
                <th style={thStyle}>Property / Unit</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Amount</th>
                <th style={thStyle}>Method</th>
                <th style={thStyle}>Reference</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && payments.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#95a5a6', background: '#e9eced52' }}>Loading payments...</td></tr>
              ) : payments.length === 0 ? (
                <tr><td colSpan={8} style={{ padding: '2.5rem', textAlign: 'center', color: '#95a5a6', background: '#e9eced52' }}>No payments found.</td></tr>
              ) : (
                payments.map((p, index) => {
                  const tenantName = p.tenant_name || "Unknown";
                  const tenantId = p.tenant_id;
                  const paymentRef = `PAY${String(index + 1).padStart(6, "0")}`;
                  const isPending = p.status === "pending" || p.status === "pending_approval";
                  const needsCollections = (p.status === "late" || p.status === "rejected") && p.invoice_status !== "paid";
                  const noActionNeeded = (p.status === "late" || p.status === "rejected") && p.invoice_status === "paid";
                  return (
                    <tr key={p.id}>
                      <td style={tdStyle}>
                        <Link
                          to={`/landlord/payments/${p.id}`}
                          style={{ fontWeight: 600, color: '#2471a3', textDecoration: 'none', fontSize: '13px' }}
                        >
                          {paymentRef}
                        </Link>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: '#eaf2f8', color: '#2c6b9b',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 600, fontSize: '12px', flexShrink: 0,
                          }}>
                            {initials(tenantName)}
                          </div>
                          <Link
                            to={`/landlord/tenants/${tenantId}`}
                            style={{ fontWeight: 500, color: '#151515', textDecoration: 'none', fontSize: '13px' }}
                            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                          >
                            {tenantName}
                          </Link>
                        </div>
                      </td>

                      <td style={tdStyle}>
                        <div style={{ fontWeight: 500, color: '#151515' }}>{p.property_name || "—"}</div>
                        <div style={{ fontSize: '11px', color: '#333', marginTop: '2px' }}>
                          {p.unit_number ? `Unit ${p.unit_number}` : "—"}
                        </div>
                      </td>

                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 500, color: '#2b7a4b' }}>{formatAmount(p.amount_paid || 0)}</td>
                      <td style={tdStyle}>{p.payment_method === 'cash' ? 'Cash' : (p.payment_method || "—")}</td>
                      <td style={tdStyle}>{p.bank_reference || "—"}</td>
                      <td style={tdStyle}><StatusBadge status={p.status} /></td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center' }}>
                          {isPending && (
                            <button
                              onClick={() => navigate(`/landlord/payments/review/${p.id}`, { state: { payment: p } })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '11px',
                                fontWeight: 500,
                                padding: '0.15rem 0.5rem',
                                color: '#2c6b9b',
                                cursor: 'pointer',
                              }}
                            >
                              Review
                            </button>
                          )}
                          {needsCollections && (
                            <button
                              onClick={() => setCollectionsPayment(p)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '11px',
                                fontWeight: 500,
                                padding: '0.15rem 0.5rem',
                                color: '#54326b',
                                cursor: 'pointer',
                              }}
                            >
                              Collections
                            </button>
                          )}
                          {p.status === "paid" && (
                            <button
                              onClick={() => navigate(`/landlord/payments/receipt/${p.id}`, { state: { payment: p } })}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem',
                                fontSize: '11px',
                                fontWeight: 500,
                                padding: '0.15rem 0.5rem',
                                color: '#2b7a4b',
                                cursor: 'pointer',
                              }}
                            >
                              Receipt
                            </button>
                          )}
                          {p.status === "collections" && (
                            <span style={{ fontSize: '11px', color: '#95a5a6', fontStyle: 'italic' }}>Escalated</span>
                          )}
                          {noActionNeeded && (
                            <span style={{ fontSize: '11px', color: '#95a5a6' }}>No action</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          {payments.length > 0 && (
            <div style={{ padding: '0.6rem 1rem', fontSize: '13px', color: '#7f8c8d', textAlign: 'right', borderTop: '1px solid #9a9d9e52', background: '#e9eced52' }}>
              Showing {payments.length} of {paymentsPagination.total} payments
            </div>
          )}
        </div>

        {/* Pagination - bottom right */}
        {paymentsPagination.totalPages > 1 && (
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '0.3rem',
            padding: '0 1.7rem 1.7rem',
            marginTop: '-1.5rem',
          }}>
            <button
              disabled={paymentsPagination.page <= 1}
              onClick={() => fetchPayments(paymentsPagination.page - 1)}
              style={{
                padding: '0.2rem 0.5rem',
                border: '1px solid #d0d1d3',
                background: '#fdfdfd',
                color: '#000',
                cursor: 'pointer',
                fontSize: '13px',
                borderRadius: '2px',
              }}
            >
              ‹
            </button>
            {Array.from({ length: paymentsPagination.totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => fetchPayments(p)}
                style={{
                  padding: '0.2rem 0.5rem',
                  border: p === paymentsPagination.page ? '1px solid #2c3e50' : '1px solid #d0d1d3',
                  background: p === paymentsPagination.page ? '#2c3e50' : '#fdfdfd',
                  color: p === paymentsPagination.page ? '#ffffff' : '#000',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: p === paymentsPagination.page ? 600 : 400,
                  borderRadius: '2px',
                }}
              >
                {p}
              </button>
            ))}
            <button
              disabled={paymentsPagination.page >= paymentsPagination.totalPages}
              onClick={() => fetchPayments(paymentsPagination.page + 1)}
              style={{
                padding: '0.2rem 0.5rem',
                border: '1px solid #d0d1d3',
                background: '#fdfdfd',
                color: '#000',
                cursor: 'pointer',
                fontSize: '13px',
                borderRadius: '2px',
              }}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}