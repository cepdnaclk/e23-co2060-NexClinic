import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/admin/slot-templates/apply/`,
      method: "POST",
      body: JSON.stringify(body),
      contentType: "application/json",
      failureMessage: "Failed to apply slot templates",
    });
  } catch (error) {
    console.error("Apply slot templates API error", error);
    return NextResponse.json(
      { error: "An error occurred while applying slot templates" },
      { status: 500 }
    );
  }
}
