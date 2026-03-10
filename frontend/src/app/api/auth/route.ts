import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        const backendResponse = await fetch(
            `${BACKEND_URL}/api/users/login/`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            }
        );

        if (!backendResponse.ok) {
            const errorData = await backendResponse.json().catch(() => ({}));
            return NextResponse.json(
                { error: errorData?.detail || "Login failed" },
                { status: backendResponse.status }
            );
        }

        const tokenData = await backendResponse.json();
        const role = tokenData.role || "PATIENT";

        const response = NextResponse.json(
            {
                token: tokenData.access,
                refreshToken: tokenData.refresh,
                user: {
                    email,
                    role,
                },
            },
            { status: 200 }
        );

        response.cookies.set("authToken", tokenData.access, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        response.cookies.set("userRole", role, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        return response;
    } catch (error) {
        console.error("Auth API error", error);
        return NextResponse.json(
            { error: "An error occurred during login" },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        { message: "Auth API is working" },
        { status: 200 }
    );
}