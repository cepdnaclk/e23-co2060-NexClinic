import { NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_: Request, context: RouteParams) {
  try {
    const { id } = await context.params;

    const backendResponse = await fetch(`${BACKEND_URL}/api/doctor/directory/${id}/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    const payload = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: payload?.detail || payload?.error || "Failed to fetch doctor" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Doctor directory detail API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching doctor profile" },
      { status: 500 }
    );
  }
}
