import { NextRequest, NextResponse } from 'next/server';
import Appointment from '@/app/(models)/appointment';
import { authorizedMiddleware } from '@/app/helpers/authentication';
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


    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Start of today
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // End of today

    // Build query based on user's branch
    const query: any = {
      appointmentDate: {
        $gte: startOfDay,
        $lt: endOfDay,
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


    // Find all scheduled appointments for today that match the user's branch
    const todayAppointments = await Appointment.find(query)
      .populate('patientId.id') // Populate nested patient reference
      .exec();

    // Check if any appointments were found
    if (!todayAppointments || todayAppointments.length === 0) {
      return NextResponse.json({ 
        message: "No scheduled appointments for today in your branch", 
        data: [] 
      });
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