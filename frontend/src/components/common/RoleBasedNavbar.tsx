"use client";

import { useEffect, useState } from "react";
import MainNavbar from "@/components/HomePage/MainNavbar";
import DoctorNavBar from "@/components/doctor/DoctorNavBar";
import UserDashboardNavbar from "@/components/user/UserDashboardNavbar";

type AppRole = "DOCTOR" | "PATIENT" | "GUEST";

type StoredUserInfo = {
  role?: string;
  email?: string;
};

function clearStaleClientAuthState() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userInfo");
  localStorage.removeItem("user");
  localStorage.removeItem("isAuthenticated");

  document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
  document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
  document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
}

function resolveRoleFromStorage(): AppRole {
  const authToken = localStorage.getItem("authToken");
  const storedRole = localStorage.getItem("userRole");

  if (!authToken && !storedRole) {
    return "GUEST";
  }

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

async function verifyStoredRole(role: AppRole): Promise<AppRole> {
  if (role === "GUEST") {
    return "GUEST";
  }

  const endpoint = role === "DOCTOR" ? "/api/doctor/profile" : "/api/patient/profile";

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      cache: "no-store",
    });

    if (response.ok) {
      return role;
    }

    if (response.status === 401 || response.status === 403) {
      clearStaleClientAuthState();
      return "GUEST";
    }

    return role;
  } catch {
    // Keep current role on transient network failures.
    return role;
  }
}

function getInitialRole(): AppRole {
  if (typeof window === "undefined") {
    return "GUEST";
  }

  return resolveRoleFromStorage();
}

export default function RoleBasedNavbar() {
  const [role, setRole] = useState<AppRole>("GUEST");
  const [isMounted, setIsMounted] = useState(false);
  const [isResolvingRole, setIsResolvingRole] = useState<boolean>(true);

  useEffect(() => {
    let isActive = true;
    setIsMounted(true);

    const resolveRole = async () => {
      const storedRole = resolveRoleFromStorage();

      // Render using local auth state immediately to avoid navbar flicker.
      if (isActive) {
        setRole((prev) => (prev === storedRole ? prev : storedRole));
        setIsResolvingRole(false);
      }

      const verifiedRole = await verifyStoredRole(storedRole);

      if (!isActive) {
        return;
      }

      if (verifiedRole !== storedRole) {
        setRole(verifiedRole);
      }
    };

    void resolveRole();

    return () => {
      isActive = false;
    };
  }, []);

  // Keep server/client initial render deterministic to avoid hydration mismatch.
  if (!isMounted || isResolvingRole) {
    return <MainNavbar />;
  }

  if (role === "DOCTOR") {
    return <DoctorNavBar />;
  }

  if (role === "PATIENT") {
    return <UserDashboardNavbar />;
  }

  return <MainNavbar />;
}
