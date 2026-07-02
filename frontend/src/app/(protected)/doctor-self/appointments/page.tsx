"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GreenButton from "@/components/buttons/GreenButton";
import WhiteButton from "@/components/buttons/WhiteButton";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import { handleDoctorSessionExpired } from "@/lib/doctorSession";

type AppointmentStatus =
  | "Pending"
  | "Accepted"
  | "Rejected"
  | "Completed"
  | "Cancelled";
type AppointmentCategory = "request" | "upcoming" | "previous";
type AppointmentStatusFilter = "All" | AppointmentStatus;
type DateFilter = "all" | "today" | "next7" | "custom";

type AppointmentItem = {
  id: string;
  patientId: string;
  patientName: string;
  patientAge: number;
  patientGender: "Male" | "Female" | "Other";
  reason: string;
  date: string;
  time: string;
  location: string;
  requestedAt: string;
  status: AppointmentStatus;
  category: AppointmentCategory;
};

type AppointmentSlot = {
  id: number;
  date: string;
  day_of_week: string;
  start_time: string;
  end_time: string;
};

type ApiAppointment = Omit<AppointmentItem, "id" | "patientId"> & {
  id: string | number;
  patientId: string | number;
};

type PatientProfile = {
  patientId: string;
  fullName: string;
  age: number | null;
  gender: string;
  bloodGroup: string;
  phone: string;
  emergencyContact: string;
  allergies: string[];
  conditions: string[];
  currentMedications: string[];
  comments: string;
  prescriptions: string;
  lastVisit: string;
  medicalRecords: MedicalRecord[];
};

type MedicalRecord = {
  id: string;
  appointmentId: string;
  visit_date: string;
  doctorName: string;
  hospitalName: string;
  observations: string;
  diagnosis: string;
  comments: string;
  prescriptions: string;
  recommended_tests: string;
  followUpDate: string;
  follow_up_notes: string;
  createdAt: string;
  updatedAt: string;
};

type ApiPatientProfile = {
  patientId?: string | number;
  fullName?: string;
  age?: number | null;
  gender?: string;
  bloodGroup?: string;
  phone?: string;
  emergencyContact?: string;
  allergies?: string[];
  conditions?: string[];
  currentMedications?: string[];
  comments?: string;
  prescriptions?: string;
  lastVisit?: string;
  medicalRecords?: MedicalRecord[];
};

type MedicalRecordDraft = {
  observations: string;
  diagnosis: string;
  comments: string;
  prescriptions: string;
  recommendedTests: string;
  followUpDate: string;
  followUpNotes: string;
};

const statusFilters: AppointmentStatusFilter[] = [
  "All",
  "Pending",
  "Accepted",
  "Rejected",
  "Completed",
  "Cancelled",
];
const appointmentStatuses: AppointmentStatus[] = [
  "Pending",
  "Accepted",
  "Rejected",
  "Completed",
  "Cancelled",
];
const appointmentCategories: AppointmentCategory[] = [
  "request",
  "upcoming",
  "previous",
];

const parseAppointmentDateTime = (date: string, time: string): Date | null => {
  const trimmedTime = time.trim().toUpperCase();
  const amPmMatch = trimmedTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  const twentyFourHourMatch = trimmedTime.match(/^(\d{2}):(\d{2})$/);

  let hour: number;
  let minute: number;

  if (amPmMatch) {
    hour = Number(amPmMatch[1]);
    minute = Number(amPmMatch[2]);
    const period = amPmMatch[3];

    if (period === "PM" && hour < 12) {
      hour += 12;
    }
    if (period === "AM" && hour === 12) {
      hour = 0;
    }
  } else if (twentyFourHourMatch) {
    hour = Number(twentyFourHourMatch[1]);
    minute = Number(twentyFourHourMatch[2]);
  } else {
    return null;
  }

  const dateTime = new Date(
    `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`,
  );
  return Number.isNaN(dateTime.getTime()) ? null : dateTime;
};

const formatTimeForDisplay = (time: string): string => {
  const twentyFourHourMatch = time.match(/^(\d{2}):(\d{2})$/);
  if (!twentyFourHourMatch) {
    return time;
  }

  let hour = Number(twentyFourHourMatch[1]);
  const minute = twentyFourHourMatch[2];
  const suffix = hour >= 12 ? "PM" : "AM";

  if (hour === 0) {
    hour = 12;
  } else if (hour > 12) {
    hour -= 12;
  }

  return `${hour}:${minute} ${suffix}`;
};

const normalizeAppointment = (item: ApiAppointment): AppointmentItem => {
  const safeStatus = appointmentStatuses.includes(item.status)
    ? item.status
    : "Pending";
  const safeCategory = appointmentCategories.includes(item.category)
    ? item.category
    : "request";

  return {
    ...item,
    id: String(item.id),
    patientId: String(item.patientId),
    status: safeStatus,
    category: safeCategory,
  };
};

function DoctorAppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(
    null,
  );
  const [patientNotesDraft, setPatientNotesDraft] = useState({
    comments: "",
    prescriptions: "",
  });
  const [medicalRecordTarget, setMedicalRecordTarget] =
    useState<AppointmentItem | null>(null);
  const [medicalRecordDraft, setMedicalRecordDraft] =
    useState<MedicalRecordDraft>({
      observations: "",
      diagnosis: "",
      comments: "",
      prescriptions: "",
      recommendedTests: "",
      followUpDate: "",
      followUpNotes: "",
    });
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [isLoadingPatientProfile, setIsLoadingPatientProfile] = useState(false);
  const [isSavingPatientNotes, setIsSavingPatientNotes] = useState(false);
  const [isLoadingMedicalRecord, setIsLoadingMedicalRecord] = useState(false);
  const [isSavingMedicalRecord, setIsSavingMedicalRecord] = useState(false);
  const [updatingAppointmentIds, setUpdatingAppointmentIds] = useState<
    string[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<AppointmentStatusFilter>("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customDate, setCustomDate] = useState("");
  const [reminderSentIds, setReminderSentIds] = useState<string[]>([]);
  const [rescheduleTarget, setRescheduleTarget] =
    useState<AppointmentItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [appointmentSlots, setAppointmentSlots] = useState<AppointmentSlot[]>(
    [],
  );
  const [isLoadingRescheduleSlots, setIsLoadingRescheduleSlots] =
    useState(false);

  useEffect(() => {
    const loadAppointments = async () => {
      setIsLoadingAppointments(true);
      setErrorMessage("");

      try {
        const response = await fetch("/api/doctor/appointments", {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 401) {
          handleDoctorSessionExpired(router);
          return;
        }

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load appointments");
        }

        const normalized = Array.isArray(payload?.appointments)
          ? payload.appointments.map((appointment: ApiAppointment) =>
              normalizeAppointment(appointment),
            )
          : [];

        setAppointments(normalized);
      } catch (error) {
        setAppointments([]);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load appointments",
        );
      } finally {
        setIsLoadingAppointments(false);
      }
    };

    void loadAppointments();
  }, [router]);

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const next7Days = new Date(today);
    next7Days.setDate(today.getDate() + 7);

    return appointments.filter((item) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        item.patientName.toLowerCase().includes(normalizedSearch) ||
        item.id.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;

      const appointmentDay = new Date(`${item.date}T00:00:00`);
      let matchesDate = true;

      if (dateFilter === "today") {
        matchesDate = appointmentDay.getTime() === today.getTime();
      }

      if (dateFilter === "next7") {
        matchesDate = appointmentDay >= today && appointmentDay <= next7Days;
      }

      if (dateFilter === "custom") {
        matchesDate = customDate ? item.date === customDate : true;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, searchTerm, statusFilter, dateFilter, customDate]);

  const requests = useMemo(
    () => filteredAppointments.filter((item) => item.category === "request"),
    [filteredAppointments],
  );
  const upcoming = useMemo(
    () => filteredAppointments.filter((item) => item.category === "upcoming"),
    [filteredAppointments],
  );
  const previous = useMemo(
    () => filteredAppointments.filter((item) => item.category === "previous"),
    [filteredAppointments],
  );

  const isReminderSuggested = (appointment: AppointmentItem): boolean => {
    const appointmentDateTime = parseAppointmentDateTime(
      appointment.date,
      appointment.time,
    );

    if (!appointmentDateTime) {
      return false;
    }

    const now = new Date();
    const diffMs = appointmentDateTime.getTime() - now.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    return diffMs > 0 && diffMs <= twentyFourHours;
  };

  const reminderQueueCount = upcoming.filter(
    (item) =>
      item.status === "Accepted" &&
      isReminderSuggested(item) &&
      !reminderSentIds.includes(item.id),
  ).length;

  const setStatus = async (
    appointmentId: string,
    action: "accept" | "reject" | "complete" | "cancel",
  ) => {
    setUpdatingAppointmentIds((prev) =>
      prev.includes(appointmentId) ? prev : [...prev, appointmentId],
    );

    try {
      const response = await fetch(
        `/api/doctor/appointments/${appointmentId}/action`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action }),
        },
      );

      if (response.status === 401) {
        handleDoctorSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            payload?.detail ||
            "Failed to update appointment status",
        );
      }

      const updatedAppointment = payload?.appointment
        ? normalizeAppointment(payload.appointment as ApiAppointment)
        : null;

      if (updatedAppointment) {
        setAppointments((prev) =>
          prev.map((item) =>
            item.id === appointmentId ? updatedAppointment : item,
          ),
        );
      }

      setToastMessage(payload?.message || "Appointment updated successfully.");
      window.setTimeout(() => setToastMessage(""), 2200);
    } catch (error) {
      setToastMessage(
        error instanceof Error
          ? error.message
          : "Failed to update appointment status.",
      );
      window.setTimeout(() => setToastMessage(""), 2200);
    } finally {
      setUpdatingAppointmentIds((prev) =>
        prev.filter((id) => id !== appointmentId),
      );
    }
  };

  // Confirmation dialog state and handlers for reject/cancel actions
  const [confirmTarget, setConfirmTarget] = useState<{
    appointment: AppointmentItem;
    action: "reject" | "cancel";
  } | null>(null);
  const [isConfirmProcessing, setIsConfirmProcessing] = useState(false);

  const openConfirm = (
    appointment: AppointmentItem,
    action: "reject" | "cancel",
  ) => {
    setConfirmTarget({ appointment, action });
  };

  const closeConfirm = () => {
    setConfirmTarget(null);
    setIsConfirmProcessing(false);
  };

  const handleConfirm = async () => {
    if (!confirmTarget) return;
    setIsConfirmProcessing(true);
    try {
      await setStatus(confirmTarget.appointment.id, confirmTarget.action);
    } catch (err) {
      // setStatus already sets toastMessage on error
    } finally {
      setIsConfirmProcessing(false);
      closeConfirm();
    }
  };

  const openPatientProfile = async (patientId: string) => {
    const relatedAppointment = appointments.find(
      (appointment) => appointment.patientId === patientId,
    );

    if (!relatedAppointment) {
      setSelectedPatient(null);
      return;
    }

    const fallbackProfile: PatientProfile = {
      patientId,
      fullName: relatedAppointment.patientName?.trim() || "Not available",
      age: Number.isFinite(relatedAppointment.patientAge)
        ? relatedAppointment.patientAge
        : null,
      gender: relatedAppointment.patientGender || "Not available",
      bloodGroup: "Not available",
      phone: "Not available",
      emergencyContact: "Not available",
      allergies: ["Not available"],
      conditions: ["Not available"],
      currentMedications: ["Not available"],
      comments: "",
      prescriptions: "",
      lastVisit: "Not available",
      medicalRecords: [],
    };

    setSelectedPatient(fallbackProfile);
    setPatientNotesDraft({ comments: "", prescriptions: "" });
    setIsLoadingPatientProfile(true);

    try {
      const response = await fetch(
        `/api/doctor/patients/${patientId}/profile`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (response.status === 401) {
        handleDoctorSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        return;
      }

      const apiProfile = (payload?.patient ?? {}) as ApiPatientProfile;
      const profileFromApi: PatientProfile = {
        patientId: String(apiProfile.patientId ?? patientId),
        fullName: apiProfile.fullName?.trim() || "Not available",
        age:
          typeof apiProfile.age === "number" && Number.isFinite(apiProfile.age)
            ? apiProfile.age
            : null,
        gender: apiProfile.gender?.trim() || "Not available",
        bloodGroup: apiProfile.bloodGroup?.trim() || "Not available",
        phone: apiProfile.phone?.trim() || "Not available",
        emergencyContact:
          apiProfile.emergencyContact?.trim() || "Not available",
        allergies:
          Array.isArray(apiProfile.allergies) && apiProfile.allergies.length > 0
            ? apiProfile.allergies
            : ["Not available"],
        conditions:
          Array.isArray(apiProfile.conditions) &&
          apiProfile.conditions.length > 0
            ? apiProfile.conditions
            : ["Not available"],
        currentMedications:
          Array.isArray(apiProfile.currentMedications) &&
          apiProfile.currentMedications.length > 0
            ? apiProfile.currentMedications
            : ["Not available"],
        comments: apiProfile.comments?.trim() || "",
        prescriptions: apiProfile.prescriptions?.trim() || "",
        lastVisit: apiProfile.lastVisit?.trim() || "Not available",
        medicalRecords: Array.isArray(apiProfile.medicalRecords)
          ? apiProfile.medicalRecords
          : [],
      };

      setSelectedPatient(profileFromApi);
      setPatientNotesDraft({
        comments: profileFromApi.comments,
        prescriptions: profileFromApi.prescriptions,
      });
    } finally {
      setIsLoadingPatientProfile(false);
    }
  };

  const openMedicalRecord = async (appointment: AppointmentItem) => {
    setMedicalRecordTarget(appointment);
    setMedicalRecordDraft({
      observations: "",
      diagnosis: "",
      comments: "",
      prescriptions: "",
      recommendedTests: "",
      followUpDate: "",
      followUpNotes: "",
    });
    setIsLoadingMedicalRecord(true);

    try {
      const response = await fetch(
        `/api/doctor/appointments/${appointment.id}/medical-record`,
        {
          method: "GET",
          cache: "no-store",
        },
      );

      if (response.status === 401) {
        handleDoctorSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.detail || "Failed to load medical record",
        );
      }

      const record = payload?.medicalRecord as MedicalRecord | null;
      if (record) {
        setMedicalRecordDraft({
          observations: record.observations || "",
          diagnosis: record.diagnosis || "",
          comments: record.comments || "",
          prescriptions: record.prescriptions || "",
          recommendedTests: record.recommended_tests || "",
          followUpDate: record.followUpDate || "",
          followUpNotes: record.follow_up_notes || "",
        });
      }
    } catch (error) {
      setToastMessage(
        error instanceof Error
          ? error.message
          : "Failed to load medical record.",
      );
      window.setTimeout(() => setToastMessage(""), 2200);
    } finally {
      setIsLoadingMedicalRecord(false);
    }
  };

  const closeMedicalRecord = () => {
    setMedicalRecordTarget(null);
    setMedicalRecordDraft({
      observations: "",
      diagnosis: "",
      comments: "",
      prescriptions: "",
      recommendedTests: "",
      followUpDate: "",
      followUpNotes: "",
    });
    setIsLoadingMedicalRecord(false);
    setIsSavingMedicalRecord(false);
  };

  const saveMedicalRecord = async () => {
    if (!medicalRecordTarget) {
      return;
    }

    setIsSavingMedicalRecord(true);

    try {
      const response = await fetch(
        `/api/doctor/appointments/${medicalRecordTarget.id}/medical-record`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            observations: medicalRecordDraft.observations,
            diagnosis: medicalRecordDraft.diagnosis,
            comments: medicalRecordDraft.comments,
            prescriptions: medicalRecordDraft.prescriptions,
            recommendedTests: medicalRecordDraft.recommendedTests,
            followUpDate: medicalRecordDraft.followUpDate || undefined,
            followUpNotes: medicalRecordDraft.followUpNotes,
          }),
        },
      );

      if (response.status === 401) {
        handleDoctorSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.detail || "Failed to save medical record",
        );
      }

      setToastMessage(payload?.message || "Medical record saved successfully.");
      window.setTimeout(() => setToastMessage(""), 2200);
      closeMedicalRecord();

      if (
        selectedPatient &&
        selectedPatient.patientId === medicalRecordTarget.patientId
      ) {
        void openPatientProfile(medicalRecordTarget.patientId);
      }
    } catch (error) {
      setToastMessage(
        error instanceof Error
          ? error.message
          : "Failed to save medical record.",
      );
      window.setTimeout(() => setToastMessage(""), 2200);
    } finally {
      setIsSavingMedicalRecord(false);
    }
  };

  const savePatientNotes = async () => {
    if (!selectedPatient) {
      return;
    }

    setIsSavingPatientNotes(true);

    try {
      const response = await fetch(
        `/api/doctor/patients/${selectedPatient.patientId}/profile`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            comments: patientNotesDraft.comments,
            prescriptions: patientNotesDraft.prescriptions,
          }),
        },
      );

      if (response.status === 401) {
        handleDoctorSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.error || payload?.detail || "Failed to update patient notes",
        );
      }

      const apiProfile = (payload?.patient ?? {}) as ApiPatientProfile;
      const updatedNotes = {
        comments: apiProfile.comments?.trim() || "",
        prescriptions: apiProfile.prescriptions?.trim() || "",
      };

      setSelectedPatient((prev) =>
        prev
          ? {
              ...prev,
              ...updatedNotes,
            }
          : prev,
      );
      setPatientNotesDraft(updatedNotes);
      setToastMessage("Patient notes updated successfully.");
      window.setTimeout(() => setToastMessage(""), 2200);
    } catch (error) {
      setToastMessage(
        error instanceof Error
          ? error.message
          : "Failed to update patient notes.",
      );
      window.setTimeout(() => setToastMessage(""), 2200);
    } finally {
      setIsSavingPatientNotes(false);
    }
  };

  const isUpdatingAppointment = (appointmentId: string) =>
    updatingAppointmentIds.includes(appointmentId);

  const showSectionLoading = isLoadingAppointments && appointments.length === 0;

  const renderNoDataMessage = (emptyMessage: string) => {
    if (showSectionLoading) {
      return <p className="text-sm text-slate-600">Loading appointments...</p>;
    }

    return <p className="text-sm text-slate-600">{emptyMessage}</p>;
  };

  const openRescheduleModal = (appointment: AppointmentItem) => {
    setRescheduleTarget(appointment);
    setRescheduleDate(appointment.date);
    setRescheduleTime("");

    void (async () => {
      setIsLoadingRescheduleSlots(true);
      try {
        const response = await fetch("/api/doctor/appointment-slots", {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 401) {
          handleDoctorSessionExpired(router);
          return;
        }

        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load appointment slots");
        }

        setAppointmentSlots(Array.isArray(payload?.slots) ? payload.slots : []);
      } catch (error) {
        setAppointmentSlots([]);
        setToastMessage(
          error instanceof Error
            ? error.message
            : "Failed to load appointment slots.",
        );
        window.setTimeout(() => setToastMessage(""), 2200);
      } finally {
        setIsLoadingRescheduleSlots(false);
      }
    })();
  };

  const availableSlotsForReschedule = useMemo(
    () =>
      appointmentSlots
        .filter((slot) => slot.date === rescheduleDate)
        .sort((a, b) => a.start_time.localeCompare(b.start_time)),
    [appointmentSlots, rescheduleDate],
  );

  const confirmReschedule = async () => {
    if (!rescheduleTarget) {
      return;
    }

    if (!rescheduleDate || !rescheduleTime) {
      setToastMessage("Please select both new date and a published slot.");
      window.setTimeout(() => setToastMessage(""), 2200);
      return;
    }

    setIsRescheduling(true);

    try {
      const response = await fetch(
        `/api/doctor/appointments/${rescheduleTarget.id}/reschedule`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: rescheduleDate,
            start_time: rescheduleTime,
          }),
        },
      );

      if (response.status === 401) {
        handleDoctorSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          payload?.error ||
            payload?.detail ||
            "Failed to reschedule appointment",
        );
      }

      const updatedAppointment = payload?.appointment
        ? normalizeAppointment(payload.appointment as ApiAppointment)
        : null;

      if (updatedAppointment) {
        setAppointments((prev) =>
          prev.map((item) =>
            item.id === rescheduleTarget.id ? updatedAppointment : item,
          ),
        );
      }

      setToastMessage(
        payload?.message ||
          `Appointment ${rescheduleTarget.id} was rescheduled.`,
      );
      setRescheduleTarget(null);
      setRescheduleDate("");
      setRescheduleTime("");
      window.setTimeout(() => setToastMessage(""), 2200);
    } catch (error) {
      setToastMessage(
        error instanceof Error
          ? error.message
          : "Failed to reschedule appointment.",
      );
      window.setTimeout(() => setToastMessage(""), 2200);
    } finally {
      setIsRescheduling(false);
    }
  };

  const sendReminder = (appointmentId: string) => {
    setReminderSentIds((prev) =>
      prev.includes(appointmentId) ? prev : [...prev, appointmentId],
    );
    setToastMessage("Reminder sent to patient.");
    window.setTimeout(() => setToastMessage(""), 2200);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_28%),linear-gradient(180deg,#eefbf6_0%,#f8fcfb_42%,#ffffff_100%)] pb-8">
      <div
        className="absolute inset-0 bg-[url('/images/doctor-login-bg.png')] bg-cover bg-center bg-no-repeat opacity-[0.08]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-white/88 via-white/80 to-white/95"
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-100/55 to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="absolute right-0 top-36 h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto mt-6 mb-8 max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2.5rem] border border-emerald-100/70 bg-white/85 shadow-[0_24px_80px_rgba(16,185,129,0.12)] backdrop-blur">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative p-6 sm:p-8 lg:p-10">
              <div
                className="absolute right-0 top-0 h-44 w-44 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-100/60 blur-3xl"
                aria-hidden="true"
              />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  APPOINTMENTS
                </div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  Appointments Management
                </h1>
                <div className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  <p>
                    Review patient requests, manage upcoming visits and track
                    previous appointments in one place.
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold">Prescriptions:</span>{" "}
                    {selectedPatient?.prescriptions || "Not available"}
                  </p>
                </div>
                <p className="mt-2 text-sm text-slate-500">
                  Advice chats are managed separately from this page in the
                  Chats section.
                </p>
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 space-y-4">
                  <h4 className="font-semibold text-emerald-800">
                    Doctor Update
                  </h4>
                  <div>
                    <label className="block text-sm font-semibold text-emerald-900">
                      Comments
                    </label>
                    <textarea
                      value={patientNotesDraft.comments}
                      onChange={(event) =>
                        setPatientNotesDraft((prev) => ({
                          ...prev,
                          comments: event.target.value,
                        }))
                      }
                      rows={4}
                      className="mt-2 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="Add doctor comments or observations here"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-emerald-900">
                      Prescriptions
                    </label>
                    <textarea
                      value={patientNotesDraft.prescriptions}
                      onChange={(event) =>
                        setPatientNotesDraft((prev) => ({
                          ...prev,
                          prescriptions: event.target.value,
                        }))
                      }
                      rows={4}
                      className="mt-2 w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-100"
                      placeholder="List prescribed medicines, dosage, and instructions"
                    />
                  </div>
                  <GreenButton
                    className="px-4 py-2"
                    disabled={isSavingPatientNotes || isLoadingPatientProfile}
                    onClick={() => void savePatientNotes()}
                  >
                    {isSavingPatientNotes ? "Saving..." : "Save Updates"}
                  </GreenButton>
                  <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    {toastMessage}
                  </p>
                </div>

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/doctor-self/appointment-slots">
                    <WhiteButton className="rounded-full px-5 py-3">
                      Manage Slots
                    </WhiteButton>
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative min-h-[280px] bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 p-5 sm:p-6">
              <div
                className="absolute inset-0 bg-[url('/images/doctor-registration-bg.jpg')] bg-cover bg-center bg-no-repeat opacity-25"
                aria-hidden="true"
              />
              <div
                className="absolute inset-0 bg-gradient-to-br from-slate-950/20 via-transparent to-slate-950/30"
                aria-hidden="true"
              />
              <div className="relative flex h-full flex-col justify-between rounded-[2rem] border border-white/15 bg-white/10 p-5 text-white backdrop-blur-sm sm:p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">
                    Live Summary
                  </p>
                  <p className="mt-3 text-2xl font-bold sm:text-3xl">
                    Clear actions for each appointment state.
                  </p>
                  <p className="mt-3 text-sm leading-6 text-white/85">
                    Accept quickly, reschedule with published slots, and close
                    visits without losing context.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-3xl border border-white/20 bg-white/12 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
                      Reminder Queue
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      {reminderQueueCount}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-white/20 bg-white/12 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
                      Visible Results
                    </p>
                    <p className="mt-2 text-2xl font-bold">
                      {isLoadingAppointments
                        ? "..."
                        : filteredAppointments.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
          <h2 className="text-xl font-bold text-emerald-700">
            Find And Filter
          </h2>
          <div className="my-4 flex w-full border-t border-emerald-100"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="flex flex-col gap-2">
              <label
                htmlFor="appointment-search"
                className="text-sm font-semibold text-slate-700"
              >
                Search Patient Or ID
              </label>
              <input
                id="appointment-search"
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Ex: Nimali or REQ-901"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="status-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as AppointmentStatusFilter)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                {statusFilters.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="date-filter"
                className="text-sm font-semibold text-slate-700"
              >
                Date Range
              </label>
              <select
                id="date-filter"
                value={dateFilter}
                onChange={(event) =>
                  setDateFilter(event.target.value as DateFilter)
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="next7">Next 7 Days</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label
                htmlFor="custom-date"
                className="text-sm font-semibold text-slate-700"
              >
                Custom Date
              </label>
              <input
                id="custom-date"
                type="date"
                value={customDate}
                disabled={dateFilter !== "custom"}
                onChange={(event) => setCustomDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 disabled:opacity-50"
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
            <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500" />
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Appointment Requests
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {isLoadingAppointments ? "..." : requests.length}
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
            <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Upcoming Appointments
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {isLoadingAppointments ? "..." : upcoming.length}
            </p>
          </div>
          <div className="rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
            <div className="h-1.5 w-14 rounded-full bg-gradient-to-r from-sky-500 to-cyan-500" />
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Previous Appointments
            </p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {isLoadingAppointments ? "..." : previous.length}
            </p>
          </div>
        </div>

        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-emerald-700">
              Appointment Requests
            </h2>
            <span className="text-sm text-slate-500">
              New requests waiting for your response
            </span>
          </div>
          <div className="my-4 flex w-full border-t border-emerald-100"></div>

          {requests.length === 0 ? (
            renderNoDataMessage("No pending requests right now.")
          ) : (
            <div className="space-y-3">
              {requests.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-white to-emerald-50/60 p-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {appointment.patientName}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {appointment.reason}
                      </p>
                    </div>
                    <span className="w-max rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                      Pending
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {appointment.date} •{" "}
                    {formatTimeForDisplay(appointment.time)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {appointment.location}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Requested: {appointment.requestedAt}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <GreenButton
                      className="px-4 py-2"
                      disabled={isUpdatingAppointment(appointment.id)}
                      onClick={() => void setStatus(appointment.id, "accept")}
                    >
                      Accept
                    </GreenButton>
                    <WhiteButton
                      className="px-4 py-2"
                      disabled={isUpdatingAppointment(appointment.id)}
                      onClick={() => void setStatus(appointment.id, "reject")}
                    >
                      Reject
                    </WhiteButton>
                    <WhiteButton
                      className="px-4 py-2"
                      onClick={() =>
                        void openPatientProfile(appointment.patientId)
                      }
                    >
                      View Patient Profile
                    </WhiteButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-emerald-700">
              Upcoming Appointments
            </h2>
            <span className="text-sm text-slate-500">
              {reminderQueueCount} reminder{reminderQueueCount === 1 ? "" : "s"}{" "}
              due in next 24 hours
            </span>
          </div>
          <div className="my-4 flex w-full border-t border-emerald-100"></div>

          {upcoming.length === 0 ? (
            renderNoDataMessage("No upcoming appointments scheduled.")
          ) : (
            <div className="space-y-3">
              {upcoming.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-white to-emerald-50/60 p-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {appointment.patientName}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {appointment.reason}
                      </p>
                    </div>
                    <span
                      className={`w-max rounded-full px-3 py-1 text-xs font-semibold ${
                        appointment.status === "Accepted"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {appointment.date} •{" "}
                    {formatTimeForDisplay(appointment.time)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {appointment.location}
                  </p>

                  {appointment.status === "Accepted" &&
                    isReminderSuggested(appointment) &&
                    !reminderSentIds.includes(appointment.id) && (
                      <p className="mt-2 text-xs font-semibold text-amber-700">
                        Reminder recommended: this appointment is within the
                        next 24 hours.
                      </p>
                    )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    {appointment.status === "Pending" && (
                      <>
                        <GreenButton
                          className="px-4 py-2"
                          disabled={isUpdatingAppointment(appointment.id)}
                          onClick={() =>
                            void setStatus(appointment.id, "accept")
                          }
                        >
                          Accept
                        </GreenButton>
                        <WhiteButton
                          className="px-4 py-2"
                          disabled={isUpdatingAppointment(appointment.id)}
                          onClick={() => openConfirm(appointment, "reject")}
                        >
                          Reject
                        </WhiteButton>
                      </>
                    )}
                    {appointment.status === "Accepted" && (
                      <>
                        <GreenButton
                          className="px-4 py-2"
                          disabled={isUpdatingAppointment(appointment.id)}
                          onClick={() =>
                            void setStatus(appointment.id, "complete")
                          }
                        >
                          Mark Completed
                        </GreenButton>
                        <WhiteButton
                          className="px-4 py-2"
                          disabled={isUpdatingAppointment(appointment.id)}
                          onClick={() => openConfirm(appointment, "cancel")}
                        >
                          Cancel Appointment
                        </WhiteButton>
                      </>
                    )}
                    <WhiteButton
                      className="px-4 py-2"
                      onClick={() => openRescheduleModal(appointment)}
                    >
                      Reschedule
                    </WhiteButton>
                    {appointment.status === "Accepted" && (
                      <WhiteButton
                        className="px-4 py-2"
                        disabled={reminderSentIds.includes(appointment.id)}
                        onClick={() => sendReminder(appointment.id)}
                      >
                        {reminderSentIds.includes(appointment.id)
                          ? "Reminder Sent"
                          : "Send Reminder"}
                      </WhiteButton>
                    )}
                    {(appointment.status === "Accepted" ||
                      appointment.status === "Completed") && (
                      <WhiteButton
                        className="px-4 py-2"
                        onClick={() => void openMedicalRecord(appointment)}
                      >
                        Medical Record
                      </WhiteButton>
                    )}
                    <WhiteButton
                      className="px-4 py-2"
                      onClick={() =>
                        void openPatientProfile(appointment.patientId)
                      }
                    >
                      View Patient Profile
                    </WhiteButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-emerald-700">
              Previous Appointments
            </h2>
            <span className="text-sm text-slate-500">
              Completed or closed records
            </span>
          </div>
          <div className="my-4 flex w-full border-t border-emerald-100"></div>

          {previous.length === 0 ? (
            renderNoDataMessage("No appointment history yet.")
          ) : (
            <div className="space-y-3">
              {previous.map((appointment) => (
                <div
                  key={appointment.id}
                  className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-white to-sky-50/60 p-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">
                        {appointment.patientName}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        {appointment.reason}
                      </p>
                    </div>
                    <span
                      className={`w-max rounded-full px-3 py-1 text-xs font-semibold ${
                        appointment.status === "Completed"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-500">
                    {appointment.date} •{" "}
                    {formatTimeForDisplay(appointment.time)}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {appointment.location}
                  </p>
                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      <WhiteButton
                        className="px-4 py-2"
                        onClick={() => void openMedicalRecord(appointment)}
                      >
                        Medical Record
                      </WhiteButton>
                      <WhiteButton
                        className="px-4 py-2"
                        onClick={() =>
                          void openPatientProfile(appointment.patientId)
                        }
                      >
                        View Patient Profile
                      </WhiteButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedPatient && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/45"
          role="dialog"
          aria-modal="true"
        >
          <div className="h-full w-full overflow-y-auto bg-white p-6 shadow-2xl sm:max-w-lg">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold text-slate-900">
                Patient Profile
              </h3>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="text-slate-500 hover:text-slate-800"
                aria-label="Close profile panel"
              >
                x
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm text-slate-700">
              {isLoadingPatientProfile && (
                <p className="text-sm text-slate-500">
                  Loading latest patient details...
                </p>
              )}
              <div className="rounded-2xl border border-slate-200 p-4">
                <p className="font-semibold text-slate-900">
                  {selectedPatient.fullName}
                </p>
                <p className="mt-1">Patient ID: {selectedPatient.patientId}</p>
                <p>
                  Age: {selectedPatient.age ?? "Not available"} • Gender:{" "}
                  {selectedPatient.gender || "Not available"}
                </p>
                <p>Blood Group: {selectedPatient.bloodGroup}</p>
                <p>Phone: {selectedPatient.phone}</p>
                <p>Emergency Contact: {selectedPatient.emergencyContact}</p>
                <p>Last Visit: {selectedPatient.lastVisit}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 p-4">
                <h4 className="font-semibold text-slate-900">Clinical Notes</h4>
                <p className="mt-2">
                  <span className="font-semibold">Allergies:</span>{" "}
                  {selectedPatient.allergies.join(", ")}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">Known Conditions:</span>{" "}
                  {selectedPatient.conditions.join(", ")}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">Current Medications:</span>{" "}
                  {selectedPatient.currentMedications.join(", ")}
                </p>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <h4 className="font-semibold text-amber-800">
                  Medical Records
                </h4>
                {selectedPatient.medicalRecords.length === 0 ? (
                  <p className="mt-2 text-amber-700">
                    No medical records have been saved yet for this patient.
                  </p>
                ) : (
                  <div className="mt-3 space-y-3">
                    {selectedPatient.medicalRecords.map((record) => (
                      <div
                        key={record.id}
                        className="rounded-xl border border-amber-200 bg-white p-3 text-sm text-slate-700"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-semibold text-slate-900">
                            {record.visit_date}
                          </p>
                          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700">
                            {record.doctorName}
                          </p>
                        </div>
                        <p className="mt-1 text-slate-600">
                          {record.hospitalName}
                        </p>
                        {record.observations && (
                          <p className="mt-2">
                            <span className="font-semibold text-slate-900">
                              Observations:
                            </span>{" "}
                            {record.observations}
                          </p>
                        )}
                        {record.diagnosis && (
                          <p className="mt-1">
                            <span className="font-semibold text-slate-900">
                              Diagnosis:
                            </span>{" "}
                            {record.diagnosis}
                          </p>
                        )}
                        {record.prescriptions && (
                          <p className="mt-1">
                            <span className="font-semibold text-slate-900">
                              Prescriptions:
                            </span>{" "}
                            {record.prescriptions}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {medicalRecordTarget && (
        <div
          className="fixed inset-0 z-[55] flex items-center justify-center bg-slate-900/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-3xl rounded-[2rem] border border-white/80 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Medical Record
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  {medicalRecordTarget.patientName} • {medicalRecordTarget.date}{" "}
                  • {medicalRecordTarget.location}
                </p>
              </div>
              <button
                type="button"
                onClick={closeMedicalRecord}
                className="text-slate-500 hover:text-slate-800"
                aria-label="Close medical record dialog"
              >
                x
              </button>
            </div>

            {isLoadingMedicalRecord ? (
              <p className="mt-5 text-sm text-slate-500">
                Loading existing record...
              </p>
            ) : (
              <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">
                        Observations
                      </label>
                      <textarea
                        value={medicalRecordDraft.observations}
                        onChange={(event) =>
                          setMedicalRecordDraft((prev) => ({
                            ...prev,
                            observations: event.target.value,
                          }))
                        }
                        rows={4}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-100"
                        placeholder="Observed symptoms, exam findings, and other notes"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">
                        Diagnosis / Assessment
                      </label>
                      <textarea
                        value={medicalRecordDraft.diagnosis}
                        onChange={(event) =>
                          setMedicalRecordDraft((prev) => ({
                            ...prev,
                            diagnosis: event.target.value,
                          }))
                        }
                        rows={4}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-100"
                        placeholder="Working diagnosis, clinical assessment, or plan"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">
                        Comments
                      </label>
                      <textarea
                        value={medicalRecordDraft.comments}
                        onChange={(event) =>
                          setMedicalRecordDraft((prev) => ({
                            ...prev,
                            comments: event.target.value,
                          }))
                        }
                        rows={4}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-100"
                        placeholder="Doctor comments, warnings, or clinical remarks"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">
                        Prescriptions
                      </label>
                      <textarea
                        value={medicalRecordDraft.prescriptions}
                        onChange={(event) =>
                          setMedicalRecordDraft((prev) => ({
                            ...prev,
                            prescriptions: event.target.value,
                          }))
                        }
                        rows={4}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-100"
                        placeholder="Medicines, dosage, and usage instructions"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">
                        Recommended Tests
                      </label>
                      <textarea
                        value={medicalRecordDraft.recommendedTests}
                        onChange={(event) =>
                          setMedicalRecordDraft((prev) => ({
                            ...prev,
                            recommendedTests: event.target.value,
                          }))
                        }
                        rows={3}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-100"
                        placeholder="Lab work, scans, or referrals"
                      />
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700">
                          Follow-up Date
                        </label>
                        <input
                          type="date"
                          value={medicalRecordDraft.followUpDate}
                          onChange={(event) =>
                            setMedicalRecordDraft((prev) => ({
                              ...prev,
                              followUpDate: event.target.value,
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-100"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700">
                          Follow-up Notes
                        </label>
                        <textarea
                          value={medicalRecordDraft.followUpNotes}
                          onChange={(event) =>
                            setMedicalRecordDraft((prev) => ({
                              ...prev,
                              followUpNotes: event.target.value,
                            }))
                          }
                          rows={3}
                          className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-100"
                          placeholder="Review instructions, red flags, or next steps"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <aside className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                      Context
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">
                      {medicalRecordTarget.patientName}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {medicalRecordTarget.date} • {medicalRecordTarget.time}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {medicalRecordTarget.location}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Reason: {medicalRecordTarget.reason}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-100 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">
                      What to capture
                    </p>
                    <ul className="mt-2 space-y-2 text-sm text-slate-600">
                      <li>Observed symptoms and examination notes</li>
                      <li>Assessment or diagnosis</li>
                      <li>Prescribed medicines and usage instructions</li>
                      <li>Recommended tests or referrals</li>
                      <li>Follow-up date and next-step guidance</li>
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <WhiteButton
                      className="px-4 py-2"
                      onClick={() =>
                        void openPatientProfile(medicalRecordTarget.patientId)
                      }
                    >
                      View Patient Profile
                    </WhiteButton>
                  </div>
                </aside>
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-2">
              <WhiteButton
                disabled={isSavingMedicalRecord}
                onClick={closeMedicalRecord}
              >
                Cancel
              </WhiteButton>
              <GreenButton
                disabled={isSavingMedicalRecord}
                onClick={() => void saveMedicalRecord()}
              >
                {isSavingMedicalRecord ? "Saving..." : "Save Medical Record"}
              </GreenButton>
            </div>
          </div>
        </div>
      )}

      {rescheduleTarget && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/55 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-slate-900">
                Reschedule Appointment
              </h3>
              <button
                type="button"
                onClick={() => {
                  setRescheduleTarget(null);
                  setRescheduleDate("");
                  setRescheduleTime("");
                }}
                className="text-slate-500 hover:text-slate-800"
                aria-label="Close reschedule dialog"
              >
                x
              </button>
            </div>

            <p className="mt-2 text-sm text-slate-600">
              {rescheduleTarget.patientName} ({rescheduleTarget.id})
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-2">
                <label
                  htmlFor="reschedule-date"
                  className="text-sm font-semibold text-slate-700"
                >
                  New Date
                </label>
                <input
                  id="reschedule-date"
                  type="date"
                  value={rescheduleDate}
                  onChange={(event) => {
                    setRescheduleDate(event.target.value);
                    setRescheduleTime("");
                  }}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  htmlFor="reschedule-time"
                  className="text-sm font-semibold text-slate-700"
                >
                  New Time Slot
                </label>
                <select
                  id="reschedule-time"
                  value={rescheduleTime}
                  disabled={
                    isLoadingRescheduleSlots ||
                    availableSlotsForReschedule.length === 0
                  }
                  onChange={(event) => setRescheduleTime(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                >
                  <option value="">Select a slot</option>
                  {availableSlotsForReschedule.map((slot) => (
                    <option key={slot.id} value={slot.start_time}>
                      {`${formatTimeForDisplay(slot.start_time)} - ${formatTimeForDisplay(slot.end_time)}`}
                    </option>
                  ))}
                </select>
                {isLoadingRescheduleSlots && (
                  <p className="text-xs text-slate-500">
                    Loading available slots...
                  </p>
                )}
                {!isLoadingRescheduleSlots &&
                  availableSlotsForReschedule.length === 0 && (
                    <p className="text-xs text-amber-700">
                      No published slot is available for the selected date.
                    </p>
                  )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-5 justify-end">
              <WhiteButton
                disabled={isRescheduling}
                onClick={() => {
                  setRescheduleTarget(null);
                  setRescheduleDate("");
                  setRescheduleTime("");
                }}
              >
                Cancel
              </WhiteButton>
              <GreenButton
                disabled={isRescheduling}
                onClick={() => void confirmReschedule()}
              >
                {isRescheduling ? "Saving..." : "Confirm Reschedule"}
              </GreenButton>
            </div>
          </div>
        </div>
      )}

      {confirmTarget && (
        <ConfirmationDialog
          isOpen={true}
          title={
            confirmTarget.action === "reject"
              ? "Reject Appointment"
              : "Cancel Appointment"
          }
          message={`Are you sure you want to ${confirmTarget.action === "reject" ? "reject" : "cancel"} the appointment for ${confirmTarget.appointment.patientName}?`}
          confirmText={confirmTarget.action === "reject" ? "Reject" : "Cancel"}
          onCancel={closeConfirm}
          onConfirm={handleConfirm}
          isLoading={isConfirmProcessing}
        />
      )}
    </div>
  );
}

export default DoctorAppointmentsPage;
