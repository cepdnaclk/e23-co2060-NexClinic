"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GreenButton from "@/components/buttons/GreenButton";
import WhiteButton from "@/components/buttons/WhiteButton";
import { handleDoctorSessionExpired } from "@/lib/doctorSession";

type AppointmentStatus = "Pending" | "Accepted" | "Rejected" | "Completed" | "Cancelled";
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
  lastVisit: string;
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
  lastVisit?: string;
};

const statusFilters: AppointmentStatusFilter[] = ["All", "Pending", "Accepted", "Rejected", "Completed", "Cancelled"];
const appointmentStatuses: AppointmentStatus[] = ["Pending", "Accepted", "Rejected", "Completed", "Cancelled"];
const appointmentCategories: AppointmentCategory[] = ["request", "upcoming", "previous"];

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

  const dateTime = new Date(`${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`);
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
  const safeStatus = appointmentStatuses.includes(item.status) ? item.status : "Pending";
  const safeCategory = appointmentCategories.includes(item.category) ? item.category : "request";

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
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingAppointments, setIsLoadingAppointments] = useState(true);
  const [isLoadingPatientProfile, setIsLoadingPatientProfile] = useState(false);
  const [updatingAppointmentIds, setUpdatingAppointmentIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatusFilter>("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customDate, setCustomDate] = useState("");
  const [reminderSentIds, setReminderSentIds] = useState<string[]>([]);
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [appointmentSlots, setAppointmentSlots] = useState<AppointmentSlot[]>([]);
  const [isLoadingRescheduleSlots, setIsLoadingRescheduleSlots] = useState(false);

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
          ? payload.appointments.map((appointment: ApiAppointment) => normalizeAppointment(appointment))
          : [];

        setAppointments(normalized);
      } catch (error) {
        setAppointments([]);
        setErrorMessage(error instanceof Error ? error.message : "Failed to load appointments");
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

      const matchesStatus = statusFilter === "All" || item.status === statusFilter;

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

  const requests = useMemo(() => filteredAppointments.filter((item) => item.category === "request"), [filteredAppointments]);
  const upcoming = useMemo(() => filteredAppointments.filter((item) => item.category === "upcoming"), [filteredAppointments]);
  const previous = useMemo(() => filteredAppointments.filter((item) => item.category === "previous"), [filteredAppointments]);

  const isReminderSuggested = (appointment: AppointmentItem): boolean => {
    const appointmentDateTime = parseAppointmentDateTime(appointment.date, appointment.time);

    if (!appointmentDateTime) {
      return false;
    }

    const now = new Date();
    const diffMs = appointmentDateTime.getTime() - now.getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    return diffMs > 0 && diffMs <= twentyFourHours;
  };

  const reminderQueueCount = upcoming.filter(
    (item) => item.status === "Accepted" && isReminderSuggested(item) && !reminderSentIds.includes(item.id)
  ).length;

  const setStatus = async (appointmentId: string, action: "accept" | "reject" | "complete" | "cancel") => {
    setUpdatingAppointmentIds((prev) => (prev.includes(appointmentId) ? prev : [...prev, appointmentId]));

    try {
      const response = await fetch(`/api/doctor/appointments/${appointmentId}/action`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      if (response.status === 401) {
        handleDoctorSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || payload?.detail || "Failed to update appointment status");
      }

      const updatedAppointment = payload?.appointment ? normalizeAppointment(payload.appointment as ApiAppointment) : null;

      if (updatedAppointment) {
        setAppointments((prev) =>
          prev.map((item) => (item.id === appointmentId ? updatedAppointment : item))
        );
      }

      setToastMessage(payload?.message || "Appointment updated successfully.");
      window.setTimeout(() => setToastMessage(""), 2200);
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Failed to update appointment status.");
      window.setTimeout(() => setToastMessage(""), 2200);
    } finally {
      setUpdatingAppointmentIds((prev) => prev.filter((id) => id !== appointmentId));
    }
  };

  const openPatientProfile = async (patientId: string) => {
    const relatedAppointment = appointments.find((appointment) => appointment.patientId === patientId);

    if (!relatedAppointment) {
      setSelectedPatient(null);
      return;
    }

    const fallbackProfile: PatientProfile = {
      patientId,
      fullName: relatedAppointment.patientName?.trim() || "Not available",
      age: Number.isFinite(relatedAppointment.patientAge) ? relatedAppointment.patientAge : null,
      gender: relatedAppointment.patientGender || "Not available",
      bloodGroup: "Not available",
      phone: "Not available",
      emergencyContact: "Not available",
      allergies: ["Not available"],
      conditions: ["Not available"],
      currentMedications: ["Not available"],
      lastVisit: "Not available",
    };

    setSelectedPatient(fallbackProfile);
    setIsLoadingPatientProfile(true);

    try {
      const response = await fetch(`/api/doctor/patients/${patientId}/profile`, {
        method: "GET",
        cache: "no-store",
      });

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
        age: typeof apiProfile.age === "number" && Number.isFinite(apiProfile.age) ? apiProfile.age : null,
        gender: apiProfile.gender?.trim() || "Not available",
        bloodGroup: apiProfile.bloodGroup?.trim() || "Not available",
        phone: apiProfile.phone?.trim() || "Not available",
        emergencyContact: apiProfile.emergencyContact?.trim() || "Not available",
        allergies: Array.isArray(apiProfile.allergies) && apiProfile.allergies.length > 0 ? apiProfile.allergies : ["Not available"],
        conditions: Array.isArray(apiProfile.conditions) && apiProfile.conditions.length > 0 ? apiProfile.conditions : ["Not available"],
        currentMedications: Array.isArray(apiProfile.currentMedications) && apiProfile.currentMedications.length > 0 ? apiProfile.currentMedications : ["Not available"],
        lastVisit: apiProfile.lastVisit?.trim() || "Not available",
      };

      setSelectedPatient(profileFromApi);
    } finally {
      setIsLoadingPatientProfile(false);
    }
  };

  const isUpdatingAppointment = (appointmentId: string) => updatingAppointmentIds.includes(appointmentId);

  const showSectionLoading = isLoadingAppointments && appointments.length === 0;

  const renderNoDataMessage = (emptyMessage: string) => {
    if (showSectionLoading) {
      return <p className="text-gray-600 dark:text-gray-400">Loading appointments...</p>;
    }

    return <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>;
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
        setToastMessage(error instanceof Error ? error.message : "Failed to load appointment slots.");
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
    [appointmentSlots, rescheduleDate]
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
      const response = await fetch(`/api/doctor/appointments/${rescheduleTarget.id}/reschedule`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: rescheduleDate,
          start_time: rescheduleTime,
        }),
      });

      if (response.status === 401) {
        handleDoctorSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || payload?.detail || "Failed to reschedule appointment");
      }

      const updatedAppointment = payload?.appointment ? normalizeAppointment(payload.appointment as ApiAppointment) : null;

      if (updatedAppointment) {
        setAppointments((prev) =>
          prev.map((item) => (item.id === rescheduleTarget.id ? updatedAppointment : item))
        );
      }

      setToastMessage(payload?.message || `Appointment ${rescheduleTarget.id} was rescheduled.`);
      setRescheduleTarget(null);
      setRescheduleDate("");
      setRescheduleTime("");
      window.setTimeout(() => setToastMessage(""), 2200);
    } catch (error) {
      setToastMessage(error instanceof Error ? error.message : "Failed to reschedule appointment.");
      window.setTimeout(() => setToastMessage(""), 2200);
    } finally {
      setIsRescheduling(false);
    }
  };

  const sendReminder = (appointmentId: string) => {
    setReminderSentIds((prev) => (prev.includes(appointmentId) ? prev : [...prev, appointmentId]));
    setToastMessage("Reminder sent to patient.");
    window.setTimeout(() => setToastMessage(""), 2200);
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="mx-4 mt-6 mb-8 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Appointments Management</h1>
            <Link href="/doctor-self/appointment-slots">
              <WhiteButton className="px-4 py-2">Manage Slots</WhiteButton>
            </Link>
          </div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Review patient requests, manage upcoming visits, and track previous appointments in one place.
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Advice chats are managed separately from this page in the Chats section.
          </p>
          {errorMessage && (
            <p className="mt-2 text-sm text-red-500">{errorMessage}</p>
          )}
          {toastMessage && (
            <p className="mt-3 text-sm text-green-600 dark:text-green-400 font-semibold">{toastMessage}</p>
          )}
        </div>

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-green-500 dark:text-green-400">Find And Filter</h2>
          <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="appointment-search" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Search Patient Or ID
              </label>
              <input
                id="appointment-search"
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Ex: Nimali or REQ-901"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="status-filter" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Status
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as AppointmentStatusFilter)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-white"
              >
                {statusFilters.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="date-filter" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Date Range
              </label>
              <select
                id="date-filter"
                value={dateFilter}
                onChange={(event) => setDateFilter(event.target.value as DateFilter)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-white"
              >
                <option value="all">All Dates</option>
                <option value="today">Today</option>
                <option value="next7">Next 7 Days</option>
                <option value="custom">Custom Date</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="custom-date" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Custom Date
              </label>
              <input
                id="custom-date"
                type="date"
                value={customDate}
                disabled={dateFilter !== "custom"}
                onChange={(event) => setCustomDate(event.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Appointment Requests</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{isLoadingAppointments ? "..." : requests.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Appointments</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{isLoadingAppointments ? "..." : upcoming.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Previous Appointments</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{isLoadingAppointments ? "..." : previous.length}</p>
          </div>
        </div>

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-green-500 dark:text-green-400">Appointment Requests</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">New requests waiting for your response</span>
          </div>
          <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>

          {requests.length === 0 ? (
            renderNoDataMessage("No pending requests right now.")
          ) : (
            <div className="space-y-3">
              {requests.map((appointment) => (
                <div key={appointment.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{appointment.patientName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {appointment.reason}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full w-max bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300">
                      Pending
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {appointment.date} • {formatTimeForDisplay(appointment.time)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{appointment.location}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Requested: {appointment.requestedAt}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <GreenButton className="px-4 py-2" disabled={isUpdatingAppointment(appointment.id)} onClick={() => void setStatus(appointment.id, "accept")}>Accept</GreenButton>
                    <WhiteButton className="px-4 py-2" disabled={isUpdatingAppointment(appointment.id)} onClick={() => void setStatus(appointment.id, "reject")}>Reject</WhiteButton>
                    <WhiteButton className="px-4 py-2" onClick={() => void openPatientProfile(appointment.patientId)}>
                      View Patient Profile
                    </WhiteButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-green-500 dark:text-green-400">Upcoming Appointments</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {reminderQueueCount} reminder{reminderQueueCount === 1 ? "" : "s"} due in next 24 hours
            </span>
          </div>
          <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>

          {upcoming.length === 0 ? (
            renderNoDataMessage("No upcoming appointments scheduled.")
          ) : (
            <div className="space-y-3">
              {upcoming.map((appointment) => (
                <div key={appointment.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{appointment.patientName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{appointment.reason}</p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full w-max ${
                        appointment.status === "Accepted"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {appointment.date} • {formatTimeForDisplay(appointment.time)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{appointment.location}</p>

                  {appointment.status === "Accepted" && isReminderSuggested(appointment) && !reminderSentIds.includes(appointment.id) && (
                    <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-2 font-semibold">
                      Reminder recommended: this appointment is within the next 24 hours.
                    </p>
                  )}

                  <div className="flex flex-wrap gap-2 mt-4">
                    {appointment.status === "Pending" && (
                      <>
                        <GreenButton className="px-4 py-2" disabled={isUpdatingAppointment(appointment.id)} onClick={() => void setStatus(appointment.id, "accept")}>Accept</GreenButton>
                        <WhiteButton className="px-4 py-2" disabled={isUpdatingAppointment(appointment.id)} onClick={() => void setStatus(appointment.id, "reject")}>Reject</WhiteButton>
                      </>
                    )}
                    {appointment.status === "Accepted" && (
                      <>
                        <GreenButton className="px-4 py-2" disabled={isUpdatingAppointment(appointment.id)} onClick={() => void setStatus(appointment.id, "complete")}>Mark Completed</GreenButton>
                        <WhiteButton className="px-4 py-2" disabled={isUpdatingAppointment(appointment.id)} onClick={() => void setStatus(appointment.id, "cancel")}>Cancel Appointment</WhiteButton>
                      </>
                    )}
                    <WhiteButton className="px-4 py-2" onClick={() => openRescheduleModal(appointment)}>
                      Reschedule
                    </WhiteButton>
                    {appointment.status === "Accepted" && (
                      <WhiteButton
                        className="px-4 py-2"
                        disabled={reminderSentIds.includes(appointment.id)}
                        onClick={() => sendReminder(appointment.id)}
                      >
                        {reminderSentIds.includes(appointment.id) ? "Reminder Sent" : "Send Reminder"}
                      </WhiteButton>
                    )}
                    <WhiteButton className="px-4 py-2" onClick={() => void openPatientProfile(appointment.patientId)}>
                      View Patient Profile
                    </WhiteButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-green-500 dark:text-green-400">Previous Appointments</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">Completed or closed records</span>
          </div>
          <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>

          {previous.length === 0 ? (
            renderNoDataMessage("No appointment history yet.")
          ) : (
            <div className="space-y-3">
              {previous.map((appointment) => (
                <div key={appointment.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{appointment.patientName}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{appointment.reason}</p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1 rounded-full w-max ${
                        appointment.status === "Completed"
                          ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                          : "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200"
                      }`}
                    >
                      {appointment.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {appointment.date} • {formatTimeForDisplay(appointment.time)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{appointment.location}</p>
                  <div className="mt-3">
                    <WhiteButton className="px-4 py-2" onClick={() => void openPatientProfile(appointment.patientId)}>
                      View Patient Profile
                    </WhiteButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {selectedPatient && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" role="dialog" aria-modal="true">
          <div className="w-full sm:max-w-lg h-full overflow-y-auto bg-white dark:bg-gray-800 shadow-2xl p-6">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Patient Profile</h3>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                aria-label="Close profile panel"
              >
                x
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm text-gray-700 dark:text-gray-300">
              {isLoadingPatientProfile && (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading latest patient details...</p>
              )}
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="font-semibold text-gray-900 dark:text-white">{selectedPatient.fullName}</p>
                <p className="mt-1">Patient ID: {selectedPatient.patientId}</p>
                <p>Age: {selectedPatient.age ?? "Not available"} • Gender: {selectedPatient.gender || "Not available"}</p>
                <p>Blood Group: {selectedPatient.bloodGroup}</p>
                <p>Phone: {selectedPatient.phone}</p>
                <p>Emergency Contact: {selectedPatient.emergencyContact}</p>
                <p>Last Visit: {selectedPatient.lastVisit}</p>
              </div>

              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="font-semibold text-gray-900 dark:text-white">Clinical Notes</h4>
                <p className="mt-2"><span className="font-semibold">Allergies:</span> {selectedPatient.allergies.join(", ")}</p>
                <p className="mt-1"><span className="font-semibold">Known Conditions:</span> {selectedPatient.conditions.join(", ")}</p>
                <p className="mt-1"><span className="font-semibold">Current Medications:</span> {selectedPatient.currentMedications.join(", ")}</p>
              </div>

              <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/30 p-4">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">Medical Records</h4>
                <p className="mt-2 text-yellow-700 dark:text-yellow-300">
                  Medical records module is not implemented yet. This section is ready to connect once backend records APIs are available.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {rescheduleTarget && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 shadow-2xl p-6">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Reschedule Appointment</h3>
              <button
                type="button"
                onClick={() => {
                  setRescheduleTarget(null);
                  setRescheduleDate("");
                  setRescheduleTime("");
                }}
                className="text-gray-500 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
                aria-label="Close reschedule dialog"
              >
                x
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              {rescheduleTarget.patientName} ({rescheduleTarget.id})
            </p>

            <div className="mt-4 space-y-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="reschedule-date" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
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
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="reschedule-time" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  New Time Slot
                </label>
                <select
                  id="reschedule-time"
                  value={rescheduleTime}
                  disabled={isLoadingRescheduleSlots || availableSlotsForReschedule.length === 0}
                  onChange={(event) => setRescheduleTime(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-white"
                >
                  <option value="">Select a slot</option>
                  {availableSlotsForReschedule.map((slot) => (
                    <option key={slot.id} value={slot.start_time}>
                      {`${formatTimeForDisplay(slot.start_time)} - ${formatTimeForDisplay(slot.end_time)}`}
                    </option>
                  ))}
                </select>
                {isLoadingRescheduleSlots && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Loading available slots...</p>
                )}
                {!isLoadingRescheduleSlots && availableSlotsForReschedule.length === 0 && (
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
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
              <GreenButton disabled={isRescheduling} onClick={() => void confirmReschedule()}>{isRescheduling ? "Saving..." : "Confirm Reschedule"}</GreenButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorAppointmentsPage;