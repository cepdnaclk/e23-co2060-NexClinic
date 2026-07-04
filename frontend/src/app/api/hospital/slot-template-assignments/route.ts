import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = url.search ? `?${url.searchParams.toString()}` : "";
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/admin/slot-template-assignments/${query}`.replace(/\?$/, ""),
      method: "GET",
      failureMessage: "Failed to fetch slot template assignments",
    });
  } catch (error) {
    console.error("Slot template assignments fetch error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching slot template assignments" },
      { status: 500 }
    );
  }
}
