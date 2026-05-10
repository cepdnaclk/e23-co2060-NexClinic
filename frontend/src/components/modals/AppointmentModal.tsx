"use client";

import React from "react";
import { Appointment } from "@/types/appointment";

interface AppointmentModalProps {
    appointment: Appointment | null;
    isOpen: boolean;
    onClose: () => void;
}

const formatTimeForDisplay = (time: string): string => {
    const twentyFourHourMatch = time.match(/^(\d{2}):(\d{2})$/);
    if (!twentyFourHourMatch) return time;

    let hour = Number(twentyFourHourMatch[1]);
    const minute = twentyFourHourMatch[2];
    const suffix = hour >= 12 ? "PM" : "AM";

    if (hour === 0) hour = 12;
    else if (hour > 12) hour -= 12;

    return `${hour}:${minute} ${suffix}`;
};

const statusPillClass = (status: string) => {
    if (status === "Confirmed") return "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300";
    if (status === "Pending") return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200";
    if (status === "Completed") return "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200";
    return "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200";
};

export default function AppointmentModal({ appointment, isOpen, onClose }: AppointmentModalProps) {
    if (!isOpen || !appointment) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold text-black dark:text-gray-100">Appointment Details</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 text-2xl leading-none"
                        aria-label="Close modal"
                    >
                        X
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Doctor Info */}
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-200 to-green-50 dark:from-green-800 dark:to-green-700 flex items-center justify-center text-green-700 dark:text-green-100 font-bold text-xl">
                            {appointment.doctorName.split(" ")[0][0] ?? "D"}
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-black dark:text-gray-100">{appointment.doctorName}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{appointment.hospital}</p>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusPillClass(appointment.status)}`}>
                            {appointment.status}
                        </span>
                    </div>

                    {/* Date & Time */}
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Appointment Date & Time</p>
                        <p className="text-lg font-semibold text-black dark:text-gray-100">
                            {appointment.date} • {formatTimeForDisplay(appointment.time)}
                        </p>
                    </div>

                    {/* Reason */}
                    {appointment.reason && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for Visit</p>
                            <p className="text-gray-600 dark:text-gray-400">{appointment.reason}</p>
                        </div>
                    )}

                    {/* Appointment ID & Slot ID */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Appointment ID</p>
                            <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">{appointment.id}</p>
                        </div>
                        {/* <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Slot ID</p>
                            <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">{appointment.slotId}</p>
                        </div> */}
                    </div>

                    {/* Requested Date */}
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                        Requested: {new Date(appointment.requestedAt).toLocaleString()}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-black dark:text-gray-100 font-semibold py-2 px-4 rounded-lg transition"
                    >
                        Close
                    </button>

                </div>
            </div>
        </div>
    );
}


// This button is an action button that can be used for actions like "Reschedule" or "Cancel". You can customize the onClick handler to perform the desired action when clicked. The styling is consistent with the rest of the modal, using Tailwind CSS classes for a cohesive look.
<button
    onClick={() => {
        /* Add action like "Reschedule" or "Cancel" */
    }}
    className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition"
>
    Actions
</button>