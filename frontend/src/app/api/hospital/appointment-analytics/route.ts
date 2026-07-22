import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/hospital/appointment-analytics/`,
      method: "GET",
      failureMessage: "Failed to fetch appointment analytics",
    });
  } catch (error) {
    console.error("Appointment analytics API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching appointment analytics" },
      { status: 500 },
    );
  }
}
