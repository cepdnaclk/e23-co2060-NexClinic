import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function DELETE(request: NextRequest, context: { params: Promise<{ assignmentId: string }> }) {
  try {
    const { assignmentId } = await context.params;
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/admin/slot-template-assignments/${assignmentId}/`,
      method: "DELETE",
      failureMessage: "Failed to delete slot template assignment",
    });
  } catch (error) {
    console.error("Delete slot template assignment error", error);
    return NextResponse.json(
      { error: "An error occurred while deleting slot template assignment" },
      { status: 500 }
    );
  }
}
