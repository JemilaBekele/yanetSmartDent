import { NextRequest, NextResponse } from "next/server";

import Patient from "@/app/(models)/Patient";
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from "@/app/lib/mongodb";

const ageRanges = [
  { label: "0-10", min: 0, max: 10 },
  { label: "11-20", min: 11, max: 20 },
  { label: "21-30", min: 21, max: 30 },
  { label: "31-40", min: 31, max: 40 },
  { label: "41-50", min: 41, max: 50 },
  { label: "51-60", min: 51, max: 60 },
  { label: "61-70", min: 61, max: 70 },
  { label: "71+", min: 71, max: Infinity },
];

// Force dynamic rendering
export const dynamic = 'force-dynamic';

connect();

export async function GET(req: NextRequest) {
  try {
    // Run the authorization middleware
    await authorizedMiddleware(req);

    // Fetch all patients with age
    const patients = await Patient.find({}, { age: 1, sex: 1 });

    // Initialize age range data
    const ageData = ageRanges.map(range => ({
      label: range.label,
      min: range.min,
      max: range.max,
      total: 0,
    }));

    // Count patients in each range
    patients.forEach((patient) => {
      const age = patient.age;
      const range = ageData.find(
        (r) => age >= r.min && age <= r.max
      );
      if (range) {
        range.total += 1;
      }
    });

    // Count male and female patients
    const maleCount = patients.filter((p) => p.sex === "male").length;
    const femaleCount = patients.filter((p) => p.sex === "female").length;

    return NextResponse.json({
      success: true,
      data: {
        ageDistribution: ageData,
        genderDistribution: [
          { label: "Male", total: maleCount },
          { label: "Female", total: femaleCount },
        ],
      },
    });
  } catch (error) {
    console.error("Error fetching patient data:", error);
    return NextResponse.json({
      success: false,
      message: "Server error",
    });
  }
}