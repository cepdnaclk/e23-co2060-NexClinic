import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/notifications/preferences/`,
      method: "GET",
      failureMessage: "Failed to fetch notification preferences",
    });
  } catch (error) {
    console.error("Notification preferences API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching notification preferences" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/notifications/preferences/`,
      method: "PATCH",
      body: JSON.stringify(body),
      contentType: "application/json",
      failureMessage: "Failed to update notification preferences",
    });
  } catch (error) {
    console.error("Notification preferences API error", error);
    return NextResponse.json(
      { error: "An error occurred while updating notification preferences" },
      { status: 500 },
    );
  }
}
