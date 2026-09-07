import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> },
) {
  try {
    const { appointmentId } = await params;
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/hospital/appointments/${appointmentId}/cancel/`,
      method: "PATCH",
      failureMessage: "Failed to cancel appointment",
    });
  } catch (error) {
    console.error("Cancel appointment API error", error);
    return NextResponse.json(
      { error: "An error occurred while cancelling appointment" },
      { status: 500 },
    );
  }
}
