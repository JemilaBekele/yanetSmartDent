

import {  NextResponse } from 'next/server';
import Orgnazation from '@/app/(models)/Orgnazation';
import Patient from "@/app/(models)/Patient";
import { connect } from '@/app/lib/mongodb';
connect();

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  

  try {
    const { id } = params; // This is the patient ID to delete
    const patientId = id;
console.log(patientId)
    // Parse the request body to get the organization ID
    const body = await request.json();
    const { recordId } = body;

    if (!recordId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    // Find the organization by ID
    const organization = await Orgnazation.findById(recordId).exec();
    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Check if the patient exists in the organization's patient array
    const patientIndex = organization.patient.findIndex(
      (patient: any) => patient.id.toString() === patientId
    );

    if (patientIndex === -1) {
      return NextResponse.json({ error: "Patient not found in the organization" }, { status: 404 });
    }

    // Remove the patient from the organization's patient array
    organization.patient.splice(patientIndex, 1);

    // Save the updated organization
    await organization.save();

   
 // Remove the Healthinfo reference from the associated patient's record
 const patient = await Patient.findOneAndUpdate(
    { Orgnazation: recordId }, // Find patient with this Healthinfo ID
    { $pull: { Orgnazation: recordId } }, // Remove the Healthinfo ID from the array
    { new: true } // Return the updated patient document
  );

  if (!patient) {
    console.warn(`No patient found with Healthinfo ID: ${recordId}`);
  }

    return NextResponse.json({
      message: "Patient removed from organization successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Error removing patient from organization:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}