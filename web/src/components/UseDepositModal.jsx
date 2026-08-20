// src/components/UseDepositModal.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { useToast } from "../contexts/ToastContext";
import { Icon } from "./Icon";
import { FiX } from "react-icons/fi";

const API = "http://localhost:4000";

function formatAmount(n) {
    return n ? `R ${Number(n).toLocaleString("en-ZA")}` : "—";
}

export default function UseDepositModal({
    deposit,
    invoiceId = null,
    invoiceNumber = null,
    invoiceRemainingBalance = null,   // optional, required when invoiceId is provided
    onClose,
    onSuccess,
}) {
    const toast = useToast();
    const [invoices, setInvoices] = useState([]);
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(invoiceId || "");
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Available deposit amount
    const available = Math.max(
        0,
        Number(deposit.amount_held ?? deposit.amount ?? 0) -
        Number(deposit.amount_refunded ?? 0) -
        Number(deposit.used_amount ?? 0)
    );

    // Determine the maximum amount that can be used:
    // - If invoiceId is passed, use the provided remaining balance (or available if not provided)
    // - Otherwise, use the selected invoice's remaining balance from the fetched list
    const selectedInvoice = invoiceId
        ? null
        : invoices.find(i => i.id === selectedInvoiceId) || null;

    const maxUse = invoiceId
        ? Math.min(available, Number(invoiceRemainingBalance) || available)
        : Math.min(available, selectedInvoice ? Number(selectedInvoice.remaining_balance) : 0);

    // Fetch invoices only when no invoiceId is passed
    useEffect(() => {
        if (invoiceId) return; // skip fetching

        async function fetchInvoices() {
            try {
                const token = localStorage.getItem("token");
                const { data } = await axios.get(`${API}/landlord/payments/invoices`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { tenant_id: deposit.tenant_id, status: "sent,overdue,partial" },
                });
                setInvoices(data.invoices || []);
            } catch (err) {
                console.error("Failed to fetch invoices:", err);
            }
        }
        fetchInvoices();
    }, [deposit.tenant_id, invoiceId]);

    function handleAmountChange(e) {
        const val = e.target.value;
        if (val === "" || (Number(val) >= 0 && Number(val) <= maxUse + 0.01)) {
            setAmount(val);
            setError("");
        } else {
            setError(`Amount exceeds maximum allowed (${formatAmount(maxUse)})`);
        }
    }

    async function handleSubmit() {
        if (!selectedInvoiceId || !amount || Number(amount) <= 0) {
            setError("Please enter a valid amount.");
            return;
        }
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            await axios.post(`${API}/landlord/payments/deposits/${deposit.id}/use`, {
                invoice_id: selectedInvoiceId,
                amount: Number(amount),
                notes,
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("Deposit applied to invoice.");
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || "Failed to use deposit.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem', background: 'rgba(44,62,80,0.5)',
        }}>
            <div style={{
                width: '100%', maxWidth: 460, background: '#fdfdfd',
                border: '1px solid #e9ecef', borderRadius: '3px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '1rem 1.5rem', borderBottom: '1px solid #e9ecef',
                }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#000' }}>Use Deposit</h3>
                    <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#95a5a6' }}>
                        <FiX size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '1.2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                    <div style={{ background: '#f9fafb', border: '1px solid #e9ecef', padding: '0.8rem' }}>
                        <p style={{ fontSize: '12px', color: '#333', marginBottom: '0.3rem' }}>TENANT</p>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: '#000' }}>{deposit.tenant_name || "Unknown"}</p>
                        <p style={{ fontSize: '12px', color: '#333' }}>
                            Unit {deposit.unit_number || "—"} • Available: {formatAmount(available)}
                        </p>
                    </div>

                    {/* Invoice: fixed display if invoiceId provided, else dropdown */}
                    {invoiceId ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>Apply to Invoice</label>
                            <div style={{
                                padding: '0.4rem 0.7rem', fontSize: '14px',
                                background: '#f5f5f5', border: '1px solid #dee2e6',
                                color: '#000', borderRadius: '2px',
                            }}>
                                {invoiceNumber || invoiceId}
                                {invoiceRemainingBalance !== null && (
                                    <span style={{ color: '#555', marginLeft: '0.5rem' }}>
                                        ({formatAmount(invoiceRemainingBalance)} remaining)
                                    </span>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>Apply to Invoice</label>
                            <select
                                value={selectedInvoiceId}
                                onChange={e => { setSelectedInvoiceId(e.target.value); setAmount(""); setError(""); }}
                                style={{
                                    width: '100%', padding: '0.4rem 0.7rem', fontSize: '14px',
                                    background: '#fdfdfd', border: '1px solid #dee2e6',
                                    color: '#000', outline: 'none', borderRadius: '2px',
                                }}
                            >
                                <option value="">Select invoice...</option>
                                {invoices.map(inv => (
                                    <option key={inv.id} value={inv.id}>
                                        {inv.invoice_number} — {formatAmount(inv.remaining_balance)} remaining
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Amount */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>Amount (R)</label>
                        <input
                            type="number"
                            value={amount}
                            onChange={handleAmountChange}
                            min="0"
                            max={maxUse}
                            step="0.01"
                            style={{
                                width: '100%', padding: '0.4rem 0.7rem', fontSize: '14px',
                                background: '#fdfdfd', border: '1px solid #dee2e6',
                                color: '#000', outline: 'none', borderRadius: '2px',
                            }}
                        />
                        <span style={{ fontSize: '12px', color: '#333' }}>
                            Max: {formatAmount(maxUse)}
                        </span>
                        <div style={{
                            marginTop: '0.8rem',
                            padding: '0.6rem 0.8rem',
                            background: '#eaf2f8',
                            border: '1px solid #b0cfe0',
                            borderRadius: '2px',
                            color: '#1e4a6b',
                            fontSize: '12px',
                        }}>
                            <p style={{ margin: 0 }}>
                                A <strong>deposit replenishment invoice</strong> will be automatically created for the amount used. The tenant will be notified and expected to pay it to restore the deposit.
                            </p>
                        </div>
                    </div>

                    {/* Notes */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                        <label style={{ fontSize: '12px', fontWeight: 500, color: '#333' }}>Notes (optional)</label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            style={{
                                width: '100%', padding: '0.4rem 0.7rem', fontSize: '14px',
                                background: '#fdfdfd', border: '1px solid #dee2e6',
                                color: '#000', outline: 'none', resize: 'vertical', borderRadius: '2px',
                            }}
                        />
                    </div>

                    {error && <p style={{ fontSize: '13px', color: '#9e3a3a' }}>{error}</p>}
                </div>

                {/* Footer */}
                <div style={{
                    display: 'flex', gap: '0.8rem', padding: '1rem 1.5rem 1.5rem',
                    borderTop: '1px solid #e9ecef',
                }}>
                    <button onClick={onClose} disabled={loading} style={{
                        flex: 1, padding: '0.4rem', borderRadius: '2px', fontSize: '14px',
                        fontWeight: 400, background: '#fdfdfd', color: '#000',
                        border: '1px solid #ccc', cursor: 'pointer',
                    }}>Cancel</button>
                    <button onClick={handleSubmit} disabled={loading || !selectedInvoiceId || !amount} style={{
                        flex: 1, padding: '0.4rem', borderRadius: '2px', fontSize: '14px',
                        fontWeight: 500, border: 'none', cursor: 'pointer',
                        background: '#2c3e50', color: '#ffffff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                    }}>
                        {loading ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#ffffff', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} /> : "Use Deposit"}
                    </button>
                </div>
            </div>
        </div>
    );
}