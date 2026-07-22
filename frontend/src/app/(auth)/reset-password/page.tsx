"use client";

import { FormEvent, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import GreenButton from "../../../components/buttons/GreenButton";
import axios from "axios";

function ResetPasswordPageContent() {

    const searchParams = useSearchParams();
    const router = useRouter();

    const uid = searchParams.get("uid");
    const token = searchParams.get("token");
    const roleParam = (searchParams.get("role") || "").toLowerCase();
    const isConfirmMode = Boolean(uid && token);

    const genericRequestSuccess = "If an account with that email exists, a password reset link has been sent.";

    const [email, setEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");


    const handleRequest = async (event: FormEvent<HTMLFormElement>) => {
        // post email to reset-request endpoint
        event.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            // Send email to backend
            await axios.post("/api/auth/reset-password/request", {
                email: email.trim().toLowerCase(),
            });

            setSuccess(genericRequestSuccess);
            setEmail("");   // Clear email input after submission


        } catch (err: any) {
            // For security, show the same generic message even on error
            setSuccess(genericRequestSuccess);
            setEmail("");
        } finally {
            setLoading(false);
        }

    };

    const handleConfirm = async (event: FormEvent<HTMLFormElement>) => {
        // validate match, post uid + token + passweord to reset-confirm endpoint
        event.preventDefault();
        setError("");
        setSuccess("");

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match. Please try again.");
            return;
        }

        // Validate password complexity (must match registration requirements)
        const passwordPattern = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
        if (!passwordPattern.test(newPassword)) {
            setError("Password must contain at least one digit, one lowercase letter, one uppercase letter, and be at least 8 characters long");
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post("/api/auth/reset-password/confirm", {
                uid: uid,
                token: token,
                new_password: newPassword,
            });

            setSuccess("Your password has been reset successfully. You can now log in with your new password.");
            setNewPassword("");
            setConfirmPassword("");

            // clear client auth state (if any)
            localStorage.removeItem("authToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("userRole");
            localStorage.removeItem("userInfo");

            // expire cookies
            document.cookie = "authToken=; path=/; max-age=0; samesite=lax";
            document.cookie = "userRole=; path=/; max-age=0; samesite=lax";

            // Resolve role from API response first, then query param fallback.
            const responseRoleRaw = String(response?.data?.role || response?.data?.user?.role || "").toLowerCase();
            const resolvedRole = responseRoleRaw.includes("doctor")
                ? "doctor"
                : roleParam.includes("doctor")
                    ? "doctor"
                    : "patient";
            const nextPath = resolvedRole === "doctor" ? "/doctor/login" : "/login";

            // Wait briefly before redirecting to the role-specific login page.
            setTimeout(() => {
                router.replace(nextPath);
            }, 2000);

        } catch (err: any) {
            const errorMsg = err.response?.data?.error || "Failed to reset password. The link may be invalid or expired.";
            setError(errorMsg);

        } finally {
            setLoading(false);
        }
    };


    return isConfirmMode ? (

        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Reset Password</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Enter your email address and we will send a password reset link.
                </p>
                <form onSubmit={handleConfirm} className="space-y-4">
                    <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={loading}
                                className="mt-1 p-2 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white pr-10"
                                placeholder="Enter new Password"
                                required
                                pattern="^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$"
                                title="Password must contain at least one digit, one lowercase letter, one uppercase letter, and be at least 8 characters long"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1"
                                tabIndex={-1}
                            >
                                {showNewPassword ? (
                                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Confirm Password
                        </label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                disabled={loading}
                                className="mt-1 p-2 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white pr-10"
                                placeholder="Confirm new Password"
                                required
                                pattern="^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$"
                                title="Password must contain at least one digit, one lowercase letter, one uppercase letter, and be at least 8 characters long"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-3 mt-1"
                                tabIndex={-1}
                            >
                                {showConfirmPassword ? (
                                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>


                    {error && (
                        <div className="text-red-500">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="text-green-500">
                            {success}
                        </div>
                    )}

                    <div>
                        <GreenButton
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 px-4 rounded-md"
                        >
                            {loading ? "Resetting..." : "Reset Password"}

                        </GreenButton>
                    </div>
                </form>
            </div>
        </div>

    ) : (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
            <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Reset Password</h1>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Enter your new password and confirm it to reset your password.
                </p>
                <form onSubmit={handleRequest} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Email Address
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={loading}
                            className="mt-1 p-2 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white"
                            placeholder="you@example.com"
                            required

                        />
                    </div>
                    {error && (
                        <div className="text-red-500">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="text-green-500">
                            {success}
                        </div>
                    )}

                    <div>
                        <GreenButton
                            type="submit"
                            disabled={loading}
                            className="w-full py-2 px-4 rounded-md"
                        >
                            {loading ? "Sending..." : "Send Reset Link"}

                        </GreenButton>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-500">
                Loading...
            </div>
        }>
            <ResetPasswordPageContent />
        </Suspense>
    );
}