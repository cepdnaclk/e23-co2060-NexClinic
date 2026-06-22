import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/hospital-requests/`,
      method: "GET",
      failureMessage: "Failed to fetch hospital requests",
    });
  } catch (error) {
    console.error("Doctor hospital requests GET API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching hospital requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = JSON.stringify(await request.json().catch(() => ({})));

    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/hospital-requests/`,
      method: "POST",
      body,
      contentType: "application/json",
      failureMessage: "Failed to submit hospital link request",
    });
  } catch (error) {
    console.error("Doctor hospital requests POST API error", error);
    return NextResponse.json(
      { error: "An error occurred while submitting the request" },
      { status: 500 }
    );
  }
}
