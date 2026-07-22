"use client";

import { useEffect, useState } from "react";
import { fetchAdminHospitals, type HospitalAdminItem } from "@/lib/api/hospitalSlots";

interface ReportsData {
  total_appointments: number;
  booked_last_30_days: number;
  total_slots: number;
  filled_slots: number;
}

export default function HospitalReportsPage() {
  const [hospitals, setHospitals] = useState<HospitalAdminItem[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setHospitalsLoading(true);
      try {
        const payload = await fetchAdminHospitals();
        const list = Array.isArray(payload?.hospitals) ? payload.hospitals : [];
        if (mounted) {
          setHospitals(list);
          const first = list[0];
          if (first) setSelectedHospitalId(String(first.hospital ?? first.id ?? ""));
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setHospitalsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedHospitalId) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/hospital/reports?hospital_id=${selectedHospitalId}`, {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) {
          const payload = await res.json().catch(() => ({}));
          throw new Error(payload?.error || payload?.detail || "Failed to load reports");
        }
        const payload = await res.json();
        if (mounted) setData(payload);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedHospitalId]);

  const fillRate =
    data && data.total_slots > 0 ? Math.round((data.filled_slots / data.total_slots) * 100) : 0;

  const cards = [
    {
      label: "Total Appointments",
      value: data?.total_appointments ?? 0,
      hint: "All-time booked appointments",
      accent: "text-emerald-600 bg-emerald-50",
    },
    {
      label: "Booked (Last 30 Days)",
      value: data?.booked_last_30_days ?? 0,
      hint: "New appointment requests this month",
      accent: "text-teal-600 bg-teal-50",
    },
    {
      label: "Total Slots",
      value: data?.total_slots ?? 0,
      hint: "Appointment slots across all doctors",
      accent: "text-sky-600 bg-sky-50",
    },
    {
      label: "Filled Slots",
      value: data?.filled_slots ?? 0,
      hint: `${fillRate}% of slots are at capacity`,
      accent: "text-purple-600 bg-purple-50",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
            <p className="text-sm text-slate-500 mt-1">
              A quick snapshot of appointment and slot activity for your hospital.
            </p>
          </div>

          <div className="w-full md:w-auto min-w-[280px]">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Hospital Branch
            </label>
            <select
              className="block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              value={selectedHospitalId}
              onChange={(event) => setSelectedHospitalId(event.target.value)}
              disabled={hospitalsLoading || hospitals.length === 0}
            >
              {hospitals.length === 0 ? (
                <option value="">No hospitals available</option>
              ) : (
                hospitals.map((hospital) => {
                  const id = String(hospital.hospital ?? hospital.id ?? "");
                  const label = hospital.hospitalName || hospital.name || `Hospital ${id}`;
                  return (
                    <option key={id} value={id}>
                      {label}
                    </option>
                  );
                })
              )}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-center">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {hospitalsLoading || loading ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-slate-200 bg-white/50 backdrop-blur">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-emerald-600 border-t-transparent" />
          <span className="mt-3 text-sm text-slate-500">Crunching the numbers...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur"
            >
              <div className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${card.accent}`}>
                {card.label}
              </div>
              <p className="mt-4 text-3xl font-extrabold text-slate-900">{card.value}</p>
              <p className="mt-1.5 text-xs text-slate-500">{card.hint}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
