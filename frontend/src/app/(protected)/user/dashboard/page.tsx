"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    profileImage?: string;
}

export default function UserDashboard() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        // Get user data from localStorage
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
            {/* Header */}
            <div className="flex items-center space-x-4 mb-8">
                {user?.profileImage ? (
                    <Image
                        src={user.profileImage}
                        alt={user.name}
                        width={64}
                        height={64}
                        className="rounded-full object-cover border-4 border-blue-500 shadow-lg"
                    />
                ) : (
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-2xl border-4 border-white shadow-lg">
                        {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                    </div>
                )}
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        Welcome back, {user?.name}!
                    </h1>
                    <p className="text-gray-600 mt-2">
                        Here's your health dashboard overview
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Upcoming</p>
                            <p className="text-2xl font-bold text-gray-800">3</p>
                            <p className="text-gray-600 text-sm mt-1">Appointments</p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Total</p>
                            <p className="text-2xl font-bold text-gray-800">12</p>
                            <p className="text-gray-600 text-sm mt-1">Consultations</p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Active</p>
                            <p className="text-2xl font-bold text-gray-800">2</p>
                            <p className="text-gray-600 text-sm mt-1">Prescriptions</p>
                        </div>
                        <div className="bg-purple-100 p-3 rounded-full">
                            <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-500 text-sm">Health</p>
                            <p className="text-2xl font-bold text-gray-800">95%</p>
                            <p className="text-gray-600 text-sm mt-1">Score</p>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Upcoming Appointments */}
                <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        Upcoming Appointments
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                                <div className="bg-blue-500 text-white p-3 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">Dr. Sarah Johnson</p>
                                    <p className="text-sm text-gray-600">General Checkup</p>
                                    <p className="text-xs text-gray-500 mt-1">March 2, 2026 - 10:00 AM</p>
                                </div>
                            </div>
                            <button className="text-blue-500 hover:text-blue-600 font-medium">
                                View Details
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                                <div className="bg-green-500 text-white p-3 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">Dr. Michael Chen</p>
                                    <p className="text-sm text-gray-600">Dental Cleaning</p>
                                    <p className="text-xs text-gray-500 mt-1">March 5, 2026 - 2:30 PM</p>
                                </div>
                            </div>
                            <button className="text-green-500 hover:text-green-600 font-medium">
                                View Details
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                            <div className="flex items-center space-x-4">
                                <div className="bg-purple-500 text-white p-3 rounded-lg">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-800">Dr. Emily Davis</p>
                                    <p className="text-sm text-gray-600">Follow-up Consultation</p>
                                    <p className="text-xs text-gray-500 mt-1">March 8, 2026 - 11:00 AM</p>
                                </div>
                            </div>
                            <button className="text-purple-500 hover:text-purple-600 font-medium">
                                View Details
                            </button>
                        </div>
                    </div>
                    <button className="mt-4 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg transition">
                        Book New Appointment
                    </button>
                </div>

                {/* Quick Actions & Health Tips */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            Quick Actions
                        </h2>
                        <div className="space-y-3">
                            <button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg transition flex items-center justify-center space-x-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span>New Appointment</span>
                            </button>
                            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg transition flex items-center justify-center space-x-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                </svg>
                                <span>Message Doctor</span>
                            </button>
                            <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 rounded-lg transition flex items-center justify-center space-x-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>View Records</span>
                            </button>
                        </div>
                    </div>

                    {/* Health Tip */}
                    <div className="bg-gradient-to-br from-green-400 to-blue-500 p-6 rounded-lg shadow-md text-white">
                        <h2 className="text-xl font-bold mb-2">
                            💡 Health Tip of the Day
                        </h2>
                        <p className="text-sm opacity-90">
                            Stay hydrated! Aim to drink at least 8 glasses of water daily to maintain optimal health and energy levels.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}