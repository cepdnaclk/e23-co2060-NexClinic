import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type RouteParams = {
  params: Promise<{
    slotId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { slotId } = await context.params;
    const body = await request.json().catch(() => ({}));

    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/appointment-slots/${slotId}/`,
      method: "PATCH",
      body,
      failureMessage: "Failed to update appointment slot",
    });
  } catch (error) {
    console.error("Doctor appointment slot update API error", error);
    return NextResponse.json(
      { error: "An error occurred while updating appointment slot" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const { slotId } = await context.params;

    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/appointment-slots/${slotId}/`,
      method: "DELETE",
      failureMessage: "Failed to delete appointment slot",
    });
  } catch (error) {
    console.error("Doctor appointment slot delete API error", error);
    return NextResponse.json(
      { error: "An error occurred while deleting appointment slot" },
      { status: 500 }
    );
  }
}
