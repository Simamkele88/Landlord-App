/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
// LANDLORD PAYMENT SETTINGS PAGE 
import { useState, useEffect } from "react";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import { c as C, f as F } from "../../../styles/theme";
import axios from "axios";

const API = "http://localhost:4000";


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

const cardStyle = {
  background: C.muted2, border: `1px solid ${C.border}`, borderRadius: '5px', padding: '1.5rem',
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

function Block({ title, children }) {
  return (
    <div style={cardStyle}>
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
      <button onClick={() => onChange(!value)} style={{
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

export default function PaymentSettings() {
  useDocumentTitle("Payment Settings");
  const toast = useToast();
  const [hasChanges, setHasChanges] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gracePeriodDays, setGracePeriodDays] = useState("5");
  const [lateFeeType, setLateFeeType] = useState("percentage");
  const [lateFeeValue, setLateFeeValue] = useState("10");
  const [lateFeeCap, setLateFeeCap] = useState("500");
  const [applyLateFeeAfter, setApplyLateFeeAfter] = useState("5");
  const [reminderBeforeDue, setReminderBeforeDue] = useState(true);
  const [reminderBeforeDueDays, setReminderBeforeDueDays] = useState("3");
  const [reminderOnDueDay, setReminderOnDueDay] = useState(true);
  const [reminderAfterDue, setReminderAfterDue] = useState(true);
  const [reminderAfterDueDays, setReminderAfterDueDays] = useState("1");
  const [reminderFrequency, setReminderFrequency] = useState("every_3_days");
  const [maxReminders, setMaxReminders] = useState("5");
  const [autoCollections, setAutoCollections] = useState(false);
  const [collectionsAfterDays, setCollectionsAfterDays] = useState("60");
  const [collectionsNote, setCollectionsNote] = useState("Tenant account has been escalated to collections due to non-payment exceeding 60 days.");
  const [acceptEFT, setAcceptEFT] = useState(true);
  const [acceptCash, setAcceptCash] = useState(false);
  const [acceptCard, setAcceptCard] = useState(false);
  const [acceptDebitOrder, setAcceptDebitOrder] = useState(true);
  const [requireProof, setRequireProof] = useState(true);
  const [autoApproveExact, setAutoApproveExact] = useState(false);
  const [autoSendReceipt, setAutoSendReceipt] = useState(true);
  const [receiptPrefix, setReceiptPrefix] = useState("RCP-CHW");

  useEffect(() => {
    async function fetchSettings() {
      try {
        const token = localStorage.getItem("token");
        const { data } = await axios.get(`${API}/landlord/payment-settings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const s = data.settings;
        setGracePeriodDays(String(s.grace_period_days));
        setLateFeeType(s.late_fee_type);
        setLateFeeValue(String(s.late_fee_value));
        setLateFeeCap(String(s.late_fee_cap));
        setApplyLateFeeAfter(String(s.apply_late_fee_after_days));
        setReminderBeforeDue(s.reminder_before_due);
        setReminderBeforeDueDays(String(s.reminder_before_due_days));
        setReminderOnDueDay(s.reminder_on_due_day);
        setReminderAfterDue(s.reminder_after_due);
        setReminderAfterDueDays(String(s.reminder_after_due_days));
        setReminderFrequency(s.reminder_frequency);
        setMaxReminders(String(s.max_reminders));
        setAutoCollections(s.auto_collections);
        setCollectionsAfterDays(String(s.collections_after_days));
        setCollectionsNote(s.collections_note);
        setAcceptEFT(s.accept_eft);
        setAcceptCash(s.accept_cash);
        setAcceptCard(s.accept_card);
        setAcceptDebitOrder(s.accept_debit_order);
        setRequireProof(s.require_proof);
        setAutoApproveExact(s.auto_approve_exact);
        setAutoSendReceipt(s.auto_send_receipt);
        setReceiptPrefix(s.receipt_prefix);
        setSettings(s);
      } catch (err) {
        toast.error("Failed to load payment settings.");
      } finally {
        setLoading(false);
      }
    }
    fetchSettings();
  }, []);

  const flagChange = () => { if (!hasChanges) setHasChanges(true); };

  const saveChanges = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`${API}/landlord/payment-settings`, {
        grace_period_days: Number(gracePeriodDays),
        late_fee_type: lateFeeType,
        late_fee_value: Number(lateFeeValue),
        late_fee_cap: Number(lateFeeCap),
        apply_late_fee_after_days: Number(applyLateFeeAfter),
        reminder_before_due: reminderBeforeDue,
        reminder_before_due_days: Number(reminderBeforeDueDays),
        reminder_on_due_day: reminderOnDueDay,
        reminder_after_due: reminderAfterDue,
        reminder_after_due_days: Number(reminderAfterDueDays),
        reminder_frequency: reminderFrequency,
        max_reminders: Number(maxReminders),
        auto_collections: autoCollections,
        collections_after_days: Number(collectionsAfterDays),
        collections_note: collectionsNote,
        accept_eft: acceptEFT,
        accept_cash: acceptCash,
        accept_card: acceptCard,
        accept_debit_order: acceptDebitOrder,
        require_proof: requireProof,
        auto_approve_exact: autoApproveExact,
        auto_send_receipt: autoSendReceipt,
        receipt_prefix: receiptPrefix,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHasChanges(false);
      setShowToast(true);
      toast.success("Payment settings saved.");
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
        input:focus, textarea:focus, select:focus { border-color: ${C.borderFocus} !important; }
        @media (max-width: 768px) {
          .ps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* PAGE HEADER */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={S.title}><Icon name="settings" size={24} color={C.gold} />Payment Settings</h1>
        <p style={S.subtitle}>Configure late fees, reminders, collections, and payment rules</p>
      </div>

      {/* CONTENT GRID */}
      <div className="ps-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Grace Period & Late Fees */}
          <Block title="Grace Period & Late Fees">
            <Field label="Grace Period (Days)" hint="Days after due date before payment is marked as late">
              <input type="number" min="0" max="30" value={gracePeriodDays}
                onChange={e => { setGracePeriodDays(e.target.value); flagChange(); }} style={inputStyle} />
            </Field>

            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{
                display: 'block', fontSize: '0.65rem', fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                marginBottom: '0.4rem', color: 'rgba(245,240,232,0.5)',
                fontFamily: F.mono,
              }}>
                Late Fee Type
              </label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {[
                  { value: 'none', label: 'None' },
                  { value: 'percentage', label: '% of Rent' },
                  { value: 'fixed', label: 'Fixed Amount' },
                ].map(opt => (
                  <button key={opt.value} onClick={() => { setLateFeeType(opt.value); flagChange(); }} style={{
                    flex: 1, padding: '0.6rem', borderRadius: '3px', fontSize: '0.72rem', fontWeight: 500,
                    fontFamily: F.mono, letterSpacing: '0.04em', textAlign: 'center',
                    border: `1px solid ${lateFeeType === opt.value ? C.gold : C.border}`,
                    background: lateFeeType === opt.value ? 'rgba(232,160,18,0.08)' : 'transparent',
                    color: lateFeeType === opt.value ? C.gold : 'rgba(245,240,232,0.4)',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {lateFeeType !== 'none' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <Field label={lateFeeType === 'percentage' ? 'Late Fee %' : 'Late Fee (R)'}
                  hint={lateFeeType === 'percentage' ? '% of monthly rent' : 'Flat fee amount'}>
                  <input type="number" min="0" value={lateFeeValue}
                    onChange={e => { setLateFeeValue(e.target.value); flagChange(); }} style={inputStyle} />
                </Field>
                {lateFeeType === 'percentage' && (
                  <Field label="Late Fee Cap (R)" hint="Maximum late fee charged">
                    <input type="number" min="0" value={lateFeeCap}
                      onChange={e => { setLateFeeCap(e.target.value); flagChange(); }} style={inputStyle} />
                  </Field>
                )}
              </div>
            )}

            <Field label="Apply Late Fee After (Days)" hint="How many days after due date before the late fee is applied">
              <input type="number" min="1" max="30" value={applyLateFeeAfter}
                onChange={e => { setApplyLateFeeAfter(e.target.value); flagChange(); }} style={inputStyle} />
            </Field>

            {/* Late fee example */}
            {lateFeeType !== 'none' && (
              <div style={{
                padding: '0.6rem 0.8rem', borderRadius: '3px',
                background: 'rgba(232,160,18,0.04)', border: '1px solid rgba(232,160,18,0.1)',
                fontSize: '0.68rem', color: C.gold, lineHeight: 1.5,
              }}>
                <span style={{ fontWeight: 600 }}>Example:</span> On a R6,500 rent, the late fee would be{" "}
                <strong>
                  {lateFeeType === 'percentage'
                    ? `R ${Math.min(Number(lateFeeCap) || 99999, Math.round(6500 * (Number(lateFeeValue) / 100)))}`
                    : `R ${Number(lateFeeValue).toLocaleString("en-ZA")}`
                  }
                </strong>{" "}
                applied {applyLateFeeAfter} day{applyLateFeeAfter !== "1" ? "s" : ""} after the due date.
              </div>
            )}
          </Block>

          {/* Auto-Reminders */}
          <Block title="Automated Reminders">
            <ToggleRow
              label="Remind before due date"
              desc={`Send a reminder ${reminderBeforeDueDays} day(s) before rent is due.`}
              value={reminderBeforeDue} onChange={(v) => { setReminderBeforeDue(v); flagChange(); }}
            />
            {reminderBeforeDue && (
              <Field label="Days Before Due Date">
                <input type="number" min="1" max="14" value={reminderBeforeDueDays}
                  onChange={e => { setReminderBeforeDueDays(e.target.value); flagChange(); }} style={inputStyle} />
              </Field>
            )}

            <div style={{ borderBottom: `1px solid ${C.border}` }} />
            <ToggleRow
              label="Remind on due day"
              desc="Send a reminder on the day rent is due."
              value={reminderOnDueDay} onChange={(v) => { setReminderOnDueDay(v); flagChange(); }}
            />

            <div style={{ borderBottom: `1px solid ${C.border}` }} />
            <ToggleRow
              label="Remind after due date"
              desc={`Send reminders after the due date if payment is not received.`}
              value={reminderAfterDue} onChange={(v) => { setReminderAfterDue(v); flagChange(); }}
            />

            {reminderAfterDue && (
              <>
                <Field label="First Reminder After (Days)">
                  <input type="number" min="1" max="30" value={reminderAfterDueDays}
                    onChange={e => { setReminderAfterDueDays(e.target.value); flagChange(); }} style={inputStyle} />
                </Field>
                <Field label="Reminder Frequency">
                  <select value={reminderFrequency} onChange={e => { setReminderFrequency(e.target.value); flagChange(); }} style={selectStyle}>
                    <option value="daily">Daily</option>
                    <option value="every_2_days">Every 2 days</option>
                    <option value="every_3_days">Every 3 days</option>
                    <option value="weekly">Weekly</option>
                  </select>
                </Field>
                <Field label="Max Reminders" hint="Stop sending after this many reminders">
                  <input type="number" min="1" max="20" value={maxReminders}
                    onChange={e => { setMaxReminders(e.target.value); flagChange(); }} style={inputStyle} />
                </Field>
              </>
            )}
          </Block>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

          {/* Collections */}
          <Block title="Collections Escalation">
            <ToggleRow
              label="Auto-escalate to Collections"
              desc="Automatically send overdue accounts to collections after a set period."
              value={autoCollections} onChange={(v) => { setAutoCollections(v); flagChange(); }}
            />

            {autoCollections && (
              <>
                <Field label="Escalate After (Days)" hint="Days after due date before sending to collections">
                  <input type="number" min="30" max="180" value={collectionsAfterDays}
                    onChange={e => { setCollectionsAfterDays(e.target.value); flagChange(); }} style={inputStyle} />
                </Field>

                <Field label="Default Collections Note" hint="Appears on the tenant's account when escalated">
                  <textarea rows={3} value={collectionsNote}
                    onChange={e => { setCollectionsNote(e.target.value); flagChange(); }}
                    style={{ ...inputStyle, resize: 'vertical', minHeight: 60, fontSize: '0.72rem' }} />
                </Field>

                <div style={{
                  padding: '0.6rem 0.8rem', borderRadius: '3px',
                  background: 'rgba(224,90,74,0.06)', border: '1px solid rgba(224,90,74,0.15)',
                  display: 'flex', alignItems: 'flex-start', gap: '0.4rem',
                }}>
                  <Icon name="warning" size={13} color={C.redLight} style={{ flexShrink: 0, marginTop: '1px' }} />
                  <p style={{ fontSize: '0.65rem', color: C.redLight, lineHeight: 1.5 }}>
                    Collections escalation will automatically mark the tenant's reliability score and may trigger legal proceedings. Use with caution.
                  </p>
                </div>
              </>
            )}
          </Block>

          {/* Payment Methods */}
          <Block title="Accepted Payment Methods">
            <ToggleRow label="EFT / Bank Transfer" desc="Tenants can submit proof of EFT payment." value={acceptEFT} onChange={(v) => { setAcceptEFT(v); flagChange(); }} />
            <div style={{ borderBottom: `1px solid ${C.border}` }} />
            <ToggleRow label="Cash Deposit" desc="Tenants can declare cash deposits at the bank." value={acceptCash} onChange={(v) => { setAcceptCash(v); flagChange(); }} />
            <div style={{ borderBottom: `1px solid ${C.border}` }} />
            <ToggleRow label="Card Payment" desc="Accept debit/credit card payments online." value={acceptCard} onChange={(v) => { setAcceptCard(v); flagChange(); }} />
            <div style={{ borderBottom: `1px solid ${C.border}` }} />
            <ToggleRow label="Debit Order" desc="Automated monthly debit order collection." value={acceptDebitOrder} onChange={(v) => { setAcceptDebitOrder(v); flagChange(); }} />
          </Block>

          {/* Proof & Verification */}
          <Block title="Proof of Payment">
            <ToggleRow label="Require Proof of Payment" desc="Tenants must upload proof before payment is reviewed." value={requireProof} onChange={(v) => { setRequireProof(v); flagChange(); }} />
            <div style={{ borderBottom: `1px solid ${C.border}` }} />
            <ToggleRow
              label="Auto-approve exact match"
              desc="Automatically approve payments when the amount exactly matches the rent due."
              value={autoApproveExact} onChange={(v) => { setAutoApproveExact(v); flagChange(); }}
            />
          </Block>

          {/* Receipt Settings */}
          <Block title="Receipt Settings">
            <ToggleRow label="Auto-send Receipt" desc="Automatically email a receipt to the tenant when payment is approved." value={autoSendReceipt} onChange={(v) => { setAutoSendReceipt(v); flagChange(); }} />
            <Field label="Receipt Number Prefix" hint="Prefix for all receipt numbers">
              <input type="text" value={receiptPrefix}
                onChange={e => { setReceiptPrefix(e.target.value); flagChange(); }} style={inputStyle} />
            </Field>
          </Block>
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
        <Icon name="check" size={13} /> Settings Saved
      </div>
    </div>
  );
}