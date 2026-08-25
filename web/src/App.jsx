/* eslint-disable react-refresh/only-export-components */
// ROOT COMPONENT
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/landlord/Dashboard";
import DashboardLayout from "./Layout";
import PaymentsLayout from "./pages/landlord/payments/PaymentsLayout";
import InvoicesPage from "./pages/landlord/payments/Invoices";
import DepositsPage from "./pages/landlord/payments/Deposits";
import PaymentsListPage from "./pages/landlord/payments/PaymentsList";
import PaymentReview from "./pages/landlord/payments/PaymentReview";
import { ToastProvider } from "./contexts/ToastContext";
import { PaymentsProvider } from "./contexts/PaymentsContext";
import PaymentReceipt from "./pages/landlord/payments/PaymentReceipt";
import LandlordMaintenance from "./pages/landlord/maintenance/MaintenanceDashboard";
import PropertyDashboard from "./pages/landlord/properties/Properties";
import Tenants from "./pages/landlord/Tenants/Tenants";
import Units from "./pages/landlord/units/Units";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyCode from "./pages/auth/VerifyCode";
import CaretakerDashboard from "./pages/caretaker/Dashboard";
import CaretakerMaintenance from "./pages/caretaker/maintenance/Maintenance";
import CaretakerMaintenanceDetail from "./pages/caretaker/maintenance/MaintenanceDetail";
import CaretakerComplaints from "./pages/caretaker/complaints/Complaints";
import CaretakerComplaintDetail from "./pages/caretaker/complaints/ComplaintDetails";
import LandlordComplaints from "./pages/landlord/complaints/Complaints";
import LandlordComplaintDetail from "./pages/landlord/complaints/ComplaintDetail";
import Settings from "./pages/landlord/settings/Settings";
import TenantProfile from "./pages/landlord/Tenants/TenantProfile";
import Leases from "./pages/landlord/leases/Leases";
import RepaymentPlans from "./pages/landlord/payments/RepaymentPlans";
import PaymentSettings from "./pages/landlord/payments/PaymentSettings";
import LandlordMessages from "./pages/landlord/messages/Messages";
import Reports from "./pages/landlord/reports/Reports";
import MaintenanceDetail from "./pages/landlord/maintenance/MaintenanceDetail";
import LandlordCaretakers from "./pages/landlord/caretakers/Caretakers";
import LandlordCollections from "./pages/landlord/collections/Collections";
import CaretakerTenants from "./pages/caretaker/tenants/Tenants";
import CaretakerMessages from "./pages/caretaker/messages/Messages";
import CaretakerSettings from "./pages/caretaker/settings/Settings";
import NotificationsPage from "./pages/landlord/notifications/notifications";
import CaretakerNotificationsPage from "./pages/caretaker/notifications/notifications";
import PropertyDetails from "./pages/landlord/properties/PropertyDetails";
import PropertyCreate from "./pages/landlord/properties/PropertyCreate";
import AddTenantPage from "./pages/landlord/Tenants/AddTenantPage";
import LeaseSummary from "./pages/landlord/leases/LeaseSummary";
import UnitDetailsPage from "./pages/landlord/units/UnitDetailsPage";
import AddUnitPage from "./pages/landlord/units/AddUnit";
import InvoiceDetailPage from "./pages/landlord/payments/InvoiceDetails";
import LeaseCreate from "./pages/landlord/leases/LeaseCreate";
import DepositDetailPage from "./pages/landlord/payments/DepositDetails";
import CreateInvoice from "./pages/landlord/payments/InvoiceCreate";
import PaymentDetails from "./pages/landlord/payments/PaymentDetails";

import "./index.css";
import CaretakerRecurringIssues from "./pages/caretaker/maintenance/caretakerRecurringIssues";

export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  function login(newToken, newUser) {
    setToken(newToken);
    setUser(newUser);
  }

  function logout() {
    setToken(null);
    setUser(null);
    sessionStorage.removeItem("digest_shown");
  }

  const defaultPath = token
    ? user?.role === "caretaker"
      ? "/caretaker/dashboard"
      : "/landlord/dashboard"
    : "/login";

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      <PaymentsProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* PUBLIC  */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/verify-code" element={<VerifyCode />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* LANDLORD */}
              <Route path="/landlord" element={<DashboardLayout />}>
                <Route
                  index
                  element={<Navigate to="/landlord/dashboard" replace />}
                />
                <Route path="dashboard" element={<Dashboard />} />

                {/* Property */}
                <Route path="properties" element={<PropertyDashboard />} />
                <Route path="properties/:id" element={<PropertyDetails />} />
                <Route path="properties/create" element={<PropertyCreate />} />
                <Route path="units" element={<Units />} />
                <Route path="units/:id" element={<UnitDetailsPage />} />
                <Route path="units/add" element={<AddUnitPage />} />

                {/* Tenants */}
                <Route path="tenants" element={<Tenants />} />
                <Route path="tenants/:id" element={<TenantProfile />} />
                <Route path="tenants/create" element={<AddTenantPage />} />
                <Route path="leases" element={<Leases />} />
                <Route path="leases/:id" element={<LeaseSummary />} />
                <Route path="leases/create" element={<LeaseCreate />} />

                {/* People */}
                <Route path="caretakers" element={<LandlordCaretakers />} />

                {/* Payments */}
                <Route path="payments" element={<PaymentsLayout />}>
                  <Route index element={<Navigate to="invoices" replace />} />
                  <Route path="invoices" element={<InvoicesPage />} />
                  <Route path="deposits" element={<DepositsPage />} />
                  <Route path="history" element={<PaymentsListPage />} />
                  <Route path="plans" element={<RepaymentPlans />} />
                  <Route path="settings" element={<PaymentSettings />} />
                </Route>
                <Route path="payments/review/:id" element={<PaymentReview />} />
                <Route
                  path="payments/receipt/:id"
                  element={<PaymentReceipt />}
                />
                <Route path="payments/plans" element={<RepaymentPlans />} />
                <Route path="payments/settings" element={<PaymentSettings />} />
                <Route
                  path="payments/invoices/:id"
                  element={<InvoiceDetailPage />}
                />
                <Route
                  path="payments/deposits/:id"
                  element={<DepositDetailPage />}
                />
                <Route
                  path="payments/invoices/create"
                  element={<CreateInvoice />}
                />
                <Route path="payments/:id" element={<PaymentDetails />} />

                {/* Issues */}
                <Route path="maintenance" element={<LandlordMaintenance />} />
                <Route path="maintenance/:id" element={<MaintenanceDetail />} />
                <Route path="complaints" element={<LandlordComplaints />} />
                <Route
                  path="complaints/:id"
                  element={<LandlordComplaintDetail />}
                />
                <Route path="collections" element={<LandlordCollections />} />

                {/* Insights */}
                <Route path="reports" element={<Reports />} />
                <Route path="messages" element={<LandlordMessages />} />
                <Route path="notifications" element={<NotificationsPage />} />

                {/* Settings */}
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* CARETAKER */}
              <Route path="/caretaker" element={<DashboardLayout />}>
                <Route
                  index
                  element={<Navigate to="/caretaker/dashboard" replace />}
                />
                <Route path="dashboard" element={<CaretakerDashboard />} />
                <Route path="maintenance" element={<CaretakerMaintenance />} />
                <Route
                  path="maintenance/recurring"
                  element={<CaretakerRecurringIssues />}
                />
                <Route
                  path="maintenance/:id"
                  element={<CaretakerMaintenanceDetail />}
                />
                <Route path="complaints" element={<CaretakerComplaints />} />
                <Route
                  path="complaints/:id"
                  element={<CaretakerComplaintDetail />}
                />
                <Route path="tenants" element={<CaretakerTenants />} />
                <Route path="messages" element={<CaretakerMessages />} />
                <Route
                  path="notifications"
                  element={<CaretakerNotificationsPage />}
                />
                <Route path="settings" element={<CaretakerSettings />} />
              </Route>

              {/* CATCH-ALL  */}
              <Route path="/" element={<Navigate to={defaultPath} replace />} />
              <Route path="*" element={<Navigate to={defaultPath} replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </PaymentsProvider>
    </AuthContext.Provider>
  );
}
