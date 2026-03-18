import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies } from "@/lib/serverAuthProxy";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
  const authToken = request.cookies.get("authToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (authToken && refreshToken) {
    try {
      await fetch(`${BACKEND_URL}/api/users/logout/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ refresh: refreshToken }),
        cache: "no-store",
      });
    } catch (error) {
      console.error("Backend logout API error", error);
    }
  }

  const response = NextResponse.json({ success: true }, { status: 200 });
  clearAuthCookies(response);

  return response;
}
