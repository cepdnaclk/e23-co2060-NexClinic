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
      endpoint: `${BACKEND_URL}/api/hospital/appointments/${appointmentId}/accept-cancellation/`,
      method: "PATCH",
      failureMessage: "Failed to accept cancellation request",
    });
  } catch (error) {
    console.error("Accept cancellation API error", error);
    return NextResponse.json(
      { error: "An error occurred while accepting cancellation request" },
      { status: 500 },
    );
  }
}
