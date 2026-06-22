"use client";

import { usePathname } from "next/navigation";
import HospitalNavBar from "@/components/hospital/HospitalNavBar";

export default function HospitalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Pages that are unauthenticated and should not display the navbar
  const isAuthRoute =
    pathname === "/hospital/login" ||
    pathname === "/hospital/register" ||
    pathname === "/hospital/contact";

  if (isAuthRoute) {
    return (
      <div className="relative min-h-screen w-screen overflow-x-hidden bg-slate-950 flex flex-col justify-center items-center">
        {children}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(16,185,129,0.10),_transparent_26%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_45%,#ffffff_100%)] text-slate-800 dark:text-slate-200 transition-colors pb-12">
      {/* Dynamic Background Accents */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.03]" style={{ backgroundImage: "url('/images/hospital-login-bg.jpg')" }} aria-hidden="true" />
      <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-blue-400/10 blur-3xl" aria-hidden="true" />
      <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden="true" />

      <HospitalNavBar />

      <main className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
