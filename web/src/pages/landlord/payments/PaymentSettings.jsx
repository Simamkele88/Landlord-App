/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import useDocumentTitle from "../../../hooks/useDocumentTitle";
import { useToast } from "../../../contexts/ToastContext";
import { Icon } from "../../../components/Icon";
import axios from "axios";
import { FiChevronRight } from "react-icons/fi";

const API = "http://localhost:4000";

const COLORS = {
  text: "#1f2328",
  textMuted: "#5f6b7a",
  link: "#1a73e8",
  border: "#dfe3e8",
  borderLight: "#eef1f4",
  headBg: "#f7f8fa",
  green: "#2b7a4b",
  white: "#fdfdfd",
};

const FONT = '"Segoe UI", -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif';

const inputStyle = {
  width: "100%",
  fontSize: "14px",
  padding: "0.5rem 0.8rem",
  borderRadius: "2px",
  background: COLORS.white,
  border: "1px solid #dee2e6",
  color: COLORS.text,
  outline: "none",
  fontFamily: FONT,
};

const selectStyle = {
  ...inputStyle,
  appearance: "none",
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' fill='none'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 0.75rem center",
  paddingRight: "2rem",
};

const cardStyle = {
  background: COLORS.white,
  border: "1px solid #e9ecef",
  borderRadius: "3px",
  padding: "1.5rem",
};

const btnPrimary = {
  background: "#2c3e50",
  color: "#ffffff",
  border: "1px solid #2c3e50",
  padding: "0.4rem 1.2rem",
  fontSize: "14px",
  fontWeight: 500,
  fontFamily: FONT,
  borderRadius: "2px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
};

const btnGhost = {
  background: "transparent",
  color: "#6c757d",
  border: "1px solid #ccc",
  padding: "0.4rem 1.2rem",
  fontSize: "14px",
  fontWeight: 400,
  fontFamily: FONT,
  borderRadius: "2px",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "0.4rem",
};

function Field({ label, hint, children, optional }) {
  return (
    <div style={{ marginBottom: "1.2rem" }}>
      <label style={{
        display: "block",
        fontSize: "12px",
        fontWeight: 500,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        marginBottom: "0.3rem",
        color: "#7f8c8d",
        fontFamily: FONT,
      }}>
        {label}
        {optional && <span style={{ color: "#95a5a6", fontWeight: 400, textTransform: "none", marginLeft: "0.3rem" }}>(Optional)</span>}
      </label>
      {hint && <span style={{ fontSize: "12px", color: "#95a5a6", marginBottom: "0.35rem", display: "block" }}>{hint}</span>}
      {children}
    </div>
  );
}

function Block({ title, children }) {
  return (
    <div style={cardStyle}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "1.2rem",
        paddingBottom: "0.7rem",
        borderBottom: "1px solid #e9ecef",
      }}>
        <span style={{
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "#6c757d",
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
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "0.85rem 0",
      borderBottom: "1px solid #f1f3f5",
    }}>
      <div style={{ flex: 1, paddingRight: "1rem" }}>
        <div style={{ fontSize: "14px", fontWeight: 500, color: COLORS.text, marginBottom: "0.1rem" }}>{label}</div>
        <div style={{ fontSize: "12px", color: "#6c757d", lineHeight: 1.5 }}>{desc}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          width: 42,
          height: 22,
          borderRadius: "11px",
          background: value ? COLORS.green : "#ccc",
          position: "relative",
          cursor: "pointer",
          flexShrink: 0,
          border: "none",
          transition: "background 0.25s",
        }}
      >
        <div style={{
          position: "absolute",
          top: 3,
          left: value ? 23 : 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#ffffff",
          transition: "left 0.25s",
        }} />
      </button>
    </div>
  );
}

export default function PaymentSettings() {
  useDocumentTitle("Payment Settings");
  const toast = useToast();
  const navigate = useNavigate();
  const [hasChanges, setHasChanges] = useState(false);
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
  const [collectionsNote, setCollectionsNote] = useState(
    "Tenant account has been escalated to collections due to non-payment exceeding 60 days."
  );
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
          headers: { Authorization: `Bearer ${token}` },
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
      await axios.put(
        `${API}/landlord/payment-settings`,
        {
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
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setHasChanges(false);
      toast.success("Payment settings saved.");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to save settings.");
    }
  };

  const discardChanges = () => setHasChanges(false);

  return (
    <div style={{ padding: '1rem', fontFamily: FONT, color: COLORS.text, background: '#ffffff' }}>
      <style>{`
        input:focus, textarea:focus, select:focus { border-color: #3a9bb3 !important; box-shadow: 0 0 0 2px rgba(58,155,179,0.15); }
        @media (max-width: 768px) {
          .ps-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Main card */}
      <div style={{
        background: '#fdfdfd', border: '1px solid #dfe3e8', borderRadius: '3px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden',
      }}>
        {/* Card header */}
        <div style={{
          background: '#f7f8fa', padding: '0.4rem 0 0.2rem 0.7rem', borderBottom: '3px solid #3498db',
        }}>
          <h4 style={{ fontSize: '16px', color: '#000', margin: 0, fontFamily: FONT, fontWeight: 500 }}>
            Payment Settings
          </h4>
        </div>

        {/* Content */}
        <div style={{ padding: '1.2rem' }}>
          {/* CONTENT GRID */}
          <div className="ps-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>
            {/* LEFT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <Block title="Grace Period & Late Fees">
                <Field label="Grace Period (Days)" hint="Days after due date before payment is marked as late">
                  <input type="number" min="0" max="30" value={gracePeriodDays}
                    onChange={e => { setGracePeriodDays(e.target.value); flagChange(); }} style={inputStyle} />
                </Field>

                <div style={{ marginBottom: "1.2rem" }}>
                  <label style={{
                    display: "block", fontSize: "12px", fontWeight: 500,
                    letterSpacing: "0.04em", textTransform: "uppercase",
                    marginBottom: "0.4rem", color: "#7f8c8d",
                  }}>
                    Late Fee Type
                  </label>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    {[
                      { value: "none", label: "None" },
                      { value: "percentage", label: "% of Rent" },
                      { value: "fixed", label: "Fixed Amount" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setLateFeeType(opt.value); flagChange(); }}
                        style={{
                          flex: 1,
                          padding: "0.5rem",
                          borderRadius: "2px",
                          fontSize: "13px",
                          fontWeight: 500,
                          textAlign: "center",
                          border: `1px solid ${lateFeeType === opt.value ? "#2c3e50" : "#ccc"}`,
                          background: lateFeeType === opt.value ? "#e8f0f5" : "transparent",
                          color: lateFeeType === opt.value ? "#2c3e50" : "#6c757d",
                          cursor: "pointer",
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {lateFeeType !== "none" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.8rem" }}>
                    <Field
                      label={lateFeeType === "percentage" ? "Late Fee %" : "Late Fee (R)"}
                      hint={lateFeeType === "percentage" ? "% of monthly rent" : "Flat fee amount"}
                    >
                      <input type="number" min="0" value={lateFeeValue}
                        onChange={e => { setLateFeeValue(e.target.value); flagChange(); }} style={inputStyle} />
                    </Field>
                    {lateFeeType === "percentage" && (
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
              </Block>

              <Block title="Automated Reminders">
                <ToggleRow
                  label="Remind before due date"
                  desc={`Send a reminder ${reminderBeforeDueDays} day(s) before rent is due.`}
                  value={reminderBeforeDue}
                  onChange={(v) => { setReminderBeforeDue(v); flagChange(); }}
                />
                {reminderBeforeDue && (
                  <Field label="Days Before Due Date">
                    <input type="number" min="1" max="14" value={reminderBeforeDueDays}
                      onChange={e => { setReminderBeforeDueDays(e.target.value); flagChange(); }} style={inputStyle} />
                  </Field>
                )}

                <div style={{ borderBottom: "1px solid #f1f3f5", margin: "0.5rem 0" }} />
                <ToggleRow
                  label="Remind on due day"
                  desc="Send a reminder on the day rent is due."
                  value={reminderOnDueDay}
                  onChange={(v) => { setReminderOnDueDay(v); flagChange(); }}
                />

                <div style={{ borderBottom: "1px solid #f1f3f5", margin: "0.5rem 0" }} />
                <ToggleRow
                  label="Remind after due date"
                  desc="Send reminders after the due date if payment is not received."
                  value={reminderAfterDue}
                  onChange={(v) => { setReminderAfterDue(v); flagChange(); }}
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
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <Block title="Collections Escalation">
                <ToggleRow
                  label="Auto-escalate to Collections"
                  desc="Automatically send overdue accounts to collections after a set period."
                  value={autoCollections}
                  onChange={(v) => { setAutoCollections(v); flagChange(); }}
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
                        style={{ ...inputStyle, resize: "vertical", minHeight: 60, fontSize: "14px" }} />
                    </Field>

                    <div style={{
                      padding: "0.6rem 0.8rem",
                      borderRadius: "2px",
                      background: "#fbeaea",
                      border: "1px solid #e5bdbd",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "0.4rem",
                    }}>
                      <Icon name="warning" size={13} color="#9e3a3a" style={{ flexShrink: 0, marginTop: "1px" }} />
                      <p style={{ fontSize: "13px", color: "#9e3a3a", lineHeight: 1.5, margin: 0 }}>
                        Collections escalation will automatically mark the tenant's reliability score and may trigger legal proceedings. Use with caution.
                      </p>
                    </div>
                  </>
                )}
              </Block>

              <Block title="Accepted Payment Methods">
                <ToggleRow label="EFT / Bank Transfer" desc="Tenants can submit proof of EFT payment." value={acceptEFT} onChange={(v) => { setAcceptEFT(v); flagChange(); }} />
                <div style={{ borderBottom: "1px solid #f1f3f5", margin: "0.5rem 0" }} />
                <ToggleRow label="Cash Deposit" desc="Tenants can declare cash deposits at the bank." value={acceptCash} onChange={(v) => { setAcceptCash(v); flagChange(); }} />
                <div style={{ borderBottom: "1px solid #f1f3f5", margin: "0.5rem 0" }} />
                <ToggleRow label="Card Payment" desc="Accept debit/credit card payments online." value={acceptCard} onChange={(v) => { setAcceptCard(v); flagChange(); }} />
                <div style={{ borderBottom: "1px solid #f1f3f5", margin: "0.5rem 0" }} />
                <ToggleRow label="Debit Order" desc="Automated monthly debit order collection." value={acceptDebitOrder} onChange={(v) => { setAcceptDebitOrder(v); flagChange(); }} />
              </Block>

              <Block title="Proof of Payment">
                <ToggleRow label="Require Proof of Payment" desc="Tenants must upload proof before payment is reviewed." value={requireProof} onChange={(v) => { setRequireProof(v); flagChange(); }} />
                <div style={{ borderBottom: "1px solid #f1f3f5", margin: "0.5rem 0" }} />
                <ToggleRow
                  label="Auto-approve exact match"
                  desc="Automatically approve payments when the amount exactly matches the rent due."
                  value={autoApproveExact}
                  onChange={(v) => { setAutoApproveExact(v); flagChange(); }}
                />
              </Block>

              <Block title="Receipt Settings">
                <ToggleRow label="Auto-send Receipt" desc="Automatically email a receipt to the tenant when payment is approved." value={autoSendReceipt} onChange={(v) => { setAutoSendReceipt(v); flagChange(); }} />
                <Field label="Receipt Number Prefix" hint="Prefix for all receipt numbers">
                  <input type="text" value={receiptPrefix}
                    onChange={e => { setReceiptPrefix(e.target.value); flagChange(); }} style={inputStyle} />
                </Field>
              </Block>
            </div>
          </div>

          {/* Footer buttons */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: '0.6rem',
            marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e9ecef',
          }}>
            <button onClick={discardChanges} disabled={!hasChanges} style={btnGhost}>Discard</button>
            <button onClick={saveChanges} disabled={!hasChanges} style={btnPrimary}>Save Changes</button>
          </div>
        </div>
      </div>
    </div>
  );
}