import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;

    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/directory/${id}/`,
      method: "GET",
      failureMessage: "Failed to fetch doctor",
    });
  } catch (error) {
    console.error("Doctor directory detail API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching doctor profile" },
      { status: 500 }
    );
  }
}
