"use client";

import { useRouter } from "next/navigation";

export default function HospitalContactPage() {
  const router = useRouter();

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-950 px-4 py-16">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          className="object-cover h-full w-full opacity-30 select-none"
          src="/images/main-bg.jpg"
          alt="Main background"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/60" />
      </div>

      {/* Decorative Lights */}
      <div className="absolute -left-48 top-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl z-0" aria-hidden="true" />
      <div className="absolute -right-48 bottom-1/3 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl z-0" aria-hidden="true" />

      {/* Contact Panel Card */}
      <div className="relative z-10 w-full max-w-2xl animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 shadow-lg shadow-emerald-500/35 mb-4 hover:scale-105 transition-transform">
            <img src="/images/logo-main.png" alt="NexClinic Logo" className="h-8 w-8 invert brightness-200" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white text-center">
            Hospital Registration
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 text-center max-w-md">
            Hospital enrollments are manually authorized by our operations team. Get in touch with us to set up your facility.
          </p>
        </div>

        <div className="bg-white/95 border border-slate-100 rounded-3xl shadow-xl p-8 backdrop-blur-md">
          <p className="text-slate-600 text-center text-base mb-8 max-w-lg mx-auto">
            To register a new hospital on the NexClinic platform, please send us the hospital registration certificates, operating licenses, and contact information.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* Email Card */}
            <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-slate-800">Email Us</h4>
              <p className="text-xs text-slate-500 mt-1.5 break-all">support@nexclinic.com</p>
            </div>

            {/* Phone Card */}
            <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-slate-800">Call Us</h4>
              <p className="text-xs text-slate-500 mt-1.5">+94 11 123 4567</p>
            </div>

            {/* Address Card */}
            <div className="flex flex-col items-center text-center p-5 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h4 className="text-sm font-bold text-slate-800">Visit Us</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-normal">123 Main St, Colombo, SL</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-100 pt-6">
            <button
              onClick={() => router.push("/hospital/login")}
              className="flex-1 rounded-xl border border-slate-200 hover:bg-slate-50 py-3 text-sm font-semibold text-slate-600 transition-all active:scale-[0.99]"
            >
              Back to Login
            </button>
            <a
              href="mailto:support@nexclinic.com?subject=NexClinic Hospital Registration Request"
              className="flex-1 flex items-center justify-center rounded-xl bg-emerald-600 hover:bg-emerald-700 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:shadow-xl active:scale-[0.99] text-center"
            >
              Email Us Directly
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}