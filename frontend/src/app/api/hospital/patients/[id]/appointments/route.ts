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
    const query = request.nextUrl.search;
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/hospital/patients/${id}/appointments/${query}`.replace(
        /\?$/,
        ""
      ),
      method: "GET",
      failureMessage: "Failed to fetch patient appointments",
    });
  } catch (error) {
    console.error("Patient appointments API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching patient appointments" },
      { status: 500 }
    );
  }
}
