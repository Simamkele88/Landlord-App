import { useState } from "react";
import axios from "axios";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";

const API = "http://localhost:4000";

// ---- Local light theme ----
const C = {
  background: "#f4f5f7",
  card: "#ffffff",
  border: "#e9ecef",
  primary: "#2c3e50",
  blue: "#3498db",
  green: "#2b7a4b",
  red: "#9e3a3a",
  purple: "#6f42c1",
};

const F = {
  bebas: '"Bebas Neue", sans-serif',
  dm: '"DM Sans", sans-serif',
  mono: '"Space Mono", monospace',
};

const TEXT = "#000";

const settingsNav = [
  { id: 'profile', icon: 'user', label: 'Profile' },
  { id: 'account', icon: 'lock', label: 'Account & Security' },
  { id: 'notifications', icon: 'bell', label: 'Notifications' },
  { id: 'property', icon: 'home', label: 'Assigned Property' },
];

// Common styles
const inputStyle = {
  width: '100%',
  fontSize: '0.82rem',
  padding: '0.6rem 0.9rem',
  borderRadius: '3px',
  background: C.background,
  border: `1px solid ${C.border}`,
  color: TEXT,
  fontFamily: F.dm,
  outline: 'none',
};

const btnPrimary = {
  background: C.primary,
  color: '#ffffff',
  border: 'none',
  padding: '0.65rem 1.8rem',
  fontSize: '0.8rem',
  fontWeight: 700,
  fontFamily: F.dm,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  borderRadius: '2px',
  cursor: 'pointer',
};

const btnGhost = {
  background: 'transparent',
  color: TEXT,
  border: `1px solid ${C.border}`,
  padding: '0.65rem 1.2rem',
  fontSize: '0.8rem',
  fontWeight: 500,
  fontFamily: F.dm,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  borderRadius: '2px',
  cursor: 'pointer',
};

function Field({ label, hint, children, optional }) {
  return (
    <div style={{ marginBottom: '1.2rem' }}>
      <label style={{
        display: 'block',
        fontSize: '0.65rem',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: '0.4rem',
        color: TEXT,
        fontFamily: F.mono,
      }}>
        {label}
        {optional && <span style={{ color: TEXT, fontWeight: 400, textTransform: 'none', marginLeft: '0.3rem' }}>(Optional)</span>}
      </label>
      {hint && <span style={{ fontSize: '0.62rem', color: TEXT, fontFamily: F.mono, marginBottom: '0.4rem', display: 'block' }}>{hint}</span>}
      {children}
    </div>
  );
}

function Block({ title, children }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: '5px',
      padding: '1.5rem',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.2rem',
        paddingBottom: '0.7rem',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <span style={{
          fontFamily: F.mono,
          fontSize: '0.62rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: TEXT,
        }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.85rem 0',
      borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ flex: 1, paddingRight: '1rem' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 500, color: TEXT, marginBottom: '0.1rem' }}>{label}</div>
        <div style={{ fontSize: '0.68rem', color: TEXT, lineHeight: 1.5 }}>{desc}</div>
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: 42,
        height: 22,
        borderRadius: '11px',
        background: value ? C.green : C.border,
        position: 'relative',
        cursor: 'pointer',
        flexShrink: 0,
        border: 'none',
        transition: 'background 0.25s',
      }}>
        <div style={{
          position: 'absolute',
          top: 3,
          left: value ? 23 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#ffffff',
          transition: 'left 0.25s',
        }} />
      </button>
    </div>
  );
}

export default function CaretakerSettings() {
  useDocumentTitle("Settings");
  const toast = useToast();

  const [activePanel, setActivePanel] = useState('profile');
  const [hasChanges, setHasChanges] = useState(false);

  // Profile
  const [firstName, setFirstName] = useState('David');
  const [lastName, setLastName] = useState('Nkosi');
  const [email, setEmail] = useState('david@chihwarentals.co.za');
  const [phone, setPhone] = useState('+27 83 456 7890');

  // Notifications
  const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);
  const [complaintAlerts, setComplaintAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const flagChange = () => { if (!hasChanges) setHasChanges(true); };

  const saveChanges = async () => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.put(`${API}/caretaker/settings`, {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        notify_maintenance_updates: maintenanceAlerts,
        notify_complaint_alerts: complaintAlerts,
        notify_tenant_messages: messageAlerts,
        notify_push: pushNotif,
        notify_email_digest: emailDigest,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHasChanges(false);
      toast.success("Settings saved successfully.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save settings.");
    }
  };

  const discardChanges = () => setHasChanges(false);

  const savePassword = async () => {
    if (!currentPassword) { toast.error("Current password is required."); return; }
    if (!newPassword) { toast.error("New password is required."); return; }
    if (!confirmPassword) { toast.error("Please confirm your new password."); return; }
    if (currentPassword === newPassword) { toast.error("New password cannot be the same as the current password."); return; }
    if (newPassword.length < 6) { toast.error("New password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords do not match."); return; }

    setSavingPassword(true);
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      await axios.put(`${API}/auth/change-password`, {
        current_password: currentPassword,
        new_password: newPassword,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success("Password updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.log("Change Password Error:", err);
      toast.error(err.response?.data?.error || "Failed to update password");
    } finally {
      setSavingPassword(false);
    }
  };

  const S = {
    container: { maxWidth: 1000, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: TEXT, fontFamily: F.bebas, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    subtitle: { fontSize: '0.75rem', color: TEXT, fontFamily: F.mono, marginTop: '0.3rem' },
  };

  return (
    <div style={S.container}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus { border-color: ${C.border} !important; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 900px) {
          .settings-layout { grid-template-columns: 1fr !important; }
          .settings-nav { flex-direction: row !important; flex-wrap: wrap !important; gap: 0.4rem !important; }
          .save-bar { left: 0 !important; padding: 0.8rem 1rem !important; }
        }
        @media (max-width: 600px) {
          .field-row { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* PAGE HEADER */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={S.title}><Icon name="settings" size={24} color={C.primary} />Settings</h1>
        <p style={S.subtitle}>Manage your account, notifications, and property assignment</p>
      </div>

      {/* SETTINGS LAYOUT */}
      <div className="settings-layout" style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* SIDE NAV */}
        <div className="settings-nav" style={{ position: 'sticky', top: '1rem', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {settingsNav.map(item => {
            const isActive = activePanel === item.id;
            return (
              <div key={item.id} onClick={() => setActivePanel(item.id)} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.65rem 0.9rem',
                background: isActive ? 'rgba(44,62,80,0.06)' : C.card,
                border: `1px solid ${isActive ? C.primary : C.border}`,
                borderRadius: '3px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: isActive ? C.primary : TEXT,
                userSelect: 'none',
                fontFamily: F.dm,
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
              }}>
                <Icon name={item.icon} size={14} />
                <span style={{ flex: 1 }}>{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* CONTENT AREA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', animation: 'fadeUp 0.35s ease forwards', opacity: 0 }}>

          {/* PROFILE PANEL */}
          {activePanel === 'profile' && (
            <>
              <Block title="Personal Information">
                <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Field label="First Name">
                    <input type="text" value={firstName} onChange={e => { setFirstName(e.target.value); flagChange(); }} style={inputStyle} />
                  </Field>
                  <Field label="Last Name">
                    <input type="text" value={lastName} onChange={e => { setLastName(e.target.value); flagChange(); }} style={inputStyle} />
                  </Field>
                </div>
              </Block>

              <Block title="Contact Information">
                <Field label="Email Address">
                  <input type="email" value={email} onChange={e => { setEmail(e.target.value); flagChange(); }} style={inputStyle} />
                </Field>
                <Field label="Phone Number">
                  <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); flagChange(); }} style={inputStyle} />
                </Field>
              </Block>
            </>
          )}

          {/* ACCOUNT PANEL */}
          {activePanel === 'account' && (
            <Block title="Change Password">
              <Field label="Current Password">
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={inputStyle} />
              </Field>
              <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="New Password">
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} />
                </Field>
                <Field label="Confirm New Password">
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} />
                </Field>
              </div>
              <button onClick={savePassword} disabled={savingPassword} style={{ ...btnPrimary, marginTop: '0.5rem', opacity: savingPassword ? 0.6 : 1 }}>
                {savingPassword ? "Updating..." : "Update Password"}
              </button>
            </Block>
          )}

          {/* NOTIFICATIONS PANEL */}
          {activePanel === 'notifications' && (
            <>
              <Block title="Work Alerts">
                <ToggleRow label="Maintenance Updates" desc="Notify me when new maintenance requests are submitted." value={maintenanceAlerts} onChange={() => { setMaintenanceAlerts(!maintenanceAlerts); flagChange(); }} />
                <ToggleRow label="Complaint Alerts" desc="Notify me when tenants file complaints." value={complaintAlerts} onChange={() => { setComplaintAlerts(!complaintAlerts); flagChange(); }} />
                <ToggleRow label="Message Alerts" desc="Notify me when I receive new messages." value={messageAlerts} onChange={() => { setMessageAlerts(!messageAlerts); flagChange(); }} />
              </Block>

              <Block title="Notification Channels">
                <ToggleRow label="Push Notifications" desc="In-app alerts in your dashboard." value={pushNotif} onChange={() => { setPushNotif(!pushNotif); flagChange(); }} />
                <ToggleRow label="Email Digest" desc={`Daily summary sent to ${email}.`} value={emailDigest} onChange={() => { setEmailDigest(!emailDigest); flagChange(); }} />
              </Block>
            </>
          )}

          {/* PROPERTY PANEL */}
          {activePanel === 'property' && (
            <Block title="Assigned Property">
              <div style={{ padding: '1rem', borderRadius: '3px', background: C.background, border: `1px solid ${C.border}`, marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '6px', background: 'rgba(52,152,219,0.08)', border: '1px solid rgba(52,152,219,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="home" size={20} color={C.blue} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: TEXT }}>Hillbrow Heights</p>
                    <p style={{ fontSize: '0.7rem', color: TEXT, fontFamily: F.mono }}>12 Mutual Road, Hillbrow</p>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                {[
                  { label: 'Total Units', value: '8' },
                  { label: 'Occupied', value: '7' },
                  { label: 'Tenants', value: '7' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '0.8rem', borderRadius: '3px', background: C.background, border: `1px solid ${C.border}`, textAlign: 'center' }}>
                    <p style={{ fontSize: '0.6rem', color: TEXT, fontFamily: F.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 700, color: C.blue, fontFamily: F.bebas, marginTop: '2px' }}>{item.value}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.7rem', color: TEXT, fontFamily: F.mono, marginTop: '1rem', textAlign: 'center' }}>
                Property assignment can only be changed by the landlord.
              </p>
            </Block>
          )}
        </div>
      </div>

      {/* SAVE BAR */}
      <div className="save-bar" style={{
        position: 'fixed',
        bottom: hasChanges ? 0 : '-100px',
        left: 0,
        right: 0,
        background: '#ffffff',
        backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${C.border}`,
        padding: '1rem 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'bottom 0.3s ease',
        zIndex: 50,
      }}>
        <span style={{ fontSize: '0.75rem', color: TEXT, fontFamily: F.mono, letterSpacing: '0.08em' }}>
          You have unsaved changes
        </span>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button onClick={discardChanges} style={btnGhost}>Discard</button>
          <button onClick={saveChanges} style={btnPrimary}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}