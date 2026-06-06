"use client";

import { useEffect, useState } from "react";
import BlackButton from "@/components/buttons/BlackButton";

const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

interface Doctor {
  id: number;
  full_name: string;
  email: string;
  is_added: boolean;
  specialization?: string;
  phone?: string;
}

/**
 * Fetch the Django admin change-list HTML and parse doctor rows.
 * NOTE: fragile — depends on Django admin HTML structure. Requires admin session cookie.
 */
async function fetchDoctorsFromAdmin(): Promise<Doctor[]> {
  const url = `${BACKEND}/admin/users/customuser/?role__exact=DOCTOR`;
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    const text = await res.text().catch(() => null);
    throw new Error(text || `Request failed: ${res.status}`);
  }
  const html = await res.text();
  // Parse HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Try admin change-list table selectors
  const table = doc.querySelector("#result_list") || doc.querySelector("table.results") || doc.querySelector("table");
  if (!table) return [];

  const rows = Array.from(table.querySelectorAll("tbody tr"));
  const doctors: Doctor[] = rows.map((tr) => {
    // attempt to extract id from first link to change page
    const link = tr.querySelector("th a, a");
    let id = 0;
    if (link?.getAttribute("href")) {
      const href = link.getAttribute("href") || "";
      const m = href.match(/\/admin\/users\/customuser\/(\d+)\/change\/?/);
      if (m) id = Number(m[1]);
    }

    const text = tr.textContent || "";
    // email heuristic
    const emailMatch = text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
    const email = emailMatch ? emailMatch[0].trim() : "";

    // full name heuristic: pick first non-email cell text
    const cells = Array.from(tr.querySelectorAll("th, td")).map((c) => c.textContent?.trim() || "");
    let full_name = "";
    for (const c of cells) {
      if (!c) continue;
      if (email && c.includes(email)) continue;
      // skip numeric id
      if (/^\d+$/.test(c)) continue;
      full_name = c;
      break;
    }
    if (!full_name) {
      // fallback to link text or email local-part
      full_name = (link?.textContent?.trim() || "") || (email.split("@")[0] || `Doctor ${id}`);
    }

    return {
      id,
      full_name,
      email,
      is_added: false,
    } as Doctor;
  });

  return doctors;
}

export default function ManageDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const list = await fetchDoctorsFromAdmin();
      setDoctors(list);
    } catch (err: any) {
      setError(err?.message || "Error loading doctors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const handleAddRemove = async (_doctorId: number, _add: boolean) => {
    // keep UI consistent — real add/remove should call hospital APIs
    setSubmitting(true);
    setTimeout(() => setSubmitting(false), 400);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef8f4] via-[#f8fcfb] to-white flex flex-col items-center py-10">
      <div className="bg-white bg-opacity-90 rounded-xl shadow-md p-8 w-full max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-blue-700 text-center">Manage Doctors</h1>
          <div className="text-sm text-slate-500">{!loading && `${doctors.length} ${doctors.length === 1 ? "doctor" : "doctors"}`}</div>
        </div>

        {error && (
          <div className="text-red-500 mb-4 text-center">
            <div>{error}</div>
            <div className="mt-2">
              <BlackButton onClick={load}>Retry</BlackButton>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading doctors...</div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-8">
            <div className="mb-4 text-slate-600">No doctors found in admin list.</div>
            <BlackButton onClick={load}>Reload</BlackButton>
          </div>
        ) : (
          <ul className="divide-y divide-blue-100">
            {doctors.map((doctor) => (
              <li key={`${doctor.id}-${doctor.email}`} className="flex items-center justify-between py-4">
                <div>
                  <div className="font-semibold text-slate-900">{doctor.full_name}</div>
                  <div className="text-sm text-slate-600">{doctor.email}</div>
                </div>

                <BlackButton disabled={submitting} onClick={() => handleAddRemove(doctor.id, true)}>
                  Add (use hospital API)
                </BlackButton>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}