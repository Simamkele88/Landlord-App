// PAYMENTS SCREEN FOR TENANTS
// AUTHOR: SIMAMKELE WEKEZA
// IF YOU DO NOT UNDERSTAND THIS CODE, PLEASE ASK ME TO EXPLAIN AND DON'T ASSUME OTHERWISE.
import { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  FlatList,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { C, styles } from "./ScreenStyle";
import { MaterialIcons, FontAwesome5, Ionicons, Feather } from '@expo/vector-icons';

// MOCK TENANT AND PAYMENT DATA
const TENANT = {
  name: "Simamkele Wekeza",
  unit: "Unit 213-B",
  property: "Hillbrow Heights",
  rentAmount: 5800,
  dueDay: 1,          
  leaseEnd: "2026-12-31",
  reliabilityScore: "Reliable",
};

const PAYMENT_HISTORY = [
  { id: "p1", period: "April 2026", amount: 5800, status: "Late", method: null, paidOn: null, receiptNo: null },
  { id: "p2", period: "March 2026",     amount: 5800, status: "Paid", method: "Upload",  paidOn: "2026-03-01", receiptNo: "RCP-0002-260301" },
  { id: "p3", period: "February 2026",  amount: 5800, status: "Paid", method: "In-App",  paidOn: "2026-02-01", receiptNo: "RCP-0002-260201" },
  { id: "p4", period: "January 2026",   amount: 5800, status: "Paid", method: "Upload",  paidOn: "2026-01-03", receiptNo: "RCP-0002-260103" },
  { id: "p5", period: "December 2025",  amount: 5500, status: "Paid", method: "In-App",  paidOn: "2025-12-01", receiptNo: "RCP-0002-251201" },
  { id: "p6", period: "November 2025",  amount: 5500, status: "Late", method: null,      paidOn: null,         receiptNo: null },
];

// HELPER FUNCTIONS
function format(amount) {
  return `R ${Number(amount).toLocaleString("en-ZA")}`;
}


function daysUntilDue() {
  const now  = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), TENANT.dueDay);
  if (next < now) next.setMonth(next.getMonth() + 1);
  return Math.ceil((next - now) / 86400000);
}

function statusConfig(status) {
  switch (status) {
    case "Paid":             return { color: C.success, bg: C.successBg, label: "Paid" };
    case "Pending Approval": return { color: C.warning, bg: C.warningBg, label: "Pending" };
    case "Late":             return { color: C.danger,  bg: C.dangerBg,  label: "Late" };
    default:                 return { color: C.textMuted, bg: C.surface, label: status };
  }
}

function reliabilityColor(score) {
  if (score === "Reliable")      return C.success;
  if (score === "Moderate Risk") return C.warning;
  return C.danger;
}

// SMALL COMPONENTS

function StatusPill({ status }) {
  const { color, bg, label } = statusConfig(status);
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

function SectionLabel({ title }) {
  return <Text style={styles.sectionLabel}>{title}</Text>;
}

function Divider() {
  return <View style={styles.divider} />;
}

// UPLOAD PROOF MODAL
function UploadProofModal({ visible, onClose, onSubmit }) {
  const [reference, setReference] = useState("");
  const [amount, setAmount]       = useState(String(TENANT.rentAmount));
  const [fileSelected, setFile]   = useState(false);
  const [loading, setLoading]     = useState(false);

  const canSubmit = reference.trim() !== "" && amount.trim() !== "" && fileSelected;

  function handleFilePick() {
    setFile(true);
  }

  function handleSubmit() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSubmit();
    }, 1500);
  }

  function handleClose() {
    setReference("");
    setAmount(String(TENANT.rentAmount));
    setFile(false);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.bottomSheet}>

          {/* HANDLE */}
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>Upload Proof of Payment</Text>
          <Text style={styles.sheetSub}>
            Upload your bank confirmation or EFT slip for {TENANT.property}
          </Text>

          {/* AMOUNT */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount Paid (R)</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholderTextColor={C.textMuted}
              selectionColor={C.primary}
            />
          </View>

          {/* REFERENCE */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Payment Reference / EFT Reference</Text>
            <TextInput
              style={styles.input}
              value={reference}
              onChangeText={setReference}
              placeholder="e.g. 0047568936"
              placeholderTextColor={C.textMuted}
              selectionColor={C.primary}
            />
          </View>

          {/* FILE PICKER */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Proof of Payment (PDF or Image)</Text>
            <TouchableOpacity
              style={[styles.filePicker, fileSelected && styles.filePickerSelected]}
              onPress={handleFilePick}
              activeOpacity={0.7}
            >
              {fileSelected ? (
                <View style={styles.filePickerInner}>
                  <MaterialIcons name="check-circle" size={24} color={C.success} />
                  <View>
                    <Text style={[styles.filePickerText, { color: C.success }]}>
                      proof_of_payment.pdf
                    </Text>
                    <Text style={styles.filePickerSub}>Selected file is proof_of_payment.pdf</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.filePickerInner}>
                  <Feather name="upload" size={22} color={C.textSecondary} />
                  <View>
                    <Text style={styles.filePickerText}>Tap to select file</Text>
                    <Text style={styles.filePickerSub}>PDF, JPG or PNG · Max 5MB</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* INFO */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Your proof will be reviewed by the landlord. You'll be notified once approved.
            </Text>
          </View>

          {/* ACTIONS */}
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.btnSecondary} onPress={handleClose} activeOpacity={0.8}>
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btnPrimary, (!canSubmit || loading) && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={C.white} size="small" />
                : <Text style={styles.btnPrimaryText}>Submit Payment</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// IN-APP PAYMENT MODAL
function InAppPayModal({ visible, onClose, onSubmit }) {
  const [step, setStep]     = useState("method");   
  const [method, setMethod] = useState(null);
  const [loading, setLoading] = useState(false);

  const METHODS = [
  { 
    id: "card", 
    label: "Credit / Debit Card", 
    icon: "credit-card",
    iconLibrary: "FontAwesome5",
    sub: "Visa, Mastercard" 
  },
  { 
    id: "eft", 
    label: "Instant EFT", 
    icon: "bank",
    iconLibrary: "FontAwesome5",
    sub: "via Ozow or Peach Payments" 
  },
  { 
    id: "wallet",
    label: "Mobile Wallet", 
    icon: "phone",
    iconLibrary: "FontAwesome5",
    sub: "SnapScan, Zapper" 
  },
];

  function handlePay() {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep("success");
    }, 2000);
  }

  function handleClose() {
    setStep("method");
    setMethod(null);
    onClose();
  }

  function handleDone() {
    handleClose();
    onSubmit();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />

          {/* METHOD SELECTION */}
          {step === "method" && (
            <>
              <Text style={styles.sheetTitle}>Pay Rent</Text>
              <Text style={styles.sheetSub}>{format(TENANT.rentAmount)} due for April 2026</Text>

              <SectionLabel title="Select payment method" />
              {METHODS.map(m => {
                const IconComponent = m.iconLibrary === "FontAwesome5" ? FontAwesome5 : MaterialIcons;
                
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.methodCard, method?.id === m.id && styles.methodCardActive]}
                    onPress={() => setMethod(m)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.methodIconContainer}>
                      <IconComponent name={m.icon} size={24} color={method?.id === m.id ? C.primary : C.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.methodLabel}>{m.label}</Text>
                      <Text style={styles.methodSub}>{m.sub}</Text>
                    </View>
                    <View style={[
                      styles.radioOuter,
                      method?.id === m.id && styles.radioOuterActive,
                    ]}>
                      {method?.id === m.id && <View style={styles.radioInner} />}
                    </View>
                  </TouchableOpacity>
                );
              })}

              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.btnSecondary} onPress={handleClose} activeOpacity={0.8}>
                  <Text style={styles.btnSecondaryText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnPrimary, !method && styles.btnDisabled]}
                  onPress={() => setStep("confirm")}
                  disabled={!method}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnPrimaryText}>Continue</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* CONFIRM */}
          {step === "confirm" && (
            <>
              <Text style={styles.sheetTitle}>Confirm Payment</Text>

              <View style={styles.confirmCard}>
                {[
                  ["Tenant",    TENANT.name],
                  ["Unit",      `${TENANT.unit} · ${TENANT.property}`],
                  ["Period",    "April 2026"],
                  ["Method",    method?.label],
                ].map(([label, val]) => (
                  <View key={label} style={styles.confirmRow}>
                    <Text style={styles.confirmLabel}>{label}</Text>
                    <Text style={styles.confirmValue}>{val}</Text>
                  </View>
                ))}
                <View style={[styles.confirmRow, styles.confirmTotal]}>
                  <Text style={styles.confirmTotalLabel}>Total</Text>
                  <Text style={styles.confirmTotalValue}>{format(TENANT.rentAmount)}</Text>
                </View>
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  By confirming, you authorise a payment of {format(TENANT.rentAmount)} for April 2026 rent.
                </Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() => setStep("method")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.btnSecondaryText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnPrimary, loading && styles.btnDisabled]}
                  onPress={handlePay}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading
                    ? <ActivityIndicator color={C.white} size="small" />
                    : <Text style={styles.btnPrimaryText}>Pay {format(TENANT.rentAmount)}</Text>
                  }
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* SUCCESS */}
          {step === "success" && (
            <View style={styles.successContent}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={40} color={C.white} />
              </View>
              <Text style={styles.successTitle}>Payment Submitted!</Text>
              <Text style={styles.successSub}>
                Your payment of {format(TENANT.rentAmount)} has been submitted successfully. The landlord will confirm shortly.
              </Text>
              <TouchableOpacity style={[styles.btnPrimary, { width: "100%", marginTop: 24 }]} onPress={handleDone} activeOpacity={0.8}>
                <Text style={styles.btnPrimaryText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// RECEIPT MODAL
function ReceiptModal({ visible, payment, onClose }) {
  if (!payment) return null;
  const approvedOn = payment.paidOn
    ? new Date(payment.paidOn).toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" })
    : "—";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />

          {/* GREEN HEADER */}
          <View style={styles.receiptHeader}>
            <View style={styles.receiptCheckCircle}>
            <Ionicons name="checkmark" size={28} color={C.white} />
          </View>
            <Text style={styles.receiptTitle}>Payment Receipt</Text>
            <Text style={[styles.receiptNo, { marginTop: 4 }]}>{payment.receiptNo}</Text>
          </View>

          <View style={styles.confirmCard}>
            {[
              ["Tenant",    TENANT.name],
              ["Unit",      `${TENANT.unit} · ${TENANT.property}`],
              ["Period",    payment.period],
              ["Method",    payment.method],
              ["Date Paid", approvedOn],
            ].map(([label, val]) => (
              <View key={label} style={styles.confirmRow}>
                <Text style={styles.confirmLabel}>{label}</Text>
                <Text style={styles.confirmValue}>{val}</Text>
              </View>
            ))}
            <View style={[styles.confirmRow, styles.confirmTotal]}>
              <Text style={styles.confirmTotalLabel}>Amount Paid</Text>
              <Text style={styles.confirmTotalValue}>{format(payment.amount)}</Text>
            </View>
          </View>

          <Text style={styles.receiptFootnote}>
            Approved by Landlord · Keep this for your records
          </Text>

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={styles.btnSecondary}
              onPress={() => Alert.alert("Download", "In production this downloads a PDF receipt.")}
              activeOpacity={0.8}
            >
              <Feather name="download" size={18} color={C.textPrimary} />
              <Text style={styles.btnSecondaryText}>Download</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnPrimary} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.btnPrimaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// HISTORY ITEM CARD
function HistoryCard({ item, onViewReceipt }) {
  return (
    <View style={styles.historyCard}>
      <View style={styles.historyLeft}>
        <Text style={styles.historyPeriod}>{item.period}</Text>
        <Text style={styles.historyMeta}>
          {item.paidOn ?? "Not paid"}{item.method ? ` · ${item.method}` : ""}
        </Text>
      </View>
      <View style={styles.historyRight}>
        <Text style={styles.historyAmount}>{format(item.amount)}</Text>
        <StatusPill status={item.status} />
        {item.status === "Paid" && item.receiptNo && (
          <TouchableOpacity onPress={() => onViewReceipt(item)} activeOpacity={0.7}>
            <Text style={styles.receiptLink}>Receipt</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// MAIN SCREEN
export default function TenantPayments() {
  const [showUpload, setShowUpload]     = useState(false);
  const [showInApp, setShowInApp]       = useState(false);
  const [showReceipt, setShowReceipt]   = useState(false);
  const [receiptPayment, setReceiptPayment] = useState(null);

  const [history, setHistory] = useState(PAYMENT_HISTORY);

  const days      = daysUntilDue();
  const currentPeriod = history[0];  
  const isPending = currentPeriod?.status === "Pending Approval";
  const isPaid    = currentPeriod?.status === "Paid";
  const isLate    = days < 0;

  function onPaymentSubmitted() {
    setHistory(prev =>
      prev.map((p, i) =>
        i === 0 ? { ...p, status: "Pending Approval", paidOn: new Date().toISOString().slice(0, 10) } : p
      )
    );
  }

  function openReceipt(payment) {
    setReceiptPayment(payment);
    setShowReceipt(true);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* MODALS */}
      <UploadProofModal
        visible={showUpload}
        onClose={() => setShowUpload(false)}
        onSubmit={() => { setShowUpload(false); onPaymentSubmitted(); }}
      />
      <InAppPayModal
        visible={showInApp}
        onClose={() => setShowInApp(false)}
        onSubmit={() => { setShowInApp(false); onPaymentSubmitted(); }}
      />
      <ReceiptModal
        visible={showReceipt}
        payment={receiptPayment}
        onClose={() => setShowReceipt(false)}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* HEADER */}
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.pageSub}>{TENANT.unit} · {TENANT.property}</Text>
          </View>
          <View style={[styles.scorePill, { borderColor: reliabilityColor(TENANT.reliabilityScore) }]}>
            <Text style={[styles.scoreText, { color: reliabilityColor(TENANT.reliabilityScore) }]}>
              {TENANT.reliabilityScore}
            </Text>
          </View>
        </View>

        {/* CURRENT RENT CARD */}
        <View style={styles.rentCard}>
          <View style={styles.rentCardTop}>
            <View>
              <Text style={styles.rentLabel}>April 2026 Rent</Text>
              <Text style={styles.rentAmount}>{format(TENANT.rentAmount)}</Text>
            </View>
            <StatusPill status={currentPeriod?.status ?? "Late"} />
          </View>

          {/* DUE BANNER */}
          {!isPaid && (
            <View style={[
              styles.dueBanner,
              { backgroundColor: days <= 3 ? C.dangerBg : C.surfaceAlt }
            ]}>
              <Text style={[styles.dueText, { color: days <= 3 ? C.danger : C.textSecondary }]}>
                {days > 0 ? (
                  <View style={styles.dueBannerContent}>
                    <Ionicons name="time-outline" size={16} color={C.textSecondary} />
                    <Text style={[styles.dueText, { color: C.textSecondary }]}>
                      Due in {days} day{days !== 1 ? "s" : ""} 
                    </Text>
                  </View>
                ) : days === 0 ? (
                  <View style={styles.dueBannerContent}>
                    <MaterialIcons name="warning-amber" size={16} color={C.warning} />
                    <Text style={[styles.dueText, { color: C.warning }]}>
                      Due today!
                    </Text>
                  </View>
                ) : (
                  <View style={styles.dueBannerContent}>
                    <MaterialIcons name="error" size={16} color={C.danger} />
                    <Text style={[styles.dueText, { color: C.danger }]}>
                      {Math.abs(days)} day{Math.abs(days) !== 1 ? "s" : ""} overdue
                    </Text>
                  </View>
                )}
              </Text>
            </View>
          )}

          {/* PENDING BANNER */}
          {isPending && (
            <View style={styles.pendingBanner}>
              <MaterialIcons name="pending-actions" size={16} color={C.warning} />
              <Text style={styles.pendingText}>
                Proof submitted — awaiting landlord approval
              </Text>
            </View>
          )}

          {/* PAID BANNER */}
          {isPaid && (
            <View style={styles.paidBanner}>
              <Ionicons name="checkmark-circle" size={16} color={C.success} />
              <Text style={styles.paidText}>
                Rent confirmed paid for this month
              </Text>
            </View>
          )}
        </View>

        {/* PAY ACTIONS */}
        {!isPaid && !isPending && (
          <>
            <SectionLabel title="Pay Now" />
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.actionCard, styles.actionCardPrimary]}
                onPress={() => setShowInApp(true)}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconContainer}>
                  <FontAwesome5 name="credit-card" size={24} color={C.primary} />
                </View>
                <Text style={styles.actionTitle}>Pay In-App</Text>
                <Text style={styles.actionSub}>Card, EFT, Wallet</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionCard, styles.actionCardSecondary]}
                onPress={() => setShowUpload(true)}
                activeOpacity={0.8}
              >
                <View style={styles.actionIconContainer}>
                  <Feather name="upload" size={24} color={C.textSecondary} />
                </View>
                <Text style={styles.actionTitle}>Upload Proof</Text>
                <Text style={styles.actionSub}>EFT slip or bank confirmation</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* UPLOAD PROOF OF PAYMENT IF STILL PENDING */}
        {isPending && (
          <>
            <SectionLabel title="Actions" />
            <TouchableOpacity
              style={styles.resubmitBtn}
              onPress={() => setShowUpload(true)}
              activeOpacity={0.8}
            >
              <Feather name="upload" size={16} color={C.warning} />
              <Text style={styles.resubmitText}>Resubmit Proof of Payment</Text>
            </TouchableOpacity>
          </>
        )}

        {/* PAYMENT HISTORY */}
        <SectionLabel title="Payment History" />

        {history.map(item => (
          <HistoryCard key={item.id} item={item} onViewReceipt={openReceipt} />
        ))}

        {/*LEASE INFORMATION */}
        <SectionLabel title="Lease Info" />
        <View style={styles.leaseCard}>
          {[
            ["Monthly Rent",  format(TENANT.rentAmount)],
            ["Due Every",     `1st of the month`],
            ["Lease Ends",    TENANT.leaseEnd],
          ].map(([label, val]) => (
            <View key={label} style={styles.leaseRow}>
              <Text style={styles.leaseLabel}>{label}</Text>
              <Text style={styles.leaseValue}>{val}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}



