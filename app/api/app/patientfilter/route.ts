import { NextRequest, NextResponse } from 'next/server';
import Patient from "@/app/(models)/Patient"; // Adjust the import according to your file structure
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Branch from '@/app/(models)/branch';
connect();

type PatientQuery = {
  firstname?: { $regex: RegExp }; // Query for filtering by first name
  createdAt?: { $gte: Date; $lte: Date }; // Query for filtering by date
};

export async function POST(req: NextRequest) {
      authorizedMiddleware(req);
  // Parse the request body
  const { firstName, date } = await req.json();

  try {
    const query: PatientQuery = {};

    if (firstName) {
      query.firstname = { $regex: new RegExp(firstName, 'i') }; // Case-insensitive search
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999); // Set end date to the end of the day

      query.createdAt = { $gte: startDate, $lte: endDate }; // Filter for the entire day
    }
            await Branch.aggregate([{ $sample: { size: 1 } }]);

    const patients = await Patient.find(query).populate('branch') // Populate branch details
.exec();

    return NextResponse.json({ data: patients }, { status: 200 });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
