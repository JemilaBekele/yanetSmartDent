// pages/api/invoice/getInvoices.ts
import { NextRequest, NextResponse } from 'next/server';
import Appointment from '@/app/(models)/appointment';
import { connect } from '@/app/lib/mongodb';
connect();
interface Query {
  appointmentDate?: {
    $gte?: Date;
  };
}

export async function POST(req: NextRequest) {
  try {
    // Extract and parse the body
    const body = await req.json();
    const { startDate } = body;

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

    // Add the appointment date filter (from startDate onwards)
    query.appointmentDate = { $gte: startDateObj };

    // Find appointments that match the query
    const appointments = await Appointment.find(query);

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
