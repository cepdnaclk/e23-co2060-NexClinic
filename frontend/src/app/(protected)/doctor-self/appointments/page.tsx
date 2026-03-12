"use client";

import { useMemo, useState } from "react";
import DoctorNavBar from "@/components/doctor/DoctorNavBar";
import GreenButton from "@/components/buttons/GreenButton";
import WhiteButton from "@/components/buttons/WhiteButton";

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

type PatientProfile = {
  patientId: string;
  fullName: string;
  age: number;
  gender: string;
  bloodGroup: string;
  phone: string;
  emergencyContact: string;
  allergies: string[];
  conditions: string[];
  currentMedications: string[];
  lastVisit: string;
};

const statusFilters: AppointmentStatusFilter[] = ["All", "Pending", "Accepted", "Rejected", "Completed", "Cancelled"];

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

const initialAppointments: AppointmentItem[] = [
  {
    id: "REQ-901",
    patientId: "P-104",
    patientName: "Nimali Fernando",
    patientAge: 29,
    patientGender: "Female",
    reason: "Frequent migraine episodes",
    date: "2026-03-14",
    time: "10:30 AM",
    location: "NexClinic - Colombo",
    requestedAt: "1 hour ago",
    status: "Pending",
    category: "request",
  },
  {
    id: "REQ-902",
    patientId: "P-117",
    patientName: "Dinesh Perera",
    patientAge: 41,
    patientGender: "Male",
    reason: "Follow-up for hypertension",
    date: "2026-03-15",
    time: "3:00 PM",
    location: "NexClinic - Negombo",
    requestedAt: "4 hours ago",
    status: "Pending",
    category: "request",
  },
  {
    id: "UP-101",
    patientId: "P-121",
    patientName: "Sanduni Silva",
    patientAge: 35,
    patientGender: "Female",
    reason: "Thyroid medication review",
    date: "2026-03-13",
    time: "2:00 PM",
    location: "NexClinic - Kandy",
    requestedAt: "Yesterday",
    status: "Accepted",
    category: "upcoming",
  },
  {
    id: "UP-102",
    patientId: "P-131",
    patientName: "Lahiru Madushan",
    patientAge: 26,
    patientGender: "Male",
    reason: "Skin allergy consultation",
    date: "2026-03-13",
    time: "5:30 PM",
    location: "NexClinic - Galle",
    requestedAt: "Today",
    status: "Pending",
    category: "upcoming",
  },
  {
    id: "PV-511",
    patientId: "P-111",
    patientName: "Anusha Jayawardena",
    patientAge: 52,
    patientGender: "Female",
    reason: "Diabetes monthly review",
    date: "2026-03-09",
    time: "11:30 AM",
    location: "NexClinic - Colombo",
    requestedAt: "-",
    status: "Completed",
    category: "previous",
  },
  {
    id: "PV-512",
    patientId: "P-117",
    patientName: "Dinesh Perera",
    patientAge: 41,
    patientGender: "Male",
    reason: "Blood pressure concern",
    date: "2026-03-08",
    time: "9:15 AM",
    location: "NexClinic - Negombo",
    requestedAt: "-",
    status: "Cancelled",
    category: "previous",
  },
];

const patientProfiles: Record<string, PatientProfile> = {
  "P-104": {
    patientId: "P-104",
    fullName: "Nimali Fernando",
    age: 29,
    gender: "Female",
    bloodGroup: "A+",
    phone: "+94 77 123 9021",
    emergencyContact: "+94 71 345 9988",
    allergies: ["Dust", "Pollen"],
    conditions: ["Migraine"],
    currentMedications: ["Sumatriptan"],
    lastVisit: "2026-02-25",
  },
  "P-117": {
    patientId: "P-117",
    fullName: "Dinesh Perera",
    age: 41,
    gender: "Male",
    bloodGroup: "B+",
    phone: "+94 76 889 0021",
    emergencyContact: "+94 71 120 8890",
    allergies: ["None reported"],
    conditions: ["Hypertension"],
    currentMedications: ["Losartan"],
    lastVisit: "2026-03-08",
  },
  "P-121": {
    patientId: "P-121",
    fullName: "Sanduni Silva",
    age: 35,
    gender: "Female",
    bloodGroup: "O-",
    phone: "+94 78 555 1122",
    emergencyContact: "+94 70 111 3344",
    allergies: ["Seafood"],
    conditions: ["Hypothyroidism"],
    currentMedications: ["Levothyroxine"],
    lastVisit: "2026-03-01",
  },
  "P-131": {
    patientId: "P-131",
    fullName: "Lahiru Madushan",
    age: 26,
    gender: "Male",
    bloodGroup: "AB+",
    phone: "+94 75 442 1900",
    emergencyContact: "+94 71 904 2244",
    allergies: ["Peanuts"],
    conditions: ["Eczema"],
    currentMedications: ["Topical corticosteroid"],
    lastVisit: "2026-02-17",
  },
  "P-111": {
    patientId: "P-111",
    fullName: "Anusha Jayawardena",
    age: 52,
    gender: "Female",
    bloodGroup: "A-",
    phone: "+94 77 991 2211",
    emergencyContact: "+94 71 998 0055",
    allergies: ["Penicillin"],
    conditions: ["Type 2 Diabetes"],
    currentMedications: ["Metformin", "Insulin"],
    lastVisit: "2026-03-09",
  },
};

function DoctorAppointmentsPage() {
  const [appointments, setAppointments] = useState<AppointmentItem[]>(initialAppointments);
  const [selectedPatient, setSelectedPatient] = useState<PatientProfile | null>(null);
  const [toastMessage, setToastMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatusFilter>("All");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [customDate, setCustomDate] = useState("");
  const [reminderSentIds, setReminderSentIds] = useState<string[]>([]);
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");

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

  const setStatus = (appointmentId: string, action: "accept" | "reject") => {
    setAppointments((prev) =>
      prev.map((item) => {
        if (item.id !== appointmentId) {
          return item;
        }

        if (action === "accept") {
          return {
            ...item,
            status: "Accepted",
            category: item.category === "request" ? "upcoming" : item.category,
          };
        }

        return {
          ...item,
          status: item.category === "upcoming" ? "Cancelled" : "Rejected",
          category: "previous",
        };
      })
    );

    setToastMessage(action === "accept" ? "Appointment accepted successfully." : "Appointment rejected successfully.");
    window.setTimeout(() => setToastMessage(""), 2200);
  };

  const openPatientProfile = (patientId: string) => {
    const profile = patientProfiles[patientId] || null;
    setSelectedPatient(profile);
  };

  const openRescheduleModal = (appointment: AppointmentItem) => {
    setRescheduleTarget(appointment);
    setRescheduleDate(appointment.date);
    setRescheduleTime("");
  };

  const confirmReschedule = () => {
    if (!rescheduleTarget) {
      return;
    }

    if (!rescheduleDate || !rescheduleTime) {
      setToastMessage("Please select both new date and time.");
      window.setTimeout(() => setToastMessage(""), 2200);
      return;
    }

    setAppointments((prev) =>
      prev.map((item) => {
        if (item.id !== rescheduleTarget.id) {
          return item;
        }

        return {
          ...item,
          date: rescheduleDate,
          time: formatTimeForDisplay(rescheduleTime),
          status: item.status === "Cancelled" ? "Pending" : item.status,
          category: item.category === "previous" ? "upcoming" : item.category,
        };
      })
    );

    setToastMessage(`Appointment ${rescheduleTarget.id} was rescheduled.`);
    setRescheduleTarget(null);
    setRescheduleDate("");
    setRescheduleTime("");
    window.setTimeout(() => setToastMessage(""), 2200);
  };

  const sendReminder = (appointmentId: string) => {
    setReminderSentIds((prev) => (prev.includes(appointmentId) ? prev : [...prev, appointmentId]));
    setToastMessage("Reminder sent to patient.");
    window.setTimeout(() => setToastMessage(""), 2200);
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <DoctorNavBar />

      <div className="mx-4 mt-6 mb-8 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Appointments Management</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Review patient requests, manage upcoming visits, and track previous appointments in one place.
          </p>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Advice chats are managed separately from this page in the Chats section.
          </p>
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
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{requests.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Appointments</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{upcoming.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-5">
            <p className="text-sm text-gray-500 dark:text-gray-400">Previous Appointments</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{previous.length}</p>
          </div>
        </div>

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-xl font-bold text-green-500 dark:text-green-400">Appointment Requests</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">New requests waiting for your response</span>
          </div>
          <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>

          {requests.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No pending requests right now.</p>
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
                    {appointment.date} • {appointment.time}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{appointment.location}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Requested: {appointment.requestedAt}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-4">
                    <GreenButton className="px-4 py-2" onClick={() => setStatus(appointment.id, "accept")}>Accept</GreenButton>
                    <WhiteButton className="px-4 py-2" onClick={() => setStatus(appointment.id, "reject")}>Reject</WhiteButton>
                    <WhiteButton className="px-4 py-2" onClick={() => openPatientProfile(appointment.patientId)}>
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
            <p className="text-gray-600 dark:text-gray-400">No upcoming appointments scheduled.</p>
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
                        <GreenButton className="px-4 py-2" onClick={() => setStatus(appointment.id, "accept")}>Accept</GreenButton>
                        <WhiteButton className="px-4 py-2" onClick={() => setStatus(appointment.id, "reject")}>Reject</WhiteButton>
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
                    <WhiteButton className="px-4 py-2" onClick={() => openPatientProfile(appointment.patientId)}>
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
            <p className="text-gray-600 dark:text-gray-400">No appointment history yet.</p>
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
                    <WhiteButton className="px-4 py-2" onClick={() => openPatientProfile(appointment.patientId)}>
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
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <p className="font-semibold text-gray-900 dark:text-white">{selectedPatient.fullName}</p>
                <p className="mt-1">Patient ID: {selectedPatient.patientId}</p>
                <p>Age: {selectedPatient.age} • Gender: {selectedPatient.gender}</p>
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
                  onChange={(event) => setRescheduleDate(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="reschedule-time" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  New Time
                </label>
                <input
                  id="reschedule-time"
                  type="time"
                  value={rescheduleTime}
                  onChange={(event) => setRescheduleTime(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-5 justify-end">
              <WhiteButton
                onClick={() => {
                  setRescheduleTarget(null);
                  setRescheduleDate("");
                  setRescheduleTime("");
                }}
              >
                Cancel
              </WhiteButton>
              <GreenButton onClick={confirmReschedule}>Confirm Reschedule</GreenButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DoctorAppointmentsPage;