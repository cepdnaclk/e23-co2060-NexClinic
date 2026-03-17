import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

type RouteParams = {
  params: {
    appointmentId: string;
  };
};

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authToken = request.cookies.get("authToken")?.value;

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { appointmentId } = params;
    const body = await request.json().catch(() => ({}));

    const backendResponse = await fetch(`${BACKEND_URL}/api/doctor/appointments/${appointmentId}/reschedule/`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const payload = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: payload?.detail || payload?.error || "Failed to reschedule appointment" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Doctor appointment reschedule API error", error);
    return NextResponse.json(
      { error: "An error occurred while rescheduling appointment" },
      { status: 500 }
    );
  }
}
