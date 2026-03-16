"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import BlackButton from "../../../components/buttons/BlackButton"; //fix this line
import axios from "axios";
import VerifyOTPNavBar from "@/components/HomePage/VerifyOTPNavBar";

function VerifyOtpPageContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        const prefillEmail = searchParams.get("email");
        if (prefillEmail && !email) {
            setEmail(prefillEmail);
        }
    }, [searchParams, email]);

    const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");
        setLoading(true);

        try {
            const response = await axios.post("/api/auth/verify-otp", {
                email,
                otp,
            });
            setSuccess(response.data?.message || "Account verified successfully.");
                // Redirect to login page after successful verification
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
        } catch (err: any) {
            setError(err.response?.data?.error || "Verification failed.");
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setError("");
        setSuccess("");
        setResending(true);

        try {
            const response = await axios.post("/api/auth/resend-otp", { email });
            setSuccess(response.data?.message || "OTP resent successfully.");
        } catch (err: any) {
            setError(err.response?.data?.error || "Resend failed.");
        } finally {
            setResending(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen items-center justify-center px-4">
            <div title="home-nav-bar" className="fixed w-full top-0 left-0 z-10">
                <VerifyOTPNavBar/>
            </div>

            <div className="absolute w-screen h-screen -z-10">
                <img className="w-full h-full object-cover opacity-40"
                    src="/images/verify-otp-bg.jpg"
                    alt="Nexaura Logo"
                />
            </div>
            <div className="flex w-[320px] flex-col gap-4 rounded-xl bg-white p-6 shadow-md">
                <div className="text-center text-2xl font-bold text-gray-900">
                    <p>Verify Your Email</p>
                </div>
                <form className="flex flex-col gap-4" onSubmit={handleVerify}>
                    <input
                        className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="email"
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading || resending}
                        required
                    />
                    <input
                        className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="otp"
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        disabled={loading || resending}
                        required
                    />
                    {error && <p className="text-sm text-red-500">{error}</p>}
                    {success && <p className="text-sm text-green-600">{success}</p>}
                    <BlackButton type="submit" disabled={loading} className="w-full rounded-lg">
                        <span className="text-white font-bold">
                            {loading ? "Verifying..." : "Verify"}
                        </span>
                    </BlackButton>
                </form>
                <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending || !email}
                    className="text-sm text-green-600 hover:underline disabled:text-gray-400"
                >
                    {resending ? "Sending..." : "Resend OTP"}
                </button>
            </div>
        </div>
    );
}

function VerifyOtpFallback() {
    return (
        <div className="flex flex-col min-h-screen items-center justify-center px-4">
            <div title="home-nav-bar" className="fixed w-full top-0 left-0 z-10">
                <VerifyOTPNavBar />
            </div>

            <div className="absolute w-screen h-screen -z-10">
                <img
                    className="w-full h-full object-cover opacity-40"
                    src="/images/verify-otp-bg.jpg"
                    alt="Nexaura Logo"
                />
            </div>

            <div className="flex w-[320px] flex-col gap-4 rounded-xl bg-white p-6 shadow-md">
                <div className="text-center text-2xl font-bold text-gray-900">
                    <p>Verify Your Email</p>
                </div>
                <p className="text-sm text-gray-500 text-center">Loading...</p>
            </div>
        </div>
    );
}

export default function VerifyOtpPage() {
    return (
        <Suspense fallback={<VerifyOtpFallback />}>
            <VerifyOtpPageContent />
        </Suspense>
    );
}
