import { NextRequest, NextResponse } from 'next/server';

import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import ReferalCertificate from '@/app/(models)/Referal';
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

    // Parse the request body
    const { HPI, PysicalFindings, InvestigationResult, Diagnosis, ReasonForReferral, Referring, Physical } = await request.json();

    // Validate that the patient exists
    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
 const fullUser = await User.findById(user.id).select('branch').exec();
    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    // Create a new referral certificate document
    const newReferalCertificate = new ReferalCertificate({
      HPI,
      PysicalFindings,
      InvestigationResult,
      Diagnosis,
      ReasonForReferral,
      Referring,
      Physical,
              branch: fullUser.branch, // Add branch from the logged-in user

      patientId: patient._id ,
      createdBy: {
        id: user.id,
        username: user.username,
      },
    });

    const savedReferalCertificate = await newReferalCertificate.save();

    // Add the new referral certificate to the patient's referral certificates list
    if (!patient.ReferalCertificate) {
      patient.ReferalCertificate = [];
    }
    patient.ReferalCertificate.push(savedReferalCertificate._id);
    await patient.save();

    return NextResponse.json({
      message: "Referral certificate created successfully",
      success: true,
      data: savedReferalCertificate,
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
        path: "ReferalCertificate", // Ensure this field exists in your Patient schema
        model: "ReferalCertificate",
        options: { sort: { createdAt: -1 } }, 
            populate: [
    {
      path: "branch",
      model: "Branch"
    },
   
  ] // Sort by creation date
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
        ReferalCertificate: patient.ReferalCertificate || [],
      },
    });
  } catch (error) {
    console.error("Error retrieving patient data and medical certificates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
