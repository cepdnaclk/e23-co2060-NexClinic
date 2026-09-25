"use client";

import React, { useState } from "react";
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
    const [showRecord, setShowRecord] = useState(false);
    const [loadingRecord, setLoadingRecord] = useState(false);
    const [record, setRecord] = useState<any>(null);

    React.useEffect(() => {
        if (!isOpen) {
            setShowRecord(false);
            setRecord(null);
        }
    }, [isOpen]);

    const handleViewRecord = async () => {
        if (showRecord) {
            setShowRecord(false);
            return;
        }
        setShowRecord(true);
        if (!record) {
            setLoadingRecord(true);
            try {
                const response = await fetch("/api/patient/profile", {
                    method: "GET",
                    cache: "no-store",
                });
                if (response.ok) {
                    const data = await response.json();
                    const foundRecord = data.health?.medicalRecords?.find(
                        (r: any) => r.appointmentId === appointment?.id.toString()
                    );
                    setRecord(foundRecord || null);
                }
            } catch (err) {
                console.error("Failed to fetch medical record", err);
            } finally {
                setLoadingRecord(false);
            }
        }
    };

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

                    {/* Queue Number */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded">
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Queue Number</p>
                            <p className="font-mono text-base font-semibold text-emerald-600 dark:text-emerald-400 break-all">#{appointment.queueNumber || '-'}</p>
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

                    {/* Medical Record Section */}
                    {appointment.status === "Completed" && (
                        <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                            <button
                                onClick={handleViewRecord}
                                className="w-full bg-emerald-100 hover:bg-emerald-200 text-emerald-700 dark:bg-emerald-900/30 dark:hover:bg-emerald-800/50 dark:text-emerald-300 font-semibold py-2 px-4 rounded-lg transition flex items-center justify-center gap-2"
                            >
                                {showRecord ? "Hide Medical Record & Prescription" : "View Medical Record & Prescription"}
                            </button>
                            
                            {showRecord && (
                                <div className="mt-4 space-y-4 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
                                    {loadingRecord ? (
                                        <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                                            Loading record details...
                                        </div>
                                    ) : record ? (
                                        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800/30 space-y-3">
                                            {record.diagnosis && (
                                                <div>
                                                    <p className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Diagnosis</p>
                                                    <p className="text-gray-700 dark:text-gray-300">{record.diagnosis}</p>
                                                </div>
                                            )}
                                            {record.observations && (
                                                <div>
                                                    <p className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Observations</p>
                                                    <p className="text-gray-700 dark:text-gray-300">{record.observations}</p>
                                                </div>
                                            )}
                                            {record.recommended_tests && (
                                                <div>
                                                    <p className="font-semibold text-emerald-800 dark:text-emerald-300 mb-1">Recommended Tests</p>
                                                    <p className="text-gray-700 dark:text-gray-300">{record.recommended_tests}</p>
                                                </div>
                                            )}
                                            
                                            {record.prescriptionItems && record.prescriptionItems.length > 0 && (
                                                <div className="mt-4">
                                                    <p className="font-semibold text-emerald-800 dark:text-emerald-300 mb-2 border-b border-emerald-200 dark:border-emerald-800/50 pb-1">Prescription Items</p>
                                                    <ul className="space-y-2">
                                                        {record.prescriptionItems.map((item: any, idx: number) => (
                                                            <li key={idx} className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-100 dark:border-gray-700 shadow-sm">
                                                                <div className="flex justify-between items-start">
                                                                    <span className="font-medium text-gray-900 dark:text-gray-100">{item.name}</span>
                                                                    {item.amount && <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">{item.amount} {item.unit}</span>}
                                                                </div>
                                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                    {item.frequency && <span>{item.frequency}</span>}
                                                                    {item.duration && <span> • {item.duration}</span>}
                                                                    {item.notes && <div className="mt-0.5 text-gray-600 dark:text-gray-300 italic">Note: {item.notes}</div>}
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {!record.diagnosis && !record.observations && !record.recommended_tests && (!record.prescriptionItems || record.prescriptionItems.length === 0) && (
                                                <p className="text-gray-500 dark:text-gray-400 italic">This medical record is currently empty.</p>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center text-red-500 py-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                                            No medical record found for this appointment.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
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