"use client";

import React, { FormEvent, useState } from "react";
import BlackButton from "../buttons/BlackButton";

function UserLoginForm() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        // TODO: Replace this with your real authentication logic
        const isValid = password === "password123"; // example only

        if (!isValid) {
            setError("Incorrect email or password. Please try again.");
        } else {
            setError("");
            // proceed with successful login flow here
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
                    type="text"
                    placeholder="Username: Enter your email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <input
                    className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                {error && (
                    <p className="text-sm text-red-500 mt-1">
                        {error}
                    </p>
                )}
                <BlackButton
                    type="submit"
                    className="w-full py-2 px-4 rounded-lg hover:bg-gray-800 focus:outline-none focus:shadow-outline"
                >
                    <span className="text-white font-bold">Login</span>
                </BlackButton>
            </form>
            <div title="login-card-footer" className="mt-4 text-sm dark:text-gray-900">
                <p>Don't have an account? <a href="/register" className="text-green-500 hover:underline">Sign up here</a></p>
            </div>
        </div>
    );
}

export default UserLoginForm;