import { NextRequest, NextResponse } from "next/server";
import { applyAuthCookies } from "@/lib/serverAuthProxy";

export async function POST(request: NextRequest) {
  try {
    const { access, refresh, role } = await request.json();

    if (!access) {
      return NextResponse.json({ error: 'access token required' }, { status: 400 });
    }

    const response = NextResponse.json({ ok: true }, { status: 200 });
    applyAuthCookies(response, { accessToken: access, refreshToken: refresh, role });
    return response;
  } catch (err) {
    console.error('Set tokens error', err);
    return NextResponse.json({ error: 'Unable to set tokens' }, { status: 500 });
  }
}
