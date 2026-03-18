import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type RouteParams = {
  params: {
    appointmentId: string;
  };
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { appointmentId } = params;
    const body = await request.json().catch(() => ({}));

    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/appointments/${appointmentId}/action/`,
      method: "PATCH",
      body,
      failureMessage: "Failed to update appointment status",
    });
  } catch (error) {
    console.error("Doctor appointment action API error", error);
    return NextResponse.json(
      { error: "An error occurred while updating appointment status" },
      { status: 500 }
    );
  }
}
