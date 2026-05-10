"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserDashboardNavbar from "@/components/user/UserDashboardNavbar";

export default function UserProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

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
        <div className="flex h-screen bg-gradient-to-br from-[#eef8f4] via-[#f7fcfa] to-white">
            <div className="flex-1 flex flex-col overflow-hidden">
                <UserDashboardNavbar />
                <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[#eff9f5] via-white to-[#f5fbf8]">
                    {children}
                </main>
            </div>
        </div>
    );
}