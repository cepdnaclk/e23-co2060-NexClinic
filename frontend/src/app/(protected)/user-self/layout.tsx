"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import UserSidebar from "@/components/user/UserSidebar";
import UserDashboardNavbar from "@/components/user/UserDashboardNavbar";

export default function UserProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        const authToken = localStorage.getItem("authToken");
        const userRole = localStorage.getItem("userRole");
        const userData = localStorage.getItem("userInfo") || localStorage.getItem("user");
        const legacyAuthStatus = localStorage.getItem("isAuthenticated");

        const isPatientAuthenticated = Boolean(
            (authToken && userRole === "PATIENT" && userData) ||
            (legacyAuthStatus === "true" && userData)
        );

        if (isPatientAuthenticated) {
            setIsAuthenticated(true);
        } else {
            router.replace("/login");
        }
        setLoading(false);
    }, [router]);

    useEffect(() => {
        setIsSidebarOpen(false);
    }, [pathname]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl font-semibold">Loading...</div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return (
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="hidden lg:block">
                <UserSidebar />
            </div>

            {isSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        type="button"
                        aria-label="Close sidebar"
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setIsSidebarOpen(false)}
                    />
                    <div className="absolute left-0 top-0 h-full">
                        <UserSidebar />
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden">
                <UserDashboardNavbar />
                <div className="lg:hidden px-3 py-2 bg-white border-b border-gray-200">
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-3 py-2 text-sm font-semibold text-white"
                    >
                        <span>☰</span>
                        <span>Menu</span>
                    </button>
                </div>
                <main className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-purple-50">
                    {children}
                </main>
            </div>
        </div>
    );
}