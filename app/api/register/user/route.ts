import User from "@/app/(models)/User";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connect } from "@/app/lib/mongodb";

// Initialize MongoDB connection
connect();

interface PasswordRequest {
  password: string;
}

interface CheckedUser {
  phone: string;
  isExpired: boolean;
  deadlinetime: Date | null;
  lock: boolean;
}

export async function POST(request: NextRequest) {

  try {
    const requestBody = await request.json();
    
    const { password } = requestBody as PasswordRequest;
    
    const phone = "0911000001";

    // Find user by phone
    const user = await User.findOne({ phone }).select("+password +deadlinetime +lock");
    
    if (user) {
      console.log("[User Expiry Check] User details:", {
        id: user._id,
        phone: user.phone,
        role: user.role,
        deadlinetime: user.deadlinetime,
        lock: user.lock,
        hasPassword: !!user.password
      });
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if the user is expired
    const now = new Date();
    
    const isExpired = user.deadlinetime && new Date(user.deadlinetime) < now;
  

    if (!isExpired && !user.lock) {
      return NextResponse.json(
        {
          success: true,
          message: "User is not expired or locked",
          user: {
            id: user._id,
            role: user.role,
          },
        },
        { status: 200 }
      );
    }


    // If expired or locked, validate password
    if (!password?.trim()) {
      return NextResponse.json(
        { success: false, message: "Password required for expired or locked user" },
        { status: 401 }
      );
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 403 }
      );
    }


    // Password correct: Extend deadlinetime by 5 years and unlock user
    const newDeadline = new Date(now.getTime() + 5 * 365 * 24 * 60 * 60 * 1000); // 5 years from now
    
    user.deadlinetime = newDeadline;
    user.lock = false;
    
    await user.save();

    return NextResponse.json(
      {
        success: true,
        message: "Expired or locked user unlocked, deadline extended",
        user: {
          id: user._id,
          role: user.role,
          deadlinetime: user.deadlinetime,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {

    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  } finally {
    console.log("=== [User Expiry Check] POST Request Completed ===");
  }
}

export async function GET(request: NextRequest) {

  try {
    const now = new Date();

    // Find all users with role "User", and include deadlinetime and lock fields
    const users = await User.find({ role: "User" }).select("phone deadlinetime lock");

    const updatedUsers: CheckedUser[] = [];
    let lockedCount = 0;
    let expiredCount = 0;

    for (const user of users) {

      const isExpired = user.deadlinetime && new Date(user.deadlinetime).getTime() < now.getTime();

      // Lock if expired and not already locked
      if (isExpired && !user.lock) {
        user.lock = true;
        await user.save();
        lockedCount++;
      } else if (isExpired) {
        console.log(`[Check Expiry] User ${user.phone} is expired but already locked`);
        expiredCount++;
      } else {
        console.log(`[Check Expiry] User ${user.phone} is not expired`);
      }

      updatedUsers.push({
        phone: user.phone,
        isExpired,
        deadlinetime: user.deadlinetime,
        lock: user.lock,
      });
    }


    return NextResponse.json({
      success: true,
      users: updatedUsers,
      summary: {
        totalUsers: users.length,
        lockedUsers: lockedCount,
        expiredUsers: expiredCount
      }
    });
  } catch (error: any) {
    
    return NextResponse.json(
      {
        success: false,
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  } finally {
    console.log("=== [Check Expiry] GET Request Completed ===");
  }
}