"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GreenButton from "@/components/buttons/GreenButton";
import ToggleSwitch from "@/components/buttons/ToggleSwitch";
import { handleDoctorSessionExpired } from "@/lib/doctorSession";

type DoctorProfileData = {
    doctor: {
        fullName: string;
        preferredName: string;
        email: string;
        specialization: string;
        phone: string;
        profileImage: string;
        licenseNumber: string;
        isVerified: boolean;
        photo?: string;
    };
    profileDetails: {
        experience: string;
        location: string;
        chatFee: number;
        appointmentFee: number;
        availabilityForOnlineAdvice: boolean;
        onlineAdviceSchedule: string[];
        qualifications: string[];
        hospitals: string[];
        languages: string[];
    };
};

function DoctorProfilePage() {
    const router = useRouter();

    const [isOn, setIsOn] = useState(false);
    const [profileData, setProfileData] = useState<DoctorProfileData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSavingAvailability, setIsSavingAvailability] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true);
            setError("");

            try {
                const response = await fetch("/api/doctor/profile", {
                    method: "GET",
                    cache: "no-store",
                });

                if (response.status === 401) {
                    handleDoctorSessionExpired(router);
                    return;
                }

                if (!response.ok) {
                    const errorPayload = await response.json().catch(() => ({}));
                    throw new Error(errorPayload?.error || "Failed to load profile details");
                }

                const data: DoctorProfileData = await response.json();
                setProfileData(data);
                setIsOn(data.profileDetails.availabilityForOnlineAdvice);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load profile details");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [router]);

    const handleAvailabilityToggle = async (newState: boolean) => {
        if (!profileData || loading || isSavingAvailability) {
            return;
        }

        const previousState = isOn;
        setIsOn(newState);
        setIsSavingAvailability(true);
        setError("");

        try {
            const response = await fetch("/api/doctor/profile", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    availabilityForOnlineAdvice: newState,
                }),
            });

            if (response.status === 401) {
                handleDoctorSessionExpired(router);
                return;
            }

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload?.error || "Failed to update availability");
            }

            setProfileData((current) =>
                current
                    ? {
                        ...current,
                        profileDetails: {
                            ...current.profileDetails,
                            availabilityForOnlineAdvice: newState,
                        },
                    }
                    : current
            );
        } catch (err) {
            setIsOn(previousState);
            setError(err instanceof Error ? err.message : "Failed to update availability");
        } finally {
            setIsSavingAvailability(false);
        }
    };

    const doctorName = profileData?.doctor.fullName || "Doctor";
    const specialization = profileData?.doctor.specialization || "General";
    const experience = profileData?.profileDetails.experience || "Not specified";
    const location = profileData?.profileDetails.location || "Not specified";
    const chatFee = profileData?.profileDetails.chatFee ?? 0;
    const appointmentFee = profileData?.profileDetails.appointmentFee ?? 0;
    const schedule = profileData?.profileDetails.onlineAdviceSchedule ?? [];
    const qualifications = profileData?.profileDetails.qualifications ?? [];
    const verifiedHospitals = profileData?.profileDetails.hospitals ?? [];
    const languages = profileData?.profileDetails.languages ?? [];
    const licenseNumber = profileData?.doctor.licenseNumber || "Not specified";
    const email = profileData?.doctor.email || "Not available";
    const phone = profileData?.doctor.phone || "Not available";
    const isVerified = profileData?.doctor.isVerified ?? false;

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.24),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.16),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(22,163,74,0.12),_transparent_24%),linear-gradient(180deg,#eafbf2_0%,#f7fdf8_40%,#ffffff_100%)] dark:bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.08),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(34,197,94,0.06),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(22,163,74,0.05),_transparent_24%),linear-gradient(180deg,#1a1a1a_0%,#252525_40%,#1f1f1f_100%)]">
            <div className="absolute inset-0 bg-[url('/images/doctor-registration-bg.jpg')] bg-cover bg-center bg-no-repeat opacity-[0.10] dark:opacity-[0.05]" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/84 via-white/76 to-white/96 dark:from-gray-900/86 dark:via-gray-800/80 dark:to-gray-900/96" aria-hidden="true" />
            <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-100/70 via-green-100/30 to-transparent" aria-hidden="true" />
            <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-200/30 dark:bg-emerald-800/15 blur-3xl" aria-hidden="true" />
            <div className="absolute right-0 top-36 h-80 w-80 rounded-full bg-green-200/24 dark:bg-green-800/15 blur-3xl" aria-hidden="true" />
            <div className="absolute left-1/3 top-10 h-56 w-56 rounded-full bg-emerald-200/20 blur-3xl" aria-hidden="true" />

            <div className="relative mx-auto max-w-7xl justify-center gap-4">
            <div title="profile-header-card" className="relative flex flex-col xl:flex-row items-center justify-between gap-8 xl:gap-12 mx-4 mt-4 sm:mt-8 bg-gradient-to-r from-white/98 dark:from-gray-800/96 via-emerald-50/90 dark:via-gray-800/90 to-green-50/82 dark:to-gray-700/80 shadow-[0_28px_70px_rgba(16,185,129,0.16)] dark:shadow-black/30 backdrop-blur p-6 sm:p-10 xl:p-14 rounded-[2rem] border border-white/80 dark:border-gray-600 overflow-hidden">
                <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-emerald-200/20 dark:bg-emerald-900/10 blur-3xl" aria-hidden="true" />
                <div className="absolute left-10 bottom-0 h-40 w-40 rounded-full bg-amber-200/20 blur-3xl" aria-hidden="true" />
                <div title="left-column" className="relative z-10 flex flex-col sm:flex-row gap-6 items-center xl:gap-8">
                    <div className="relative rounded-[2rem] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-[4px] shadow-[0_18px_45px_rgba(16,185,129,0.26)] dark:shadow-black/40">
                        <div className="relative overflow-hidden rounded-[1.75rem] bg-white p-1">
                            <img src="https://img.freepik.com/free-photo/portrait-smiling-male-doctor-with-stethoscope_171337-1532.jpg" alt="Doctor Profile" className="w-28 h-28 sm:w-40 sm:h-40 rounded-[1.5rem] object-cover" />
                            <div className="absolute left-3 top-3 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold tracking-[0.22em] text-emerald-700 backdrop-blur-sm">
                                PROFILE
                            </div>
                        </div>
                    </div>
                    <div title="name-spec-place" className="flex flex-col gap-3 text-center sm:text-left">
                        <div>
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 dark:text-gray-100">{doctorName}</h1>
                            <p className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold mt-1">Medical Professional</p>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                            <div title="specialization" className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-100 via-white to-emerald-50 dark:from-emerald-900/40 dark:via-gray-800 dark:to-emerald-800/40 px-4 py-2 text-emerald-700 dark:text-emerald-300 font-semibold text-sm sm:text-base border border-emerald-200/60 dark:border-emerald-700/50 w-max shadow-sm">
                                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-600 dark:bg-emerald-400"></span>
                                {specialization}
                            </div>
                            <div title="experience" className="flex items-center gap-2 rounded-full bg-gradient-to-r from-green-100 via-white to-emerald-50 dark:from-green-900/40 dark:via-gray-800 dark:to-emerald-800/40 px-4 py-2 text-green-700 dark:text-green-300 font-semibold text-sm sm:text-base border border-green-200/60 dark:border-green-700/50 w-max shadow-sm">
                                <span className="inline-flex h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></span>
                                {experience}
                            </div>
                        </div>
                        <p title="location" className="text-gray-700 dark:text-gray-300 font-medium mt-2 flex items-center justify-center sm:justify-start">
                            <img src="/images/location.png" className="w-5 h-5 mr-2" alt="Location Icon" />
                            {location}
                        </p>
                        {loading && <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Loading profile...</p>}
                        {error && <p className="text-xs text-red-500 dark:text-red-400 mt-2">{error}</p>}
                    </div>
                </div>
                <div title="right-column" className="relative z-10 flex flex-col gap-6 justify-center w-full xl:w-auto">
                    <div className="rounded-[1.5rem] bg-gradient-to-br from-emerald-50/90 via-white to-green-50/85 dark:from-emerald-900/30 dark:via-gray-800/85 dark:to-gray-800 border border-emerald-100/50 dark:border-emerald-700/50 p-6 backdrop-blur shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
                        <div title="toggle-btn" className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-center sm:justify-between">
                            <div title="text-column" className="text-center sm:text-left">
                                <p className="text-gray-900 dark:text-gray-100 font-bold text-base sm:text-lg">Online Availability</p>
                                <p className={`text-sm font-semibold mt-1 ${
                                    isOn ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-gray-400"
                                }`}>
                                    {isSavingAvailability ? "Updating..." : isOn ? "✓ Available Now" : "○ Not Available"}
                                </p>
                            </div>
                            <div title="toggle-switch" className={`transition-opacity duration-300 ${isSavingAvailability || loading || !profileData ? "pointer-events-none opacity-60" : ""}`}>
                                <ToggleSwitch isOn={isOn} onToggle={(newState) => {
                                    void handleAvailabilityToggle(newState);
                                }} />
                            </div>
                        </div>
                    </div>
                    <div className="flex w-full justify-center">
                        <Link href="/doctor-self/edit-profile">
                            <GreenButton className="px-8 py-3 rounded-full font-semibold bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 shadow-[0_12px_30px_rgba(16,185,129,0.32)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.42)] transition-all duration-300">
                                Edit Profile
                            </GreenButton>
                        </Link>
                    </div>
                </div>
            </div>

            <div title="consultation-fees-section" className="mx-4 mt-6 rounded-[2rem] border border-white/80 dark:border-gray-600 bg-gradient-to-br from-white via-emerald-50/70 to-green-50/70 dark:bg-gray-800/92 p-4 shadow-[0_18px_50px_rgba(16,185,129,0.08)] dark:shadow-black/20 sm:p-6 lg:p-8">
                <h2 className="mb-4 text-xl font-bold text-emerald-700 dark:text-emerald-400 sm:text-2xl">Consultation Fees and Active hours</h2>
                <div className="my-4 flex w-full border-t border-emerald-100 dark:border-emerald-800"></div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex flex-col rounded-[1.5rem] bg-white/85 dark:bg-gray-800/80 p-5 border border-emerald-100/70 dark:border-emerald-700/40 shadow-sm">
                        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <img src="/images/chat.png" className="w-4 h-4 inline mr-2" alt="Chat Icon" />
                            Online Chat Session:
                        </p>
                        <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">Rs. {chatFee.toLocaleString()}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Quick online advice for minor concerns</p>
                    </div>
                    <div className="flex flex-col rounded-[1.5rem] bg-white/85 dark:bg-gray-800/80 p-5 border border-green-100/70 dark:border-green-700/40 shadow-sm">
                        <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            <img src="/images/appointment.png" className="w-4 h-4 inline mr-2" alt="Appointment Icon" />
                            In-Person Appointment:
                        </p>
                        <p className="text-2xl sm:text-3xl font-black text-green-600 dark:text-green-400">Rs. {appointmentFee.toLocaleString()}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Full consultation and examination</p>
                    </div>
                </div>
                <div className="rounded-3xl border border-emerald-100 dark:border-emerald-800 bg-gradient-to-br from-emerald-50 dark:from-emerald-900/30 via-white to-white dark:via-gray-800/85 dark:to-gray-800 p-4">
                    <div className="text-gray-700 dark:text-gray-300 text-sm">
                        <span className="font-semibold text-gray-800 dark:text-gray-200">Usually available times for Online Advice Chats:</span>
                        <ul className="flex flex-col list-disc pl-6 gap-2 mt-2">
                            {schedule.map((slot) => (
                                <li key={slot} className="text-gray-700 dark:text-gray-300">{slot}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div title="profile-content-section" className="flex flex-col lg:flex-row mx-4 my-6 gap-4">

                <div title="professional-details" className="w-full rounded-[2rem] border border-white/80 dark:border-gray-600 bg-gradient-to-br from-white via-emerald-50/60 to-green-50/50 dark:bg-gray-800/92 p-4 shadow-[0_18px_50px_rgba(16,185,129,0.08)] dark:shadow-black/20 sm:p-8 lg:w-1/2">
                    <div title="Title">
                        <h2 className="mb-4 text-xl font-bold text-emerald-700 dark:text-emerald-400 sm:text-2xl">Professional Details</h2>
                    </div>

                    <div className="my-4 flex w-full border-t border-emerald-100 dark:border-emerald-800"></div>

                    <div title="SLMC-reg-ID" className="flex flex-col sm:flex-row my-2 items-start sm:items-center justify-between gap-2 sm:gap-4">
                        <div className="text-gray-700 dark:text-gray-300">
                            <span className="font-semibold text-gray-800 dark:text-gray-200">SLMC Registration ID:</span>
                            <span className="font-semibold text-gray-900 dark:text-gray-100 ml-2">{licenseNumber}</span>
                        </div>
                        <div title="verification-status" className="flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 text-emerald-700 dark:text-emerald-300 font-semibold text-sm sm:text-md w-max mt-1">
                            <img src="/images/verified.png" className="w-4 h-4 inline mr-2" alt="Verified Icon" />
                            {isVerified ? "Verified" : "Pending Verification"}
                        </div>

                    </div>

                    <div title="Qualifications" className="flex flex-col my-2">
                        <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Qualifications:</p>
                        <div className="flex flex-wrap gap-2">
                            {qualifications.length > 0 ? (
                                qualifications.map((item) => (
                                    <span
                                        key={item}
                                        className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                    >
                                        {item}
                                    </span>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No qualifications added yet.</p>
                            )}
                        </div>
                    </div>


                    <div title="Verified-Hospitals" className="flex flex-col my-2">
                        <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Verified Hospitals:</p>
                        {verifiedHospitals.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {verifiedHospitals.map((item) => (
                                    <span
                                        key={item}
                                        className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                                    >
                                        {item}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">No verified hospitals yet.</p>
                        )}
                    </div>

                    <div title="Languages" className="flex flex-col my-2">
                        <p className="font-semibold text-gray-800 mb-2">Languages Spoken:</p>
                        <div className="flex flex-wrap gap-2">
                            {languages.length > 0 ? (
                                languages.map((item) => (
                                    <span key={item} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                                        {item}
                                    </span>
                                ))
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No languages specified.</p>
                            )}
                        </div>
                    </div>

                </div>

                <div title="personal-info" className="w-full rounded-[2rem] border border-white/80 bg-gradient-to-br from-white via-emerald-50/55 to-green-50/55 p-4 shadow-[0_18px_50px_rgba(16,185,129,0.08)] sm:p-8 lg:w-1/2">
                    <div title="Title">
                        <h2 className="mb-4 text-xl font-bold text-emerald-700 sm:text-2xl">Personal Information</h2>
                    </div>

                    <div className="my-4 flex w-full border-t border-emerald-100"></div>

                    <div title="Email" className="flex flex-col mb-4">
                        <p className="font-semibold text-gray-800 mb-2">Email Address:</p>
                        <div className="flex items-start min-w-0">
                            <img src="/images/at.png" className="w-4 h-4 inline mr-2 mt-1 shrink-0" alt="Email Icon" />
                            <p className="break-all sm:break-words text-gray-700 font-medium">{email}</p>
                        </div>
                    </div>
                    <div title="Contact" className="flex flex-col mb-4">
                        <p className="font-semibold text-gray-800 mb-2">Contact Number:</p>
                        <div className="flex items-start min-w-0">
                            <img src="/images/phone.png" className="w-4 h-4 inline mr-2 mt-1 shrink-0" alt="Phone Icon" />
                            <p className="break-all sm:break-words text-gray-700 font-medium">{phone}</p>
                        </div>
                    </div>

                </div>

            </div>
            </div>
        </div>
    );
}

export default DoctorProfilePage;
