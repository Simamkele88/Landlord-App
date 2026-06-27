/* eslint-disable no-unused-vars */
// CARETAKER SETTINGS PAGE 
import { useState } from "react";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";

const inputStyle = {
  width: '100%', fontSize: '0.82rem', padding: '0.6rem 0.9rem', borderRadius: '3px',
  background: C.black, border: `1px solid ${C.border}`, color: C.white,
  fontFamily: F.dm, outline: 'none',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.75rem center', paddingRight: '2rem',
};

const btnPrimary = {
  background: C.gold, color: C.black, border: 'none',
  padding: '0.65rem 1.8rem', fontSize: '0.8rem', fontWeight: 700,
  fontFamily: F.dm, letterSpacing: '0.06em', textTransform: 'uppercase',
  borderRadius: '2px', cursor: 'pointer',
};

const btnGhost = {
  background: 'transparent', color: 'rgba(245,240,232,0.5)',
  border: `1px solid ${C.border}`, padding: '0.65rem 1.2rem',
  fontSize: '0.8rem', fontWeight: 500, fontFamily: F.dm,
  letterSpacing: '0.06em', textTransform: 'uppercase',
  borderRadius: '2px', cursor: 'pointer',
};

function Field({ label, hint, children, optional }) {
  return (
    <div style={{ marginBottom: '1.2rem' }}>
      <label style={{ display: 'block', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem', color: 'rgba(245,240,232,0.5)', fontFamily: F.mono }}>
        {label}
        {optional && <span style={{ color: 'rgba(245,240,232,0.25)', fontWeight: 400, textTransform: 'none', marginLeft: '0.3rem' }}>(Optional)</span>}
      </label>
      {hint && <span style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, marginBottom: '0.4rem', display: 'block' }}>{hint}</span>}
      {children}
    </div>
  );
}

function Block({ title, children }) {
  return (
    <div style={{ background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '5px', padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', paddingBottom: '0.7rem', borderBottom: `1px solid ${C.border}` }}>
        <span style={{ fontFamily: F.mono, fontSize: '0.62rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)' }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ flex: 1, paddingRight: '1rem' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 500, color: C.white, marginBottom: '0.1rem' }}>{label}</div>
        <div style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.3)', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: 42, height: 22, borderRadius: '11px', background: value ? C.greenLight : C.border,
        position: 'relative', cursor: 'pointer', flexShrink: 0, border: 'none', transition: 'background 0.25s',
      }}>
        <div style={{ position: 'absolute', top: 3, left: value ? 23 : 3, width: 16, height: 16, borderRadius: '50%', background: C.white, transition: 'left 0.25s' }} />
      </button>
    </div>
  );
}

const settingsNav = [
  { id: 'profile', icon: 'user', label: 'Profile' },
  { id: 'account', icon: 'lock', label: 'Account & Security' },
  { id: 'notifications', icon: 'bell', label: 'Notifications' },
  { id: 'property', icon: 'home', label: 'Property Info' },
];

export default function CaretakerSettings() {
  useDocumentTitle("Settings");
  const toast = useToast();

  const [activePanel, setActivePanel] = useState('profile');
  const [hasChanges, setHasChanges] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const [firstName, setFirstName] = useState('David');
  const [lastName, setLastName] = useState('Nkosi');
  const [email, setEmail] = useState('david@chihwarentals.co.za');
  const [phone, setPhone] = useState('+27 83 456 7890');

  const [maintenanceAlerts, setMaintenanceAlerts] = useState(true);
  const [complaintAlerts, setComplaintAlerts] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const flagChange = () => { if (!hasChanges) setHasChanges(true); };

  const saveChanges = () => {
    setHasChanges(false);
    setShowToast(true);
    toast.success("Settings saved successfully.");
    setTimeout(() => setShowToast(false), 2500);
  };

  const discardChanges = () => setHasChanges(false);

  const S = {
    container: { maxWidth: 1000, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    subtitle: { fontSize: '0.75rem', color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, marginTop: '0.3rem' },
  };

  return (
    <div style={S.container}>
      <style>{`input:focus, textarea:focus, select:focus { border-color: ${C.borderFocus} !important; } @media (max-width: 768px) { .settings-layout { grid-template-columns: 1fr !important; } }`}</style>

      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={S.title}><Icon name="settings" size={24} color={C.blue} />Settings</h1>
        <p style={S.subtitle}>Manage your account, notifications, and preferences</p>
      </div>

      <div className="settings-layout" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* SIDE NAV */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', position: 'sticky', top: '1rem' }}>
          {settingsNav.map(item => {
            const isActive = activePanel === item.id;
            return (
              <div key={item.id} onClick={() => setActivePanel(item.id)} style={{
                display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.9rem',
                background: isActive ? 'rgba(58,143,212,0.06)' : C.muted2,
                border: `1px solid ${isActive ? C.blue : C.border}`, borderRadius: '3px',
                cursor: 'pointer', fontSize: '0.8rem', color: isActive ? C.blue : 'rgba(245,240,232,0.5)',
                userSelect: 'none', fontFamily: F.dm, fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
              }}>
                <Icon name={item.icon} size={14} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </div>

        {/* CONTENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          
          {/* PROFILE */}
          {activePanel === 'profile' && (
            <>
              <Block title="Profile Photo">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1rem' }}>
                  <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(58,143,212,0.12)', color: C.blue, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.bebas, fontSize: '1.4rem', flexShrink: 0, border: '2px solid rgba(58,143,212,0.2)' }}>
                    {firstName[0]}{lastName[0]}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <button onClick={flagChange} style={{ background: C.blue, color: C.white, padding: '0.4rem 0.9rem', fontFamily: F.dm, fontWeight: 600, fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', borderRadius: '2px', border: 'none', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Icon name="camera" size={12} /> Upload Photo
                    </button>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.15)', fontFamily: F.mono }}>JPG, PNG · Max 5MB</div>
                  </div>
                </div>
              </Block>

              <Block title="Personal Information">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                  <div style={{ position: 'relative' }}>
                    <Icon name="mail" size={14} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.2)' }} />
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); flagChange(); }} style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
                  </div>
                </Field>
                <Field label="Phone Number">
                  <div style={{ position: 'relative' }}>
                    <Icon name="phone" size={14} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.2)' }} />
                    <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); flagChange(); }} style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
                  </div>
                </Field>
              </Block>
            </>
          )}

          {/* ACCOUNT & SECURITY  */}
          {activePanel === 'account' && (
            <Block title="Change Password">
              <Field label="Current Password">
                <div style={{ position: 'relative' }}>
                  <Icon name="lock" size={14} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.2)' }} />
                  <input type="password" value={currentPassword} onChange={e => { setCurrentPassword(e.target.value); flagChange(); }} placeholder="••••••••" style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
                </div>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <Field label="New Password">
                  <input type="password" value={newPassword} onChange={e => { setNewPassword(e.target.value); flagChange(); }} placeholder="••••••••" style={inputStyle} />
                </Field>
                <Field label="Confirm Password">
                  <input type="password" value={confirmPassword} onChange={e => { setConfirmPassword(e.target.value); flagChange(); }} placeholder="••••••••" style={inputStyle} />
                </Field>
              </div>
              <button onClick={() => { toast.success("Password updated!"); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} style={{ ...btnPrimary, marginTop: '0.5rem' }}>
                Update Password
              </button>
            </Block>
          )}

          {/* NOTIFICATIONS */}
          {activePanel === 'notifications' && (
            <>
              <Block title="Work Alerts">
                <ToggleRow label="Maintenance Updates" desc="Notify me when new maintenance requests are submitted." value={maintenanceAlerts} onChange={() => { setMaintenanceAlerts(!maintenanceAlerts); flagChange(); }} />
                <div style={{ borderBottom: `1px solid ${C.border}` }} />
                <ToggleRow label="Complaint Alerts" desc="Notify me when tenants file complaints." value={complaintAlerts} onChange={() => { setComplaintAlerts(!complaintAlerts); flagChange(); }} />
                <div style={{ borderBottom: `1px solid ${C.border}` }} />
                <ToggleRow label="Message Alerts" desc="Notify me when I receive new messages." value={messageAlerts} onChange={() => { setMessageAlerts(!messageAlerts); flagChange(); }} />
              </Block>

              <Block title="Channels">
                <ToggleRow label="Push Notifications" desc="In-app alerts in your dashboard." value={pushNotif} onChange={() => { setPushNotif(!pushNotif); flagChange(); }} />
                <div style={{ borderBottom: `1px solid ${C.border}` }} />
                <ToggleRow label="Email Digest" desc={`Daily summary sent to ${email}.`} value={emailDigest} onChange={() => { setEmailDigest(!emailDigest); flagChange(); }} />
              </Block>
            </>
          )}

          {/* PROPERTY INFO */}
          {activePanel === 'property' && (
            <Block title="Assigned Property">
              <div style={{ padding: '1rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <div style={{ width: 44, height: 44, borderRadius: '6px', background: 'rgba(58,143,212,0.08)', border: '1px solid rgba(58,143,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="home" size={20} color={C.blue} />
                  </div>
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: C.white }}>Hillbrow Heights</p>
                    <p style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.35)', fontFamily: F.mono }}>12 Mutual Road, Hillbrow</p>
                  </div>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                {[
                  { label: 'Total Units', value: '8' },
                  { label: 'Occupied', value: '7' },
                  { label: 'Tenants', value: '7' },
                ].map(item => (
                  <div key={item.label} style={{ padding: '0.8rem', borderRadius: '3px', background: C.black, border: `1px solid ${C.border}`, textAlign: 'center' }}>
                    <p style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                    <p style={{ fontSize: '1.2rem', fontWeight: 700, color: C.blue, fontFamily: F.bebas, marginTop: '2px' }}>{item.value}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.7rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono, marginTop: '1rem', textAlign: 'center' }}>
                Property assignment can only be changed by the landlord.
              </p>
            </Block>
          )}
        </div>
      </div>

      {/* SAVE BAR */}
      <div style={{
        position: 'fixed', bottom: hasChanges ? 0 : '-100px', left: 0, right: 0,
        background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${C.border}`, padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'bottom 0.3s ease', zIndex: 50,
      }}>
        <span style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.4)', fontFamily: F.mono, letterSpacing: '0.08em' }}>You have unsaved changes</span>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button onClick={discardChanges} style={btnGhost}>Discard</button>
          <button onClick={saveChanges} style={btnPrimary}>Save Changes</button>
        </div>
      </div>

      {/* TOAST */}
      <div style={{
        position: 'fixed', bottom: '5rem', right: '2rem',
        background: C.greenLight, color: C.black, padding: '0.65rem 1.3rem',
        borderRadius: '3px', fontFamily: F.mono, fontSize: '0.68rem',
        letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600,
        opacity: showToast ? 1 : 0, pointerEvents: 'none', zIndex: 200,
        transition: 'opacity 0.3s', display: 'flex', alignItems: 'center', gap: '0.4rem',
      }}>
        <Icon name="check" size={13} /> Changes Saved
      </div>
    </div>
  );
}