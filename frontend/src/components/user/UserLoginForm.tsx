"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import BlackButton from "../buttons/BlackButton";

function UserLoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/auth", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                // Store user data in localStorage
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("isAuthenticated", "true");
                
                // Redirect to dashboard
                router.push("/user-self/dashboard");
            } else {
                setError(data.message || "Login failed");
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col w-[300px] gap-4 p-6 bg-white items-center justify-center rounded-xl shadow-md">
            <div title="login-card-header" className="mb-4 items-center dark:text-gray-900 text-2xl font-bold">
                <p>Welcome Back!</p>
            </div>
            <form title="login-card-form" className="flex flex-col gap-4 mb-4 rounded-lg w-full" onSubmit={handleSubmit}>
                <input
                    className="shadow appearance-none border rounded-lg py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="username"
                    type="email"
                    placeholder="Username: Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                />
                <input
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                />
                {error && (
                    <p className="text-sm text-red-500 mt-1">
                        {error}
                    </p>
                )}
                <BlackButton 
                    type="submit" 
                    className="w-full py-2 px-4 rounded-lg hover:bg-gray-800 focus:outline-none focus:shadow-outline"
                    disabled={loading}
                >
                    <span className="text-white font-bold">{loading ? "Loading..." : "Login"}</span>
                </BlackButton>
            </form>
            <div title="login-card-footer" className="mt-4 text-sm dark:text-gray-900">
                <p>Don't have an account? <a href="/register" className="text-green-500 hover:underline">Sign up here</a></p>
            </div>
        </div>
    );
}


export default UserLoginForm;