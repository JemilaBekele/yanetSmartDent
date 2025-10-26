import { NextRequest, NextResponse } from 'next/server';

import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Note from '@/app/(models)/note';




export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);

  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const user = (request as { user: { id: string; username: string } }).user;

    const body = await request.json();
    const { noteText } = body;

    if (!noteText) {
      return NextResponse.json({ error: "Note content is required" }, { status: 400 });
    }

    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    const newNote = new Note({
      Note: noteText,
      patientId: patient._id,
      createdBy: {
        id: user.id,
        username: user.username,
      },
    });

    const savedNote = await newNote.save();

    if (!patient.Note) {
      patient.Note = [];
    }
    patient.Note.push(savedNote._id);
    await patient.save();

    return NextResponse.json({
      message: "Referral certificate created successfully",
      success: true,
      data: savedNote,
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
        path: "Note", // Ensure this field exists in your Patient schema
        model: "Note",
        options: { sort: { createdAt: -1 } }, // Sort by creation date
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
        Note: patient.Note || [],
      },
    });
  } catch (error) {
    console.error("Error retrieving patient data and medical certificates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
