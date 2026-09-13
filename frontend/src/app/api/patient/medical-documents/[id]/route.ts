import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/patient/medical-documents/${params.id}/`,
      method: "GET",
      failureMessage: "Failed to fetch medical document",
    });
  } catch (error) {
    console.error("Patient medical document GET error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching medical document" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/patient/medical-documents/${params.id}/`,
      method: "DELETE",
      failureMessage: "Failed to delete medical document",
    });
  } catch (error) {
    console.error("Patient medical document DELETE error", error);
    return NextResponse.json(
      { error: "An error occurred while deleting the medical document" },
      { status: 500 },
    );
  }
}
