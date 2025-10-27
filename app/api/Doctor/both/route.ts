import { NextRequest, NextResponse } from 'next/server';
import User from "@/app/(models)/User";
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';

connect();

export async function GET(request: NextRequest) {
  try {
    // Use the authorizedMiddleware and handle its response
    const authResponse = await authorizedMiddleware(request);
    
    // If the middleware returns a response (meaning there was an error), return it
    if (authResponse instanceof NextResponse) {
      return authResponse;
    }

    // Get the user from the request object - use more defensive access
    const user = (request as any)?.user;

    // Check if user exists and has an id
    if (!user?.id) {
      console.error('User not found in request:', user);
      return NextResponse.json({ message: 'User not found or unauthorized' }, { status: 401 });
    }


    // Get the logged-in user's branch with type assertion
    const loggedInUser = await User.findById(user.id).select('branch').lean() as any;

    if (!loggedInUser) {
      console.error('User not found in database for ID:', user.id);
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }


    // If the logged-in user doesn't have a branch, return empty array
    if (!loggedInUser.branch) {
      return NextResponse.json([], { status: 200 });
    }

    // Fetch employees (doctors and nurses) that belong to the same branch as the logged-in user
    const doctors = await User.find({ 
      role: { $in: ['doctor', 'nurse'] },
      branch: loggedInUser.branch 
    }).select('-password').exec(); // Exclude password field for security

    console.log(`Found ${doctors.length} doctors/nurses for branch ${loggedInUser.branch}`);

    return NextResponse.json(doctors, { status: 200 });
    
  } catch (error) {
    console.error('Error while fetching employees:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch employees',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}