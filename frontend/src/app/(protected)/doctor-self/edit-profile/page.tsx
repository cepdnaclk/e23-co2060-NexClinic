"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GreenButton from "@/components/buttons/GreenButton";
import BlackButton from "@/components/buttons/BlackButton";
import { handleDoctorSessionExpired } from "@/lib/doctorSession";

type DoctorFormData = {
    fullName: string;
    preferredName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: string;
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
        photo?: string;
        dateOfBirth?: string;
        gender?: string;
        address?: string;
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
        dateOfBirth: data.doctor.dateOfBirth || "",
        gender: data.doctor.gender || "",
        address: data.doctor.address || "",
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

    const SelectCard = ({
        label,
        value,
        onChange,
        options,
    }: {
        label: string;
        value: string;
        onChange: (value: string) => void;
        options: Array<{ label: string; value: string }>;
    }) => (
        <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">{label}</label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-gray-900 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
            >
                <option value="">Select {label}</option>
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );

    const TextAreaCard = ({
        label,
        value,
        onChange,
        placeholder,
    }: {
        label: string;
        value: string;
        onChange: (value: string) => void;
        placeholder?: string;
    }) => (
        <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-800 mb-2">{label}</label>
            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                rows={4}
                className="w-full rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
            />
        </div>
    );

const DOCTOR_SPECIALIZATIONS = [
    "Allergy and Immunology",
    "Anesthesiology",
    "Cardiology",
    "Cardiothoracic Surgery",
    "Clinical Genetics",
    "Clinical Oncology",
    "Critical Care Medicine",
    "Dermatology",
    "Emergency Medicine",
    "Endocrinology",
    "Family Medicine",
    "Forensic Medicine",
    "Gastroenterology",
    "General Practitioner",
    "General Surgery",
    "Geriatric Medicine",
    "Gynecology",
    "Hematology",
    "Hepatology",
    "Infectious Diseases",
    "Internal Medicine",
    "Interventional Radiology",
    "Nephrology",
    "Neurology",
    "Neurosurgery",
    "Nuclear Medicine",
    "Obstetrics",
    "Occupational Medicine",
    "Oncology",
    "Ophthalmology",
    "Oral and Maxillofacial Surgery",
    "Orthopedic Surgery",
    "Otolaryngology (ENT)",
    "Palliative Medicine",
    "Pathology",
    "Pediatric Cardiology",
    "Pediatrics",
    "Physical Medicine and Rehabilitation",
    "Plastic and Reconstructive Surgery",
    "Psychiatry",
    "Pulmonology",
    "Radiology",
    "Rheumatology",
    "Sports Medicine",
    "Urology",
    "Vascular Surgery",
    "Other",
];

const SRI_LANKA_DISTRICTS = [
    "Colombo",
    "Gampaha",
    "Kalutara",
    "Kandy",
    "Matale",
    "Nuwara Eliya",
    "Galle",
    "Matara",
    "Hambantota",
    "Jaffna",
    "Kilinochchi",
    "Mannar",
    "Mullaitivu",
    "Vavuniya",
    "Puttalam",
    "Kurunegala",
    "Anuradhapura",
    "Polonnaruwa",
    "Badulla",
    "Monaragala",
    "Ratnapura",
    "Kegalle",
    "Trincomalee",
    "Batticaloa",
    "Ampara",
];

const DISTRICT_HOSPITALS: Record<string, string[]> = {
    Colombo: [
        "National Hospital of Sri Lanka",
        "Lady Ridgeway Hospital",
        "Sri Jayewardenepura General Hospital",
        "Durdans Hospital",
        "Asiri Surgical Hospital",
    ],
    Gampaha: [
        "Negombo General Hospital",
        "Ragama Teaching Hospital",
        "Base Hospital Gampaha",
        "Nawaloka Hospitals - Negombo",
    ],
    Kalutara: [
        "General Hospital Kalutara",
        "Base Hospital Panadura",
        "Teaching Hospital Horana",
    ],
    Kandy: [
        "Teaching Hospital Kandy",
        "Nawaloka Hospital Kandy",
        "General Hospital Nawalapitiya",
    ],
    Galle: [
        "Teaching Hospital Karapitiya",
        "Base Hospital Balapitiya",
        "General Hospital Galle",
    ],
    Matara: [
        "Teaching Hospital Matara",
        "Base Hospital Akuressa",
        "General Hospital Tangalle",
    ],
    Jaffna: [
        "Teaching Hospital Jaffna",
        "Base Hospital Chavakachcheri",
        "District General Hospital Kilinochchi",
    ],
};

const DEFAULT_HOSPITALS = [
    "National Hospital of Sri Lanka",
    "General Hospital Kandy",
    "Teaching Hospital Karapitiya",
    "Teaching Hospital Jaffna",
    "Base Hospital Kurunegala",
];

const getHospitalsForDistrict = (district: string) => DISTRICT_HOSPITALS[district] || DEFAULT_HOSPITALS;

const LANGUAGE_OPTIONS = [
    "Sinhala",
    "English",
    "Tamil",
    "Hindi",
    "Arabic",
    "French",
    "German",
];

const MultiSelectCard = ({
    label,
    values,
    onChange,
    options,
    helperText,
}: {
    label: string;
    values: string[];
    onChange: (value: string[]) => void;
    options: string[];
    helperText?: string;
}) => (
    <div className="md:col-span-2">
        <label className="block text-sm font-semibold text-gray-800 mb-2">{label}</label>
        <select
            multiple
            value={values}
            onChange={(e) => onChange(Array.from(e.target.selectedOptions, (option) => option.value))}
            className="min-h-32 w-full rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-gray-900 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
        >
            {options.map((option) => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
        </select>
        {helperText && <p className="mt-2 text-xs text-gray-500">{helperText}</p>}
    </div>
);

export default function EditDoctorProfilePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [formData, setFormData] = useState<DoctorFormData | null>(null);
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatingPhoto, setUpdatingPhoto] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const availableHospitals = getHospitalsForDistrict(formData?.location || "");

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
                setProfileImage(data.doctor.photo || null);

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

    const handleLocationChange = (value: string) => {
        setFormData((prev) => {
            if (!prev) {
                return null;
            }

            const hospitalsForDistrict = getHospitalsForDistrict(value);
            const filteredHospitals = prev.hospitals.filter((hospital) => hospitalsForDistrict.includes(hospital));

            return {
                ...prev,
                location: value,
                hospitals: filteredHospitals,
            };
        });
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
        const previousImage = profileImage;
        try {
            const dataUrl = await readFileAsDataUrl(file);
            setProfileImage(dataUrl);

            const formDataPayload = new FormData();
            formDataPayload.append("email", formData?.email || "");
            formDataPayload.append("profilePicture", file);

            setUpdatingPhoto(true);
            setError("");

            const response = await fetch("/api/doctor/profile", {
                method: "PATCH",
                body: formDataPayload,
            });

            if (response.status === 401) {
                handleDoctorSessionExpired(router);
                return;
            }

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload?.detail || errorPayload?.error || "Failed to update profile photo");
            }

            const updatedProfile: DoctorProfileData = await response.json();
            setProfileImage(updatedProfile.doctor.photo || dataUrl);
            setSuccessMessage("Profile photo updated successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
        } catch (e) {
            setProfileImage(previousImage);
            setError(e instanceof Error ? e.message : "Failed to update profile photo");
            console.error("Failed to read image", e);
        } finally {
            setUpdatingPhoto(false);
        }
    };

    const handleRemoveImage = async () => {
        const previousImage = profileImage;
        try {
            setProfileImage(null);
            setUpdatingPhoto(true);
            setError("");

            const formDataPayload = new FormData();
            formDataPayload.append("email", formData?.email || "");
            formDataPayload.append("clearProfilePicture", "true");

            const response = await fetch("/api/doctor/profile", {
                method: "PATCH",
                body: formDataPayload,
            });

            if (response.status === 401) {
                handleDoctorSessionExpired(router);
                return;
            }

            if (!response.ok) {
                const errorPayload = await response.json().catch(() => ({}));
                throw new Error(errorPayload?.detail || errorPayload?.error || "Failed to remove profile photo");
            }

            setSuccessMessage("Profile photo removed successfully!");
            setTimeout(() => setSuccessMessage(""), 3000);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (e) {
            setProfileImage(previousImage);
            setError(e instanceof Error ? e.message : "Failed to remove profile photo");
        } finally {
            setUpdatingPhoto(false);
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
        <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.20),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.16),_transparent_26%),linear-gradient(180deg,#edf9f4_0%,#f8fcfb_42%,#ffffff_100%)]">
            <div className="absolute inset-0 bg-[url('/images/doctor-registration-bg.jpg')] bg-cover bg-center bg-no-repeat opacity-[0.07]" aria-hidden="true" />
            <div className="absolute inset-0 bg-gradient-to-b from-white/88 via-white/82 to-white/95" aria-hidden="true" />
            <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-100/50 to-transparent" aria-hidden="true" />
            <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" aria-hidden="true" />
            <div className="absolute right-0 top-36 h-80 w-80 rounded-full bg-teal-200/20 blur-3xl" aria-hidden="true" />

            <div className="relative mx-auto max-w-7xl px-4 py-8">
                {/* Header */}
                <div className="mb-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-[2.25rem] border border-white/80 bg-white/88 p-6 shadow-[0_20px_60px_rgba(16,185,129,0.08)] backdrop-blur sm:p-8">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">Doctor Profile</p>
                                <h1 className="mt-3 text-4xl font-black text-gray-900 sm:text-5xl">Edit Your Profile</h1>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 sm:text-base">
                                    Shape a clear, trustworthy profile with updated details, fees, and a polished photo so patients can recognize your practice instantly.
                                </p>
                            </div>
                            <BlackButton onClick={() => router.back()} className="rounded-full px-6 py-3">
                                Back to Profile
                            </BlackButton>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-[2.25rem] border border-white/80 bg-white/90 shadow-[0_20px_60px_rgba(16,185,129,0.12)] backdrop-blur min-h-[220px]">
                        <div className="absolute inset-0 bg-[url('/images/doctor-registration-bg.jpg')] bg-cover bg-center bg-no-repeat" aria-hidden="true" />
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/70 via-emerald-900/45 to-cyan-900/55" aria-hidden="true" />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.22),_transparent_38%),radial-gradient(circle_at_bottom_left,_rgba(255,255,255,0.16),_transparent_32%)]" aria-hidden="true" />
                        <div className="relative z-10 flex h-full flex-col justify-end p-6 sm:p-8 text-white">
                            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-100/90">Profile canvas</p>
                            <h2 className="mt-3 text-2xl font-black sm:text-3xl">A cleaner profile starts with a calmer workspace.</h2>
                            <p className="mt-3 max-w-md text-sm leading-6 text-white/85">
                                The soft medical background and layered glass panels keep the form readable while still feeling premium and professional.
                            </p>
                            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/80">Focus</p>
                                    <p className="mt-1 text-sm font-semibold text-white">Patient-ready presentation</p>
                                </div>
                                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 backdrop-blur-sm">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100/80">Theme</p>
                                    <p className="mt-1 text-sm font-semibold text-white">Medical teal + emerald palette</p>
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

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Personal Information */}
                        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur">
                            <SectionHeader
                                title="Personal Information"
                                subtitle="Update your basic professional details"
                            />
                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                <div className="md:col-span-2 rounded-[1.75rem] border border-emerald-100/70 bg-gradient-to-br from-emerald-50/90 to-white p-4 shadow-[0_12px_30px_rgba(16,185,129,0.06)]">
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                                        <div className="w-28 h-28 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center ring-1 ring-white/60 shrink-0">
                                            {profileImage ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={profileImage} alt="Profile preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="text-gray-400 text-sm">No photo</div>
                                            )}
                                        </div>
                                        <div className="flex flex-1 flex-col">
                                            <label className="text-sm font-semibold text-gray-800">Profile Photo</label>
                                            <p className="mt-2 text-sm text-gray-600">Upload a recent headshot so your patients can recognize you faster.</p>
                                            <p className="mt-1 text-xs text-gray-500">PNG or JPG works best. The change is saved immediately.</p>
                                            <div className="mt-4 flex flex-wrap gap-3">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={updatingPhoto}
                                                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(16,185,129,0.22)] transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {updatingPhoto ? "Updating..." : "Change Photo"}
                                                </button>
                                                {profileImage && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            void handleRemoveImage();
                                                        }}
                                                        disabled={updatingPhoto}
                                                        className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-red-200 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        Remove Photo
                                                    </button>
                                                )}
                                            </div>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    void handleImageChange(e.target.files?.[0]);
                                                    e.currentTarget.value = "";
                                                }}
                                                className="hidden"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <FieldCard
                                    label="Name"
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
                                    label="Email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(value) => handleChange("email", value)}
                                    placeholder="your.email@example.com"
                                />
                                <FieldCard
                                    label="Phone"
                                    value={formData.phone}
                                    onChange={(value) => handleChange("phone", value)}
                                    placeholder="+94 XX XXX XXXX"
                                />
                                <FieldCard
                                    label="Date of Birth"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(value) => handleChange("dateOfBirth", value)}
                                />
                                <SelectCard
                                    label="Gender"
                                    value={formData.gender}
                                    onChange={(value) => handleChange("gender", value)}
                                    options={[
                                        { label: "Male", value: "Male" },
                                        { label: "Female", value: "Female" },
                                    ]}
                                />
                                <TextAreaCard
                                    label="Address"
                                    value={formData.address}
                                    onChange={(value) => handleChange("address", value)}
                                    placeholder="Your home or practice address"
                                />
                            </div>
                        </div>

                        {/* Professional Details */}
                        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur">
                            <SectionHeader
                                title="Professional Details"
                                subtitle="Share your medical expertise and credentials"
                            />
                            <div className="mt-6 grid gap-4 md:grid-cols-2">
                                <SelectCard
                                    label="Specialization"
                                    value={formData.specialization}
                                    onChange={(value) => handleChange("specialization", value)}
                                    options={DOCTOR_SPECIALIZATIONS.map((specialization) => ({
                                        label: specialization,
                                        value: specialization,
                                    }))}
                                />
                                <FieldCard
                                    label="Years of Experience"
                                    value={formData.experience}
                                    onChange={(value) => handleChange("experience", value)}
                                    placeholder="e.g., 5 years of experience"
                                />
                                <SelectCard
                                    label="Location / District"
                                    value={formData.location}
                                    onChange={handleLocationChange}
                                    options={SRI_LANKA_DISTRICTS.map((district) => ({
                                        label: district,
                                        value: district,
                                    }))}
                                />
                                <MultiSelectCard
                                    label="Available Hospitals"
                                    values={formData.hospitals}
                                    onChange={(values) => handleChange("hospitals", values)}
                                    options={availableHospitals}
                                    helperText={
                                        formData.location
                                            ? `Hospitals commonly available in ${formData.location}.`
                                            : "Choose a location to see the matching hospitals."
                                    }
                                />
                            </div>
                        </div>

                        {/* Languages */}
                        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur">
                            <SectionHeader
                                title="Languages"
                                subtitle="Select all languages you speak and consult in"
                            />
                            <div className="mt-6">
                                <MultiSelectCard
                                    label="Languages Spoken"
                                    values={formData.languages}
                                    onChange={(values) => handleChange("languages", values)}
                                    options={LANGUAGE_OPTIONS}
                                    helperText="Hold Ctrl or Cmd to choose multiple languages."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Summary Panel */}
                        <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur overflow-hidden relative">
                            <div className="absolute inset-0 bg-[url('/images/doctor-registration-bg.jpg')] bg-cover bg-center opacity-[0.08]" aria-hidden="true" />
                            <div className="absolute inset-0 bg-gradient-to-br from-white/78 to-white/90" aria-hidden="true" />
                            <div className="relative space-y-4">
                                <h3 className="text-lg font-black text-gray-900">Profile Summary</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
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
                                    <div>
                                        <p className="text-gray-600">Specialization</p>
                                        <p className="font-semibold text-emerald-700">{formData.specialization || "Not specified"}</p>
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