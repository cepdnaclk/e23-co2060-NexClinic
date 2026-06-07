import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = url.search ? `?${url.searchParams.toString()}` : "";
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/admin/slot-templates/${query}`.replace(/\?$/, ""),
      method: "GET",
      failureMessage: "Failed to fetch slot templates",
    });
  } catch (error) {
    console.error("Hospital slot templates API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching slot templates" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/admin/slot-templates/`,
      method: "POST",
      body: JSON.stringify(body),
      contentType: "application/json",
      failureMessage: "Failed to create slot template",
    });
  } catch (error) {
    console.error("Hospital slot templates creation API error", error);
    return NextResponse.json(
      { error: "An error occurred while creating slot template" },
      { status: 500 }
    );
  }
}
