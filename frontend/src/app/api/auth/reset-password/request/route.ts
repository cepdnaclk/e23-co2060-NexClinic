import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: NextRequest) {
    

    try {
        const { email } = await request.json();
        
        if (!email) {
            return NextResponse.json({error: "Email is required"}, {status: 400});

        }

        const backendResponse = await fetch(`${BACKEND_URL}/api/users/password-reset/request/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        const data = await backendResponse.json().catch(() => ({}));

        return NextResponse.json(
            data,
            {status: backendResponse.status}
        );

    } catch (error) {
        console.error("Reset request API error", error);
        return NextResponse.json(
            { error: "An error occurred while requesting password reset." },
            { status: 500 }

        );
        
    }

}