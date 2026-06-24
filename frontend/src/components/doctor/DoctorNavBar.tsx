"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BlackButton from "../buttons/BlackButton";
import { clearDoctorClientSession, handleDoctorSessionExpired } from "@/lib/doctorSession";


function DoctorNavBar() {
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(false);
    const isSessionCheckInFlight = useRef(false);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const isActive = (href: string) => pathname === href;

    const verifyDoctorSession = async (): Promise<boolean> => {
        if (isSessionCheckInFlight.current) {
            return false;
        }

        isSessionCheckInFlight.current = true;

        try {
            const response = await fetch("/api/doctor/profile", {
                method: "GET",
                cache: "no-store",
            });

            if (response.status === 401) {
                handleDoctorSessionExpired(router);
                return false;
            }

            return true;
        } catch {
            // Ignore transient network issues for navigation checks.
            return true;
        } finally {
            isSessionCheckInFlight.current = false;
        }
    };

    useEffect(() => {
        const onDocumentClick = (event: MouseEvent) => {
            if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                return;
            }

            const target = event.target;
            if (!(target instanceof Element)) {
                return;
            }

            const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
            if (!anchor) {
                return;
            }

            const href = anchor.getAttribute("href");
            if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
                return;
            }

            const destination = new URL(href, window.location.origin);
            if (destination.origin !== window.location.origin) {
                return;
            }

            if (!destination.pathname.startsWith("/doctor-self")) {
                return;
            }

            const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            const destinationPath = `${destination.pathname}${destination.search}${destination.hash}`;
            if (currentPath === destinationPath) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            void (async () => {
                setIsCheckingSession(true);
                try {
                    const isSessionValid = await verifyDoctorSession();
                    if (isSessionValid) {
                        router.push(destinationPath);
                    }
                } finally {
                    setIsCheckingSession(false);
                }
            })();
        };

        const onPopState = () => {
            void verifyDoctorSession();
        };

        const onPageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                void verifyDoctorSession();
            }
        };

        document.addEventListener("click", onDocumentClick, true);
        window.addEventListener("popstate", onPopState);
        window.addEventListener("pageshow", onPageShow);

        return () => {
            document.removeEventListener("click", onDocumentClick, true);
            window.removeEventListener("popstate", onPopState);
            window.removeEventListener("pageshow", onPageShow);
        };
    }, [pathname]);

    const handleLogout = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (error) {
            console.error("Logout API error:", error);
        }

        clearDoctorClientSession();

        router.push("/doctor/login");
    };

    return (
        <nav className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md dark:bg-slate-900/80 dark:border-slate-800 shadow-sm">
            {isCheckingSession && (
                <div className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center">
                    <div className="rounded-lg bg-white dark:bg-gray-800 shadow-lg px-5 py-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                        Loading...
                    </div>
                </div>
            )}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo and Brand */}
                    <div className="flex items-center justify-between w-full mr-8">
                        <Link href="/doctor-self/dashboard" className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-between">
                            <img src="/images/logo-main.png" alt="NexClinic Logo" className="h-8 w-8 mr-4" />
                            NexClinic
                        </Link>

                        {/* Desktop Navigation Links */}
                        <div className="hidden md:flex items-center gap-1.5 text-sm font-medium">
                            <Link
                                href="/doctor-self/dashboard"
                                className={`relative px-4 py-2 rounded-xl transition-all duration-200 ${isActive("/doctor-self/dashboard")
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold"
                                    : "text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900"
                                    }`}
                            >
                                Dashboard
                            </Link>
                            <Link
                                href="/doctor-self/appointments"
                                className={`relative px-4 py-2 rounded-xl transition-all duration-200 ${isActive("/doctor-self/appointments")
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold"
                                    : "text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900"
                                    }`}
                            >
                                Appointments
                            </Link>
                            <Link
                                href="/doctor-self/appointment-slots"
                                className={`relative px-4 py-2 rounded-xl transition-all duration-200 ${isActive("/doctor-self/appointment-slots")
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold"
                                    : "text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900"
                                    }`}
                            >
                                Slots
                            </Link>
                            <Link
                                href="/doctor-self/chats"
                                className={`relative px-4 py-2 rounded-xl transition-all duration-200 ${isActive("/doctor-self/chats")
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold"
                                    : "text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900"
                                    }`}
                            >
                                Chats
                            </Link>
                            <Link
                                href="/doctor-self/profile"
                                className={`relative px-4 py-2 rounded-xl transition-all duration-200 ${isActive("/doctor-self/profile")
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold"
                                    : "text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900"
                                    }`}
                            >
                                My Profile
                            </Link>
                            <Link
                                href="/doctors"
                                className={`relative px-4 py-2 rounded-xl transition-all duration-200 ${isActive("/doctors")
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold"
                                    : "text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900"
                                    }`}
                            >
                                Doctors
                            </Link>
                            <Link
                                href="/news-articles"
                                className={`relative px-4 py-2 rounded-xl transition-all duration-200 ${isActive("/news-articles")
                                    ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold"
                                    : "text-slate-650 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900"
                                    }`}
                            >
                                News & Articles
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

                    {/* Mobile Hamburger button */}
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
                            href="/doctor-self/dashboard"
                            className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-colors ${isActive("/doctor-self/dashboard")
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold"
                                : "text-slate-650 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                }`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/doctor-self/appointments"
                            className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-colors ${isActive("/doctor-self/appointments")
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold"
                                : "text-slate-650 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                }`}
                        >
                            Appointments
                        </Link>
                        <Link
                            href="/doctor-self/appointment-slots"
                            className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-colors ${isActive("/doctor-self/appointment-slots")
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold"
                                : "text-slate-650 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                }`}
                        >
                            Slots
                        </Link>
                        <Link
                            href="/doctor-self/chats"
                            className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-colors ${isActive("/doctor-self/chats")
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold"
                                : "text-slate-650 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                }`}
                        >
                            Chats
                        </Link>
                        <Link
                            href="/doctor-self/profile"
                            className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-colors ${isActive("/doctor-self/profile")
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold"
                                : "text-slate-650 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                }`}
                        >
                            My Profile
                        </Link>
                        <Link
                            href="/doctors"
                            className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-colors ${isActive("/doctors")
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold"
                                : "text-slate-650 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                }`}
                        >
                            Doctors
                        </Link>
                        <Link
                            href="/news-articles"
                            className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-colors ${isActive("/news-articles")
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 font-bold"
                                : "text-slate-650 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                                }`}
                        >
                            News & Articles
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

export default DoctorNavBar;