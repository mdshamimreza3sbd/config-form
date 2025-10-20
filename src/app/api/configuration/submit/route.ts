import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import Configuration from "@/models/Configuration";
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

    // Validate required fields
    const requiredFields = [
      "restaurantName",
      "outletName",
      "saPassword",
      "nonSaUsername",
      "nonSaPassword",
    ];

    for (const field of requiredFields) {
      if (!data[field] || data[field].trim() === "") {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Create configuration document
    const configuration = await Configuration.create({
      userId: payload.userId,
      username: payload.username,
      restaurantName: data.restaurantName,
      outletName: data.outletName,
      saPassword: data.saPassword,
      nonSaUsername: data.nonSaUsername,
      nonSaPassword: data.nonSaPassword,
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
    });

    return NextResponse.json(
      {
        message: "Configuration submitted successfully",
        configuration: {
          id: configuration._id,
          restaurantName: configuration.restaurantName,
          outletName: configuration.outletName,
          createdAt: configuration.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Configuration submission error:", error);
    return NextResponse.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
