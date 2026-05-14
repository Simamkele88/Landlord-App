// LOGIN PAGE
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../App";
import useDocumentTitle from "../../hooks/useDocumentTitle";

// SERVER URL 
const API =  "http://localhost:4000";

// LOGIN COMPONENT
export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  useDocumentTitle("Login");


  const [form, setForm] = useState({
    email: "",
    password: "",
    remember: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.email.trim() || !form.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    setError("");

    const credentials = {
      email: String(form.email).trim(),
      password: String(form.password),
    };

    try {
      let response = null;
      let determinedRole = null;

    
      try {
        response = await axios.post(`${API}/auth/landlord/login`, credentials);
        determinedRole = "landlord";
      } catch (landlordErr) {
        if (
          landlordErr.response?.status === 401 ||
          landlordErr.response?.status === 404
        ) {
      
          try {
            response = await axios.post(`${API}/auth/login`, credentials);
            determinedRole = response.data.user?.role ?? "caretaker";
          } catch (userErr) {
            const status = userErr.response?.status;
            if (status === 401) throw new Error("INVALID_CREDENTIALS");
            if (status === 403) throw new Error("ACCOUNT_DEACTIVATED");
            throw userErr;
          }
        } else if (landlordErr.response?.status === 403) {
          throw new Error("ACCOUNT_DEACTIVATED");
        } else {
          throw landlordErr;
        }
      }

      const { data } = response;

      if (!data.user.role) {
        data.user.role = determinedRole;
      }

      const storage = form.remember ? localStorage : sessionStorage;
      storage.setItem("token", data.token);
      storage.setItem("user", JSON.stringify(data.user));

      login(data.token, data.user);

      if (data.user.must_change_password) {
        navigate("/change-password", {
          state: {
            message: "Please change your temporary password to continue",
            isFirstLogin: true,
          },
        });
        return;
      }

      const roleRoutes = {
        landlord: "/landlord/dashboard",
        caretaker: "/caretaker/dashboard",
      };
      navigate(roleRoutes[data.user.role] ?? "/dashboard");

    } catch (err) {
      const msg = err.message;

      if (msg === "INVALID_CREDENTIALS") {
        setError("Invalid email or password. Please try again.");
      } else if (msg === "ACCOUNT_DEACTIVATED") {
        setError("Your account has been deactivated. Please contact the property owner.");
      } else if (err.response?.status === 401) {
        setError("Invalid email or password. Please try again.");
      } else if (err.response?.status === 403) {
        setError("Your account has been deactivated. Please contact the property owner.");
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.code === "ERR_NETWORK") {
        setError("Unable to connect to server. Please check your internet connection.");
      } else {
        setError("Login failed. Please try again later.");
      }
    } finally {
      setLoading(false);
    }
  }



  return (
    <div className="flex flex-col items-center justify-center px-6 pt-8 mx-auto md:h-screen md:pt-0 dark:bg-gray-900">
      <a
        href="#"
        className="flex items-center justify-center mb-8 text-2xl font-semibold lg:mb-10 dark:text-white"
      >
        <img
          src="/images/logo/logo.jpg"
          className="h-12 w-12 rounded-full object-cover shadow-md"
          alt="Logo"
        />
        <span className="ml-3">Chihwa Rentals</span>
      </a>

      <div className="w-full max-w-xl p-6 space-y-8 sm:p-8 bg-white rounded-lg shadow dark:bg-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sign in to platform
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Access your landlord or caretaker account
          </p>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-800 bg-red-50 rounded-lg dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Email */}
          <div>
            <label htmlFor="email" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Email address
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="name@company.com"
              className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                id="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908A3 3 0 0118 15m-6-6a3 3 0 00-3 3m11 6a9.97 9.97 0 01-3.358 3.358M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={form.remember}
                onChange={handleChange}
                className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 dark:focus:ring-primary-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <label htmlFor="remember" className="ml-2 text-sm font-medium text-gray-900 dark:text-gray-300">
                Remember me
              </label>
            </div>
            <Link to="/forgot-password" className="text-sm text-primary-600 hover:underline dark:text-primary-500">
              Forgot password?
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full px-5 py-3 text-base font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-primary-600 dark:hover:bg-primary-700 dark:focus:ring-primary-800 transition-colors"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}