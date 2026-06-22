import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest, context: { params: Promise<{ doctorId: string }> }) {
  try {
    const { doctorId } = await context.params;
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/chat/slots/doctor/${doctorId}/`,
      method: "GET",
      failureMessage: "Failed to fetch chat slots",
    });
  } catch (error) {
    console.error("Chat slots API error", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
