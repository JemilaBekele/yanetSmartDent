import { NextRequest, NextResponse } from 'next/server';

import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import Orthodontics from '@/app/(models)/orthodontics';
import Branch from '@/app/(models)/branch';
import User from '@/app/(models)/User';
connect();
interface Orthodontics {
  createdAt: string; // or Date, depending on how you store it
  // Add other fields as needed
}
// Create a new medical finding 
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const user = (request as { user: { id: string; username: string } }).user;

    const {
        Overjet,
        OverjetNegativeValue,
        OverbitePercentage,
        ConcernsAndLimitations,
        Others,
        ChiefComplaint,
        OralHabites,
        MedicalHistory,
        DentalHistory,
        AngleClassification,
        AnteriorCrossbite,
        PosteriorCrossbite,
        Mandible,
        Maxilla,
  Openbite,
  TreatmentType,
  AdditionalOrthodonicAppliance,
  EstimatedTreatmentTime,
  OrthodonticAppliance,
  Retainer,
      TreatmentPlan = [] // Ensure Treatment is an array
    } = await request.json();
  
    
    // Validate patient existence
    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
   const fullUser = await User.findById(user.id).select('branch').exec();
        if (!fullUser) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

    // Create new MedicalFinding
    const neworthoFinding = new Orthodontics({
        Overjet,
        OverjetNegativeValue,
        OverbitePercentage,
        ConcernsAndLimitations,
        Others,
        ChiefComplaint,
        OralHabites,
        MedicalHistory,
        DentalHistory,
        AngleClassification,
        AnteriorCrossbite,
        PosteriorCrossbite,
        Mandible,
        Maxilla,
  Openbite,
  TreatmentType,
  AdditionalOrthodonicAppliance,
  EstimatedTreatmentTime,
  OrthodonticAppliance,
  Retainer,
  TreatmentPlan: Array.isArray(TreatmentPlan) ? TreatmentPlan : [],
                       branch: fullUser.branch, // Add branch from the logged-in user

      patientId:patient._id ,
      createdBy: { id: user.id, username: user.username },
    });

    const savedFinorth = await neworthoFinding.save();
    console.log("Saved MedicalFinding Document:", savedFinorth);

    // Update the patient's MedicalFinding reference
    patient.Orthodontics = patient.Orthodontics || [];
    patient.Orthodontics.push(savedFinorth._id);
    await patient.save();

    return NextResponse.json({
      message: "Medical finding created successfully",
      success: true,
      data: savedFinorth,
    });
  } catch (error) {
    console.error("Error creating medical finding:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
 
    try {
      const { id } = params;
      if (!id) {
        return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
      }
              await Branch.aggregate([{ $sample: { size: 1 } }]);

      // Find the patient by ID and populate MedicalFinding
    const patient = await Patient.findById(id).populate({
      path: 'Orthodontics',
      populate: {
        path: 'branch',
        model: 'Branch'
      }
    }).exec();
          if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }
  
      // If the patient has no medical findings, return an empty array
      if (!patient.Orthodontics || patient.Orthodontics.length === 0) {
        return NextResponse.json({ message: "No medical findings available for this patient", data: [] });
      }
  
      // Sort medical findings by createdAt field in descending order
      const sortedFindingsortho = patient.Orthodontics.sort((a: Orthodontics, b: Orthodontics) => {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  
      // Return the sorted medical findings
      return NextResponse.json({
        message: "Orthodontics retrieved successfully",
        success: true,
        data: sortedFindingsortho,
      });
    } catch (error) {
      console.error("Error retrieving medical findings:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }