import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/patient/profile/`,
      method: "GET",
      failureMessage: "Failed to fetch patient profile",
    });
  } catch (error) {
    console.error("Patient profile API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching profile data" },
      { status: 500 }
    );
  }
}
