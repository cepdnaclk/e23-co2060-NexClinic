"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

// Shape of user data used by this dashboard UI.
interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    profileImage?: string;
}

export default function UserDashboard() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Support both new and legacy localStorage keys.
        const userData = localStorage.getItem("userInfo") || localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    // Fallback display name for cases where full name is not available.
    const displayName = user?.name || user?.email?.split("@")[0] || "User";

    return (
        // Main page container for dashboard content.
        <div className="mx-3 sm:mx-4 mt-4 sm:mt-6 mb-6 sm:mb-8 space-y-4">
            {/* Welcome header card */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {user?.profileImage ? (
                        <Image
                            src={user.profileImage}
                            alt={displayName}
                            width={64}
                            height={64}
                            className="rounded-full object-cover border-4 border-blue-500 mx-auto sm:mx-0"
                        />
                    ) : (
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white mx-auto sm:mx-0">
                            {displayName.split(" ").map(n => n[0]).join("").toUpperCase()}
                        </div>
                    )}
                    <div className="text-center sm:text-left min-w-0">
                        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white break-words">Welcome back, {displayName}!</h1>
                        <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">Here is your health dashboard overview.</p>
                    </div>
                </div>
            </div>

            {/* Top summary statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Appointments</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">3</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Consultations</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">12</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Prescriptions</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">2</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Health Score</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">95%</p>
                </div>
            </div>

            <div className="flex w-full gap-4 flex-col xl:flex-row">
                {/* Action shortcuts */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
                    <h2 className="text-xl font-bold text-green-500 dark:text-green-400">Quick Actions</h2>
                    <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>
                    <div className="space-y-3">
                        <button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg transition">New Appointment</button>
                        <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition">Message Doctor</button>
                        <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition">View Records</button>
                    </div>
                </div>

                {/* Informational highlight */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
                    <h2 className="text-xl font-bold text-green-500 dark:text-green-400">Health Tip of the Day</h2>
                    <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Stay hydrated! Aim to drink at least 8 glasses of water daily to maintain optimal health and energy levels.
                    </p>
                </div>
            </div>
            {/* Main two-column content area */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {/* Recent chats */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-xl font-bold text-green-500 dark:text-green-400">Recent Chats</h2>
                        <Link
                            href="/user-self/chats"
                            className="px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition"
                        >
                            View All Chats
                        </Link>
                    </div>
                    <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>

                    <div className="space-y-3">
                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold text-gray-900 dark:text-white">Dr. Sarah Johnson</p>
                                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-500 text-white">
                                    2
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                                Please continue the medication for 5 more days and update me if symptoms persist.
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">10 min ago</p>
                        </div>

                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold text-gray-900 dark:text-white">Dr. Michael Chen</p>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Yesterday</span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                                Your latest test report looks normal. We can discuss details at your next appointment.
                            </p>
                        </div>

                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <p className="font-semibold text-gray-900 dark:text-white">Dr. Emily Davis</p>
                                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-500 text-white">
                                    1
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                                Kindly share your updated blood pressure readings before the follow-up consultation.
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">1 hour ago</p>
                        </div>
                    </div>
                </div>

                {/* Right-side utility cards */}
                <div className="space-y-4">
                    {/* Upcoming appointments list */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-xl font-bold text-green-500 dark:text-green-400">Upcoming Appointments</h2>
                            <Link
                                href="/user-self/appointments"
                                className="px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition"
                            >
                                View All Appointments
                            </Link>
                        </div>
                        <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>
                        <div className="space-y-3">
                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                                    <p className="font-semibold text-gray-900 dark:text-white break-words">Dr. Sarah Johnson</p>
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                        Confirmed
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">General Checkup</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">March 2, 2026 • 10:00 AM</p>
                            </div>

                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                                    <p className="font-semibold text-gray-900 dark:text-white break-words">Dr. Michael Chen</p>
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                        Confirmed
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Dental Cleaning</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">March 5, 2026 • 2:30 PM</p>
                            </div>

                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                                    <p className="font-semibold text-gray-900 dark:text-white break-words">Dr. Emily Davis</p>
                                    <span className="text-xs font-semibold px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                                        Upcoming
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Follow-up Consultation</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">March 8, 2026 • 11:00 AM</p>
                            </div>
                        </div>
                    </div>



                </div>
            </div>
        </div>
    );
}