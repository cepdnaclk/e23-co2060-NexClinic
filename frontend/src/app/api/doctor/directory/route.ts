import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/doctor/directory/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const payload = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: payload?.detail || payload?.error || "Failed to fetch doctors" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Doctor directory API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching doctor directory" },
      { status: 500 }
    );
  }
}
