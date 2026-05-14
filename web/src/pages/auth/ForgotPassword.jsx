// LANDLORD FORGOT PASSWORD PAGE


import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import axios from "axios";
import useDocumentTitle from "../../hooks/useDocumentTitle";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000";

export default function ForgotPassword() {
  useDocumentTitle("Forgot Password");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axios.post(`${API}/auth/forgot-password`, { 
        email: email.trim().toLowerCase() 
      });
      setSubmitted(true);
    } catch (err) {
      if (err.code === "ERR_NETWORK") {
        setError("Unable to connect to server. Please check your connection.");
      } else {
        setError(err.response?.data?.error || "Failed to send reset code. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  // SUCCESS STATE — CODE SENT
  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Check Your Email
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
              If an account exists for <span className="font-semibold text-gray-700 dark:text-gray-300">{email}</span>, 
              a 6-digit reset code has been sent.
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
              The code expires in 15 minutes. Check your spam folder if you don't see it.
            </p>
            
            <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 mb-6">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Enter the code on the reset password page to set a new password.
              </p>
            </div>

            <Link
              to="/verify-code"
              className="inline-flex items-center justify-center w-full px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors mb-3"
            >
              Enter Reset Code
            </Link>

            <Link
              to="/login"
              className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ArrowLeft size={14} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // FORGOT PASSWORD FORM
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            Forgot Password
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Enter your email address and we'll send you a 6-digit reset code.
          </p>

          {/* ERROR */}
          {error && (
            <div className="p-3 mb-4 text-sm text-red-800 bg-red-50 rounded-lg border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-4"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Sending Code...
                </>
              ) : (
                "Send Reset Code"
              )}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ArrowLeft size={14} />
                Back to Login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}