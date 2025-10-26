import { NextRequest, NextResponse } from 'next/server';

import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import MedicalCertificate from '@/app/(models)/letter';
import User from '@/app/(models)/User';
import Branch from '@/app/(models)/branch';

// Create a new medical certificate
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
    const { briefExplanation, diagnosis, restDate } = await request.json();

    // Validate that the patient exists
    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    const lastCertificate = await MedicalCertificate.findOne({}, { cardNumber: 1 }).sort({ cardNumber: -1 });

    const cardNumber = lastCertificate ? lastCertificate.cardNumber + 1 : 200000;
    // Calculate totalRestDays
   // Parse and validate the input dates

    // Create a new medical certificate document
    const newMedicalCertificate = new MedicalCertificate({
      briefExplanation,
      diagnosis,
      restDate,
              branch: fullUser.branch, // Add branch from the logged-in user

      patientId:  patient._id ,
      createdBy: {
        id: user.id,
        username: user.username,
      },
      cardNumber: Number(cardNumber),
    });

    const savedMedicalCertificate = await newMedicalCertificate.save();

    // Add the new medical certificate to the patient's medical certificates list
    if (!patient.MedicalCertificate) {
      patient.MedicalCertificate = [];
    }
    patient.MedicalCertificate.push(savedMedicalCertificate._id);
    await patient.save();

    return NextResponse.json({
      message: "Medical certificate created successfully",
      success: true,
      data: savedMedicalCertificate,
    });
  } catch (error) {
    console.error("Error creating medical certificate:", error);
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
              await Branch.aggregate([{ $sample: { size: 1 } }]);

    // Validate that the patient exists and populate medical certificates
     // Find the patient by ID and populate MedicalCertificate with branch
    const patient = await Patient.findById(id)
      .populate({
        path: "MedicalCertificate",
        model: "MedicalCertificate",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "branch",
          model: "Branch"
        }
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
        MedicalCertificate: patient.MedicalCertificate || [],
      },
    });
  } catch (error) {
    console.error("Error retrieving patient data and medical certificates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
