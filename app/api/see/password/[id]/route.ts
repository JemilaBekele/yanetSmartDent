import { NextRequest, NextResponse } from 'next/server';
import User from "@/app/(models)/User";
import { connect } from "@/app/lib/mongodb";
import bcrypt from 'bcrypt'; // For password hashing
import { authorizedMiddleware } from '@/app/helpers/authentication';
 // Import ObjectId to use for MongoDB

// Connect to MongoDB
connect();

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
   authorizedMiddleware(request);
  const { id } = params;

  const { currentPassword, newPassword } = await request.json(); // Get data from the request

  // Validate input
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: 'All fields are required.' }, { status: 400 });
  }

  try {
    // Find the user in the database
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: 'User not found.' }, { status: 404 });
    }

    // Compare current password with the hashed password in the database
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Current password is incorrect.' }, { status: 401 });
    }

    // Hash the new password before saving
    const hashedPassword = await bcrypt.hash(newPassword, 3);
    user.password = hashedPassword;

    // Save the updated user object
    await user.save();

    return NextResponse.json({ message: 'Password changed successfully!' }, { status: 200 });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 });
  }
}
