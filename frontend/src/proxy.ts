import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const parseTokenExpiry = (token?: string): number | null => {
  if (!token) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length < 2) {
    return null;
  }

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
    const payload = JSON.parse(atob(padded));

    return typeof payload?.exp === "number" ? payload.exp : null;
  } catch {
    return null;
  }
};

const isExpired = (token?: string): boolean => {
  const exp = parseTokenExpiry(token);
  if (!exp) {
    return true;
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  return nowInSeconds >= exp;
};

const redirectToLogin = (request: NextRequest, loginPath: string) => {
  const response = NextResponse.redirect(new URL(loginPath, request.url));

  response.cookies.set("authToken", "", {
    path: "/",
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  response.cookies.set("refreshToken", "", {
    path: "/",
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
  response.cookies.set("userRole", "", {
    path: "/",
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return response;
};

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loginPath = pathname.startsWith("/doctor-self") ? "/doctor/login" : "/login";

  const authToken = request.cookies.get("authToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;
  const userRole = request.cookies.get("userRole")?.value;

  if (!authToken) {
    return redirectToLogin(request, loginPath);
  }

  if (isExpired(authToken) && (!refreshToken || isExpired(refreshToken))) {
    return redirectToLogin(request, loginPath);
  }

  if (pathname.startsWith("/doctor-self") && userRole !== "DOCTOR") {
    return redirectToLogin(request, "/doctor/login");
  }

  if (pathname.startsWith("/user-self") && userRole !== "PATIENT") {
    return redirectToLogin(request, "/login");
  }

  if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
    return redirectToLogin(request, "/login");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/doctor-self/:path*", "/user-self/:path*", "/admin/:path*"],
};
