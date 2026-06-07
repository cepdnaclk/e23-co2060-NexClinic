import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/admin/hospitals/`,
      method: "GET",
      failureMessage: "Failed to fetch hospitals",
    });
  } catch (error) {
    console.error("Hospital admin hospitals API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching hospitals" },
      { status: 500 }
    );
  }
}