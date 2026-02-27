import { NextRequest, NextResponse } from "next/server";

// Demo user credentials (in production, use a real database)
const DEMO_USERS = [
    {
        id: "1",
        email: "user@example.com",
        password: "password123",
        name: "John Doe",
        role: "member",
        profileImage: "https://i.pravatar.cc/150?img=12"
    },
    {
        id: "2",
        email: "patient@nexaura.com",
        password: "patient123",
        name: "Jane Smith",
        role: "member",
        profileImage: "https://i.pravatar.cc/150?img=5"
    }
];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Validate input
        if (!email || !password) {
            return NextResponse.json(
                { message: "Email and password are required" },
                { status: 400 }
            );
        }

        // Find user
        const user = DEMO_USERS.find(
            (u) => u.email === email && u.password === password
        );

        if (!user) {
            return NextResponse.json(
                { message: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Return user data (excluding password)
        const { password: _, ...userWithoutPassword } = user;
        
        return NextResponse.json(
            {
                message: "Login successful",
                user: userWithoutPassword
            },
            { status: 200 }
        );
    } catch (error) {
        return NextResponse.json(
            { message: "Internal server error" },
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