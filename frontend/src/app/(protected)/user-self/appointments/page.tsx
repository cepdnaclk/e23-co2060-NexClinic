"use client";
import React, { useState } from "react";
import Link from "next/link";

interface Appointment {
    id: number;
    doctor_name: string;
    hospital: string;
    date: string;
    time: string;
    status: string;
}

const sortAppointments = (appointments: Appointment[], sortBy: string) => {
    if (sortBy === "date") {
        return [...appointments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortBy === "doctor") {
        return [...appointments].sort((a, b) => a.doctor_name.localeCompare(b.doctor_name));
    } else if (sortBy === "status") {
        return [...appointments].sort((a, b) => a.status.localeCompare(b.status));
    }
    return appointments;
};

const mockAppointments: Appointment[] = [
    {
        id: 1,
        doctor_name: "Dr. John Doe",
        hospital: "City Hospital",
        date: "2026-03-15",
        time: "10:00 AM",
        status: "Confirmed",
    },
    {
        id: 2,
        doctor_name: "Dr. Jane Smith",
        hospital: "Green Valley Clinic",
        date: "2026-03-20",
        time: "2:30 PM",
        status: "Pending",
    },
    {
        id: 3,
        doctor_name: "Dr. Alice Brown",
        hospital: "Sunrise Medical Center",
        date: "2026-03-10",
        time: "9:00 AM",
        status: "Completed",
    },
];

const PatientAppointmentPage = () => {
    const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
    const [sortBy, setSortBy] = useState("date");

    const sortedAppointments = sortAppointments(appointments, sortBy);

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
                        onChange={e => setSortBy(e.target.value)}
                    >
                        <option value="date">Date</option>
                        <option value="doctor">Doctor</option>
                        <option value="status">Status</option>
                    </select>
                </div>
                <div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-700 dark:text-gray-200">Upcoming Appointments</h3>
                    {sortedAppointments.length === 0 ? (
                        <div className="bg-gray-100 dark:bg-gray-700 p-6 rounded-lg text-gray-500 dark:text-gray-300 text-center">No upcoming appointments.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse mt-2">
                                <thead>
                                    <tr className="bg-gray-100 dark:bg-gray-700">
                                        <th className="border-b border-gray-200 dark:border-gray-700 p-3 font-semibold text-gray-700 dark:text-gray-200">Doctor</th>
                                        <th className="border-b border-gray-200 dark:border-gray-700 p-3 font-semibold text-gray-700 dark:text-gray-200">Hospital</th>
                                        <th className="border-b border-gray-200 dark:border-gray-700 p-3 font-semibold text-gray-700 dark:text-gray-200">Date</th>
                                        <th className="border-b border-gray-200 dark:border-gray-700 p-3 font-semibold text-gray-700 dark:text-gray-200">Time</th>
                                        <th className="border-b border-gray-200 dark:border-gray-700 p-3 font-semibold text-gray-700 dark:text-gray-200">Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sortedAppointments.map((appt) => (
                                        <tr key={appt.id} className="hover:bg-green-50 dark:hover:bg-green-900 transition-colors">
                                            <td className="p-3 text-gray-800 dark:text-gray-100">{appt.doctor_name}</td>
                                            <td className="p-3 text-gray-800 dark:text-gray-100">{appt.hospital}</td>
                                            <td className="p-3 text-gray-800 dark:text-gray-100">{appt.date}</td>
                                            <td className="p-3 text-gray-800 dark:text-gray-100">{appt.time}</td>
                                            <td className="p-3">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold 
                          ${appt.status === "Confirmed" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
                            appt.status === "Pending" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200" :
                            appt.status === "Completed" ? "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200" :
                            "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"}`}>{appt.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientAppointmentPage;
