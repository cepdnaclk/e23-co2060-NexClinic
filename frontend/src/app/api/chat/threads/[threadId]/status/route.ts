import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type RouteParams = {
  params: Promise<{
    threadId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { threadId } = await context.params;
    const body = JSON.stringify(await request.json().catch(() => ({})));

    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/chat/threads/${threadId}/status/`,
      method: "PATCH",
      body,
      contentType: "application/json",
      failureMessage: "Failed to update chat thread status",
    });
  } catch (error) {
    console.error("Chat thread status API error", error);
    return NextResponse.json(
      { error: "An error occurred while updating chat thread status" },
      { status: 500 },
    );
  }
}
