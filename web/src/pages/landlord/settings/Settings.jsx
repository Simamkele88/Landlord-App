import { useState } from "react";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import axios from "axios";

const API = "http://localhost:4000";

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
  { id: 'properties', icon: 'home', label: 'Property Defaults' },
  { id: 'payments', icon: 'credit-card', label: 'Payments & Billing' },
  { id: 'privacy', icon: 'shield', label: 'Privacy & Data' },
];

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

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23333' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.75rem center',
  paddingRight: '2rem',
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
      <button onClick={onChange} style={{
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

export default function Settings() {
  useDocumentTitle("Settings");
  const toast = useToast();

  const [activePanel, setActivePanel] = useState('profile');
  const [hasChanges, setHasChanges] = useState(false);

  const [firstName, setFirstName] = useState('Thabo');
  const [lastName, setLastName] = useState('Mokoena');
  const [email, setEmail] = useState('thabo@chihwarentals.co.za');
  const [phone, setPhone] = useState('+27 82 541 3391');
  const [companyName, setCompanyName] = useState('Chihwa Rentals');

  const [rentReminders, setRentReminders] = useState(true);
  const [paymentReceived, setPaymentReceived] = useState(true);
  const [leaseExpiry, setLeaseExpiry] = useState(true);
  const [maintenanceUpdates, setMaintenanceUpdates] = useState(true);
  const [tenantMessages, setTenantMessages] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  const [defaultFrequency, setDefaultFrequency] = useState('monthly');
  const [defaultDueDay, setDefaultDueDay] = useState('1');
  const [gracePeriod, setGracePeriod] = useState('5');
  const [autoLate, setAutoLate] = useState(true);
  const [autoCollections, setAutoCollections] = useState(false);

  const [payoutSchedule, setPayoutSchedule] = useState('instant');
  const [vatRegistered, setVatRegistered] = useState(false);
  const [vatNumber, setVatNumber] = useState('');

  const [showPhone, setShowPhone] = useState(false);
  const [shareData, setShareData] = useState(false);

  const flagChange = () => { if (!hasChanges) setHasChanges(true); };

  const saveChanges = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/landlord/settings`, {
        first_name: firstName,
        last_name: lastName,
        company_name: companyName,
        email: email,
        phone: phone,
        notify_rent_reminders: rentReminders,
        notify_payment_received: paymentReceived,
        notify_lease_expiry: leaseExpiry,
        notify_maintenance_updates: maintenanceUpdates,
        notify_tenant_messages: tenantMessages,
        notify_push: pushNotif,
        notify_email_digest: emailDigest,
        default_payment_frequency: defaultFrequency,
        default_due_day: Number(defaultDueDay),
        grace_period_days: Number(gracePeriod),
        auto_mark_late: autoLate,
        auto_send_collections: autoCollections,
        payout_schedule: payoutSchedule,
        vat_registered: vatRegistered,
        vat_number: vatNumber,
        show_phone_to_tenants: showPhone,
        share_data_contractors: shareData,
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

  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: TEXT, fontFamily: F.bebas, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    subtitle: { fontSize: '0.75rem', color: TEXT, fontFamily: F.mono, marginTop: '0.3rem' },
  };

  return (
    <div style={S.container}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus { border-color: ${C.border} !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
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
        <p style={S.subtitle}>Manage your account, notifications, and preferences</p>
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
                <Field label="Company / Trading Name" hint="Shown on receipts and tenant communications">
                  <input type="text" value={companyName} onChange={e => { setCompanyName(e.target.value); flagChange(); }} style={inputStyle} />
                </Field>
                <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Field label="Email Address">
                    <input type="email" value={email} onChange={e => { setEmail(e.target.value); flagChange(); }} style={inputStyle} />
                  </Field>
                  <Field label="Phone Number">
                    <input type="tel" value={phone} onChange={e => { setPhone(e.target.value); flagChange(); }} style={inputStyle} />
                  </Field>
                </div>
              </Block>
            </>
          )}

          {/* ACCOUNT PANEL */}
          {activePanel === 'account' && (
            <>
              <Block title="Change Password">
                <Field label="Current Password">
                  <input type="password" placeholder="••••••••" onChange={flagChange} style={inputStyle} />
                </Field>
                <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Field label="New Password">
                    <input type="password" placeholder="••••••••" onChange={flagChange} style={inputStyle} />
                  </Field>
                  <Field label="Confirm New Password">
                    <input type="password" placeholder="••••••••" onChange={flagChange} style={inputStyle} />
                  </Field>
                </div>
              </Block>

              <Block title="Two-Factor Authentication">
                <ToggleRow
                  label="SMS Verification"
                  desc="Receive a one-time PIN via SMS when logging in from a new device."
                  value={true}
                  onChange={() => flagChange()}
                />
              </Block>
            </>
          )}

          {/* NOTIFICATIONS PANEL */}
          {activePanel === 'notifications' && (
            <>
              <Block title="Rent & Lease Notifications">
                <ToggleRow label="Rent Payment Reminders" desc="Notify me when a tenant's rent is due or overdue." value={rentReminders} onChange={() => { setRentReminders(!rentReminders); flagChange(); }} />
                <ToggleRow label="Payment Received Alerts" desc="Notify me immediately when a tenant submits payment." value={paymentReceived} onChange={() => { setPaymentReceived(!paymentReceived); flagChange(); }} />
                <ToggleRow label="Lease Expiry Alerts" desc="Notify me 60 and 30 days before a lease expires." value={leaseExpiry} onChange={() => { setLeaseExpiry(!leaseExpiry); flagChange(); }} />
              </Block>

              <Block title="Maintenance & Messages">
                <ToggleRow label="Maintenance Updates" desc="Notify me when a tenant logs a maintenance request." value={maintenanceUpdates} onChange={() => { setMaintenanceUpdates(!maintenanceUpdates); flagChange(); }} />
                <ToggleRow label="Tenant Messages" desc="Notify me when a tenant sends me a message." value={tenantMessages} onChange={() => { setTenantMessages(!tenantMessages); flagChange(); }} />
              </Block>

              <Block title="Notification Channels">
                <ToggleRow label="Push Notifications" desc="In-app alerts in your Chihwa Rentals dashboard." value={pushNotif} onChange={() => { setPushNotif(!pushNotif); flagChange(); }} />
                <ToggleRow label="Email Digest" desc={`Daily summary of activity to ${email}.`} value={emailDigest} onChange={() => { setEmailDigest(!emailDigest); flagChange(); }} />
              </Block>
            </>
          )}

          {/* PROPERTY DEFAULTS PANEL */}
          {activePanel === 'properties' && (
            <>
              <Block title="Lease Defaults">
                <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Field label="Default Payment Frequency">
                    <select value={defaultFrequency} onChange={e => { setDefaultFrequency(e.target.value); flagChange(); }} style={selectStyle}>
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </Field>
                  <Field label="Default Due Day">
                    <input type="number" min="1" max="31" value={defaultDueDay} onChange={e => { setDefaultDueDay(e.target.value); flagChange(); }} style={inputStyle} />
                  </Field>
                </div>
                <Field label="Grace Period (Days)" hint="Days after due date before marking late">
                  <input type="number" min="0" max="30" value={gracePeriod} onChange={e => { setGracePeriod(e.target.value); flagChange(); }} style={inputStyle} />
                </Field>
                <ToggleRow label="Auto-mark as Late" desc="Automatically mark payments as late after the grace period." value={autoLate} onChange={() => { setAutoLate(!autoLate); flagChange(); }} />
                <ToggleRow label="Auto-send to Collections" desc="Automatically escalate to collections after 60 days overdue." value={autoCollections} onChange={() => { setAutoCollections(!autoCollections); flagChange(); }} />
              </Block>
            </>
          )}

          {/* PAYMENTS PANEL */}
          {activePanel === 'payments' && (
            <>
              <Block title="Bank Account">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 0.9rem', background: C.background, border: `1px solid ${C.border}`, borderRadius: '3px' }}>
                  <Icon name="credit-card" size={18} style={{ color: TEXT }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, color: TEXT }}>Capitec Bank</div>
                    <div style={{ fontSize: '0.65rem', fontFamily: F.mono, color: C.green }}>Verified · •••• •••• 3391 · Cheque</div>
                  </div>
                </div>
              </Block>

              <Block title="Payout Schedule">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  {[
                    { value: 'instant', label: 'Instant Payout', sub: 'Withdraw rent manually whenever you choose' },
                    { value: 'weekly', label: 'Weekly Auto-Payout', sub: 'Automatically pay out every Friday' },
                    { value: 'monthly', label: 'Monthly Auto-Payout', sub: 'Automatically pay out on the 1st of each month' },
                  ].map(opt => (
                    <div key={opt.value} onClick={() => { setPayoutSchedule(opt.value); flagChange(); }} style={{
                      display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.75rem 0.9rem',
                      background: payoutSchedule === opt.value ? 'rgba(44,62,80,0.06)' : C.background,
                      border: `1px solid ${payoutSchedule === opt.value ? C.primary : C.border}`,
                      borderRadius: '3px', cursor: 'pointer', userSelect: 'none',
                    }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%',
                        border: `2px solid ${payoutSchedule === opt.value ? C.primary : C.border}`,
                        flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {payoutSchedule === opt.value && <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.primary }} />}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.82rem', fontWeight: 500, color: TEXT }}>{opt.label}</div>
                        <div style={{ fontSize: '0.65rem', color: TEXT, fontFamily: F.mono }}>{opt.sub}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Block>

              <Block title="VAT & Tax">
                <ToggleRow label="VAT Registered" desc="Enable if you are a registered VAT vendor." value={vatRegistered} onChange={() => { setVatRegistered(!vatRegistered); flagChange(); }} />
                {vatRegistered && (
                  <div style={{ marginTop: '1rem' }}>
                    <Field label="VAT Number">
                      <input type="text" value={vatNumber} onChange={e => { setVatNumber(e.target.value); flagChange(); }} placeholder="e.g. 4123456789" style={inputStyle} />
                    </Field>
                  </div>
                )}
              </Block>
            </>
          )}

          {/* PRIVACY PANEL */}
          {activePanel === 'privacy' && (
            <>
              <Block title="Profile Visibility">
                <ToggleRow label="Show Phone Number" desc="Display your phone number to tenants." value={showPhone} onChange={() => { setShowPhone(!showPhone); flagChange(); }} />
                <ToggleRow label="Share Data with Contractors" desc="Allow maintenance contractors to see your contact details." value={shareData} onChange={() => { setShareData(!shareData); flagChange(); }} />
              </Block>

              <Block title="POPIA & Data Rights">
                <div style={{ fontSize: '0.78rem', color: TEXT, lineHeight: 1.7, marginBottom: '1rem' }}>
                  Chihwa Rentals processes your personal data in compliance with the Protection of Personal Information Act (POPIA).
                </div>
                <button style={{ ...btnGhost, width: 'fit-content' }}>
                  <Icon name="download" size={12} /> Download My Data
                </button>
              </Block>
            </>
          )}

        </div>
      </div>

      {/* SAVE BAR */}
      <div style={{
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