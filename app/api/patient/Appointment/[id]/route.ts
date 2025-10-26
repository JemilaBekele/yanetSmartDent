import { NextRequest, NextResponse } from 'next/server';
import Appointment from '@/app/(models)/appointment';
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import User from "@/app/(models)/User";
import { connect } from '@/app/lib/mongodb';
connect();
interface Appointment {
  createdAt: string; // or Date, depending on how you store it
  // Add other fields as needed
}


export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);
  
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const requestBody = await request.json();
    const { appointmentDate, appointmentTime, appointmentEndTime, reasonForVisit, doctorId } = requestBody;

    // Fetch patient
    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Check for user in request
    if (typeof request === 'object' && request !== null && 'user' in request) {
      const user = (request as { user: { id: string; username: string } }).user;

      // Fetch the creator user to get their branch
      const creatorUser = await User.findById(user.id).select('branch').exec();
      if (!creatorUser) {
        console.error(`Creator user not found: ${user.id}`);
        return NextResponse.json({ error: "Creator user not found" }, { status: 404 });
      }

      // Fetch doctor if doctorId is provided, otherwise use the user as the doctor
      let doctor = { id: user.id, username: user.username }; // Default to user if no doctorId
      if (doctorId) {
        const foundDoctor = await User.findById(doctorId).exec();
        if (!foundDoctor) {
          return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
        }
        doctor = { id: foundDoctor._id.toString(), username: foundDoctor.username };
      }

      // Create new Appointment with branch
      const newAppointment = new Appointment({
        appointmentDate, 
        appointmentTime,
        appointmentEndTime,
        reasonForVisit,
        status: 'Scheduled',
        doctorId: doctor, // This will either be the found doctor or the user
        patientId: { 
          id: patient._id.toString(), 
          username: patient.firstname,
          cardno: patient.cardno  
        },
        branch: creatorUser.branch, // Add branch from the logged-in user
        createdBy: {
          id: user.id,
          username: user.username,
        },
      });

      const savedAppointment = await newAppointment.save();

      // Add the new appointment to the patient's record
      patient.Appointment = patient.Appointment || [];
      patient.Appointment.push(savedAppointment._id);
      await patient.save();

      return NextResponse.json({
        message: "Appointment created successfully",
        success: true,
        data: savedAppointment,
      });
    } else {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error creating Appointment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  

  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    // Find the patient by ID and populate Appointment
    const patient = await Patient.findById(id).populate('Appointment').exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // If the patient has no medical findings, return an empty array
    if (!patient.Appointment || patient.Appointment.length === 0) {
      return NextResponse.json({ message: "No Appointment available for this patient", data: [] });
    }

    // Sort medical findings by createdAt field in descending order
    const sortedFindingsapp = patient.Appointment.sort((a: Appointment, b: Appointment) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
   

    // Return the sorted medical findings
    return NextResponse.json({
      message: "Appointment retrieved successfully",
      success: true,
      data: sortedFindingsapp,
    });
  } catch (error) {
    console.error("Error retrieving Appointment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
