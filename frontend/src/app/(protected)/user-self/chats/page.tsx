"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ChatWorkspace from "@/components/chat/ChatWorkspace";
import { handlePatientSessionExpired } from "@/lib/patientSession";

type PatientProfilePayload = {
  patient?: {
    fullName?: string;
    email?: string;
  };
  chatSummary?: {
    unreadChats?: number;
    recentChats?: Array<unknown>;
  };
};

type DashboardAppointment = {
  category?: "upcoming" | "previous";
};

type AppointmentsPayload = {
  appointments?: DashboardAppointment[];
};

function UserChatsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<PatientProfilePayload | null>(null);
  const [appointments, setAppointments] = useState<DashboardAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatUnavailableNotice, setChatUnavailableNotice] = useState("");

  const defaultDoctorId = searchParams.get("doctor");

  useEffect(() => {
    setChatUnavailableNotice("");
  }, [defaultDoctorId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const [profileResponse, appointmentsResponse] = await Promise.all([
          fetch("/api/patient/profile", { method: "GET", cache: "no-store" }),
          fetch("/api/patient/appointments", { method: "GET", cache: "no-store" }),
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

        const profilePayload = (await profileResponse.json().catch(() => ({}))) as PatientProfilePayload;
        const appointmentsPayload = (await appointmentsResponse.json().catch(() => ({}))) as AppointmentsPayload;

        if (!profileResponse.ok) {
          throw new Error("Failed to load patient profile");
        }

        if (!appointmentsResponse.ok) {
          throw new Error("Failed to load appointments");
        }

        setProfile(profilePayload);
        setAppointments(Array.isArray(appointmentsPayload.appointments) ? appointmentsPayload.appointments : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chats page");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [router]);

  const displayName = profile?.patient?.fullName || profile?.patient?.email?.split("@")[0] || "Patient";
  const unreadChats = profile?.chatSummary?.unreadChats ?? 0;
  const recentChatsCount = profile?.chatSummary?.recentChats?.length ?? 0;
  const upcomingAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.category === "upcoming").length,
    [appointments],
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eef8f4] via-[#f8fcfb] to-white">
      <div className="mx-auto w-full max-w-7xl space-y-5 px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8 sm:space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-green-100 bg-white/95 shadow-[0_20px_60px_rgba(16,185,129,0.14)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,173,133,0.16),transparent_42%),radial-gradient(circle_at_bottom_left,_rgba(0,119,88,0.12),transparent_40%)]" />
          <div className="relative space-y-5 p-4 sm:space-y-6 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-stretch xl:justify-between">
              <div className="flex-1 rounded-[1.75rem] border border-white/70 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-5 lg:p-6">
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700">
                    Advice chats
                  </div>
                  <h1 className="mt-3 break-words text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                    Chat with doctors in one calm workspace
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
                    {loading
                      ? "Loading your latest chat activity..."
                      : "Open a thread, read replies, and continue advice conversations without leaving this page."}
                  </p>
                  {error ? <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p> : null}
                </div>
              </div>

              <div className="w-full rounded-[1.75rem] border border-green-100 bg-gradient-to-br from-green-600 via-emerald-600 to-green-700 p-5 text-white shadow-2xl xl:max-w-md">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-green-100">Patient chat summary</p>
                <p className="mt-2 text-2xl font-bold">Hello, {displayName}</p>
                <p className="mt-1 text-sm text-green-100">
                  Use the chat list to pick a doctor conversation, or start a new thread from a doctor profile.
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3 xl:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur">
                    <p className="text-green-100">Unread</p>
                    <p className="mt-1 text-lg font-bold text-white">{loading ? "..." : unreadChats}</p>
                  </div>
                  <div className="rounded-2xl bg-white/10 px-3 py-3 backdrop-blur">
                    <p className="text-green-100">Recent</p>
                    <p className="mt-1 text-lg font-bold text-white">{loading ? "..." : recentChatsCount}</p>
                  </div>
                  <div className="hidden rounded-2xl bg-white/10 px-3 py-3 backdrop-blur sm:block xl:hidden">
                    <p className="text-green-100">Upcoming</p>
                    <p className="mt-1 text-lg font-bold text-white">{loading ? "..." : upcomingAppointments}</p>
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link href="/doctors" className="inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50">
                    Browse Doctors
                  </Link>
                  <Link href="/user-self/appointments" className="inline-flex items-center justify-center rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15">
                    My Appointments
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Unread advice chats</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? "..." : unreadChats}</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Recent conversations</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{loading ? "..." : recentChatsCount}</p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Upcoming appointments</p>
                <p className="mt-2 text-3xl font-bold text-emerald-700">{loading ? "..." : upcomingAppointments}</p>
              </div>
            </div>
          </div>
        </section>

        {chatUnavailableNotice ? (
          <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900 shadow-sm">
            {chatUnavailableNotice}
          </div>
        ) : null}

        <ChatWorkspace
          role="PATIENT"
          onSessionExpired={() => handlePatientSessionExpired(router)}
          onPatientChatUnavailable={setChatUnavailableNotice}
          browseHref="/doctors"
          browseLabel="Browse doctors"
          emptyStateTitle="No chat selected yet"
          emptyStateDescription="Choose an existing conversation on the left, or open a doctor profile and start a new advice chat."
          defaultDoctorId={defaultDoctorId}
        />
      </div>
    </div>
  );
}

export default function UserChatsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#eef8f4] to-white text-slate-500">
        Loading chats...
      </div>
    }>
      <UserChatsPageContent />
    </Suspense>
  );
}
