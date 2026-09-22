import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/patient/reminders/`,
      method: "GET",
      failureMessage: "Failed to fetch reminders",
    });
  } catch (error) {
    console.error("Patient reminders API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching reminders" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = JSON.stringify(await request.json().catch(() => ({})));
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/patient/reminders/`,
      method: "POST",
      body,
      contentType: "application/json",
      failureMessage: "Failed to add reminder",
    });
  } catch (error) {
    console.error("Patient reminders API error", error);
    return NextResponse.json(
      { error: "An error occurred while adding reminder" },
      { status: 500 },
    );
  }
}
