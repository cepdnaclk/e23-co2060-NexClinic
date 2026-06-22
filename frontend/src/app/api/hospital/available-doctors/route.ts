import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = url.search ? `?${url.searchParams.toString()}` : "";
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/hospital/available-doctors/${query}`.replace(/\?$/, ""),
      method: "GET",
      failureMessage: "Failed to fetch available doctors",
    });
  } catch (error) {
    console.error("Available doctors API error", error);
    return NextResponse.json({ error: "An error occurred while fetching available doctors" }, { status: 500 });
  }
}
