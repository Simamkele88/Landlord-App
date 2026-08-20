// LANDLORD RESET PASSWORD PAGE 
import { useState } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { Icon } from "../../components/Icon";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

// ---- Local light theme ----
const C = {
  background: "#f4f5f7",
  card: "#ffffff",
  border: "#e9ecef",
  primary: "#2c3e50",
  blue: "#3498db",
  green: "#2b7a4b",
  red: "#9e3a3a",
};

const F = {
  bebas: '"Bebas Neue", sans-serif',
  dm: '"DM Sans", sans-serif',
  mono: '"Space Mono", monospace',
};

const TEXT = "#000";
const SECONDARY_TEXT = "#333";

export default function ResetPassword() {
  useDocumentTitle("Reset Password");
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email;
  const code = location.state?.code;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  if (!email || !code) return <Navigate to="/forgot-password" replace />;

  function validate() {
    if (!newPassword) return "New password is required";
    if (newPassword.length < 8) return "Password must be at least 8 characters";
    if (newPassword !== confirmPassword) return "Passwords do not match";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API}/auth/reset-password`, { email, code, newPassword });
      setSuccess(true);
    } catch (err) {
      if (err.code === "ERR_NETWORK") setError("Unable to connect to server.");
      else setError(err.response?.data?.error || "Failed to reset password.");
    } finally { setLoading(false); }
  }

  const inputStyle = {
    width: '100%',
    fontSize: '0.88rem',
    padding: '0.7rem 1rem',
    borderRadius: '3px',
    background: C.background,
    border: `1px solid ${C.border}`,
    color: TEXT,
    fontFamily: F.dm,
    outline: 'none',
  };

  const btnStyle = {
    width: '100%',
    padding: '0.7rem',
    borderRadius: '3px',
    fontSize: '0.82rem',
    fontWeight: 700,
    fontFamily: F.dm,
    letterSpacing: '0.04em',
    border: 'none',
    cursor: 'pointer',
    background: C.primary,
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  };

  if (success) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: C.background }}>
        <div style={{ width: '100%', maxWidth: 420, background: C.card, borderRadius: '8px', border: `1px solid ${C.border}`, padding: '2.5rem 2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(43,122,75,0.1)', border: '1px solid rgba(43,122,75,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Icon name="check" size={30} color={C.green} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: TEXT, fontFamily: F.bebas, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>Password Reset Successful</h2>
            <p style={{ fontSize: '0.82rem', color: SECONDARY_TEXT, marginBottom: '1.5rem' }}>Your password has been updated. You can now log in.</p>
            <button onClick={() => navigate("/login")} style={btnStyle}>Go to Login</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: C.background }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
          <span style={{ fontFamily: F.bebas, fontSize: '1.4rem', letterSpacing: '0.06em', color: TEXT }}>
            Chihwa<span style={{ color: C.primary }}>Rentals</span>
          </span>
        </div>

        <div style={{ background: C.card, borderRadius: '8px', border: `1px solid ${C.border}`, padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="lock" size={20} color={C.blue} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: TEXT, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Set New Password</h2>
              <p style={{ fontSize: '0.65rem', color: SECONDARY_TEXT, fontFamily: F.mono }}>Step 2 of 2</p>
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: SECONDARY_TEXT, marginBottom: '1.5rem' }}>
            Choose a new password for <strong style={{ color: TEXT }}>{email}</strong>.
          </p>

          {error && (
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(158,58,58,0.08)', border: '1px solid rgba(158,58,58,0.2)', marginBottom: '1rem', fontSize: '0.75rem', color: C.red }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 500, color: SECONDARY_TEXT, marginBottom: '0.4rem' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} value={newPassword} onChange={e => { setNewPassword(e.target.value); setError(""); }} placeholder="At least 8 characters"
                  style={{ ...inputStyle, paddingRight: '2.5rem' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '0.7rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: SECONDARY_TEXT, padding: '2px' }}>
                  <Icon name={showPassword ? "eye-off" : "eye"} size={16} />
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '0.3rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 500, color: SECONDARY_TEXT, marginBottom: '0.4rem' }}>Confirm New Password</label>
              <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); setError(""); }} placeholder="Re-enter your password" style={inputStyle} />
              {confirmPassword && newPassword !== confirmPassword && (
                <p style={{ fontSize: '0.65rem', color: C.red, marginTop: '0.3rem' }}>Passwords do not match</p>
              )}
            </div>

            <button type="submit" disabled={loading} style={{ ...btnStyle, marginTop: '1.2rem', opacity: loading ? 0.6 : 1 }}>
              {loading ? <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : "Reset Password"}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/verify-code" style={{ fontSize: '0.78rem', color: C.blue, textDecoration: 'none', fontFamily: F.mono, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
            <Icon name="chevron-left" size={13} /> Back to Verify Code
          </Link>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}