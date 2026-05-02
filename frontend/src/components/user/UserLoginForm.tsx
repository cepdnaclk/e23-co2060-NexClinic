"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import BlackButton from "../buttons/BlackButton";
import axios from "axios";

function UserLoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            // Call the Next.js API route at /api/auth/login which proxies to Django backend
            const response = await axios.post("/api/auth/login", {
                username,
                password,
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
            
            // Redirect to patient dashboard after successful login
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
            
            setUsername("");
            setPassword("");
            
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col w-[300px] gap-4 p-6 bg-white items-center justify-center rounded-xl shadow-md">
            <div title="login-card-header" className="mb-4 items-center dark:text-gray-900 text-2xl font-bold">
                <p>Welcome Back!</p>
            </div>
            <form
                title="login-card-form"
                className="flex flex-col gap-4 mb-4 rounded-lg w-full"
                onSubmit={handleSubmit}
            >
                <input
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="username"
                    type="email"
                    placeholder="Enter your email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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
                    <p className="text-sm text-red-500 mt-1">
                        {error}
                    </p>
                )}
                <BlackButton
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 rounded-lg"
                >
                    <span className="text-white font-bold">
                        {loading ? "Logging in..." : "Login"}
                    </span>
                </BlackButton>
            </form>
            <div title="login-card-footer" className="mt-4 text-sm dark:text-gray-900">
                <p>Don't have an account? <a href="/register" className="text-green-500 hover:underline">Sign up here</a></p>
            </div>
        </div>
    );
}

export default UserLoginForm;