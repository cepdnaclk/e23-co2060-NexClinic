"use client";

import DoctorNavBar from "@/components/doctor/DoctorNavBar";

export default function DoctorProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <DoctorNavBar />
      {children}
    </div>
  );
}
