"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BlackButton from "../buttons/BlackButton";
import axios from "axios";

function DoctorRegistrationForm() {
    const [fullName, setFullName] = useState("");
    const [preferredName, setPreferredName] = useState("");
    const [nicNumber, setNicNumber] = useState("");
    const [specialization, setSpecialization] = useState("");
    const [specializationOptions, setSpecializationOptions] = useState<string[]>([]);
    const [specializationLoading, setSpecializationLoading] = useState(true);
    const [specializationFetchError, setSpecializationFetchError] = useState(false);
    const [licenseNumber, setLicenseNumber] = useState("");
    const [phone, setPhone] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [password2, setPassword2] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        const fetchSpecializations = async () => {
            try {
                const response = await axios.get("/api/doctor/specializations");
                const options = Array.isArray(response.data?.specializations)
                    ? response.data.specializations
                    : [];

                if (isMounted) {
                    setSpecializationOptions(options);
                    setSpecializationFetchError(options.length === 0);
                }
            } catch (fetchError) {
                console.error("Failed to fetch doctor specializations", fetchError);
                if (isMounted) {
                    setSpecializationOptions([]);
                    setSpecializationFetchError(true);
                }
            } finally {
                if (isMounted) {
                    setSpecializationLoading(false);
                }
            }
        };

        fetchSpecializations();

        return () => {
            isMounted = false;
        };
    }, []);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (specializationFetchError || specializationOptions.length === 0) {
            setError("Unable to load doctor specializations. Please refresh and try again.");
            return;
        }

        const matchedSpecialization = specializationOptions.find(
            (option) => option.toLowerCase() === specialization.trim().toLowerCase()
        );

        if (!matchedSpecialization) {
            setError("Please choose a valid specialization from the list.");
            return;
        }

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
                specialization: matchedSpecialization,
                license_number: licenseNumber,
                phone,
                full_name: fullName,
                preferred_name: preferredName,
                nic_number: nicNumber,
            });

            const responseEmail = response.data?.email || email;
            setSuccess("Registration submitted. Check your email for the OTP.");
            router.push(`/verify-otp?email=${encodeURIComponent(responseEmail)}`);
        } catch (err: unknown) {
            const message = axios.isAxiosError(err)
                ? err.response?.data?.error || err.response?.data || "Registration failed."
                : "Registration failed.";
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
                    maxLength={100}
                    minLength={2}
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
                    maxLength={100}
                    minLength={2}
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
                    minLength={10}
                    maxLength={12}
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
                    minLength={5}
                    maxLength={20}
                />
                <input
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="specialization"
                    type="text"
                    list="specialization-options"
                    placeholder={specializationLoading ? "Loading specializations..." : "Search and select specialization"}
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    disabled={loading || specializationLoading}
                    required
                />
                <datalist id="specialization-options">
                    {specializationOptions.map((option) => (
                        <option key={option} value={option} />
                    ))}
                </datalist>
                <p className="text-xs text-gray-400">
                    {specializationFetchError
                        ? "Specializations failed to load. Refresh the page."
                        : "Start typing to filter and choose a specialization."}
                </p>
                <input
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="phone"
                    type="tel"
                    placeholder="Phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={loading}
                    required
                    pattern="^\+94?[0-9\s\-]{10}$"
                    title="Please enter a valid Sri Lankan phone number"
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
                    pattern="^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$"
                    title="Please enter a valid email address"
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
                    pattern="^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$"
                    title="Password must contain at least one digit, one lowercase letter, one uppercase letter, and be at least 8 characters long"
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
                    pattern="^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$"
                    title="Password must contain at least one digit, one lowercase letter, one uppercase letter, and be at least 8 characters long"
                />
                {error && <p className="text-sm text-red-500">{error}</p>}
                {success && <p className="text-sm text-green-600">{success}</p>}
                <BlackButton
                    type="submit"
                    disabled={loading || specializationLoading || specializationOptions.length === 0}
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