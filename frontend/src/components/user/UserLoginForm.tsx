"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

function UserLoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");
    const [showOtpField, setShowOtpField] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [error, setError] = useState("");
    const [infoMessage, setInfoMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const router = useRouter();

    // Enforce OTP resend cooldown timer
    useEffect(() => {
        if (resendCooldown <= 0) return;
        const timer = setInterval(() => {
            setResendCooldown((prev) => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [resendCooldown]);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setInfoMessage("");
        setSuccessMessage("");
        setLoading(true);

        try {
            // Call the Next.js API route at /api/auth/login
            const response = await axios.post("/api/auth/login", {
                username,
                password,
            });

            if (response.data?.otp_required) {
                setShowOtpField(true);
                setInfoMessage("Verification Required: An OTP has been sent to your email address.");
                setResendCooldown(60);
                setLoading(false);
                return;
            }
            
            const { token, refreshToken, user } = response.data;
            const role = user?.role || "PATIENT";
            
            // Store tokens in localStorage
            localStorage.setItem("authToken", token);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("userRole", role);
            localStorage.setItem("userInfo", JSON.stringify({ ...user, role }));
            localStorage.setItem("user", JSON.stringify({ ...user, role }));
            localStorage.setItem("isAuthenticated", "true");

            const secureFlag = window.location.protocol === "https:" ? "; secure" : "";
            document.cookie = `authToken=${token}; path=/; max-age=86400; samesite=lax${secureFlag}`;
            document.cookie = `userRole=${role}; path=/; max-age=86400; samesite=lax${secureFlag}`;
            
            router.push("/user-self/dashboard");
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
            console.error("Login error:", err);
            
            setPassword("");
        } finally {
            if (!showOtpField) {
                setLoading(false);
            }
        }
    };

    const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setInfoMessage("");
        setSuccessMessage("");
        setLoading(true);

        try {
            const response = await axios.post("/api/auth/login/verify-otp", {
                email: username,
                otp: otp,
            });
            
            const { token, refreshToken, user } = response.data;
            const role = user?.role || "PATIENT";
            
            // Store tokens in localStorage
            localStorage.setItem("authToken", token);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("userRole", role);
            localStorage.setItem("userInfo", JSON.stringify({ ...user, role }));
            localStorage.setItem("user", JSON.stringify({ ...user, role }));
            localStorage.setItem("isAuthenticated", "true");

            const secureFlag = window.location.protocol === "https:" ? "; secure" : "";
            document.cookie = `authToken=${token}; path=/; max-age=86400; samesite=lax${secureFlag}`;
            document.cookie = `userRole=${role}; path=/; max-age=86400; samesite=lax${secureFlag}`;
            
            setSuccessMessage("Identity verified successfully! Redirecting...");
            
            setTimeout(() => {
                router.push("/user-self/dashboard");
            }, 1000);
        } catch (err: any) {
            const backendError = err.response?.data?.error || err.response?.data?.detail;
            setError(backendError || "Verification failed. Please check the code and try again.");
            setOtp("");
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        setError("");
        setInfoMessage("");
        setSuccessMessage("");
        setResending(true);

        try {
            const response = await axios.post("/api/auth/login/resend-otp", {
                email: username,
            });
            setSuccessMessage(response.data?.message || "OTP resent successfully.");
            setResendCooldown(60);
        } catch (err: any) {
            const backendError = err.response?.data?.error || err.response?.data?.detail;
            setError(backendError || "Failed to resend OTP. Please try again.");
        } finally {
            setResending(false);
        }
    };

    const handleBackToLogin = () => {
        setShowOtpField(false);
        setOtp("");
        setError("");
        setInfoMessage("");
        setSuccessMessage("");
    };

    return (
        <div className="w-full bg-white/95 border border-slate-100 dark:bg-slate-900/95 dark:border-slate-800 rounded-3xl shadow-xl p-8 backdrop-blur-md">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                    {showOtpField ? "Secure Verification" : "Welcome Back"}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {showOtpField ? "We sent a code to your registered email" : "Please sign in to your patient account"}
                </p>
            </div>

            {/* Custom Alert Popups */}
            {infoMessage && (
                <div className="mb-4 rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-950/20 p-3.5 text-xs text-blue-700 dark:text-blue-400 flex gap-2.5 items-start">
                    <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{infoMessage}</span>
                </div>
            )}

            {successMessage && (
                <div className="mb-4 rounded-xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3.5 text-xs text-emerald-700 dark:text-emerald-400 flex gap-2.5 items-start">
                    <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{successMessage}</span>
                </div>
            )}

            {error && (
                <div className="mb-4 rounded-xl border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/20 p-3.5 text-xs text-red-700 dark:text-red-400 flex gap-2.5 items-start">
                    <svg className="h-4 w-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{error}</span>
                </div>
            )}

            {!showOtpField ? (
                /* Primary Login Form */
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
            ) : (
                /* 2FA OTP Form */
                <form className="space-y-5" onSubmit={handleVerifyOtp}>
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2" htmlFor="otp">
                            6-Digit Verification Code
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <input
                                id="otp"
                                type="text"
                                maxLength={6}
                                pattern="[0-9]{6}"
                                inputMode="numeric"
                                placeholder="Enter 6-digit code"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                                disabled={loading || resending}
                                required
                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-10 pr-4 text-center tracking-[0.25em] text-lg font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading || resending}
                        className="w-full flex justify-center items-center rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl active:scale-[0.99] disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Securing Session...
                            </span>
                        ) : (
                            "Verify & Continue"
                        )}
                    </button>

                    <div className="flex justify-between items-center text-xs">
                        <button
                            type="button"
                            onClick={handleBackToLogin}
                            disabled={loading || resending}
                            className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium flex items-center gap-1 transition-all disabled:opacity-50"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to login
                        </button>

                        <button
                            type="button"
                            onClick={handleResendOtp}
                            disabled={resending || loading || resendCooldown > 0}
                            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-500 dark:hover:text-emerald-400 font-semibold disabled:text-slate-400 dark:disabled:text-slate-600 transition-all"
                        >
                            {resending ? (
                                "Sending..."
                            ) : resendCooldown > 0 ? (
                                `Resend code in ${resendCooldown}s`
                            ) : (
                                "Resend OTP"
                            )}
                        </button>
                    </div>
                </form>
            )}

            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
                {!showOtpField && (
                    <>
                        <p>
                            Forgot password?{" "}
                            <a href="/reset-password" className="font-semibold text-emerald-600 hover:underline">
                                Reset here
                            </a>
                        </p>
                        <p>
                            Don't have an account?{" "}
                            <a href="/register" className="font-semibold text-emerald-600 hover:underline">
                                Sign up here
                            </a>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

export default UserLoginForm;