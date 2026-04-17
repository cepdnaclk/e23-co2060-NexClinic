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

    const stats = [
        { label: "Upcoming Appointments", value: "3" },
        { label: "Total Consultations", value: "12" },
        { label: "Active Prescriptions", value: "2" },
    ];

    const recentChats = [
        {
            doctor: "Dr. Sarah Johnson",
            unread: "2",
            message: "Please continue the medication for 5 more days and update me if symptoms persist.",
            time: "10 min ago",
        },
        {
            doctor: "Dr. Michael Chen",
            unread: "",
            message: "Your latest test report looks normal. We can discuss details at your next appointment.",
            time: "Yesterday",
        },
        {
            doctor: "Dr. Emily Davis",
            unread: "1",
            message: "Kindly share your updated blood pressure readings before the follow-up consultation.",
            time: "1 hour ago",
        },
    ];

    const upcomingAppointments = [
        {
            doctor: "Dr. Sarah Johnson",
            status: "Confirmed",
            statusClass: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
            type: "General Checkup",
            time: "March 2, 2026 - 10:00 AM",
        },
        {
            doctor: "Dr. Michael Chen",
            status: "Confirmed",
            statusClass: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
            type: "Dental Cleaning",
            time: "March 5, 2026 - 2:30 PM",
        },
        {
            doctor: "Dr. Emily Davis",
            status: "Upcoming",
            statusClass: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
            type: "Follow-up Consultation",
            time: "March 8, 2026 - 11:00 AM",
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                    <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 xl:items-start xl:justify-between">
                        <div className="w-full flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
                            {user?.profileImage ? (
                                <Image
                                    src={user.profileImage}
                                    alt={displayName}
                                    width={72}
                                    height={72}
                                    className="rounded-full object-cover border-4 border-blue-500 mx-auto sm:mx-0 shrink-0"
                                />
                            ) : (
                                <div className="w-18 h-18 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white mx-auto sm:mx-0 shrink-0">
                                    {displayName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                </div>
                            )}
                            <div className="text-center sm:text-left min-w-0">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white break-words">
                                    Welcome back, {displayName}!
                                </h1>
                                <p className="mt-2 text-sm sm:text-base text-gray-600 dark:text-gray-400">
                                    Here is your health dashboard overview.
                                </p>
                            </div>
                        </div>

                        <div className="w-full xl:max-w-md bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
                            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h2>
                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-3">
                                <Link href="/user-self/book-appointment" className="w-full">
                                    <button className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded-lg transition">
                                        New Appointment
                                    </button>
                                </Link>
                                <Link href="/user-self/chats" className="w-full">
                                    <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition">
                                        Ask Doctor
                                    </button>
                                </Link>
                                <Link href="/user-self/profile" className="w-full">
                                    <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded-lg transition">
                                        View Prescriptions
                                    </button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg bg-gray-50 dark:bg-gray-700/30 p-4 sm:p-5">
                        <h2 className="text-lg sm:text-xl font-bold text-green-600 dark:text-green-400">Health Tip of the Day</h2>
                        <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-3"></div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            Stay hydrated! Aim to drink at least 8 glasses of water daily to maintain optimal health and energy levels.
                        </p>
                    </div>
                </section>

                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {stats.map((item) => (
                        <div key={item.label} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-5">
                            <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{item.value}</p>
                        </div>
                    ))}
                </section>

                <section className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 h-full">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h2 className="text-xl font-bold text-green-600 dark:text-green-400">Recent Chats</h2>
                            <Link
                                href="/user-self/chats"
                                className="px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition text-center"
                            >
                                View All Chats
                            </Link>
                        </div>
                        <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>

                        <div className="space-y-3">
                            {recentChats.map((chat) => (
                                <div
                                    key={`${chat.doctor}-${chat.time}`}
                                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="font-semibold text-gray-900 dark:text-white break-words">{chat.doctor}</p>
                                        {chat.unread ? (
                                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-green-500 text-white shrink-0">
                                                {chat.unread}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">{chat.time}</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{chat.message}</p>
                                    {chat.unread ? <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{chat.time}</p> : null}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 h-full">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h2 className="text-xl font-bold text-green-600 dark:text-green-400">Upcoming Appointments</h2>
                            <Link
                                href="/user-self/appointments"
                                className="px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition text-center"
                            >
                                View All Appointments
                            </Link>
                        </div>
                        <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>

                        <div className="space-y-3">
                            {upcomingAppointments.map((appointment) => (
                                <div
                                    key={`${appointment.doctor}-${appointment.time}`}
                                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                                        <p className="font-semibold text-gray-900 dark:text-white break-words">{appointment.doctor}</p>
                                        <span className={`text-xs font-semibold px-3 py-1 rounded-full w-max ${appointment.statusClass}`}>
                                            {appointment.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{appointment.type}</p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{appointment.time}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}