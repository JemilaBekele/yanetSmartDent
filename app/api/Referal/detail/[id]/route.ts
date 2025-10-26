import { NextRequest, NextResponse } from 'next/server';
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import ReferalCertificate from '@/app/(models)/Referal';


// GET: Retrieve ReferalCertificates by Patient ID
export async function GET(request: NextRequest, { params }: { params: { patientId: string } }) {
  try {
    const { patientId } = params;

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const ReferalCertificates = await ReferalCertificate.find({ "patientId.id": patientId }).exec();

    if (!ReferalCertificates || ReferalCertificates.length === 0) {
      return NextResponse.json({ error: "No ReferalCertificates found for this patient" }, { status: 404 });
    }

    return NextResponse.json({
      message: "ReferalCertificates retrieved successfully",
      success: true,
      data: ReferalCertificates,
    });
  } catch (error) {
    console.error("Error retrieving ReferalCertificates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update a ReferalCertificate
export async function PATCH(request: NextRequest) {
  const authResponse = await authorizedMiddleware(request);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const { recordId,  ...updates } = body;

    if (!recordId) {
      return NextResponse.json({ error: "ReferalCertificate ID is required" }, { status: 400 });
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

 

    // Update the ReferalCertificate
    const updatedReferalCertificate = await ReferalCertificate.findByIdAndUpdate(
      recordId,
      updateData,
      { new: true }
    ).exec();

    if (!updatedReferalCertificate) {
      return NextResponse.json({ error: "ReferalCertificate not found" }, { status: 404 });
    }
    const changeHistoryData = {
      changeTime: new Date(),
      updatedBy: { id: user.id, username: user.username },
      changes: updates, // You can adjust the specific changes you want to track
    };
    await ReferalCertificate.findByIdAndUpdate(
      recordId,
      {
        $push: { changeHistory: changeHistoryData },
      },
      { new: true }
    );
    return NextResponse.json({
      message: "ReferalCertificate updated successfully",
      success: true,
      data: updatedReferalCertificate,
    });
  } catch (error) {
    console.error("Error updating ReferalCertificate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


// DELETE: Remove a ReferalCertificate
export async function DELETE( request: NextRequest,
  { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);
  
  try {
    const { id } = params; // Patient ID

  if (!id) {
    return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
  }

    const deletedReferalCertificate = await ReferalCertificate.findByIdAndDelete(id).exec();

    if (!deletedReferalCertificate) {
      return NextResponse.json({ error: "ReferalCertificate not found" }, { status: 404 });
    }

    // Remove the ReferalCertificate ID from the patient's ReferalCertificates array
    const patient = await Patient.findOneAndUpdate(
      { ReferalCertificate: id },
      { $pull: { ReferalCertificate: id } },
      { new: true }
    );

    if (!patient) {
      console.warn(`No patient found with ReferalCertificate ID: ${id}`);
    }

    return NextResponse.json({
      message: "ReferalCertificate deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting ReferalCertificate:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
