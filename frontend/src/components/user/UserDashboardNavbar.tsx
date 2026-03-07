"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import BlackButton from "../buttons/BlackButton";

export default function UserDashboardNavbar() {
    const router = useRouter();
    const pathname = usePathname();
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

        localStorage.removeItem("authToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userInfo");
        localStorage.removeItem("user");
        localStorage.removeItem("isAuthenticated");

        document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
        document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";

        router.push("/login");
    };

    return (
        <div className="w-full py-4 px-4 sm:px-6 shadow-md bg-white dark:bg-gray-800">
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
                    className="md:hidden inline-flex items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-gray-800 dark:text-white"
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
                className={`${isMobileMenuOpen ? "flex" : "hidden"} md:hidden flex-col gap-3 border-t border-gray-200 dark:border-gray-700 mt-4 pt-4`}
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
