"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { handlePatientSessionExpired } from "@/lib/patientSession";
import AppointmentModal from "@/components/modals/AppointmentModal";
import MockPaymentGateway from "@/components/payment/MockPaymentGateway";
import { AppointmentTabs, AppointmentCategory } from "@/components/appointments/AppointmentTabs";
import { Appointment } from "@/types/appointment";

type SortBy = "date" | "doctor" | "status" | "requestedAt";
type SortOrder = "asc" | "desc";
type ViewMode = "grid" | "list";

type ApiAppointment = Omit<Appointment, "id" | "slotId" | "doctorId"> & {
  id: string | number;
  slotId: string | number;
  doctorId: string | number;
};

const sortAppointments = (appointments: Appointment[], sortBy: string, sortOrder: SortOrder) => {
  const sorted = [...appointments].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
    } else if (sortBy === "doctor") {
      return a.doctorName.localeCompare(b.doctorName);
    } else if (sortBy === "status") {
      return a.status.localeCompare(b.status);
    } else if (sortBy === "requestedAt") {
      return new Date(a.requestedAt).getTime() - new Date(b.requestedAt).getTime();
    }
    return 0;
  });
  return sortOrder === "asc" ? sorted : sorted.reverse();
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
  if (status === "Confirmed" || status === "ACCEPTED") {
    return "bg-emerald-100 text-emerald-700 border border-emerald-200";
  }
  if (status === "Completed" || status === "COMPLETED") {
    return "bg-slate-100 text-slate-700 border border-slate-200";
  }
  if (status === "PENDING" || status === "Pending") {
    return "bg-amber-100 text-amber-800 border border-amber-200";
  }
  if (status === "Cancellation Requested" || status === "CANCELLATION_REQUESTED") {
    return "bg-orange-100 text-orange-800 border border-orange-200";
  }
  if (status === "EXPIRED" || status === "Expired") {
    return "bg-gray-100 text-gray-600 border border-gray-200";
  }
  return "bg-rose-100 text-rose-800 border border-rose-200";
};

const PatientAppointmentPage = () => {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [activeTab, setActiveTab] = useState<AppointmentCategory>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [cancellingIds, setCancellingIds] = useState<string[]>([]);
  const [selectedAppointment, setSelectedAppointment] =
    useState<Appointment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cancelDialog, setCancelDialog] = useState<{
    isOpen: boolean;
    appointmentId: string | null;
    reason: string;
  }>({
    isOpen: false,
    appointmentId: null,
    reason: "",
  });

  const [paymentGateway, setPaymentGateway] = useState<{
    isOpen: boolean;
    appointment: Appointment | null;
  }>({ isOpen: false, appointment: null });

  const openAppointmentModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const closeAppointmentModal = () => {
    setIsModalOpen(false);
    setSelectedAppointment(null);
  };

  const openCancelConfirmation = (appointmentId: string) => {
    setCancelDialog({ isOpen: true, appointmentId, reason: "" });
  };

  const closeCancelConfirmation = () => {
    setCancelDialog({ isOpen: false, appointmentId: null, reason: "" });
  };

  const handleConfirmCancellation = async () => {
    if (!cancelDialog.appointmentId) return;

    await cancelAppointment(cancelDialog.appointmentId, cancelDialog.reason);
    closeCancelConfirmation();
  };

  const handlePaymentSuccess = async () => {
    if (!paymentGateway.appointment) return;

    try {
      const response = await fetch(
        `/api/patient/appointments/${paymentGateway.appointment.id}/pay`,
        {
          method: "PATCH",
        },
      );

      if (response.status === 401 || response.status === 403) {
        handlePatientSessionExpired(router);
        return;
      }

      if (!response.ok) {
        throw new Error("Payment confirmation failed on server.");
      }

      setToast("Payment successful! Appointment is now confirmed.");
      window.setTimeout(() => setToast(""), 2200);

      // Update local state
      setAppointments((prev) =>
        prev.map((item) =>
          item.id === paymentGateway.appointment?.id
            ? { ...item, status: "Confirmed" }
            : item
        )
      );
    } catch (err) {
      setToast(
        err instanceof Error ? err.message : "Failed to confirm payment.",
      );
      window.setTimeout(() => setToast(""), 2200);
    } finally {
      setPaymentGateway({ isOpen: false, appointment: null });
    }
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

  const cancelAppointment = async (appointmentId: string, reason: string) => {
    setCancellingIds((prev) =>
      prev.includes(appointmentId) ? prev : [...prev, appointmentId],
    );

    try {
      const response = await fetch(
        `/api/patient/appointments/${appointmentId}/cancel`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ reason: reason }),
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

  // Bucketing logic based on strictly defined rules
  const categorized = useMemo(() => {
    const buckets: Record<AppointmentCategory, Appointment[]> = {
      ALL: [],
      UPCOMING: [],
      COMPLETED: [],
      CANCELLED: [],
      EXPIRED: [],
    };
    
    filteredAppointments.forEach(appt => {
      buckets.ALL.push(appt);
      
      const st = appt.status.toUpperCase();
      const isPast = new Date(`${appt.date}T${appt.time}`) < new Date();
      
      if (st === "COMPLETED") {
        buckets.COMPLETED.push(appt);
      } else if (st === "CANCELLED" || st === "REJECTED" || st === "CANCELLATION_REQUESTED") {
        buckets.CANCELLED.push(appt);
      } else if (st === "EXPIRED" || ((st === "PENDING" || st === "ACCEPTED" || st === "CONFIRMED") && isPast)) {
        buckets.EXPIRED.push(appt);
      } else if ((st === "PENDING" || st === "ACCEPTED" || st === "CONFIRMED") && !isPast) {
        buckets.UPCOMING.push(appt);
      }
    });
    
    return buckets;
  }, [filteredAppointments]);

  const counts = useMemo(() => {
    return {
      ALL: categorized.ALL.length,
      UPCOMING: categorized.UPCOMING.length,
      COMPLETED: categorized.COMPLETED.length,
      CANCELLED: categorized.CANCELLED.length,
      EXPIRED: categorized.EXPIRED.length,
    };
  }, [categorized]);

  const visibleItems = useMemo(() => {
    return sortAppointments(categorized[activeTab] || [], sortBy, sortOrder);
  }, [categorized, activeTab, sortBy, sortOrder]);

  const nextAppointment = useMemo(() => {
    const now = new Date().getTime();
    const upcomingAppts = appointments
      .filter((a) => a.category === "upcoming" && (a.status === "Confirmed" || a.status === "ACCEPTED" || a.status === "Pending" || a.status === "PENDING"))
      .map(a => ({ ...a, timestamp: new Date(`${a.date}T${a.time}`).getTime() }))
      .filter(a => a.timestamp > now)
      .sort((a, b) => a.timestamp - b.timestamp);
    
    return upcomingAppts.length > 0 ? upcomingAppts[0] : null;
  }, [appointments]);

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

                  {appt.cancellationReason && (
                    <div className="mt-3 rounded-xl bg-rose-50/70 p-3 border border-rose-100">
                      <div className="text-xs font-semibold text-rose-800">
                        Cancellation Reason {appt.cancelledBy ? `(${appt.cancelledBy === 'ADMIN' ? 'Hospital' : 'You'})` : ''}:
                      </div>
                      <div className="mt-1 text-xs text-rose-700">
                        {appt.cancellationReason}
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => openAppointmentModal(appt)}
                      className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      View
                    </button>
                    {(appt.status === "PENDING" || appt.status === "Pending") && (
                      <button
                        type="button"
                        className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                        onClick={() => setPaymentGateway({ isOpen: true, appointment: appt })}
                      >
                        Pay Now
                      </button>
                    )}
                    {canCancel || appt.status === "PENDING" || appt.status === "Pending" ? (
                      <button
                        type="button"
                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 disabled:cursor-not-allowed"
                        disabled={isCancelling || new Date(`${appt.date}T${appt.time}`) < new Date()}
                        onClick={() => openCancelConfirmation(appt.id)}
                        title={new Date(`${appt.date}T${appt.time}`) < new Date() ? "Cannot cancel an expired appointment" : ""}
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

  const renderLists = (items: Appointment[], emptyText: string) => {
    if (loading) {
      return (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((skeleton) => (
            <div key={skeleton} className="h-20 animate-pulse rounded-xl border border-emerald-100 bg-white/80" />
          ))}
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/80 p-10 text-center shadow-sm">
          <p className="text-base font-medium text-slate-700">{emptyText}</p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-emerald-50 text-emerald-800">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Doctor</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Hospital</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Date & Time</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold">Status</th>
                <th className="whitespace-nowrap px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-50">
              {items.map((appt) => {
                const canCancel = appt.status === "Confirmed";
                const isCancelling = cancellingIds.includes(appt.id);
                const isExpired = new Date(`${appt.date}T${appt.time}`) < new Date();

                return (
                  <tr key={appt.id} className="transition-colors hover:bg-emerald-50/50">
                    <td className="px-4 py-3 font-medium text-slate-900">{appt.doctorName}</td>
                    <td className="px-4 py-3">{appt.hospital}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-emerald-700">{appt.date}</span> at {formatTimeForDisplay(appt.time)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${statusPillClass(appt.status)}`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openAppointmentModal(appt)}
                          className="rounded border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          View
                        </button>
                        {(appt.status === "PENDING" || appt.status === "Pending") && (
                          <button
                            type="button"
                            className="rounded border border-blue-200 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                            onClick={() => setPaymentGateway({ isOpen: true, appointment: appt })}
                          >
                            Pay
                          </button>
                        )}
                        {(canCancel || appt.status === "PENDING" || appt.status === "Pending") && (
                          <button
                            type="button"
                            className="rounded border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-60 disabled:cursor-not-allowed"
                            disabled={isCancelling || isExpired}
                            onClick={() => openCancelConfirmation(appt.id)}
                            title={isExpired ? "Cannot cancel an expired appointment" : ""}
                          >
                            {isCancelling ? "..." : "Cancel"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
                <Link href="/doctors">
                  <button className="w-full rounded-xl bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 sm:w-auto">
                    + Book Appointment
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {nextAppointment && (
            <div className="mt-6">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-emerald-800">Next Upcoming Appointment</h3>
              </div>
              <div className="rounded-[2rem] bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white shadow-lg sm:p-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-5">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold backdrop-blur-md">
                      {nextAppointment.doctorName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-2xl font-bold">{nextAppointment.doctorName}</h4>
                      <p className="text-emerald-100">{nextAppointment.hospital}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 rounded-xl bg-white/10 p-4 backdrop-blur-sm md:text-right">
                    <span className="text-sm font-medium text-emerald-100">Date & Time</span>
                    <span className="text-xl font-bold">
                      {nextAppointment.date} at {formatTimeForDisplay(nextAppointment.time)}
                    </span>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => openAppointmentModal(nextAppointment)}
                    className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
                  >
                    View Details
                  </button>
                  {nextAppointment.status === "Confirmed" && new Date(`${nextAppointment.date}T${nextAppointment.time}`) >= new Date() && (
                    <button
                      onClick={() => openCancelConfirmation(nextAppointment.id)}
                      disabled={cancellingIds.includes(nextAppointment.id)}
                      className="rounded-xl border border-white/30 bg-transparent px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-50"
                    >
                      {cancellingIds.includes(nextAppointment.id) ? "Cancelling..." : "Cancel"}
                    </button>
                  )}
                  {(nextAppointment.status === "Pending" || nextAppointment.status === "PENDING") && (
                    <button
                      onClick={() => setPaymentGateway({ isOpen: true, appointment: nextAppointment })}
                      className="rounded-xl border border-white/30 bg-transparent px-5 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8">
            <AppointmentTabs 
              activeTab={activeTab} 
              onTabChange={setActiveTab} 
              counts={counts} 
            />
          </div>

          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="w-full sm:w-72 relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by doctor, hospital, reason"
                  className="w-full rounded-xl border border-emerald-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-700">Sort by</span>
                <select
                  className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                >
                  <option value="date">Appointment Date</option>
                  <option value="requestedAt">Placed Date</option>
                  <option value="doctor">Doctor</option>
                  <option value="status">Status</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-200 bg-white text-emerald-700 transition hover:bg-emerald-50"
                  title={sortOrder === "asc" ? "Ascending" : "Descending"}
                >
                  <svg className={`h-4 w-4 transform transition-transform ${sortOrder === "desc" ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4">
              <p className="text-sm text-slate-500">
                {visibleItems.length} result{visibleItems.length === 1 ? "" : "s"}
              </p>
              
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`rounded-md p-1.5 transition ${viewMode === "grid" ? "bg-emerald-100 text-emerald-700 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  title="Grid View"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`rounded-md p-1.5 transition ${viewMode === "list" ? "bg-emerald-100 text-emerald-700 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
                  title="List View"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
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
            {viewMode === "grid" ? (
              renderCards(
                visibleItems,
                sectionMeta.find((item) => item.key === activeSection)?.emptyText ||
                "No appointments found.",
              )
            ) : (
              renderLists(
                visibleItems,
                sectionMeta.find((item) => item.key === activeSection)?.emptyText ||
                "No appointments found.",
              )
            )}
          </div>
        </div>
      </div>

      <AppointmentModal
        appointment={selectedAppointment}
        isOpen={isModalOpen}
        onClose={closeAppointmentModal}
      />

      {cancelDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-black dark:text-gray-100">Cancel Appointment</h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  value={cancelDialog.reason}
                  onChange={(e) =>
                    setCancelDialog({ ...cancelDialog, reason: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                  rows={3}
                  placeholder="Tell us why you are cancelling..."
                />
              </div>
            </div>
            <div className="border-t border-gray-200 dark:border-gray-700 p-6 flex gap-3">
              <button
                onClick={closeCancelConfirmation}
                disabled={cancelDialog.appointmentId ? cancellingIds.includes(cancelDialog.appointmentId) : false}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-60"
              >
                Keep Appointment
              </button>
              <button
                onClick={handleConfirmCancellation}
                disabled={cancelDialog.appointmentId ? cancellingIds.includes(cancelDialog.appointmentId) : false}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-60"
              >
                {(cancelDialog.appointmentId && cancellingIds.includes(cancelDialog.appointmentId)) ? "Processing..." : "Cancel Appointment"}
              </button>
            </div>
          </div>
        </div>
      )}

      {paymentGateway.isOpen && paymentGateway.appointment && (
        <MockPaymentGateway
          amount={`$${paymentGateway.appointment.appointmentFee || 50}`}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setPaymentGateway({ isOpen: false, appointment: null })}
          isProcessing={false}
        />
      )}
    </div>
  );
};

export default PatientAppointmentPage;
