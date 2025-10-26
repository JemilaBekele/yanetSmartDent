import {  NextRequest, NextResponse } from 'next/server';
import User from "@/app/(models)/User";
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
connect();



export async function GET(request: NextRequest) {
  authorizedMiddleware(request);
    try {
      // Fetch all categories from the database


      const doctors = await User.find({ role: 'doctor' }).exec();
  
      return NextResponse.json(doctors, { status: 200 });
    } catch (error) {
      console.error('Error while user user:', error);
      return NextResponse.json({ message: 'Failed to fetch user' }, { status: 500 });
    }
  }
  