import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const body = JSON.stringify(await request.json().catch(() => ({})));
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/patient/reminders/${id}/`,
      method: "PATCH",
      body,
      contentType: "application/json",
      failureMessage: "Failed to update reminder",
    });
  } catch (error) {
    console.error("Patient reminder update error", error);
    return NextResponse.json(
      { error: "An error occurred while updating reminder" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/patient/reminders/${id}/`,
      method: "DELETE",
      failureMessage: "Failed to delete reminder",
    });
  } catch (error) {
    console.error("Patient reminder delete error", error);
    return NextResponse.json(
      { error: "An error occurred while deleting reminder" },
      { status: 500 },
    );
  }
}
