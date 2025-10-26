import { NextRequest, NextResponse } from 'next/server';
import Card from '@/app/(models)/card';
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';


interface Card {
  createdAt: string; // or Date, depending on how you store it
  // Add other fields as needed
}


  
export async function PATCH(request: NextRequest) {
 await authorizedMiddleware(request);
    
  
    try {
      const body = await request.json(); // Parse the request body
      const { recordId, ...data } = body; // Extract recordId and updates
  
      if (!recordId) {
        return NextResponse.json({ error: "Finding ID is required" }, { status: 400 });
      }
  
      // Find and update the Card finding by ID
      const updatedFinding = await Card.findByIdAndUpdate(recordId, data, { new: true }).exec();
      if (!updatedFinding) {
        return NextResponse.json({ error: "Card finding not found" }, { status: 404 });
      }
  
      return NextResponse.json({
        message: "Card finding updated successfully",
        success: true,
        data: updatedFinding,
      });
    } catch (error) {
      console.error("Error updating Card finding:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
        return NextResponse.json({ error: "Card ID is required" }, { status: 400 });
      }
  
      // Find and delete the card by ID
      const deletedCard = await Card.findByIdAndDelete(recordId).exec();
      if (!deletedCard) {
        return NextResponse.json({ error: "Card not found" }, { status: 404 });
      }
  
      // Remove the Card reference from the associated patient's record
      const patient = await Patient.findOneAndUpdate(
        { Card: recordId }, // Find patient with this Card ID
        { $pull: { Card: recordId } }, // Remove the Card ID from the array
        { new: true } // Return the updated patient document
      );
  
      if (!patient) {
        console.warn(`No patient found with Card ID: ${recordId}`);
      }
  
      return NextResponse.json({
        message: "Card deleted successfully and reference removed from patient.",
        success: true,
      });
    } catch (error) {
      console.error("Error deleting card:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }