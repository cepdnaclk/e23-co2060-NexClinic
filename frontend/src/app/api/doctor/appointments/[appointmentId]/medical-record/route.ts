import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type RouteParams = {
  params: Promise<{
    appointmentId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { appointmentId } = await context.params;

    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/appointments/${appointmentId}/medical-record/`,
      method: "GET",
      failureMessage: "Failed to fetch medical record",
    });
  } catch (error) {
    console.error("Doctor medical record API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching medical record" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { appointmentId } = await context.params;
    const body = JSON.stringify(await request.json().catch(() => ({})));

    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/appointments/${appointmentId}/medical-record/`,
      method: "POST",
      body,
      contentType: "application/json",
      failureMessage: "Failed to save medical record",
    });
  } catch (error) {
    console.error("Doctor medical record save API error", error);
    return NextResponse.json(
      { error: "An error occurred while saving medical record" },
      { status: 500 },
    );
  }
}
