import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../App";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheck, FiArrowRight } from "react-icons/fi";

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

export default function CaretakerChangePassword() {
  const { user } = useAuth();
  const navigate = useNavigate();
  useDocumentTitle("Change Password");

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const isFirstLogin = user?.must_change_password;

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  }

  function validate() {
    if (!form.currentPassword && !isFirstLogin) return "Current password is required.";
    if (form.newPassword.length < 6) return "New password must be at least 6 characters.";
    if (form.newPassword !== form.confirmPassword) return "Passwords do not match.";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.put(
        `${API}/auth/change-password`,
        {
          current_password: isFirstLogin ? null : form.currentPassword,
          new_password: form.newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess("Password changed successfully.");
      setDone(true);

      setTimeout(() => {
        navigate("/caretaker/dashboard", { replace: true });
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.error;
      if (msg) setError(msg);
      else if (err.code === "ERR_NETWORK") setError("Unable to connect to server.");
      else setError("Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const S = {
    container: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
      background: COLORS.white,
      fontFamily: FONT,
      color: COLORS.text,
    },
    card: {
      width: "100%",
      maxWidth: 420,
      background: COLORS.white,
      border: `1px solid ${COLORS.border}`,
      borderRadius: "3px",
      padding: "2rem",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
    },
    header: {
      textAlign: "center",
      marginBottom: "1.5rem",
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: "50%",
      background: isFirstLogin ? `${COLORS.accent}10` : `${COLORS.blue}10`,
      border: isFirstLogin ? `1px solid ${COLORS.accent}30` : `1px solid ${COLORS.blue}30`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 1rem",
    },
    title: {
      fontSize: "1.5rem",
      fontWeight: 500,
      letterSpacing: "0.02em",
      color: COLORS.text,
      marginBottom: "0.3rem",
    },
    subtitle: {
      fontSize: "0.85rem",
      color: COLORS.textMuted,
      lineHeight: 1.5,
    },
    errorBox: {
      background: `${COLORS.red}10`,
      border: `1px solid ${COLORS.red}30`,
      borderRadius: "3px",
      padding: "0.7rem 0.9rem",
      marginBottom: "1.2rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "0.8rem",
      color: COLORS.red,
    },
    successBox: {
      background: `${COLORS.green}10`,
      border: `1px solid ${COLORS.green}30`,
      borderRadius: "3px",
      padding: "0.7rem 0.9rem",
      marginBottom: "1.2rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "0.8rem",
      color: COLORS.green,
    },
    field: { marginBottom: "1rem" },
    label: {
      display: "block",
      fontSize: "0.75rem",
      fontWeight: 600,
      letterSpacing: "0.04em",
      textTransform: "uppercase",
      marginBottom: "0.35rem",
      color: COLORS.textMuted,
    },
    inputWrapper: { position: "relative" },
    inputIcon: {
      position: "absolute",
      left: "0.8rem",
      top: "50%",
      transform: "translateY(-50%)",
      color: COLORS.textMuted,
    },
    input: {
      width: "100%",
      background: COLORS.white,
      border: `1px solid ${COLORS.border}`,
      color: COLORS.text,
      fontFamily: FONT,
      fontSize: "0.85rem",
      padding: "0.7rem 0.9rem",
      paddingLeft: "2.4rem",
      paddingRight: "2.5rem",
      borderRadius: "3px",
      outline: "none",
    },
    pwToggle: {
      position: "absolute",
      right: "0.8rem",
      top: "50%",
      transform: "translateY(-50%)",
      background: "none",
      border: "none",
      color: COLORS.textMuted,
      cursor: "pointer",
    },
    btn: {
      width: "100%",
      background: loading ? COLORS.textMuted : COLORS.dark,
      color: COLORS.white,
      padding: "0.8rem",
      fontFamily: FONT,
      fontWeight: 500,
      fontSize: "0.85rem",
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      border: "none",
      borderRadius: "3px",
      cursor: loading ? "not-allowed" : "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "0.5rem",
      marginTop: "0.5rem",
    },
    spinner: {
      width: 16,
      height: 16,
      border: "2px solid rgba(255,255,255,0.3)",
      borderTopColor: COLORS.white,
      borderRadius: "50%",
      animation: "spin 0.6s linear infinite",
    },
    hints: {
      marginTop: "1rem",
      padding: "0.7rem 0.9rem",
      borderRadius: "3px",
      background: COLORS.headBg,
      border: `1px solid ${COLORS.borderLight}`,
    },
    hintText: {
      fontSize: "0.7rem",
      color: COLORS.textMuted,
      lineHeight: 1.6,
    },
  };

  if (done) {
    return (
      <div style={S.container}>
        <div style={{ ...S.card, textAlign: "center" }}>
          <div style={S.iconCircle}>
            <FiCheck size={28} color={COLORS.green} />
          </div>
          <h2 style={S.title}>Password Changed</h2>
          <p style={S.subtitle}>
            {isFirstLogin
              ? "Your password has been set. Redirecting you to the dashboard..."
              : "Your password has been updated successfully."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={S.container}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { border-color: ${COLORS.accent} !important; box-shadow: 0 0 0 2px ${COLORS.accent}20; }
      `}</style>

      <div style={S.card}>
        <div style={S.header}>
          <div style={S.iconCircle}>
            <FiLock size={24} color={isFirstLogin ? COLORS.accent : COLORS.blue} />
          </div>
          <h2 style={S.title}>
            {isFirstLogin ? "Set Your Password" : "Change Password"}
          </h2>
          <p style={S.subtitle}>
            {isFirstLogin
              ? "Welcome! Please create a secure password for your caretaker account."
              : "Enter your current password and choose a new one."}
          </p>
        </div>

        {error && (
          <div style={S.errorBox}>
            <FiAlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={S.successBox}>
            <FiCheck size={16} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {!isFirstLogin && (
            <div style={S.field}>
              <label style={S.label}>Current Password</label>
              <div style={S.inputWrapper}>
                <FiLock size={14} style={S.inputIcon} />
                <input
                  type={showCurrent ? "text" : "password"}
                  name="currentPassword"
                  value={form.currentPassword}
                  onChange={handleChange}
                  style={S.input}
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} style={S.pwToggle}>
                  {showCurrent ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>
          )}

          <div style={S.field}>
            <label style={S.label}>New Password</label>
            <div style={S.inputWrapper}>
              <FiLock size={14} style={S.inputIcon} />
              <input
                type={showNew ? "text" : "password"}
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                style={S.input}
              />
              <button type="button" onClick={() => setShowNew(!showNew)} style={S.pwToggle}>
                {showNew ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
          </div>

          <div style={S.field}>
            <label style={S.label}>Confirm New Password</label>
            <div style={S.inputWrapper}>
              <FiLock size={14} style={S.inputIcon} />
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                style={S.input}
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={S.pwToggle}>
                {showConfirm ? <FiEyeOff size={15} /> : <FiEye size={15} />}
              </button>
            </div>
          </div>

          <div style={S.hints}>
            <p style={S.hintText}>
              • At least 6 characters long<br />
              • Use a mix of letters, numbers, and symbols<br />
              • Avoid using personal information
            </p>
          </div>

          <button type="submit" disabled={loading} style={S.btn}>
            {loading ? (
              <>
                <span style={S.spinner} />
                {isFirstLogin ? "Setting password..." : "Changing password..."}
              </>
            ) : (
              <>
                {isFirstLogin ? "Set Password" : "Change Password"} <FiArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}