import { NextRequest, NextResponse } from 'next/server';
import Orgnazation from '@/app/(models)/Orgnazation';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';

// Connect to the database
connect();

// Example usage in an API route
export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);

  try {
    // Fetch the organizations data and populate the patient references
    const organizations = await Orgnazation.find({})
      .populate({
        path: 'patient.id', // Populate the entire patient field
        select: '_id cardno firstname age sex phoneNumber', // Select necessary fields
      })
      .exec();

    // Filter organizations to include only those with at least one patient
    const filteredOrganizations = organizations.filter(
      (org) => org.patient.length > 0
    );

    // Log the filtered organizations
    console.log("Filtered Organizations:", filteredOrganizations);

    // Check patient data specifically:
    filteredOrganizations.forEach((organization) => {
      console.log(`Organization: ${organization.organization}`);
      console.log("Patients:");
      organization.patient.forEach((patient: any) => {
        console.log(patient); // Log each patient's full data
      });
    });

    return NextResponse.json(
      {
        message: "Organizations fetched successfully",
        success: true,
        data: filteredOrganizations,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error fetching organizations:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}