import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  try {
    const { doctorId } = await params;
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/hospital/doctor-fees/${doctorId}/`,
      method: "GET",
      failureMessage: "Failed to fetch doctor fees",
    });
  } catch (error) {
    console.error("Doctor fees GET API error", error);
    return NextResponse.json({ error: "An error occurred while fetching doctor fees" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ doctorId: string }> }
) {
  try {
    const { doctorId } = await params;
    const body = await request.json();
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/hospital/doctor-fees/${doctorId}/`,
      method: "PATCH",
      body: JSON.stringify(body),
      contentType: "application/json",
      failureMessage: "Failed to update doctor fees",
    });
  } catch (error) {
    console.error("Doctor fees PATCH API error", error);
    return NextResponse.json({ error: "An error occurred while updating doctor fees" }, { status: 500 });
  }
}
