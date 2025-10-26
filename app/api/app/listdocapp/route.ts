import { NextRequest, NextResponse } from 'next/server';
import Appointment from '@/app/(models)/appointment';
import { authorizedMiddleware } from '@/app/helpers/authentication';
interface Query {
  appointmentDate?: {
    $gte?: Date;
    $lt?: Date;
  };
}
import { connect } from '@/app/lib/mongodb';
import Patient from '@/app/(models)/Patient';
connect();
export async function POST(req: NextRequest) {
    await authorizedMiddleware(req);
  try {
    // Extract and parse the body
    const user = req['user'];
    if (!user) {
      console.error("User is not authenticated");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const createdBy = user.id;
    const body = await req.json();
    const { startDate } = body;
        await Patient.aggregate([{ $sample: { size: 1 } }]);
    // Check if the required parameter (startDate) is provided
    if (!startDate) {
      return NextResponse.json({
        message: 'Start date is required.',
        success: false,
      }, { status: 400 });
    }

    // Initialize the query object
    const query: Query = {};

    // Process the startDate
    const startDateObj = new Date(startDate);
    
    // Validate the date
    if (isNaN(startDateObj.getTime())) {
      return NextResponse.json({
        message: 'Invalid date format.',
        success: false,
      }, { status: 400 });
    }

    // Create a range for the appointment date filter
    const startOfDay = new Date(startDateObj);
    startOfDay.setHours(0, 0, 0, 0); // Set to the start of the day (midnight)

    const endOfDay = new Date(startDateObj);
    endOfDay.setHours(23, 59, 59, 999); // Set to the end of the day (just before midnight of the next day)

    // Add the appointment date filter (from startOfDay to endOfDay)
    query.appointmentDate = { $gte: startOfDay, $lt: endOfDay };

    // Find appointments that match the query and status
    const appointments = await Appointment.find({
      ...query, // Spread the existing query for appointmentDate
      status: 'Scheduled',
      'doctorId.id': createdBy, // Add the status condition
    }).populate('patientId.id').exec();

    // Return the response with the found appointments
    return NextResponse.json({
      message: 'Appointments retrieved successfully',
      success: true,
      data: appointments,
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json({
      message: 'Failed to retrieve appointments.',
      success: false,
    }, { status: 500 });
  }
}