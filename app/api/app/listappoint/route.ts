import { NextRequest, NextResponse } from 'next/server';
import Appointment from '@/app/(models)/appointment';
import { connect } from '@/app/lib/mongodb';
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import mongoose from 'mongoose';
import User from '@/app/(models)/User'; // Import User model
import Branch from '@/app/(models)/branch';

connect();

interface Query {
  appointmentDate?: {
    $gte?: Date;
    $lt?: Date;
  };
  branch?: any;
}

// Extend the user type to include branch
interface AuthenticatedUser {
  id: string;
  username: string;
  role: string;
  branch?: any;
}

export async function POST(req: NextRequest) {
  const authResponse = await authorizedMiddleware(req);
  if (authResponse) {
    return authResponse;
  }

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

    // Get user from request with proper typing
    const user = req['user'] as AuthenticatedUser;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }


    // Fetch the complete user with branch information from database
    const fullUser = await User.findById(user.id).select('branch').exec();
    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startDateObj);
    endOfDay.setHours(23, 59, 59, 999);

    // Add the appointment date filter
    query.appointmentDate = { $gte: startOfDay, $lt: endOfDay };

    // Add branch filter - Convert user.branch to ObjectId for proper comparison
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
      
      query.branch = userBranchId 
    } else {
      console.log('No branch found for user, will return all appointments');
    }


    // Find appointments that match the query and status
    const appointments = await Appointment.find({
      ...query,
      status: 'Scheduled'
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

export async function GET(req: NextRequest) {
  // Call the authorization middleware to check the request
  const authResponse = await authorizedMiddleware(req);
  if (authResponse) {
    return authResponse;
  }

  try {
    // Get user from request with proper typing
    const user = req['user'] as AuthenticatedUser;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
        await Patient.aggregate([{ $sample: { size: 1 } }]);
        await Branch.aggregate([{ $sample: { size: 1 } }]);
    


    // Fetch the complete user with branch information from database
    const fullUser = await User.findById(user.id).select('branch').exec();
    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }


    // Build query based on user's branch
    const query: any = {
      status: 'Scheduled'
    };

    // Add branch filter - Convert user.branch to ObjectId for proper comparison
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
      
      query.branch =userBranchId 
    } else {
      console.log('GET - No branch found for user, will return all appointments');
    }


    // Find all appointments that are "Scheduled" and NOT from user's branch
    const appointments = await Appointment.find(query)
      .populate('patientId.id') // Populate the patient data
      .populate('branch') // Also populate branch to see what branches are returned
      .sort({ appointmentDate: 1 }) // Sort appointments by appointmentDate (ascending)
      .exec();

    appointments.forEach((appt, index) => {
      console.log(`Appointment ${index + 1} branch:`, appt.branch);
    });

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