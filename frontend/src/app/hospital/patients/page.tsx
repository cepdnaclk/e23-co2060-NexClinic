"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HospitalPatientSearchPage() {
  const [patientSearch, setPatientSearch] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (patientSearch.trim()) {
      let pid = patientSearch.trim().toUpperCase();
      if (pid.startsWith("P-")) {
        pid = pid.slice(2);
      }
      router.push(`/hospital/patients/${encodeURIComponent(pid)}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-sm backdrop-blur">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Patient Lookup</h1>
          <p className="text-sm text-slate-500 mt-1">
            Search for patients who have booked appointments at your hospital to view their profiles and activity logs.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto mt-12 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Search Patient</h2>
        <p className="text-sm text-slate-500 mb-8">
          Enter the Patient ID to view their non-medical profile and hospital activity logs.
        </p>

        <form onSubmit={handleSearch} className="flex max-w-md mx-auto shadow-sm">
          <input
            type="text"
            placeholder="e.g. P-123 or just 123"
            value={patientSearch}
            onChange={(event) => setPatientSearch(event.target.value)}
            className="block w-full rounded-l-2xl border border-r-0 border-slate-200 bg-slate-50 px-6 py-4 text-base text-slate-900 placeholder-slate-400 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            autoFocus
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-r-2xl border border-emerald-600 bg-emerald-600 px-8 py-4 text-base font-semibold text-white hover:bg-emerald-700 transition-all"
          >
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
