// LANDLORD VERIFY RESET CODE PAGE
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { Icon } from "../../components/Icon";
import { c as C, f as F } from "../../styles/theme";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function VerifyCode() {
  useDocumentTitle("Verify Reset Code");
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleCodeChange(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) { setError("Email is required"); return; }
    if (!code || code.length < 6) { setError("Please enter the 6-digit reset code"); return; }
    setLoading(true);
    setError("");
    try {
      await axios.post(`${API}/auth/verify-reset-code`, { email: email.trim().toLowerCase(), code });
      navigate("/reset-password", { state: { email: email.trim().toLowerCase(), code } });
    } catch (err) {
      if (err.code === "ERR_NETWORK") setError("Unable to connect to server.");
      else if (err.response?.status === 400) setError("Invalid or expired reset code.");
      else setError("Verification failed.");
    } finally { setLoading(false); }
  }

  const inputStyle = {
    width: '100%', fontSize: '0.88rem', padding: '0.7rem 1rem',
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '2rem', background: C.black }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', marginBottom: '2rem' }}>
          <span style={{ fontFamily: F.bebas, fontSize: '1.4rem', letterSpacing: '0.06em', color: C.white }}>
            Chihwa<span style={{ color: C.gold }}>Rentals</span>
          </span>
        </div>

        <div style={{ background: C.muted2, borderRadius: '8px', border: `1px solid ${C.border}`, padding: '2rem', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', marginBottom: '0.5rem' }}>
            <div style={{ width: 40, height: 40, borderRadius: '8px', background: 'rgba(58,143,212,0.1)', border: '1px solid rgba(58,143,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="shield" size={20} color={C.blue} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em' }}>Verify Reset Code</h2>
              <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>Step 1 of 2</p>
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.4)', marginBottom: '1.5rem' }}>Enter the 6-digit code sent to your email.</p>

          {error && (
            <div style={{ padding: '0.6rem 0.8rem', borderRadius: '3px', background: 'rgba(224,90,74,0.08)', border: '1px solid rgba(224,90,74,0.2)', marginBottom: '1rem', fontSize: '0.75rem', color: C.redLight }}>{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 500, color: 'rgba(245,240,232,0.6)', marginBottom: '0.4rem' }}>Email Address</label>
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} placeholder="name@company.com" style={inputStyle} />
            </div>

            <div style={{ marginBottom: '0.3rem' }}>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 500, color: 'rgba(245,240,232,0.6)', marginBottom: '0.4rem' }}>Reset Code</label>
              <div style={{ position: 'relative' }}>
                <Icon name="lock" size={15} style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.25)', zIndex: 1 }} />
                <input type="text" value={code} onChange={handleCodeChange} placeholder="000000" maxLength={6}
                  style={{ ...inputStyle, paddingLeft: '2.5rem', letterSpacing: '8px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 700 }} />
              </div>
              {code && code.length < 6 && <p style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, marginTop: '0.3rem' }}>Enter all 6 digits</p>}
            </div>

            <button type="submit" disabled={loading} style={{ ...btnStyle, marginTop: '1.2rem', opacity: loading ? 0.6 : 1 }}>
              {loading ? <span style={{ width: 16, height: 16, border: '2px solid rgba(0,0,0,0.2)', borderTopColor: C.black, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : "Verify Code"}
            </button>

            <div style={{ textAlign: 'center', marginTop: '0.8rem' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.72rem', color: C.gold, textDecoration: 'none', fontFamily: F.mono }}
                onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
                Didn't receive a code? Send again
              </Link>
            </div>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <Link to="/login" style={{ fontSize: '0.78rem', color: C.gold, textDecoration: 'none', fontFamily: F.mono, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
            <Icon name="chevron-left" size={13} /> Back to Login
          </Link>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}