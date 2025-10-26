import { NextRequest, NextResponse } from "next/server";
import Patient from "@/app/(models)/Patient";
import MedicalFinding from "@/app/(models)/MedicalFinding"; // Import the MedicalFinding model
 // Import the Orthodontics model
import { authorizedMiddleware } from "@/app/helpers/authentication";
import { connect } from "@/app/lib/mongodb";
import Orthodontics from "@/app/(models)/orthodontics";

connect();

export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);

  try {
    const user = request["user"];
    if (!user) {
      console.error("User is not authenticated");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const createdBy = user.id;
    if (!createdBy) {
      console.error("CreatedBy username is required");
      return NextResponse.json(
        { error: "CreatedBy username is required" },
        { status: 400 }
      );
    }

    // Define a date range for recent records (e.g., last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Fetch recent medical findings created by the user
    const recentMedicalFindings = await MedicalFinding.find({
      "createdBy.id": createdBy,
      createdAt: { $gte: sixMonthsAgo },
    }).exec();

    // Fetch recent orthodontics records created by the user
    const recentOrthodontics = await Orthodontics.find({
      "createdBy.id": createdBy,
      createdAt: { $gte: sixMonthsAgo },
    }).exec();

    // If no records are found, return an empty response
    if (
      recentMedicalFindings.length === 0 &&
      recentOrthodontics.length === 0
    ) {
      return NextResponse.json({
        message: "No recent medical findings or orthodontics available",
        data: [],
      });
    }

    // Extract unique patient IDs from both medical findings and orthodontics
    const patientIds = Array.from(
      new Set([
        ...recentMedicalFindings.map((finding) => finding.patientId.id.toString()),
        ...recentOrthodontics.map((record) => record.patientId.id.toString()),
      ])
    );

    // Fetch patient details for the extracted patient IDs
    const patients = await Patient.find({
      _id: { $in: patientIds },
    }).exec();

    // Combine patient data with their medical findings and orthodontics records
    const patientsWithRecords = patients.map((patient) => {
      const findings = recentMedicalFindings.filter(
        (finding) => finding.patientId.id.toString() === patient._id.toString()
      );

      const orthodontics = recentOrthodontics.filter(
        (record) => record.patientId.id.toString() === patient._id.toString()
      );

      return {
        ...patient.toObject(),
        MedicalFindings: findings,
        Orthodontics: orthodontics,
      };
    });

    return NextResponse.json({
      message: "Patients, medical findings, and orthodontics retrieved successfully",
      success: true,
      data: patientsWithRecords,
    });
  } catch (error) {
    console.error("Error retrieving patients, medical findings, and orthodontics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}