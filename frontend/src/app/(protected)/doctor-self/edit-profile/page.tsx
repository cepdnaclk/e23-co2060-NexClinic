"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import GreenButton from "@/components/buttons/GreenButton";
import BlackButton from "@/components/buttons/BlackButton";
import { handleDoctorSessionExpired } from "@/lib/doctorSession";

type DoctorFormData = {
    fullName: string;
    preferredName: string;
    email: string;
    phone: string;
    specialization: string;
    experience: string;
    location: string;
    qualifications: string[];
    hospitals: string[];
    languages: string[];
};

type DoctorProfileData = {
    doctor: {
        fullName: string;
        preferredName: string;
        email: string;
        specialization: string;
        phone: string;
    };
    profileDetails: {
        experience: string;
        location: string;
        qualifications: string[];
        hospitals: string[];
        languages: string[];
    };
};

const DRAFT_STORAGE_KEY = "DOCTOR_PROFILE_DRAFT";

function mapProfileToForm(data: DoctorProfileData): DoctorFormData {
    return {
        fullName: data.doctor.fullName || "",
        preferredName: data.doctor.preferredName || "",
        email: data.doctor.email || "",
        phone: data.doctor.phone || "",
        specialization: data.doctor.specialization || "",
        experience: data.profileDetails.experience || "",
        location: data.profileDetails.location || "",
        qualifications: data.profileDetails.qualifications || [],
        hospitals: data.profileDetails.hospitals || [],
        languages: data.profileDetails.languages || [],
    };
}

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="mb-6">
        <h2 className="text-2xl font-black text-gray-900">{title}</h2>
        {subtitle && <p className="mt-2 text-gray-600">{subtitle}</p>}
    </div>
);

const FieldCard = ({
    label,
    value,
    onChange,
    placeholder,
    type = "text",
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
}) => (
    <div>
        <label className="block text-sm font-semibold text-gray-800 mb-2">{label}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="w-full rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
        />
    </div>
);

export default function EditDoctorProfilePage() {
    const router = useRouter();
    const [formData, setFormData] = useState<DoctorFormData | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

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
                    throw new Error("Failed to load profile");
                }

                const data: DoctorProfileData = await response.json();
                const formattedData = mapProfileToForm(data);
                setFormData(formattedData);

                // Check for draft (support legacy draft as plain formData or new { formData, profileImage })
                const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
                if (savedDraft) {
                    try {
                        const parsed = JSON.parse(savedDraft);
                        if (parsed && parsed.formData) {
                            setFormData(parsed.formData);
                            setProfileImage(parsed.profileImage || null);
                        } else {
                            setFormData(parsed);
                        }
                    } catch (e) {
                        // if parse fails, ignore
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load profile");
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [router]);

    const handleChange = (field: keyof DoctorFormData, value: string | string[]) => {
        setFormData((prev) =>
            prev
                ? {
                    ...prev,
                    [field]: value,
                }
                : null
        );
    };

    const readFileAsDataUrl = (file: File) =>
        new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

    const handleImageChange = async (file?: File) => {
        if (!file) return;
        try {
            const dataUrl = await readFileAsDataUrl(file);
            setProfileImage(dataUrl);
        } catch (e) {
            console.error("Failed to read image", e);
        }
    };

    const handleSaveDraft = () => {
        if (!formData) return;
        // persist both form data and profile image for preview later
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ formData, profileImage }));
        setSuccessMessage("Draft saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
    };

    const handleReset = () => {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        setProfileImage(null);
        window.location.reload();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f5faf7]">
                <p className="text-gray-600">Loading profile...</p>
            </div>
        );
    }

    if (!formData) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f5faf7]">
                <p className="text-red-600">{error || "Failed to load profile"}</p>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.20),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(6,182,212,0.14),_transparent_24%),linear-gradient(180deg,#edf9f4_0%,#f7fcfb_48%,#ffffff_100%)]">
            <div className="absolute inset-0 bg-[url('/images/doctor-registration-bg.jpg')] bg-cover bg-center bg-no-repeat opacity-[0.07]" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/84 via-white/79 to-white/95" aria-hidden="true" />
            <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" aria-hidden="true" />
            <div className="absolute right-0 top-32 h-80 w-80 rounded-full bg-teal-200/20 blur-3xl" aria-hidden="true" />

            <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
                    <div className="overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/90 p-6 shadow-[0_24px_70px_rgba(16,185,129,0.08)] backdrop-blur-sm sm:p-8 lg:p-10">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                    Doctor Profile
                                </div>

                                <h1 className="display-heading mt-5 text-4xl font-black tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
                                    Edit Your Profile
                                </h1>

                                <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base">
                                    Give patients a stronger first impression with a polished photo, structured information, and a clean presentation that fits your practice theme.
                                </p>

                                <div className="mt-6 flex flex-wrap gap-3">
                                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Status</p>
                                        <p className="mt-1 text-sm font-semibold text-gray-900">Profile draft ready</p>
                                    </div>
                                    <div className="rounded-2xl border border-cyan-100 bg-cyan-50 px-4 py-3">
                                        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-700">Theme</p>
                                        <p className="mt-1 text-sm font-semibold text-gray-900">Medical teal + emerald</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                                <BlackButton onClick={() => router.back()} className="rounded-full px-6 py-3 shadow-sm">
                                    Back to Profile
                                </BlackButton>
                                <button
                                    type="button"
                                    onClick={() => window.scrollTo({ top: 760, behavior: 'smooth' })}
                                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(16,185,129,0.22)] transition hover:bg-emerald-700"
                                >
                                    Jump to Form
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-[2.5rem] border border-white/80 bg-white/90 shadow-[0_24px_70px_rgba(16,185,129,0.12)] backdrop-blur-sm min-h-[240px]">
                        <div className="absolute inset-0 bg-[url('/images/doctor-registration-bg.jpg')] bg-cover bg-center bg-no-repeat" aria-hidden="true" />
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/72 via-emerald-900/48 to-cyan-900/58" aria-hidden="true" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.22),_transparent_34%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.16),_transparent_30%)]" aria-hidden="true" />

                        <div className="relative z-10 flex h-full flex-col justify-between p-6 text-white sm:p-8">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100/90">Profile canvas</p>
                                <h2 className="mt-3 max-w-md text-2xl font-black leading-tight sm:text-3xl">
                                    Make the profile feel calm, premium, and trustworthy.
                                </h2>
                                <p className="mt-3 max-w-lg text-sm leading-6 text-white/82">
                                    A soft medical backdrop, frosted cards, and structured content keep the form polished while still being easy to scan.
                                </p>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/80">Focus</p>
                                    <p className="mt-1 text-sm font-semibold text-white">Patient-ready presentation</p>
                                </div>
                                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-md">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/80">Style</p>
                                    <p className="mt-1 text-sm font-semibold text-white">Glass panels + soft gradients</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50/80 p-4 text-emerald-700 font-semibold">
                        {successMessage}
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mb-6 rounded-[1.5rem] border border-red-200 bg-red-50/80 p-4 text-red-700 font-semibold">
                        {error}
                    </div>
                )}

                <div className="grid gap-8 lg:grid-cols-3">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal Information */}
                        <div className="rounded-[2rem] border border-white/80 bg-white/92 p-8 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur">
                            <SectionHeader
                                title="Personal Information"
                                subtitle="Keep your contact and identity details clean and easy to update"
                            />
                            <div className="space-y-5">
                                <div className="rounded-[1.75rem] border border-emerald-100/80 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-[0_12px_32px_rgba(16,185,129,0.06)]">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                        <div className="relative w-28 h-28 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center ring-1 ring-white/60 shrink-0">
                                        {profileImage ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={profileImage} alt="Profile preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-gray-400 text-sm">No photo</div>
                                        )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <label className="text-sm font-semibold text-gray-800">Profile Photo</label>
                                                    <p className="mt-1 text-sm text-gray-600">Use a clear headshot so patients recognize you faster.</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-3">
                                                <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(16,185,129,0.22)] transition hover:bg-emerald-700">
                                                    Change Photo
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleImageChange(e.target.files?.[0])}
                                                        className="hidden"
                                                    />
                                                </label>
                                                <p className="self-center text-xs text-gray-500">PNG or JPG recommended.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <FieldCard
                                        label="Full Name"
                                        value={formData.fullName}
                                        onChange={(value) => handleChange("fullName", value)}
                                        placeholder="Dr. John Doe"
                                    />
                                    <FieldCard
                                        label="Preferred Name"
                                        value={formData.preferredName}
                                        onChange={(value) => handleChange("preferredName", value)}
                                        placeholder="How would you like to be called?"
                                    />
                                    <FieldCard
                                        label="Email Address"
                                        type="email"
                                        value={formData.email}
                                        onChange={(value) => handleChange("email", value)}
                                        placeholder="your.email@example.com"
                                    />
                                    <FieldCard
                                        label="Contact Phone"
                                        value={formData.phone}
                                        onChange={(value) => handleChange("phone", value)}
                                        placeholder="+94 XX XXX XXXX"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Professional Details */}
                        <div className="rounded-[2rem] border border-white/80 bg-white/92 p-8 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur">
                            <SectionHeader
                                title="Professional Details"
                                subtitle="Present your expertise, experience, and location with clarity"
                            />
                            <div className="grid gap-4 md:grid-cols-2">
                                <FieldCard
                                    label="Specialization"
                                    value={formData.specialization}
                                    onChange={(value) => handleChange("specialization", value)}
                                    placeholder="e.g., General Practitioner, Cardiologist"
                                />
                                <FieldCard
                                    label="Years of Experience"
                                    value={formData.experience}
                                    onChange={(value) => handleChange("experience", value)}
                                    placeholder="e.g., 5 years of experience"
                                />
                                <FieldCard
                                    label="Location / City"
                                    value={formData.location}
                                    onChange={(value) => handleChange("location", value)}
                                    placeholder="Your primary practice location"
                                />
                                <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-4">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Tip</p>
                                    <p className="mt-2 text-sm leading-6 text-gray-700">Use a district or city name that matches where patients can reach you easily.</p>
                                </div>
                            </div>
                        </div>

                        {/* Languages */}
                        <div className="rounded-[2rem] border border-white/80 bg-white/92 p-8 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur">
                            <SectionHeader
                                title="Languages"
                                subtitle="List the languages you can comfortably consult in"
                            />
                            <div className="rounded-[1.5rem] border border-emerald-100/70 bg-gradient-to-br from-white to-emerald-50/70 p-4">
                                <label className="block text-sm font-semibold text-gray-800 mb-2">Languages Spoken</label>
                                <textarea
                                    value={formData.languages.join(", ")}
                                    onChange={(e) =>
                                        handleChange(
                                            "languages",
                                            e.target.value.split(",").map((l) => l.trim())
                                        )
                                    }
                                    placeholder="English, Sinhala, Tamil"
                                    className="w-full rounded-2xl border border-white/80 bg-white/90 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                                    rows={3}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Summary Panel */}
                        <div className="rounded-[2rem] border border-white/80 bg-white/92 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur overflow-hidden relative">
                            <div className="absolute inset-0 bg-[url('/images/doctor-registration-bg.jpg')] bg-cover bg-center opacity-[0.06]" aria-hidden="true" />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/84 to-white/95" aria-hidden="true" />
                            <div className="relative space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-lg font-black text-gray-900">Profile Summary</h3>
                                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-700">Live draft</span>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/70 p-3 shadow-sm">
                                        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                                            {profileImage ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={profileImage} alt="preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-gray-400 text-sm">No photo</div>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Full Name</p>
                                            <p className="font-semibold text-gray-900">{formData.fullName || "Not provided"}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-3">
                                            <p className="text-gray-600">Specialization</p>
                                            <p className="font-semibold text-emerald-700">{formData.specialization || "Not specified"}</p>
                                        </div>
                                        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/70 p-3">
                                            <p className="text-gray-600">Location</p>
                                            <p className="font-semibold text-cyan-700">{formData.location || "Not specified"}</p>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-white/80 bg-white/80 p-3">
                                        <p className="text-gray-600">Languages</p>
                                        <p className="font-semibold text-gray-900">{formData.languages.length ? formData.languages.join(", ") : "Not specified"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* How It Works */}
                        <div className="rounded-[2rem] border border-emerald-100/50 bg-emerald-50/80 p-6 backdrop-blur">
                            <h3 className="text-lg font-black text-emerald-900 mb-4">How It Works</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex gap-3">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">1</div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Save Your Draft</p>
                                        <p className="text-gray-600 text-xs">Changes are saved locally first</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">2</div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Review Information</p>
                                        <p className="text-gray-600 text-xs">Check the summary on the left</p>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">3</div>
                                    <div>
                                        <p className="font-semibold text-gray-900">Return to Profile</p>
                                        <p className="text-gray-600 text-xs">Your data will be preserved</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <GreenButton
                                onClick={handleSaveDraft}
                                disabled={saving}
                                className="w-full rounded-full py-3 font-semibold shadow-[0_12px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.4)]"
                            >
                                {saving ? "Saving..." : "Save Draft"}
                            </GreenButton>
                            <BlackButton
                                onClick={handleReset}
                                className="w-full rounded-full py-3 font-semibold"
                            >
                                Reset Changes
                            </BlackButton>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}