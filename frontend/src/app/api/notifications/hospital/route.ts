import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/notifications/hospital/`,
      method: "GET",
      failureMessage: "Failed to fetch announcements",
    });
  } catch (error) {
    console.error("Fetch announcements API error", error);
    return NextResponse.json({ error: "An error occurred while fetching announcements" }, { status: 500 });
  }
}
