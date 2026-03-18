import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Call Django backend doctor login endpoint
    // The CustomUser model uses email as USERNAME_FIELD
    const backendResponse = await fetch(
      `${BACKEND_URL}/api/users/doctor/login/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: username, // Django expects email as the login field
          password: password,
        }),
      }
    );

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      return NextResponse.json(
        { error: errorData?.detail || "Login failed" },
        { status: backendResponse.status }
      );
    }

    const tokenData = await backendResponse.json();
    const role = tokenData.role || "DOCTOR";

    // Return the token and user info to the frontend
    const response = NextResponse.json(
      {
        token: tokenData.access,
        refreshToken: tokenData.refresh,
        user: {
          email: username,
          role,
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
    console.error("Login API error", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    );
  }
}
