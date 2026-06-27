/* eslint-disable no-empty */
/* eslint-disable no-unused-vars */
// LANDLORD SETTINGS PAGE 
import { useState, useEffect } from "react";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";
import axios from "axios";

const API = "http://localhost:4000";


const settingsNav = [
  { id: 'profile', icon: 'user', label: 'Profile' },
  { id: 'account', icon: 'lock', label: 'Account & Security' },
  { id: 'notifications', icon: 'bell', label: 'Notifications' },
  { id: 'reliability', icon: 'star', label: 'Reliability Scoring' },  
  { id: 'properties', icon: 'home', label: 'Property Defaults' },
  { id: 'payments', icon: 'credit-card', label: 'Payments & Billing', badge: true },
  { id: 'privacy', icon: 'shield', label: 'Privacy & Data' },
  { id: 'danger', icon: 'warning', label: 'Danger Zone' },
];


const inputStyle = {
  width: '100%', fontSize: '0.82rem', padding: '0.6rem 0.9rem', borderRadius: '3px',
  background: C.black, border: `1px solid ${C.border}`, color: C.white,
  fontFamily: F.dm, outline: 'none',
};

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 0.75rem center',
  paddingRight: '2rem',
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
      <label style={{
        display: 'block', fontSize: '0.65rem', fontWeight: 600,
        letterSpacing: '0.06em', textTransform: 'uppercase',
        marginBottom: '0.4rem', color: 'rgba(245,240,232,0.5)',
        fontFamily: F.mono,
      }}>
        {label}
        {optional && <span style={{ color: 'rgba(245,240,232,0.25)', fontWeight: 400, textTransform: 'none', marginLeft: '0.3rem' }}>(Optional)</span>}
      </label>
      {hint && <span style={{ fontSize: '0.62rem', color: 'rgba(245,240,232,0.2)', fontFamily: F.mono, marginBottom: '0.4rem', display: 'block' }}>{hint}</span>}
      {children}
    </div>
  );
}

function Block({ title, action, children }) {
  return (
    <div style={{
      background: C.muted2, border: `1px solid ${C.border}`,
      borderRadius: '5px', padding: '1.5rem',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '1.2rem', paddingBottom: '0.7rem',
        borderBottom: `1px solid ${C.border}`,
      }}>
        <span style={{
          fontFamily: F.mono, fontSize: '0.62rem', letterSpacing: '0.14em',
          textTransform: 'uppercase', color: 'rgba(245,240,232,0.3)',
        }}>
          {title}
        </span>
        {action && (
          <span style={{
            fontFamily: F.mono, fontSize: '0.6rem', letterSpacing: '0.08em',
            textTransform: 'uppercase', color: C.gold, cursor: 'pointer',
          }}>
            {action}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, value, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.85rem 0', borderBottom: `1px solid ${C.border}`,
    }}>
      <div style={{ flex: 1, paddingRight: '1rem' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 500, color: C.white, marginBottom: '0.1rem' }}>{label}</div>
        <div style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.3)', lineHeight: 1.5 }}>{desc}</div>
      </div>
      <button onClick={onChange} style={{
        width: 42, height: 22, borderRadius: '11px', background: value ? C.greenLight : C.border,
        position: 'relative', cursor: 'pointer', flexShrink: 0, border: 'none',
        transition: 'background 0.25s',
      }}>
        <div style={{
          position: 'absolute', top: 3, left: value ? 23 : 3, width: 16, height: 16,
          borderRadius: '50%', background: C.white, transition: 'left 0.25s',
        }} />
      </button>
    </div>
  );
}

function RadioGroup({ options, value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
      {options.map((opt, i) => (
        <div key={i} onClick={() => onChange(opt.value)} style={{
          display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.75rem 0.9rem',
          background: value === opt.value ? 'rgba(232,160,18,0.04)' : C.black,
          border: `1px solid ${value === opt.value ? C.gold : C.border}`,
          borderRadius: '3px', cursor: 'pointer', userSelect: 'none',
        }}>
          <div style={{
            width: 16, height: 16, borderRadius: '50%',
            border: `2px solid ${value === opt.value ? C.gold : C.border}`,
            flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {value === opt.value && <div style={{ width: 7, height: 7, borderRadius: '50%', background: C.gold }} />}
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 500, color: C.white }}>{opt.label}</div>
            <div style={{ fontSize: '0.65rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono }}>{opt.sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}


export default function Settings() {
  useDocumentTitle("Settings");
  const toast = useToast();

  const [activePanel, setActivePanel] = useState('profile');
  const [hasChanges, setHasChanges] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [firstName, setFirstName] = useState('Thabo');
  const [lastName, setLastName] = useState('Mokoena');
  const [email, setEmail] = useState('thabo@chihwarentals.co.za');
  const [phone, setPhone] = useState('+27 82 541 3391');
  const [companyName, setCompanyName] = useState('Chihwa Rentals');
  const [idNumber, setIdNumber] = useState('8302155391083');
  const [rentReminders, setRentReminders] = useState(true);
  const [paymentReceived, setPaymentReceived] = useState(true);
  const [leaseExpiry, setLeaseExpiry] = useState(true);
  const [maintenanceUpdates, setMaintenanceUpdates] = useState(true);
  const [tenantMessages, setTenantMessages] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [marketingNotif, setMarketingNotif] = useState(false);
  const [defaultFrequency, setDefaultFrequency] = useState('monthly');
  const [defaultDueDay, setDefaultDueDay] = useState('1');
  const [defaultDeposit, setDefaultDeposit] = useState('rent');
  const [gracePeriod, setGracePeriod] = useState('5');
  const [autoLate, setAutoLate] = useState(true);
  const [autoCollections, setAutoCollections] = useState(false);
  const [payoutSchedule, setPayoutSchedule] = useState('instant');
  const [vatRegistered, setVatRegistered] = useState(false);
  const [vatNumber, setVatNumber] = useState('');
  const [showPhone, setShowPhone] = useState(false);
  const [shareData, setShareData] = useState(false);
  const [smsAuth, setSmsAuth] = useState(true);
  const [paymentWeight, setPaymentWeight] = useState(40);
  const [complaintsWeight, setComplaintsWeight] = useState(25);
  const [leaseWeight, setLeaseWeight] = useState(15);
  const [maintenanceWeight, setMaintenanceWeight] = useState(10);
  const [tenureWeight, setTenureWeight] = useState(10);

  const [reliableThreshold, setReliableThreshold] = useState(80);
  const [moderateThreshold, setModerateThreshold] = useState(50);
  const [highRiskThreshold, setHighRiskThreshold] = useState(30);

  const [escalateLatePenalty, setEscalateLatePenalty] = useState(true);
  const [doubleUpheldComplaints, setDoubleUpheldComplaints] = useState(true);
  const [instantDemotionEviction, setInstantDemotionEviction] = useState(true);
  const [includePastTenants, setIncludePastTenants] = useState(false);

  const totalWeight = paymentWeight + complaintsWeight + leaseWeight + maintenanceWeight + tenureWeight;

  useEffect(() => {
    async function loadSettings() {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API}/landlord/settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const s = data.settings;
        const p = data.profile;
        const u = data.user;
        
        if (p) {
          setFirstName(p.first_name || '');
          setLastName(p.last_name || '');
          setCompanyName(p.company_name || '');
        }
        if (u) {
          setEmail(u.email || '');
          setPhone(u.phone || '');
        }
        if (s) {
          setRentReminders(s.notify_rent_reminders);
          setPaymentReceived(s.notify_payment_received);
          setLeaseExpiry(s.notify_lease_expiry);
          setMaintenanceUpdates(s.notify_maintenance_updates);
          setTenantMessages(s.notify_tenant_messages);
          setPushNotif(s.notify_push);
          setEmailDigest(s.notify_email_digest);
          setMarketingNotif(s.notify_marketing);
          setDefaultFrequency(s.default_payment_frequency || 'monthly');
          setDefaultDueDay(String(s.default_due_day || 1));
          setDefaultDeposit(s.default_deposit_type || 'rent');
          setGracePeriod(String(s.grace_period_days || 5));
          setAutoLate(s.auto_mark_late);
          setAutoCollections(s.auto_send_collections);
          setPayoutSchedule(s.payout_schedule || 'instant');
          setVatRegistered(s.vat_registered);
          setVatNumber(s.vat_number || '');
          setShowPhone(s.show_phone_to_tenants);
          setShareData(s.share_data_contractors);
          setPaymentWeight(s.score_payment_weight || 40);
          setComplaintsWeight(s.score_complaints_weight || 25);
          setLeaseWeight(s.score_lease_weight || 15);
          setMaintenanceWeight(s.score_maintenance_weight || 10);
          setTenureWeight(s.score_tenure_weight || 10);
          setReliableThreshold(s.score_reliable_threshold || 80);
          setModerateThreshold(s.score_moderate_threshold || 50);
          setHighRiskThreshold(s.score_high_risk_threshold || 30);
          setEscalateLatePenalty(s.score_escalate_late_penalty);
          setDoubleUpheldComplaints(s.score_double_upheld_complaints);
          setInstantDemotionEviction(s.score_instant_demotion_eviction);
          setIncludePastTenants(s.score_include_past_tenants);
        }
      } catch (err) {}
    }
    loadSettings();
  }, []);

  function calculatePreviewScore(type) {

    if (type === 'reliable') {
      return Math.min(100, Math.round(
        (paymentWeight * 1.0) +     
        (complaintsWeight * 1.0) +    
        (leaseWeight * 1.0) +         
        (maintenanceWeight * 1.0) +  
        (tenureWeight * 1.0)         
      ));
    }

    return Math.max(0, Math.round(
      (paymentWeight * 0.15) +       
      (complaintsWeight * 0.1) +      
      (leaseWeight * 0.2) +           
      (maintenanceWeight * 0.3) +     
      (tenureWeight * 0.1)            
    ));
  }

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
        notify_marketing: marketingNotif,
        
      
        default_payment_frequency: defaultFrequency,
        default_due_day: Number(defaultDueDay),
        default_deposit_type: defaultDeposit,
        grace_period_days: Number(gracePeriod),
        auto_mark_late: autoLate,
        auto_send_collections: autoCollections,
        
      
        payout_schedule: payoutSchedule,
        vat_registered: vatRegistered,
        vat_number: vatNumber,
        
      
        show_phone_to_tenants: showPhone,
        share_data_contractors: shareData,
        
      
        score_payment_weight: paymentWeight,
        score_complaints_weight: complaintsWeight,
        score_lease_weight: leaseWeight,
        score_maintenance_weight: maintenanceWeight,
        score_tenure_weight: tenureWeight,
        score_reliable_threshold: reliableThreshold,
        score_moderate_threshold: moderateThreshold,
        score_high_risk_threshold: highRiskThreshold,
        score_escalate_late_penalty: escalateLatePenalty,
        score_double_upheld_complaints: doubleUpheldComplaints,
        score_instant_demotion_eviction: instantDemotionEviction,
        score_include_past_tenants: includePastTenants,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setHasChanges(false);
      setShowToast(true);
      toast.success("Settings saved successfully.");
      setTimeout(() => setShowToast(false), 2500);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save settings.");
    }
  };

  const discardChanges = () => setHasChanges(false);


  const S = {
    container: { maxWidth: 1280, padding: '1.5rem 1rem 3rem', margin: '-1rem -1.8rem' },
    title: { fontSize: '1.8rem', fontWeight: 700, color: C.white, fontFamily: F.bebas, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '0.5rem' },
    subtitle: { fontSize: '0.75rem', color: 'rgba(245,240,232,0.35)', fontFamily: F.mono, marginTop: '0.3rem' },
  };

  return (
    <div style={S.container}>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; }
        input:focus, textarea:focus, select:focus { border-color: ${C.borderFocus} !important; }
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
        <h1 style={S.title}><Icon name="settings" size={24} color={C.gold} />Settings</h1>
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
                display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.65rem 0.9rem',
                background: isActive ? 'rgba(232,160,18,0.06)' : C.muted2,
                border: `1px solid ${isActive ? C.gold : C.border}`, borderRadius: '3px',
                cursor: 'pointer', fontSize: '0.8rem', color: isActive ? C.gold : 'rgba(245,240,232,0.5)',
                userSelect: 'none', fontFamily: F.dm, fontWeight: isActive ? 600 : 400,
                transition: 'all 0.15s',
              }}>
                <Icon name={item.icon} size={14} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge && (
                  <span style={{
                    fontSize: '0.55rem', background: C.redLight, color: C.white,
                    padding: '0.1rem 0.3rem', borderRadius: '8px', fontFamily: F.mono,
                    fontWeight: 700,
                  }}>!</span>
                )}
              </div>
            );
          })}
        </div>

        {/* CONTENT AREA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', animation: 'fadeUp 0.35s ease forwards', opacity: 0 }}>
          
          {/* PROFILE PANEL */}
          {activePanel === 'profile' && (
            <>
              <Block title="Profile Photo">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1.2rem' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'rgba(232,160,18,0.12)', color: C.gold,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: F.bebas, fontSize: '1.4rem', flexShrink: 0,
                    border: '2px solid rgba(232,160,18,0.2)',
                  }}>
                    {firstName[0]}{lastName[0]}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    <button onClick={flagChange} style={{
                      background: C.gold, color: C.black, padding: '0.4rem 0.9rem',
                      fontFamily: F.dm, fontWeight: 600, fontSize: '0.7rem',
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                      cursor: 'pointer', borderRadius: '2px', border: 'none',
                      display: 'flex', alignItems: 'center', gap: '0.3rem',
                    }}>
                      <Icon name="camera" size={12} /> Upload New Photo
                    </button>
                    <button onClick={flagChange} style={{
                      background: 'transparent', color: 'rgba(245,240,232,0.3)',
                      padding: '0.4rem 0.9rem', fontFamily: F.dm, fontWeight: 600,
                      fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase',
                      cursor: 'pointer', borderRadius: '2px', border: `1px solid ${C.border}`,
                    }}>Remove Photo</button>
                    <div style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.15)', fontFamily: F.mono, marginTop: '0.1rem' }}>
                      JPG, PNG · Max 5MB
                    </div>
                  </div>
                </div>
              </Block>

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
                <Field label="SA ID Number" hint="Required for lease agreements and POPIA compliance">
                  <div style={{ position: 'relative' }}>
                    <Icon name="id-card" size={14} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.2)' }} />
                    <input type="text" value={idNumber} onChange={e => { setIdNumber(e.target.value); flagChange(); }} style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
                  </div>
                </Field>
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

          {/* ACCOUNT PANEL*/}
          {activePanel === 'account' && (
            <>
              <Block title="Change Password">
                <Field label="Current Password">
                  <div style={{ position: 'relative' }}>
                    <Icon name="lock" size={14} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(245,240,232,0.2)' }} />
                    <input type="password" placeholder="••••••••" onChange={flagChange} style={{ ...inputStyle, paddingLeft: '2.5rem' }} />
                  </div>
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
                  value={smsAuth} onChange={() => { setSmsAuth(!smsAuth); flagChange(); }}
                />
              </Block>

              <Block title="Active Sessions" action="Sign Out All">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 0.9rem', background: C.black, border: `1px solid ${C.border}`, borderRadius: '3px', marginBottom: '0.4rem' }}>
                  <Icon name="globe" size={16} style={{ color: 'rgba(245,240,232,0.3)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, color: C.white }}>Chrome · Windows 11</div>
                    <div style={{ fontSize: '0.65rem', fontFamily: F.mono, color: C.greenLight }}>Active now · Johannesburg, ZA</div>
                  </div>
                  <span style={{ fontSize: '0.6rem', color: 'rgba(245,240,232,0.15)', fontFamily: F.mono }}>This device</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 0.9rem', background: C.black, border: `1px solid ${C.border}`, borderRadius: '3px' }}>
                  <Icon name="smartphone" size={16} style={{ color: 'rgba(245,240,232,0.3)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, color: C.white }}>Safari · iPhone 15</div>
                    <div style={{ fontSize: '0.65rem', fontFamily: F.mono, color: 'rgba(245,240,232,0.2)' }}>Last active 2hr ago · Midrand, ZA</div>
                  </div>
                  <button style={{
                    background: 'rgba(224,90,74,0.08)', color: C.redLight,
                    padding: '0.35rem 0.8rem', fontFamily: F.dm, fontWeight: 600,
                    fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase',
                    cursor: 'pointer', borderRadius: '2px', border: '1px solid rgba(224,90,74,0.2)',
                  }}>Sign Out</button>
                </div>
              </Block>
            </>
          )}

          {/* NOTIFICATIONS PANEL */}
          {activePanel === 'notifications' && (
            <>
              <Block title="Rent & Lease Notifications">
                <ToggleRow label="Rent Payment Reminders" desc="Notify me when a tenant's rent is due or overdue." value={rentReminders} onChange={() => { setRentReminders(!rentReminders); flagChange(); }} />
                <div style={{ borderBottom: `1px solid ${C.border}` }} />
                <ToggleRow label="Payment Received Alerts" desc="Notify me immediately when a tenant submits payment." value={paymentReceived} onChange={() => { setPaymentReceived(!paymentReceived); flagChange(); }} />
                <div style={{ borderBottom: `1px solid ${C.border}` }} />
                <ToggleRow label="Lease Expiry Alerts" desc="Notify me 60 and 30 days before a lease expires." value={leaseExpiry} onChange={() => { setLeaseExpiry(!leaseExpiry); flagChange(); }} />
              </Block>

              <Block title="Maintenance & Messages">
                <ToggleRow label="Maintenance Updates" desc="Notify me when a tenant logs a maintenance request." value={maintenanceUpdates} onChange={() => { setMaintenanceUpdates(!maintenanceUpdates); flagChange(); }} />
                <div style={{ borderBottom: `1px solid ${C.border}` }} />
                <ToggleRow label="Tenant Messages" desc="Notify me when a tenant sends me a message." value={tenantMessages} onChange={() => { setTenantMessages(!tenantMessages); flagChange(); }} />
              </Block>

              <Block title="Notification Channels">
                <ToggleRow label="Push Notifications" desc="In-app alerts in your Chihwa Rentals dashboard." value={pushNotif} onChange={() => { setPushNotif(!pushNotif); flagChange(); }} />
                <div style={{ borderBottom: `1px solid ${C.border}` }} />
                <ToggleRow label="Email Digest" desc={`Daily summary of activity to ${email}.`} value={emailDigest} onChange={() => { setEmailDigest(!emailDigest); flagChange(); }} />
                <div style={{ borderBottom: `1px solid ${C.border}` }} />
                <ToggleRow label="Platform Updates & Tips" desc="Product updates, feature announcements, and tips for landlords." value={marketingNotif} onChange={() => { setMarketingNotif(!marketingNotif); flagChange(); }} />
              </Block>
            </>
          )}

          {/* PROPERTY DEFAULTS PANEL */}
          {activePanel === 'properties' && (
            <>
              <Block title="Lease Defaults" action="These apply to new leases only">
                <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Field label="Default Payment Frequency">
                    <select value={defaultFrequency} onChange={e => { setDefaultFrequency(e.target.value); flagChange(); }} style={selectStyle}>
                      <option value="monthly">Monthly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </Field>
                  <Field label="Default Due Day" hint="Day of the month rent is due">
                    <input type="number" min="1" max="31" value={defaultDueDay} onChange={e => { setDefaultDueDay(e.target.value); flagChange(); }} style={inputStyle} />
                  </Field>
                </div>
                <Field label="Default Deposit" hint="How much deposit to collect upfront">
                  <select value={defaultDeposit} onChange={e => { setDefaultDeposit(e.target.value); flagChange(); }} style={selectStyle}>
                    <option value="rent">One month's rent</option>
                    <option value="double">Two months' rent</option>
                    <option value="custom">Custom amount</option>
                  </select>
                </Field>
              </Block>

              <Block title="Late Payment Rules">
                <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <Field label="Grace Period (Days)" hint="Days after due date before marking late">
                    <input type="number" min="0" max="30" value={gracePeriod} onChange={e => { setGracePeriod(e.target.value); flagChange(); }} style={inputStyle} />
                  </Field>
                </div>
                <ToggleRow label="Auto-mark as Late" desc="Automatically mark payments as late after the grace period." value={autoLate} onChange={() => { setAutoLate(!autoLate); flagChange(); }} />
                <div style={{ borderBottom: `1px solid ${C.border}` }} />
                <ToggleRow label="Auto-send to Collections" desc="Automatically escalate to collections after 60 days overdue." value={autoCollections} onChange={() => { setAutoCollections(!autoCollections); flagChange(); }} />
              </Block>
            </>
          )}

          {/* PAYMENTS PANEL */}
          {activePanel === 'payments' && (
            <>
              <Block title="Bank Account" action="Change Account">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.8rem 0.9rem', background: C.black, border: `1px solid ${C.border}`, borderRadius: '3px' }}>
                  <Icon name="credit-card" size={18} style={{ color: 'rgba(245,240,232,0.3)' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, color: C.white }}>Capitec Bank</div>
                    <div style={{ fontSize: '0.65rem', fontFamily: F.mono, color: C.greenLight }}>Verified · •••• •••• 3391 · Cheque</div>
                  </div>
                  <button style={{
                    background: 'transparent', color: 'rgba(245,240,232,0.3)',
                    padding: '0.35rem 0.8rem', fontFamily: F.dm, fontWeight: 600,
                    fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase',
                    cursor: 'pointer', borderRadius: '2px', border: `1px solid ${C.border}`,
                  }}>Edit</button>
                </div>
                <div style={{
                  marginTop: '0.8rem', padding: '0.6rem 0.8rem',
                  background: 'rgba(26,122,74,0.05)', border: '1px solid rgba(76,186,122,0.12)',
                  borderRadius: '3px', fontSize: '0.68rem', color: C.greenLight,
                  fontFamily: F.mono, display: 'flex', alignItems: 'center', gap: '0.4rem',
                }}>
                  <Icon name="check" size={11} /> Bank account verified · Payouts processed within 2hrs · No fees
                </div>
              </Block>

              <Block title="Payout Schedule">
                <RadioGroup
                  options={[
                    { value: 'instant', label: 'Instant Payout', sub: 'Withdraw rent manually whenever you choose' },
                    { value: 'weekly', label: 'Weekly Auto-Payout', sub: 'Automatically pay out every Friday' },
                    { value: 'monthly', label: 'Monthly Auto-Payout', sub: 'Automatically pay out on the 1st of each month' },
                  ]}
                  value={payoutSchedule}
                  onChange={(v) => { setPayoutSchedule(v); flagChange(); }}
                />
              </Block>

              <Block title="VAT & Tax">
                <ToggleRow label="VAT Registered" desc="Enable if you are a registered VAT vendor. VAT will be applied to invoices." value={vatRegistered} onChange={() => { setVatRegistered(!vatRegistered); flagChange(); }} />
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

          {/* PRIVACY PANEL*/}
          {activePanel === 'privacy' && (
            <>
              <Block title="Profile Visibility">
                <ToggleRow label="Show Phone Number" desc="Display your phone number to tenants on lease agreements and receipts." value={showPhone} onChange={() => { setShowPhone(!showPhone); flagChange(); }} />
                <div style={{ borderBottom: `1px solid ${C.border}` }} />
                <ToggleRow label="Share Data with Contractors" desc="Allow maintenance contractors to see your contact details." value={shareData} onChange={() => { setShareData(!shareData); flagChange(); }} />
              </Block>

              <Block title="POPIA & Data Rights">
                <div style={{ fontSize: '0.78rem', color: 'rgba(245,240,232,0.4)', lineHeight: 1.7, marginBottom: '1rem' }}>
                  Chihwa Rentals processes your personal data in compliance with the Protection of Personal Information Act (POPIA). You have the right to access, correct, or request deletion of your data at any time.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <button style={{
                    background: 'transparent', color: 'rgba(245,240,232,0.3)',
                    padding: '0.5rem 1rem', fontFamily: F.dm, fontWeight: 600,
                    fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase',
                    cursor: 'pointer', borderRadius: '2px', border: `1px solid ${C.border}`,
                    width: 'fit-content', display: 'flex', alignItems: 'center', gap: '0.3rem',
                  }}>
                    <Icon name="download" size={12} /> Download My Data
                  </button>
                  <button style={{
                    background: 'transparent', color: 'rgba(245,240,232,0.3)',
                    padding: '0.5rem 1rem', fontFamily: F.dm, fontWeight: 600,
                    fontSize: '0.7rem', letterSpacing: '0.06em', textTransform: 'uppercase',
                    cursor: 'pointer', borderRadius: '2px', border: `1px solid ${C.border}`,
                    width: 'fit-content', display: 'flex', alignItems: 'center', gap: '0.3rem',
                  }}>
                    <Icon name="mail" size={12} /> Request Data Correction
                  </button>
                </div>
              </Block>
            </>
          )}

          {/* RELIABILITY SCORING PANEL  */}
{activePanel === 'reliability' && (
  <>
    <Block title="Scoring Weights" action="Reset to Defaults">
      <div style={{
        padding: '0.8rem 1rem', borderRadius: '3px',
        background: 'rgba(58,143,212,0.06)', border: '1px solid rgba(58,143,212,0.15)',
        marginBottom: '1.2rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem',
      }}>
        <Icon name="info" size={13} color={C.blue} style={{ flexShrink: 0, marginTop: '2px' }} />
        <p style={{ fontSize: '0.72rem', color: 'rgba(58,143,212,0.7)', lineHeight: 1.5 }}>
          Adjust how much each factor contributes to a tenant's overall reliability score. 
          Weights must add up to 100%. Changes apply to future score calculations only.
        </p>
      </div>

      {/* Rent Payment Weight */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: C.white }}>Rent Payment History</span>
            <p style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, marginTop: '2px' }}>
              On-time, late, and missed payments
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="range" min="0" max="100" value={paymentWeight} 
              onChange={e => { setPaymentWeight(Number(e.target.value)); flagChange(); }}
              style={{ width: 100, accentColor: C.gold }} 
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.gold, fontFamily: F.mono, minWidth: '2.5rem', textAlign: 'right' }}>
              {paymentWeight}%
            </span>
          </div>
        </div>
        <div style={{ width: '100%', height: 3, borderRadius: '2px', background: 'rgba(245,240,232,0.08)', overflow: 'hidden' }}>
          <div style={{ height: 3, borderRadius: '2px', background: C.gold, width: `${paymentWeight}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Complaints Weight */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: C.white }}>Complaints Record</span>
            <p style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, marginTop: '2px' }}>
              Complaints filed against tenant &amp; their outcomes
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="range" min="0" max="100" value={complaintsWeight} 
              onChange={e => { setComplaintsWeight(Number(e.target.value)); flagChange(); }}
              style={{ width: 100, accentColor: C.redLight }} 
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.redLight, fontFamily: F.mono, minWidth: '2.5rem', textAlign: 'right' }}>
              {complaintsWeight}%
            </span>
          </div>
        </div>
        <div style={{ width: '100%', height: 3, borderRadius: '2px', background: 'rgba(245,240,232,0.08)', overflow: 'hidden' }}>
          <div style={{ height: 3, borderRadius: '2px', background: C.redLight, width: `${complaintsWeight}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Lease Compliance Weight */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: C.white }}>Lease Compliance</span>
            <p style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, marginTop: '2px' }}>
              Rule violations, property damage, unauthorised occupants
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="range" min="0" max="100" value={leaseWeight} 
              onChange={e => { setLeaseWeight(Number(e.target.value)); flagChange(); }}
              style={{ width: 100, accentColor: C.purple }} 
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.purple, fontFamily: F.mono, minWidth: '2.5rem', textAlign: 'right' }}>
              {leaseWeight}%
            </span>
          </div>
        </div>
        <div style={{ width: '100%', height: 3, borderRadius: '2px', background: 'rgba(245,240,232,0.08)', overflow: 'hidden' }}>
          <div style={{ height: 3, borderRadius: '2px', background: C.purple, width: `${leaseWeight}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Maintenance Requests Weight */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: C.white }}>Maintenance Responsibility</span>
            <p style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, marginTop: '2px' }}>
              Tenant-caused damage &amp; maintenance request frequency
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="range" min="0" max="100" value={maintenanceWeight} 
              onChange={e => { setMaintenanceWeight(Number(e.target.value)); flagChange(); }}
              style={{ width: 100, accentColor: C.blue }} 
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.blue, fontFamily: F.mono, minWidth: '2.5rem', textAlign: 'right' }}>
              {maintenanceWeight}%
            </span>
          </div>
        </div>
        <div style={{ width: '100%', height: 3, borderRadius: '2px', background: 'rgba(245,240,232,0.08)', overflow: 'hidden' }}>
          <div style={{ height: 3, borderRadius: '2px', background: C.blue, width: `${maintenanceWeight}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Tenure Length Weight */}
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
          <div>
            <span style={{ fontSize: '0.82rem', fontWeight: 500, color: C.white }}>Tenure Length</span>
            <p style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.3)', fontFamily: F.mono, marginTop: '2px' }}>
              Longevity bonus for tenants who stay longer
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input 
              type="range" min="0" max="100" value={tenureWeight} 
              onChange={e => { setTenureWeight(Number(e.target.value)); flagChange(); }}
              style={{ width: 100, accentColor: C.greenLight }} 
            />
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: C.greenLight, fontFamily: F.mono, minWidth: '2.5rem', textAlign: 'right' }}>
              {tenureWeight}%
            </span>
          </div>
        </div>
        <div style={{ width: '100%', height: 3, borderRadius: '2px', background: 'rgba(245,240,232,0.08)', overflow: 'hidden' }}>
          <div style={{ height: 3, borderRadius: '2px', background: C.greenLight, width: `${tenureWeight}%`, transition: 'width 0.3s' }} />
        </div>
      </div>

      {/* Total indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0.8rem 1rem', borderRadius: '3px',
        background: totalWeight === 100 
          ? 'rgba(26,122,74,0.06)' 
          : 'rgba(224,90,74,0.06)',
        border: totalWeight === 100 
          ? '1px solid rgba(76,186,122,0.2)' 
          : '1px solid rgba(224,90,74,0.2)',
      }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 600, color: totalWeight === 100 ? C.greenLight : C.redLight }}>
          Total Weight
        </span>
        <span style={{ 
          fontSize: '1rem', fontWeight: 700, 
          color: totalWeight === 100 ? C.greenLight : C.redLight,
          fontFamily: F.mono 
        }}>
          {totalWeight}%
        </span>
      </div>
      {totalWeight !== 100 && (
        <p style={{ fontSize: '0.62rem', color: C.redLight, fontFamily: F.mono, marginTop: '0.4rem', textAlign: 'right' }}>
          Weights must add up to 100%
        </p>
      )}
    </Block>

    <Block title="Score Thresholds">
      <div className="field-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <Field label="Reliable (min %)" hint="≥ this score = Reliable">
          <input type="number" min="0" max="100" value={reliableThreshold} 
            onChange={e => { setReliableThreshold(Number(e.target.value)); flagChange(); }} 
            style={inputStyle} />
        </Field>
        <Field label="Moderate Risk (min %)" hint="≥ this score = Moderate">
          <input type="number" min="0" max="100" value={moderateThreshold} 
            onChange={e => { setModerateThreshold(Number(e.target.value)); flagChange(); }} 
            style={inputStyle} />
        </Field>
        <Field label="High Risk (below %)" hint="Below this = High Risk">
          <input type="number" min="0" max="100" value={highRiskThreshold} 
            onChange={e => { setHighRiskThreshold(Number(e.target.value)); flagChange(); }} 
            style={inputStyle} />
        </Field>
      </div>

      {/* Visual threshold bar */}
      <div style={{ marginTop: '1rem', position: 'relative', height: 24, borderRadius: '12px', background: 'rgba(245,240,232,0.06)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${highRiskThreshold}%`, background: C.redLight, opacity: 0.3, borderRadius: '12px 0 0 12px' }} />
        <div style={{ position: 'absolute', left: `${highRiskThreshold}%`, top: 0, height: '100%', width: `${moderateThreshold - highRiskThreshold}%`, background: C.gold, opacity: 0.3 }} />
        <div style={{ position: 'absolute', left: `${moderateThreshold}%`, top: 0, height: '100%', width: `${reliableThreshold - moderateThreshold}%`, background: C.blue, opacity: 0.3 }} />
        <div style={{ position: 'absolute', left: `${reliableThreshold}%`, top: 0, height: '100%', width: `${100 - reliableThreshold}%`, background: C.greenLight, opacity: 0.3, borderRadius: '0 12px 12px 0' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem', fontSize: '0.6rem', color: 'rgba(245,240,232,0.25)', fontFamily: F.mono }}>
        <span>0%</span>
        <span style={{ color: C.redLight }}>High Risk</span>
        <span style={{ color: C.gold }}>Moderate</span>
        <span style={{ color: C.blue }}>Good</span>
        <span style={{ color: C.greenLight }}>Reliable</span>
        <span>100%</span>
      </div>
    </Block>

    <Block title="Penalty Multipliers">
      <p style={{ fontSize: '0.72rem', color: 'rgba(245,240,232,0.3)', marginBottom: '1rem', lineHeight: 1.5 }}>
        Configure how severely each negative factor impacts the score.
      </p>

      <ToggleRow 
        label="Escalate penalty for repeated late payments" 
        desc="Each consecutive late payment reduces the score by an additional 10%."
        value={escalateLatePenalty} 
        onChange={() => { setEscalateLatePenalty(!escalateLatePenalty); flagChange(); }} 
      />
      <div style={{ borderBottom: `1px solid ${C.border}` }} />

      <ToggleRow 
        label="Double-weight upheld complaints" 
        desc="Complaints that were upheld or resulted in a verdict count 2× against the tenant."
        value={doubleUpheldComplaints} 
        onChange={() => { setDoubleUpheldComplaints(!doubleUpheldComplaints); flagChange(); }} 
      />
      <div style={{ borderBottom: `1px solid ${C.border}` }} />

      <ToggleRow 
        label="Instant demotion on eviction notice" 
        desc="Tenant drops to 'High Risk' immediately if an eviction notice is issued."
        value={instantDemotionEviction} 
        onChange={() => { setInstantDemotionEviction(!instantDemotionEviction); flagChange(); }} 
      />
      <div style={{ borderBottom: `1px solid ${C.border}` }} />

      <ToggleRow 
        label="Include vacated tenant history" 
        desc="Past tenants' records are considered when scoring current tenants in the same unit."
        value={includePastTenants} 
        onChange={() => { setIncludePastTenants(!includePastTenants); flagChange(); }} 
      />
    </Block>

    <Block title="Score Calculation Preview">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
        <div style={{
          padding: '1rem', borderRadius: '3px',
          background: 'rgba(26,122,74,0.06)', border: '1px solid rgba(76,186,122,0.15)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.6rem', fontWeight: 600, color: C.greenLight, fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Sample Reliable Tenant
          </p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: C.greenLight, fontFamily: F.bebas, letterSpacing: '0.03em' }}>
            {calculatePreviewScore('reliable')}%
          </p>
          <p style={{ fontSize: '0.62rem', color: 'rgba(76,186,122,0.4)', fontFamily: F.mono, marginTop: '0.2rem' }}>
            Always pays on time · No complaints · 2yr+ tenure
          </p>
        </div>
        <div style={{
          padding: '1rem', borderRadius: '3px',
          background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.15)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.6rem', fontWeight: 600, color: C.redLight, fontFamily: F.mono, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            Sample High Risk Tenant
          </p>
          <p style={{ fontSize: '1.6rem', fontWeight: 700, color: C.redLight, fontFamily: F.bebas, letterSpacing: '0.03em' }}>
            {calculatePreviewScore('high_risk')}%
          </p>
          <p style={{ fontSize: '0.62rem', color: 'rgba(224,90,74,0.4)', fontFamily: F.mono, marginTop: '0.2rem' }}>
            3 missed payments · Upheld complaint · &lt;6mo tenure
          </p>
        </div>
      </div>
    </Block>
  </>
)}

          {/* DANGER ZONE PANEL */}
          {activePanel === 'danger' && (
            <div style={{
              background: 'rgba(224,90,74,0.03)', border: '1px solid rgba(224,90,74,0.2)',
              borderRadius: '5px', padding: '1.5rem',
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '1.2rem', paddingBottom: '0.7rem',
                borderBottom: '1px solid rgba(224,90,74,0.12)',
              }}>
                <span style={{
                  fontFamily: F.mono, fontSize: '0.62rem', letterSpacing: '0.14em',
                  textTransform: 'uppercase', color: 'rgba(224,90,74,0.5)',
                }}>
                  Danger Zone
                </span>
              </div>
              {[
                { icon: 'pause', label: 'Pause Account', desc: 'Temporarily hide your properties and stop receiving tenant applications. You can reactivate anytime.', action: 'Pause Account' },
                { icon: 'download', label: 'Export All Data', desc: 'Download a full copy of your account data, tenants, leases, and payment history.', action: 'Export Data' },
                { icon: 'trash', label: 'Delete Account', desc: 'Permanently delete your account and all associated data. This cannot be undone.', action: 'Delete Account', critical: true },
              ].map((item, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.85rem 0', borderBottom: i < 2 ? '1px solid rgba(224,90,74,0.08)' : 'none',
                  gap: '1rem',
                }}>
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 500, color: C.white }}>{item.label}</div>
                    <div style={{ fontSize: '0.68rem', color: 'rgba(245,240,232,0.3)', marginTop: '0.1rem', lineHeight: 1.5 }}>{item.desc}</div>
                  </div>
                  <button style={{
                    background: 'transparent', color: item.critical ? C.redLight : C.redLight,
                    border: `1px solid ${item.critical ? 'rgba(224,90,74,0.5)' : 'rgba(224,90,74,0.25)'}`,
                    padding: '0.45rem 1rem', fontFamily: F.dm, fontWeight: 600,
                    fontSize: '0.68rem', letterSpacing: '0.06em', textTransform: 'uppercase',
                    cursor: 'pointer', borderRadius: '2px', whiteSpace: 'nowrap', flexShrink: 0,
                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                  }}>
                    <Icon name={item.icon} size={12} /> {item.action}
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>

      {/* SAVE BAR */}
      <div className="save-bar" style={{
        position: 'fixed', bottom: hasChanges ? 0 : '-100px', left: 0, right: 0,
        background: 'rgba(10,10,10,0.95)', backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${C.border}`, padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'bottom 0.3s ease', zIndex: 50,
      }}>
        <span style={{ fontSize: '0.75rem', color: 'rgba(245,240,232,0.4)', fontFamily: F.mono, letterSpacing: '0.08em' }}>
          You have unsaved changes
        </span>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button onClick={discardChanges} style={btnGhost}>Discard</button>
          <button onClick={saveChanges} style={btnPrimary}>Save Changes</button>
        </div>
      </div>

      {/* SAVED TOAST */}
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