import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.search;
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/hospital/patients/${query}`.replace(
        /\?$/,
        ""
      ),
      method: "GET",
      failureMessage: "Failed to fetch patients",
    });
  } catch (error) {
    console.error("Patients API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching patients" },
      { status: 500 }
    );
  }
}
