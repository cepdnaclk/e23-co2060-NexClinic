"use client";

import { useEffect, useState } from "react";
import BlackButton from "@/components/buttons/BlackButton";

interface Doctor {
    id: number;
    full_name: string;
    email: string;
    is_added: boolean;
}

export default function ManageDoctorsPage() {
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        async function fetchDoctors() {
            setLoading(true);
            setError("");
            try {
                const res = await fetch("/api/hospital/available-doctors", { credentials: "include" });
                if (!res.ok) throw new Error("Failed to fetch doctors");
                const data = await res.json();
                setDoctors(data.doctors || []);
            } catch (err: any) {
                setError(err.message || "Error loading doctors");
            } finally {
                setLoading(false);
            }
        }
        fetchDoctors();
    }, []);

    const handleAddRemove = async (doctorId: number, add: boolean) => {
        setSubmitting(true);
        setError("");
        try {
            const res = await fetch(`/api/hospital/${add ? "add-doctor" : "remove-doctor"}/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ doctor_id: doctorId }),
            });
            if (!res.ok) throw new Error("Failed to update doctor");
            setDoctors((prev) => prev.map((doc) => doc.id === doctorId ? { ...doc, is_added: add } : doc));
        } catch (err: any) {
            setError(err.message || "Error updating doctor");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#eef8f4] via-[#f8fcfb] to-white flex flex-col items-center py-10">
            <div className="bg-white bg-opacity-90 rounded-xl shadow-md p-8 w-full max-w-2xl">
                <h1 className="text-3xl font-extrabold text-blue-700 mb-6 text-center">Manage Doctors</h1>
                {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
                {loading ? (
                    <div className="text-center">Loading doctors...</div>
                ) : (
                    <ul className="divide-y divide-blue-100">
                        {doctors.map((doctor) => (
                            <li key={doctor.id} className="flex items-center justify-between py-4">
                                <div>
                                    <div className="font-semibold text-slate-900">{doctor.full_name}</div>
                                    <div className="text-sm text-slate-600">{doctor.email}</div>
                                </div>
                                {doctor.is_added ? (
                                    <BlackButton
                                        disabled={submitting}
                                        onClick={() => handleAddRemove(doctor.id, false)}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        Remove
                                    </BlackButton>
                                ) : (
                                    <BlackButton
                                        disabled={submitting}
                                        onClick={() => handleAddRemove(doctor.id, true)}
                                    >
                                        Add
                                    </BlackButton>
                                )}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
