import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = url.search ? `?${url.searchParams.toString()}` : "";
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/hospital/activity-logs/${query}`.replace(/\?$/, ""),
      method: "GET",
      failureMessage: "Failed to fetch activity logs",
    });
  } catch (error) {
    console.error("Hospital activity logs API error", error);
    return NextResponse.json({ error: "An error occurred while fetching activity logs" }, { status: 500 });
  }
}
