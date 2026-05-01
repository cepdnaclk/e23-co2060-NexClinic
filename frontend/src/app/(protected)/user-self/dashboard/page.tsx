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

const statusTheme = (status: string) => {
    if (status === "Confirmed") {
        return "bg-green-100 text-green-800 border-green-200";
    }
    if (status === "Pending") {
        return "bg-amber-100 text-amber-800 border-amber-200";
    }
    if (status === "Completed") {
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
    return "bg-rose-100 text-rose-800 border-rose-200";
};

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

    const sortedAppointments = useMemo(() => {
        return [...appointments]
            .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))
            .map((item) => ({
                id: item.id,
                doctor: item.doctorName,
                status: item.status,
                statusClass: statusTheme(item.status),
                type: item.type || "Consultation",
                time: `${item.date} - ${item.time}`,
            }));
    }, [appointments]);

    const nextAppointment = sortedAppointments[0];

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#eef8f4] via-[#f8fcfb] to-white">
            <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8 space-y-5 sm:space-y-6">
                <section className="relative overflow-hidden rounded-3xl border border-green-100 bg-white/95 shadow-xl shadow-green-100/60">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,173,133,0.14),transparent_45%),radial-gradient(circle_at_bottom_left,_rgba(0,119,88,0.1),transparent_45%)]" />
                    <div className="relative p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div className="w-full min-w-0 flex flex-col gap-4 sm:flex-row sm:items-center">
                            {profileImage ? (
                                <Image
                                    src={profileImage}
                                    alt={displayName}
                                    width={84}
                                    height={84}
                                    className="mx-auto h-[84px] w-[84px] shrink-0 rounded-full border-4 border-green-500 object-cover sm:mx-0"
                                />
                            ) : (
                                <div className="mx-auto flex h-[84px] w-[84px] shrink-0 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-green-600 to-green-800 text-2xl font-bold text-white shadow-lg sm:mx-0">
                                    {displayName
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")
                                        .toUpperCase()}
                                </div>
                            )}
                                <div className="min-w-0 text-center sm:text-left">
                                    <p className="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-green-700">
                                        Patient Dashboard
                                    </p>
                                    <h1 className="mt-3 break-words text-2xl font-bold text-slate-900 sm:text-3xl lg:text-4xl">
                                        Welcome back, {displayName}
                                    </h1>
                                    <p className="mt-2 text-sm text-slate-600 sm:text-base">
                                        {isLoading ? "Loading your latest updates..." : "Track consultations, requests, and care activity in one place."}
                                    </p>
                                    {error ? <p className="mt-2 text-sm font-semibold text-rose-600">{error}</p> : null}
                                </div>
                            </div>

                            <div className="w-full rounded-2xl border border-green-100 bg-gradient-to-r from-green-600 to-green-700 p-4 text-white shadow-lg xl:max-w-md">
                                <p className="text-sm font-medium text-green-50">Next Appointment</p>
                                <p className="mt-2 text-lg font-bold leading-tight">
                                    {nextAppointment ? nextAppointment.doctor : "No upcoming appointments"}
                                </p>
                                <p className="mt-1 text-sm text-green-100">
                                    {nextAppointment ? nextAppointment.time : "Book one to start your care timeline."}
                                </p>
                                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                                    <div className="rounded-lg bg-white/15 px-3 py-2">
                                        <p className="text-green-100">Pending</p>
                                        <p className="text-base font-bold text-white">{stats[1].value}</p>
                                    </div>
                                    <div className="rounded-lg bg-white/15 px-3 py-2">
                                        <p className="text-green-100">Completed</p>
                                        <p className="text-base font-bold text-white">{stats[2].value}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                            <Link
                                href="/user-self/book-appointment"
                                className="group rounded-xl border border-green-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Quick Action</p>
                                <p className="mt-2 text-base font-bold text-slate-900">Book Appointment</p>
                                <p className="mt-1 text-sm text-slate-600">Find a doctor and request your preferred slot.</p>
                            </Link>
                            <Link
                                href="/user-self/chats"
                                className="group rounded-xl border border-green-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Quick Action</p>
                                <p className="mt-2 text-base font-bold text-slate-900">Ask a Doctor</p>
                                <p className="mt-1 text-sm text-slate-600">Reach out online for non-urgent guidance.</p>
                            </Link>
                            <Link
                                href="/user-self/prescriptions"
                                className="group rounded-xl border border-green-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <p className="text-xs font-semibold uppercase tracking-wide text-green-700">Quick Action</p>
                                <p className="mt-2 text-base font-bold text-slate-900">View Prescriptions</p>
                                <p className="mt-1 text-sm text-slate-600">Review your active and past prescription details.</p>
                            </Link>
                        </div>

                        <div className="rounded-2xl border border-green-100 bg-green-50/60 p-4">
                            <h2 className="text-lg font-bold text-green-800">Health Tip of the Day</h2>
                            <p className="mt-2 text-sm text-slate-700">
                                Stay hydrated throughout the day. Consistent water intake supports better concentration, joint health, and energy.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {stats.map((item, index) => (
                        <div
                            key={item.label}
                            className="rounded-2xl border border-green-100 bg-white p-5 shadow-md shadow-green-100/30"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <p className="text-sm text-slate-600">{item.label}</p>
                                <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                                    {index === 0 ? "Live" : "Summary"}
                                </span>
                            </div>
                            <p className="mt-3 text-4xl font-bold text-slate-900">{item.value}</p>
                        </div>
                    ))}
                </section>

                <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className="h-full rounded-2xl border border-green-100 bg-white p-4 shadow-md shadow-green-100/30 sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Recent Chats</h2>
                            <Link
                                href="/user-self/chats"
                                className="rounded-lg bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-green-700"
                            >
                                View All Chats
                            </Link>
                        </div>

                        <div className="mt-4 rounded-xl border border-dashed border-green-200 bg-green-50/50 p-4">
                            <p className="text-sm text-slate-600">
                                Online advice chat history will appear here once conversations are available.
                            </p>
                        </div>
                    </div>

                    <div className="h-full rounded-2xl border border-green-100 bg-white p-4 shadow-md shadow-green-100/30 sm:p-6">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Appointments Timeline</h2>
                            <Link
                                href="/user-self/appointments"
                                className="rounded-lg bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-green-700"
                            >
                                View All
                            </Link>
                        </div>

                        <div className="mt-4 space-y-3">
                            {sortedAppointments.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-green-200 bg-green-50/50 p-4">
                                    <p className="text-sm text-slate-600">No appointments yet. Start by booking your first consultation.</p>
                                </div>
                            ) : sortedAppointments.slice(0, 5).map((appointment) => (
                                <div
                                    key={appointment.id || `${appointment.doctor}-${appointment.time}`}
                                    className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                                >
                                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                        <p className="break-words font-semibold text-slate-900">{appointment.doctor}</p>
                                        <span className={`w-max rounded-full border px-3 py-1 text-xs font-semibold ${appointment.statusClass}`}>
                                            {appointment.status}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-sm text-slate-600">{appointment.type}</p>
                                    <p className="mt-1 text-sm text-slate-500">{appointment.time}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}