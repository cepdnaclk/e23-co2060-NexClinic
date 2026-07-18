import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/notifications/${id}/mark_read/`,
      method: "PATCH",
      failureMessage: "Failed to mark notification as read",
    });
  } catch (error) {
    console.error("Mark read API error", error);
    return NextResponse.json({ error: "An error occurred while marking notification as read" }, { status: 500 });
  }
}
