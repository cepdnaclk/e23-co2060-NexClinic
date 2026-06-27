"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import GreenButton from "@/components/buttons/GreenButton";
import { handlePatientSessionExpired } from "@/lib/patientSession";

type PatientProfileResponse = {
  patient: {
    fullName: string;
    email: string;
  };
  health: {
    bloodType: string;
    allergies: string;
    medications: string;
    medicalHistory: string;
    comments: string;
    prescriptions: string;
    medicalReports: string;
    medicalDocuments: string;
  };
};

const splitNotes = (value: string) =>
  value
    .split(/[\n,;]+/)
    .map((item) => item.trim())
    .filter(Boolean);

export default function PatientMedicalHistoryPage() {
  const router = useRouter();
  const [profileData, setProfileData] = useState<PatientProfileResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/patient/profile", {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 401 || response.status === 403) {
          handlePatientSessionExpired(router);
          return;
        }

        if (!response.ok) {
          const errorPayload = await response.json().catch(() => ({}));
          throw new Error(
            errorPayload?.error || "Failed to load medical history",
          );
        }

        const data: PatientProfileResponse = await response.json();
        setProfileData(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load medical history",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [router]);

  const patientName = profileData?.patient.fullName || "Patient";
  const patientEmail = profileData?.patient.email || "Not available";
  const bloodType = profileData?.health.bloodType || "Unknown";
  const allergies = profileData?.health.allergies || "None reported";
  const medications = profileData?.health.medications || "None reported";
  const medicalHistory = profileData?.health.medicalHistory || "None reported";
  const comments = profileData?.health.comments || "No clinical comments have been recorded yet.";
  const prescriptions = profileData?.health.prescriptions || "No prescriptions have been recorded yet.";
  const medicalReports = profileData?.health.medicalReports || "";
  const medicalDocuments = profileData?.health.medicalDocuments || "";

  const historyItems = splitNotes(medicalHistory);
  const allergyItems = splitNotes(allergies);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef8f4] via-[#f8fcfb] to-white pb-8">
      <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Patient Profile / Medical History
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Medical History
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              A focused view of your allergies, medications, and background
              history for quick review before a consultation.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/user-self/profile"
              className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
            >
              Back to Profile
            </Link>
            <GreenButton
              className="rounded-full px-6 py-3"
              onClick={() => router.push("/user-self/edit-profile")}
            >
              Edit Profile
            </GreenButton>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-green-100 bg-white p-8 text-center shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
            <p className="text-sm font-semibold text-emerald-700">
              Loading medical history...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-[2rem] border border-rose-100 bg-white p-8 text-center shadow-[0_18px_50px_rgba(239,68,68,0.08)]">
            <p className="text-sm font-semibold text-rose-600">{error}</p>
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-[2rem] border border-green-100 bg-white p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)] sm:p-7">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Clinical Summary
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Patient: {patientName} · {patientEmail}
                  </p>
                </div>
                <p className="text-sm font-semibold text-emerald-700">
                  {historyItems.length} recorded item{historyItems.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-white p-5 ring-1 ring-emerald-100">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Blood Type
                  </p>
                  <p className="mt-3 text-2xl font-bold text-slate-900">
                    {bloodType}
                  </p>
                </div>
                <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-white p-5 ring-1 ring-emerald-100">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Medical Records
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    Uploads and attached files are linked on the right for quick
                    access.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Observations
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {historyItems.length ? (
                      historyItems.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 ring-1 ring-emerald-100"
                        >
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
                        None reported
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Comments
                  </p>
                  <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-7 text-slate-700">
                    <p className="font-semibold text-slate-900">{comments}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Prescriptions
                  </p>
                  <div className="mt-3 rounded-3xl border border-slate-200 bg-slate-50/70 p-4 text-sm leading-7 text-slate-700">
                    <p className="font-semibold text-slate-900">{prescriptions}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">
                    Allergies
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {allergyItems.length ? (
                      allergyItems.map((item) => (
                        <span
                          key={item}
                          className="rounded-full bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-800 ring-1 ring-amber-100"
                        >
                          {item}
                        </span>
                      ))
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
                        None reported
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <aside className="space-y-5">
              <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-lg shadow-emerald-100/40">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">
                  Detailed History
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-600">
                  {medicalHistory}
                </p>
              </div>

              <div className="rounded-[2rem] border border-emerald-100 bg-white p-6 shadow-lg shadow-emerald-100/40">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-emerald-700">
                  Attached Files
                </p>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm text-slate-600">Medical Reports</p>
                    {medicalReports ? (
                      <a
                        href={medicalReports}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        Open report
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-slate-900">Not provided</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-slate-600">Medical Documents</p>
                    {medicalDocuments ? (
                      <a
                        href={medicalDocuments}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                      >
                        Open document
                      </a>
                    ) : (
                      <p className="mt-1 text-sm text-slate-900">Not provided</p>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}