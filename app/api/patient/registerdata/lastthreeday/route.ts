import Patient from "@/app/(models)/Patient";
import User from "@/app/(models)/User";
import Branch from "@/app/(models)/branch";
import { NextRequest, NextResponse } from "next/server";
import { authorizedMiddleware } from "@/app/helpers/authentication"
import { subMonths, startOfDay } from "date-fns";
import { connect } from '@/app/lib/mongodb';
import mongoose from 'mongoose';

connect();

export async function GET(request: NextRequest) {
  const authResponse = await authorizedMiddleware(request);
  if (authResponse) {
    return authResponse;
  }

  try {
    // Get the logged-in user's branch
    const user = (request as any).user;
    const loggedInUser = await User.findById(user.id).select('branch').lean() as {
      _id: unknown;
      branch: any;
      __v?: number;
    } | null;

    if (!loggedInUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get query parameters from URL
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const cardno = searchParams.get('cardno');
    const phone = searchParams.get('phone');
    const branch = searchParams.get('branch');
    const sex = searchParams.get('sex');

    // Build filter object
    const filter: any = {};

    // Determine if this is a search operation (has name, cardno, or phone parameters)
    const isSearchOperation = !!(name || cardno || phone);


    // BRANCH FILTER LOGIC:
    // 1. If specific branch is provided in query, use it
    // 2. If this is NOT a search operation (initial page load), use user's branch as default
    // 3. If this IS a search operation, don't apply branch filter by default

    if (branch) {
      // User explicitly selected a branch filter
      if (branch === "no-branch") {
        filter.branch = { $exists: false };
      } else if (branch === "all-branches") {
        // Remove branch filter to show all branches
        delete filter.branch;
      } else if (mongoose.Types.ObjectId.isValid(branch)) {
        filter.branch = new mongoose.Types.ObjectId(branch);
      } else {
        return NextResponse.json(
          { error: "Invalid branch ID format" },
          { status: 400 }
        );
      }
    } else if (!isSearchOperation && loggedInUser.branch) {
      // Initial page load - apply user's branch as default
      filter.branch = loggedInUser.branch;
    }
    // If isSearchOperation and no branch specified, don't apply any branch filter

    // Filter by name (search in firstname and lastname)
    if (name) {
      filter.$or = [
        { firstname: { $regex: name, $options: 'i' } },
        { lastname: { $regex: name, $options: 'i' } }
      ];
    }

    // Filter by card number
    if (cardno) {
      filter.cardno = { $regex: cardno, $options: 'i' };
    }

    // Filter by phone number
    if (phone) {
      filter.phoneNumber = { $regex: phone, $options: 'i' };
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
  
  await Branch.aggregate([{ $sample: { size: 1 } }]);

    // Fetch patients with applied filters
    const patients = await Patient.find(filter)
      .populate('branch') // Populate branch details
      .sort({ createdAt: -1 })
      .limit(50);


    return NextResponse.json(patients);

  } catch (error: unknown) {
    console.error("Error in GET /api/patient/registerdata", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}