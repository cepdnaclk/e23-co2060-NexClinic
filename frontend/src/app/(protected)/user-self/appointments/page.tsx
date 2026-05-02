"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { handlePatientSessionExpired } from "@/lib/patientSession";

interface Appointment {
    id: string;
    slotId: string;
    doctorId: string;
    doctorName: string;
    hospital: string;
    date: string;
    time: string;
    reason: string;
    status: string;
    requestedAt: string;
    category: "request" | "upcoming" | "previous";
}

type SortBy = "date" | "doctor" | "status";

type ApiAppointment = Omit<Appointment, "id" | "slotId" | "doctorId"> & {
    id: string | number;
    slotId: string | number;
    doctorId: string | number;
};

const sortAppointments = (appointments: Appointment[], sortBy: string) => {
    if (sortBy === "date") {
        return [...appointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortBy === "doctor") {
        return [...appointments].sort((a, b) => a.doctorName.localeCompare(b.doctorName));
    } else if (sortBy === "status") {
        return [...appointments].sort((a, b) => a.status.localeCompare(b.status));
    }
    return appointments;
};

const formatTimeForDisplay = (time: string): string => {
    const twentyFourHourMatch = time.match(/^(\d{2}):(\d{2})$/);
    if (!twentyFourHourMatch) {
        return time;
    }

    let hour = Number(twentyFourHourMatch[1]);
    const minute = twentyFourHourMatch[2];
    const suffix = hour >= 12 ? "PM" : "AM";

    if (hour === 0) {
        hour = 12;
    } else if (hour > 12) {
        hour -= 12;
    }

    return `${hour}:${minute} ${suffix}`;
};

const normalizeAppointment = (appointment: ApiAppointment): Appointment => ({
    ...appointment,
    id: String(appointment.id),
    slotId: String(appointment.slotId),
    doctorId: String(appointment.doctorId),
});

const statusPillClass = (status: string) => {
    if (status === "Confirmed") {
        return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    }
    if (status === "Pending") {
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200";
    }
    if (status === "Completed") {
        return "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200";
    }
    return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
};

const PatientAppointmentPage = () => {
    const router = useRouter();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [sortBy, setSortBy] = useState<SortBy>("date");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [toast, setToast] = useState("");
    const [cancellingIds, setCancellingIds] = useState<string[]>([]);

    useEffect(() => {
        const loadAppointments = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await fetch("/api/patient/appointments", {
                    method: "GET",
                    cache: "no-store",
                });

                if (response.status === 401) {
                    handlePatientSessionExpired(router);
                    return;
                }

                const payload = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(payload?.error || "Failed to load appointments");
                }

                const normalized = Array.isArray(payload?.appointments)
                    ? payload.appointments.map((item: ApiAppointment) => normalizeAppointment(item))
                    : [];

                setAppointments(normalized);
            } catch (err) {
                setAppointments([]);
                setError(err instanceof Error ? err.message : "Failed to load appointments");
            } finally {
                setLoading(false);
            }
        };

        void loadAppointments();
    }, [router]);

    const cancelAppointment = async (appointmentId: string) => {
        setCancellingIds((prev) => (prev.includes(appointmentId) ? prev : [...prev, appointmentId]));

        try {
            const response = await fetch(`/api/patient/appointments/${appointmentId}/cancel`, {
                method: "PATCH",
            });

            if (response.status === 401) {
                handlePatientSessionExpired(router);
                return;
            }

            const payload = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(payload?.error || "Failed to cancel appointment");
            }

            const updated = payload?.appointment ? normalizeAppointment(payload.appointment as ApiAppointment) : null;
            if (updated) {
                setAppointments((prev) => prev.map((item) => (item.id === appointmentId ? updated : item)));
            }

            setToast(payload?.message || "Appointment cancelled successfully.");
            window.setTimeout(() => setToast(""), 2200);
        } catch (err) {
            setToast(err instanceof Error ? err.message : "Failed to cancel appointment.");
            window.setTimeout(() => setToast(""), 2200);
        } finally {
            setCancellingIds((prev) => prev.filter((id) => id !== appointmentId));
        }
    };

    const requests = useMemo(
        () => sortAppointments(appointments.filter((item) => item.category === "request"), sortBy),
        [appointments, sortBy]
    );
    const upcoming = useMemo(
        () => sortAppointments(appointments.filter((item) => item.category === "upcoming"), sortBy),
        [appointments, sortBy]
    );
    const previous = useMemo(
        () => sortAppointments(appointments.filter((item) => item.category === "previous"), sortBy),
        [appointments, sortBy]
    );

    const renderTable = (items: Appointment[], emptyText: string) => {
        if (loading) {
            return <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg text-gray-500 dark:text-gray-300 text-center">Loading appointments...</div>;
        }

        if (items.length === 0) {
            return <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg text-gray-500 dark:text-gray-300 text-center">{emptyText}</div>;
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                {items.map((appt) => {
                    const canCancel = appt.status === "Pending" || appt.status === "Confirmed";
                    const isCancelling = cancellingIds.includes(appt.id);

                    return (
                        <div key={appt.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-col sm:flex-row gap-4 items-start transition-transform hover:-translate-y-1">
                            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-gradient-to-br from-green-200 to-green-50 dark:from-green-800 dark:to-green-700 flex items-center justify-center text-green-700 dark:text-green-100 font-bold text-xl">
                                {appt.doctorName.split(" ")[0][0] ?? "D"}
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{appt.doctorName}</h4>
                                        <p className="text-sm text-gray-500 dark:text-gray-300">{appt.hospital}</p>
                                    </div>

                                    <div className="text-right">
                                        <div className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusPillClass(appt.status)}`}>{appt.status}</div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Requested: {new Date(appt.requestedAt).toLocaleDateString()}</div>
                                    </div>
                                </div>

                                <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="text-sm text-gray-700 dark:text-gray-200">
                                        <div className="font-medium">{appt.date} • {formatTimeForDisplay(appt.time)}</div>
                                        {appt.reason && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{appt.reason}</div>}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <Link href={`/user-self/appointments/${appt.id}`} className="text-sm text-green-600 dark:text-green-300 font-semibold hover:underline">View</Link>

                                        {canCancel ? (
                                            <button
                                                type="button"
                                                className="ml-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 border border-red-100 dark:border-red-700 rounded px-3 py-1 text-sm font-semibold hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-60"
                                                disabled={isCancelling}
                                                onClick={() => void cancelAppointment(appt.id)}
                                            >
                                                {isCancelling ? "Cancelling..." : "Cancel"}
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">—</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="relative flex flex-col items-center w-full min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors">
            <div aria-hidden className="absolute inset-0 -z-10">
                <img src="/images/main-bg.jpg" alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 dark:opacity-10 filter blur-sm" />
                <div className="absolute -left-40 -top-32 w-96 h-96 rounded-full bg-gradient-to-br from-green-200 to-transparent opacity-40 dark:from-green-900 dark:opacity-30 blur-2xl transform rotate-12" />
                <div className="absolute -right-40 -bottom-32 w-96 h-96 rounded-full bg-gradient-to-br from-teal-100 to-transparent opacity-30 dark:from-teal-800 dark:opacity-20 blur-2xl transform -rotate-12" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/40 dark:to-black/30 mix-blend-overlay" />
            </div>

            <div className="w-full max-w-4xl bg-white/90 dark:bg-gray-800/70 rounded-2xl shadow-lg p-4 md:p-8 flex flex-col gap-6 backdrop-blur-sm transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
                    <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100">My Appointments</h2>
                    <Link href="/user-self/book-appointment">
                        <button className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-6 rounded-lg shadow transition-all">
                            + Book Appointment
                        </button>
                    </Link>
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <span className="font-medium text-gray-700 dark:text-gray-200">Sort by:</span>
                    <select
                        className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                    >
                        <option value="date">Date</option>
                        <option value="doctor">Doctor</option>
                        <option value="status">Status</option>
                    </select>
                </div>

                {error && <div className="text-red-500 text-sm">{error}</div>}
                {toast && <div className="text-green-600 dark:text-green-300 text-sm font-semibold">{toast}</div>}

                <div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-700 dark:text-gray-200">Pending Requests</h3>
                    {renderTable(requests, "No pending requests.")}
                </div>

                <div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-700 dark:text-gray-200">Upcoming Appointments</h3>
                    {renderTable(upcoming, "No upcoming appointments.")}
                </div>

                <div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-700 dark:text-gray-200">Appointment History</h3>
                    {renderTable(previous, "No appointment history yet.")}
                </div>
            </div>
        </div>
    );
};

export default PatientAppointmentPage;
