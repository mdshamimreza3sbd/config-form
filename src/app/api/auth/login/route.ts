import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { username, password } = await request.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password (plain text comparison)
    if (user.password !== password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
      },
      JWT_SECRET,
      {
        expiresIn: "7d", // Token expires in 7 days
      }
    );

    // Create response with token
    const response = NextResponse.json(
      {
        message: "Login successful",
        user: {
          id: user._id,
          username: user.username,
        },
        token,
      },
      { status: 200 }
    );

    // Set HTTP-only cookie with the token
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
