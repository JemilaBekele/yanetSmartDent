
import {connect} from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import {authorizedMiddleware} from "@/app/helpers/authentication"

import Creadit from '@/app/(models)/creadit';
import Patient from '@/app/(models)/Patient';

connect(); 



export async function GET(request: NextRequest, ) {
    await authorizedMiddleware(request);
    try {
     
      const body = await request.json(); // Assuming the invoiceId is in the JSON body
      const { creaditId } = body;
      
      
      if (!creaditId) {
        return NextResponse.json({ error: "creadit ID is required" }, { status: 400 });
      }
  
      const creadit = await Creadit.findById({ _id: creaditId });
  
      if (!creadit) {
        return NextResponse.json({ error: "creadit not found" }, { status: 404 });
      }
  
      return NextResponse.json(creadit);
    } catch (error: unknown) {
      console.error("Error in GET /api/creadit/payment/detail:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }




  export async function DELETE(request: NextRequest) {
    // Authorization check
    await authorizedMiddleware(request);
  
    try {
      // Parse the request body to get the creaditId
      const body = await request.json();
      const { creaditId } = body;
  
      if (!creaditId) {
        return NextResponse.json({ error: "Credit ID is required" }, { status: 400 });
      }
  
      // Find and delete the credit by ID
      const deletedCredit = await Creadit.findByIdAndDelete(creaditId).exec();
      if (!deletedCredit) {
        return NextResponse.json({ error: "Credit not found" }, { status: 404 });
      }
  
      // Find the patient associated with this credit and remove the credit reference from their record
      const patient = await Patient.findOneAndUpdate(
        { Credit: creaditId }, // Find patient with this credit ID
        { $pull: { Credit: creaditId } }, // Remove the credit ID from the array
        { new: true } // Return the updated patient document
      );
  
      if (!patient) {
        console.warn(`No patient found with Credit ID: ${creaditId}`);
      }
  
      return NextResponse.json({
        message: "Credit deleted successfully and reference removed from patient",
        success: true,
      });
    } catch (error) {
      console.error("Error deleting credit:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
  


  // Function to handle PATCH requests
 // Function to handle PATCH requests
export async function PATCH(request: NextRequest) {
  // Use the authorized middleware to check authentication
  await authorizedMiddleware(request);

  try {
    const body = await request.json(); // Parse the request body
    const { creaditId, ...data } = body; // Extract InvoiceId and the data to update

    if (!creaditId) {
      return NextResponse.json({ error: "creadit ID is required" }, { status: 400 });
    }

    // Find the invoice by ID
    const creadit = await Creadit.findById(creaditId).exec();
    if (!creadit) {
      console.log("error")
    }

    // Update the invoice with the new data
    Object.assign(creadit, data);

   
    creadit.balance = creadit.totalAmount - creadit.totalPaid;

    // Save the updated invoice
    await creadit.save();

    return NextResponse.json({
      message: "creadit updated successfully",
      success: true,
      data: creadit,
    });
  } catch (error) {
    console.error("Error updating creadit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}