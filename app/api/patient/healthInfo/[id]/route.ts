import { NextRequest, NextResponse } from 'next/server';
import HealthinfoModel from '@/app/(models)/healthinfo';
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import User from '@/app/(models)/User';
import Branch from '@/app/(models)/branch';
connect();
// Define Healthinfo interface based on your schema
interface HealthinfoModel {
  bloodgroup: string;
  weight: number;
  height: number;
  Medication: string[];
  allergies: string[];
  habits: string[];
  Vitalsign: {
    Core_Temperature: string;
    Respiratory_Rate: string;
    Blood_Oxygen: string;
    Blood_Pressure: string;
    heart_Rate: string;
    Hypertension:string;
    Hypotension:string;
    Tuberculosis:string;
    Astema:string;
    description:string;
    Hepatitis:string;
    Diabetics:string;
    BleedingTendency:string;
    Epilepsy:string
  };
  createdAt: string; // Use Date if applicable
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
    console.log("User Data:", user);

    const { bloodgroup, Epilepsy,BleedingTendency, Diabetics,Hypertension, Hypotension,Hepatitis,Tuberculosis,Astema,description,weight, height, Medication, allergies, habits, Core_Temperature, Respiratory_Rate, Blood_Oxygen, Blood_Pressure, heart_Rate } = await request.json();
    console.log("Received Payload:", {
      bloodgroup,
      weight,
      height,
      allergies,
      habits,
      Core_Temperature,
      Respiratory_Rate,
      Blood_Oxygen,
      Blood_Pressure,
      heart_Rate,
      Hepatitis,Epilepsy,BleedingTendency,Diabetics,
      Hypotension,Hypertension,Tuberculosis,Astema,description
    });

    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }
      const fullUser = await User.findById(user.id).select('branch').exec();
        if (!fullUser) {
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

    const newHealthinfo = new HealthinfoModel({
      weight,
      height,
      allergies,
      habits,
      Medication,
      Core_Temperature,
      Respiratory_Rate,
      Blood_Oxygen,
      Blood_Pressure,
      heart_Rate,
      Hepatitis,Hypertension,
      Hypotension,Tuberculosis,Astema,description,Epilepsy,BleedingTendency,Diabetics,  bloodgroup,
                  branch: fullUser.branch, // Add branch from the logged-in user
      patientId:patient._id , // Direct reference
      createdBy: {
        id: user.id,
        username: user.username,
      },
    });

    const savedHealthinfo = await newHealthinfo.save();
    console.log("Saved Healthinfo Document:", savedHealthinfo.toObject());

    // Add the new health info to the patient
    patient.Healthinfo = patient.Healthinfo || [];
    patient.Healthinfo.push(savedHealthinfo._id);
    await patient.save();

    return NextResponse.json({
      message: "Healthinfo created successfully",
      success: true,
      data: savedHealthinfo,
    });
  } catch (error) {
    console.error("Error creating Healthinfo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


// Retrieve health information for a patient
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
 

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }
              await Branch.aggregate([{ $sample: { size: 1 } }]);

    // Find the patient by ID and populate Healthinfo
  const patient = await Patient.findById(id)
      .populate({
        path: 'Healthinfo',
        populate: {
          path: 'branch',
          model: 'Branch' // Make sure this matches your Branch model name
        }
      })
      .exec();    if (!patient) {
      return NextResponse.json({ error: "Patient not found" });
    }

    

    // If the patient has no medical findings, return an empty array
    if (!patient.Healthinfo || patient.Healthinfo.length === 0) {
      return NextResponse.json({ message: "No Healthinfo available for this patient", data: [] });
    }

    // Sort medical findings by createdAt field in descending order
    const sortedFindingsHealth = patient.Healthinfo.sort((a: HealthinfoModel, b: HealthinfoModel) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Return the sorted medical findings
    return NextResponse.json({
      message: "Healthinfo retrieved successfully",
      success: true,
      data: sortedFindingsHealth,
    });
  } catch (error) {
    console.error("Error retrieving Healthinfo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
