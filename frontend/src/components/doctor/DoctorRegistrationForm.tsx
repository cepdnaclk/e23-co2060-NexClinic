"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import BlackButton from "../buttons/BlackButton";
import axios from "axios";

function DoctorRegistrationForm() {
    const [fullName, setFullName] = useState("");
    const [preferredName, setPreferredName] = useState("");
    const [nicNumber, setNicNumber] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [licenseNumber, setLicenseNumber] = useState("");
    const [phone, setPhone] = useState("");
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
            const response = await axios.post("/api/auth/doctor/register", {
                email,
                password,
                password2,
                specialization,
                license_number: licenseNumber,
                phone,
                full_name: fullName,
                preferred_name: preferredName,
                nic_number: nicNumber,
            });

            const responseEmail = response.data?.email || email;
            setSuccess("Registration submitted. Check your email for the OTP.");
            router.push(`/verify-otp?email=${encodeURIComponent(responseEmail)}`);
        } catch (err: any) {
            const message = err.response?.data?.error || err.response?.data || "Registration failed.";
            setError(typeof message === "string" ? message : "Registration failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col w-[320px] gap-4 p-6 bg-white items-center justify-center rounded-xl shadow-md">
            <div title="registration-card-header" className="mb-4 items-center dark:text-gray-900 text-2xl font-bold">
                <p>Welcome!</p>
            </div>
            <form
                title="registration-card-form"
                className="flex flex-col gap-4 mb-4 rounded-lg w-full"
                onSubmit={handleSubmit}
            >
                <input
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="full-name"
                    type="text"
                    placeholder="Full Name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    disabled={loading}
                    required
                />
                <input
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="preferred-name"
                    type="text"
                    placeholder="Preferred Name"
                    value={preferredName}
                    onChange={(e) => setPreferredName(e.target.value)}
                    disabled={loading}
                    required
                />
                <input
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="nic-number"
                    type="text"
                    placeholder="National Identity Card Number"
                    value={nicNumber}
                    onChange={(e) => setNicNumber(e.target.value)}
                    disabled={loading}
                    required
                />
                <input
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="license-number"
                    type="text"
                    placeholder="Sri Lanka Medical Council ID"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    disabled={loading}
                    required
                />
                <input
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="specialization"
                    type="text"
                    placeholder="Specialization"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    disabled={loading}
                    required
                />
                <input
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="phone"
                    type="tel"
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    required
                />
                <input
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="email"
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    required
                />
                <input
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    required
                />
                <input
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm Password"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    disabled={loading}
                    required
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && <p className="text-sm text-green-600">{success}</p>}
                <BlackButton
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 rounded-lg"
                >
                    <span className="text-white font-bold">
                        {loading ? "Creating..." : "Create Account"}
                    </span>
                </BlackButton>
            </form>
            <div title="registration-card-footer" className="mt-4 text-sm dark:text-gray-900">
                <p>Already have an account? <a href="/doctor/login" className="text-green-500 hover:underline">Login here</a></p>
            </div>
        </div>
    );
}

export default DoctorRegistrationForm;