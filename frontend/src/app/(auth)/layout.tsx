"use client";

import { usePathname } from "next/navigation";
import DoctorLoginNavBar from "@/components/doctor/DoctorLoginNavBar";
import VerifyOTPNavBar from "@/components/HomePage/VerifyOTPNavBar";
import UserLoginNavBar from "@/components/user/UserLoginNavBar";
import UserRegistrationNavBar from "@/components/user/UserRegistrationNavBar";

function AuthNavbar() {
  const pathname = usePathname();

  if (pathname === "/doctor/login") {
    return <DoctorLoginNavBar />;
  }

  if (pathname === "/login") {
    return <UserLoginNavBar />;
  }

  if (pathname === "/register") {
    return <UserRegistrationNavBar />;
  }

  if (pathname === "/verify-otp") {
    return <VerifyOTPNavBar />;
  }

  return null;
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="fixed w-full top-0 left-0 z-50">
        <AuthNavbar />
      </div>
      {children}
    </>
  );
}
