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

  const handleCreateSlot = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!date || !startTime || !endTime) {
      setError("Please fill date, start time, and end time.");
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
    <div className="bg-gray-100 dark:bg-gray-900 min-h-screen">
      <div className="mx-4 mt-6 mb-8 space-y-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 sm:p-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">In-Person Appointment Slots</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Publish future in-person appointment slots. Patients can book only from slots you create here.
          </p>
          {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
          {message && <p className="mt-3 text-sm text-green-600 dark:text-green-400 font-semibold">{message}</p>}
        </div>

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-green-500 dark:text-green-400">Create New Slot</h2>
          <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>

          <form onSubmit={handleCreateSlot} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="flex flex-col gap-2">
              <label htmlFor="slot-date" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Date
              </label>
              <input
                id="slot-date"
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(event) => setDate(event.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="slot-start" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Start Time
              </label>
              <input
                id="slot-start"
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="slot-end" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                End Time
              </label>
              <input
                id="slot-end"
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-800 dark:text-white"
              />
            </div>

            <GreenButton type="submit" disabled={isSubmitting} className="px-4 py-2">
              {isSubmitting ? "Saving..." : "Add Slot"}
            </GreenButton>
          </form>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl font-bold text-green-500 dark:text-green-400">Published Future Slots</h2>
            <Link href="/doctor-self/appointments">
              <WhiteButton className="px-4 py-2">Go To Appointments</WhiteButton>
            </Link>
          </div>
          <div className="flex w-full border-t border-gray-300 dark:border-gray-600 my-4"></div>

          {isLoading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading slots...</p>
          ) : upcomingSlots.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No future slots published yet.</p>
          ) : (
            <div className="space-y-3">
              {upcomingSlots.map((slot) => (
                <div key={slot.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/40 p-4">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {slot.date} ({slot.day_of_week || "-"})
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
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
