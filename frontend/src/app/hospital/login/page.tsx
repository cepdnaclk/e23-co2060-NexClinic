"use client";

import HospitalAdminLoginForm from '@/components/hospital/HospitalAdminLoginForm';

export default function HospitalAdminLogin() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 overflow-hidden">
      {/* Background Image with Dark Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          className="object-cover h-full w-full opacity-40 select-none"
          src="/images/hospital-login-bg.jpg"
          alt="Hospital background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-slate-50/80 to-white/60 dark:from-slate-950 dark:via-slate-950/80 dark:to-slate-900/60" />
      </div>

      {/* Decorative Radial Lights */}
      <div className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl z-0" aria-hidden="true" />
      <div className="absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl z-0" aria-hidden="true" />

      {/* Login Card Panel */}
      <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-500/30 mb-4 hover:scale-105 transition-transform">
            <img src="/images/logo-main.png" alt="NexClinic Logo" className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white text-center">
            NexClinic
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1.5 text-center">
            Hospital Admin Portal Access
          </p>
        </div>

        <HospitalAdminLoginForm />
      </div>
    </div>
  );
}
