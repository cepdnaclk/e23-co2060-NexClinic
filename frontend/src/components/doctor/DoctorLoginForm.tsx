"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import BlackButton from "../buttons/BlackButton";
import axios from "axios";

function DoctorLoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {

        // Prevent refreshing the entire page
        event.preventDefault();

        // Set errors to empty
        setError("");

        // Set loading 
        setLoading(true);

        try {
            // Call the Next.js API route at /api/auth/doctor/login which proxies to Django backend
            const response = await axios.post("/api/auth/doctor/login", {
                username,
                password,
            });

            const { token, refreshToken, user } = response.data;
            const role = user?.role || "DOCTOR";

            // Store tokens in localStorage
            localStorage.setItem("authToken", token);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("userRole", role);
            localStorage.setItem("userInfo", JSON.stringify({ ...user, role }));

            const secureFlag = window.location.protocol === "https:" ? "; secure" : "";
            document.cookie = `authToken=${token}; path=/; max-age=86400; samesite=lax${secureFlag}`;
            document.cookie = `userRole=${role}; path=/; max-age=86400; samesite=lax${secureFlag}`;

            // Redirect to doctor dashboard after successful login
            router.push("/doctor-self/dashboard");
            // router.push("/doctor-self/profile");

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

            setUsername("");
            setPassword("");
            console.error("Login error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full bg-white/95 border border-slate-100 dark:bg-slate-900/95 dark:border-slate-800 rounded-3xl shadow-xl p-8 backdrop-blur-md">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Welcome Back Doctor!</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Please sign in to your account</p>
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
                            id="username"
                            type="email"
                            placeholder="Enter your email"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                            className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-10 pr-10 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute inset-y-0 right-0 flex items-center pr-3"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <svg className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            ) : (
                                <svg className="h-5 w-5 text-slate-400 hover:text-slate-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                            )}
                        </button>
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
                            Logging in...
                        </span>
                    ) : (
                        "Login"
                    )}
                </button>
            </form>

            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
                <p>
                    Forgot password?{" "}
                    <a href="/reset-password?role=doctor" className="font-semibold text-emerald-600 hover:underline">
                        Reset here
                    </a>
                </p>
                <p>
                    Don't have an account?{" "}
                    <a href="/doctor/register" className="font-semibold text-emerald-600 hover:underline">
                        Sign up here
                    </a>
                </p>
            </div>
        </div>
    );
}

export default DoctorLoginForm;