// ── Login Page ───────────────────────────────────────────────
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../../App";
import useDocumentTitle from "../../hooks/useDocumentTitle";


const API = "http://localhost:4000";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  useDocumentTitle("Login");

  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError(""); 
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data } = await axios.post(`${API}/auth/login`, form);
      login(data.token, data.user);
      // Save token (localStorage if remember, else sessionStorage)
      if (form.remember) {
        localStorage.setItem("token", data.token);
      } else {
        sessionStorage.setItem("token", data.token);
      }
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed. Try again.");
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
        <img src="/images/logo.jpg" className="h-12 w-12 rounded-full object-cover shadow-md" alt="Logo" />
        <span>Chihwa Rentals</span>
      </a>

      <div className="w-full max-w-xl p-6 space-y-8 sm:p-8 bg-white rounded-lg shadow dark:bg-gray-800">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sign in to platform
        </h2>

        {error && (
          <div className="p-3 text-sm text-red-800 bg-red-100 rounded-lg">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Your email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              value={form.email}
              onChange={handleChange}
              required
              placeholder="name@company.com"
              className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Your password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              value={form.password}
              onChange={handleChange}
              required
              placeholder="••••••••"
              className="bg-gray-50 border border-gray-300 text-gray-900 sm:text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                checked={form.remember}
                onChange={handleChange}
                className="w-4 h-4 border-gray-300 rounded bg-gray-50 dark:bg-gray-700 dark:border-gray-600"
              />
            </div>

            <div className="ml-3 text-sm">
              <label
                htmlFor="remember"
                className="font-medium text-gray-900 dark:text-white"
              >
                Remember me
              </label>
            </div>

            <a
              href="#"
              className="ml-auto text-sm text-primary-700 hover:underline dark:text-primary-500"
            >
              Lost Password?
            </a>
          </div>
          
           <button
            type="submit"
            disabled={loading}
            className="w-full px-5 py-3 text-base font-medium text-white bg-primary-700 rounded-lg hover:bg-primary-800 disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login to your account"}
          </button>

          
        </form>
      </div>
    </div>
  );

}