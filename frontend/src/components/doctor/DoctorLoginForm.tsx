"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

function EyeIcon({ open }: { open: boolean }) {
    return open ? (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    ) : (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.477 0-8.268-2.943-9.542-7a9.97 9.97 0 012.308-3.592M6.938 6.938A9.97 9.97 0 0112 5c4.477 0 8.268 2.943 9.542 7a9.97 9.97 0 01-1.356 2.608M6.938 6.938L3 3m3.938 3.938l10.124 10.124M3 3l18 18" />
        </svg>
    );
}

function DoctorLoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await axios.post("/api/auth/doctor/login", {
                username,
                password,
            });

            const { token, refreshToken, user } = response.data;
            const role = user?.role || "DOCTOR";

            localStorage.setItem("authToken", token);
            localStorage.setItem("refreshToken", refreshToken);
            localStorage.setItem("userRole", role);
            localStorage.setItem("userInfo", JSON.stringify({ ...user, role }));

            const secureFlag = window.location.protocol === "https:" ? "; secure" : "";
            document.cookie = `authToken=${token}; path=/; max-age=86400; samesite=lax${secureFlag}`;
            document.cookie = `userRole=${role}; path=/; max-age=86400; samesite=lax${secureFlag}`;

            router.push("/doctor-self/dashboard");
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
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10 w-full">
            {/* Header */}
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-600 mb-4 shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zM3 20a9 9 0 1118 0H3z" />
                    </svg>
                </div>
                <h2 className="text-2xl font-extrabold text-gray-800">Welcome Back, Doctor</h2>
                <p className="text-sm text-gray-500 mt-1">Sign in to access your dashboard</p>
            </div>

            {/* Form */}
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                {/* Email field */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="username" className="text-sm font-medium text-gray-700">
                        Email Address
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </span>
                        <input
                            id="username"
                            type="email"
                            placeholder="doctor@nexclinic.com"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            disabled={loading}
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-gray-800 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition disabled:opacity-60"
                        />
                    </div>
                </div>

                {/* Password field */}
                <div className="flex flex-col gap-1">
                    <label htmlFor="password" className="text-sm font-medium text-gray-700">
                        Password
                    </label>
                    <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400 pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </span>
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            required
                            className="w-full pl-10 pr-10 py-3 border border-gray-200 rounded-xl text-gray-800 text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition disabled:opacity-60"
                        />
                        <button
                            type="button"
                            tabIndex={-1}
                            className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-teal-600 transition"
                            onClick={() => setShowPassword((v) => !v)}
                            aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                            <EyeIcon open={showPassword} />
                        </button>
                    </div>
                </div>

                {/* Forgot password */}
                <div className="flex justify-end -mt-2">
                    <a href="/doctor/forgot-password" className="text-xs text-teal-600 hover:underline font-medium">
                        Forgot password?
                    </a>
                </div>

                {/* Error message */}
                {error && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-sm text-red-600">{error}</p>
                    </div>
                )}

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2 mt-1"
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin w-5 h-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                            </svg>
                            Signing in...
                        </>
                    ) : (
                        "Sign In"
                    )}
                </button>
            </form>

            {/* Footer */}
            <p className="mt-6 text-center text-sm text-gray-500">
                Don&apos;t have an account?{" "}
                <a href="/doctor/register" className="text-teal-600 hover:underline font-medium">
                    Register as a doctor
                </a>
            </p>
        </div>
    );
}

export default DoctorLoginForm;