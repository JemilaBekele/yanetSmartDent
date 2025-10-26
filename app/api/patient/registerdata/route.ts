import {connect} from "@/app/lib/mongodb";
import Patient from "@/app/(models)/Patient";
import { NextRequest, NextResponse } from "next/server";
// Adjust the checkAuthenticationpath as needed
import {authorizedMiddleware} from "@/app/helpers/authentication"
import User from "@/app/(models)/User";
import mongoose from "mongoose";
import Branch from "@/app/(models)/branch";
connect();


export async function POST(request: NextRequest) {
  // Authorization Middleware
  await authorizedMiddleware(request);

  try {
    // Check if the request has a 'user' property
    if (typeof request === 'object' && request !== null && 'user' in request) {
      const user = (request as { user: { id: string; username: string } }).user;

      // Parsing the request body
      const reqBody = await request.json();
      
      // Use proper typing for the lean result
      const loggedInUser = await User.findById(user.id).select('branch').lean() as { 
        _id: unknown; 
        branch: string; 
        __v?: number;
      } | null;

      if (!loggedInUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Extract necessary fields from the body
      const { cardno, firstname, age, sex, phoneNumber, description, Town, KK, HNo, credit, Region, Woreda, disablity } = reqBody;

      // Add createdBy field based on authenticated user
      reqBody.createdBy = {
        id: user.id,
        username: user.username,
      };

      // ✅ FIXED: Check for existing patient by card number IN THE SAME BRANCH
      const existingCardNo = await Patient.findOne({ 
        cardno: cardno,
        branch: loggedInUser.branch // Check within the same branch only
      });
      
      if (existingCardNo) {
        return NextResponse.json({ 
          error: "Patient with this card number already exists in this branch" 
        }, { status: 400 });
      }

      // Create new patient
      const newPatient = new Patient({
        cardno,
        firstname,       
        age,
        sex,
        Town,
        KK,
        HNo,
        phoneNumber,
        description,
        credit,
        Region,
        Woreda, 
        disablity,
        createdBy: reqBody.createdBy,
        branch: loggedInUser.branch,
      });

      // Save new patient to database
      const savedPatient = await newPatient.save();
      return NextResponse.json({
        message: "Patient created successfully",
        success: true,
        savedPatient,
      });
    } else {
      // Handle case where user property is missing
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch (error) {
    // Log and handle error
    console.error("Error in POST /api/patient/registerdata", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



export async function GET(request: NextRequest) {
  const authResponse = await authorizedMiddleware(request);
  if (authResponse) {
    return authResponse;
  }

  try {
    await Branch.aggregate([{ $sample: { size: 1 } }]);
    
    // Get query parameters from URL
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const cardno = searchParams.get('cardno');
    const phone = searchParams.get('phone');
    const branch = searchParams.get('branch');
    const sex = searchParams.get('sex');

    // Build filter object
    const filter: any = {};

    // Filter by name (search in firstname)
    if (name) {
      filter.firstname = { $regex: name, $options: 'i' }; // Case-insensitive search
    }

    // Filter by card number
    if (cardno) {
      filter.cardno = { $regex: cardno, $options: 'i' }; // Case-insensitive search
    }

    // Filter by phone number
    if (phone) {
      filter.phoneNumber = { $regex: phone, $options: 'i' }; // Case-insensitive search
    }

    // Filter by branch (convert string to ObjectId if provided)
    if (branch) {
      if (branch === "no-branch") {
        filter.branch = { $exists: false }; // Patients with no branch assigned
      } else if (mongoose.Types.ObjectId.isValid(branch)) {
        filter.branch = new mongoose.Types.ObjectId(branch);
      } else {
        return NextResponse.json(
          { error: "Invalid branch ID format" },
          { status: 400 }
        );
      }
    }

    // Filter by sex
    if (sex && sex !== "all") {
      if (['male', 'female', 'none'].includes(sex.toLowerCase())) {
        filter.sex = sex.toLowerCase();
      } else {
        return NextResponse.json(
          { error: "Invalid sex value. Must be 'male', 'female', or 'none'" },
          { status: 400 }
        );
      }
    }

    console.log('Applied filters:', filter);

    // Fetch patients with applied filters
    const patients = await Patient.find(filter)
      .populate('branch') // Populate branch details if needed
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`Found ${patients.length} patients with the given filters`);

    return NextResponse.json(patients);

  } catch (error: unknown) {
    console.error("Error in GET /api/patient/registerdata", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}