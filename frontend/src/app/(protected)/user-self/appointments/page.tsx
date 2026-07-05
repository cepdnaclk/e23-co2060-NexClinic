"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { handlePatientSessionExpired } from "@/lib/patientSession";
import AppointmentModal from "@/components/modals/AppointmentModal";
import ConfirmationDialog from "@/components/modals/ConfirmationDialog";
import { Appointment } from "@/types/appointment";

type SortBy = "date" | "doctor" | "status";
type SectionFilter = "all" | "upcoming" | "previous";

type ApiAppointment = Omit<Appointment, "id" | "slotId" | "doctorId"> & {
  id: string | number;
  slotId: string | number;
  doctorId: string | number;
};

const sortAppointments = (appointments: Appointment[], sortBy: string) => {
  if (sortBy === "date") {
    return [...appointments].sort(
      (a, b) =>
        new Date(`${a.date}T${a.time}`).getTime() -
        new Date(`${b.date}T${b.time}`).getTime(),
    );
  } else if (sortBy === "doctor") {
    return [...appointments].sort((a, b) =>
      a.doctorName.localeCompare(b.doctorName),
    );
  } else if (sortBy === "status") {
    return [...appointments].sort((a, b) => a.status.localeCompare(b.status));
  }
  return appointments;
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

const truncateText = (text: string, maxWords: number = 3): string => {
  const words = text.trim().split(/\s+/);
  if (words.length > maxWords) {
    return words.slice(0, maxWords).join(" ") + "...";
  }
  return text;
};

const normalizeAppointment = (appointment: ApiAppointment): Appointment => ({
  ...appointment,
  id: String(appointment.id),
  slotId: String(appointment.slotId),
  doctorId: String(appointment.doctorId),
});

const statusPillClass = (status: string) => {
  if (status === "Confirmed") {
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }
  if (status === "Completed") {
    return "bg-slate-100 text-slate-700 border border-slate-200";
  }
  return "bg-rose-100 text-rose-800 border border-rose-200";
};

const sectionMeta: {
  key: SectionFilter;
  label: string;
  emptyText: string;
}[] = [
  {
    key: "all",
    label: "All",
    emptyText: "No appointments found.",
  },
  {
    key: "upcoming",
    label: "Upcoming",
    emptyText: "No upcoming appointments.",
  },
  {
    key: "previous",
    label: "History",
    emptyText: "No appointment history yet.",
  },
];

const getSectionTitle = (section: SectionFilter) => {
  if (section === "upcoming") return "Upcoming Appointments";
  if (section === "previous") return "Appointment History";
  return "All Appointments";
};

const PatientAppointmentPage = () => {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [activeSection, setActiveSection] =
    useState<SectionFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [cancellingIds, setCancellingIds] = useState<string[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    appointmentId: string | null;
  }>({
    isOpen: false,
    appointmentId: null,
  });

  const openAppointmentModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const closeAppointmentModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  const openCancelConfirmation = (appointmentId: string) => {
    setConfirmationDialog({ isOpen: true, appointmentId });
  };

  const closeCancelConfirmation = () => {
    setConfirmationDialog({ isOpen: false, appointmentId: null });
  };

  const handleConfirmCancellation = async () => {
    if (!confirmationDialog.appointmentId) return;

    await cancelAppointment(confirmationDialog.appointmentId);
    closeCancelConfirmation();
  };

  useEffect(() => {
    const loadAppointments = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/patient/appointments", {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 401 || response.status === 403) {
          handlePatientSessionExpired(router);
          return;
        }

        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(payload?.error || "Failed to load appointments");
        }

        const normalized = Array.isArray(payload?.appointments)
          ? payload.appointments.map((item: ApiAppointment) =>
              normalizeAppointment(item),
            )
          : [];

        setAppointments(normalized);
      } catch (err) {
        setAppointments([]);
        setError(
          err instanceof Error ? err.message : "Failed to load appointments",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadAppointments();
  }, [router]);

  const loadAppointments = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/patient/appointments", {
        method: "GET",
        cache: "no-store",
      });

      if (response.status === 401 || response.status === 403) {
        handlePatientSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to load appointments");
      }

      const normalized = Array.isArray(payload?.appointments)
        ? payload.appointments.map((item: ApiAppointment) =>
            normalizeAppointment(item),
          )
        : [];

      setAppointments(normalized);
    } catch (err) {
      setAppointments([]);
      setError(err instanceof Error ? err.message : "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    setCancellingIds((prev) =>
      prev.includes(appointmentId) ? prev : [...prev, appointmentId],
    );

    try {
      const response = await fetch(
        `/api/patient/appointments/${appointmentId}/cancel`,
        {
          method: "PATCH",
        },
      );

      if (response.status === 401 || response.status === 403) {
        handlePatientSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload?.error || "Failed to cancel appointment");
      }

      const updated = payload?.appointment
        ? normalizeAppointment(payload.appointment as ApiAppointment)
        : null;
      if (updated) {
        setAppointments((prev) =>
          prev.map((item) => (item.id === appointmentId ? updated : item)),
        );
      }

      setToast(payload?.message || "Appointment cancelled successfully.");
      window.setTimeout(() => setToast(""), 2200);
    } catch (err) {
      setToast(
        err instanceof Error ? err.message : "Failed to cancel appointment.",
      );
      window.setTimeout(() => setToast(""), 2200);
    } finally {
      setCancellingIds((prev) => prev.filter((id) => id !== appointmentId));
    }
  };

  const filteredAppointments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return appointments;

    return appointments.filter((item) => {
      const haystack = `${item.doctorName} ${item.hospital} ${item.reason} ${item.status}`.toLowerCase();
      return haystack.includes(keyword);
    });
  }, [appointments, searchTerm]);

  const upcoming = useMemo(
    () =>
      sortAppointments(
        filteredAppointments.filter((item) => item.category === "upcoming"),
        sortBy,
      ),
    [filteredAppointments, sortBy],
  );
  const previous = useMemo(
    () =>
      sortAppointments(
        filteredAppointments.filter((item) => item.category === "previous"),
        sortBy,
      ),
    [filteredAppointments, sortBy],
  );

  const allSorted = useMemo(
    () => sortAppointments(filteredAppointments, sortBy),
    [filteredAppointments, sortBy],
  );

  const sectionCounts = useMemo(
    () => ({
      all: filteredAppointments.length,
      upcoming: upcoming.length,
      previous: previous.length,
    }),
    [filteredAppointments.length, upcoming.length, previous.length],
  );

  const visibleItems = useMemo(() => {
    if (activeSection === "upcoming") return upcoming;
    if (activeSection === "previous") return previous;
    return allSorted;
  }, [activeSection, upcoming, previous, allSorted]);

  const renderCards = (items: Appointment[], emptyText: string) => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3].map((skeleton) => (
            <div
              key={skeleton}
              className="h-44 animate-pulse rounded-2xl border border-emerald-100 bg-white/80 p-4"
            />
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/80 p-10 text-center shadow-sm">
          <p className="text-base font-medium text-slate-700">{emptyText}</p>
          <p className="mt-1 text-sm text-slate-500">
            Try changing filters or booking a new appointment.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {items.map((appt) => {
                  const canCancel = appt.status === "Confirmed";
          const isCancelling = cancellingIds.includes(appt.id);

          return (
            <div
              key={appt.id}
              className="group rounded-2xl border border-emerald-100 bg-white p-4 shadow-[0_12px_32px_rgba(15,118,110,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_44px_rgba(15,118,110,0.16)]"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-200 to-emerald-50 text-lg font-bold text-emerald-700">
                  {appt.doctorName.split(" ")[0][0] ?? "D"}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="truncate text-lg font-semibold text-slate-900">
                        {appt.doctorName}
                      </h4>
                      <p className="truncate text-sm text-slate-600">{appt.hospital}</p>
                    </div>

                    <div className="text-right">
                      <div
                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${statusPillClass(appt.status)}`}
                      >
                        {appt.status}
                      </div>
                      <div className="mt-2 text-xs text-slate-500">
                        Requested: {new Date(appt.requestedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-emerald-50/70 p-3">
                    <div className="text-sm font-medium text-slate-900">
                      {appt.date} at {formatTimeForDisplay(appt.time)}
                    </div>
                    {appt.reason && (
                      <div className="mt-1 text-xs text-slate-600">
                        {truncateText(appt.reason)}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openAppointmentModal(appt)}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      View
                    </button>
                    {canCancel ? (
                      <button
                        type="button"
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60"
                        disabled={isCancelling}
                        onClick={() => openCancelConfirmation(appt.id)}
                      >
                        {isCancelling ? "Cancelling..." : "Cancel"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">No actions</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-[#eef8f4] via-[#f8fcfb] to-white py-6 sm:py-8">
      <div aria-hidden className="absolute inset-0 -z-10">
        <img
          src="/images/hexagons.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-12 filter blur-sm"
        />
        <div className="absolute -left-40 -top-32 w-96 h-96 rounded-full bg-gradient-to-br from-emerald-200 to-transparent opacity-30 blur-2xl transform rotate-12" />
        <div className="absolute -right-40 -bottom-32 w-96 h-96 rounded-full bg-gradient-to-br from-emerald-100 to-transparent opacity-20 blur-2xl transform -rotate-12" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-50/30 mix-blend-overlay" />
      </div>
      <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 lg:px-6">
        <div
          className="w-full rounded-[2rem] border border-emerald-100/40 bg-white/95 p-4 shadow-[0_24px_64px_rgba(16,185,129,0.14)] backdrop-blur sm:p-6 lg:p-8"
        >
          <div className="rounded-3xl border border-white/80 bg-gradient-to-br from-white via-emerald-50/30 to-white p-4 shadow-sm sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">
                  Care Timeline
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                  My Appointments
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                  Easily track upcoming visits and completed consultations in one place.
                </p>
              </div>

              <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                <button
                  type="button"
                  onClick={() => void loadAppointments()}
                  className="rounded-xl border border-emerald-200 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                >
                  Refresh
                </button>
                <Link href="/user-self/book-appointment">
                  <button className="w-full rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto">
                    + Book Appointment
                  </button>
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {sectionMeta.map((section) => (
              <button
                key={section.key}
                type="button"
                onClick={() => setActiveSection(section.key)}
                className={`rounded-2xl border px-3 py-3 text-left transition ${
                  activeSection === section.key
                    ? "border-emerald-300 bg-emerald-50 shadow-sm"
                    : "border-emerald-100 bg-white hover:border-emerald-200"
                }`}
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {section.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-slate-900">
                  {sectionCounts[section.key]}
                </p>
              </button>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="w-full sm:w-72">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by doctor, hospital, reason"
                  className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Sort by</span>
                <select
                  className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                >
                  <option value="date">Date</option>
                  <option value="doctor">Doctor</option>
                  <option value="status">Status</option>
                </select>
              </div>
            </div>

            <p className="text-sm text-slate-500">
              Showing {visibleItems.length} appointment
              {visibleItems.length === 1 ? "" : "s"}
            </p>
          </div>

          {error && <div className="text-red-500 text-sm">{error}</div>}
          {toast && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
              {toast}
            </div>
          )}

          <div className="mt-5">
            <h3 className="mb-3 text-xl font-semibold text-slate-900">
              {getSectionTitle(activeSection)}
            </h3>
            {renderCards(
              visibleItems,
              sectionMeta.find((item) => item.key === activeSection)?.emptyText ||
                "No appointments found.",
            )}
          </div>
        </div>
      </div>

      <AppointmentModal
        appointment={selectedAppointment}
        isOpen={isModalOpen}
        onClose={closeAppointmentModal}
      />

      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmText="Cancel Appointment"
        cancelText="Keep Appointment"
        confirmButtonClass="bg-red-500 hover:bg-red-600"
        cancelButtonClass="bg-gray-300 hover:bg-gray-400"
        isLoading={
          confirmationDialog.appointmentId
            ? cancellingIds.includes(confirmationDialog.appointmentId)
            : false
        }
        onConfirm={handleConfirmCancellation}
        onCancel={closeCancelConfirmation}
      />
    </div>
  );
};

export default PatientAppointmentPage;
