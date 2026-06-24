"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function HospitalAdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await axios.post("/api/auth/hospital/login", {
        username: email,
        password,
      });
      const { token, refreshToken, user } = response.data;
      if (!user || user.role !== "HOSPITAL_ADMIN") {
        setError("You are not authorized to access the hospital admin portal.");
        setLoading(false);
        return;
      }
      localStorage.setItem("authToken", token);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userRole", "HOSPITAL_ADMIN");
      localStorage.setItem("userInfo", JSON.stringify({ ...user, role: "HOSPITAL_ADMIN" }));
      localStorage.setItem("isAuthenticated", "true");
      
      const secureFlag = window.location.protocol === "https:" ? "; secure" : "";
      document.cookie = `authToken=${token}; path=/; max-age=86400; samesite=lax${secureFlag}`;
      document.cookie = `userRole=HOSPITAL_ADMIN; path=/; max-age=86400; samesite=lax${secureFlag}`;
      
      router.push("/hospital/dashboard");
    } catch (err: any) {
      const backendError = err.response?.data?.error || err.response?.data?.detail;
      if (backendError) {
        setError(backendError);
      } else if (err.response?.status === 401) {
        setError("Incorrect email or password. Please try again.");
      } else if (err.response?.status === 400) {
        setError("Invalid input. Please check your credentials.");
      } else {
        setError("An error occurred. Please try again later.");
      }
      setEmail("");
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white/95 border border-slate-100 dark:bg-slate-900/95 dark:border-slate-800 rounded-3xl shadow-xl p-8 backdrop-blur-md">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Welcome Back</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please sign in to your admin account</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2" htmlFor="username">
            Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
              </svg>
            </div>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2" htmlFor="password">
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <svg className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-3 text-xs text-red-600 dark:text-red-400 font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl active:scale-[0.99] disabled:opacity-50"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Signing In...
            </span>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
        <p>
          Forgot password?{" "}
          <a href="/reset-password" className="font-semibold text-emerald-600 hover:underline">
            Reset here
          </a>
        </p>
        <p>
          Need to register your hospital?{" "}
          <a href="/hospital/contact" className="font-semibold text-emerald-600 hover:underline">
            Contact us
          </a>
        </p>
      </div>
    </div>
  );
}
