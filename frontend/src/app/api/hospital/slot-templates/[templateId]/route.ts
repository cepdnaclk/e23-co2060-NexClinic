import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function PATCH(request: NextRequest, context: { params: Promise<{ templateId: string }> }) {
  try {
    const { templateId } = await context.params;
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/admin/slot-templates/${templateId}/`,
      method: "PATCH",
      body: await request.text(),
      contentType: request.headers.get("content-type") || "application/json",
      failureMessage: "Failed to update slot template",
    });
  } catch (error) {
    console.error("Hospital slot template update API error", error);
    return NextResponse.json({ error: "An error occurred while updating slot template" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ templateId: string }> }) {
  try {
    const { templateId } = await context.params;
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/admin/slot-templates/${templateId}/`,
      method: "DELETE",
      failureMessage: "Failed to delete slot template",
    });
  } catch (error) {
    console.error("Hospital slot template delete API error", error);
    return NextResponse.json({ error: "An error occurred while deleting slot template" }, { status: 500 });
  }
}