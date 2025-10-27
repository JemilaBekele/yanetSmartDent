import User from "@/app/(models)/User";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connect } from "@/app/lib/mongodb";

// Initialize MongoDB connection
connect();

interface PasswordRequest {
  password: string;
}

export async function POST(request: NextRequest) {

  try {
    const { password } = (await request.json()) as PasswordRequest;

    // Validate input
    if (!password?.trim()) {
      console.warn("[Locked Auth] Empty password provided");
      return NextResponse.json(
        { success: false, message: "Password is required" },
        { status: 400 }
      );
    }

    // Find the single locked user
    const lockedUser = await User.findOne({ role: "Locked" }).select("+password");

    if (!lockedUser) {
      return NextResponse.json(
        { success: false, message: "System lock not configured" },
        { status: 404 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, lockedUser.password);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" }, // Generic message for security
        { status: 403 }
      );
    }

    // Successful authentication
    return NextResponse.json(
      { 
        success: true, 
        message: "Verification successful",
        user: {
          id: lockedUser._id,
          role: lockedUser.role
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[Locked Auth] Server error:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: "Authentication service unavailable",
        error: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}