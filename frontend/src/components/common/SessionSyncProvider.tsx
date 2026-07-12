"use client";

import { useEffect } from "react";

let isRedirecting = false;

function getLoginPath(): string {
  const pathname = window.location.pathname;
  if (pathname.startsWith("/hospital")) return "/hospital/login";
  if (pathname.startsWith("/doctor")) return "/doctor/login";
  return "/login";
}

function handleGlobalSessionExpired() {
  if (isRedirecting) return;
  isRedirecting = true;

  // Clear client-side session storage
  localStorage.removeItem("authToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userInfo");
  localStorage.removeItem("user");
  localStorage.removeItem("isAuthenticated");

  // Clear cookies from the client side (httpOnly ones are cleared by the server via Set-Cookie)
  document.cookie = "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
  document.cookie = "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";
  document.cookie = "refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; samesite=lax";

  const loginPath = getLoginPath();
  window.alert("Your session has expired. Please login again.");
  window.location.href = loginPath;
}

/**
 * Determines if a 401 response from our own Next.js API routes represents a
 * genuine "session expired" event (as opposed to a wrong-password or other
 * auth-related 401 that should NOT cause a full session logout).
 *
 * We only trigger logout when:
 * 1. The request is to one of our own /api/* proxy routes (not to the backend directly).
 * 2. The response body contains our known "Session expired" error message.
 */
async function isSessionExpiredResponse(
  urlStr: string,
  clonedResponse: Response
): Promise<boolean> {
  // Only handle calls to our own Next.js API routes.
  if (!urlStr.startsWith("/api/") && !urlStr.includes(window.location.origin + "/api/")) {
    return false;
  }

  // Auth routes themselves (login, register, otp) can legitimately return 401
  // without meaning the session is expired.
  const authRoutes = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/verify-otp",
    "/api/auth/resend-otp",
    "/api/auth/logout",
    "/api/auth/reset-password",
    "/api/doctor/login",
    "/api/hospital/login",
  ];
  if (authRoutes.some((r) => urlStr.includes(r))) {
    return false;
  }

  // Inspect the body to confirm our server sent the "Session expired" marker.
  try {
    const data = await clonedResponse.json();
    const errorMsg = String(data?.error || "").toLowerCase();
    return errorMsg.includes("session expired") || errorMsg.includes("please login again");
  } catch {
    return false;
  }
}

export default function SessionSyncProvider() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch;

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const response = await originalFetch(input, init);

      // Skip processing if we're already redirecting to avoid cascading calls.
      if (isRedirecting) return response;

      // Sync a refreshed access token if the server sent one.
      const newToken = response.headers.get("X-Auth-Token");
      if (newToken) {
        localStorage.setItem("authToken", newToken);
      }

      // Only inspect 401 responses from our own /api routes.
      if (response.status === 401) {
        const urlStr =
          typeof input === "string"
            ? input
            : input instanceof URL
            ? input.toString()
            : input.url;

        // Skip if we're already on a public/auth page.
        const onPublicPage =
          window.location.pathname === "/" ||
          window.location.pathname === "/login" ||
          window.location.pathname === "/doctor/login" ||
          window.location.pathname === "/hospital/login" ||
          window.location.pathname === "/register" ||
          window.location.pathname.startsWith("/news-articles") ||
          window.location.pathname.startsWith("/doctors/");

        if (!onPublicPage) {
          // Clone the response so we can read its body without consuming it.
          const cloned = response.clone();
          const expired = await isSessionExpiredResponse(urlStr, cloned);
          if (expired) {
            handleGlobalSessionExpired();
          }
        }
      }

      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return null;
}
