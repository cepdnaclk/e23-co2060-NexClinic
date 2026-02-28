"use client";

import { useEffect, useState } from "react";
import MainNavbar from "@/components/HomePage/MainNavbar";
import DoctorNavBar from "@/components/doctor/DoctorNavBar";

type AppRole = "DOCTOR" | "PATIENT" | "GUEST";

type StoredUserInfo = {
  role?: string;
  email?: string;
};

function resolveRoleFromStorage(): AppRole {
  const storedRole = localStorage.getItem("userRole");
  if (storedRole === "DOCTOR") {
    return "DOCTOR";
  }
  if (storedRole === "PATIENT") {
    return "PATIENT";
  }

  const rawUserInfo = localStorage.getItem("userInfo");
  if (!rawUserInfo) {
    return "GUEST";
  }

  try {
    const parsed = JSON.parse(rawUserInfo) as StoredUserInfo;
    if (parsed?.role === "DOCTOR") {
      return "DOCTOR";
    }
    if (parsed?.role === "PATIENT") {
      return "PATIENT";
    }
    return "PATIENT";
  } catch {
    return "GUEST";
  }
}

export default function RoleBasedNavbar() {
  const [role, setRole] = useState<AppRole>("GUEST");

  useEffect(() => {
    setRole(resolveRoleFromStorage());
  }, []);

  if (role === "DOCTOR") {
    return <DoctorNavBar />;
  }

  return <MainNavbar />;
}
