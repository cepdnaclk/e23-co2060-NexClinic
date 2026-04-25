import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/users/resend-otp/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const contentType = backendResponse.headers.get("content-type") || "";
    const data = contentType.includes("application/json")
      ? await backendResponse.json()
      : { error: await backendResponse.text() };

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data?.error || "Resend failed" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Resend OTP error", error);
    return NextResponse.json(
      { error: "An error occurred during resend" },
      { status: 500 }
    );
  }
}
