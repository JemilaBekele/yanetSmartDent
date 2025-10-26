import { connect } from "@/app/lib/mongodb";
import Patient from "@/app/(models)/Patient";
import { NextRequest, NextResponse } from "next/server";
import { authorizedMiddleware } from "@/app/helpers/authentication";

connect();

export async function GET(request: NextRequest) {
  authorizedMiddleware(request);
  try {
    // Count the total number of patients
    const totalPatients = await Patient.countDocuments();

    // Return the total count
    return NextResponse.json({ totalPatients });
  } catch (error: unknown) {
    console.error("Error in GET /api/patient/count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
