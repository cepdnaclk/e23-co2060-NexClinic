import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET() {
  try {
    const backendResponse = await fetch(`${BACKEND_URL}/api/hospital/active/`, {
      method: "GET",
      cache: "no-store",
    });

    const data = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: data || "Failed to load hospitals" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (error) {
    console.error("Active hospitals proxy error", error);
    return NextResponse.json(
      { error: "An error occurred while loading hospitals" },
      { status: 500 }
    );
  }
}