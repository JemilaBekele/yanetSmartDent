import { NextRequest, NextResponse } from 'next/server';
import Appointment from '@/app/(models)/appointment';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Patient from '@/app/(models)/Patient';
import User from '@/app/(models)/User';
import mongoose from 'mongoose';
import Branch from '@/app/(models)/branch';

export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);
  
  try {
    // Get user from request
    const user = request['user'] as { id: string; username: string; role: string };
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
        await Branch.aggregate([{ $sample: { size: 1 } }]);

    // Fetch the complete user with branch information from database
    const fullUser = await User.findById(user.id).select('branch').exec();
    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }


    // Get tomorrow's date range
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1); // Move to the next day
    const startOfTomorrow = new Date(tomorrow.setHours(0, 0, 0, 0)); // Start of tomorrow
    const endOfTomorrow = new Date(tomorrow.setHours(23, 59, 59, 999)); // End of tomorrow
    
    await Patient.aggregate([{ $sample: { size: 1 } }]);

    // Build query based on user's branch
    const query: any = {
      appointmentDate: {
        $gte: startOfTomorrow,
        $lt: endOfTomorrow,
      },
      status: 'Scheduled', // Ensure you're filtering for 'Scheduled' status
    };

    // Add branch filter based on user's branch
    if (fullUser.branch) {
      let userBranchId;
      
      // Handle different types of user.branch
      if (typeof fullUser.branch === 'string') {
        userBranchId = new mongoose.Types.ObjectId(fullUser.branch);
      } else if (fullUser.branch._id) {
        userBranchId = fullUser.branch._id;
      } else {
        userBranchId = fullUser.branch;
      }
      
      query.branch = userBranchId; // Filter appointments by user's branch
    }


    // Find all scheduled appointments for tomorrow that match the user's branch
    const tomorrowAppointments = await Appointment.find(query)
      .populate('patientId.id') // Populate nested patient reference
      .exec();

    // Check if any appointments were found
    if (!tomorrowAppointments || tomorrowAppointments.length === 0) {
      return NextResponse.json({ 
        message: "No scheduled appointments for tomorrow in your branch", 
        data: [] 
      });
    }

    console.log('Found appointments:', tomorrowAppointments.length);

    // Return tomorrow's scheduled appointments
    return NextResponse.json({
      message: "Tomorrow's scheduled appointments retrieved successfully",
      success: true,
      data: tomorrowAppointments,
    });
  } catch (error) {
    console.error("Error retrieving tomorrow's appointments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}