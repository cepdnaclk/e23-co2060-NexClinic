import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/appointment-slots/`,
      method: "GET",
      failureMessage: "Failed to fetch appointment slots",
    });
  } catch (error) {
    console.error("Doctor appointment slots API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching appointment slots" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/appointment-slots/`,
      method: "POST",
      body,
      successStatus: 201,
      failureMessage: "Failed to create appointment slots",
    });
  } catch (error) {
    console.error("Doctor appointment slot creation API error", error);
    return NextResponse.json(
      { error: "An error occurred while creating appointment slots" },
      { status: 500 }
    );
  }
}
