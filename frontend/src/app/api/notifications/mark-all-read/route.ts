import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/notifications/mark_all_read/`,
      method: "POST",
      failureMessage: "Failed to mark all notifications as read",
    });
  } catch (error) {
    console.error("Mark all notifications API error", error);
    return NextResponse.json(
      { error: "An error occurred while marking notifications as read" },
      { status: 500 },
    );
  }
}
