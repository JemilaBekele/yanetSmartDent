import { NextRequest, NextResponse } from 'next/server';
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Note from '@/app/(models)/note';


// GET: Retrieve Notes by Patient ID
export async function GET(request: NextRequest, { params }: { params: { patientId: string } }) {
  try {
    const { patientId } = params;

    if (!patientId) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const Notes = await Note.find({ "patientId.id": patientId }).exec();

    if (!Notes || Notes.length === 0) {
      return NextResponse.json({ error: "No Notes found for this patient" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Notes retrieved successfully",
      success: true,
      data: Notes,
    });
  } catch (error) {
    console.error("Error retrieving Notes:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH: Update a Note
export async function PATCH(request: NextRequest) {
  const authResponse = await authorizedMiddleware(request);
  if (authResponse) return authResponse;

  try {
    const body = await request.json();
    const { recordId,  ...updates } = body;

    if (!recordId) {
      return NextResponse.json({ error: "Note ID is required" }, { status: 400 });
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

 

    // Update the Note
    const updatedNote = await Note.findByIdAndUpdate(
      recordId,
      updateData,
      { new: true }
    ).exec();

    if (!updatedNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }
    const changeHistoryData = {
      changeTime: new Date(),
      updatedBy: { id: user.id, username: user.username },
      changes: updates, // You can adjust the specific changes you want to track
    };
    await Note.findByIdAndUpdate(
      recordId,
      {
        $push: { changeHistory: changeHistoryData },
      },
      { new: true }
    );
    return NextResponse.json({
      message: "Note updated successfully",
      success: true,
      data: updatedNote,
    });
  } catch (error) {
    console.error("Error updating Note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


// DELETE: Remove a Note
export async function DELETE( request: NextRequest,
  { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);
  
  try {
    const { id } = params; // Patient ID

  if (!id) {
    return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
  }

    const deletedNote = await Note.findByIdAndDelete(id).exec();

    if (!deletedNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Remove the Note ID from the patient's Notes array
    const patient = await Patient.findOneAndUpdate(
      { Note: id },
      { $pull: { Note: id } },
      { new: true }
    );

    if (!patient) {
      console.warn(`No patient found with Note ID: ${id}`);
    }

    return NextResponse.json({
      message: "Note deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting Note:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
