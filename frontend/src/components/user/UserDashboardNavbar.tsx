"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BlackButton from "../buttons/BlackButton";
import { clearPatientClientSession, handlePatientSessionExpired } from "@/lib/patientSession";

export default function UserDashboardNavbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(false);
    const isSessionCheckInFlight = useRef(false);

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const isActive = (href: string) => pathname === href;

    const verifyPatientSession = async (): Promise<boolean> => {
        if (isSessionCheckInFlight.current) {
            return false;
        }

        isSessionCheckInFlight.current = true;

        try {
            const response = await fetch("/api/patient/profile", {
                method: "GET",
                cache: "no-store",
            });

            if (response.status === 401) {
                handlePatientSessionExpired(router);
                return false;
            }

            return true;
        } catch {
            // Ignore transient network failures during session checks.
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

            if (!destination.pathname.startsWith("/user-self")) {
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
                    const isSessionValid = await verifyPatientSession();
                    if (isSessionValid) {
                        router.push(destinationPath);
                    }
                } finally {
                    setIsCheckingSession(false);
                }
            })();
        };

        const onPopState = () => {
            void verifyPatientSession();
        };

        const onPageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                void verifyPatientSession();
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

        clearPatientClientSession();

        router.push("/login");
    };

    return (
        <div className="w-full py-4 px-4 sm:px-6 shadow-md bg-white dark:bg-gray-800">
            {isCheckingSession && (
                <div className="fixed inset-0 z-50 bg-black/25 flex items-center justify-center">
                    <div className="rounded-lg bg-white dark:bg-gray-800 shadow-lg px-5 py-3 text-sm font-semibold text-gray-800 dark:text-gray-100">
                        Checking session...
                    </div>
                </div>
            )}
            <div className="flex items-center justify-between">
                <Link
                    href="/user-self/dashboard"
                    className="text-2xl font-bold text-gray-800 dark:text-white flex items-center justify-between"
                >
                    <img src="/images/logo-main.png" alt="NexClinic Logo" className="h-8 w-8 mr-4" />
                    NexClinic
                </Link>

                <button
                    type="button"
                    className="lg:hidden inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-800 dark:text-white"
                    onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                    aria-label="Toggle navigation menu"
                    aria-expanded={isMobileMenuOpen}
                >
                    <span className="text-lg">{isMobileMenuOpen ? "x" : "☰"}</span>
                </button>

                <div
                    title="links-buttons-desktop"
                    className="hidden lg:flex items-center gap-4"
                >
                    <div
                        title="navigation-links"
                        className="flex flex-wrap text-[16px] gap-4"
                    >
                        <Link
                            href="/user-self/dashboard"
                            className={`${isActive("/user-self/dashboard") ? "text-green-600 dark:text-green-400 font-bold underline underline-offset-2" : "text-gray-800 dark:text-white hover:underline underline-offset-2"}`}
                        >
                            Dashboard
                        </Link>
                        <Link
                            href="/doctors"
                            className={`${isActive("/doctors") ? "text-green-600 dark:text-green-400 font-bold underline underline-offset-2" : "text-gray-800 dark:text-white hover:underline underline-offset-2"}`}
                        >
                            Doctors
                        </Link>

                        <Link
                            href="/user-self/appointments"
                            className={`${isActive("/user-self/appointments") ? "text-green-600 dark:text-green-400 font-bold underline underline-offset-2" : "text-gray-800 dark:text-white hover:underline underline-offset-2"}`}
                        >
                            Appointments
                        </Link>
                        <Link
                            href="/user-self/chats"
                            className={`${isActive("/user-self/chats") ? "text-green-600 dark:text-green-400 font-bold underline underline-offset-2" : "text-gray-800 dark:text-white hover:underline underline-offset-2"}`}
                        >
                            Chats
                        </Link>
                        <Link
                            href="/user-self/profile"
                            className={`${isActive("/user-self/profile") ? "text-green-600 dark:text-green-400 font-bold underline underline-offset-2" : "text-gray-800 dark:text-white hover:underline underline-offset-2"}`}
                        >
                            My Profile
                        </Link>
                        <Link
                            href="/user-self/prescriptions"
                            className={`${isActive("/user-self/prescriptions") ? "text-green-600 dark:text-green-400 font-bold underline underline-offset-2" : "text-gray-800 dark:text-white hover:underline underline-offset-2"}`}
                        >
                            Prescriptions
                        </Link>

                        <Link
                            href="/news-articles"
                            className={`${isActive("/news-articles") ? "text-green-600 dark:text-green-400 font-bold underline underline-offset-2" : "text-gray-800 dark:text-white hover:underline underline-offset-2"}`}
                        >
                            News
                        </Link>
                    </div>

                    <div title="log-sign-buttons" className="flex gap-3">
                        <BlackButton onClick={handleLogout}>Logout</BlackButton>
                    </div>
                </div>
            </div>

            <div
                title="links-buttons-mobile"
                className={`${isMobileMenuOpen ? "flex" : "hidden"} lg:hidden flex-col gap-3 border-t border-gray-200 dark:border-gray-700 mt-4 pt-4`}
            >
                <Link
                    href="/user-self/dashboard"
                    className={`${isActive("/user-self/dashboard") ? "text-green-600 dark:text-green-400 font-bold" : "text-gray-800 dark:text-white"}`}
                >
                    Dashboard
                </Link>
                <Link
                    href="/doctors"
                    className={`${isActive("/doctors") ? "text-green-600 dark:text-green-400 font-bold" : "text-gray-800 dark:text-white"}`}
                >
                    Doctors
                </Link>
                <Link
                    href="/user-self/appointments"
                    className={`${isActive("/user-self/appointments") ? "text-green-600 dark:text-green-400 font-bold" : "text-gray-800 dark:text-white"}`}
                >
                    Appointments
                </Link>
                <Link
                    href="/user-self/chats"
                    className={`${isActive("/user-self/chats") ? "text-green-600 dark:text-green-400 font-bold" : "text-gray-800 dark:text-white"}`}
                >
                    Chats
                </Link>
                <Link
                    href="/user-self/profile"
                    className={`${isActive("/user-self/profile") ? "text-green-600 dark:text-green-400 font-bold" : "text-gray-800 dark:text-white"}`}
                >
                    My Profile
                </Link>
                <Link
                    href="/user-self/prescriptions"
                    className={`${isActive("/user-self/prescriptions") ? "text-green-600 dark:text-green-400 font-bold" : "text-gray-800 dark:text-white"}`}
                >
                    Prescriptions
                </Link>
                <Link
                    href="/news-articles"
                    className={`${isActive("/news-articles") ? "text-green-600 dark:text-green-400 font-bold" : "text-gray-800 dark:text-white"}`}
                >
                    News and Articles
                </Link>
                <BlackButton onClick={handleLogout} className="w-full">
                    Logout
                </BlackButton>
            </div>
        </div>
    );
}
