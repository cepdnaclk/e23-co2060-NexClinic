import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/hospital/manage-doctor/`,
      method: "POST",
      body: JSON.stringify(body),
      contentType: "application/json",
      failureMessage: "Failed to manage doctor",
    });
  } catch (error) {
    console.error("Manage doctor API error", error);
    return NextResponse.json({ error: "An error occurred while managing the doctor" }, { status: 500 });
  }
}

