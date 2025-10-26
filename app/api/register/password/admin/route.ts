import User from "@/app/(models)/User";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connect } from "@/app/lib/mongodb";
import { authorizedMiddleware } from "@/app/helpers/authentication";

connect();

// Define the request body type for resetting the password
interface PasswordResetData {
  newPassword: string;
  userId: string; // User ID whose password will be reset
}



export async function POST(request: NextRequest) {
  try {
    // Ensure the user is authorized (admin check can be added here)
    await authorizedMiddleware(request);
    
    if (typeof request === 'object' && request !== null && 'user' in request) {
        const user = (request as { user: { id: string; username: string ; role: string} }).user; // Type assertion for user
        
    // Ensure the user is an admin
    if (user.role !== 'admin') {
      return NextResponse.json({ message: "Unauthorized." }, { status: 403 });
    }

    // Parse request body
    const data = await request.json();
    
    const { newPassword, userId } = data as PasswordResetData;

    // Validate input fields
    if (!newPassword || !userId) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    // Find user by userId
    const userToReset = await User.findById(userId);
    if (!userToReset) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    await User.updateOne({ _id: userId }, { password: hashedNewPassword });

    return NextResponse.json({ message: "Password reset successfully." }, { status: 200 });

  }} catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error", error }, { status: 500 });
  }
}
