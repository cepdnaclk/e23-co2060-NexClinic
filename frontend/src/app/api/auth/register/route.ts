import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

function extractErrorMessage(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const errorPayload = payload as Record<string, unknown>;
    const message =
      errorPayload.error || errorPayload.detail || errorPayload.message;

    if (typeof message === "string") {
      return message;
    }

    return JSON.stringify(payload);
  }

  return "Registration failed";
}

// Patient/User registration endpoint (default registration)
export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();

    const backendResponse = await fetch(`${BACKEND_URL}/api/users/register/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: extractErrorMessage(data) },
        { status: backendResponse.status },
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Patient registration error", error);
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 },
    );
  }
}
