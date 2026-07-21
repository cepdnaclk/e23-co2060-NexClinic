import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/notifications/hospital/send_announcement/`,
      method: "POST",
      body: formData as any,
      failureMessage: "Failed to send announcement",
    });
  } catch (error) {
    console.error("Send announcement API error", error);
    return NextResponse.json({ error: "An error occurred while sending the announcement" }, { status: 500 });
  }
}
