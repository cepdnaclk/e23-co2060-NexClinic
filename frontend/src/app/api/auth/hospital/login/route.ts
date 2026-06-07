import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

async function readLoginPayload(request: NextRequest) {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    return null;
  }

  try {
    return JSON.parse(rawBody) as { username?: string; password?: string };
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await readLoginPayload(request);
    const username = payload?.username;
    const password = payload?.password;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/users/hospital-admin/login/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: username, password }),
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => null);
      return NextResponse.json(
        { error: errorData?.detail || "Login failed" },
        { status: backendResponse.status }
      );
    }

    const tokenData = await backendResponse.json();
    const role = tokenData.role || "HOSPITAL_ADMIN";

    const response = NextResponse.json(
      {
        token: tokenData.access,
        refreshToken: tokenData.refresh,
        user: {
          email: username,
          role,
          hospitals: tokenData.hospitals || [],
        },
      },
      { status: 200 }
    );

    applyAuthCookies(response, {
      accessToken: tokenData.access,
      role,
      refreshToken: tokenData.refresh,
    });

    return response;
  } catch (error) {
    console.error("Hospital login API error", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
