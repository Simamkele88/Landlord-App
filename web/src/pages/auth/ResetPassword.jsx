// LANDLORD RESET PASSWORD PAGE — STEP 2


import { useState } from "react";
import { Link, useNavigate, useLocation, Navigate } from "react-router-dom";
import { Lock, Loader2, CheckCircle, Eye, EyeOff, ArrowLeft } from "lucide-react";
import axios from "axios";
import useDocumentTitle from "../../hooks/useDocumentTitle";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function ResetPassword() {
  useDocumentTitle("Reset Password");
  const navigate = useNavigate();
  const location = useLocation();

  // Get email and code from previous page
  const email = location.state?.email;
  const code = location.state?.code;

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if no email/code in state (user skipped verify page)
  if (!email || !code) {
    return <Navigate to="/forgot-password" replace />;
  }

  function validate() {
    if (!newPassword) return "New password is required";
    if (newPassword.length < 8) return "Password must be at least 8 characters";
    if (newPassword !== confirmPassword) return "Passwords do not match";
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(`${API}/auth/reset-password`, {
        email: email,
        code: code,
        newPassword: newPassword,
      });

      setSuccess(true);
    } catch (err) {
      if (err.code === "ERR_NETWORK") {
        setError("Unable to connect to server. Please check your connection.");
      } else {
        setError(err.response?.data?.error || "Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // SUCCESS
  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Password Reset Successful
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Your password has been updated. You can now log in.
            </p>

            <button
              onClick={() => navigate("/login")}
              className="w-full px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // RESET PASSWORD FORM
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link to="/login" className="flex items-center justify-center mb-8">
          <img
            src="/images/logo/logo.jpg"
            className="h-12 w-12 object-cover shadow-md"
            alt="Logo"
          />
          <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">Chihwa Rentals</span>
        </Link>

        <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Lock size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Set New Password</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Step 2 of 2</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Choose a new password for <strong className="text-gray-700 dark:text-gray-300">{email}</strong>.
          </p>

          {/* Error */}
          {error && (
            <div className="p-3 mb-4 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                  placeholder="At least 8 characters"
                  required
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                placeholder="Re-enter your password"
                required
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        </div>

        <div className="text-center mt-4">
          <Link to="/verify-code" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            <ArrowLeft size={14} />
            Back to Verify Code
          </Link>
        </div>
      </div>
    </div>
  );
}