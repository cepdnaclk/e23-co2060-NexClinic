"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function HospitalAdminDashboard() {
    const [hospitalName, setHospitalName] = useState<string>("");

    useEffect(() => {
        async function fetchHospitalProfile() {
            try {
                const res = await fetch("/api/hospital/profile", { method: "GET", credentials: "include" });
                if (res.ok) {
                    const data = await res.json();
                    setHospitalName(data?.name || "Hospital");
                } else {
                    setHospitalName("Hospital");
                }
            } catch {
                setHospitalName("Hospital");
            }
        }
        fetchHospitalProfile();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#eef8f4] via-[#f8fcfb] to-white">
            <div className="mx-auto w-full max-w-7xl space-y-5 px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8 sm:space-y-6">
                <section className="relative overflow-hidden rounded-[2rem] border border-blue-100 bg-white/95 shadow-[0_20px_60px_rgba(37,99,235,0.10)]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.10),transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.08),transparent_40%)]" />
                    <div className="relative space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-stretch xl:justify-between">
                            <div className="flex-1 rounded-[1.75rem] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5 lg:p-6">
                                <div className="min-w-0 flex-1 text-center sm:text-left">
                                    <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                                        Welcome, {hospitalName}
                                    </h1>
                                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                                        Manage your hospital's doctors, appointment slots, and profile from this dashboard.
                                    </p>
                                </div>
                            </div>
                            <div className="w-full rounded-[1.75rem] border border-blue-100 bg-gradient-to-br from-blue-600 via-blue-400 to-blue-700 p-5 text-white shadow-2xl xl:max-w-md">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">Quick Stats</p>
                                    <div className="mt-4 flex flex-col gap-2">
                                        <div className="flex justify-between">
                                            <span>Doctors</span>
                                            <span className="font-bold">--</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Available Slots</span>
                                            <span className="font-bold">--</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Upcoming Appointments</span>
                                            <span className="font-bold">--</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            <Link
                                href="/hospital/slots"
                                className="group rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                            >
                                <p className="text-lg font-bold text-slate-900">Manage Appointment Slots</p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">Add, update, or remove available time slots for your doctors.</p>
                            </Link>
                            <Link
                                href="/hospital/doctors"
                                className="group rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                            >
                                <p className="text-lg font-bold text-slate-900">Manage Doctors</p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">View and update your hospital's doctor list and their details.</p>
                            </Link>
                            <Link
                                href="/hospital/profile"
                                className="group rounded-2xl border border-blue-100 bg-white/90 p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
                            >
                                <p className="text-lg font-bold text-slate-900">Update Hospital Profile</p>
                                <p className="mt-2 text-sm leading-6 text-slate-600">Edit your hospital's information and contact details.</p>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}