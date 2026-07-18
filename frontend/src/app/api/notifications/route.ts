import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    
    let endpoint = `${BACKEND_URL}/api/notifications/`;
    if (type) {
      endpoint += `?type=${type}`;
    }

    return await proxyBackendWithRefresh({
      request,
      endpoint,
      method: "GET",
      failureMessage: "Failed to fetch notifications",
    });
  } catch (error) {
    console.error("Fetch notifications API error", error);
    return NextResponse.json({ error: "An error occurred while fetching notifications" }, { status: 500 });
  }
}
