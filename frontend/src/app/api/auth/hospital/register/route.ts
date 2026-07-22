import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

async function readPayload(request: NextRequest) {
  const rawBody = await request.text();
  if (!rawBody.trim()) return null;
  try { return JSON.parse(rawBody); } catch { return null; }
}

function extractErrorMessage(payload: unknown): string {
  if (typeof payload === "string") {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const errorPayload = payload as Record<string, unknown>;
    const message =
      errorPayload.error || errorPayload.detail || errorPayload.message;

    if (typeof message === "string") {
      return message;
    }

    if (Array.isArray(message) && message.length > 0) {
      if (typeof message[0] === "string") return message[0];
      return JSON.stringify(message[0]);
    }

    const errorMessages: string[] = [];
    for (const [key, value] of Object.entries(errorPayload)) {
      if (key === "status" || key === "code") continue;

      let cleanKey = key;
      if (key === "non_field_errors") {
        cleanKey = "";
      } else {
        cleanKey =
          key
            .replace(/_/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase()) + ": ";
      }

      if (typeof value === "string") {
        errorMessages.push(`${cleanKey}${value}`);
      } else if (Array.isArray(value)) {
        const msgs = value
          .filter((v): v is string => typeof v === "string")
          .join(" ");
        if (msgs) {
          errorMessages.push(`${cleanKey}${msgs}`);
        }
      } else if (value && typeof value === "object") {
        const nested = extractErrorMessage(value);
        if (nested) {
          errorMessages.push(`${cleanKey}${nested}`);
        }
      }
    }

    if (errorMessages.length > 0) {
      return errorMessages.join(" ");
    }

    return JSON.stringify(payload);
  }

  return "Registration failed";
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
      return NextResponse.json({ error: extractErrorMessage(data) }, { status: backendResponse.status });
    }

    return NextResponse.json(data || { email: payload.email }, { status: 200 });
  } catch (err) {
    console.error('Hospital register proxy error', err);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}
