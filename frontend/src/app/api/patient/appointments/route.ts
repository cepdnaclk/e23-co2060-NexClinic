import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const getAuthToken = (request: NextRequest) => request.cookies.get("authToken")?.value;

export async function GET(request: NextRequest) {
  try {
    const authToken = getAuthToken(request);

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = url.searchParams.toString();
    const endpoint = query ? `${BACKEND_URL}/api/patient/appointments/?${query}` : `${BACKEND_URL}/api/patient/appointments/`;

    const backendResponse = await fetch(endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      cache: "no-store",
    });

    const payload = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: payload?.detail || payload?.error || "Failed to fetch appointments" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    console.error("Patient appointments API error", error);
    return NextResponse.json(
      { error: "An error occurred while fetching appointments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const authToken = getAuthToken(request);

    if (!authToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));

    const backendResponse = await fetch(`${BACKEND_URL}/api/patient/appointments/`, {
      method: "POST",
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
        { error: payload?.detail || payload?.error || "Failed to book appointment" },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    console.error("Patient appointment booking API error", error);
    return NextResponse.json(
      { error: "An error occurred while booking appointment" },
      { status: 500 }
    );
  }
}
