import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/app/lib/mongodb";
import DentalLabForm from "@/app/(models)/labratory";
import Patient from "@/app/(models)/Patient";
import { authorizedMiddleware } from "@/app/helpers/authentication";
connect();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    console.log("Fetching DentalLabForm with ID:", id);
    if (!id) {
      return NextResponse.json(
        { message: "DentalLabForm ID is required" },
        { status: 400 }
      );
    }



    // Find the form by ID and populate related data if needed
    const dentalLabForm = await DentalLabForm.findById(id)

    if (!dentalLabForm) {
      return NextResponse.json(
        { message: "DentalLabForm not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        message: "DentalLabForm retrieved successfully", 
        form: dentalLabForm 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error while fetching DentalLabForm:", error);
    return NextResponse.json(
      { message: "Failed to retrieve DentalLabForm" },
      { status: 500 }
    );
  }
}
// ================= PATCH =================
// PATCH: Update a Dental Lab Form
export async function PATCH(request: NextRequest) {
  const authResponse = await authorizedMiddleware(request);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const { recordId, ...updates } = body;

    if (!recordId) {
      return NextResponse.json({ error: "Dental Lab Form ID is required" }, { status: 400 });
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

    // Update the dental lab form
    const updatedDentalLabForm = await DentalLabForm.findByIdAndUpdate(
      recordId,
      updateData,
      { new: true }
    ).exec();

    if (!updatedDentalLabForm) {
      return NextResponse.json({ error: "Dental Lab Form not found" }, { status: 404 });
    }

    const changeHistoryData = {
      changeTime: new Date(),
      updatedBy: { id: user.id, username: user.username },
      changes: updates,
    };

    await DentalLabForm.findByIdAndUpdate(
      recordId,
      {
        $push: { changeHistory: changeHistoryData },
      },
      { new: true }
    );

    return NextResponse.json({
      message: "Dental lab form updated successfully",
      success: true,
      data: updatedDentalLabForm,
    });
  } catch (error) {
    console.error("Error updating dental lab form:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ================= DELETE =================
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { message: "DentalLabForm ID is required" },
        { status: 400 }
      );
    }

    // First get the form to know which patient to update
    const formToDelete = await DentalLabForm.findById(id);
    
    if (!formToDelete) {
      return NextResponse.json(
        { message: "DentalLabForm not found" },
        { status: 404 }
      );
    }

    // Remove the form reference from the patient
    await Patient.findByIdAndUpdate(
      formToDelete.patient,
      { $pull: { DentalLabForms: id } }
    );

    // Delete the form
    const deletedForm = await DentalLabForm.findByIdAndDelete(id);

    return NextResponse.json(
      { message: "DentalLabForm deleted successfully", form: deletedForm },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error while deleting DentalLabForm:", error);
    return NextResponse.json(
      { message: "Failed to delete DentalLabForm" },
      { status: 500 }
    );
  }
}

