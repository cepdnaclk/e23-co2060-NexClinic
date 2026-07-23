"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GreenButton from "@/components/buttons/GreenButton";
import WhiteButton from "@/components/buttons/WhiteButton";
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
        onlineDoctorPayment: number;
        onlineHospitalCharge: number;
        inpersonDoctorPayment: number;
        inpersonHospitalCharge: number;
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
    const onlineDoctorPayment = profileData?.profileDetails.onlineDoctorPayment ?? 0;
    const onlineHospitalCharge = profileData?.profileDetails.onlineHospitalCharge ?? 0;
    const inpersonDoctorPayment = profileData?.profileDetails.inpersonDoctorPayment ?? 0;
    const inpersonHospitalCharge = profileData?.profileDetails.inpersonHospitalCharge ?? 0;
    const schedule = profileData?.profileDetails.onlineAdviceSchedule ?? [];
    const qualifications = profileData?.profileDetails.qualifications ?? [];
    const verifiedHospitals = profileData?.profileDetails.hospitals ?? [];
    const languages = profileData?.profileDetails.languages ?? [];
    const licenseNumber = profileData?.doctor.licenseNumber || "Not specified";
    const email = profileData?.doctor.email || "Not available";
    const phone = profileData?.doctor.phone || "Not available";
    const isVerified = profileData?.doctor.isVerified ?? false;
    const profileImage = profileData?.doctor.profileImage || profileData?.doctor.photo || "/images/user.png";

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_26%),linear-gradient(180deg,#eefbf6_0%,#f8fcfb_42%,#ffffff_100%)] pb-8">
            <div className="absolute inset-0 bg-[url('/images/doctor-login-bg.png')] bg-cover bg-center bg-no-repeat opacity-[0.08]" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/88 via-white/80 to-white/95" aria-hidden="true" />
            <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-100/60 to-transparent" aria-hidden="true" />
            <div className="absolute -left-24 top-28 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" aria-hidden="true" />
            <div className="absolute right-0 top-36 h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl" aria-hidden="true" />

            <div className="relative mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
                <section className="overflow-hidden rounded-[2.5rem] border border-emerald-100/70 bg-white/80 shadow-[0_24px_80px_rgba(16,185,129,0.12)] backdrop-blur">
                    <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
                        <div className="relative p-6 sm:p-8 lg:p-10">
                            <div className="absolute right-0 top-0 h-44 w-44 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-100/60 blur-3xl" aria-hidden="true" />
                            <div className="relative">
                                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-emerald-700">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    MY PROFILE
                                </div>

                                <div className="mt-6 flex flex-col gap-6 sm:flex-row sm:items-center">
                                    <div className="mx-auto shrink-0 rounded-[2rem] bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-[4px] shadow-[0_18px_45px_rgba(16,185,129,0.26)] sm:mx-0">
                                        <div className="relative overflow-hidden rounded-[1.75rem] bg-white p-1">
                                            <img src={profileImage} alt="Doctor Profile" className="h-28 w-28 rounded-[1.5rem] object-cover sm:h-36 sm:w-36" />
                                        </div>
                                    </div>

                                    <div className="min-w-0 flex-1 text-center sm:text-left">
                                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">{doctorName}</h1>
                                        <p className="mt-1 text-sm font-semibold text-emerald-700">Medical Professional</p>

                                        <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
                                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                {specialization}
                                            </span>
                                            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                {experience}
                                            </span>
                                        </div>

                                        <p className="mt-3 flex items-center justify-center text-sm text-slate-600 sm:justify-start">
                                            <img src="/images/location.png" className="mr-2 h-4 w-4" alt="Location" />
                                            {location}
                                        </p>

                                        {loading && <p className="mt-2 text-xs text-slate-500">Loading profile...</p>}
                                        {error && <p className="mt-2 text-xs text-rose-500">{error}</p>}
                                    </div>
                                </div>

                                <div className="mt-8 flex flex-wrap gap-3">
                                    <Link href="/doctor-self/edit-profile">
                                        <GreenButton className="rounded-full px-6 py-3">Edit Profile</GreenButton>
                                    </Link>
                                    <Link href="/doctor-self/appointment-slots">
                                        <WhiteButton className="rounded-full px-6 py-3">Manage Slots</WhiteButton>
                                    </Link>
                                </div>
                            </div>
                        </div>

                        <div className="relative min-h-[320px] bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 p-4 sm:p-6 lg:min-h-full">
                            <div className="absolute inset-0 bg-[url('/images/doctor-login-bg.png')] bg-cover bg-center bg-no-repeat opacity-25" aria-hidden="true" />
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-950/20 via-transparent to-slate-950/30" aria-hidden="true" />
                            <div className="relative flex h-full flex-col justify-between rounded-[2rem] border border-white/15 bg-white/10 p-5 text-white backdrop-blur-sm sm:p-6">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">Availability</p>
                                    <p className="mt-3 text-2xl font-bold sm:text-3xl">
                                        {isOn ? "You are currently available for online advice." : "You are currently offline."}
                                    </p>
                                    <p className="mt-3 max-w-md text-sm leading-6 text-white/85">
                                        Toggle your online availability to let patients reach you for quick advice chats.
                                    </p>

                                    <div className="mt-6 flex items-center gap-4">
                                        <div className={`transition-opacity duration-300 ${isSavingAvailability || loading || !profileData ? "pointer-events-none opacity-60" : ""}`}>
                                            <ToggleSwitch isOn={isOn} onToggle={(newState) => {
                                                void handleAvailabilityToggle(newState);
                                            }} />
                                        </div>
                                        <p className={`text-sm font-semibold ${isOn ? "text-emerald-200" : "text-white/60"}`}>
                                            {isSavingAvailability ? "Updating..." : isOn ? "Available Now" : "Not Available"}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-3xl border border-white/20 bg-white/12 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Chat Fee</p>
                                        <p className="mt-2 text-2xl font-bold">Rs. {chatFee.toLocaleString()}</p>
                                    </div>
                                    <div className="rounded-3xl border border-white/20 bg-white/12 p-4">
                                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Appointment Fee</p>
                                        <p className="mt-2 text-2xl font-bold">Rs. {appointmentFee.toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
                        <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Specialization</p>
                        <p className="mt-2 text-xl font-bold text-slate-900">{specialization}</p>
                    </div>
                    <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
                        <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-cyan-500 to-sky-500" />
                        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Experience</p>
                        <p className="mt-2 text-xl font-bold text-slate-900">{experience}</p>
                    </div>
                    <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
                        <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-emerald-500 to-lime-500" />
                        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">SLMC Registration</p>
                        <p className="mt-2 text-xl font-bold text-slate-900">{licenseNumber}</p>
                    </div>
                    <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
                        <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
                        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Verification</p>
                        <div className="mt-2 flex items-center gap-2">
                            <img src="/images/verified.png" className="h-5 w-5" alt="Verified" />
                            <p className="text-xl font-bold text-slate-900">{isVerified ? "Verified" : "Pending"}</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
                    <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
                        <div className="border-b border-emerald-100/80 bg-gradient-to-r from-emerald-50 to-white p-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">Credentials</p>
                            <h2 className="mt-2 text-2xl font-bold text-slate-900">Professional Details</h2>
                        </div>

                        <div className="space-y-5 p-6">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Qualifications</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {qualifications.length > 0 ? (
                                        qualifications.map((item) => (
                                            <span key={item} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                                                {item}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500">No qualifications added yet.</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Verified Hospitals</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {verifiedHospitals.length > 0 ? (
                                        verifiedHospitals.map((item) => (
                                            <span key={item} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                                                {item}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500">No verified hospitals yet.</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Languages Spoken</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {languages.length > 0 ? (
                                        languages.map((item) => (
                                            <span key={item} className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                                                {item}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500">No languages specified.</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Online Advice Schedule</p>
                                <div className="mt-3">
                                    {schedule.length > 0 ? (
                                        <ul className="space-y-2">
                                            {schedule.map((slot) => (
                                                <li key={slot} className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-emerald-50/60 px-4 py-2.5 text-sm text-slate-700">
                                                    {slot}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-slate-500">No schedule configured.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[2rem] border border-white/80 bg-white/90 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
                        <div className="border-b border-cyan-100/80 bg-gradient-to-r from-cyan-50 to-white p-6">
                            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-700">Contact</p>
                            <h2 className="mt-2 text-2xl font-bold text-slate-900">Personal Information</h2>
                        </div>

                        <div className="space-y-5 p-6">
                            <div className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-white to-emerald-50/60 p-4 shadow-sm">
                                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Email Address</p>
                                <div className="mt-3 flex items-start">
                                    <img src="/images/at.png" className="mr-2 mt-0.5 h-4 w-4 shrink-0" alt="Email" />
                                    <p className="break-all text-sm font-medium text-slate-900 sm:break-words">{email}</p>
                                </div>
                            </div>

                            <div className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-white to-cyan-50/60 p-4 shadow-sm">
                                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Contact Number</p>
                                <div className="mt-3 flex items-start">
                                    <img src="/images/phone.png" className="mr-2 mt-0.5 h-4 w-4 shrink-0" alt="Phone" />
                                    <p className="break-all text-sm font-medium text-slate-900 sm:break-words">{phone}</p>
                                </div>
                            </div>

                            <div className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-white to-emerald-50/60 p-4 shadow-sm">
                                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Location</p>
                                <div className="mt-3 flex items-start">
                                    <img src="/images/location.png" className="mr-2 mt-0.5 h-4 w-4 shrink-0" alt="Location" />
                                    <p className="text-sm font-medium text-slate-900">{location}</p>
                                </div>
                            </div>

                            <div className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-white to-cyan-50/60 p-4 shadow-sm">
                                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Consultation Fees</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">Managed by hospital admin</p>
                                <div className="mt-3 space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <img src="/images/chat.png" className="h-4 w-4" alt="Chat" />
                                            <p className="text-xs font-semibold text-slate-500">Online Advisory</p>
                                            <span className="ml-auto text-sm font-bold text-emerald-700">Rs. {chatFee.toLocaleString()}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pl-6">
                                            <div>
                                                <p className="text-[10px] text-slate-400">Doctor Payment</p>
                                                <p className="text-xs font-semibold text-slate-700">Rs. {onlineDoctorPayment.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400">Hospital Charge</p>
                                                <p className="text-xs font-semibold text-slate-700">Rs. {onlineHospitalCharge.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-t border-slate-100 pt-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <img src="/images/appointment.png" className="h-4 w-4" alt="Appointment" />
                                            <p className="text-xs font-semibold text-slate-500">In-Person</p>
                                            <span className="ml-auto text-sm font-bold text-emerald-700">Rs. {appointmentFee.toLocaleString()}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 pl-6">
                                            <div>
                                                <p className="text-[10px] text-slate-400">Doctor Payment</p>
                                                <p className="text-xs font-semibold text-slate-700">Rs. {inpersonDoctorPayment.toLocaleString()}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-slate-400">Hospital Charge</p>
                                                <p className="text-xs font-semibold text-slate-700">Rs. {inpersonHospitalCharge.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.08)] sm:p-7">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">Quick Actions</p>
                            <h3 className="mt-2 text-2xl font-bold text-slate-900">Manage your profile and schedule</h3>
                            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                                Update your details, manage appointment slots, and respond to advice chats with less friction.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href="/doctor-self/edit-profile">
                                <WhiteButton className="rounded-full px-5 py-3">Edit Profile</WhiteButton>
                            </Link>
                            <Link href="/doctor-self/appointment-slots">
                                <WhiteButton className="rounded-full px-5 py-3">Manage Slots</WhiteButton>
                            </Link>
                            <Link href="/doctor-self/appointments">
                                <GreenButton className="rounded-full px-5 py-3">View Appointments</GreenButton>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DoctorProfilePage;
