import { NextRequest, NextResponse } from 'next/server';
import Prescription from '@/app/(models)/prescription'
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';

// GET: Retrieve Prescription by Patient ID
export async function GET(request: NextRequest, { params }: { params: { patientId: string } }) {
  try {
    const { patientId } = params;

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const prescriptions = await Prescription.find({ "patientId.id": patientId }).exec();

    if (!prescriptions || prescriptions.length === 0) {
      return NextResponse.json({ error: "No prescriptions found for this patient" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Prescriptions retrieved successfully",
      success: true,
      data: prescriptions,
    });
  } catch (error) {
    console.error("Error retrieving prescriptions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


// PATCH: Update a Prescription
export async function PATCH(request: NextRequest) {
  const authResponse = await authorizedMiddleware(request);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const { recordId, ...updates } = body;

    if (!recordId) {
      return NextResponse.json({ error: "Prescription ID is required" }, { status: 400 });
    }
    const user = (request as { user: { id: string; username: string } }).user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }
 // Step 1: Update other fields except for changeHistory
 const updateData = {
  ...updates,
  updatedBy: { id: user.id, username: user.username },
  updateTime: new Date(),
};
    const updatedPrescription = await Prescription.findByIdAndUpdate(recordId, updateData, { new: true }).exec();

    if (!updatedPrescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    const changeHistoryData = {
      changeTime: new Date(),
      updatedBy: { id: user.id, username: user.username },
      changes: updates, // You can adjust the specific changes you want to track
    };
    await Prescription.findByIdAndUpdate(
      recordId,
      {
        $push: { changeHistory: changeHistoryData },
      },
      { new: true }
    );
    return NextResponse.json({
      message: "Prescription updated successfully",
      success: true,
      data: updatedPrescription,
    });
  } catch (error) {
    console.error("Error updating prescription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE: Remove a Prescription
export async function DELETE(request: NextRequest) {
  const authResponse = await authorizedMiddleware(request);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const { recordId } = body;

    if (!recordId) {
      return NextResponse.json({ error: "Prescription ID is required" }, { status: 400 });
    }

    const deletedPrescription = await Prescription.findByIdAndDelete(recordId).exec();

    if (!deletedPrescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }
    const patient = await Patient.findOneAndUpdate(
      { Prescription: recordId }, // Find patient with this MedicalFinding ID
      { $pull: { Prescription: recordId } }, // Remove the MedicalFinding ID from the array
      { new: true } // Return the updated patient document
    );

    if (!patient) {
      console.warn(`No patient found with MedicalFinding ID: ${recordId}`);
    }
    return NextResponse.json({
      message: "Prescription deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting prescription:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
