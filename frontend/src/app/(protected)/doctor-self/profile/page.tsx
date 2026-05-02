"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
        licenseNumber: string;
        isVerified: boolean;
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
    const hospitals = profileData?.profileDetails.hospitals ?? [];
    const languages = profileData?.profileDetails.languages ?? [];
    const licenseNumber = profileData?.doctor.licenseNumber || "Not specified";
    const email = profileData?.doctor.email || "Not available";
    const phone = profileData?.doctor.phone || "Not available";
    const isVerified = profileData?.doctor.isVerified ?? false;

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_28%),linear-gradient(180deg,#eefbf6_0%,#f8fcfb_42%,#ffffff_100%)]">
            <div className="absolute inset-0 bg-[url('/images/doctor-login-bg.png')] bg-cover bg-center bg-no-repeat opacity-[0.08]" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/88 via-white/82 to-white/95" aria-hidden="true" />
            <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-100/50 to-transparent" aria-hidden="true" />
            <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" aria-hidden="true" />
            <div className="absolute right-0 top-36 h-80 w-80 rounded-full bg-teal-200/20 blur-3xl" aria-hidden="true" />

            <div className="relative mx-auto max-w-7xl justify-center gap-4">
            <div title="profile-header-card" className="flex flex-col xl:flex-row items-center justify-between gap-6 xl:gap-8 mx-4 mt-4 sm:mt-8 bg-white/90 shadow-[0_20px_60px_rgba(16,185,129,0.12)] backdrop-blur p-4 sm:p-8 xl:p-12 rounded-[2rem] border border-white/80">
                <div title="left-column" className="flex flex-col sm:flex-row gap-4 items-center xl:pl-4 justify-center">
                    <img src="https://img.freepik.com/free-photo/portrait-smiling-male-doctor-with-stethoscope_171337-1532.jpg" alt="Doctor Profile" className="w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover" />
                    <div title="name-spec-place" className="flex flex-col gap-2 text-center sm:text-left">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold dark:text-white">{doctorName}</h1>
                        <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                            <div title="specialization" className="flex items-center rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-green-600 dark:text-green-300 font-semibold text-sm sm:text-base w-max mt-1 mx-auto sm:mx-0">{specialization}</div>
                            <div title="experience" className="flex items-center rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-green-600 dark:text-green-300 font-semibold text-sm sm:text-base w-max mt-1 mx-auto sm:mx-0">{experience}</div>
                        </div>
                        <p title="location" className="text-gray-600 dark:text-gray-400 mt-1">
                            <img src="/images/location.png" className="w-4 h-4 inline mr-2" alt="Location Icon" />
                            {location}
                        </p>
                        {loading && <p className="text-xs text-gray-500">Loading profile...</p>}
                        {error && <p className="text-xs text-red-500">{error}</p>}
                    </div>
                </div>
                <div title="right-column" className="flex flex-col gap-4 justify-center w-full xl:w-auto xl:pr-4">
                    <div title="toggle-btn" className="flex flex-col sm:flex-row gap-4 sm:gap-6 pb-2 items-center sm:justify-between w-full">
                        <div title="text-column" className="text-center sm:text-left">
                            <p className="text-black dark:text-white font-bold text-lg sm:text-xl">Availability for Online Advice</p>
                            <p className="text-gray-400 dark:text-gray-500 text-sm font-bold">
                                {isSavingAvailability ? "Saving..." : isOn ? "Available" : "Unavailable"}
                            </p>
                        </div>
                        <div title="toggle-switch" className={`justify-center ${isSavingAvailability || loading || !profileData ? "pointer-events-none opacity-60" : ""}`}>
                            <ToggleSwitch isOn={isOn} onToggle={(newState) => {
                                void handleAvailabilityToggle(newState);
                            }} />
                        </div>

                    </div>
                    <div className="flex w-full justify-center sm:justify-end">
                        <GreenButton className="px-6 py-2 rounded-lg w-full sm:w-auto">
                            Edit Profile
                        </GreenButton>
                    </div>
                </div>
            </div>

            <div title="consultation-fees-section" className="mx-4 mt-6 rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_50px_rgba(16,185,129,0.08)] sm:p-6 lg:p-8">
                <h2 className="mb-4 text-xl font-bold text-emerald-700 sm:text-2xl">Consultation Fees and Active hours</h2>
                <div className="my-4 flex w-full border-t border-emerald-100"></div>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">
                            <img src="/images/chat.png" className="w-4 h-4 inline mr-2" alt="Chat Icon" />
                            Online Chat Session:
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">Rs. {chatFee.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Quick online advice for minor concerns</p>
                    </div>
                    <div className="flex flex-col">
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">
                            <img src="/images/appointment.png" className="w-4 h-4 inline mr-2" alt="Appointment Icon" />
                            In-Person Appointment:
                        </p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200">Rs. {appointmentFee.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Full consultation and examination</p>
                    </div>
                </div>
                <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-4">
                    <div className="text-gray-600 dark:text-gray-300 text-sm">
                        <span className="font-semibold">Usually available times for Online Advice Chats:</span>
                        <ul className="flex flex-col list-disc pl-6 gap-2 mt-2">
                            {schedule.map((slot) => (
                                <li key={slot}>{slot}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            <div title="profile-content-section" className="flex flex-col lg:flex-row mx-4 my-6 gap-4">

                <div title="professional-details" className="w-full rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_50px_rgba(16,185,129,0.08)] sm:p-8 lg:w-1/2">
                    <div title="Title">
                        <h2 className="mb-4 text-xl font-bold text-emerald-700 sm:text-2xl">Professional Details</h2>
                    </div>

                    <div className="my-4 flex w-full border-t border-emerald-100"></div>

                    <div title="SLMC-reg-ID" className="flex flex-col sm:flex-row my-2 items-start sm:items-center justify-between gap-2 sm:gap-4">
                        <div className="text-gray-600 dark:text-gray-400">
                            <span className="font-bold text-gray-800 dark:text-gray-200">SLMC Registration ID:</span>
                            {licenseNumber}
                        </div>
                        <div title="verification-status" className="flex items-center rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-green-600 dark:text-green-300 font-semibold text-sm sm:text-md w-max mt-1">
                            <img src="/images/verified.png" className="w-4 h-4 inline mr-2" alt="Verified Icon" />
                            {isVerified ? "Verified" : "Pending Verification"}
                        </div>

                    </div>

                    <div title="Qualifications" className="flex flex-col my-2 text-gray-600 dark:text-gray-400">
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Qualifications:</p>
                        <ul className="flex flex-col list-disc pl-6 gap-2">
                            {qualifications.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>


                    <div title="Currently-Practicing-Hospitals" className="flex flex-col my-2 text-gray-600 dark:text-gray-400">
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Currently Practicing Hospitals:</p>
                        <ul className="flex flex-col list-disc pl-6 gap-2">
                            {hospitals.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div title="Languages" className="flex flex-col my-2 text-gray-600 dark:text-gray-400">
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Languages Spoken:</p>
                        <ul className="flex flex-col list-disc pl-6 gap-2">
                            {languages.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </div>

                </div>

                <div title="personal-info" className="w-full rounded-[2rem] border border-white/80 bg-white/90 p-4 shadow-[0_18px_50px_rgba(16,185,129,0.08)] sm:p-8 lg:w-1/2">
                    <div title="Title">
                        <h2 className="mb-4 text-xl font-bold text-emerald-700 sm:text-2xl">Personal Information</h2>
                    </div>

                    <div className="my-4 flex w-full border-t border-emerald-100"></div>

                    <div title="Email" className="flex flex-col mb-4 text-gray-600 dark:text-gray-400">
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Email Address:</p>
                        <div className="flex items-start min-w-0">
                            <img src="/images/at.png" className="w-4 h-4 inline mr-2 mt-1 shrink-0" alt="Email Icon" />
                            <p className="break-all sm:break-words">{email}</p>
                        </div>
                    </div>
                    <div title="Contact" className="flex flex-col mb-4 text-gray-600 dark:text-gray-400">
                        <p className="font-bold text-gray-800 dark:text-gray-200 mb-2">Contact Number:</p>
                        <div className="flex items-start min-w-0">
                            <img src="/images/phone.png" className="w-4 h-4 inline mr-2 mt-1 shrink-0" alt="Phone Icon" />
                            <p className="break-all sm:break-words">{phone}</p>
                        </div>
                    </div>

                </div>

            </div>
            </div>
        </div>
    );
}

export default DoctorProfilePage;