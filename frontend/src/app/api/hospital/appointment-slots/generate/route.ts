import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/admin/appointment-slots/generate/`,
      method: "POST",
      body: await request.text(),
      contentType: request.headers.get("content-type") || "application/json",
      failureMessage: "Failed to generate appointment slots",
    });
  } catch (error) {
    console.error("Hospital appointment slot generation API error", error);
    return NextResponse.json({ error: "An error occurred while generating appointment slots" }, { status: 500 });
  }
}