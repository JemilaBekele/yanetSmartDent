import { NextRequest, NextResponse } from 'next/server';
import Healthinfo from '@/app/(models)/healthinfo';
import Patient from "@/app/(models)/Patient";
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
connect();

interface Healthinfo {
  createdAt: string; // or Date, depending on how you store it
  // Add other fields as needed
}
// Create a new medical finding
export async function GET(request: NextRequest, { params }: { params: { patientId: string; recordId: string } }) {
    
  
    try {
      const { patientId, recordId } = params;
      if (!patientId || !recordId) {
        return NextResponse.json({ error: "Patient ID and Finding ID are required" }, { status: 400 });
      }
      const patient = await Patient.findById(patientId).exec();
      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }
  
      // Find the medical finding by ID
      const finding = await Healthinfo.findById(recordId).exec();
      if (!finding) {
        return NextResponse.json({ error: "Medical finding not found" }, { status: 404 });
      }
  
      return NextResponse.json({
        message: "Medical finding retrieved successfully",
        success: true,
        data: finding,
      });
    } catch (error) {
      console.error("Error retrieving medical finding:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  
  export async function PATCH(
    request: NextRequest
  ) {
    const authrtoResponse = await authorizedMiddleware(request);
    if (authrtoResponse) return authrtoResponse;
  
    try {
      const body = await request.json(); // Parse the request body
      const { recordId, ...data } = body; // Extract recordId and updates
  
      if (!recordId) {
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
      const updatedHealthInfo = await Healthinfo.findByIdAndUpdate(
        recordId,
        updateData,
        { new: true } // Return the updated document
      );
  
      if (!updatedHealthInfo) {
        return NextResponse.json({ error: "Health information not found" }, { status: 404 });
      }
  
      // Step 2: Append to 'changeHistory' field using $push in a separate update operation
      const changeHistoryData = {
        changeTime: new Date(),
        updatedBy: { id: user.id, username: user.username },
        changes: data, // Or specific changes you want to track
      };
  
      await Healthinfo.findByIdAndUpdate(
        recordId,
        {
          $push: { changeHistory: changeHistoryData },
        },
        { new: true }
      );
  
      return NextResponse.json({
        message: "Health information updated successfully",
        success: true,
        data: updatedHealthInfo,
      });
  
    } catch (error) {
      console.error("Error updating health information:", error);
      return NextResponse.json({ error: "Error updating health information" }, { status: 500 });
    }
  }
  

  

  export async function DELETE(request: NextRequest) {
    // Authorization check
    await authorizedMiddleware(request);
  
    try {
      // Parse the request body to get the recordId
      const body = await request.json();
      const { recordId } = body;
  
      if (!recordId) {
        return NextResponse.json({ error: "Healthinfo ID is required" }, { status: 400 });
      }
  
      // Find and delete the Healthinfo record by ID
      const deletedFinding = await Healthinfo.findByIdAndDelete(recordId).exec();
      if (!deletedFinding) {
        return NextResponse.json({ error: "Healthinfo record not found" }, { status: 404 });
      }
  
      // Remove the Healthinfo reference from the associated patient's record
      const patient = await Patient.findOneAndUpdate(
        { Healthinfo: recordId }, // Find patient with this Healthinfo ID
        { $pull: { Healthinfo: recordId } }, // Remove the Healthinfo ID from the array
        { new: true } // Return the updated patient document
      );
  
      if (!patient) {
        console.warn(`No patient found with Healthinfo ID: ${recordId}`);
      }
  
      return NextResponse.json({
        message: "Healthinfo record deleted successfully and reference removed from patient",
        success: true,
      });
    } catch (error) {
      console.error("Error deleting Healthinfo record:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }