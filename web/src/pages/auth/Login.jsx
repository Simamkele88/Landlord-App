// LOGIN PAGE
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../App";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiArrowRight, FiCheck } from "react-icons/fi";

const API = "http://localhost:4000";

const COLORS = {
  text: "#1f2328",
  textMuted: "#5f6b7a",
  border: "#dfe3e8",
  borderLight: "#eef1f4",
  headBg: "#f7f8fa",
  green: "#2b7a4b",
  white: "#fdfdfd",
  red: "#9e3a3a",
  gold: "#8b6e1a",
  blue: "#2c6b9b",
  accent: "#3498db",
  dark: "#2c3e50",
};

const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

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
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: "100vh",
      padding: "2rem",
      fontFamily: FONT,
      background: "#f3f3f3",
      color: COLORS.text,
    },
    formContainer: {
      width: "100%",
      maxWidth: 500,
      backgroundColor: "#fff",
      padding: "2.5rem 2.5rem",
      borderRadius: "8px"
    },
    title: {
      fontSize: "2rem",
      fontWeight: 500,
      letterSpacing: "0.04em",
      marginBottom: "0.3rem",
      color: COLORS.text,
    },
    subtitle: {
      fontSize: "0.85rem",
      color: COLORS.textMuted,
      marginBottom: "1.8rem",
      lineHeight: 1.6,
    },
    errorBox: {
      background: `${COLORS.red}10`,
      border: `1px solid ${COLORS.red}30`,
      borderRadius: "3px",
      padding: "0.8rem 1rem",
      marginBottom: "1.5rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "0.85rem",
      color: COLORS.red,
    },
    field: { marginBottom: "1.1rem" },
    label: {
      display: "block",
      fontSize: "0.75rem",
      fontWeight: 600,
      letterSpacing: "0.06em",
      marginBottom: "0.4rem",
      color: COLORS.textMuted,
    },
    inputWrapper: { position: "relative" },
    inputIcon: {
      position: "absolute",
      left: "0.9rem",
      top: "50%",
      transform: "translateY(-50%)",
      color: COLORS.textMuted,
    },
    input: (hasError) => ({
      width: "100%",
      background: COLORS.white,
      border: `1px solid ${hasError ? COLORS.red : COLORS.border}`,
      color: COLORS.text,
      fontFamily: FONT,
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
      color: COLORS.textMuted,
      cursor: "pointer",
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
      fontSize: "0.8rem",
      color: COLORS.textMuted,
      userSelect: "none",
    },
    checkbox: (checked) => ({
      width: 15,
      height: 15,
      border: `1px solid ${checked ? COLORS.accent : COLORS.border}`,
      borderRadius: "2px",
      background: checked ? COLORS.accent : COLORS.white,
      flexShrink: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: "0.6rem",
      color: COLORS.white,
    }),
    forgotLink: {
      fontSize: "0.75rem",
      color: COLORS.textMuted,
      textDecoration: "none",
      fontWeight: 500,
    },
    btn: {
      width: "100%",
      background: loading ? COLORS.textMuted : COLORS.dark,
      color: COLORS.white,
      padding: "0.9rem",
      fontFamily: FONT,
      fontWeight: 500,
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
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: COLORS.white,
      borderRadius: "50%",
      animation: "spin 0.6s linear infinite",
    },
  };

  return (
    <div style={S.container}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #ffffff; overflow-x: hidden; }
        input:focus { border-color: ${COLORS.accent} !important; box-shadow: 0 0 0 2px ${COLORS.accent}20; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .login-form { animation: fadeUp 0.5s ease forwards 0.1s; opacity: 0; }
      `}</style>

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
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                style={S.input(false)}
                onKeyDown={e => e.key === "Enter" && handleSubmit(e)}
              />
            </div>
          </div>

          <div style={S.field}>
            <label style={S.label}>Password</label>
            <div style={S.inputWrapper}>
              <FiLock size={14} style={S.inputIcon} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                style={{ ...S.input(false), paddingRight: "2.5rem" }}
                onKeyDown={e => e.key === "Enter" && handleSubmit(e)}
              />
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
  );
}