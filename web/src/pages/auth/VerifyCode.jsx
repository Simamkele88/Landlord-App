// LANDLORD VERIFY RESET CODE PAGE

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Key, Loader2, Shield, ArrowLeft } from "lucide-react";
import axios from "axios";
import useDocumentTitle from "../../hooks/useDocumentTitle";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function VerifyCode() {
  useDocumentTitle("Verify Reset Code");
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleCodeChange(e) {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(digits);
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!code || code.length < 6) {
      setError("Please enter the 6-digit reset code");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Verify the code is valid
      await axios.post(`${API}/auth/verify-reset-code`, {
        email: email.trim().toLowerCase(),
        code: code,
      });

      // Redirect to reset password page with email and code
      navigate("/reset-password", {
        state: {
          email: email.trim().toLowerCase(),
          code: code,
        },
      });
    } catch (err) {
      if (err.code === "ERR_NETWORK") {
        setError("Unable to connect to server. Please check your connection.");
      } else if (err.response?.status === 400) {
        setError("Invalid or expired reset code. Please request a new one.");
      } else {
        setError("Verification failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

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
              <Shield size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Verify Reset Code</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Step 1 of 2</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Enter the 6-digit code sent to your email address.
          </p>

          {/* Error */}
          {error && (
            <div className="p-3 mb-4 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="name@company.com"
                required
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            {/* Reset Code */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Reset Code
              </label>
              <div className="relative">
                <Key size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={code}
                  onChange={handleCodeChange}
                  placeholder="000000"
                  required
                  maxLength={6}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 tracking-[8px] text-center text-lg font-bold dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>
              {code && code.length < 6 && (
                <p className="text-xs text-gray-400 mt-1">Enter all 6 digits</p>
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
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </button>

            <div className="text-center">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Didn't receive a code? Send again
              </Link>
            </div>
          </form>
        </div>

        <div className="text-center mt-4">
          <Link to="/login" className="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            <ArrowLeft size={14} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}