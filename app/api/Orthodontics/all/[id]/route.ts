import { NextRequest, NextResponse } from 'next/server';

import Patient from "@/app/(models)/Patient";
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import Orthodontics from '@/app/(models)/orthodontics';
connect();

// Create a new medical finding
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {

  await authorizedMiddleware(request);
  try {
  
    const { id } = params; // Treatment Plan ID


    if (!id) {
      return NextResponse.json({ error: "Orthodontics ID is required" }, { status: 400 });
    }

    const findi = await Orthodontics.findById(id).exec();
    if (!findi) {
      return NextResponse.json({ error: "Orthodontics not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Orthodontics retrieved successfully",
      success: true,
      data: findi,
    });
  } catch (error) {
    console.error("Error retrieving medical finding:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


  
  
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authrtoResponse = await authorizedMiddleware(request);
  if (authrtoResponse) return authrtoResponse;

  try {
    const { id } = params; // Orthodontics ID
    if (!id) {
      return NextResponse.json({ error: "Orthodontics ID is required" }, { status: 400 });
    }

    const body = await request.json(); // Parse the request body
    const { updates, ...data } = body; // Separate updates from other data

    const user = (request as { user: { id: string; username: string } }).user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }

    // Step 1: Update fields except for updates (or changeHistory)
    const updateData = {
      ...data,
      updatedBy: { id: user.id, username: user.username },
      updateTime: new Date(),
    };

    // Update the document (excluding the 'updates' field update)
    const updated = await Orthodontics.findByIdAndUpdate(id, updateData, { new: true }).exec();
    if (!updated) {
      return NextResponse.json({ error: "Orthodontics not found" }, { status: 404 });
    }

    // Step 2: Append to 'changeHistory' field using $push in a separate update operation
    const updateHistoryData = {
      updateTime: new Date(),
      updatedBy: { id: user.id, username: user.username },
      changes: updates, // Track specific changes (or all updates)
    };

    await Orthodontics.findByIdAndUpdate(
      id,
      {
        $push: { changeHistory: updateHistoryData },
      },
      { new: true }
    );

    return NextResponse.json({
      message: "Orthodontics updated successfully",
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error("Error updating Orthodontics:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


  

  

  export async function DELETE(request: NextRequest,
    { params }: { params: { id: string } }) {
    // Authorization check
     authorizedMiddleware(request);
    
  
    try {
      const { id } = params; // Treatment Plan ID


      if (!id) {
        return NextResponse.json({ error: "Orthodontics ID is required" }, { status: 400 });
      }
  
      
  
      // Find and delete the medical finding by ID
      const deletedFi = await Orthodontics.findByIdAndDelete(id).exec();
      if (!deletedFi) {
        return NextResponse.json({ error: "Orthodontics not found" }, { status: 404 });
      }
  
      // Remove the MedicalFinding reference from the associated patient's record
      const patient = await Patient.findOneAndUpdate(
        { Orthodontics: id }, // Find patient with this MedicalFinding ID
        { $pull: { Orthodontics: id } }, // Remove the MedicalFinding ID from the array
        { new: true } // Return the updated patient document
      );
  
      if (!patient) {
        console.warn(`No patient found with MedicalFinding ID: ${id}`);
      }
      return NextResponse.json({
        message: "Orthodontics deleted successfully",
        success: true,
      });
    } catch (error) {
      console.error("Error deleting Orthodontics:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }