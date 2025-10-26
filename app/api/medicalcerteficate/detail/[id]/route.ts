import { NextRequest, NextResponse } from 'next/server';
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import MedicalCertificate from '@/app/(models)/letter';

// GET: Retrieve Medical Certificates by Patient ID
export async function GET(request: NextRequest, { params }: { params: { patientId: string } }) {
  try {
    const { patientId } = params;

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const medicalCertificates = await MedicalCertificate.find({ "patientId.id": patientId }).exec();

    if (!medicalCertificates || medicalCertificates.length === 0) {
      return NextResponse.json({ error: "No medical certificates found for this patient" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Medical certificates retrieved successfully",
      success: true,
      data: medicalCertificates,
    });
  } catch (error) {
    console.error("Error retrieving medical certificates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update a Medical Certificate
export async function PATCH(request: NextRequest) {
  const authResponse = await authorizedMiddleware(request);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const { recordId,  ...updates } = body;

    if (!recordId) {
      return NextResponse.json({ error: "Medical Certificate ID is required" }, { status: 400 });
    }

    const user = (request as { user: { id: string; username: string } }).user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }
    const updateData = {
      ...updates,
      updatedBy: { id: user.id, username: user.username },
      updateTime: new Date(),
    };

 

    // Update the medical certificate
    const updatedMedicalCertificate = await MedicalCertificate.findByIdAndUpdate(
      recordId,
      updateData,
      { new: true }
    ).exec();

    if (!updatedMedicalCertificate) {
      return NextResponse.json({ error: "Medical Certificate not found" }, { status: 404 });
    }
    const changeHistoryData = {
      changeTime: new Date(),
      updatedBy: { id: user.id, username: user.username },
      changes: updates, // You can adjust the specific changes you want to track
    };
    await MedicalCertificate.findByIdAndUpdate(
      recordId,
      {
        $push: { changeHistory: changeHistoryData },
      },
      { new: true }
    );
    return NextResponse.json({
      message: "Medical certificate updated successfully",
      success: true,
      data: updatedMedicalCertificate,
    });
  } catch (error) {
    console.error("Error updating medical certificate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


// DELETE: Remove a Medical Certificate
export async function DELETE( request: NextRequest,
  { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);
  
  try {
    const { id } = params; // Patient ID

  if (!id) {
    return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
  }

    const deletedMedicalCertificate = await MedicalCertificate.findByIdAndDelete(id).exec();

    if (!deletedMedicalCertificate) {
      return NextResponse.json({ error: "Medical Certificate not found" }, { status: 404 });
    }

    // Remove the Medical Certificate ID from the patient's MedicalCertificates array
    const patient = await Patient.findOneAndUpdate(
      { MedicalCertificate: id },
      { $pull: { MedicalCertificate: id } },
      { new: true }
    );

    if (!patient) {
      console.warn(`No patient found with Medical Certificate ID: ${id}`);
    }

    return NextResponse.json({
      message: "Medical certificate deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting medical certificate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
