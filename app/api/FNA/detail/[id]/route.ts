import { NextRequest, NextResponse } from 'next/server';
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import FNA from '@/app/(models)/FNA';


// GET: Retrieve FNAs by Patient ID
export async function GET(request: NextRequest, { params }: { params: { patientId: string } }) {
  try {
    const { patientId } = params;

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const FNAs = await FNA.find({ "patientId.id": patientId }).exec();

    if (!FNAs || FNAs.length === 0) {
      return NextResponse.json({ error: "No FNAs found for this patient" }, { status: 404 });
    }

    return NextResponse.json({
      message: "FNAs retrieved successfully",
      success: true,
      data: FNAs,
    });
  } catch (error) {
    console.error("Error retrieving FNAs:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update a FNA
export async function PATCH(request: NextRequest) {
  const authResponse = await authorizedMiddleware(request);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const { recordId,  ...updates } = body;

    if (!recordId) {
      return NextResponse.json({ error: "FNA ID is required" }, { status: 400 });
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

 

    // Update the FNA
    const updatedFNA = await FNA.findByIdAndUpdate(
      recordId,
      updateData,
      { new: true }
    ).exec();

    if (!updatedFNA) {
      return NextResponse.json({ error: "FNA not found" }, { status: 404 });
    }
    const changeHistoryData = {
      changeTime: new Date(),
      updatedBy: { id: user.id, username: user.username },
      changes: updates, // You can adjust the specific changes you want to track
    };
    await FNA.findByIdAndUpdate(
      recordId,
      {
        $push: { changeHistory: changeHistoryData },
      },
      { new: true }
    );
    return NextResponse.json({
      message: "FNA updated successfully",
      success: true,
      data: updatedFNA,
    });
  } catch (error) {
    console.error("Error updating FNA:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


// DELETE: Remove a FNA
export async function DELETE( request: NextRequest,
  { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);
  
  try {
    const { id } = params; // Patient ID

  if (!id) {
    return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
  }

    const deletedFNA = await FNA.findByIdAndDelete(id).exec();

    if (!deletedFNA) {
      return NextResponse.json({ error: "FNA not found" }, { status: 404 });
    }

    // Remove the FNA ID from the patient's FNAs array
    const patient = await Patient.findOneAndUpdate(
      { FNA: id },
      { $pull: { FNA: id } },
      { new: true }
    );

    if (!patient) {
      console.warn(`No patient found with FNA ID: ${id}`);
    }

    return NextResponse.json({
      message: "FNA deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting FNA:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
