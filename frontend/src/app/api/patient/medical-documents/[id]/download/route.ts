import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const authToken = request.cookies.get("authToken")?.value;

    if (!authToken) {
      return NextResponse.redirect(new URL("/unauthorized-access", request.url));
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/patient/medical-documents/${id}/download/`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      cache: "no-store",
    });

    if (!backendResponse.ok) {
        if (backendResponse.status === 401 || backendResponse.status === 403) {
            return NextResponse.redirect(new URL("/unauthorized-access", request.url));
        }
        return NextResponse.json({ error: "Failed to download document" }, { status: backendResponse.status });
    }

    // Forward the file stream to the client
    const headers = new Headers();
    const contentType = backendResponse.headers.get("content-type");
    const contentDisposition = backendResponse.headers.get("content-disposition");
    
    if (contentType) headers.set("Content-Type", contentType);
    if (contentDisposition) headers.set("Content-Disposition", contentDisposition);

    return new NextResponse(backendResponse.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Patient medical document download error", error);
    return NextResponse.json(
      { error: "An error occurred while downloading the medical document" },
      { status: 500 },
    );
  }
}
