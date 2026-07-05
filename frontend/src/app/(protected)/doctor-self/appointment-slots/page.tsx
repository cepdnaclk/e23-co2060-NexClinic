"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import WhiteButton from "@/components/buttons/WhiteButton";
import { handleDoctorSessionExpired } from "@/lib/doctorSession";

type AppointmentSlot = {
  id: number;
  date: string;
  day_of_week: string;
  hospital: string;
  start_time: string;
  end_time: string;
  is_active?: boolean;
  patientLimit?: number;
  remainingCount?: number;
};

const formatTimeForDisplay = (time: string): string => {
  const twentyFourHourMatch = time.match(/^(\d{2}):(\d{2})(?::\d{2})?$/);
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

function DoctorAppointmentSlotsPage() {
  const router = useRouter();

  const [slots, setSlots] = useState<AppointmentSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filterType, setFilterType] = useState<"all" | "date" | "week" | "month">("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterWeekStart, setFilterWeekStart] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [timeBucket, setTimeBucket] = useState<"all" | "morning" | "afternoon" | "evening">("all");

  const loadSlots = async () => {
    setIsLoading(true);
    setError("");

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

      setSlots(Array.isArray(payload?.slots) ? payload.slots : []);
    } catch (err) {
      setSlots([]);
      setError(err instanceof Error ? err.message : "Failed to load appointment slots");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadSlots();
  }, []);

  const upcomingSlots = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [...slots]
      .filter((slot) => {
        const dateValue = new Date(`${slot.date}T00:00:00`);
        return !Number.isNaN(dateValue.getTime()) && dateValue >= today;
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) {
          return dateCompare;
        }

        return a.start_time.localeCompare(b.start_time);
      });
  }, [slots]);

  const uniqueHospitalsCount = useMemo(() => {
    const values = upcomingSlots
      .map((slot) => slot.hospital?.trim())
      .filter((value): value is string => Boolean(value));
    return new Set(values).size;
  }, [upcomingSlots]);

  const nextSlotSummary = useMemo(() => {
    if (upcomingSlots.length === 0) {
      return "No published slot yet";
    }

    const next = upcomingSlots[0];
    return `${next.date} • ${formatTimeForDisplay(next.start_time)}`;
  }, [upcomingSlots]);

  const filteredSlots = useMemo(() => {
    return upcomingSlots.filter((slot) => {
      const slotDate = slot.date;

      if (filterType === "date" && filterDate && slotDate !== filterDate) {
        return false;
      }

      if (filterType === "week" && filterWeekStart) {
        const start = new Date(`${filterWeekStart}T00:00:00`);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        const current = new Date(`${slotDate}T00:00:00`);
        if (current < start || current > end) {
          return false;
        }
      }

      if (filterType === "month" && filterMonth && !slotDate.startsWith(filterMonth)) {
        return false;
      }

      if (timeBucket !== "all") {
        const hour = Number(slot.start_time.slice(0, 2));
        if (timeBucket === "morning" && !(hour >= 6 && hour < 12)) {
          return false;
        }
        if (timeBucket === "afternoon" && !(hour >= 12 && hour < 17)) {
          return false;
        }
        if (timeBucket === "evening" && !(hour >= 17 || hour < 6)) {
          return false;
        }
      }

      return true;
    });
  }, [upcomingSlots, filterType, filterDate, filterWeekStart, filterMonth, timeBucket]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.14),_transparent_28%),linear-gradient(180deg,#eefbf6_0%,#f8fcfb_42%,#ffffff_100%)] pb-8">
      <div className="absolute inset-0 bg-[url('/images/doctor-registration-bg.jpg')] bg-cover bg-center bg-no-repeat opacity-[0.08]" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/88 via-white/80 to-white/95" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-100/55 to-transparent" aria-hidden="true" />
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" aria-hidden="true" />
      <div className="absolute right-0 top-36 h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto mt-6 mb-8 max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2.5rem] border border-emerald-100/70 bg-white/85 shadow-[0_24px_80px_rgba(16,185,129,0.12)] backdrop-blur">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="absolute right-0 top-0 h-44 w-44 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-100/60 blur-3xl" aria-hidden="true" />
              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  SLOT PLANNER
                </div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">In-Person Appointment Slots</h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  Publish future in-person slot windows. Patients can book only from slots are created here.
                </p>

                {error && <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p>}
                {message && <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</p>}

                <div className="mt-7 flex flex-wrap gap-3">
                  <Link href="/doctor-self/appointments">
                    <WhiteButton className="rounded-full px-5 py-3">Go To Appointments</WhiteButton>
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative min-h-[280px] bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 p-5 sm:p-6">
              <div className="absolute inset-0 bg-[url('/images/doctor-login-bg.png')] bg-cover bg-center bg-no-repeat opacity-25" aria-hidden="true" />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950/20 via-transparent to-slate-950/30" aria-hidden="true" />
              <div className="relative flex h-full flex-col justify-between rounded-[2rem] border border-white/15 bg-white/10 p-5 text-white backdrop-blur-sm sm:p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">Live Snapshot</p>
                  <p className="mt-3 text-2xl font-bold sm:text-3xl">Publish once, book smoothly all week.</p>
                  <p className="mt-3 text-sm leading-6 text-white/85">
                    Keep your availability clean and predictable with clearly defined in-person time blocks.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-3xl border border-white/20 bg-white/12 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Future Slots</p>
                    <p className="mt-2 text-2xl font-bold">{isLoading ? "..." : upcomingSlots.length}</p>
                  </div>
                  <div className="rounded-3xl border border-white/20 bg-white/12 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Hospitals</p>
                    <p className="mt-2 text-2xl font-bold">{isLoading ? "..." : uniqueHospitalsCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Slot creation removed per request - keeping published slots display only */}

        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-emerald-700">Published Future Slots</h2>
            <span className="text-sm text-slate-500">Sorted by date and start time</span>
          </div>

          <div className="grid gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Filter</label>
              <select
                value={filterType}
                onChange={(event) => setFilterType(event.target.value as "all" | "date" | "week" | "month")}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="all">All dates</option>
                <option value="date">Specific date</option>
                <option value="week">Week range</option>
                <option value="month">Month</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(event) => setFilterDate(event.target.value)}
                disabled={filterType !== "date"}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Week Start</label>
              <input
                type="date"
                value={filterWeekStart}
                onChange={(event) => setFilterWeekStart(event.target.value)}
                disabled={filterType !== "week"}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Month</label>
              <input
                type="month"
                value={filterMonth}
                onChange={(event) => setFilterMonth(event.target.value)}
                disabled={filterType !== "month"}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-100"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Time Bucket</label>
              <select
                value={timeBucket}
                onChange={(event) => setTimeBucket(event.target.value as "all" | "morning" | "afternoon" | "evening")}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <option value="all">All times</option>
                <option value="morning">Morning (06:00-11:59)</option>
                <option value="afternoon">Afternoon (12:00-16:59)</option>
                <option value="evening">Evening/Night (17:00-05:59)</option>
              </select>
            </div>
          </div>

          <div className="my-4 flex w-full border-t border-emerald-100"></div>

          {isLoading ? (
            <p className="text-sm text-slate-600">Loading slots...</p>
          ) : filteredSlots.length === 0 ? (
            <p className="text-sm text-slate-600">No future slots published yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {filteredSlots.map((slot) => (
                <div key={slot.id} className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-white to-emerald-50/60 p-4 shadow-sm">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{slot.day_of_week || "DAY"}</p>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${slot.is_active === false ? "bg-slate-100 text-slate-600" : "bg-emerald-100 text-emerald-700"}`}>
                      {slot.is_active === false ? "Disabled" : "Active"}
                    </span>
                  </div>
                  <p className="mt-2 text-lg font-bold text-slate-900">{slot.date}</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">{slot.hospital || "NexClinic"}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatTimeForDisplay(slot.start_time)} - {formatTimeForDisplay(slot.end_time)}
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Remaining: {slot.remainingCount ?? "-"} / Limit: {slot.patientLimit ?? "-"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default DoctorAppointmentSlotsPage;
