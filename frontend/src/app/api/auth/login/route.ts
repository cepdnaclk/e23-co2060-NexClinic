import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

async function readLoginPayload(request: NextRequest) {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as { username?: string; password?: string, role?: string };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await readLoginPayload(request);
    const username = payload?.username;
    const password = payload?.password;
    const role = payload?.role;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Route to correct backend endpoint based on role
    let loginEndpoint = "/api/users/login/";
    if (role === "HOSPITAL_ADMIN") {
      loginEndpoint = "/api/users/hospital-admin/login/";
    } else if (role === "DOCTOR") {
      loginEndpoint = "/api/users/doctor/login/";
    }

    const backendResponse = await fetch(
      `${BACKEND_URL}${loginEndpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: username,
          password: password,
        }),
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => null);
      return NextResponse.json(
        { error: errorData?.detail || errorData?.error || "Login failed" },
        { status: backendResponse.status }
      );
    }

    const tokenData = await backendResponse.json();

    if (tokenData.otp_required) {
      return NextResponse.json(
        {
          otp_required: true,
          email: tokenData.email,
        },
        { status: 200 }
      );
    }

    const userRole = tokenData.role || role || "PATIENT";

    const response = NextResponse.json(
      {
        token: tokenData.access,
        refreshToken: tokenData.refresh,
        user: {
          email: username,
          role: userRole,
        },
      },
      { status: 200 }
    );

    applyAuthCookies(response, {
      accessToken: tokenData.access,
      role: userRole,
      refreshToken: tokenData.refresh,
    });

    return response;
  } catch (error) {
    console.error("Login API error", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}