"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAdminHospitals, type HospitalAdminItem } from "@/lib/api/hospitalSlots";

interface ActivityLogItem {
  id: number | string;
  user_email: string | null;
  hospital_id: number | string | null;
  action: string;
  model_name: string;
  object_id: string;
  data: Record<string, unknown> | null;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  doctor_created_by_admin: "Doctor account created",
  doctor_delinked_by_admin: "Doctor removed from hospital",
};

function formatAction(action: string) {
  return ACTION_LABELS[action] || action.replace(/_/g, " ");
}

export default function HospitalActivityLogsPage() {
  const [hospitals, setHospitals] = useState<HospitalAdminItem[]>([]);
  const [selectedHospitalId, setSelectedHospitalId] = useState("");
  const [hospitalsLoading, setHospitalsLoading] = useState(true);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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

  const loadLogs = async (hospitalId: string) => {
    if (!hospitalId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/hospital/activity-logs?hospital_id=${hospitalId}`, {
        method: "GET",
        cache: "no-store",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || payload?.detail || "Failed to load activity logs");
      }
      const payload = await res.json();
      setLogs(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLogs(selectedHospitalId);
  }, [selectedHospitalId]);

  const filteredLogs = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter((log) =>
      `${log.user_email || ""} ${formatAction(log.action)} ${log.model_name} ${log.object_id}`
        .toLowerCase()
        .includes(q)
    );
  }, [logs, search]);

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Activity Log</h1>
            <p className="text-sm text-slate-500 mt-1">
              An audit trail of admin actions performed for your hospital.
            </p>
          </div>

          <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search by admin, action, or record..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="block w-full sm:min-w-[260px] rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2 text-sm text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            <select
              className="block w-full sm:w-auto min-w-[220px] rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-800 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
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
            <button
              onClick={() => void loadLogs(selectedHospitalId)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 hover:bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600 transition-all"
            >
              Refresh
            </button>
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
          <span className="mt-3 text-sm text-slate-500">Loading activity log...</span>
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-3xl border border-slate-100 bg-white p-8">
          <h3 className="font-bold text-slate-800">No activity recorded yet</h3>
          <p className="text-sm text-slate-500 mt-1">
            Actions like adding, removing, or creating doctors will show up here.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-slate-100 bg-white/95 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {filteredLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-5 hover:bg-slate-50/60 transition-colors">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 capitalize">{formatAction(log.action)}</span>
                    <span className="inline-flex items-center rounded-full bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500 ring-1 ring-inset ring-slate-500/10">
                      {log.model_name || "System"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    By {log.user_email || "System"} &middot; {new Date(log.created_at).toLocaleString()}
                  </p>
                  {log.data && Object.keys(log.data).length > 0 && (
                    <p className="text-xs text-slate-400 mt-1.5 font-mono truncate">
                      {Object.entries(log.data)
                        .map(([key, value]) => `${key}: ${String(value)}`)
                        .join(" · ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
