import { NextRequest, NextResponse } from 'next/server';
import Orgnazation from '@/app/(models)/Orgnazation';
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import mongoose from 'mongoose';
connect();
interface Orgnazation {
  createdAt: string; 
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);

  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const requestBody = await request.json();
    const { organization } = requestBody;

    if (!organization) {
      return NextResponse.json({ error: "Missing required fields: organization" }, { status: 400 });
    }

    // Ensure `id` is properly formatted as `ObjectId`
    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    if (typeof request === 'object' && request !== null && 'user' in request) {
      const user = (request as { user: { id: string; username: string } }).user;

      // Check if the organization already exists
      let existingOrganization = await Orgnazation.findOne({ organization });

      if (existingOrganization) {

        // ✅ Ensure `existingOrganization.patient` is an array
        if (!Array.isArray(existingOrganization.patient)) {
          existingOrganization.patient = [];
        }

        // ✅ Ensure the patient is not already added
        if (!existingOrganization.patient.some((p: any) => p.id.toString() === patient._id.toString())) {
          existingOrganization.patient.push({ id: new mongoose.Types.ObjectId(patient._id) });
          await existingOrganization.save();
        }

        // ✅ Ensure `patient.Orgnazation` is an array
        if (!Array.isArray(patient.Orgnazation)) {
          patient.Orgnazation = [];
        }

        if (!patient.Orgnazation.includes(existingOrganization._id)) {
          patient.Orgnazation.push(existingOrganization._id);
          await patient.save();
        }

        return NextResponse.json({
          message: "Organization already exists. Patient added to the organization.",
          success: true,
          data: existingOrganization,
        });
      }

      // If organization does not exist, create a new one

      const newOrganization = new Orgnazation({
        organization,
        patient: [{ id: new mongoose.Types.ObjectId(patient._id) }], // ✅ Ensure `ObjectId` format
        createdBy: {
          id: user.id,
          username: user.username,
        },
      });


      const savedOrganization = await newOrganization.save();

      // Ensure the patient's organization array exists and update it
      if (!Array.isArray(patient.Orgnazation)) {
        patient.Orgnazation = [];
      }
      patient.Orgnazation.push(savedOrganization._id);
      await patient.save();

      return NextResponse.json({
        message: "Organization created successfully and assigned to the patient.",
        success: true,
        data: savedOrganization,
      });
    } else {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    // Find the patient by ID and populate Orgnazation
    const patient = await Patient.findById(id).populate('Orgnazation').exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" });
    }


    // If the patient has no medical findings, return an empty array
    if (!patient.Orgnazation || patient.Orgnazation.length === 0) {
      return NextResponse.json({ message: "No Orgnazation available for this patient", data: [] });
    }

    // Sort medical findings by createdAt field in descending order
    const sortedFindingsOrgnazation = patient.Orgnazation.sort((a: Orgnazation, b: Orgnazation) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Return the sorted medical findings
    return NextResponse.json({
      message: "Orgnazation retrieved successfully",
      success: true,
      data: sortedFindingsOrgnazation,
    });
  } catch (error) {
    console.error("Error retrieving Orgnazation:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}