import { NextRequest, NextResponse } from 'next/server';
import User from "@/app/(models)/User";
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';

connect();

// Define interface for user with branch
interface UserWithBranch {
  _id: unknown;
  branch?: string | null;
  __v?: number;
}

export async function GET(request: NextRequest) {

  try {
    
    // Middleware check for authorization
    const authResponse = await authorizedMiddleware(request);

    if (authResponse instanceof NextResponse) {
      return authResponse;
    }

    // Get the authenticated user from the request
    const user = (request as any)?.user;

    if (!user?.id) {
      return NextResponse.json({ error: "User not found or unauthorized" }, { status: 401 });
    }

    
    // Get the logged-in user's branch with proper typing
    const loggedInUser = await User.findById(user.id).select('branch').lean() as UserWithBranch;

    if (!loggedInUser) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }


    // If the logged-in user doesn't have a branch, return empty array
    if (!loggedInUser.branch) {
      console.log("No branch assigned to user");
      return NextResponse.json([], { status: 200 });
    }

    // Fetch doctors that belong to the same branch as the logged-in user
    const doctors = await User.find({ 
      role: 'doctor', 
      branch: loggedInUser.branch 
    }).exec();

    
    return NextResponse.json(doctors, { status: 200 });
    
  } catch (error) {
    console.error('Error while fetching doctors:', error);
    return NextResponse.json(
      { message: 'Failed to fetch doctors', error: (error as Error).message },
      { status: 500 }
    );
  }
}