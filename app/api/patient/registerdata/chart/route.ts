import { NextResponse } from 'next/server';
import Patient from "@/app/(models)/Patient";


// Adjust the checkAuthenticationpath as needed
 // Assuming you have this for authorization


 import { connect } from '@/app/lib/mongodb';
connect();
export async function GET() {
 

  try {
    // Fetch all patients from the database
    const patients = await Patient.find({});

    // Group patients by registration month and year
    const patientCountsByMonth: { [key: string]: number } = {};

    patients.forEach(patient => {
      // Extract year and month from the 'createdAt' field
      const createdAt = new Date(patient.createdAt);
      const year = createdAt.getFullYear();
      const month = createdAt.getMonth() + 1; // months are 0-indexed in JS

      // Generate a key like '2024-09' for September 2024
      const yearMonthKey = `${year}-${month.toString().padStart(2, '0')}`;

      // Increment the count for this year-month
      if (!patientCountsByMonth[yearMonthKey]) {
        patientCountsByMonth[yearMonthKey] = 0;
      }
      patientCountsByMonth[yearMonthKey]++;
    });

    // Respond with the patient counts by month
    return NextResponse.json({
      patientCountsByMonth,
      message: "Patient registration counts by month",
    });
  } catch (error: unknown) {
    console.error("Error in GET /api/patient/registerdata", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
