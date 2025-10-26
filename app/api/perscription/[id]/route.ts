import { NextRequest, NextResponse } from 'next/server';
import Prescription from '@/app/(models)/prescription'
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Healthinfo from '@/app/(models)/healthinfo';
import User from '@/app/(models)/User';



// Create a new prescription
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
    const { description ,diagnosis,Name} = await request.json();

    // Validate that the patient exists
    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Create a new prescription document
    const newPrescription = new Prescription({
      description,
      diagnosis,
      Name,
      patientId: patient._id ,
                        branch: fullUser.branch, // Add branch from the logged-in user

      createdBy: {
        id: user.id,
        username: user.username,
      },
    });

    const savedPrescription = await newPrescription.save();

    if (!patient.Prescription) {
      patient.Prescription = [];
    }


    patient.Prescription.push(savedPrescription._id);
    await patient.save();

    return NextResponse.json({
      message: "Prescription created successfully",
      success: true,
      data: savedPrescription,
    });
  } catch (error) {
    console.error("Error creating Prescription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params; // Patient ID

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    // Validate that the patient exists and populate prescriptions
    const patient = await Patient.findById(id)
      .populate({
        path: "Prescription",
        model: "Prescription",
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
    const healthInfo = await Healthinfo.findOne({ "patientId.id": id }).exec();
    // Send combined response
    return NextResponse.json({
      message: "Patient data and prescriptions retrieved successfully",
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
          HNo:patient.HNo,
          Woreda:patient.Woreda,
          Region:patient.Region,
          
          updatedAt: patient.updatedAt // Add other fields as needed
        },
        healthInfo: healthInfo
        ? {
           
            weight: healthInfo.weight || "",
           
          }
        : null,
        Prescription: patient.Prescription || [],
      },
    });
  } catch (error) {
    console.error("Error retrieving patient data and prescriptions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

