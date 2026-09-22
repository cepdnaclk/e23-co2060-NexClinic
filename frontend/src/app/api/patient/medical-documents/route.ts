import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(request: NextRequest) {
  try {
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/patient/medical-documents/`,
      method: "GET",
      failureMessage: "Failed to fetch medical documents",
    });
  } catch (error) {
    console.error("Patient medical documents GET error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching medical documents" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type");
    let body: BodyInit | null = null;
    let forwardedContentType: string | null = "application/json";

    if (contentType?.includes("multipart/form-data")) {
      body = await request.formData();
      forwardedContentType = null; // Let fetch automatically set the correct boundary
    } else {
      body = JSON.stringify(await request.json().catch(() => ({})));
    }

    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/patient/medical-documents/`,
      method: "POST",
      body,
      contentType: forwardedContentType,
      failureMessage: "Failed to upload medical document",
    });
  } catch (error) {
    console.error("Patient medical documents POST error", error);
    return NextResponse.json(
      { error: "An error occurred while uploading the medical document" },
      { status: 500 },
    );
  }
}
