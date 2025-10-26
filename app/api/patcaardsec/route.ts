import { connect } from "@/app/lib/mongodb";
import Patient from "@/app/(models)/Patient";
import { NextRequest, NextResponse } from "next/server";
import { authorizedMiddleware } from "@/app/helpers/authentication";

connect();

export async function GET(request: NextRequest) {
  const authrtoResponse = await authorizedMiddleware(request);
  if (authrtoResponse) {
    return authrtoResponse;
  }

  try {
    // Find the patient with the highest card number
    const highestPatient = await Patient.aggregate([
      {
        $project: {
          // Convert cardno to a number for sorting
          cardno: { $toInt: "$cardno" },
        },
      },
      {
        $sort: { cardno: -1 }, // Sort in descending order
      },
      {
        $limit: 1, // Limit to the highest cardno
      },
    ]);

    if (!highestPatient || highestPatient.length === 0) {
      return NextResponse.json(
        { error: "No patients found" },
        { status: 404 }
      );
    }

    // Return the highest card number
    return NextResponse.json({ highestCardNumber: highestPatient[0].cardno });
  } catch (error: unknown) {
    console.error("Error in GET /api/patient/highest-card", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}