import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/users/login/verify-otp/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, otp }),
    });

    const contentType = backendResponse.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await backendResponse.json()
      : { error: await backendResponse.text() };

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data?.error || data?.detail || "Verification failed" },
        { status: backendResponse.status }
      );
    }

    const userRole = data.role || "PATIENT";
    const response = NextResponse.json(
      {
        token: data.access,
        refreshToken: data.refresh,
        user: {
          email: data.email || email,
          role: userRole,
        },
      },
      { status: 200 }
    );

    applyAuthCookies(response, {
      accessToken: data.access,
      role: userRole,
      refreshToken: data.refresh,
    });

    return response;
  } catch (error) {
    console.error("Login Verify OTP error", error);
    return NextResponse.json(
      { error: "An error occurred during verification" },
      { status: 500 }
    );
  }
}
