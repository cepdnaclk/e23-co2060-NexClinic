"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DoctorNavBar from "@/components/doctor/DoctorNavBar";

export default function DoctorProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const authToken = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
    const userData = typeof window !== "undefined" ? (localStorage.getItem("userInfo") || localStorage.getItem("user")) : null;

    const isDoctorAuthenticated = Boolean(
      authToken && userRole === "DOCTOR" && userData
    );

    if (isDoctorAuthenticated) {
      setIsAuthenticated(true);
    } else {
      router.replace("/doctor/login");
    }
    setLoading(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-xl font-semibold text-emerald-700 animate-pulse">Loading workspace...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <DoctorNavBar />
      {children}
    </div>
  );
}
