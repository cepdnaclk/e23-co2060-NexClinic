"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import GreenButton from "@/components/buttons/GreenButton";
import BlackButton from "@/components/buttons/BlackButton";
import { handlePatientSessionExpired } from "@/lib/patientSession";
import { Patient } from "@/data/patients";
import { User } from "lucide-react";

type PatientProfileResponse = {
  patient: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: string;
    address: string;
    city: string;
    postalCode?: string;
    country?: string;
    profileImage: string;
  };
  health: {
    bloodType: string;
    allergies: string;
    medications: string;
    medicalReports: string;
    medicalDocuments: string;
    medicalHistory: string;
  };
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
    email: string;
  };
};

const DRAFT_STORAGE_KEY = "patient-profile-draft";

const defaultFormData: Patient = {
  id: "",
  name: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "other",
  address: "",
  city: "",
  postalCode: "",
  country: "",
  bloodType: "",
  allergies: "",
  medications: "",
  medicalReports: "",
  medicalDocuments: "",
  medicalHistory: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  emergencyContactRelation: "",
  emergencyContactEmail: "",
  profileImage: "/images/user.png",
  lastUpdated: new Date().toISOString().split("T")[0],
};

function mapProfileToForm(profile: PatientProfileResponse | null): Patient {
  if (!profile) {
    return defaultFormData;
  }

  return {
    ...defaultFormData,
    name: profile.patient.fullName || "",
    email: profile.patient.email || "",
    phone: profile.patient.phone || "",
    dateOfBirth: profile.patient.dateOfBirth || "",
    gender: (profile.patient.gender as Patient["gender"]) || "other",
    address: profile.patient.address || "",
    city: profile.patient.city || "",
    postalCode: profile.patient.postalCode || "",
    country: profile.patient.country || "",
    bloodType: profile.health.bloodType || "",
    allergies: profile.health.allergies || "",
    medications: profile.health.medications || "",
    medicalReports: profile.health.medicalReports || "",
    medicalDocuments: profile.health.medicalDocuments || "",
    medicalHistory: profile.health.medicalHistory || "",
    emergencyContactName: profile.emergencyContact.name || "",
    emergencyContactPhone: profile.emergencyContact.phone || "",
    emergencyContactRelation: profile.emergencyContact.relation || "",
    emergencyContactEmail: profile.emergencyContact.email || "",
    profileImage: profile.patient.profileImage || defaultFormData.profileImage,
  };
}

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function FieldCard({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/85 p-4 shadow-sm shadow-emerald-100/20 backdrop-blur-sm">
      <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

export default function UserEditProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<PatientProfileResponse | null>(null);
  const [formData, setFormData] = useState<Patient>(defaultFormData);
  const [profileImageVersion, setProfileImageVersion] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [selectedMedicalReportFile, setSelectedMedicalReportFile] = useState<File | null>(null);
  const [selectedMedicalDocumentFile, setSelectedMedicalDocumentFile] = useState<File | null>(null);
  const [bloodTypeUnknown, setBloodTypeUnknown] = useState(false);
  const [medicalReportLabel, setMedicalReportLabel] = useState("No file selected");
  const [medicalDocumentLabel, setMedicalDocumentLabel] = useState("No file selected");
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/patient/profile", {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 401 || response.status === 403) {
          handlePatientSessionExpired(router);
          return;
        }

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          throw new Error(
            errorPayload?.error || "Failed to load profile details",
          );
        }

        const data: PatientProfileResponse = await response.json();
        setProfile(data);

        const draftRaw = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (draftRaw) {
          const draft = JSON.parse(draftRaw) as Patient;
          const draftBloodTypeUnknown = !draft.bloodType;
          setFormData({
            ...mapProfileToForm(data),
            ...draft,
          });
          setBloodTypeUnknown(draftBloodTypeUnknown);
        } else {
          const mappedProfile = mapProfileToForm(data);
          setFormData(mappedProfile);
          setBloodTypeUnknown(!mappedProfile.bloodType);
        }

        setDraftSavedAt(window.localStorage.getItem("patient-profile-draft-saved-at"));
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load profile details",
        );
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [router]);

  useEffect(() => {
    setProfileImageVersion(
      window.localStorage.getItem("patient-profile-image-updated-at") || "",
    );
  }, []);

  const profileImage = useMemo(() => {
    const imageSrc = formData.profileImage?.trim();
    if (!imageSrc) {
      return undefined;
    }

    if (imageSrc.startsWith("/images/") || imageSrc.startsWith("data:")) {
      return imageSrc;
    }

    return profileImageVersion
      ? `${imageSrc}?v=${profileImageVersion}`
      : imageSrc;
  }, [formData.profileImage, profileImageVersion]);

  const getAttachmentLabel = (url: string) => {
    if (!url.trim()) {
      return "No file uploaded";
    }

    try {
      return decodeURIComponent(url.split("/").pop() || "Uploaded file");
    } catch {
      return "Uploaded file";
    }
  };

  const initials = useMemo(() => {
    const parts = formData.name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return "P";
    }
    return parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("");
  }, [formData.name]);

  const profileCompletion = useMemo(() => {
    const trackedValues = [
      formData.name,
      formData.email,
      formData.phone,
      formData.dateOfBirth,
      formData.gender,
      formData.address,
      formData.city,
      formData.country,
      bloodTypeUnknown ? "unknown" : formData.bloodType,
      formData.allergies,
      formData.medications,
      formData.medicalHistory,
      formData.emergencyContactName,
      formData.emergencyContactPhone,
      formData.emergencyContactRelation,
      formData.emergencyContactEmail,
    ];

    const filledCount = trackedValues.filter((value) => value.trim().length > 0).length;
    return Math.round((filledCount / trackedValues.length) * 100);
  }, [
    bloodTypeUnknown,
    formData.address,
    formData.allergies,
    formData.bloodType,
    formData.city,
    formData.dateOfBirth,
    formData.email,
    formData.emergencyContactEmail,
    formData.emergencyContactName,
    formData.emergencyContactPhone,
    formData.emergencyContactRelation,
    formData.gender,
    formData.medications,
    formData.medicalHistory,
    formData.name,
    formData.phone,
    formData.country,
  ]);

  const draftSavedSummary = useMemo(() => {
    if (!draftSavedAt) {
      return "No draft saved on this device";
    }

    const parsedDate = new Date(draftSavedAt);
    if (Number.isNaN(parsedDate.getTime())) {
      return "Draft saved on this device";
    }

    return parsedDate.toLocaleString([], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  }, [draftSavedAt]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImageFile(file);
      setRemovePhoto(false);
      setImageError(false);
      setFormData((previous) => ({
        ...previous,
        profileImage: reader.result as string,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setSelectedImageFile(null);
    setRemovePhoto(true);
    setImageError(false);
    setFormData((previous) => ({
      ...previous,
      profileImage: "",
    }));
  };

  const handleMedicalReportUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedMedicalReportFile(file);
    setMedicalReportLabel(file.name);
  };

  const handleMedicalDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }

    setSelectedMedicalDocumentFile(file);
    setMedicalDocumentLabel(file.name);
  };

  const handleBloodTypeToggle = (checked: boolean) => {
    setBloodTypeUnknown(checked);
    setFormData((previous) =>
      previous
        ? {
          ...previous,
          bloodType: checked ? "" : previous.bloodType || "O+",
        }
        : previous,
    );
  };

  const handleSaveDraft = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmitProfile();
  };

  const handleSubmitProfile = async () => {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const requestBody = new FormData();
      if (formData.name) requestBody.set("fullName", formData.name);
      if (formData.email) requestBody.set("email", formData.email);
      if (formData.phone) requestBody.set("phone", formData.phone);
      if (formData.dateOfBirth) requestBody.set("dateOfBirth", formData.dateOfBirth);
      if (formData.gender) requestBody.set("gender", formData.gender);

      if (formData.address !== undefined) requestBody.set("address", formData.address);
      if (formData.city !== undefined) requestBody.set("city", formData.city);
      if (formData.postalCode !== undefined) requestBody.set("postalCode", formData.postalCode);
      if (formData.country !== undefined) requestBody.set("country", formData.country);
      if (formData.bloodType !== undefined) requestBody.set("bloodType", formData.bloodType);
      if (formData.allergies !== undefined) requestBody.set("allergies", formData.allergies);
      if (formData.medications !== undefined) requestBody.set("medications", formData.medications);
      if (formData.medicalHistory !== undefined) requestBody.set("medicalHistory", formData.medicalHistory);
      if (formData.emergencyContactName !== undefined) requestBody.set("emergencyContactName", formData.emergencyContactName);
      if (formData.emergencyContactPhone !== undefined) requestBody.set("emergencyContactPhone", formData.emergencyContactPhone);
      if (formData.emergencyContactRelation !== undefined) requestBody.set("emergencyContactRelation", formData.emergencyContactRelation);
      if (formData.emergencyContactEmail !== undefined) requestBody.set("emergencyContactEmail", formData.emergencyContactEmail);

      if (selectedImageFile) {
        requestBody.set("profileImage", selectedImageFile);
      } else if (removePhoto) {
        requestBody.set("clearProfilePicture", "true");
      }

      if (selectedMedicalReportFile) {
        requestBody.set("medicalReports", selectedMedicalReportFile);
      }

      if (selectedMedicalDocumentFile) {
        requestBody.set("medicalDocuments", selectedMedicalDocumentFile);
      }

      const response = await fetch("/api/patient/profile", {
        method: "PATCH",
        body: requestBody,
      });

      if (response.status === 401 || response.status === 403) {
        handlePatientSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          payload?.error || "Could not save your profile changes.",
        );
      }

      const updatedProfile = payload as PatientProfileResponse;
      const nextFormData = {
        ...mapProfileToForm(updatedProfile),
      };

      setProfile(updatedProfile);
      setFormData(nextFormData);
      setSelectedImageFile(null);
      setSelectedMedicalReportFile(null);
      setSelectedMedicalDocumentFile(null);
      setMedicalReportLabel(getAttachmentLabel(updatedProfile.health.medicalReports));
      setMedicalDocumentLabel(getAttachmentLabel(updatedProfile.health.medicalDocuments));
      const imageVersion = Date.now().toString();
      window.localStorage.setItem("patient-profile-image-updated-at", imageVersion);
      setProfileImageVersion(imageVersion);
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      window.localStorage.removeItem("patient-profile-draft-saved-at");
      setDraftSavedAt(null);
      setNotice("Your profile has been updated successfully.");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not save your profile changes.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraftOnly = () => {
    setSaving(true);
    setError("");
    setNotice("");

    try {
      const savedAt = new Date().toISOString();
      window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formData));
      window.localStorage.setItem("patient-profile-draft-saved-at", savedAt);
      setDraftSavedAt(savedAt);
      setNotice("Your changes were saved as a draft on this device.");
    } catch {
      setError("Could not save the draft in this browser.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setNotice("");
    setError("");

    if (profile) {
      const mappedProfile = mapProfileToForm(profile);
      setFormData(mappedProfile);
      setBloodTypeUnknown(!mappedProfile.bloodType);
      setSelectedImageFile(null);
      setRemovePhoto(false);
      setSelectedMedicalReportFile(null);
      setSelectedMedicalDocumentFile(null);
      setMedicalReportLabel(getAttachmentLabel(profile.health.medicalReports));
      setMedicalDocumentLabel(getAttachmentLabel(profile.health.medicalDocuments));
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
      window.localStorage.removeItem("patient-profile-draft-saved-at");
      setDraftSavedAt(null);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(20,184,166,0.14),_transparent_24%),linear-gradient(180deg,#eefbf6_0%,#f7fcfa_45%,#ffffff_100%)] pb-10">
      <div
        className="absolute inset-0 bg-[url('/images/user-registration-bg.jpg')] bg-cover bg-center bg-no-repeat opacity-[0.08]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-white/88 via-white/82 to-white/95"
        aria-hidden="true"
      />
      <div className="absolute inset-x-0 top-0 h-64 bg-gradient-to-b from-emerald-100/50 to-transparent" />
      <div className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" />
      <div className="absolute right-0 top-36 h-80 w-80 rounded-full bg-teal-200/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <div className="relative mb-8 overflow-hidden rounded-[2.5rem] border border-emerald-200/40 bg-[url('/images/user-registration-bg.jpg')] bg-cover bg-center bg-no-repeat shadow-[0_20px_60px_rgba(16,185,129,0.15)]">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/90 via-emerald-500/85 to-teal-600/85 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-emerald-900/10" />
          <div className="relative grid gap-6 px-5 py-10 sm:px-8 sm:py-14 lg:grid-cols-[1.25fr_0.75fr] lg:px-10 lg:py-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-white backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-white" />
                PATIENT PROFILE EDITOR
              </div>
              <h1 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                Rework your profile with a calmer, more polished flow
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/95 sm:text-lg">
                Keep contact, health, and emergency details in one focused
                workspace with a cleaner hierarchy and faster visual scanning.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/30 bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
                  Secure patient workspace
                </span>
                <span className="rounded-full border border-white/30 bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
                  Drafts saved locally
                </span>
                <span className="rounded-full border border-white/30 bg-white/15 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm">
                  Live backend sync
                </span>
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
                  <p className="mt-1 text-sm font-semibold text-white">{draftSavedSummary}</p>
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
                  <p className="text-xs uppercase tracking-[0.22em] text-white/65">Current name</p>
                  <p className="mt-2 break-words font-semibold text-white">{formData.name || "Not set yet"}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/65">Blood type</p>
                  <p className="mt-2 font-semibold text-white">{bloodTypeUnknown ? "Unknown" : formData.bloodType || "Not set"}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/65">Emergency</p>
                  <p className="mt-2 break-words font-semibold text-white">{formData.emergencyContactName || "Not set yet"}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/65">Health notes</p>
                  <p className="mt-2 font-semibold text-white">{formData.allergies ? "Updated" : "Pending"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-medium text-rose-700 shadow-sm">
            {error}
          </div>
        ) : null}

        {notice ? (
          <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700 shadow-sm">
            {notice}
          </div>
        ) : null}

        <div className="mb-6 flex justify-end">
          <BlackButton
            className="rounded-full px-6 py-3"
            onClick={() => router.push("/user-self/profile")}
          >
            Back to Profile
          </BlackButton>
        </div>

        <form
          onSubmit={handleSaveDraft}
          className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]"
        >
          <section className="overflow-hidden rounded-[2.25rem] border border-white/80 bg-white/90 shadow-[0_24px_70px_rgba(16,185,129,0.12)] backdrop-blur">
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  Secure draft workspace
                </span>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200">
                  {loading ? "Syncing profile data" : "Ready to edit"}
                </span>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700 ring-1 ring-teal-200">
                  Backend sync enabled
                </span>
              </div>

              <div className="flex flex-col gap-6 rounded-[2rem] border border-emerald-100/70 bg-[linear-gradient(135deg,rgba(236,253,245,0.95),rgba(255,255,255,0.95))] p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
                <div className="flex items-center gap-4">
                  <div className="rounded-[1.75rem] bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-1 shadow-xl shadow-emerald-200/40">
                    <div className="relative overflow-hidden rounded-[1.5rem] bg-white p-1">
                      {profileImage && !imageError ? (
                        <img
                          src={profileImage}
                          alt="Patient profile preview"
                          className="h-[120px] w-[120px] rounded-[1.25rem] object-cover"
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        <div className="flex h-[120px] w-[120px] items-center justify-center rounded-[1.25rem] bg-emerald-50 text-emerald-500">
                          <User className="h-16 w-16" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center rounded-[1.25rem] bg-gradient-to-br from-emerald-600/0 via-emerald-600/0 to-emerald-950/20 text-3xl font-bold text-white opacity-0 transition-opacity duration-200 hover:opacity-100">
                        {initials}
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                      Profile photo
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-slate-900">
                      {formData.name || "Your name"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600">
                      {formData.email || "email@example.com"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      A simple, calm place to update personal details.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50">
                    Change photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                  {(formData.profileImage && formData.profileImage !== "/images/user.png") && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="inline-flex items-center justify-center rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 shadow-sm transition hover:bg-rose-50"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>

              {loading ? (
                <div className="mt-7 rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-sm text-slate-600">
                  Loading your current profile details...
                </div>
              ) : (
                <div className="mt-7 space-y-7">
                  <section>
                    <SectionHeader
                      title="Personal details"
                      description="These are the basics used across your patient dashboard and appointments."
                    />

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FieldCard label="Full name">
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                          placeholder="Enter your full name"
                        />
                      </FieldCard>

                      <FieldCard label="Email address">
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                          placeholder="you@example.com"
                        />
                      </FieldCard>

                      <FieldCard label="Phone number">
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                          placeholder="+1 555 123 4567"
                        />
                      </FieldCard>

                      <FieldCard label="Date of birth">
                        <input
                          type="date"
                          name="dateOfBirth"
                          value={formData.dateOfBirth}
                          onChange={handleChange}
                          className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none focus:ring-0"
                        />
                      </FieldCard>

                      <FieldCard label="Gender">
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          className="w-full rounded-xl border border-emerald-100 bg-white/90 px-3 py-2 text-base text-slate-900 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                        >
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </FieldCard>

                      <FieldCard label="Blood type">
                        <div className="space-y-3">
                          <select
                            name="bloodType"
                            value={bloodTypeUnknown ? "" : formData.bloodType}
                            onChange={(e) => {
                              setBloodTypeUnknown(false);
                              handleChange(e);
                            }}
                            disabled={bloodTypeUnknown}
                            className="w-full rounded-xl border border-emerald-100 bg-white/90 px-3 py-2 text-base text-slate-900 outline-none focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                          >
                            <option value="">Select blood type</option>
                            <option value="O+">O+</option>
                            <option value="O-">O-</option>
                            <option value="A+">A+</option>
                            <option value="A-">A-</option>
                            <option value="B+">B+</option>
                            <option value="B-">B-</option>
                            <option value="AB+">AB+</option>
                            <option value="AB-">AB-</option>
                          </select>
                          <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
                            <input
                              type="checkbox"
                              checked={bloodTypeUnknown}
                              onChange={(e) => handleBloodTypeToggle(e.target.checked)}
                              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            I don&apos;t know my blood type
                          </label>
                        </div>
                      </FieldCard>

                      <FieldCard label="Address">
                        <input
                          type="text"
                          name="address"
                          value={formData.address}
                          onChange={handleChange}
                          className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                          placeholder="123 Main Street"
                        />
                      </FieldCard>
                    </div>
                  </section>

                  <section>
                    <SectionHeader
                      title="Address information"
                      description="Add the details that help care teams keep records accurate and up to date."
                    />

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FieldCard label="City">
                        <input
                          type="text"
                          name="city"
                          value={formData.city}
                          onChange={handleChange}
                          className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                          placeholder="Colombo"
                        />
                      </FieldCard>

                      <FieldCard label="Postal code">
                        <input
                          type="text"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleChange}
                          className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                          placeholder="10001"
                        />
                      </FieldCard>

                      <FieldCard label="Country">
                        <input
                          type="text"
                          name="country"
                          value={formData.country}
                          onChange={handleChange}
                          className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                          placeholder="Sri Lanka"
                        />
                      </FieldCard>
                    </div>
                  </section>

                  <section>
                    <SectionHeader
                      title="Health snapshot"
                      description="Capture allergies, current medication, and attach reports or documents for easy review."
                    />

                    <div className="mt-5 space-y-4">
                      <FieldCard label="Allergies">
                        <textarea
                          name="allergies"
                          value={formData.allergies}
                          onChange={handleChange}
                          rows={3}
                          className="w-full resize-none border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                          placeholder="List any known allergies"
                        />
                      </FieldCard>

                      <FieldCard label="Current medications">
                        <textarea
                          name="medications"
                          value={formData.medications}
                          onChange={handleChange}
                          rows={3}
                          className="w-full resize-none border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                          placeholder="List current medications"
                        />
                      </FieldCard>

                      <div className="grid gap-4 md:grid-cols-2">
                        <FieldCard label="Upload reports">
                          <div className="space-y-3">
                            <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700">
                              Choose report file
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,image/*"
                                onChange={handleMedicalReportUpload}
                              />
                            </label>
                            <p className="text-sm text-slate-600">{medicalReportLabel}</p>
                          </div>
                        </FieldCard>

                        <FieldCard label="Upload documents">
                          <div className="space-y-3">
                            <label className="inline-flex cursor-pointer items-center justify-center rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700">
                              Choose document file
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,image/*"
                                onChange={handleMedicalDocumentUpload}
                              />
                            </label>
                            <p className="text-sm text-slate-600">{medicalDocumentLabel}</p>
                          </div>
                        </FieldCard>
                      </div>

                      <FieldCard label="Medical history">
                        <textarea
                          name="medicalHistory"
                          value={formData.medicalHistory}
                          onChange={handleChange}
                          rows={3}
                          className="w-full resize-none border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                          placeholder="Share anything clinically important"
                        />
                      </FieldCard>
                    </div>
                  </section>

                  <section>
                    <SectionHeader
                      title="Emergency contact"
                      description="A quick backup contact helps the care team respond faster when needed."
                    />

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                      <FieldCard label="Contact name">
                        <input
                          type="text"
                          name="emergencyContactName"
                          value={formData.emergencyContactName}
                          onChange={handleChange}
                          className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                          placeholder="Jane Doe"
                        />
                      </FieldCard>

                      <FieldCard label="Contact phone">
                        <input
                          type="tel"
                          name="emergencyContactPhone"
                          value={formData.emergencyContactPhone}
                          onChange={handleChange}
                          className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                          placeholder="+1 555 123 4568"
                        />
                      </FieldCard>

                      <FieldCard label="Relation">
                        <input
                          type="text"
                          name="emergencyContactRelation"
                          value={formData.emergencyContactRelation}
                          onChange={handleChange}
                          className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                          placeholder="Spouse, sibling, parent"
                        />
                      </FieldCard>

                      <FieldCard label="Contact email">
                        <input
                          type="email"
                          name="emergencyContactEmail"
                          value={formData.emergencyContactEmail}
                          onChange={handleChange}
                          className="w-full border-0 bg-transparent p-0 text-base text-slate-900 outline-none placeholder:text-slate-400 focus:ring-0"
                          placeholder="contact@example.com"
                        />
                      </FieldCard>
                    </div>
                  </section>

                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="max-w-xl text-sm text-slate-600">
                      Profile details sync to your account. Your uploaded photo
                      preview still stays on this device for now.
                    </p>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <BlackButton
                        type="button"
                        className="w-full rounded-full px-4 py-2 text-sm sm:w-auto"
                        onClick={handleSaveDraftOnly}
                      >
                        Save Draft
                      </BlackButton>
                      <BlackButton
                        type="button"
                        className="w-full rounded-full px-4 py-2 text-sm sm:w-auto"
                        onClick={handleReset}
                      >
                        Reset
                      </BlackButton>
                      <GreenButton
                        type="submit"
                        className="w-full rounded-full px-4 py-2 text-sm sm:w-auto"
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save Changes"}
                      </GreenButton>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <aside className="space-y-4">
            <div className="rounded-[2rem] border border-emerald-100 bg-white/90 p-6 shadow-lg shadow-emerald-100/40 backdrop-blur-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Live snapshot
              </p>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Name
                    </p>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      Profile
                    </span>
                  </div>
                  <p className="mt-2 break-words text-base font-semibold text-slate-900">
                    {formData.name || "Your full name"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Blood type
                    </p>
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-semibold text-teal-700">
                      Health
                    </span>
                  </div>
                  <p className="mt-2 text-base font-semibold text-slate-900">
                    {bloodTypeUnknown ? "Unknown" : formData.bloodType || "Not specified"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Emergency contact
                    </p>
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-semibold text-rose-700">
                      Safety
                    </span>
                  </div>
                  <p className="mt-2 break-words text-base font-semibold text-slate-900">
                    {formData.emergencyContactName || "Not set"}
                  </p>
                </div>
                <div className="rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      Draft saved
                    </p>
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                      Local
                    </span>
                  </div>
                  <p className="mt-2 break-words text-base font-semibold text-slate-900">
                    {draftSavedSummary}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-lg shadow-emerald-100/40">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-700">
                Editing checklist
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Name and contact details</p>
                    <p className="mt-1 text-xs text-slate-500">Used across appointments and chat.</p>
                  </div>
                  <p className="text-lg font-bold text-emerald-700">{Math.min(profileCompletion, 100)}%</p>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 ring-1 ring-emerald-100">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Health and history</p>
                    <p className="mt-1 text-xs text-slate-500">Allergies, medications, and notes.</p>
                  </div>
                  <p className="text-lg font-bold text-teal-700">
                    {formData.allergies || formData.medications || formData.medicalHistory ? "Ready" : "Open"}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </div>
  );
}
