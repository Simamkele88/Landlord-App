// LANDLORD FORGOT PASSWORD PAGE 
import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { Icon } from "../../components/Icon";
import { c as C, f as F } from "../../styles/theme";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function ForgotPassword() {
  useDocumentTitle("Forgot Password");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address"); return; }
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API}/auth/forgot-password`, { email: email.trim().toLowerCase() });
      setSubmitted(true);
    } catch (err) {
      if (err.code === "ERR_NETWORK") setError("Unable to connect to server.");
      else setError(err.response?.data?.error || "Failed to send reset code.");
    } finally { setLoading(false); }
  }

  const inputStyle = {
    width: '100%', fontSize: '0.88rem', padding: '0.7rem 1rem 0.7rem 2.5rem',
    borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`,
    color: C.white, fontFamily: F.dm, outline: 'none',
  };

  const btnStyle = {
    width: '100%', padding: '0.7rem', borderRadius: '3px',
    fontSize: '0.82rem', fontWeight: 700, fontFamily: F.dm,
    letterSpacing: '0.04em', border: 'none', cursor: 'pointer',
    background: C.gold, color: C.black,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
  };

  // SUCCESS STATE
  if (submitted) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: C.black }}>
        <div style={{ width: '100%', maxWidth: 420, background: C.muted2, borderRadius: '8px', border: `1px solid ${C.border}`, padding: '2.5rem 2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(26,122,74,0.1)', border: '1px solid rgba(76,186,122,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <Icon name="check" size={30} color={C.greenLight} />
            </div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>Check Your Email</h2>
            <p style={{ fontSize: '0.82rem', color: 'rgba(245,240,232,0.5)', lineHeight: 1.6, marginBottom: '0.3rem' }}>
              If an account exists for <strong style={{ color: C.white }}>{email}</strong>, a 6-digit reset code has been sent.
            </p>
            <p style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, marginBottom: '1.5rem' }}>
              The code expires in 15 minutes. Check your spam folder.
            </p>
            <div style={{ padding: '0.7rem', borderRadius: '3px', background: 'rgba(58,143,212,0.06)', border: '1px solid rgba(58,143,212,0.15)', marginBottom: '1.2rem' }}>
              <p style={{ fontSize: '0.72rem', color: 'rgba(58,143,212,0.7)', lineHeight: 1.4 }}>Enter the code on the reset password page to set a new password.</p>
            </div>
            <Link to="/verify-code" style={{ ...btnStyle, textDecoration: 'none', marginBottom: '0.8rem', display: 'flex' }}>Enter Reset Code</Link>
            <Link to="/login" style={{ fontSize: '0.78rem', color: C.gold, textDecoration: 'none', fontFamily: F.mono, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
              <Icon name="chevron-left" size={13} /> Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // FORM
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: C.black }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
          <span style={{ fontFamily: F.bebas, fontSize: '1.4rem', letterSpacing: '0.06em', color: C.white }}>
            Chihwa<span style={{ color: C.gold }}>Rentals</span>
          </span>
        </div>

        <div style={{ background: C.muted2, borderRadius: '8px', border: `1px solid ${C.border}`, padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', marginBottom: '0.3rem' }}>Forgot Password</h2>
          <p style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.4)', marginBottom: '1.5rem' }}>Enter your email and we'll send you a 6-digit reset code.</p>

          {error && (
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)', marginBottom: '1rem', fontSize: '0.75rem', color: C.redLight }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 500, color: 'rgba(245,240,232,0.6)', marginBottom: '0.4rem' }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Icon name="mail" size={15} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.25)' }} />
                <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="name@company.com" style={inputStyle} />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{ ...btnStyle, opacity: loading ? 0.6 : 1 }}>
              {loading ? <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: C.black, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : "Send Reset Code"}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/login" style={{ fontSize: '0.78rem', color: C.gold, textDecoration: 'none', fontFamily: F.mono, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                <Icon name="chevron-left" size={13} /> Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}