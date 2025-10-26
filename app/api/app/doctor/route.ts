import { NextRequest, NextResponse } from 'next/server';
import Appointment from '@/app/(models)/appointment';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import Patient from '@/app/(models)/Patient';
connect();
export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);
 
  try {
    const user = request['user']; // Assuming user authentication middleware adds the user object to the request
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
                await Patient.aggregate([{ $sample: { size: 1 } }]);

    // Find all appointments for the doctor, sorted by appointmentDate in descending order
    const allAppointments = await Appointment.find({
      status: 'Scheduled', // Filter for scheduled appointments
      'doctorId.id': user.id, // Filter by the doctor's ID from the authenticated user
    })
    .populate('patientId.id') // Populate the patient's ID if it references another model
    .sort({ appointmentDate: 1 }) // Sort by appointmentDate (descending order)
    .exec();

    // Return all scheduled appointments, sorted by appointmentDate
    return NextResponse.json({
      message: "All scheduled appointments retrieved successfully",
      success: true,
      data: allAppointments,
    });
  } catch (error) {
    console.error("Error retrieving appointments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}