import { NextRequest, NextResponse } from 'next/server';
import Patient from "@/app/(models)/Patient";

interface Query {
  cardno?: string | { $regex: string; $options: string };
  phoneNumber?: string | { $regex: string; $options: string };
  firstname?: string | { $regex: string; $options: string };
}

import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Branch from '@/app/(models)/branch';

connect();

// Extract search parameters outside of the try-catch block
const getSearchParams = (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const cardno = searchParams.get('cardno');
  const phoneNumber = searchParams.get('phoneNumber');
  const firstname = searchParams.get('firstname');
  return { cardno, phoneNumber, firstname };
};

export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);

  // Get the search parameters
  const { cardno, phoneNumber, firstname } = getSearchParams(request);

  // Initialize the query object
  const query: Query = {};

  try {
    // Build the query based on provided parameters - ALL CASE SENSITIVE
    if (cardno) {
      // Case-sensitive exact match or partial match for cardno
      query.cardno = { $regex: cardno, $options: '' }; // Remove 'i' option for case sensitivity
    }
    if (phoneNumber) {
      // Case-sensitive search for phone number
      query.phoneNumber = { $regex: phoneNumber, $options: '' }; // Remove 'i' option for case sensitivity
    }
    if (firstname) {
      // Case-sensitive search for firstname
      query.firstname = { $regex: firstname, $options: '' }; // Remove 'i' option for case sensitivity
    }

    // Check if no parameters were provided
    if (!cardno && !phoneNumber && !firstname) {
      return NextResponse.json(
        { error: 'At least one search parameter (cardno, phoneNumber, or firstname) is required' },
        { status: 400 }
      );
    }
  await Branch.aggregate([{ $sample: { size: 1 } }]);

    // Query the Patient model with the constructed query
    const patients = await Patient.find(query).populate('branch').exec();

    // Check if patients were found
    if (!patients || patients.length === 0) {
      return NextResponse.json(
        { error: "No patients found" },
        { status: 404 }
      );
    }

    // Return the found patients
    return NextResponse.json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}