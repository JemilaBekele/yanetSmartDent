import { NextRequest, NextResponse } from 'next/server';
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import Consent from '@/app/(models)/consent';
import User from '@/app/(models)/User';

connect();
interface Consent {
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
    const {
      MedicationTacken,
      allergies,
      anemia,
      epilepsy,
      asthma,
      DiabetesMellitus,
      Hypertension,
      HeartDisease,
      immuneDeficiency,
      coagulopathy,
      organopathy,
      pregnancy,
      MedicationsTaken,
      other,
      Treatmenttype,
      BleadingDisorder
    } = requestBody;

   
    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    // Check if the user is authorized
    if (typeof request === 'object' && request !== null && 'user' in request) {
      const user = (request as { user: { id: string; username: string } }).user;
     const fullUser = await User.findById(user.id).select('branch').exec();
    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
      // Create new Consent entry
      const newConsent = new Consent({
        MedicationTacken,
        allergies,
        anemia,
        epilepsy,
        asthma,
        DiabetesMellitus,
        Hypertension,
        HeartDisease,
        immuneDeficiency,
        coagulopathy,
        organopathy,
        pregnancy,
        MedicationsTaken,
        BleadingDisorder,
        other,
        branch: fullUser.branch, // Add branch from the logged-in user
        patientId: patient._id ,
        Treatmenttype,
        createdBy: {
          id: user.id,
          username: user.username,
        },
      });

      // Save the new consent document
      const savedConsent = await newConsent.save();

      // Add the new Orgnazation to the patient's record
      patient.Consent = patient.Consent || [];
      patient.Consent.push(savedConsent._id);
      await patient.save();

      // Return success response with saved data
      return NextResponse.json({
        message: "Consent created successfully",
        success: true,
        data: savedConsent,
      });
    } else {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error creating Consent:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
 
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    // Find the patient by ID and populate MedicalFinding
    const patient = await Patient.findById(id).populate({
      path: "Consent",
        model: "Consent",
        options: { sort: { createdAt: -1 },
      populate: [
    {
      path: "branch",
      model: "Branch"
    },
   
  ] }, 
    }).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
    // Return the sorted medical findings
    return NextResponse.json({
      message: "Consent retrieved successfully",
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
          updatedAt: patient.updatedAt 
        },
        Consent: patient.Consent || [],
      },
    });
  } catch (error) {
    console.error("Error retrieving medical findings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
