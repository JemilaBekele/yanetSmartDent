import { NextRequest, NextResponse } from 'next/server';

import Patient from '@/app/(models)/Patient';

import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import Service from '@/app/(models)/Services';
import TreatmentPlan from '@/app/(models)/treatmentplan';
connect();

// CREATE a new Treatment Plan
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);

  try {
    const { id } = params; // Patient ID

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const { services, description } = await request.json();

    if ( !services || services.length === 0) {
      return NextResponse.json(
        { error: 'Patient ID and at least one service are required' },
        { status: 400 }
      );
    }

    // Fetch the patient
   
 // Check for user in request
 if (typeof request === 'object' && request !== null && 'user' in request) {
    const user = (request as { user: { id: string; username: string } }).user;
    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }
    // Fetch services and calculate total cost
    const serviceDetails = await Service.find({
      _id: { $in: services.map((s: { serviceId: string }) => s.serviceId) },
    });

    const totalCost = serviceDetails.reduce((sum, service) => sum + service.price, 0);

    // Create the treatment plan
    const treatmentPlan = new TreatmentPlan({
      patientId: patient._id ,
      services,
      description,
      totalCost,
      createdBy: {
        id: user.id,
        username: user.username,
      },// Assume the user object is added by authorizedMiddleware
    });

    const savedTreatmentPlan = await treatmentPlan.save();
// Add the new Orgnazation to the patient's record
patient.TreatmentPlan = patient.TreatmentPlan || [];
patient.TreatmentPlan.push(savedTreatmentPlan._id);
await patient.save();
    return NextResponse.json({
      message: 'Treatment plan created successfully',
      success: true,
      data: savedTreatmentPlan,
    });
  }} catch (error) {
    console.error('Error creating treatment plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params; // Patient ID

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }
const patientId= id 
    // Fetch patient and populate treatment plans
    const patient = await Patient.findById(patientId)
      .populate({
        path: "TreatmentPlan",
        model: "TreatmentPlan",
        populate: {
          path: "services.serviceId",
          select: "service price", // Include service name and price
        },
      })
      .exec();

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Extract relevant data for response
    const responseData = {
      patient: {
        id: patient._id,
        firstname: patient.firstname,
        age: patient.age,
        phoneNumber: patient.phoneNumber,
        sex: patient.sex,
        cardno: patient.cardno,
        Town: patient.Town,
        KK: patient.KK,
        updatedAt: patient.updatedAt,
      },
      TreatmentPlans: patient.TreatmentPlan || [],
    };

    return NextResponse.json({
      message: "Patient data and treatment plans retrieved successfully",
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Error retrieving patient data and treatment plans:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

