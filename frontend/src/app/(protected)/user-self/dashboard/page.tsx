"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { handlePatientSessionExpired } from "@/lib/patientSession";

type PatientProfilePayload = {
  patient?: {
    fullName?: string;
    email?: string;
    profileImage?: string;
  };
};

type DashboardAppointment = {
  id: string;
  doctorName: string;
  date: string;
  time: string;
  type: string;
  status: string;
  category: "request" | "upcoming" | "previous";
  requestedAt: string;
};

type AppointmentsPayload = {
  appointments?: DashboardAppointment[];
};

type StatCard = {
  label: string;
  value: string;
};

const getInitials = (name: string) => {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return initials || "U";
};

const statusTheme = (status: string) => {
  if (status === "Confirmed") {
    return "bg-green-100 text-green-800 border-green-200";
  }

  if (status === "Pending") {
    return "bg-amber-100 text-amber-800 border-amber-200";
  }

  if (status === "Completed") {
    return "bg-slate-100 text-slate-700 border-slate-200";
  }

  return "bg-rose-100 text-rose-800 border-rose-200";
};

export default function UserDashboard() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState<string | undefined>(
    undefined,
  );
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboardData = async (showLoading: boolean) => {
      if (showLoading) {
        setIsLoading(true);
      }

      try {
        const [profileResponse, appointmentsResponse] = await Promise.all([
          fetch("/api/patient/profile", { method: "GET", cache: "no-store" }),
          fetch("/api/patient/appointments", {
            method: "GET",
            cache: "no-store",
          }),
        ]);

        if (
          profileResponse.status === 401 ||
          profileResponse.status === 403 ||
          appointmentsResponse.status === 401 ||
          appointmentsResponse.status === 403
        ) {
          handlePatientSessionExpired(router);
          return;
        }

        const profilePayload = (await profileResponse
          .json()
          .catch(() => ({}))) as PatientProfilePayload;
        const appointmentsPayload = (await appointmentsResponse
          .json()
          .catch(() => ({}))) as AppointmentsPayload;

        if (!profileResponse.ok) {
          throw new Error("Failed to load patient profile");
        }

        if (!appointmentsResponse.ok) {
          throw new Error("Failed to load appointments");
        }

        const patient = profilePayload.patient || {};
        setFullName(patient.fullName || "");
        setEmail(patient.email || "");
        setProfileImage(patient.profileImage || undefined);

        const liveAppointments = Array.isArray(appointmentsPayload.appointments)
          ? appointmentsPayload.appointments
          : [];

        setAppointments(liveAppointments);
        setError("");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data",
        );
      } finally {
        if (showLoading) {
          setIsLoading(false);
        }
      }
    };

    void loadDashboardData(true);

    const intervalId = window.setInterval(() => {
      void loadDashboardData(false);
    }, 20000);

    const handleFocus = () => {
      void loadDashboardData(false);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void loadDashboardData(false);
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);

  const displayName = fullName || email.split("@")[0] || "User";

  const stats: StatCard[] = useMemo(() => {
    const upcomingCount = appointments.filter(
      (item) => item.category === "upcoming",
    ).length;
    const pendingCount = appointments.filter(
      (item) => item.category === "request",
    ).length;
    const completedCount = appointments.filter(
      (item) => item.status === "Completed",
    ).length;

    return [
      { label: "Upcoming Appointments", value: String(upcomingCount) },
      { label: "Pending Requests", value: String(pendingCount) },
      { label: "Completed Consultations", value: String(completedCount) },
    ];
  }, [appointments]);

  const sortedAppointments = useMemo(() => {
    return [...appointments]
      .sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
      )
      .map((item) => ({
        id: item.id,
        doctor: item.doctorName,
        status: item.status,
        statusClass: statusTheme(item.status),
        type: item.type || "Consultation",
        time: `${item.date} - ${item.time}`,
      }));
  }, [appointments]);

  const nextAppointment = sortedAppointments[0];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef8f4] via-[#f8fcfb] to-white">
      <div className="mx-auto w-full max-w-7xl space-y-5 px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8 sm:space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-green-100 bg-white/95 shadow-[0_20px_60px_rgba(16,185,129,0.14)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,173,133,0.16),transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(0,119,88,0.12),transparent_40%)]" />
          <div className="relative space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-stretch xl:justify-between">
              <div className="flex-1 rounded-[1.75rem] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5 lg:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  {profileImage ? (
                    <Image
                      src={profileImage}
                      alt={displayName}
                      width={92}
                      height={92}
                      className="mx-auto h-[92px] w-[92px] shrink-0 rounded-full border-4 border-green-500 object-cover sm:mx-0"
                    />
                  ) : (
                    <div className="mx-auto flex h-[92px] w-[92px] shrink-0 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-green-600 via-emerald-300 to-green-700 text-3xl font-bold text-white shadow-xl sm:mx-0">
                      {getInitials(displayName)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 text-center sm:text-left">
                    <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                      Welcome back, {displayName}
                    </h1>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                      {isLoading
                        ? "Loading your latest updates..."
                        : "Track consultations, requests, and care activity in one calm, easy-to-scan workspace."}
                    </p>
                    {error ? (
                      <p className="mt-3 text-sm font-semibold text-rose-600">
                        {error}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="w-full rounded-[1.75rem] border border-green-100 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 p-5 text-white shadow-2xl xl:max-w-md">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-100">
                      Next Appointment
                    </p>
                    <p className="mt-2 text-lg font-bold leading-tight">
                      {nextAppointment
                        ? nextAppointment.doctor
                        : "No upcoming appointments"}
                    </p>
                    <p className="mt-1 text-sm text-green-100">
                      {nextAppointment
                        ? nextAppointment.time
                        : "Book one to start your care timeline."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2 text-right">
                    <p className="text-xs text-green-100">Upcoming</p>
                    <p className="text-2xl font-bold">{stats[0].value}</p>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 xl:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur">
                    <p className="text-green-100">Pending</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {stats[1].value}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur">
                    <p className="text-green-100">Completed</p>
                    <p className="mt-1 text-lg font-bold text-white">
                      {stats[2].value}
                    </p>
                  </div>
                  <div className="hidden rounded-2xl bg-white/10 px-3 py-3 backdrop-blur sm:block xl:hidden">
                    <p className="text-green-100">Status</p>
                    <p className="mt-1 text-lg font-bold text-white">Active</p>
                  </div>
                </div>

                {/* <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-100">Care snapshot</p>
                                    <div className="mt-3 space-y-2 text-sm text-green-50">
                                        <div className="flex items-center justify-between gap-3">
                                            <span>Profile status</span>
                                            <span className="font-semibold text-white">Synced</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span>Dashboard refresh</span>
                                            <span className="font-semibold text-white">Automatic</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-3">
                                            <span>Patient access</span>
                                            <span className="font-semibold text-white">Protected</span>
                                        </div>
                                    </div>
                                </div> */}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Link
                href="/user-self/book-appointment"
                className="group rounded-2xl border border-green-100 bg-white/90 p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-200 hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
                    Quick Action
                  </p>
                  <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                    New
                  </span>
                </div>
                <p className="mt-3 text-lg font-bold text-slate-900">
                  Book Appointment
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Find a doctor and request your preferred slot.
                </p>
              </Link>
              <Link
                href="/user-self/chats"
                className="group rounded-2xl border border-green-100 bg-white/90 p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-200 hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
                    Quick Action
                  </p>
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                    Fast
                  </span>
                </div>
                <p className="mt-3 text-lg font-bold text-slate-900">
                  Ask a Doctor
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Reach out online for non-urgent guidance.
                </p>
              </Link>
              <Link
                href="/user-self/profile"
                className="group rounded-2xl border border-green-100 bg-white/90 p-4 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-green-200 hover:shadow-lg"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-green-700">
                    Quick Action
                  </p>
                  <span className="rounded-full bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                    Edit
                  </span>
                </div>
                <p className="mt-3 text-lg font-bold text-slate-900">
                  Edit Profile
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Update your personal details, photo, and contact information.
                </p>
              </Link>
            </div>

            <div className="rounded-[1.5rem] border border-green-100 bg-gradient-to-r from-green-50 via-white to-emerald-50 p-4 shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-bold text-green-800">
                  Health Tip of the Day
                </h2>
                <span className="w-max rounded-full border border-green-200 bg-white px-3 py-1 text-xs font-semibold text-green-700">
                  Simple habit, better recovery
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-700">
                Stay hydrated throughout the day. Consistent water intake
                supports better concentration, joint health, and energy.
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((item, index) => (
            <div
              key={item.label}
              className="group rounded-2xl border border-green-100 bg-white p-5 shadow-md shadow-green-100/30 transition duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-600">
                    {item.label}
                  </p>
                  <p className="mt-1 text-4xl font-bold tracking-tight text-slate-900">
                    {item.value}
                  </p>
                </div>
              </div>
              {/* <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                    className={`h-full rounded-full ${index === 0 ? "bg-green-500" : index === 1 ? "bg-emerald-500" : "bg-teal-500"}`}
                                    style={{ width: `${Math.max(35, (Number(item.value) + 1) * 24)}%` }}
                                />
                            </div> */}
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="h-full rounded-2xl border border-green-100 bg-white p-4 shadow-md shadow-green-100/30 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-slate-900">Recent Chats</h2>
              <Link
                href="/user-self/chats"
                className="rounded-lg bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-green-700"
              >
                View All Chats
              </Link>
            </div>

            <div className="mt-4 rounded-2xl border border-dashed border-green-200 bg-gradient-to-br from-green-50/70 to-white p-4">
              <p className="text-sm leading-6 text-slate-600">
                Online advice chat history will appear here once conversations
                are available.
              </p>
            </div>
          </div>

          <div className="h-full rounded-2xl border border-green-100 bg-white p-4 shadow-md shadow-green-100/30 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                Appointments Timeline
              </h2>
              <Link
                href="/user-self/appointments"
                className="rounded-lg bg-green-600 px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-green-700"
              >
                View All
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {sortedAppointments.length === 0 ? (
                <div className="rounded-xl border border-dashed border-green-200 bg-green-50/50 p-4">
                  <p className="text-sm text-slate-600">
                    No appointments yet. Start by booking your first
                    consultation.
                  </p>
                </div>
              ) : (
                sortedAppointments.slice(0, 5).map((appointment) => (
                  <div
                    key={
                      appointment.id ||
                      `${appointment.doctor}-${appointment.time}`
                    }
                    className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 transition hover:border-green-200 hover:bg-green-50/50"
                  >
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="break-words font-semibold text-slate-900">
                        {appointment.doctor}
                      </p>
                      <span
                        className={`w-max rounded-full border px-3 py-1 text-xs font-semibold ${appointment.statusClass}`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">
                      {appointment.type}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {appointment.time}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
