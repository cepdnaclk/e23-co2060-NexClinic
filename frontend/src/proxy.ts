import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const authToken = request.cookies.get("authToken")?.value;
  const userRole = request.cookies.get("userRole")?.value;

  if (!authToken) {
    const loginUrl = new URL(pathname.startsWith("/doctor-self") ? "/doctor/login" : "/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname.startsWith("/doctor-self") && userRole !== "DOCTOR") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/user-self") && userRole !== "PATIENT") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/doctor-self/:path*", "/user-self/:path*", "/admin/:path*"],
};
