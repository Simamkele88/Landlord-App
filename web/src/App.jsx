/* eslint-disable react-refresh/only-export-components */
// ROOT COMPONENT OF THE APP, HANDLES ROUTING AND AUTHENTICATION STATE
// ASK SIMAMKELE WEKEZA IF YOU HAVE ANY QUESTIONS ABOUT THIS CODE, HE WROTE IT AND KNOWS IT BEST. DO NOT ASSUME ANYTHING ABOUT THIS CODE WITHOUT ASKING HIM FIRST.
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
import LandlordMaintenance from "./pages/landlord/maintenance/MaintenanceDashbord"
import PropertyDashboard from "./pages/landlord/properties/Properties";
import Tenants from "./pages/landlord/Tenants/Tenants";
import Units from "./pages/landlord/units/Units";


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
              {/* THE ONLY PUBLIC ROUTE */}
              <Route path="/login" element={<Login />} />

              {/* LANDLORD AREA WITH SIDE BAR AND TOP BAR */}
              <Route
                path="/landlord"
                element={
                  <PrivateRoute>
                    <LandlordLayout />
                  </PrivateRoute>
                }
              >
                {/* ROUTE THAT ARE ADDED TO THE LANDLORD LAYOUT */}
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="payments" element={<Payments />} />
                <Route path="payments/review" element={<PaymentReview />} />
                <Route path="payments/receipt" element={<PaymentReceipt />} />
                <Route path="maintenance" element={<LandlordMaintenance />} />
                <Route path="properties"  element={<PropertyDashboard />} />
                <Route path="tenants"  element={<Tenants />} />
                <Route path="units"  element={<Units />} /> 
              </Route>

            {/* REDIRECT TO LOGIN ROUTE IF THERE IS NO TOKEN, ELSE REDIRECT TO DASHBOARD */}
              <Route
                path="*"
                element={
                  <Navigate
                    to={token ? "/landlord/dashboard" : "/login"}
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