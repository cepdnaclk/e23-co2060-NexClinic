import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type RouteParams = {
  params: Promise<{
    threadId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { threadId } = await context.params;
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/chat/threads/${threadId}/messages/`,
      method: "GET",
      failureMessage: "Failed to fetch chat messages",
    });
  } catch (error) {
    console.error("Chat messages API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching chat messages" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const { threadId } = await context.params;
    const body = JSON.stringify(await request.json().catch(() => ({})));

    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/chat/threads/${threadId}/messages/`,
      method: "POST",
      body,
      contentType: "application/json",
      failureMessage: "Failed to send chat message",
    });
  } catch (error) {
    console.error("Chat messages API error", error);
    return NextResponse.json(
      { error: "An error occurred while sending chat message" },
      { status: 500 },
    );
  }
}
