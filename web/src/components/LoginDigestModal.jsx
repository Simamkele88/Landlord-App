import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Icon } from "./Icon";

const API = "http://localhost:4000";

function LoginDigestModal({ onClose }) {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    axios.get(`${API}/api/dashboard/login-digest`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => setDigest(res.data.digest))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}>
      <div style={{ width: "100%", maxWidth: 520, background: "#fff", borderRadius: "6px", boxShadow: "0 20px 60px rgba(0,0,0,0.15)", overflow: "hidden" }}>
        <div style={{ padding: "1.2rem 1.5rem", borderBottom: "1px solid #e9ecef", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>Welcome back</h3>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: "#666" }}>Here’s what’s happening</p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}>×</button>
        </div>

        <div style={{ padding: "1rem 1.5rem" }}>
          {loading ? (
            <p style={{ textAlign: "center", color: "#666", padding: "2rem 0" }}>Loading digest...</p>
          ) : digest ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {digest.pending_payment_approvals > 0 && (
                <Link to="/landlord/payments" style={rowStyle}>
                  <span>{digest.pending_payment_approvals} payments awaiting approval</span>
                  <span>→</span>
                </Link>
              )}
              {digest.overdue_invoices?.count > 0 && (
                <Link to="/landlord/payments/invoices?status=overdue" style={rowStyle}>
                  <span>{digest.overdue_invoices.count} overdue invoices ({formatMoney(digest.overdue_invoices.total)})</span>
                  <span>→</span>
                </Link>
              )}
              {digest.high_risk_tenants > 0 && (
                <Link to="/landlord/tenants?risk=high_risk" style={rowStyle}>
                  <span>{digest.high_risk_tenants} high-risk tenants</span>
                  <span>→</span>
                </Link>
              )}
              {digest.open_maintenance?.total > 0 && (
                <Link to="/landlord/maintenance" style={rowStyle}>
                  <span>{digest.open_maintenance.total} open maintenance requests {digest.open_maintenance.urgent > 0 && `(${digest.open_maintenance.urgent} urgent)`}</span>
                  <span>→</span>
                </Link>
              )}
              {digest.open_complaints?.total > 0 && (
                <Link to="/landlord/complaints" style={rowStyle}>
                  <span>{digest.open_complaints.total} open complaints {digest.open_complaints.escalated > 0 && `(${digest.open_complaints.escalated} escalated)`}</span>
                  <span>→</span>
                </Link>
              )}
              {digest.leases_expiring_soon > 0 && (
                <Link to="/landlord/leases?expiring=60" style={rowStyle}>
                  <span>{digest.leases_expiring_soon} leases expiring soon</span>
                  <span>→</span>
                </Link>
              )}
              {digest.active_collections?.count > 0 && (
                <Link to="/landlord/collections" style={rowStyle}>
                  <span>{digest.active_collections.count} accounts in collections</span>
                  <span>→</span>
                </Link>
              )}
            </div>
          ) : (
            <p style={{ textAlign: "center", color: "#666" }}>Nothing urgent.</p>
          )}
        </div>

        <div style={{ padding: "0.8rem 1.5rem 1.2rem", borderTop: "1px solid #e9ecef", textAlign: "right" }}>
          <button onClick={onClose} style={{ background: "#2c3e50", color: "#fff", border: "none", padding: "0.4rem 1rem", borderRadius: "3px", cursor: "pointer" }}>
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

const rowStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0.6rem 0.8rem",
  borderRadius: "3px",
  border: "1px solid #e9ecef",
  textDecoration: "none",
  color: "#000",
  fontSize: "0.85rem",
  background: "#f9fafb",
};

function formatMoney(n) {
  return `R ${Number(n || 0).toLocaleString("en-ZA")}`;
}

export default LoginDigestModal;