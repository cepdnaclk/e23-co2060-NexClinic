"use client";

import HospitalRegisterForm from '@/components/hospital/HospitalRegisterForm';

export default function HospitalRegisterPage() {
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 py-16">
      {/* Background Image with Dark Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          className="object-cover h-full w-full opacity-35 select-none"
          src="/images/hospital-register-bg.jpg"
          alt="Hospital background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/60" />
      </div>

      {/* Decorative Radial Lights */}
      <div className="absolute -left-48 top-1/3 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl z-0" aria-hidden="true" />
      <div className="absolute -right-48 bottom-1/3 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-3xl z-0" aria-hidden="true" />

      {/* Register Card Panel */}
      <div className="relative z-10 w-full max-w-3xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-500/30 mb-4 hover:scale-105 transition-transform">
            <img src="/images/logo-main.png" alt="NexClinic Logo" className="h-8 w-8 invert brightness-200" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white text-center">
            Register Hospital Admin
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 text-center">
            Apply to register a management account for an active hospital on NexClinic
          </p>
        </div>

        <HospitalRegisterForm />
      </div>
    </div>
  );
}
