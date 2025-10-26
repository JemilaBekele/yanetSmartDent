import User from "@/app/(models)/User";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connect } from "@/app/lib/mongodb";
import { authorizedMiddleware } from "@/app/helpers/authentication";

connect();

// Define the request body type for changing the password
interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  userId: string; // Changed from phone to userId
}



export async function POST(request: NextRequest) {
  try {
    // Ensure the user is authorized
    await authorizedMiddleware(request);

    // Parse request body
    const data = await request.json();
    
    const { currentPassword, newPassword, userId } = data as PasswordChangeData;

    // Validate input fields
    if (!currentPassword || !newPassword || !userId) {
      return NextResponse.json({ message: "All fields are required." }, { status: 400 });
    }

    // Find user by userId without lean()
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // Check if the current password matches the stored hashed password
    const isPasswordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordMatch) {
      return NextResponse.json({ message: "Current password is incorrect." }, { status: 403 });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password in the database
    await User.updateOne({ _id: userId }, { password: hashedNewPassword });

    return NextResponse.json({ message: "Password changed successfully." }, { status: 200 });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error", error }, { status: 500 });
  }
}
