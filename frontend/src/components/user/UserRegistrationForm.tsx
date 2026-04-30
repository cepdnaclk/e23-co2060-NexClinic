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
        <div className="flex flex-col w-[330px] gap-4 p-6 bg-white items-center justify-center rounded-xl shadow-md">
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
                <input
                    className="w-full shadow appearance-none border rounded-lg py-2 px-3 bg-white text-gray-400 leading-tight focus:outline-none focus:shadow-outline"
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
                <select
                    className="w-full shadow appearance-none border rounded-lg py-2 px-3 bg-white text-gray-400 leading-tight focus:outline-none focus:shadow-outline"
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    disabled={loading}
                    required
                >
                    <option value="">Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                </select>
                <input
                    className="w-full shadow appearance-none border rounded-lg py-2 px-3 bg-white text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="address"
                    type="text"
                    placeholder="Address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    disabled={loading}
                    required
                />
                <input
                    className="w-full shadow appearance-none border rounded-lg py-2 px-3 bg-white text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
                    className="w-full shadow appearance-none border rounded-lg py-2 px-3 bg-white text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
                    disabled={loading}
                    className="w-full py-2 px-4 rounded-lg"
                >
                    <span className="text-white font-bold">
                        {loading ? "Creating..." : "Create Account"}
                    </span>
                </BlackButton>
            </form>
            <div title="registration-card-footer" className="mt-4 text-sm dark:text-gray-900">
                <p>Already have an account? <a href="/login" className="text-green-500 hover:underline">Login here</a></p>
            </div>
        </div>
    );
}

export default UserRegistrationForm;