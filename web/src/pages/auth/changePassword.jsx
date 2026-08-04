import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../App";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { FiLock, FiEye, FiEyeOff, FiAlertCircle, FiCheck, FiArrowRight } from "react-icons/fi";
import { c, f } from "../../styles/theme";

const API = "http://localhost:4000";

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
      background: c.black,
      fontFamily: f.dm,
    },
    card: {
      width: "100%",
      maxWidth: 420,
      background: c.muted2,
      border: `1px solid ${c.border}`,
      borderRadius: "6px",
      padding: "2rem",
      animation: "fadeUp 0.4s ease forwards",
    },
    header: {
      textAlign: "center",
      marginBottom: "1.5rem",
    },
    iconCircle: {
      width: 56,
      height: 56,
      borderRadius: "50%",
      background: isFirstLogin ? "rgba(232,160,18,0.1)" : "rgba(58,143,212,0.1)",
      border: isFirstLogin ? "1px solid rgba(232,160,18,0.2)" : "1px solid rgba(58,143,212,0.2)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      margin: "0 auto 1rem",
    },
    title: {
      fontFamily: f.bebas,
      fontSize: "1.6rem",
      letterSpacing: "0.04em",
      color: c.white,
      marginBottom: "0.3rem",
    },
    subtitle: {
      fontSize: "0.8rem",
      color: c.textBody,
      lineHeight: 1.5,
    },
    errorBox: {
      background: "rgba(224,90,74,0.08)",
      border: "1px solid rgba(224,90,74,0.2)",
      borderRadius: "3px",
      padding: "0.7rem 0.9rem",
      marginBottom: "1.2rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "0.78rem",
      color: c.redLight,
    },
    successBox: {
      background: "rgba(26,122,74,0.08)",
      border: "1px solid rgba(76,186,122,0.2)",
      borderRadius: "3px",
      padding: "0.7rem 0.9rem",
      marginBottom: "1.2rem",
      display: "flex",
      alignItems: "center",
      gap: "0.5rem",
      fontSize: "0.78rem",
      color: c.greenLight,
    },
    field: { marginBottom: "1rem" },
    label: {
      display: "block",
      fontSize: "0.72rem",
      fontWeight: 600,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      marginBottom: "0.35rem",
      color: c.textLabel,
      fontFamily: f.mono,
    },
    inputWrapper: { position: "relative" },
    inputIcon: {
      position: "absolute",
      left: "0.8rem",
      top: "50%",
      transform: "translateY(-50%)",
      color: c.textDim,
    },
    input: {
      width: "100%",
      background: c.black,
      border: `1px solid ${c.border}`,
      color: c.white,
      fontFamily: f.dm,
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
      color: c.textDim,
      cursor: "pointer",
    },
    btn: {
      width: "100%",
      background: loading ? c.textBody : c.gold,
      color: c.black,
      padding: "0.8rem",
      fontFamily: f.dm,
      fontWeight: 700,
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
      border: "2px solid rgba(0,0,0,0.2)",
      borderTopColor: c.black,
      borderRadius: "50%",
      animation: "spin 0.6s linear infinite",
    },
    hints: {
      marginTop: "1rem",
      padding: "0.7rem 0.9rem",
      borderRadius: "3px",
      background: c.black,
      border: `1px solid ${c.border}`,
    },
    hintText: {
      fontSize: "0.65rem",
      color: c.textDim,
      fontFamily: f.mono,
      lineHeight: 1.6,
    },
  };

  if (done) {
    return (
      <div style={S.container}>
        <div style={{ ...S.card, textAlign: "center" }}>
          <div style={S.iconCircle}>
            <FiCheck size={28} color={c.greenLight} />
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
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        input:focus { border-color: ${c.borderFocus} !important; }
      `}</style>

      <div style={S.card}>
        <div style={S.header}>
          <div style={S.iconCircle}>
            <FiLock size={24} color={isFirstLogin ? c.gold : c.blue} />
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
                  placeholder="Enter current password"
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
                placeholder="At least 6 characters"
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
                placeholder="Re-enter new password"
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