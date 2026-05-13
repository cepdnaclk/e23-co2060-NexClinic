"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Slot = {
  id: number;
  doctorId: string;
  doctorName: string;
  hospital: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  bookedCount: number;
  patientLimit?: number;
};

function formatDateForDisplay(dateString: string) {
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
}

function formatTimeForDisplay(time: string) {
  const m = time.match(/^(\d{2}):(\d{2})$/);
  if (!m) return time;
  let h = Number(m[1]);
  const mm = m[2];
  const suffix = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  if (h > 12) h -= 12;
  return `${h}:${mm} ${suffix}`;
}

export default function DoctorSlots({ doctorId } : { doctorId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [slots, setSlots] = useState<Slot[]>([]);

  useEffect(() => {
    if (!doctorId) return;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const today = new Date();
        const start = today.toISOString().slice(0,10); // YYYY-MM-DD
        const future = new Date(today);
        future.setDate(future.getDate() + 13); // next 2 weeks (14 days inclusive)
        const end = future.toISOString().slice(0,10);

        const params = new URLSearchParams({ doctor_id: doctorId, start, end });
        const res = await fetch(`/api/patient/appointment-slots?${params.toString()}`, { method: 'GET', cache: 'no-store' });
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload?.error || 'Failed to load slots');

        const raw = Array.isArray(payload?.slots) ? payload.slots : [];
        const parsed: Slot[] = raw.map((s: any) => ({
          id: s.id,
          doctorId: s.doctorId || s.doctor_id || s.doctor,
          doctorName: s.doctorName || s.doctor_name || s.doctorName,
          hospital: s.hospital,
          date: s.date,
          time: s.time,
          bookedCount: s.bookedCount ?? s.booked_count ?? 0,
          patientLimit: s.patientLimit ?? s.patient_limit,
        }));

        setSlots(parsed);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load slots');
        setSlots([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [doctorId]);

  if (!doctorId) return null;

  const byHospital: Record<string, Slot[]> = {};
  slots.forEach(s => {
    if (!byHospital[s.hospital]) byHospital[s.hospital] = [];
    byHospital[s.hospital].push(s);
  });

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold mb-3">Next 2 weeks availability</h3>
      {loading ? (
        <div className="text-sm text-gray-600">Loading slots...</div>
      ) : error ? (
        <div className="text-sm text-rose-600">{error}</div>
      ) : slots.length === 0 ? (
        <div className="text-sm text-gray-600">No available in-person slots in the next 2 weeks.</div>
      ) : (
        <div className="grid gap-4">
          {Object.keys(byHospital).map(hospital => (
            <div key={hospital} className="bg-white p-4 rounded-lg border">
              <div className="font-semibold mb-2">{hospital}</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {byHospital[hospital].map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => router.push(`/user-self/book-appointment?doctor=${encodeURIComponent(doctorId)}&slot=${slot.id}`)}
                    className="text-left p-3 rounded-lg border hover:bg-green-50 transition-colors"
                  >
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-medium">{formatDateForDisplay(slot.date)}</div>
                      <div className="text-sm text-gray-600">{formatTimeForDisplay(slot.time)}</div>
                    </div>
                    <div className="mt-1 text-xs text-gray-500">Booked: {slot.bookedCount}{slot.patientLimit ? ` / ${slot.patientLimit}` : ''}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
