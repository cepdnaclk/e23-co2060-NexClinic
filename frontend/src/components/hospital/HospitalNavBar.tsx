"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BlackButton from "../buttons/BlackButton";

export default function HospitalNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const isActive = (href: string) => pathname === href;

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout API error:", error);
    }

    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userInfo");
      localStorage.removeItem("isAuthenticated");
    } catch { }

    document.cookie = "authToken=; path=/; max-age=0; samesite=lax";
    document.cookie = "userRole=; path=/; max-age=0; samesite=lax";

    router.push("/hospital/login");
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md dark:bg-slate-900/80 dark:border-slate-800 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center justify-between w-full mr-8">
            <Link href="/hospital/dashboard" className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-between">
              <img src="/images/logo-main.png" alt="NexClinic Logo" className="h-8 w-8 mr-4" />
              NexClinic
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1.5 text-sm font-medium">
              <Link
                href="/hospital/dashboard"
                className={`relative px-4 py-2 rounded-xl transition-all duration-200 ${isActive("/hospital/dashboard")
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900"
                  }`}
              >
                Dashboard
              </Link>
              <Link
                href="/hospital/doctors"
                className={`relative px-4 py-2 rounded-xl transition-all duration-200 ${isActive("/hospital/doctors")
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900"
                  }`}
              >
                Doctors
              </Link>
              <Link
                href="/hospital/slots"
                className={`relative px-4 py-2 rounded-xl transition-all duration-200 ${isActive("/hospital/slots")
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900"
                  }`}
              >
                Slots
              </Link>
              <Link
                href="/hospital/profile"
                className={`relative px-4 py-2 rounded-xl transition-all duration-200 ${isActive("/hospital/profile")
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900"
                  }`}
              >
                My Profile
              </Link>
            </div>
          </div>

          {/* Desktop Right Panel (Logout) */}
          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-slate-800 hover:shadow-md transition-all active:scale-[0.98]"
            >
              Logout
            </button>
          </div>

          {/* Mobile Hamburguer button */}
          <div className="flex md:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus:outline-none dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="space-y-1.5 px-4 py-4">
            <Link
              href="/hospital/dashboard"
              className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-colors ${isActive("/hospital/dashboard")
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "text-slate-650 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
            >
              Dashboard
            </Link>
            <Link
              href="/hospital/doctors"
              className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-colors ${isActive("/hospital/doctors")
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "text-slate-650 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
            >
              Doctors
            </Link>
            <Link
              href="/hospital/slots"
              className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-colors ${isActive("/hospital/slots")
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "text-slate-650 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
            >
              Slots
            </Link>
            <Link
              href="/hospital/profile"
              className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-colors ${isActive("/hospital/profile")
                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                : "text-slate-650 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
            >
              My Profile
            </Link>
            <button
              onClick={handleLogout}
              className="mt-4 w-full justify-center rounded-xl bg-slate-900 px-4 py-3 text-base font-semibold text-white shadow hover:bg-slate-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
