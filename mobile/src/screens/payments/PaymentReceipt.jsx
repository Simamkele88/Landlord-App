// TENANT PAYMENT RECEIPT PAGE
import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { C, F } from "../../styles/theme";

function fmt(amount) {
  return `R ${Number(amount || 0).toLocaleString("en-ZA")}`;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return String(dateStr).slice(0, 10);
    return date.toLocaleDateString("en-ZA", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(dateStr).slice(0, 10);
  }
}

function formatPeriod(startStr) {
  if (!startStr) return "—";
  try {
    const date = new Date(startStr);
    if (isNaN(date.getTime())) return String(startStr).slice(0, 7);
    return date.toLocaleDateString("en-ZA", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return String(startStr).slice(0, 7);
  }
}

export default function PaymentReceipt() {
  const navigation = useNavigation();
  const route = useRoute();
  const { payment } = route.params || {};
  const [downloading, setDownloading] = useState(false);

  if (!payment) {
    return (
      <SafeAreaView style={S.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={C.surface} />
        <View style={S.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={S.backBtn}
          >
            <Feather name="arrow-left" size={20} color={C.textPrimary} />
          </TouchableOpacity>
          <Text style={S.headerTitle}>Receipt</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={S.centerBlock}>
          <Feather name="file-text" size={40} color="#cccccc" />
          <Text style={S.emptyText}>Receipt not found</Text>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={S.goBackBtn}
          >
            <Text style={S.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const dateFormatted = payment.payment_date || payment.paidOn
    ? formatDate(payment.payment_date || payment.paidOn)
    : "—";

  const period =
    payment.period || payment.billing_period_start
      ? payment.period || formatPeriod(payment.billing_period_start)
      : "—";

  const method = payment.payment_method || payment.method || "—";
  const reference = payment.bank_reference || payment.reference || "—";
  const receiptNo =
    payment.receipt_no || payment.receiptNo || `RCP-${String(payment.id || "").slice(0, 8)}`;
  const tenantName = payment.tenant_name || "Tenant";
  const unitInfo = payment.unit_number ? `Unit ${payment.unit_number}` : "—";
  const propertyName = payment.property_name || "—";
  const amount = payment.amount_paid || payment.amount || 0;
  const invoiceNo = payment.invoice_number || payment.invoiceNo || "—";

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const html = `
        <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body { font-family: -apple-system, Helvetica, Arial, sans-serif; padding: 30px; color: #000; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1px solid #ddd; padding-bottom: 15px; margin-bottom: 20px; }
            .header-left { display: flex; align-items: center; gap: 10px; }
            .logo { width: 40px; height: 40px; background: #eaf2f8; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 22px; border: 1px solid #b0cfe0; }
            .company { font-weight: 600; font-size: 16px; color: #000; }
            .property { font-size: 12px; color: #666; }
            .header-right { text-align: right; }
            .badge { display: inline-block; background: #eef5e8; padding: 4px 12px; border-radius: 12px; border: 1px solid #c5d9b8; font-size: 11px; font-weight: 500; color: #2b7a4b; }
            .receipt-no { font-size: 12px; color: #888; margin-top: 4px; }
            .title { text-align: center; margin-bottom: 20px; }
            .title h1 { font-size: 24px; font-weight: 600; margin: 0; }
            .title p { font-size: 13px; color: #888; margin: 4px 0 0; }
            .section { margin-bottom: 18px; }
            .section-label { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 6px; }
            .tenant-box { background: #f9fafb; border: 1px solid #e9ecef; padding: 12px 16px; border-radius: 4px; }
            .tenant-name { font-weight: 500; font-size: 14px; }
            .tenant-unit { font-size: 13px; color: #555; }
            .detail-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #f1f3f5; }
            .detail-label { font-size: 13px; color: #555; font-weight: 500; }
            .detail-value { font-size: 13px; font-weight: 400; }
            .total-row { display: flex; justify-content: space-between; padding: 12px 0 6px; border-top: 2px solid #e9ecef; margin-top: 6px; }
            .total-label { font-size: 15px; font-weight: 600; }
            .total-value { font-size: 18px; font-weight: 700; color: #2b7a4b; }
            .partial-note { background: #faf6ed; border: 1px solid #e5dbb8; padding: 10px 14px; border-radius: 4px; margin-top: 12px; font-size: 12px; color: #8b6e1a; }
            .footer { border-top: 1px solid #ddd; margin-top: 25px; padding-top: 12px; text-align: center; font-size: 11px; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-left">
              <div>
                <div class="company">Chihwa Rentals</div>
                <div class="property">${propertyName}</div>
              </div>
            </div>
            <div class="header-right">
              <div class="receipt-no">${receiptNo}</div>
            </div>
          </div>
          <div class="title">
            <h1>Payment Receipt</h1>
            <p>Official record of payment</p>
          </div>
          <div class="section">
            <div class="section-label">Tenant</div>
            <div class="tenant-box">
              <div class="tenant-name">${tenantName}</div>
              <div class="tenant-unit">${unitInfo} · ${propertyName}</div>
            </div>
          </div>
          <div class="section">
            <div class="section-label">Payment Details</div>
            ${[
              ["Invoice", invoiceNo],
              ["Period", period],
              ["Due Date", formatDate(payment.due_date)],
              ["Paid On", dateFormatted],
              ["Method", method],
              ["Reference", reference],
            ]
              .map(
                ([label, val]) =>
                  `<div class="detail-row"><span class="detail-label">${label}</span><span class="detail-value">${val}</span></div>`
              )
              .join("")}
          </div>
          <hr style="border: none; border-top: 1px solid #e9ecef; margin: 16px 0;" />
          <div class="section">
            <div class="section-label">Amount Breakdown</div>
            ${[
              ["Rent", fmt(payment.allocated_rent || payment.rent_amount)],
              payment.allocated_utilities > 0 &&
                ["Utilities", fmt(payment.allocated_utilities)],
              payment.allocated_late_fees > 0 &&
                ["Late Fees", fmt(payment.allocated_late_fees)],
            ]
              .filter(Boolean)
              .map(
                ([label, val]) =>
                  `<div class="detail-row"><span class="detail-label">${label}</span><span class="detail-value">${val}</span></div>`
              )
              .join("")}
            <div class="total-row">
              <span class="total-label">Total Paid</span>
              <span class="total-value">${fmt(amount)}</span>
            </div>
          </div>
          ${
            payment.remaining_balance && payment.remaining_balance > 0
              ? `<div class="partial-note">* Partial payment received. ${fmt(
                  payment.remaining_balance
                )} still outstanding.</div>`
              : ""
          }
          <div class="footer">
            Approved by Landlord · Issued ${formatDate(new Date().toISOString())}
            <br />
            Official payment receipt · Chihwa Rentals
          </div>
        </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      if (uri) {
        await Sharing.shareAsync(uri, {
          mimeType: "application/pdf",
          dialogTitle: "Download Receipt",
          UTI: "com.adobe.pdf",
        });
      }
    } catch (error) {
      console.error("PDF error:", error);
      Alert.alert("Download failed", error.message || "Unknown error");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <SafeAreaView style={S.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={C.surface} />

      {/* HEADER */}
      <View style={S.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={S.backBtn}
        >
          <Feather name="arrow-left" size={20} color={C.textPrimary} />
        </TouchableOpacity>
        <Text style={S.headerTitle}>Receipt</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={S.scroll} contentContainerStyle={S.scrollPad}>
        {/* SUCCESS HEADER */}
        <View style={S.receiptHeader}>
          <View style={S.checkCircle}>
            <Ionicons name="checkmark" size={30} color="#ffffff" />
          </View>
          <Text style={S.receiptTitle}>Payment Receipt</Text>
          <Text style={S.receiptSub}>Verified and approved by landlord</Text>
          <View style={S.receiptBadge}>
            <Text style={S.receiptBadgeText}>{receiptNo}</Text>
          </View>
        </View>

        {/* DETAILS */}
        <View style={S.detailCard}>
          <Text style={S.detailCardTitle}>RECEIPT DETAILS</Text>
          {[
            ["Tenant", tenantName],
            ["Unit", `${unitInfo} · ${propertyName}`],
            ["Period", period],
            ["Payment Method", method],
            ["Date Paid", dateFormatted],
            ["Reference", reference],
          ].map(([label, val]) => (
            <View key={label} style={S.detailRow}>
              <Text style={S.detailLabel}>{label}</Text>
              <Text style={S.detailValue} numberOfLines={1}>
                {val}
              </Text>
            </View>
          ))}
          <View style={S.totalRow}>
            <Text style={S.totalLabel}>Amount Paid</Text>
            <Text style={S.totalValue}>{fmt(amount)}</Text>
          </View>
        </View>

        <Text style={S.footnote}>
          This receipt serves as official proof of payment. Keep this for your
          records.
        </Text>
      </ScrollView>

      {/* FOOTER */}
      <View style={S.footer}>
        <TouchableOpacity
          style={S.btnDownload}
          onPress={handleDownloadPDF}
          disabled={downloading}
          activeOpacity={0.8}
        >
          {downloading ? (
            <ActivityIndicator size="small" color={C.primary} />
          ) : (
            <>
              <Feather name="download" size={14} color={C.primary} />
              <Text style={S.btnDownloadText}>DOWNLOAD PDF</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={S.btnClose}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={S.btnCloseText}>CLOSE</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const S = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.background },
  centerBlock: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  emptyText: { color: C.textMuted, fontSize: 14, fontFamily: F.mono },
  goBackBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  goBackText: { color: C.primary, fontSize: 12, fontFamily: F.mono },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  backBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: C.textPrimary,
    fontFamily: F.bebas,
    letterSpacing: 1,
  },
  scroll: { flex: 1 },
  scrollPad: { padding: 16 },

  receiptHeader: { alignItems: "center", paddingVertical: 24, marginBottom: 20 },
  checkCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.green,
    borderWidth: 3,
    borderColor: "rgba(43,122,75,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  receiptTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: C.textPrimary,
    fontFamily: F.bebas,
    letterSpacing: 1,
    marginBottom: 4,
  },
  receiptSub: { fontSize: 12, color: C.textMuted, fontFamily: F.mono },
  receiptBadge: {
    backgroundColor: "rgba(43,122,75,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: "rgba(43,122,75,0.15)",
    marginTop: 10,
  },
  receiptBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: C.green,
    fontFamily: F.mono,
    letterSpacing: 0.5,
  },

  detailCard: {
    backgroundColor: C.card,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    marginBottom: 16,
  },
  detailCardTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#888888",
    fontFamily: F.mono,
    letterSpacing: 2,
    textTransform: "uppercase",
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  detailLabel: { fontSize: 12, color: C.textMuted, fontFamily: F.mono },
  detailValue: {
    fontSize: 12,
    fontWeight: "600",
    color: C.textPrimary,
    fontFamily: F.dm,
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#f9fafb",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: C.textPrimary,
    fontFamily: F.bebas,
    letterSpacing: 0.5,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "700",
    color: C.primary,
    fontFamily: F.bebas,
    letterSpacing: 1,
  },

  footnote: {
    fontSize: 10,
    color: "#888888",
    fontFamily: F.mono,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 16,
  },

  footer: {
    flexDirection: "row",
    gap: 10,
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.surface,
  },
  btnDownload: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 13,
    borderRadius: 3,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: C.border,
  },
  btnDownloadText: {
    fontSize: 12,
    fontWeight: "600",
    color: C.primary,
    fontFamily: F.dm,
    letterSpacing: 1,
  },
  btnClose: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 3,
    backgroundColor: C.primary,
  },
  btnCloseText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: F.dm,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
});