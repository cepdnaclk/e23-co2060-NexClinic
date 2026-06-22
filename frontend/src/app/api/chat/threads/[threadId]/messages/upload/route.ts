import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest, context: { params: Promise<{ threadId: string }> }) {
  try {
    const { threadId } = await context.params;
    const formData = await request.formData();
    
    // We pass the formData body directly, and leave contentType undefined 
    // so fetch auto-generates the multipart boundary
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/chat/threads/${threadId}/messages/upload/`,
      method: "POST",
      body: formData as any,
      failureMessage: "Failed to upload attachment",
    });
  } catch (error) {
    console.error("Chat upload API error", error);
    return NextResponse.json({ error: "An error occurred" }, { status: 500 });
  }
}
