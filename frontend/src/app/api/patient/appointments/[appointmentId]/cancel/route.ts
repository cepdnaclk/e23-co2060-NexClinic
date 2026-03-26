import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type RouteParams = {
  params: Promise<{
    appointmentId: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { appointmentId } = await context.params;

    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/patient/appointments/${appointmentId}/cancel/`,
      method: "PATCH",
      failureMessage: "Failed to cancel appointment",
    });
  } catch (error) {
    console.error("Patient appointment cancel API error", error);
    return NextResponse.json(
      { error: "An error occurred while cancelling appointment" },
      { status: 500 }
    );
  }
}
