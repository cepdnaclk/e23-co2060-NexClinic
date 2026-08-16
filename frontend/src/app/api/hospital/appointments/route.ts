import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const query = request.nextUrl.search;
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/hospital/appointments/${query}`.replace(
        /\?$/,
        "",
      ),
      method: "GET",
      failureMessage: "Failed to fetch hospital appointments",
    });
  } catch (error) {
    console.error("Hospital appointments API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching hospital appointments" },
      { status: 500 },
    );
  }
}
