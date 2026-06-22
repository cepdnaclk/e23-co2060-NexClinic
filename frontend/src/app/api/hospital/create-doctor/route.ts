import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/hospital/create-doctor/`,
      method: "POST",
      body: JSON.stringify(body),
      contentType: "application/json",
      failureMessage: "Failed to create doctor account",
    });
  } catch (error) {
    console.error("Create doctor API error", error);
    return NextResponse.json({ error: "An error occurred while creating the doctor account" }, { status: 500 });
  }
}

