"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import BlackButton from "@/components/buttons/BlackButton";
import Image from "next/image";
import axios from "axios";

function HospitalAdminLoginForm() {
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
            const response = await axios.post("/api/auth/login", {
                username: email,
                password,
                role: "HOSPITAL_ADMIN"
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
        <div className="flex flex-col w-[300px] gap-4 p-6 bg-white items-center justify-center rounded-xl shadow-md">
            <div className="mb-4 items-center dark:text-gray-900 text-2xl font-bold">
                <p>Hospital Admin Login</p>
            </div>
            <form className="flex flex-col gap-4 mb-4 rounded-lg w-full" onSubmit={handleSubmit}>
                <input
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="email"
                    type="email"
                    placeholder="Enter your email"
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
                {error && (
                    <p className="text-sm text-red-500 mt-1">{error}</p>
                )}
                <BlackButton type="submit" disabled={loading} className="w-full py-2 px-4 rounded-lg">
                    <span className="text-white font-bold">{loading ? "Logging in..." : "Login"}</span>
                </BlackButton>
            </form>
            <div className="mt-1 text-sm dark:text-gray-900">
                <p>Forgot password? <a href="/reset-password" className="text-green-500 hover:underline">Reset here</a></p>
            </div>
            <div className="mt-1 text-sm dark:text-gray-900">
                <p>Need to register your hospital? <a href="/hospital/contact" className="text-green-500 hover:underline">Contact us</a></p>
            </div>
        </div>
    );
}

export default HospitalAdminLoginForm;
