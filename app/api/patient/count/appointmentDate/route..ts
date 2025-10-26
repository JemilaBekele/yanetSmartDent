import {  NextRequest, NextResponse } from 'next/server';
import Appointment from '@/app/(models)/appointment';

import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
connect();

export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);
  
  try {
    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Start of today
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // End of today

    // Log today's date range
    console.log('Start of Day:', startOfDay);
    console.log('End of Day:', endOfDay);

    // Find all scheduled appointments for today
    const todayAppointments = await Appointment.find({
      appointmentDate: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
      status: 'Scheduled', // Ensure you're filtering for 'Scheduled' status
    })
    .populate('patientId.id') // Populate nested patient reference
    .exec();

    // Check if any appointments were found
    if (!todayAppointments || todayAppointments.length === 0) {
      return NextResponse.json({ message: "No scheduled appointments for today", data: [] });
    }

    // Return today's scheduled appointments
    return NextResponse.json({
      message: "Today's scheduled appointments retrieved successfully",
      success: true,
      data: todayAppointments,
    });
  } catch (error) {
    console.error("Error retrieving today's appointments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
