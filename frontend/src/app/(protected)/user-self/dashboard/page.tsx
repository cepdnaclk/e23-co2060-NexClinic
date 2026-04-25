"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { handlePatientSessionExpired } from "@/lib/patientSession";

type PatientProfilePayload = {
    patient?: {
        fullName?: string;
        email?: string;
        profileImage?: string;
    };
};

type DashboardAppointment = {
    id: string;
    doctorName: string;
    date: string;
    time: string;
    type: string;
    status: string;
    category: "request" | "upcoming" | "previous";
    requestedAt: string;
};

type AppointmentsPayload = {
    appointments?: DashboardAppointment[];
};

type StatCard = {
    label: string;
    value: string;
}

export default function UserDashboard() {
    const router = useRouter();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [profileImage, setProfileImage] = useState<string | undefined>(undefined);
    const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadDashboardData = async (showLoading: boolean) => {
            if (showLoading) {
                setIsLoading(true);
            }

            try {
                const [profileResponse, appointmentsResponse] = await Promise.all([
                    fetch("/api/patient/profile", { method: "GET", cache: "no-store" }),
                    fetch("/api/patient/appointments", { method: "GET", cache: "no-store" }),
                ]);

                if (profileResponse.status === 401 || appointmentsResponse.status === 401) {
                    handlePatientSessionExpired(router);
                    return;
                }

                const profilePayload = (await profileResponse.json().catch(() => ({}))) as PatientProfilePayload;
                const appointmentsPayload = (await appointmentsResponse.json().catch(() => ({}))) as AppointmentsPayload;

                if (!profileResponse.ok) {
                    throw new Error("Failed to load patient profile");
                }

                if (!appointmentsResponse.ok) {
                    throw new Error("Failed to load appointments");
                }

                const patient = profilePayload.patient || {};
                setFullName(patient.fullName || "");
                setEmail(patient.email || "");
                setProfileImage(patient.profileImage || undefined);

                const liveAppointments = Array.isArray(appointmentsPayload.appointments)
                    ? appointmentsPayload.appointments
                    : [];
                setAppointments(liveAppointments);
                setError("");
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load dashboard data");
            } finally {
                if (showLoading) {
                    setIsLoading(false);
                }
            }
        };

        void loadDashboardData(true);

        const intervalId = window.setInterval(() => {
            void loadDashboardData(false);
        }, 20000);

        const handleFocus = () => {
            void loadDashboardData(false);
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                void loadDashboardData(false);
            }
        };

        window.addEventListener("focus", handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.clearInterval(intervalId);
            window.removeEventListener("focus", handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [router]);

    const displayName = fullName || email.split("@")[0] || "User";

    const stats: StatCard[] = useMemo(() => {
        const upcomingCount = appointments.filter((item) => item.category === "upcoming").length;
        const pendingCount = appointments.filter((item) => item.category === "request").length;
        const completedCount = appointments.filter((item) => item.status === "Completed").length;

        return [
            { label: "Upcoming Appointments", value: String(upcomingCount) },
            { label: "Pending Requests", value: String(pendingCount) },
            { label: "Completed Consultations", value: String(completedCount) },
        ];
    }, [appointments]);

    const upcomingAppointments = useMemo(() => {
        const getStatusClass = (status: string) => {
            if (status === "Confirmed") {
                return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
            }
            if (status === "Pending") {
                return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300";
            }
            if (status === "Completed") {
                return "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200";
            }
            return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
        };

        return [...appointments]
            .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
            .map((item) => ({
                doctor: item.doctorName,
                status: item.status,
                statusClass: getStatusClass(item.status),
                type: item.type || "Consultation",
                time: `${item.date} - ${item.time}`,
            }));
    }, [appointments]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
                <section className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
                    <div className="flex flex-col xl:flex-row gap-4 sm:gap-6 xl:items-start xl:justify-between">
                        <div className="w-full flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
                            {profileImage ? (
                                <Image
                                    src={profileImage}
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
                                    {isLoading ? "Loading your dashboard..." : "Here is your health dashboard overview."}
                                </p>
                                {error ? <p className="mt-2 text-sm text-red-500">{error}</p> : null}
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
                            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4">
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Online advice chat history is not available yet. It will appear here after chat features are implemented.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 h-full">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <h2 className="text-xl font-bold text-green-600 dark:text-green-400">In-Person Appointments</h2>
                            <Link
                                href="/user-self/appointments"
                                className="px-3 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition text-center"
                            >
                                View All Appointments
                            </Link>
                        </div>
                        <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>

                        <div className="space-y-3">
                            {upcomingAppointments.length === 0 ? (
                                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4">
                                    <p className="text-sm text-gray-600 dark:text-gray-300">No appointments yet.</p>
                                </div>
                            ) : upcomingAppointments.map((appointment) => (
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