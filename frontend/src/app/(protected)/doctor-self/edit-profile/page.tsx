"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import BlackButton from "@/components/buttons/BlackButton";
import GreenButton from "@/components/buttons/GreenButton";
import { handleDoctorSessionExpired } from "@/lib/doctorSession";

type DoctorFormData = {
  fullName: string;
  preferredName: string;
  email: string;
  phone: string;
  licenseNumber: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  specialization: string;
  experienceYears: string;
  location: string;
  chatFee: string;
  appointmentFee: string;
  qualifications: string[];
  hospitals: string[];
  languages: string[];
  availabilityForOnlineAdvice: boolean;
  profileImage: string;
};

type DoctorProfileData = {
  doctor: {
    fullName: string;
    preferredName: string;
    email: string;
    specialization: string;
    phone: string;
    profileImage: string;
    licenseNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    address?: string;
  };
  profileDetails: {
    experience: string;
    location: string;
    chatFee: number;
    appointmentFee: number;
    availabilityForOnlineAdvice?: boolean;
    qualifications: string[];
    hospitals: string[];
    languages: string[];
  };
};

type ActiveHospital = {
  id: number;
  name: string;
  is_active: boolean;
};

type VerificationRequest = {
  id: number;
  doctor: number;
  doctorName: string;
  hospital: number;
  hospitalName: string;
  status: "PENDING" | "VERIFIED" | "REJECTED";
  verified_by: number | null;
  verifiedByEmail: string | null;
  verified_at: string | null;
  rejection_reason?: string;
  created_at: string;
};

const DRAFT_STORAGE_KEY = "doctor-profile-draft";
const DRAFT_SAVED_AT_KEY = "doctor-profile-draft-saved-at";

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

const LANGUAGE_OPTIONS = ["Sinhala", "English", "Tamil", "Hindi", "Arabic", "French", "German"];

const AVATAR_GRADIENTS = [
  ["#059669", "#0f766e"],
  ["#0f766e", "#14b8a6"],
  ["#2563eb", "#0ea5e9"],
  ["#7c3aed", "#db2777"],
  ["#ea580c", "#f59e0b"],
  ["#1d4ed8", "#4338ca"],
];

const defaultFormData: DoctorFormData = {
  fullName: "",
  preferredName: "",
  email: "",
  phone: "",
  licenseNumber: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  specialization: "",
  experienceYears: "",
  location: "",
  chatFee: "",
  appointmentFee: "",
  qualifications: [],
  hospitals: [],
  languages: [],
  availabilityForOnlineAdvice: false,
  profileImage: "/images/doctor-profile-default.png",
};

function splitCommaSeparated(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function extractExperienceYears(experience: string) {
  const match = experience.match(/\d+/);
  return match?.[0] || "";
}

function mapProfileToForm(data: DoctorProfileData): DoctorFormData {
  return {
    fullName: data.doctor.fullName || "",
    preferredName: data.doctor.preferredName || "",
    email: data.doctor.email || "",
    phone: data.doctor.phone || "",
    licenseNumber: data.doctor.licenseNumber || "",
    dateOfBirth: data.doctor.dateOfBirth || "",
    gender: data.doctor.gender || "",
    address: data.doctor.address || "",
    specialization: data.doctor.specialization || "",
    experienceYears: extractExperienceYears(data.profileDetails.experience),
    location: data.profileDetails.location || "",
    chatFee: String(data.profileDetails.chatFee ?? ""),
    appointmentFee: String(data.profileDetails.appointmentFee ?? ""),
    qualifications: data.profileDetails.qualifications || [],
    hospitals: data.profileDetails.hospitals || [],
    languages: data.profileDetails.languages || [],
    availabilityForOnlineAdvice:
      Boolean(data.profileDetails.availabilityForOnlineAdvice),
    profileImage: data.doctor.profileImage || defaultFormData.profileImage,
  };
}

function getAttachmentLabel(url: string) {
  if (!url.trim()) {
    return "No photo selected";
  }

  try {
    return decodeURIComponent(url.split("/").pop() || "Profile image");
  } catch {
    return "Profile image";
  }
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="text-xl font-bold text-slate-900 sm:text-2xl">{title}</h2>
      {description ? (
        <p className="text-sm leading-6 text-slate-600 sm:text-[0.95rem]">{description}</p>
      ) : null}
    </div>
  );
}

function FieldCard({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">{label}</label>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-slate-900 shadow-sm shadow-emerald-100/10 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
    </div>
  );
}

function SelectCard({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-800">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-slate-900 shadow-sm shadow-emerald-100/10 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextAreaCard({
  label,
  value,
  onChange,
  placeholder,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  helperText?: string;
}) {
  return (
    <div className="md:col-span-2">
      <label className="mb-2 block text-sm font-semibold text-slate-800">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-slate-900 shadow-sm shadow-emerald-100/10 placeholder:text-slate-400 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      />
      {helperText ? <p className="mt-2 text-xs text-slate-500">{helperText}</p> : null}
    </div>
  );
}

function MultiSelectCard({
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
}) {
  return (
    <div className="md:col-span-2">
      <label className="mb-2 block text-sm font-semibold text-slate-800">{label}</label>
      <select
        multiple
        value={values}
        onChange={(event) =>
          onChange(Array.from(event.target.selectedOptions, (option) => option.value))
        }
        className="min-h-36 w-full rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-slate-900 shadow-sm shadow-emerald-100/10 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {helperText ? <p className="mt-2 text-xs text-slate-500">{helperText}</p> : null}
    </div>
  );
}

function StatusPill({ children, tone = "emerald" }: { children: ReactNode; tone?: "emerald" | "slate" | "teal" }) {
  const toneClasses =
    tone === "emerald"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "teal"
        ? "bg-teal-50 text-teal-700 ring-teal-200"
        : "bg-white text-slate-600 ring-slate-200";

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${toneClasses}`}>
      {children}
    </span>
  );
}

export default function EditDoctorProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<DoctorProfileData | null>(null);
  const [formData, setFormData] = useState<DoctorFormData>(defaultFormData);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [creatingAvatar, setCreatingAvatar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);

  const [activeHospitals, setActiveHospitals] = useState<ActiveHospital[]>([]);
  const [hospitalRequests, setHospitalRequests] = useState<VerificationRequest[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>("");
  const [requestsLoading, setRequestsLoading] = useState<boolean>(true);
  const [requesting, setRequesting] = useState<boolean>(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmText?: string;
    isDanger?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = "Confirm",
    isDanger = false
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmModal((prev) => ({ ...prev, isOpen: false }));
      },
      confirmText,
      isDanger,
    });
  };

  const fetchHospitalsAndRequests = async () => {
    setRequestsLoading(true);
    try {
      const [hospRes, reqRes] = await Promise.all([
        fetch("/api/hospital/active", { method: "GET", cache: "no-store" }),
        fetch("/api/doctor/hospital-requests", { method: "GET", cache: "no-store" }),
      ]);

      if (hospRes.ok) {
        const hospData = await hospRes.json();
        setActiveHospitals(hospData || []);
      }
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setHospitalRequests(reqData.verifications || []);
      }
    } catch (err) {
      console.error("Failed to load hospitals/requests", err);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleRequestAffiliation = async (hospitalId: number) => {
    setRequesting(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch("/api/doctor/hospital-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hospital_id: hospitalId }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || data.error || "Failed to submit request");
      }

      setNotice("Hospital affiliation request submitted successfully.");
      setSelectedHospitalId("");
      await fetchHospitalsAndRequests();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setRequesting(false);
    }
  };

  const confirmRequestAffiliation = (hospitalId: number, hospitalName: string) => {
    triggerConfirm(
      "Confirm Affiliation Request",
      `Are you sure you want to request affiliation with ${hospitalName}?`,
      () => { void handleRequestAffiliation(hospitalId); },
      "Submit Request"
    );
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/doctor/profile", {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 401 || response.status === 403) {
          handleDoctorSessionExpired(router);
          return;
        }

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          throw new Error(errorPayload?.error || "Failed to load profile details");
        }

        const data: DoctorProfileData = await response.json();
        const mappedProfile = mapProfileToForm(data);
        setProfile(data);

        const draftRaw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (draftRaw) {
          try {
            const draft = JSON.parse(draftRaw) as Partial<DoctorFormData> & {
              formData?: DoctorFormData;
              profileImage?: string;
            };

            if (draft && draft.formData) {
              setFormData({
                ...mappedProfile,
                ...draft.formData,
                profileImage: draft.profileImage || draft.formData.profileImage || mappedProfile.profileImage,
              });
            } else {
              setFormData({
                ...mappedProfile,
                ...draft,
                profileImage: draft.profileImage || mappedProfile.profileImage,
              });
            }

            setDraftSavedAt(window.localStorage.getItem(DRAFT_SAVED_AT_KEY));
          } catch {
            setFormData(mappedProfile);
          }
        } else {
          setFormData(mappedProfile);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile details");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
    fetchHospitalsAndRequests();
  }, [router]);

  const profileImage = useMemo(() => {
    return formData.profileImage.trim() ? formData.profileImage : defaultFormData.profileImage;
  }, [formData.profileImage]);

  const initials = useMemo(() => {
    const parts = formData.fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return "D";
    }
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }, [formData.fullName]);

  const avatarSeed = useMemo(() => {
    const basis = `${formData.fullName}|${formData.preferredName}|${formData.specialization}|${formData.email}`.trim();
    if (!basis) {
      return 0;
    }

    let hash = 0;
    for (let index = 0; index < basis.length; index += 1) {
      hash = (hash * 31 + basis.charCodeAt(index)) >>> 0;
    }

    return hash;
  }, [formData.email, formData.fullName, formData.preferredName, formData.specialization]);

  const avatarPalette = useMemo(() => {
    return AVATAR_GRADIENTS[avatarSeed % AVATAR_GRADIENTS.length] || AVATAR_GRADIENTS[0];
  }, [avatarSeed]);

  const availableHospitals = useMemo(() => {
    return activeHospitals.filter((hospital) => {
      const hasPendingOrVerified = hospitalRequests.some(
        (req) => req.hospital === hospital.id && (req.status === "PENDING" || req.status === "VERIFIED")
      );
      return !hasPendingOrVerified;
    });
  }, [activeHospitals, hospitalRequests]);

  const handleChange = (field: keyof DoctorFormData, value: string | string[] | boolean) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((previous) => ({
        ...previous,
        profileImage: String(reader.result || ""),
      }));
      setRemovePhoto(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateAvatar = async () => {
    if (creatingAvatar) {
      return;
    }

    setCreatingAvatar(true);
    setError("");
    setNotice("");

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;

      const context = canvas.getContext("2d");
      if (!context) {
        throw new Error("Avatar creation is not supported in this browser.");
      }

      const [startColor, endColor] = avatarPalette;
      const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, startColor);
      gradient.addColorStop(1, endColor);

      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.globalAlpha = 0.12;
      context.fillStyle = "#ffffff";
      context.beginPath();
      context.arc(760, 220, 220, 0, Math.PI * 2);
      context.fill();
      context.beginPath();
      context.arc(250, 830, 180, 0, Math.PI * 2);
      context.fill();
      context.globalAlpha = 1;

      context.fillStyle = "rgba(255, 255, 255, 0.16)";
      context.fillRect(120, 120, 784, 784);

      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillStyle = "#ffffff";
      context.font = "bold 260px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
      context.fillText(initials || "D", canvas.width / 2, canvas.height / 2 - 14);

      context.font = "600 54px ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif";
      context.globalAlpha = 0.88;
      context.fillText(formData.fullName.trim() || "Doctor", canvas.width / 2, canvas.height / 2 + 190);
      context.globalAlpha = 1;

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((result) => {
          if (!result) {
            reject(new Error("Could not create avatar image."));
            return;
          }

          resolve(result);
        }, "image/png");
      });

      const avatarFile = new File([
        blob,
      ], `${(formData.fullName || "doctor").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-") || "doctor"}-avatar.png`, {
        type: "image/png",
      });

      setSelectedImageFile(avatarFile);

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((previous) => ({
          ...previous,
          profileImage: String(reader.result || ""),
        }));
        setRemovePhoto(false);
        setNotice("Avatar created. Save your profile to upload it.");
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create avatar.");
    } finally {
      setCreatingAvatar(false);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedImageFile(null);
    setFormData((previous) => ({ ...previous, profileImage: "" }));
    setRemovePhoto(true);
  };

  const handleSubmitProfile = async () => {
    if (!formData) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const requestBody = new FormData();
      requestBody.set("fullName", formData.fullName);
      requestBody.set("preferredName", formData.preferredName);
      requestBody.set("email", formData.email);
      requestBody.set("phone", formData.phone);
      requestBody.set("licenseNumber", formData.licenseNumber);
      requestBody.set("dateOfBirth", formData.dateOfBirth);
      requestBody.set("gender", formData.gender);
      requestBody.set("address", formData.address);
      requestBody.set("specialization", formData.specialization);
      requestBody.set("experienceYears", String(Number.parseInt(formData.experienceYears || "0", 10) || 0));
      requestBody.set("location", formData.location);
      requestBody.set("chatFee", String(Number.parseFloat(formData.chatFee || "0") || 0));
      requestBody.set("appointmentFee", String(Number.parseFloat(formData.appointmentFee || "0") || 0));
      requestBody.set("qualifications", formData.qualifications.join(", "));
      requestBody.set("languages", formData.languages.join(", "));
      requestBody.set(
        "availabilityForOnlineAdvice",
        String(formData.availabilityForOnlineAdvice),
      );

      if (selectedImageFile) {
        requestBody.set("profileImage", selectedImageFile);
      }
      if (removePhoto) {
        requestBody.set("clearProfilePicture", "true");
      }

      const response = await fetch("/api/doctor/profile", {
        method: "PATCH",
        body: requestBody,
      });

      if (response.status === 401 || response.status === 403) {
        handleDoctorSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.error || payload?.detail || "Failed to update profile");
      }

      const updatedProfile = payload as DoctorProfileData;
      const nextFormData = mapProfileToForm(updatedProfile);

      setProfile(updatedProfile);
      setFormData(nextFormData);
      setSelectedImageFile(null);
      setRemovePhoto(false);
      setDraftSavedAt(null);
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      window.localStorage.removeItem(DRAFT_SAVED_AT_KEY);
      setNotice("Your profile has been updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = () => {
    try {
      const draftPayload = {
        formData,
        profileImage: formData.profileImage,
      };

      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
      const savedAt = new Date().toISOString();
      window.localStorage.setItem(DRAFT_SAVED_AT_KEY, savedAt);
      setDraftSavedAt(savedAt);
      setNotice("Your changes were saved as a draft on this device.");
      setError("");
    } catch {
      setError("Could not save the draft in this browser.");
    }
  };

  const handleReset = () => {
    setNotice("");
    setError("");

    if (profile) {
      const mappedProfile = mapProfileToForm(profile);
      setFormData(mappedProfile);
      setSelectedImageFile(null);
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      window.localStorage.removeItem(DRAFT_SAVED_AT_KEY);
      setDraftSavedAt(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5faf7]">
        <p className="text-slate-600">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5faf7] px-4">
        <p className="text-red-600">{error || "Failed to load profile"}</p>
      </div>
    );
  }

  const joinedQualifications = formData.qualifications.join(", ");
  const joinedLanguages = formData.languages.join(", ");
  const joinedHospitals = formData.hospitals.join(", ");
  const profileCompletion = Math.round(
    (
      [
        formData.fullName,
        formData.email,
        formData.phone,
        formData.licenseNumber,
        formData.dateOfBirth,
        formData.gender,
        formData.address,
        formData.specialization,
        formData.experienceYears,
        formData.location,
        formData.chatFee,
        formData.appointmentFee,
        joinedQualifications,
        joinedLanguages,
      ].filter((value) => value.trim().length > 0).length / 14
    ) * 100,
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.14),_transparent_24%),linear-gradient(180deg,#eefbf6_0%,#f7fcfa_45%,#ffffff_100%)] pb-10">
      <div
        className="absolute inset-0 bg-[url('/images/doctor-login-bg.png')] bg-cover bg-center bg-no-repeat opacity-[0.07]"
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-white/88 via-white/82 to-white/95" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-100/50 to-transparent" aria-hidden="true" />
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" aria-hidden="true" />
      <div className="absolute right-0 top-36 h-80 w-80 rounded-full bg-teal-200/20 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-[1600px] px-4 pt-5 sm:px-6 lg:px-8 2xl:px-10 lg:pt-8">
        <div className="relative mb-8 overflow-hidden rounded-[2.5rem] border border-emerald-200/40 bg-[url('/images/doctor-login-bg.png')] bg-cover bg-center bg-no-repeat shadow-[0_20px_60px_rgba(16,185,129,0.15)]">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 via-emerald-500/85 to-teal-600/85 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-emerald-900/10" />
          <div className="relative grid gap-6 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1.15fr_0.85fr] lg:px-10 lg:py-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-white backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-white" />
                DOCTOR PROFILE EDITOR
              </div>
              <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Shape your profile into a cleaner, more polished practice page
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/95 sm:text-lg">
                Update identity, consultation fees, availability, and practice details in one focused workspace.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <StatusPill tone="slate">Secure draft workspace</StatusPill>
                <StatusPill tone="emerald">Profile completion {profileCompletion}%</StatusPill>
                <StatusPill tone="teal">Backend sync enabled</StatusPill>
                {draftSavedAt ? <StatusPill tone="slate">Draft saved locally</StatusPill> : null}
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/20 bg-white/12 p-5 text-white shadow-2xl shadow-emerald-900/10 backdrop-blur-md">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
                Editing progress
              </p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-bold leading-none">{profileCompletion}%</p>
                  <p className="mt-2 text-sm text-white/80">Profile completeness</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/12 px-3 py-2 text-right backdrop-blur-sm">
                  <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-white/70">
                    Draft status
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {draftSavedAt ? "Saved on this device" : "No draft saved"}
                  </p>
                </div>
              </div>

              <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-white via-emerald-100 to-teal-100 transition-all duration-500"
                  style={{ width: `${profileCompletion}%` }}
                />
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/65">Name</p>
                  <p className="mt-2 break-words font-semibold text-white">{formData.fullName || "Not set yet"}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/65">Specialization</p>
                  <p className="mt-2 break-words font-semibold text-white">{formData.specialization || "Not set"}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/65">Fees</p>
                  <p className="mt-2 font-semibold text-white">{formData.chatFee || "0"} / {formData.appointmentFee || "0"}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/65">Availability</p>
                  <p className="mt-2 font-semibold text-white">{formData.availabilityForOnlineAdvice ? "Online advice on" : "Online advice off"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-end gap-3">
          <BlackButton className="rounded-full px-6 py-3" onClick={() => router.push("/doctor-self/profile")}>
            Back to Profile
          </BlackButton>
        </div>

        {notice ? (
          <div className="mb-6 rounded-[1.5rem] border border-emerald-200 bg-emerald-50/85 p-4 text-emerald-800 shadow-sm">
            {notice}
          </div>
        ) : null}

        {error ? (
          <div className="mb-6 rounded-[1.5rem] border border-red-200 bg-red-50/85 p-4 text-red-700 shadow-sm">
            {error}
          </div>
        ) : null}

        <form
          onSubmit={(event: FormEvent<HTMLFormElement>) => {
            event.preventDefault();
            void handleSubmitProfile();
          }}
          className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(340px,0.55fr)] 2xl:grid-cols-[minmax(0,1.65fr)_minmax(360px,0.7fr)]"
        >
          <section className="overflow-hidden rounded-[2.25rem] border border-white/80 bg-white/88 shadow-[0_24px_70px_rgba(16,185,129,0.12)] backdrop-blur">
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <StatusPill tone="emerald">Secure draft workspace</StatusPill>
                <StatusPill tone="slate">{loading ? "Syncing profile data" : "Ready to edit"}</StatusPill>
                <StatusPill tone="teal">Backend sync enabled</StatusPill>
                {draftSavedAt ? <StatusPill tone="slate">Draft saved locally</StatusPill> : null}
              </div>

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-5 rounded-[2rem] border border-emerald-100/80 bg-gradient-to-br from-white via-emerald-50/90 to-teal-50/80 p-4 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
                  <div className="relative shrink-0 rounded-[1.75rem] bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-[3px] shadow-xl shadow-emerald-200/40">
                    <div className="relative overflow-hidden rounded-[1.5rem] bg-white p-1">
                      <img
                        src={profileImage}
                        alt="Doctor profile preview"
                        className="h-[144px] w-[144px] rounded-[1.25rem] object-cover"
                      />
                      {!profileImage.startsWith("data:") && !profileImage.trim() ? (
                        <div className="absolute inset-0 flex items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-4xl font-bold text-white">
                          {initials}
                        </div>
                      ) : null}
                      <div className="absolute left-3 top-3 rounded-full border border-white/30 bg-white/20 px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] text-white backdrop-blur-sm">
                        PROFILE
                      </div>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                      Profile photo
                    </p>
                    <h2 className="mt-1 break-words text-2xl font-bold text-slate-900">
                      {formData.fullName || "Your name"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {formData.specialization || "Specialization not specified"}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusPill tone="emerald">Featured avatar</StatusPill>
                      <StatusPill tone="teal">Patient-facing</StatusPill>
                    </div>
                  </div>
                </div>

                <div className="inline-flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50">
                    Change photo
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                  <button
                    type="button"
                    onClick={() => { void handleCreateAvatar(); }}
                    disabled={creatingAvatar}
                    className="inline-flex items-center justify-center rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creatingAvatar ? "Creating avatar..." : "Create avatar"}
                  </button>
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Remove photo
                  </button>
                </div>
              </div>

              <div className="mt-8 grid gap-6 2xl:grid-cols-2">
                <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur">
                  <SectionHeader title="Identity" description="Update the personal details shown across the platform." />
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <FieldCard label="Full Name" value={formData.fullName} onChange={(value) => handleChange("fullName", value)} placeholder="Dr. John Doe" />
                    <FieldCard label="Preferred Name" value={formData.preferredName} onChange={(value) => handleChange("preferredName", value)} placeholder="Dr. John" />
                    <FieldCard label="Email Address" type="email" value={formData.email} onChange={(value) => handleChange("email", value)} placeholder="your.email@example.com" autoComplete="email" />
                    <FieldCard label="Contact Phone" value={formData.phone} onChange={(value) => handleChange("phone", value)} placeholder="+94 XX XXX XXXX" autoComplete="tel" />
                    <FieldCard label="License Number" value={formData.licenseNumber} onChange={(value) => handleChange("licenseNumber", value)} placeholder="SLMC/1234" />
                    <FieldCard label="Date of Birth" type="date" value={formData.dateOfBirth} onChange={(value) => handleChange("dateOfBirth", value)} />
                    <SelectCard label="Gender" value={formData.gender} onChange={(value) => handleChange("gender", value)} options={["Male", "Female"]} placeholder="Select gender" />
                    <TextAreaCard label="Address" value={formData.address} onChange={(value) => handleChange("address", value)} placeholder="House number, street, city" helperText="Use the address you want patients or admins to see." />
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur">
                  <SectionHeader title="Practice Profile" description="Define how your services are presented to patients." />
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    <SelectCard label="Specialization" value={formData.specialization} onChange={(value) => handleChange("specialization", value)} options={DOCTOR_SPECIALIZATIONS} placeholder="Select specialization" />
                    <FieldCard label="Years of Experience" type="number" value={formData.experienceYears} onChange={(value) => handleChange("experienceYears", value)} placeholder="8" />
                    <FieldCard label="Practice Location" value={formData.location} onChange={(value) => handleChange("location", value)} placeholder="Colombo" />
                    <FieldCard label="Online Chat Fee (LKR)" type="number" value={formData.chatFee} onChange={(value) => handleChange("chatFee", value)} placeholder="500" />
                    <FieldCard label="In-Person Fee (LKR)" type="number" value={formData.appointmentFee} onChange={(value) => handleChange("appointmentFee", value)} placeholder="3000" />
                    <div className="sm:col-span-2 rounded-2xl border border-white/80 bg-slate-50/80 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Availability for online advice</p>
                          <p className="text-xs text-slate-500">Toggle whether patients can book online advice sessions.</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            checked={formData.availabilityForOnlineAdvice}
                            onChange={(event) => handleChange("availabilityForOnlineAdvice", event.target.checked)}
                            className="peer sr-only"
                          />
                          <div className="h-7 w-12 rounded-full bg-slate-300 transition peer-checked:bg-emerald-500" />
                          <div className="absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur">
                  <SectionHeader title="Qualifications and Languages" description="Describe your education and the languages you consult in." />
                  <div className="mt-6 grid gap-4">
                    <TextAreaCard label="Qualifications" value={joinedQualifications} onChange={(value) => handleChange("qualifications", splitCommaSeparated(value))} placeholder="MBBS, MD, FRCS" helperText="Separate multiple items with commas." />
                    <MultiSelectCard label="Languages" values={formData.languages} onChange={(value) => handleChange("languages", value)} options={LANGUAGE_OPTIONS} helperText="Hold Ctrl or Cmd to select more than one language." />
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur">
                  <SectionHeader title="Hospitals and Coverage" description="Request affiliation to active hospitals to configure your practice location and scheduling." />
                  <div className="mt-6 space-y-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-800">Request Affiliation</label>
                      <div className="flex gap-2">
                        <select
                          value={selectedHospitalId}
                          onChange={(e) => setSelectedHospitalId(e.target.value)}
                          className="flex-1 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-slate-900 shadow-sm shadow-emerald-100/10 focus:border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                        >
                          <option value="">Select an active hospital...</option>
                          {availableHospitals.map((hospital) => (
                            <option key={hospital.id} value={hospital.id}>
                              {hospital.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={!selectedHospitalId || requesting}
                          onClick={() => {
                            const selected = activeHospitals.find(h => String(h.id) === selectedHospitalId);
                            if (selected) {
                              confirmRequestAffiliation(selected.id, selected.name);
                            }
                          }}
                          className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/10 transition hover:bg-emerald-700 disabled:opacity-50 disabled:hover:bg-emerald-600"
                        >
                          {requesting ? "Submitting..." : "Send Request"}
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-6">
                      <h4 className="text-sm font-semibold text-slate-800 mb-3">Your Affiliations & Requests</h4>
                      {requestsLoading ? (
                        <p className="text-sm text-slate-500">Loading requests...</p>
                      ) : (
                        <div className="space-y-3">
                          {hospitalRequests.map((req) => (
                            <div key={req.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/50 gap-3">
                              <div className="space-y-1">
                                <p className="font-semibold text-slate-800">{req.hospitalName}</p>
                                <p className="text-xs text-slate-500">Requested on: {new Date(req.created_at).toLocaleDateString()}</p>
                                {req.status === "REJECTED" && req.rejection_reason && (
                                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-100 rounded-lg p-2 mt-1">
                                    <strong>Rejection Reason:</strong> {req.rejection_reason}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 self-start sm:self-auto">
                                {req.status === "VERIFIED" && (
                                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                                    Verified
                                  </span>
                                )}
                                {req.status === "PENDING" && (
                                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
                                    Pending Approval
                                  </span>
                                )}
                                {req.status === "REJECTED" && (
                                  <>
                                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 ring-1 ring-rose-200">
                                      Rejected
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => confirmRequestAffiliation(req.hospital, req.hospitalName)}
                                      className="px-3 py-1 text-xs font-bold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                                    >
                                      Re-Request
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                          {hospitalRequests.length === 0 && (
                            <p className="text-sm text-slate-500 text-center py-4">No requests or affiliations found.</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
            <div className="overflow-hidden relative rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.08)] backdrop-blur">
              <div className="absolute inset-0 bg-[url('/images/doctor-login-bg.png')] bg-cover bg-center opacity-[0.08]" aria-hidden="true" />
              <div className="absolute inset-0 bg-gradient-to-br from-white/78 to-white/90" aria-hidden="true" />
              <div className="relative space-y-4">
                <h3 className="text-lg font-black text-slate-900">Profile Summary</h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-slate-100">
                    <img src={profileImage} alt="Profile preview" className="h-full w-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Doctor</p>
                    <p className="font-semibold text-slate-900">{formData.fullName || "Not provided"}</p>
                    <p className="text-sm text-slate-600">{formData.email || "email@example.com"}</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-slate-500">Specialization</p>
                    <p className="font-semibold text-emerald-700">{formData.specialization || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Practice Location</p>
                    <p className="font-semibold text-slate-900">{formData.location || "Not specified"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">License Number</p>
                    <p className="font-semibold text-slate-900">{formData.licenseNumber || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Chat Fee</p>
                    <p className="font-semibold text-slate-900">Rs. {formData.chatFee || "0"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Appointment Fee</p>
                    <p className="font-semibold text-teal-700">Rs. {formData.appointmentFee || "0"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Online advice</p>
                    <p className="font-semibold text-slate-900">
                      {formData.availabilityForOnlineAdvice ? "Available" : "Not available"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Qualifications</p>
                    <p className="font-semibold text-slate-900">{joinedQualifications || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Hospitals</p>
                    <p className="font-semibold text-slate-900">{joinedHospitals || "Not selected"}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Languages</p>
                    <p className="font-semibold text-slate-900">{joinedLanguages || "Not selected"}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-100/50 bg-emerald-50/80 p-6 backdrop-blur">
              <h3 className="mb-4 text-lg font-black text-emerald-900">Editing Tips</h3>
              <div className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">1</div>
                  <div>
                    <p className="font-semibold text-slate-900">Update all identity fields</p>
                    <p className="text-xs text-slate-600">Full name, contact info, license number, date of birth, and address sync directly to the backend.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">2</div>
                  <div>
                    <p className="font-semibold text-slate-900">Choose the practice details</p>
                    <p className="text-xs text-slate-600">Specialization, experience, location, fees, and online advice availability all stay editable here.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">3</div>
                  <div>
                    <p className="font-semibold text-slate-900">Save or keep a draft</p>
                    <p className="text-xs text-slate-600">Use draft saving if you want to return later without losing progress.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <GreenButton onClick={() => { void handleSubmitProfile(); }} disabled={saving} className="w-full rounded-full px-4 py-2.5 text-sm font-semibold shadow-[0_12px_30px_rgba(16,185,129,0.3)] hover:shadow-[0_15px_40px_rgba(16,185,129,0.4)]">
                {saving ? "Saving..." : "Save Changes"}
              </GreenButton>
              <BlackButton onClick={handleSaveDraft} className="w-full rounded-full px-4 py-2.5 text-sm font-semibold">
                Save Draft
              </BlackButton>
              <BlackButton onClick={handleReset} className="w-full rounded-full px-4 py-2.5 text-sm font-semibold">
                Reset Changes
              </BlackButton>
            </div>
          </aside>
        </form>
      </div>

      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-100 text-center">
            <h3 className="text-lg font-bold text-slate-900">{confirmModal.title}</h3>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">{confirmModal.message}</p>

            <div className="flex gap-3 justify-center pt-5 border-t border-slate-50 mt-6">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="flex-1 px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 text-slate-650 hover:bg-slate-50 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`flex-1 px-4 py-2 text-xs font-semibold rounded-xl text-white shadow-sm hover:shadow transition-all ${confirmModal.isDanger
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/10"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/10"
                  }`}
              >
                {confirmModal.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
