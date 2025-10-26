import { NextRequest, NextResponse } from 'next/server';

import Patient from '@/app/(models)/Patient';

import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';

import TreatmentPlan from '@/app/(models)/treatmentplan';
connect();



// UPDATE a Treatment Plan
export async function PATCH( request: NextRequest,
  { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);

  try {
    const { id } = params; // Treatment Plan ID

    if (!id) {
      return NextResponse.json({ error: "Treatment Plan ID is required" }, { status: 400 });
    }

    const { ...updates } = await request.json();

    console.log(id)

    const updatedPlan = await TreatmentPlan.findByIdAndUpdate(
      id,
      updates,
      { new: true }
    ).exec();

    if (!updatedPlan) {
      return NextResponse.json({ error: 'Treatment Plan not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Treatment plan updated successfully',
      success: true,
      data: updatedPlan,
    });
  } catch (error) {
    console.error('Error updating treatment plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE a Treatment Plan
export async function DELETE( request: NextRequest,
  { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);
  
  try {
    const { id } = params; // Patient ID

  if (!id) {
    return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
  }

    const deletedPlan = await TreatmentPlan.findByIdAndDelete(id).exec();

    if (!deletedPlan) {
      return NextResponse.json({ error: 'Treatment Plan not found' }, { status: 404 });
    }
 // Remove the MedicalFinding reference from the associated patient's record
 const patient = await Patient.findOneAndUpdate(
  { TreatmentPlan: id }, // Find patient with this MedicalFinding ID
  { $pull: { TreatmentPlan: id } }, // Remove the MedicalFinding ID from the array
  { new: true } // Return the updated patient document
);

if (!patient) {
  console.warn(`No patient found with MedicalFinding ID: ${id}`);
}
    return NextResponse.json({
      message: 'Treatment plan deleted successfully',
      success: true,
    });
  } catch (error) {
    console.error('Error deleting treatment plan:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await authorizedMiddleware(request);

  try {
    const { id } = params; // Treatment Plan ID

    if (!id) {
      return NextResponse.json({ error: "Treatment Plan ID is required" }, { status: 400 });
    }

    const treatmentPlan = await TreatmentPlan.findById(id)
      .populate({
        path: "services.serviceId",
        select: "service price categoryId",
        populate: {
          path: "categoryId",
          model: "Category", // Adjust based on your Category model name
          select: "name", // Only retrieve the category name
        },
      })
      .exec();

    if (!treatmentPlan) {
      return NextResponse.json({ error: "Treatment Plan not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Treatment Plan retrieved successfully",
      success: true,
      data: treatmentPlan,
    });
  } catch (error) {
    console.error("Error retrieving treatment plan:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
