import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.toString();
    const endpoint = query ? `${BACKEND_URL}/api/patient/appointment-slots/?${query}` : `${BACKEND_URL}/api/patient/appointment-slots/`;

    return await proxyBackendWithRefresh({
      request,
      endpoint,
      method: "GET",
      failureMessage: "Failed to fetch available slots",
    });
  } catch (error) {
    console.error("Patient appointment slots API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching available slots" },
      { status: 500 }
    );
  }
}
