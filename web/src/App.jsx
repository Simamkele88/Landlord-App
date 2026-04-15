/* eslint-disable react-refresh/only-export-components */
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

import "./index.css";

// ── Auth Context ──────────────────────────────────────────────
export const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

// ── Protected Route ───────────────────────────────────────────
function PrivateRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

// ── Root App ──────────────────────────────────────────────────
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
              {/* Public */}
              <Route path="/login" element={<Login />} />

              {/* Protected landlord area with sidebar layout */}
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
              </Route>

              {/* Default redirect */}
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