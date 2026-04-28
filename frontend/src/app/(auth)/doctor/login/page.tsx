"use client";

import DoctorLoginForm from '@/components/doctor/DoctorLoginForm';

function DoctorLogin() {
    return (
        <div className="min-h-screen flex flex-col md:flex-row pt-[64px]">
            {/* Left branded panel */}
            <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-teal-600 via-cyan-700 to-blue-800 flex-col items-center justify-center p-12 relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white opacity-5" />
                <div className="absolute bottom-10 -right-16 w-80 h-80 rounded-full bg-white opacity-5" />
                <div className="absolute top-1/2 left-0 w-40 h-40 rounded-full bg-cyan-400 opacity-10 -translate-y-1/2" />

                {/* Medical cross icon */}
                <div className="mb-8 bg-white bg-opacity-15 rounded-3xl p-6 shadow-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" className="w-24 h-24" fill="none">
                        <rect x="28" y="8" width="24" height="64" rx="6" fill="white" opacity="0.9" />
                        <rect x="8" y="28" width="64" height="24" rx="6" fill="white" opacity="0.9" />
                        <circle cx="40" cy="40" r="8" fill="rgba(20,184,166,0.6)" />
                    </svg>
                </div>

                {/* Brand text */}
                <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight text-center">
                    NexClinic
                </h1>
                <p className="text-cyan-100 text-lg font-medium mb-6 text-center">
                    Doctor Portal
                </p>
                <p className="text-cyan-200 text-sm text-center max-w-xs leading-relaxed">
                    Streamline your practice, manage appointments, and deliver exceptional patient care — all in one place.
                </p>

                {/* Feature pills */}
                <div className="mt-10 flex flex-col gap-3 w-full max-w-xs">
                    {[
                        { icon: "📅", text: "Appointment Management" },
                        { icon: "👤", text: "Patient Records" },
                        { icon: "📊", text: "Analytics Dashboard" },
                    ].map((feat) => (
                        <div key={feat.text} className="flex items-center gap-3 bg-white bg-opacity-10 rounded-xl px-4 py-3">
                            <span className="text-xl">{feat.icon}</span>
                            <span className="text-white text-sm font-medium">{feat.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right login panel */}
            <div className="flex flex-1 items-center justify-center bg-gray-50 p-6">
                <div className="w-full max-w-md">
                    {/* Mobile-only logo */}
                    <div className="flex md:hidden items-center justify-center gap-3 mb-8">
                        <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl p-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" className="w-8 h-8" fill="none">
                                <rect x="14" y="4" width="12" height="32" rx="3" fill="white" opacity="0.9" />
                                <rect x="4" y="14" width="32" height="12" rx="3" fill="white" opacity="0.9" />
                            </svg>
                        </div>
                        <span className="text-2xl font-extrabold text-gray-800">NexClinic</span>
                    </div>

                    <DoctorLoginForm />
                </div>
            </div>
        </div>
    );
}

export default DoctorLogin;
