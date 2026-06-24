"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import BlackButton from "../buttons/BlackButton";
import axios from "axios";

function UserRegistrationForm() {
    const [fullName, setFullName] = useState("");
    const [phone, setPhone] = useState("");
    const [dateOfBirth, setDateOfBirth] = useState("");
    const [gender, setGender] = useState("");
    const [address, setAddress] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (password !== password2) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post("/api/auth/register", {
                email,
                password,
                password2,
                full_name: fullName,
                phone,
                date_of_birth: dateOfBirth,
                gender,
                address,
            });

            const responseEmail = response.data?.email || email;
            setSuccess("Registration submitted. Check your email for the OTP.");
            router.push(`/verify-otp?email=${encodeURIComponent(responseEmail)}&role=patient`);
        } catch (err: any) {
            const message = err.response?.data?.error || err.response?.data || "Registration failed.";
            setError(typeof message === "string" ? message : "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full bg-white/95 border border-slate-100 dark:bg-slate-900/95 dark:border-slate-800 rounded-3xl shadow-xl p-8 backdrop-blur-md">
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Create an Account</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Join NexClinic to manage your health</p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2" htmlFor="full-name">
                            Full Name
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <input
                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                                id="full-name"
                                type="text"
                                placeholder="Full Name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                disabled={loading}
                                required
                                maxLength={100}
                                minLength={2}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2" htmlFor="phone">
                            Phone Number
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                            <input
                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                                id="phone"
                                type="tel"
                                placeholder="Phone: +94712345678"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                disabled={loading}
                                required
                                pattern="^\+94?[0-9\s\-]{10}$"
                                title="Please enter a valid Sri Lankan phone number"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2" htmlFor="date-of-birth">
                            Date of Birth
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <input
                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                                id="date-of-birth"
                                type={dateOfBirth ? "date" : "text"}
                                placeholder="Date of Birth"
                                value={dateOfBirth}
                                onChange={(e) => setDateOfBirth(e.target.value)}
                                onFocus={(e) => {
                                    e.target.type = "date";
                                }}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2" htmlFor="gender">
                            Gender
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <select
                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                                id="gender"
                                value={gender}
                                onChange={(e) => setGender(e.target.value)}
                                disabled={loading}
                                required
                            >
                                <option value="" disabled hidden>Gender</option>
                                <option value="Male" className="text-slate-800 dark:text-slate-100">Male</option>
                                <option value="Female" className="text-slate-800 dark:text-slate-100">Female</option>
                                <option value="Other" className="text-slate-800 dark:text-slate-100">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2" htmlFor="address">
                            Address
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                            </div>
                            <input
                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                                id="address"
                                type="text"
                                placeholder="Address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                disabled={loading}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2" htmlFor="email">
                            Email Address
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                            </div>
                            <input
                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                                id="email"
                                type="email"
                                placeholder="E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                                required
                                pattern="^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
                                title="Please enter a valid email address"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                                id="password"
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={loading}
                                required
                                pattern="^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$"
                                title="Password must contain at least one digit, one lowercase letter, one uppercase letter, and be at least 8 characters long"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2" htmlFor="confirm-password">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <svg className="h-5 w-5 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <input
                                className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all disabled:opacity-50"
                                id="confirm-password"
                                type="password"
                                placeholder="Confirm Password"
                                value={password2}
                                onChange={(e) => setPassword2(e.target.value)}
                                disabled={loading}
                                required
                                pattern="^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$"
                                title="Password must contain at least one digit, one lowercase letter, one uppercase letter, and be at least 8 characters long"
                            />
                        </div>
                    </div>
                </div>
                
                {error && (
                    <div className="rounded-xl border border-red-100 dark:border-red-900/50 bg-red-50 dark:bg-red-900/20 p-3 text-xs text-red-600 dark:text-red-400 font-medium">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="rounded-xl border border-green-100 dark:border-green-900/50 bg-green-50 dark:bg-green-900/20 p-3 text-xs text-green-600 dark:text-green-400 font-medium">
                        {success}
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
                            Creating...
                        </span>
                    ) : (
                        "Create Account"
                    )}
                </button>
            </form>

            <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 flex flex-col gap-2 text-center text-xs text-slate-500 dark:text-slate-400">
                <p>
                    Already have an account?{" "}
                    <a href="/login" className="font-semibold text-emerald-600 hover:underline">
                        Login here
                    </a>
                </p>
            </div>
        </div>
    );
}

export default UserRegistrationForm;