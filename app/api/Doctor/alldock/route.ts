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
 


    // Fetch doctors that belong to the same branch as the logged-in user
    const doctors = await User.find({ 
      role: 'doctor', 
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