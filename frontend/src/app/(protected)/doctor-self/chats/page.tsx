"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ChatWorkspace from "@/components/chat/ChatWorkspace";
import WhiteButton from "@/components/buttons/WhiteButton";
import { handleDoctorSessionExpired } from "@/lib/doctorSession";

type DashboardData = {
  doctor?: {
    displayName?: string;
    email?: string;
    specialization?: string;
  };
  stats?: {
    todayAppointments?: number;
    unreadChats?: number;
    monthEarnings?: number;
    onlineAdviceSessions?: number;
  };
  recentChats?: Array<unknown>;
};

export default function DoctorChatsPage() {
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/doctor/dashboard", {
          method: "GET",
          cache: "no-store",
        });

        if (response.status === 401 || response.status === 403) {
          handleDoctorSessionExpired(router);
          return;
        }

        const payload = (await response.json().catch(() => ({}))) as DashboardData;
        if (!response.ok) {
          throw new Error("Failed to load doctor dashboard details");
        }

        setDashboardData(payload);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load chats page");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [router]);

  const doctorName = dashboardData?.doctor?.displayName || dashboardData?.doctor?.email?.split("@")[0] || "Doctor";
  const unreadChats = dashboardData?.stats?.unreadChats ?? 0;
  const todayAppointments = dashboardData?.stats?.todayAppointments ?? 0;
  const onlineSessions = dashboardData?.stats?.onlineAdviceSessions ?? 0;
  const recentChats = dashboardData?.recentChats?.length ?? 0;

  const summaryCards = useMemo(
    () => [
      { label: "Unread advice chats", value: String(unreadChats) },
      { label: "Recent conversations", value: String(recentChats) },
      { label: "Today appointments", value: String(todayAppointments) },
      { label: "Online sessions", value: String(onlineSessions) },
    ],
    [onlineSessions, recentChats, todayAppointments, unreadChats],
  );

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.16),_transparent_26%),linear-gradient(180deg,#eefbf6_0%,#f8fcfb_42%,#ffffff_100%)] pb-8">
      <div className="absolute inset-0 bg-[url('/images/doctor-login-bg.png')] bg-cover bg-center bg-no-repeat opacity-[0.08]" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/88 via-white/80 to-white/95" aria-hidden="true" />
      <div className="absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-100/60 to-transparent" aria-hidden="true" />
      <div className="absolute -left-24 top-28 h-72 w-72 rounded-full bg-emerald-200/25 blur-3xl" aria-hidden="true" />
      <div className="absolute right-0 top-36 h-80 w-80 rounded-full bg-cyan-200/20 blur-3xl" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-8">
        <section className="overflow-hidden rounded-[2.5rem] border border-emerald-100/70 bg-white/80 shadow-[0_24px_80px_rgba(16,185,129,0.12)] backdrop-blur mb-4">
          <div className="grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="relative p-6 sm:p-8 lg:p-10">
              <div className="absolute right-0 top-0 h-44 w-44 translate-x-1/3 -translate-y-1/3 rounded-full bg-emerald-100/60 blur-3xl" aria-hidden="true" />
              <div className="relative max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold tracking-[0.24em] text-emerald-700">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  DOCTOR CHATS
                </div>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
                  Advice chats with patients in one view
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                  {loading
                    ? "Loading your chat summary..."
                    : `Welcome back, ${doctorName}. Review unread advice chats, continue replies, and close or reopen threads from the same workspace.`}
                </p>

                {error ? <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">{error}</p> : null}

                <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {summaryCards.map((item) => (
                    <div key={item.label} className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm shadow-emerald-100/30">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                      <p className="mt-2 text-2xl font-bold text-slate-900">{loading ? "..." : item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href="/doctor-self/appointments">
                    <WhiteButton className="rounded-full px-6 py-3">Manage Appointments</WhiteButton>
                  </Link>
                  <Link href="/doctor-self/dashboard">
                    <WhiteButton className="rounded-full px-6 py-3">Back to Dashboard</WhiteButton>
                  </Link>
                </div>
              </div>
            </div>

            <div className="relative min-h-[320px] bg-gradient-to-br from-emerald-700 via-teal-700 to-cyan-700 p-4 sm:p-6 lg:min-h-full">
              <div className="absolute inset-0 bg-[url('/images/doctor-login-bg.png')] bg-cover bg-center bg-no-repeat opacity-25" aria-hidden="true" />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950/20 via-transparent to-slate-950/30" aria-hidden="true" />
              <div className="relative flex h-full flex-col justify-between rounded-[2rem] border border-white/15 bg-white/10 p-5 text-white backdrop-blur-sm sm:p-6">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/80">Today&apos;s focus</p>
                  <p className="mt-3 text-2xl font-bold sm:text-3xl">Answer the next patient faster.</p>
                  <p className="mt-3 max-w-md text-sm leading-6 text-white/85">
                    The list on this page reflects your live advice threads and keeps unread counts visible as you work.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-3xl border border-white/20 bg-white/12 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Unread chats</p>
                    <p className="mt-2 text-2xl font-bold">{loading ? "..." : unreadChats}</p>
                  </div>
                  <div className="rounded-3xl border border-white/20 bg-white/12 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Threads</p>
                    <p className="mt-2 text-2xl font-bold">{loading ? "..." : recentChats}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* <div className="mt-6 rounded-[2rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(16,185,129,0.08)]">
          <p className="text-sm leading-6 text-slate-600">
            Your chat inbox is tied to the same backend thread list used by the dashboard, so unread counts and message history stay in sync.
          </p>
        </div> */}

        <ChatWorkspace
          role="DOCTOR"
          onSessionExpired={() => handleDoctorSessionExpired(router)}
          browseHref="/doctor-self/dashboard"
          browseLabel="Back to dashboard"
          emptyStateTitle="No chat selected yet"
          emptyStateDescription="Pick a patient conversation on the left to read the latest messages, or return to the dashboard for a summary view."
        />
      </div>
    </div>
  );
}
