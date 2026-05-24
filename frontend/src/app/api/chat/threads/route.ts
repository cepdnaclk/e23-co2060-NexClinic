import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/chat/threads/`,
      method: "GET",
      failureMessage: "Failed to fetch chat threads",
    });
  } catch (error) {
    console.error("Chat threads API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching chat threads" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = JSON.stringify(await request.json().catch(() => ({})));

    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/chat/threads/`,
      method: "POST",
      body,
      contentType: "application/json",
      failureMessage: "Failed to open chat thread",
    });
  } catch (error) {
    console.error("Chat threads API error", error);
    return NextResponse.json(
      { error: "An error occurred while opening chat thread" },
      { status: 500 },
    );
  }
}
