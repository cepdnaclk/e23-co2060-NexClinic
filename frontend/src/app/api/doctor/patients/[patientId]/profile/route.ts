import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type RouteParams = {
  params: Promise<{
    patientId: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { patientId } = await context.params;

    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/patients/${patientId}/profile/`,
      method: "GET",
      failureMessage: "Failed to fetch patient profile",
    });
  } catch (error) {
    console.error("Doctor patient profile API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching patient profile" },
      { status: 500 }
    );
  }
}
