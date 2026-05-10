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
        upcomingAppointmentsCount: number;
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
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_26%),linear-gradient(180deg,#eefbf6_0%,#f8fcfb_42%,#ffffff_100%)] pb-8">
            <div className="absolute inset-0 bg-[url('/images/doctor-login-bg.png')] bg-cover bg-center bg-no-repeat opacity-[0.08]" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/88 via-white/80 to-white/95" aria-hidden="true" />
            <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-100/60 to-transparent" aria-hidden="true" />
            <div className="absolute -left-24 top-28 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" aria-hidden="true" />
            <div className="absolute right-0 top-36 h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl" aria-hidden="true" />

            <div className="relative mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
                <section className="overflow-hidden rounded-[2.5rem] border border-emerald-100/70 bg-white/80 shadow-[0_24px_80px_rgba(16,185,129,0.12)] backdrop-blur">
                    <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="relative p-6 sm:p-8 lg:p-10">
                            <div className="absolute right-0 top-0 h-44 w-44 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-100/60 blur-3xl" aria-hidden="true" />
                            <div className="relative max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-emerald-700">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    DOCTOR DASHBOARD
                                </div>
                                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                                    A clear command center for your day
                                </h1>
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                                    {dashboardData
                                        ? `Welcome back, ${dashboardData.doctor.displayName}. Track appointments, advice chats and earnings from one calm, modern view.`
                                        : "Welcome back. Track appointments, advice chats and earnings from one calm, modern view."}
                                </p>

                                {error && <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}

                                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                    <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm shadow-emerald-100/30">
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Today</p>
                                        <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? '...' : (stats?.todayAppointments ?? 0)}</p>
                                        <p className="mt-1 text-sm text-slate-600">In-person appointments</p>
                                    </div>
                                    <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm shadow-emerald-100/30">
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Chats</p>
                                        <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? '...' : (stats?.unreadChats ?? 0)}</p>
                                        <p className="mt-1 text-sm text-slate-600">Unread advice messages</p>
                                    </div>
                                    <div className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm shadow-emerald-100/30">
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Earnings</p>
                                        <p className="mt-2 text-2xl font-bold text-emerald-700">{loading ? '...' : `Rs. ${(stats?.monthEarnings ?? 0).toLocaleString()}`}</p>
                                        <p className="mt-1 text-sm text-slate-600">This month</p>
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Link href="/doctor-self/appointments">
                                        <GreenButton className="rounded-full px-6 py-3">Manage Appointments</GreenButton>
                                    </Link>
                                    <Link href="/doctor-self/chats">
                                        <WhiteButton className="rounded-full px-6 py-3">Open Advice Chats</WhiteButton>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="relative min-h-[320px] bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 p-4 sm:p-6 lg:min-h-full">
                            <div className="absolute inset-0 bg-[url('/images/doctor-login-bg.png')] bg-cover bg-center bg-no-repeat opacity-25" aria-hidden="true" />
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/20 via-transparent to-slate-950/30" aria-hidden="true" />
                            <div className="relative flex h-full flex-col justify-between rounded-[2rem] border border-white/15 bg-white/10 p-5 text-white backdrop-blur-sm sm:p-6">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">Today&apos;s focus</p>
                                    <p className="mt-3 text-2xl font-bold sm:text-3xl">Smooth care starts with a clear schedule.</p>
                                    <p className="mt-3 max-w-md text-sm leading-6 text-white/85">
                                        Use the dashboard to scan the day, answer chats quickly, and move straight into the next patient.
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-3xl border border-white/20 bg-white/12 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Appointments</p>
                                        <p className="mt-2 text-2xl font-bold">{loading ? '...' : (stats?.upcomingAppointmentsCount ?? 0)}</p>
                                    </div>
                                    <div className="rounded-3xl border border-white/20 bg-white/12 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Online Sessions</p>
                                        <p className="mt-2 text-2xl font-bold">{loading ? '...' : (stats?.onlineAdviceSessions ?? 0)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
                        <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Total Upcoming Appointments</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '...' : (stats?.upcomingAppointmentsCount ?? 0)}</p>
                    </div>
                    <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
                        <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500" />
                        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Unread Advice Chats</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '...' : (stats?.unreadChats ?? 0)}</p>
                    </div>
                    <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
                        <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500" />
                        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">This Month Earnings</p>
                        <p className="mt-2 text-3xl font-bold text-emerald-700">{loading ? '...' : `Rs. ${(stats?.monthEarnings ?? 0).toLocaleString()}`}</p>
                    </div>
                    <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
                        <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Online Advice Chats</p>
                        <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? '...' : (stats?.onlineAdviceSessions ?? 0)}</p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
                        <div className="border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50 to-white p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">Schedule</p>
                                    <h2 className="mt-2 text-2xl font-bold text-slate-900">Upcoming In-Person Appointments</h2>
                                </div>
                                <Link href="/doctor-self/appointments">
                                    <WhiteButton className="rounded-full px-4 py-2">View All</WhiteButton>
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-3 p-6">
                            {appointments.length === 0 ? (
                                <p className="text-sm text-slate-500">No upcoming in-person appointments.</p>
                            ) : (
                                appointments.map((appointment) => (
                                    <div
                                        key={appointment.id}
                                        className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-white to-emerald-50/60 p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-slate-900">{appointment.patientName}</p>
                                                <p className="mt-1 text-sm text-slate-600">{appointment.type}</p>
                                            </div>
                                            <span
                                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                                    appointment.status === 'Confirmed'
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                }`}
                                            >
                                                {appointment.status}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
                                            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{appointment.date}</span>
                                            <span className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{appointment.time}</span>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
                        <div className="border-b border-cyan-100/80 bg-gradient-to-r from-cyan-50 to-white p-6">
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-700">Messages</p>
                                    <h2 className="mt-2 text-2xl font-bold text-slate-900">Recent Advice Chats</h2>
                                </div>
                                <Link href="/doctor-self/chats">
                                    <WhiteButton className="rounded-full px-4 py-2">View All</WhiteButton>
                                </Link>
                            </div>
                        </div>

                        <div className="space-y-3 p-6">
                            {chats.length === 0 ? (
                                <p className="text-sm text-slate-500">No recent advice chats yet.</p>
                            ) : (
                                chats.map((chat) => (
                                    <div
                                        key={chat.id}
                                        className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-white to-cyan-50/60 p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="font-semibold text-slate-900">{chat.patientName}</p>
                                                <p className="mt-2 text-sm leading-6 text-slate-600 line-clamp-2">{chat.lastMessage}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                {chat.unreadCount > 0 && (
                                                    <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-xs font-bold text-white">
                                                        {chat.unreadCount}
                                                    </span>
                                                )}
                                                <span className="text-xs text-slate-500">{chat.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.08)] sm:p-7">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">Quick Actions</p>
                            <h3 className="mt-2 text-2xl font-bold text-slate-900">Move faster between profile, slots, and appointments</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Update your profile, manage in-person appointments, and respond to advice chats with less friction.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href="/doctor-self/profile">
                                <WhiteButton className="rounded-full px-5 py-3">Edit Profile</WhiteButton>
                            </Link>
                            <Link href="/doctor-self/appointment-slots">
                                <WhiteButton className="rounded-full px-5 py-3">Manage Slots</WhiteButton>
                            </Link>
                            <Link href="/doctor-self/appointments">
                                <GreenButton className="rounded-full px-5 py-3">Manage Appointments</GreenButton>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DoctorDashboard;