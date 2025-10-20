import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Configuration from "@/models/Configuration";
import { verifyRequest } from "@/lib/jwt";

export async function GET(request: NextRequest) {
  try {
    // Verify JWT token
    const payload = verifyRequest(request);
    if (!payload) {
      return NextResponse.json(
        { error: "Unauthorized. Please login again." },
        { status: 401 }
      );
    }

    await connectDB();

    // Get query parameters for pagination
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Fetch configurations for the user
    const configurations = await Configuration.find({ userId: payload.userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select("-__v");

    // Get total count for pagination
    const total = await Configuration.countDocuments({ userId: payload.userId });

    return NextResponse.json(
      {
        configurations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Configuration list error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
