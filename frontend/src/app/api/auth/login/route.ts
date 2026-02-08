import { NextRequest, NextResponse } from "next/server";

// Simple demo login API for learning purposes
// POST /api/auth/login
// Body: { username: string, password: string }

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    // Demo: hardcoded user credentials
    const demoUser = {
      id: 1,
      username: "testuser",
      email: "test@example.com",
      role: "user",
    } as const;

    const isValid = username === "testuser" && password === "password123";

    if (!isValid) {
      return NextResponse.json(
        { message: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Demo token – in real code this would be a signed JWT
    const token = "demo-token-123";

    return NextResponse.json(
      {
        token,
        user: demoUser,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login API error", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
