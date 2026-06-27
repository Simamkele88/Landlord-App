// LOGIN PAGE 
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../App";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiArrowRight, FiCheck } from "react-icons/fi";
import { c, f } from "../../styles/theme";

const API = "http://localhost:4000";

const trustItems = [
  { text: "Property Management" },
  { text: "Tenant Tracking" },
  { text: "Maintenance History" },
  { text: "Payment Records" },
  { text: "Secure & Private" },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle("Login");

  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
    setError("");
  }

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    setError("");

    const credentials = { email: String(form.email).trim(), password: String(form.password) };

    try {
      let response = null;
      let determinedRole = null;

      try {
        response = await axios.post(`${API}/auth/landlord/login`, credentials);
        determinedRole = "landlord";
      } catch (landlordErr) {
        if (landlordErr.response?.status === 401 || landlordErr.response?.status === 404) {
          try {
            response = await axios.post(`${API}/auth/login`, credentials);
            determinedRole = response.data.user?.role ?? "caretaker";
          } catch (userErr) {
            const status = userErr.response?.status;
            if (status === 401) throw new Error("INVALID_CREDENTIALS");
            if (status === 403) throw new Error("ACCOUNT_DEACTIVATED");
            throw userErr;
          }
        } else if (landlordErr.response?.status === 403) {
          throw new Error("ACCOUNT_DEACTIVATED");
        } else {
          throw landlordErr;
        }
      }

      const { data } = response;
      if (!data.user.role) data.user.role = determinedRole;

      const storage = form.remember ? localStorage : sessionStorage;
      storage.setItem("token", data.token);
      storage.setItem("user", JSON.stringify(data.user));
      login(data.token, data.user);

      if (data.user.must_change_password) {
        navigate("/change-password", {
          state: { message: "Please change your temporary password to continue", isFirstLogin: true },
        });
        return;
      }

      const roleRoutes = { landlord: "/landlord/dashboard", caretaker: "/caretaker/dashboard" };
      navigate(roleRoutes[data.user.role] ?? "/dashboard");

    } catch (err) {
      const msg = err.message;
      if (msg === "INVALID_CREDENTIALS") setError("Invalid email or password. Please try again.");
      else if (msg === "ACCOUNT_DEACTIVATED") setError("Your account has been deactivated. Please contact the property owner.");
      else if (err.response?.status === 401) setError("Invalid email or password. Please try again.");
      else if (err.response?.status === 403) setError("Your account has been deactivated. Please contact the property owner.");
      else if (err.response?.data?.error) setError(err.response.data.error);
      else if (err.code === "ERR_NETWORK") setError("Unable to connect to server. Please check your internet connection.");
      else setError("Login failed. Please try again later.");
    } finally {
      setLoading(false);
    }
  }

  const S = {
    container: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      width: "100%",
      minHeight: "100vh",
      fontFamily: f.dm,
      fontWeight: 300,
      background: c.black,
      color: c.white,
    },
    leftPanel: {
      background: c.muted2,
      borderRight: `1px solid ${c.border}`,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      padding: "3rem",
      position: "relative",
      overflow: "hidden",
    },
    leftGrid: {
      position: "absolute",
      inset: 0,
      backgroundImage: `linear-gradient(rgba(232,160,18,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(232,160,18,0.05) 1px, transparent 1px)`,
      backgroundSize: "48px 48px",
      pointerEvents: "none",
    },
    logo: {
      fontFamily: f.bebas,
      fontSize: "1.8rem",
      letterSpacing: "0.08em",
      color: c.white,
      textDecoration: "none",
      position: "relative",
      zIndex: 1,
    },
    goldText: { color: c.gold },
    tagline: {
      fontFamily: f.mono,
      fontSize: "0.68rem",
      letterSpacing: "0.2em",
      textTransform: "uppercase",
      color: c.gold,
      marginBottom: "1rem",
      position: "relative",
      zIndex: 1,
    },
    heading: {
      fontFamily: f.bebas,
      fontSize: "clamp(2.5rem, 5vw, 4rem)",
      lineHeight: 0.9,
      letterSpacing: "0.02em",
      marginBottom: "1.5rem",
      position: "relative",
      zIndex: 1,
    },
    description: {
      fontSize: "0.95rem",
      color: c.textBody,
      lineHeight: 1.7,
      maxWidth: 380,
      marginBottom: "2.5rem",
      position: "relative",
      zIndex: 1,
    },
    trustRow: {
      display: "flex",
      flexWrap: "wrap",
      gap: "0.5rem",
      position: "relative",
      zIndex: 1,
    },
    trustPill: {
      background: "rgba(232,160,18,0.08)",
      border: "1px solid rgba(232,160,18,0.2)",
      padding: "0.4rem 0.9rem",
      borderRadius: "2px",
      fontFamily: f.mono,
      fontSize: "0.65rem",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      color: c.gold,
      display: "flex",
      alignItems: "center",
      gap: "0.3rem",
    },
    copyright: {
      position: "relative",
      zIndex: 1,
      fontFamily: f.mono,
      fontSize: "0.62rem",
      letterSpacing: "0.08em",
      color: c.textDim,
    },
    rightPanel: {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "3rem 2rem",
      overflowY: "auto",
    },
    formContainer: {
      width: "100%",
      maxWidth: 420,
    },
    title: {
      fontFamily: f.bebas,
      fontSize: "2rem",
      letterSpacing: "0.04em",
      marginBottom: "0.3rem",
    },
    subtitle: {
      fontSize: "0.82rem",
      color: c.textMuted,
      marginBottom: "1.8rem",
      lineHeight: 1.6,
    },
    errorBox: {
      background: "rgba(224,90,74,0.08)",
      border: "1px solid rgba(224,90,74,0.2)",
      borderRadius: "3px",
      padding: "0.8rem 1rem",
      marginBottom: "1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "0.8rem",
      color: c.redLight,
    },
    field: { marginBottom: "1.1rem" },
    label: {
      display: "block",
      fontSize: "0.75rem",
      fontWeight: 600,
      letterSpacing: "0.06em",
      marginBottom: "0.4rem",
      color: c.textLabel,
    },
    inputWrapper: { position: "relative" },
    inputIcon: {
      position: "absolute",
      left: "0.9rem",
      top: "50%",
      transform: "translateY(-50%)",
      color: c.textDim,
    },
    input: (hasError) => ({
      width: "100%",
      background: c.muted2,
      border: `1px solid ${hasError ? "rgba(224,90,74,0.5)" : c.border}`,
      color: c.white,
      fontFamily: f.dm,
      fontSize: "0.88rem",
      padding: "0.8rem 1rem",
      paddingLeft: "2.5rem",
      borderRadius: "3px",
      outline: "none",
    }),
    pwToggle: {
      position: "absolute",
      right: "0.9rem",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      color: c.textDim,
      cursor: "pointer",
    },
    errorText: {
      fontSize: "0.68rem",
      color: c.redLight,
      fontFamily: f.mono,
      marginTop: "0.3rem",
      display: "flex",
      alignItems: "center",
      gap: "0.3rem",
    },
    row: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: "1.5rem",
    },
    rememberRow: {
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      cursor: "pointer",
      fontSize: "0.78rem",
      color: c.textBody,
      userSelect: "none",
    },
    checkbox: (checked) => ({
      width: 15,
      height: 15,
      border: `1px solid ${checked ? c.gold : c.border}`,
      borderRadius: "2px",
      background: checked ? c.gold : c.muted2,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "0.6rem",
      color: c.black,
    }),
    forgotLink: {
      fontSize: "0.72rem",
      color: c.textDim,
      fontFamily: f.mono,
      letterSpacing: "0.06em",
      textDecoration: "none",
    },
    btn: {
      width: "100%",
      background: loading ? c.textBody : c.gold,
      color: c.black,
      padding: "0.9rem",
      fontFamily: f.dm,
      fontWeight: 700,
      fontSize: "0.88rem",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      border: "none",
      borderRadius: "3px",
      cursor: loading ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
    },
    spinner: {
      width: 18,
      height: 18,
      border: "2px solid rgba(0,0,0,0.2)",
      borderTopColor: c.black,
      borderRadius: "50%",
      animation: "spin 0.6s linear infinite",
    },
  };

  return (
    <div style={S.container}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0a; overflow-x: hidden; }
        body::before { content: ''; position: fixed; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E"); pointer-events: none; z-index: 9999; opacity: 0.4; }
        input:focus { border-color: ${c.borderFocus} !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .login-form { animation: fadeUp 0.5s ease forwards 0.1s; opacity: 0; }
        @media (max-width: 800px) {
          .split-layout { grid-template-columns: 1fr !important; }
          .left-panel { display: none !important; }
          .right-panel { padding: 2rem 1.5rem !important; align-items: flex-start !important; padding-top: 3rem !important; }
        }
      `}</style>

      {/* LEFT PANEL */}
      <div className="left-panel" style={S.leftPanel}>
        <div style={S.leftGrid} />
        <a href="/" style={S.logo}>
          Chihwa<span style={S.goldText}>Rentals</span>
        </a>
        <div>
          <p style={S.tagline}>Property Management System</p>
          <h1 style={S.heading}>
            Manage Your<br /><span style={S.goldText}>Properties</span><br />With Ease.
          </h1>
          <p style={S.description}>
            Streamline rent collection, maintenance tracking, and tenant management across all your properties from one dashboard.
          </p>
          <div style={S.trustRow}>
            {trustItems.map((item, i) => (
              <div key={i} style={S.trustPill}>
                <FiCheck size={10} /> {item.text}
              </div>
            ))}
          </div>
        </div>
        <p style={S.copyright}>&copy; 2026 Chihwa Rentals · Johannesburg, SA</p>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel" style={S.rightPanel}>
        <div className="login-form" style={S.formContainer}>
          <h2 style={S.title}>Welcome Back.</h2>
          <p style={S.subtitle}>Access your landlord or caretaker account</p>

          {error && (
            <div style={S.errorBox}>
              <FiAlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={S.field}>
              <label style={S.label}>Email address</label>
              <div style={S.inputWrapper}>
                <FiMail size={14} style={S.inputIcon} />
                <input type="email" name="email" value={form.email} onChange={handleChange} required placeholder="name@company.com" style={S.input(false)} onKeyDown={e => e.key === "Enter" && handleSubmit(e)} />
              </div>
            </div>

            <div style={S.field}>
              <label style={S.label}>Password</label>
              <div style={S.inputWrapper}>
                <FiLock size={14} style={S.inputIcon} />
                <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} required placeholder="••••••••" style={{ ...S.input(false), paddingRight: "2.5rem" }} onKeyDown={e => e.key === "Enter" && handleSubmit(e)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={S.pwToggle}>
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <div style={S.row}>
              <div onClick={() => handleChange({ target: { name: "remember", type: "checkbox", checked: !form.remember } })} style={S.rememberRow}>
                <div style={S.checkbox(form.remember)}>
                  {form.remember && <FiCheck size={10} strokeWidth={3} />}
                </div>
                Remember me
              </div>
              <Link to="/forgot-password" style={S.forgotLink}>Forgot password?</Link>
            </div>

            <button type="submit" disabled={loading} style={S.btn}>
              {loading ? (
                <>
                  <span style={S.spinner} />
                  Signing in...
                </>
              ) : (
                <>
                  Sign in <FiArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}