import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/patient/medications/`,
      method: "GET",
      failureMessage: "Failed to fetch medications",
    });
  } catch (error) {
    console.error("Patient medications API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching medications" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = JSON.stringify(await request.json().catch(() => ({})));
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/patient/medications/`,
      method: "POST",
      body,
      contentType: "application/json",
      failureMessage: "Failed to add medication",
    });
  } catch (error) {
    console.error("Patient medications API error", error);
    return NextResponse.json(
      { error: "An error occurred while adding medication" },
      { status: 500 },
    );
  }
}
