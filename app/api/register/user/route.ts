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
  console.log("=== [User Expiry Check] POST Request Started ===");
  console.log("[User Expiry Check] Request URL:", request.url);
  console.log("[User Expiry Check] Request method: POST");

  try {
    console.log("[User Expiry Check] Parsing request body...");
    const requestBody = await request.json();
    console.log("[User Expiry Check] Request body:", JSON.stringify(requestBody, null, 2));
    
    const { password } = requestBody as PasswordRequest;
    console.log("[User Expiry Check] Extracted password:", password ? "***" : "undefined");
    
    const phone = "0911000001";
    console.log("[User Expiry Check] Using hardcoded phone:", phone);

    // Find user by phone
    console.log(`[User Expiry Check] Searching for user with phone: ${phone}`);
    const user = await User.findOne({ phone }).select("+password +deadlinetime +lock");
    console.log(`[User Expiry Check] User lookup result:`, user ? "User found" : "User not found");
    
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
      console.log("[User Expiry Check] ERROR: User not found");
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check if the user is expired
    const now = new Date();
    console.log("[User Expiry Check] Current time:", now);
    console.log("[User Expiry Check] User deadline time:", user.deadlinetime);
    
    const isExpired = user.deadlinetime && new Date(user.deadlinetime) < now;
    console.log(`[User Expiry Check] Is user expired: ${isExpired}`);
    console.log(`[User Expiry Check] Is user locked: ${user.lock}`);

    if (!isExpired && !user.lock) {
      console.log("[User Expiry Check] User is not expired or locked - allowing access");
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

    console.log("[User Expiry Check] User is expired or locked - requiring password validation");

    // If expired or locked, validate password
    if (!password?.trim()) {
      console.log("[User Expiry Check] ERROR: Password required but not provided");
      return NextResponse.json(
        { success: false, message: "Password required for expired or locked user" },
        { status: 401 }
      );
    }

    console.log("[User Expiry Check] Starting password comparison...");
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(`[User Expiry Check] Password comparison result: ${isMatch}`);

    if (!isMatch) {
      console.log("[User Expiry Check] ERROR: Password does not match");
      return NextResponse.json(
        { success: false, message: "Invalid password" },
        { status: 403 }
      );
    }

    console.log("[User Expiry Check] Password validated successfully");

    // Password correct: Extend deadlinetime by 5 years and unlock user
    const newDeadline = new Date(now.getTime() + 5 * 365 * 24 * 60 * 60 * 1000); // 5 years from now
    console.log("[User Expiry Check] Setting new deadline:", newDeadline);
    
    user.deadlinetime = newDeadline;
    user.lock = false;
    
    console.log("[User Expiry Check] Saving updated user...");
    await user.save();
    console.log(`[User Expiry Check] SUCCESS: User ${phone} unlocked and deadlinetime extended to ${user.deadlinetime}`);

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
    console.error("[User Expiry Check] EXCEPTION:", error);
    console.error("[User Expiry Check] Error stack:", error.stack);
    console.error("[User Expiry Check] Error message:", error.message);
    
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
  console.log("=== [Check Expiry] GET Request Started ===");
  console.log("[Check Expiry] Request URL:", request.url);
  console.log("[Check Expiry] Request method: GET");

  try {
    const now = new Date();
    console.log("[Check Expiry] Current time:", now);

    // Find all users with role "User", and include deadlinetime and lock fields
    console.log("[Check Expiry] Searching for all users with role 'User'...");
    const users = await User.find({ role: "User" }).select("phone deadlinetime lock");
    console.log(`[Check Expiry] Found ${users.length} users with role 'User'`);

    const updatedUsers: CheckedUser[] = [];
    let lockedCount = 0;
    let expiredCount = 0;

    console.log("[Check Expiry] Starting user expiry check loop...");
    for (const user of users) {
      console.log(`[Check Expiry] Processing user: ${user.phone}`);
      console.log(`[Check Expiry] User ${user.phone} - deadline: ${user.deadlinetime}, lock: ${user.lock}`);

      const isExpired = user.deadlinetime && new Date(user.deadlinetime).getTime() < now.getTime();
      console.log(`[Check Expiry] User ${user.phone} is expired: ${isExpired}`);

      // Lock if expired and not already locked
      if (isExpired && !user.lock) {
        console.log(`[Check Expiry] User ${user.phone} is expired and not locked - locking user...`);
        user.lock = true;
        await user.save();
        lockedCount++;
        console.log(`[Check Expiry] SUCCESS: User ${user.phone} has been locked.`);
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

      console.log(`[Check Expiry] Completed processing user: ${user.phone}`);
    }

    console.log(`[Check Expiry] Summary: Total users: ${users.length}, Locked: ${lockedCount}, Expired: ${expiredCount}`);
    console.log("[Check Expiry] Final updated users array:", JSON.stringify(updatedUsers, null, 2));

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
    console.error("[Check Expiry GET] EXCEPTION:", error);
    console.error("[Check Expiry GET] Error stack:", error.stack);
    console.error("[Check Expiry GET] Error message:", error.message);
    
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