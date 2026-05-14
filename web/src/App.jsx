/* eslint-disable react-refresh/only-export-components */
// ROOT COMPONENT OF THE APP, HANDLES ROUTING AND AUTHENTICATION STATE
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect, createContext, useContext } from "react";

import Login from "./pages/auth/Login";
import Dashboard from "./pages/landlord/Dashboard";
import LandlordLayout from "./layouts/LandlordLayout";
import Payments from "./pages/landlord/payments/Payments";
import PaymentReview from "./pages/landlord/payments/PaymentReview";
import { ToastProvider } from "./contexts/ToastContext";
import { PaymentsProvider } from "./contexts/PaymentsContext";
import PaymentReceipt from "./pages/landlord/payments/PaymentReceipt";
import LandlordMaintenance from "./pages/landlord/maintenance/MaintenanceDashboard"
import PropertyDashboard from "./pages/landlord/properties/Properties";
import Tenants from "./pages/landlord/Tenants/Tenants";
import Units from "./pages/landlord/units/Units";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import VerifyCode from "./pages/auth/VerifyCode";
import CaretakerLayout from "./layouts/CaretakerLayout";
import CaretakerDashboard from "./pages/caretaker/Dashboard"; 
import CaretakerMaintenance from "./pages/caretaker/maintenance/Maintenance";
import CaretakerMaintenanceDetail from "./pages/caretaker/maintenance/MaintenanceDetail";


import "./index.css";

// AUTHENTICATION CONTEXT TO MANAGE TOKEN AND USER STATE GLOBALLY
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// PROTECTED ROUTE COMPONENT, CHECKS FOR AUTHENTICATION TOKEN
function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2>
        <p className="text-gray-500 dark:text-gray-400">This page is coming soon.</p>
      </div>
    </div>
  );
}

// ROOT COMPONENT OF THE APP, HANDLES ROUTING AND AUTHENTICATION STATE
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

  function login(token, user) {
    setToken(token);
    setUser(user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      <PaymentsProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* PUBLIC ROUTES */}
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-code" element={<VerifyCode />} />

              {/* LANDLORD ROUTES */}
              <Route
                path="/landlord"
                element={
                  <PrivateRoute>
                    <LandlordLayout />
                  </PrivateRoute>
                }
              >
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="payments" element={<Payments />} />
                <Route path="payments/review" element={<PaymentReview />} />
                <Route path="payments/receipt" element={<PaymentReceipt />} />
                <Route path="maintenance" element={<LandlordMaintenance />} />
                <Route path="properties" element={<PropertyDashboard />} />
                <Route path="tenants" element={<Tenants />} />
                <Route path="units" element={<Units />} />
              </Route>

              {/*  CARETAKER ROUTES*/}
              <Route
                path="/caretaker"
                element={
                  <PrivateRoute>
                    <CaretakerLayout />
                  </PrivateRoute>
                }
              >
                <Route path="dashboard" element={<CaretakerDashboard />} />
                <Route path="maintenance" element={<CaretakerMaintenance />} />
                <Route path="maintenance/:id" element={<CaretakerMaintenanceDetail />} />
                <Route path="units" element={<PlaceholderPage title="Units" />} />
                <Route path="tenants" element={<PlaceholderPage title="Tenants" />} />
                <Route path="complaints" element={<PlaceholderPage title="Complaints" />} />
                <Route path="messages" element={<PlaceholderPage title="Messages" />} />
              </Route>

              {/* CATCH-ALL REDIRECT */}
              <Route
                path="*"
                element={
                  <Navigate
                    to={token ? (user?.role === "caretaker" ? "/caretaker/dashboard" : "/landlord/dashboard") : "/login"}
                    replace
                  />
                }
              />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </PaymentsProvider>
    </AuthContext.Provider>
  );
}