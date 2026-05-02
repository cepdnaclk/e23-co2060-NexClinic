import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
    try {
        const { uid, token, new_password } = await request.json();

        if (!uid || !token || !new_password) {
            return NextResponse.json(
                { error: "uid, token and new_password are required" },
                { status: 400 }
            );
        }

        const backendResponse = await fetch(`${BACKEND_URL}/api/users/password-reset/confirm/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ uid, token, new_password }),
        });

        const data = await backendResponse.json().catch(() => ({}));

        return NextResponse.json(
            data,
            { status: backendResponse.status }
        );
    } catch (error) {
        console.error("Reset confirm API error", error);
        return NextResponse.json(
            { error: "An error occurred while resetting password." },
            { status: 500 }
        );
    }
}