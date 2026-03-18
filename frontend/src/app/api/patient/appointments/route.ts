import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.toString();
    const endpoint = query ? `${BACKEND_URL}/api/patient/appointments/?${query}` : `${BACKEND_URL}/api/patient/appointments/`;

    return await proxyBackendWithRefresh({
      request,
      endpoint,
      method: "GET",
      failureMessage: "Failed to fetch appointments",
    });
  } catch (error) {
    console.error("Patient appointments API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching appointments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/patient/appointments/`,
      method: "POST",
      body,
      successStatus: 201,
      failureMessage: "Failed to book appointment",
    });
  } catch (error) {
    console.error("Patient appointment booking API error", error);
    return NextResponse.json(
      { error: "An error occurred while booking appointment" },
      { status: 500 }
    );
  }
}
