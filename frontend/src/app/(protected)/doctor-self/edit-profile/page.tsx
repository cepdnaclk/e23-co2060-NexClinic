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
  chatFee: string;
  appointmentFee: string;
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
    profileImage: string;
  };
  profileDetails: {
    experience: string;
    location: string;
    chatFee: number;
    appointmentFee: number;
    qualifications: string[];
    hospitals: string[];
    languages: string[];
  };
};

const DRAFT_STORAGE_KEY = "DOCTOR_PROFILE_DRAFT";

function mapProfileToForm(data: DoctorProfileData): DoctorFormData {
  const experienceMatch = data.profileDetails.experience.match(/\d+/);

  return {
    fullName: data.doctor.fullName || "",
    preferredName: data.doctor.preferredName || "",
    email: data.doctor.email || "",
    phone: data.doctor.phone || "",
    specialization: data.doctor.specialization || "",
    experience: experienceMatch?.[0] || "",
    location: data.profileDetails.location || "",
    chatFee: String(data.profileDetails.chatFee || 0),
    appointmentFee: String(data.profileDetails.appointmentFee || 0),
    qualifications: data.profileDetails.qualifications || [],
    hospitals: data.profileDetails.hospitals || [],
    languages: data.profileDetails.languages || [],
  };
}

const SectionHeader = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => (
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
    <label className="block text-sm font-semibold text-gray-800 mb-2">
      {label}
    </label>
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
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
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
        setProfileImage(data.doctor.profileImage || null);

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

  const handleChange = (
    field: keyof DoctorFormData,
    value: string | string[],
  ) => {
    setFormData((prev) =>
      prev
        ? {
            ...prev,
            [field]: value,
          }
        : null,
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
      setSelectedImageFile(file);
      setProfileImage(dataUrl);
    } catch (e) {
      console.error("Failed to read image", e);
    }
  };

  const handleSaveDraft = () => {
    if (!formData) return;
    // persist both form data and profile image for preview later
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ formData, profileImage }),
    );
    setSuccessMessage("Draft saved successfully!");
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const handleSaveProfile = async () => {
    if (!formData) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const requestBody = new FormData();
      requestBody.set("fullName", formData.fullName);
      requestBody.set("preferredName", formData.preferredName);
      requestBody.set("email", formData.email);
      requestBody.set("phone", formData.phone);
      requestBody.set("specialization", formData.specialization);
      requestBody.set(
        "experienceYears",
        String(Number.parseInt(formData.experience || "0", 10) || 0),
      );
      requestBody.set("location", formData.location);
      requestBody.set(
        "chatFee",
        String(Number.parseFloat(formData.chatFee || "0") || 0),
      );
      requestBody.set(
        "appointmentFee",
        String(Number.parseFloat(formData.appointmentFee || "0") || 0),
      );
      requestBody.set("qualifications", formData.qualifications.join(", "));
      requestBody.set("hospitals", formData.hospitals.join(", "));
      requestBody.set("languages", formData.languages.join(", "));

      if (selectedImageFile) {
        requestBody.set("profileImage", selectedImageFile);
      }

      const response = await fetch("/api/doctor/profile", {
        method: "PATCH",
        body: requestBody,
      });

      if (response.status === 401) {
        handleDoctorSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || "Failed to update profile");
      }

      const updatedProfile = payload as DoctorProfileData;
      setFormData(mapProfileToForm(updatedProfile));
      setProfileImage(updatedProfile.doctor.profileImage || null);
      setSelectedImageFile(null);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setSuccessMessage("Profile updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setSelectedImageFile(null);
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
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_28%),linear-gradient(180deg,#eefbf6_0%,#f8fcfb_42%,#ffffff_100%)]">
      <div
        className="absolute inset-0 bg-[url('/images/doctor-login-bg.png')] bg-cover bg-center bg-no-repeat opacity-[0.08]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-white/88 via-white/82 to-white/95"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-100/50 to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute right-0 top-36 h-80 w-80 rounded-full bg-teal-200/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
              Doctor Profile
            </p>
            <h1 className="mt-2 text-4xl font-black text-gray-900">
              Edit Your Profile
            </h1>
          </div>
          <BlackButton
            onClick={() => router.back()}
            className="rounded-full px-6 py-3"
          >
            Back to Profile
          </BlackButton>
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
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="w-28 h-28 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center ring-1 ring-white/60">
                    {profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={profileImage}
                        alt="Profile preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-gray-400 text-sm">No photo</div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-gray-800">
                      Profile Photo
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(e.target.files?.[0])}
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Upload a recent headshot. Preview stays local until image
                      upload support is added.
                    </p>
                  </div>
                </div>
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
                  type="tel"
                  value={formData.phone}
                  onChange={(value) => handleChange("phone", value)}
                  placeholder="+94 XX XXX XXXX"
                />
              </div>
            </div>

            {/* Professional Details */}
            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur">
              <SectionHeader
                title="Professional Details"
                subtitle="Share your medical expertise and credentials"
              />
              <div className="space-y-4">
                <FieldCard
                  label="Specialization"
                  value={formData.specialization}
                  onChange={(value) => handleChange("specialization", value)}
                  placeholder="e.g., General Practitioner, Cardiologist"
                />
                <FieldCard
                  label="Years of Experience"
                  type="number"
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
              </div>
            </div>

            {/* Consultation Fees */}
            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur">
              <SectionHeader
                title="Consultation Fees"
                subtitle="Set your service rates in LKR"
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <FieldCard
                  label="Online Chat Session Fee"
                  type="number"
                  value={formData.chatFee}
                  onChange={(value) => handleChange("chatFee", value)}
                  placeholder="500"
                />
                <FieldCard
                  label="In-Person Appointment Fee"
                  type="number"
                  value={formData.appointmentFee}
                  onChange={(value) => handleChange("appointmentFee", value)}
                  placeholder="3000"
                />
              </div>
            </div>

            {/* Languages */}
            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-8 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur">
              <SectionHeader
                title="Languages"
                subtitle="Languages you speak and consult in (comma-separated)"
              />
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  Languages Spoken
                </label>
                <textarea
                  value={formData.languages.join(", ")}
                  onChange={(e) =>
                    handleChange(
                      "languages",
                      e.target.value.split(",").map((l) => l.trim()),
                    )
                  }
                  placeholder="English, Sinhala, Tamil"
                  className="w-full rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-gray-900 placeholder-gray-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100 transition-all"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary Panel */}
            <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur overflow-hidden relative">
              <div
                className="absolute inset-0 bg-[url('/images/doctor-login-bg.png')] bg-cover bg-center opacity-[0.08]"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 bg-gradient-to-br from-white/78 to-white/90"
                aria-hidden="true"
              />
              <div className="relative space-y-4">
                <h3 className="text-lg font-black text-gray-900">
                  Profile Summary
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                      {profileImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={profileImage}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400 text-sm">No photo</div>
                      )}
                    </div>
                    <div>
                      <p className="text-gray-600">Full Name</p>
                      <p className="font-semibold text-gray-900">
                        {formData.fullName || "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-gray-600">Specialization</p>
                    <p className="font-semibold text-emerald-700">
                      {formData.specialization || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Chat Fee</p>
                    <p className="font-semibold text-gray-900">
                      Rs. {formData.chatFee || "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Appointment Fee</p>
                    <p className="font-semibold text-teal-700">
                      Rs. {formData.appointmentFee || "0"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* How It Works */}
            <div className="rounded-[2rem] border border-emerald-100/50 bg-emerald-50/80 p-6 backdrop-blur">
              <h3 className="text-lg font-black text-emerald-900 mb-4">
                How It Works
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Save your profile
                    </p>
                    <p className="text-gray-600 text-xs">
                      Core details sync to the backend
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Save a draft if needed
                    </p>
                    <p className="text-gray-600 text-xs">
                      Local draft keeps unfinished edits
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white text-xs font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      Return to profile
                    </p>
                    <p className="text-gray-600 text-xs">
                      Reload to confirm your latest saved data
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <GreenButton
                onClick={() => {
                  void handleSaveProfile();
                }}
                disabled={saving}
                className="w-full rounded-full py-3 font-semibold shadow-[0_12px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.4)]"
              >
                {saving ? "Saving..." : "Save Changes"}
              </GreenButton>
              <BlackButton
                onClick={handleSaveDraft}
                className="w-full rounded-full py-3 font-semibold"
              >
                Save Draft
              </BlackButton>
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
