"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UserSidebar from "@/components/user/UserSidebar";
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
        // Check if user is authenticated
        const authStatus = localStorage.getItem("isAuthenticated");
        const userData = localStorage.getItem("user");

        if (authStatus === "true" && userData) {
            setIsAuthenticated(true);
        } else {
            // Redirect to login if not authenticated
            router.push("/login");
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
        <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <UserSidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <UserDashboardNavbar />
                <main className="flex-1 overflow-y-auto bg-gradient-to-br from-blue-50 via-white to-purple-50">
                    {children}
                </main>
            </div>
        </div>
    );
}