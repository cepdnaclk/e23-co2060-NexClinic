import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

async function readPayload(request: NextRequest) {
  const rawBody = await request.text();
  if (!rawBody.trim()) return null;
  try { return JSON.parse(rawBody); } catch { return null; }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await readPayload(request);
    if (!payload) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

    const backendResponse = await fetch(
      `${BACKEND_URL}/api/users/hospital-admin/register/`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const data = await backendResponse.json().catch(() => null);
    if (!backendResponse.ok) {
      return NextResponse.json({ error: data || 'Registration failed' }, { status: backendResponse.status });
    }

    return NextResponse.json(data || { email: payload.email }, { status: 200 });
  } catch (err) {
    console.error('Hospital register proxy error', err);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
