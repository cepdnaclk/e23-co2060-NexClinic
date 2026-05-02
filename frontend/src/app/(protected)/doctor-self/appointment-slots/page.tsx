"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GreenButton from "@/components/buttons/GreenButton";
import WhiteButton from "@/components/buttons/WhiteButton";
import { handleDoctorSessionExpired } from "@/lib/doctorSession";

type AppointmentSlot = {
  id: number;
  date: string;
  day_of_week: string;
  hospital: string;
  start_time: string;
  end_time: string;
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [date, setDate] = useState("");
  const [hospital, setHospital] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

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

  const handleCreateSlot = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!date || !hospital || !startTime || !endTime) {
      setError("Please fill date, hospital, start time, and end time.");
      return;
    }

    if (startTime >= endTime) {
      setError("Start time must be before end time.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/doctor/appointment-slots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slots: [
            {
              date,
              hospital,
              start_time: startTime,
              end_time: endTime,
            },
          ],
        }),
      });

      if (response.status === 401) {
        handleDoctorSessionExpired(router);
        return;
      }

      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        const firstConflict = Array.isArray(payload?.conflicts) ? payload.conflicts[0] : null;
        if (firstConflict?.error) {
          throw new Error(firstConflict.error);
        }

        throw new Error(payload?.error || payload?.detail || "Failed to create appointment slot");
      }

      setMessage(payload?.message || "Appointment slot created successfully.");
      setDate("");
      setHospital("");
      setStartTime("");
      setEndTime("");
      await loadSlots();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create appointment slot");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  Publish future in-person slot windows. Patients can book only from slots you create here.
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

        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-emerald-700">Create New Slot</h2>
              <p className="mt-1 text-sm text-slate-500">Define location and time range to publish one appointment window.</p>
            </div>
            <p className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
              Next slot: {isLoading ? "..." : nextSlotSummary}
            </p>
          </div>
          <div className="my-4 flex w-full border-t border-emerald-100"></div>

          <form onSubmit={handleCreateSlot} className="grid grid-cols-1 items-end gap-3 md:grid-cols-5">
            <div className="flex flex-col gap-2">
              <label htmlFor="slot-date" className="text-sm font-semibold text-slate-700">
                Date
              </label>
              <input
                id="slot-date"
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="slot-hospital" className="text-sm font-semibold text-slate-700">
                Hospital
              </label>
              <input
                id="slot-hospital"
                type="text"
                value={hospital}
                onChange={(event) => setHospital(event.target.value)}
                placeholder="e.g. NexClinic - Colombo"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="slot-start" className="text-sm font-semibold text-slate-700">
                Start Time
              </label>
              <input
                id="slot-start"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="slot-end" className="text-sm font-semibold text-slate-700">
                End Time
              </label>
              <input
                id="slot-end"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <GreenButton type="submit" disabled={isSubmitting} className="rounded-full px-5 py-3">
              {isSubmitting ? "Saving..." : "Publish Slot"}
            </GreenButton>
          </form>
        </section>

        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-xl font-bold text-emerald-700">Published Future Slots</h2>
            <span className="text-sm text-slate-500">Sorted by date and start time</span>
          </div>
          <div className="my-4 flex w-full border-t border-emerald-100"></div>

          {isLoading ? (
            <p className="text-sm text-slate-600">Loading slots...</p>
          ) : upcomingSlots.length === 0 ? (
            <p className="text-sm text-slate-600">No future slots published yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {upcomingSlots.map((slot) => (
                <div key={slot.id} className="rounded-[1.5rem] border border-slate-200 bg-gradient-to-br from-white to-emerald-50/60 p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">{slot.day_of_week || "DAY"}</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{slot.date}</p>
                  <p className="mt-2 text-sm font-medium text-slate-700">{slot.hospital || "NexClinic"}</p>
                  <p className="mt-2 text-sm text-slate-600">
                    {formatTimeForDisplay(slot.start_time)} - {formatTimeForDisplay(slot.end_time)}
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
