/* eslint-disable react-refresh/only-export-components */
// PAYMENTS CONTEXT - MANAGES PAYMENT DATA AND ACTIONS
// AUTHOR: SIMAMKELE WEKEZA
// IF YOU DO NOT UNDERSTAND THIS CODE, PLEASE ASK ME TO EXPLAIN AND DON'T ASSUME OTHERWISE.
import { createContext, useContext, useState } from 'react';

const PaymentsContext = createContext(null);

export function usePayments() {
  const context = useContext(PaymentsContext);
  if (!context) {
    throw new Error('usePayments must be used within a PaymentsProvider');
  }
  return context;
}

// MOCK PAYMENT DATA 
const INITIAL_PAYMENTS = [
  { id: 1, tenant: "Sipho Dlamini", unit: "Unit 4A", property: "Hillbrow Heights", amount: 6500, due: "2026-04-01", paid: "2026-04-01", method: "Upload", proof: true, status: "Paid" },
  { id: 2, tenant: "Lerato Mokoena", unit: "Unit 2B", property: "Hillbrow Heights", amount: 5800, due: "2026-04-01", paid: "2026-04-03", method: "Upload", proof: true, status: "Pending Approval" },
  { id: 3, tenant: "Ahmed Patel", unit: "Unit 1C", property: "Berea Flats", amount: 7200, due: "2026-04-01", paid: null, method: null, proof: false, status: "Late" },
  { id: 4, tenant: "Nomsa Khumalo", unit: "Unit 3A", property: "Berea Flats", amount: 6000, due: "2026-04-01", paid: "2026-03-30", method: "In-App", proof: false, status: "Paid" },
  { id: 5, tenant: "Thabo Nkosi", unit: "Unit 5D", property: "Yeoville Corner", amount: 5500, due: "2026-04-01", paid: null, method: null, proof: false, status: "Collections" },
  { id: 6, tenant: "Priya Naidoo", unit: "Unit 2A", property: "Yeoville Corner", amount: 6800, due: "2026-04-01", paid: "2026-04-02", method: "Upload", proof: true, status: "Pending Approval" },
  { id: 7, tenant: "Kabelo Sithole", unit: "Unit 6B", property: "Hillbrow Heights", amount: 5200, due: "2026-04-01", paid: "2026-04-01", method: "In-App", proof: false, status: "Paid" },
  { id: 8, tenant: "Zanele Moyo", unit: "Unit 1A", property: "Berea Flats", amount: 7500, due: "2026-04-01", paid: null, method: null, proof: false, status: "Late" },
];

// PAYMENTS PROVIDER - MANAGES PAYMENT STATE AND ACTIONS
export function PaymentsProvider({ children }) {
  const [payments, setPayments] = useState(INITIAL_PAYMENTS);

  const approvePayment = (id) => {
    setPayments(prev => 
      prev.map(p => p.id === id ? { ...p, status: "Paid" } : p)
    );
  };

  const rejectPayment = (id, reason) => {
    setPayments(prev => 
      prev.map(p => p.id === id ? { ...p, status: "Rejected", rejectionReason: reason } : p)
    );
  };

  const sendToCollections = (id) => {
    setPayments(prev => 
      prev.map(p => p.id === id ? { ...p, status: "Collections" } : p)
    );
  };

  const value = {
    payments,
    approvePayment,
    rejectPayment,
    sendToCollections,
  };

  return (
    <PaymentsContext.Provider value={value}>
      {children}
    </PaymentsContext.Provider>
  );
}