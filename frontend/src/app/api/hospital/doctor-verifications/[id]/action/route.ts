import { NextRequest, NextResponse } from "next/server";
import { proxyBackendWithRefresh } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Resolve params which can be a Promise or flat object depending on Next.js version
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const body = JSON.stringify(await request.json().catch(() => ({})));

    return await proxyBackendWithRefresh({
      request,
      endpoint: `${BACKEND_URL}/api/doctor/admin/doctor-verifications/${id}/action/`,
      method: "PATCH",
      body,
      contentType: "application/json",
      failureMessage: "Failed to perform action on doctor verification request",
    });
  } catch (error) {
    console.error("Doctor verification action API error", error);
    return NextResponse.json(
      { error: "An error occurred while updating the verification request" },
      { status: 500 }
    );
  }
}
