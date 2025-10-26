import { NextRequest, NextResponse } from 'next/server';

import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import FNA from '@/app/(models)/FNA';
import User from '@/app/(models)/User';




export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);

  try {
    const { id } = params; // Patient ID

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    // Extract user information from the request
    const user = (request as { user: { id: string; username: string } }).user;
  const fullUser = await User.findById(user.id).select('branch').exec();
    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Parse the request body
    const { CC,
      ClinicalFindings,
      DurationOfLesion,
      Impression, } = await request.json();

    // Validate that the patient exists
    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Create a new referral certificate document
    const newFNA = new FNA({
      CC,
      ClinicalFindings,
      DurationOfLesion,
      Impression,
         branch: fullUser.branch, // Add branch from the logged-in user

      patientId: patient._id ,
      createdBy: {
        id: user.id,
        username: user.username,
      },
    });

    const savedFNA = await newFNA.save();

    // Add the new referral certificate to the patient's referral certificates list
    if (!patient.FNA) {
      patient.FNA = [];
    }
    patient.FNA.push(savedFNA._id);
    await patient.save();

    return NextResponse.json({
      message: "Referral certificate created successfully",
      success: true,
      data: savedFNA,
    });
  } catch (error) {
    console.error("Error creating referral certificate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



// Retrieve all medical certificates for a patient
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params; // Patient ID

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    // Validate that the patient exists and populate medical certificates
    const patient = await Patient.findById(id)
      .populate({
        path: "FNA", // Ensure this field exists in your Patient schema
        model: "FNA",
        options: { sort: { createdAt: -1 } }, 
         populate: [
    {
      path: "branch",
      model: "Branch"
    },
   
  ]// Sort by creation date
      })
      .exec();

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Send combined response
    return NextResponse.json({
      message: "Patient data and medical certificates retrieved successfully",
      success: true,
      data: {
        patient: {
          id: patient._id,
          firstname: patient.firstname,
          age: patient.age,
          phoneNumber: patient.phoneNumber,
          sex: patient.sex,
          cardno: patient.cardno,
          Town: patient.Town,
          KK: patient.KK,
          updatedAt: patient.updatedAt, // Add other fields as needed
        },
        FNA: patient.FNA || [],
      },
    });
  } catch (error) {
    console.error("Error retrieving patient data and medical certificates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
