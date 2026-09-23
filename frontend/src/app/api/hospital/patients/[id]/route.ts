import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/hospital/patients/${id}/`,
      method: "GET",
      failureMessage: "Failed to fetch patient",
    });
  } catch (error) {
    console.error("Patient API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching patient" },
      { status: 500 }
    );
  }
}
