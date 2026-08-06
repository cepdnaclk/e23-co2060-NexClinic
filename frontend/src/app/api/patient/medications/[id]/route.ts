import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/patient/medications/${id}/`,
      method: "DELETE",
      failureMessage: "Failed to delete medication",
    });
  } catch (error) {
    console.error("Patient medications API error", error);
    return NextResponse.json(
      { error: "An error occurred while deleting medication" },
      { status: 500 },
    );
  }
}
