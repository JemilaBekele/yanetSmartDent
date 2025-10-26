import { NextRequest, NextResponse } from 'next/server';

import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import Disease from '@/app/(models)/disease';
connect();


// Create a new medical finding
export async function POST(request: NextRequest) {
  await authorizedMiddleware(request);

  try {
  
    const requestBody = await request.json();
    const { disease } = requestBody;

    // Check if disease is missing
    if (!disease) {
      return NextResponse.json({ error: "Missing required fields: disease" }, { status: 400 });
    }


    if (typeof request === 'object' && request !== null && 'user' in request) {
      const user = (request as { user: { id: string; username: string } }).user;
      console.log("User Data:", user);
      const existingDisease = await Disease.findOne({ disease });
      if (existingDisease) {
        return NextResponse.json(
          { error: "Disease already exists" },
          { status: 400 }
        );
      }
      // Create new Disease
      const newdisease= new Disease({
        disease,
        createdBy: {
          id: user.id,
          username: user.username,
        },
      });

      const savedDisease = await newdisease.save();


    

      return NextResponse.json({
        message: "Disease created successfully",
        success: true,
        data: savedDisease,
      });
    } else {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error creating Card:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



export async function GET(request: NextRequest ) {
  await authorizedMiddleware(request);

  try {
 
   
    const Diseases = await Disease.find({})
    // Return the sorted medical findings
    return NextResponse.json({
      message: "Orgnazation retrieved successfully",
      success: true,
      data: Diseases,
    });
  } catch (error) {
    console.error("Error retrieving Disease:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}