import { NextRequest, NextResponse } from 'next/server';

import Patient from '@/app/(models)/Patient';

import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import Consent from '@/app/(models)/consent';

connect();



// UPDATE a Treatment Plan
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authrtoResponse = await authorizedMiddleware(request);
  if (authrtoResponse) return authrtoResponse;

  try {
    const { id } = params; // Consent ID
    if (!id) {
      return NextResponse.json({ error: "Consent ID is required" }, { status: 400 });
    }

    const body = await request.json(); // Parse the request body
    const { ...data } = body; // Destructure to extract updates and other data

    if (!id) {
      return NextResponse.json({ error: "Finding ID is required" }, { status: 400 });
    }

    const user = (request as { user: { id: string; username: string } }).user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }

    // Step 1: Update other fields except for changeHistory
    const updateData = {
      ...data,
      updatedBy: { id: user.id, username: user.username },
      updateTime: new Date(),
    };

    // Update the document (excluding the 'changeHistory' field update)
    const updateResult = await Consent.findByIdAndUpdate(
      id,
      updateData,
      { new: true } // Return the updated document
    );

    if (!updateResult) {
      return NextResponse.json({ error: "Consent not found" }, { status: 404 });
    }

    // Step 2: Append to 'changeHistory' field using $push in a separate update operation
    const changeHistoryData = {
      changeTime: new Date(),
      updatedBy: { id: user.id, username: user.username },
      changes: data, // You can adjust the specific changes you want to track
    };

    await Consent.findByIdAndUpdate(
      id,
      {
        $push: { changeHistory: changeHistoryData },
      },
      { new: true }
    );

    return NextResponse.json({ success: "Consent updated successfully" }, { status: 200 });

  } catch (error) {
    console.error("Error updating consent:", error);
    return NextResponse.json({ error: "Error updating consent" }, { status: 500 });
  }
}

// DELETE a Consent Plan
export async function DELETE( request: NextRequest,
  { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);
  
  try {
    const { id } = params; // Patient ID

  if (!id) {
    return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
  }

    const deletedPlan = await Consent.findByIdAndDelete(id).exec();

    if (!deletedPlan) {
      return NextResponse.json({ error: 'Consent Plan not found' }, { status: 404 });
    }
 // Remove the MedicalFinding reference from the associated patient's record
 const patient = await Patient.findOneAndUpdate(
  { Consent: id }, // Find patient with this MedicalFinding ID
  { $pull: { Consent: id } }, // Remove the MedicalFinding ID from the array
  { new: true } // Return the updated patient document
);

if (!patient) {
  console.warn(`No patient found with MedicalFinding ID: ${id}`);
}
    return NextResponse.json({
      message: 'Consent plan deleted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error deleting Consent plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


// Create a new medical finding
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {

  await authorizedMiddleware(request);
  try {
  
    const { id } = params; // Treatment Plan ID


    if (!id) {
      return NextResponse.json({ error: "Consent ID is required" }, { status: 400 });
    }

    const findi = await Consent.findById(id).exec();
    if (!findi) {
      return NextResponse.json({ error: "Consent not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Consent retrieved successfully",
      success: true,
      data: findi,
    });
  } catch (error) {
    console.error("Error retrieving medical finding:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
