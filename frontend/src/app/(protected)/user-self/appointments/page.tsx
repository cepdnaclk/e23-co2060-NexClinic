"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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
    }, []);

    const cancelAppointment = async (appointmentId: string) => {
        setCancellingIds((prev) => (prev.includes(appointmentId) ? prev : [...prev, appointmentId]));

        try {
            const response = await fetch(`/api/patient/appointments/${appointmentId}/cancel`, {
                method: "PATCH",
            });

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
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse mt-2">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-700">
                            <th className="border-b border-gray-200 dark:border-gray-700 p-3 font-semibold text-gray-700 dark:text-gray-200">Doctor</th>
                            <th className="border-b border-gray-200 dark:border-gray-700 p-3 font-semibold text-gray-700 dark:text-gray-200">Hospital</th>
                            <th className="border-b border-gray-200 dark:border-gray-700 p-3 font-semibold text-gray-700 dark:text-gray-200">Date</th>
                            <th className="border-b border-gray-200 dark:border-gray-700 p-3 font-semibold text-gray-700 dark:text-gray-200">Time</th>
                            <th className="border-b border-gray-200 dark:border-gray-700 p-3 font-semibold text-gray-700 dark:text-gray-200">Status</th>
                            <th className="border-b border-gray-200 dark:border-gray-700 p-3 font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((appt) => {
                            const canCancel = appt.status === "Pending" || appt.status === "Confirmed";
                            const isCancelling = cancellingIds.includes(appt.id);

                            return (
                                <tr key={appt.id} className="hover:bg-green-50 dark:hover:bg-green-900 transition-colors">
                                    <td className="p-3 text-gray-800 dark:text-gray-100">
                                        <p>{appt.doctorName}</p>
                                        {appt.reason && <p className="text-xs text-gray-500 dark:text-gray-300 mt-1">{appt.reason}</p>}
                                    </td>
                                    <td className="p-3 text-gray-800 dark:text-gray-100">{appt.hospital}</td>
                                    <td className="p-3 text-gray-800 dark:text-gray-100">{appt.date}</td>
                                    <td className="p-3 text-gray-800 dark:text-gray-100">{formatTimeForDisplay(appt.time)}</td>
                                    <td className="p-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusPillClass(appt.status)}`}>
                                            {appt.status}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        {canCancel ? (
                                            <button
                                                type="button"
                                                className="border border-red-300 text-red-600 dark:text-red-300 dark:border-red-700 rounded px-3 py-1 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-60"
                                                disabled={isCancelling}
                                                onClick={() => void cancelAppointment(appt.id)}
                                            >
                                                {isCancelling ? "Cancelling..." : "Cancel"}
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div className="flex flex-col items-center w-full min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors">
            <div className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-8 flex flex-col gap-6 transition-colors">
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
