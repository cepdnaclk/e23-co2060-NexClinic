"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GreenButton from "@/components/buttons/GreenButton";
import WhiteButton from "@/components/buttons/WhiteButton";
import { handleDoctorSessionExpired } from "@/lib/doctorSession";

type AppointmentPreview = {
    id: string;
    patientName: string;
    type: "In-Person Appointment";
    date: string;
    time: string;
    status: "Confirmed" | "Pending";
};

type ChatPreview = {
    id: string;
    patientName: string;
    lastMessage: string;
    time: string;
    unreadCount: number;
};

type DashboardData = {
    doctor: {
        displayName: string;
        email: string;
        specialization: string;
    };
    stats: {
        todayAppointments: number;
        unreadChats: number;
        monthEarnings: number;
        onlineAdviceSessions: number;
    };
    upcomingAppointments: AppointmentPreview[];
    recentChats: ChatPreview[];
};

function DoctorDashboard() {
    const router = useRouter();
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadDashboardData = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await fetch("/api/doctor/dashboard", {
                    method: "GET",
                    cache: "no-store",
                });

                if (response.status === 401) {
                    handleDoctorSessionExpired(router);
                    return;
                }

                if (!response.ok) {
                    const errorPayload = await response.json().catch(() => ({}));
                    throw new Error(errorPayload?.error || "Failed to load dashboard details");
                }

                const data = await response.json();
                setDashboardData(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load dashboard details");
            } finally {
                setLoading(false);
            }
        };

        loadDashboardData();
    }, [router]);

    const stats = dashboardData?.stats;
    const appointments = dashboardData?.upcomingAppointments ?? [];
    const chats = dashboardData?.recentChats ?? [];

    return (
        <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
            <div className="mx-4 mt-6 mb-8 space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Doctor Dashboard</h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                        {dashboardData
                            ? `Welcome back, ${dashboardData.doctor.displayName}! Here is a quick summary of your in-person appointments, advice chats, and earnings.`
                            : "Welcome back! Here is a quick summary of your in-person appointments, advice chats, and earnings."}
                    </p>
                    {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Today In-Person Appointments</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{loading ? "..." : (stats?.todayAppointments ?? 0)}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Unread Advice Chats</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{loading ? "..." : (stats?.unreadChats ?? 0)}</p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">This Month Earnings</p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                            {loading ? "..." : `Rs. ${(stats?.monthEarnings ?? 0).toLocaleString()}`}
                        </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
                        <p className="text-sm text-gray-500 dark:text-gray-400">Online Advice Chats</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{loading ? "..." : (stats?.onlineAdviceSessions ?? 0)}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <h2 className="text-xl font-bold text-green-500 dark:text-green-400">Upcoming In-Person Appointments</h2>
                            <Link href="/doctor-self/appointments">
                                <WhiteButton className="px-4 py-2">View All</WhiteButton>
                            </Link>
                        </div>

                        <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>

                        <div className="space-y-3">
                            {appointments.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming in-person appointments.</p>
                            ) : (
                                appointments.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-semibold text-gray-900 dark:text-white">{appointment.patientName}</p>
                                            <span
                                                className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                                    appointment.status === "Confirmed"
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                                                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                                                }`}
                                            >
                                                {appointment.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{appointment.type}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                            {appointment.date} • {appointment.time}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between gap-4 mb-4">
                            <h2 className="text-xl font-bold text-green-500 dark:text-green-400">Recent Advice Chats</h2>
                            <Link href="/doctor-self/chats">
                                <WhiteButton className="px-4 py-2">View All</WhiteButton>
                            </Link>
                        </div>

                        <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>

                        <div className="space-y-3">
                            {chats.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No recent advice chats yet.</p>
                            ) : (
                                chats.map((chat) => (
                                    <div
                                        key={chat.id}
                                        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="font-semibold text-gray-900 dark:text-white">{chat.patientName}</p>
                                            <div className="flex items-center gap-2">
                                                {chat.unreadCount > 0 && (
                                                    <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-500 text-white">
                                                        {chat.unreadCount}
                                                    </span>
                                                )}
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{chat.time}</span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">{chat.lastMessage}</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Update your profile, manage in-person appointments, and respond to advice chats faster.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Link href="/doctor-self/profile">
                            <WhiteButton>Edit Profile</WhiteButton>
                        </Link>
                        <Link href="/doctor-self/appointments">
                            <GreenButton>Manage Appointments</GreenButton>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DoctorDashboard;