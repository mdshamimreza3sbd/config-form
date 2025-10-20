import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Form from "@/models/Form";
import { verifyRequest } from "@/lib/jwt";

export async function POST(request: NextRequest) {
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

    const data = await request.json();

    // Extract IP address from request headers
    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    // Validate required fields
    const requiredFields = [
      "restaurantName",
      "outletName",
      "saPassword",
    ];

    for (const field of requiredFields) {
      if (!data[field] || data[field].trim() === "") {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Validate nonSaCredentials array
    if (!data.nonSaCredentials || !Array.isArray(data.nonSaCredentials) || data.nonSaCredentials.length === 0) {
      return NextResponse.json(
        { error: "At least one Non-SA credential is required" },
        { status: 400 }
      );
    }

    // Validate each Non-SA credential
    for (let i = 0; i < data.nonSaCredentials.length; i++) {
      const credential = data.nonSaCredentials[i];
      if (!credential.username || credential.username.trim() === "") {
        return NextResponse.json(
          { error: `Non-SA credential #${i + 1}: Username is required` },
          { status: 400 }
        );
      }
      if (!credential.password || credential.password.trim() === "") {
        return NextResponse.json(
          { error: `Non-SA credential #${i + 1}: Password is required` },
          { status: 400 }
        );
      }
    }

    // Create form document
    const form = await Form.create({
      userId: payload.userId,
      username: payload.username,
      restaurantName: data.restaurantName,
      outletName: data.outletName,
      saPassword: data.saPassword,
      nonSaCredentials: data.nonSaCredentials,
      anydeskUsername: data.anydeskUsername || "",
      anydeskPassword: data.anydeskPassword || "",
      ultraviewerUsername: data.ultraviewerUsername || "",
      ultraviewerPassword: data.ultraviewerPassword || "",
      saPassChange: data.saPassChange || false,
      syncedUserPassChange: data.syncedUserPassChange || false,
      nonSaPassChange: data.nonSaPassChange || false,
      windowsAuthDisable: data.windowsAuthDisable || false,
      sqlCustomPort: data.sqlCustomPort || false,
      firewallOnAllPcs: data.firewallOnAllPcs || false,
      anydeskUninstall: data.anydeskUninstall || false,
      ultraviewerPassAndId: data.ultraviewerPassAndId || false,
      posAdminPassChange: data.posAdminPassChange || false,
      remarks: data.remarks || "",
      userAgent: data.userAgent || "",
      ipAddress: ipAddress,
    });

    return NextResponse.json(
      {
        message: "Form submitted successfully",
        form: {
          id: form._id,
          restaurantName: form.restaurantName,
          outletName: form.outletName,
          createdAt: form.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Form submission error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
