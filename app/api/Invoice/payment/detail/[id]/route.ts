
import {connect} from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import {authorizedMiddleware} from "@/app/helpers/authentication"
import Patient from '@/app/(models)/Patient';
import Invoice from '@/app/(models)/Invoice';


connect(); 



export async function GET(request: NextRequest, ) {
    await authorizedMiddleware(request);
    try {
     
      const body = await request.json(); // Assuming the invoiceId is in the JSON body
      const { invoiceId } = body;
      
      
      if (!invoiceId) {
        return NextResponse.json({ error: "invoice ID is required" }, { status: 400 });
      }
  
      const invoice = await Invoice.findById({ _id: invoiceId });
  
      if (!invoice) {
        return NextResponse.json({ error: "invoice not found" }, { status: 404 });
      }
  
      return NextResponse.json(invoice);
    } catch (error: unknown) {
      console.error("Error in GET /api/invoice/payment/detail:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }




  export async function DELETE(request: NextRequest) {
    // Authorization check
    await authorizedMiddleware(request);
  
    try {
      // Parse the request body to get the invoiceId
      const body = await request.json();
      const { invoiceId } = body;
  
      if (!invoiceId) {
        return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
      }
  
      // Find and delete the invoice by ID
      const deletedInvoice = await Invoice.findByIdAndDelete(invoiceId).exec();
      if (!deletedInvoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
  
      // Remove the invoice reference from the associated patient's record
      const patient = await Patient.findOneAndUpdate(
        { Invoice: invoiceId }, // Find patient with this invoice ID
        { $pull: { Invoice: invoiceId } }, // Remove the invoice ID from the array
        { new: true } // Return the updated patient document
      );
  
      if (!patient) {
        console.warn(`No patient found with Invoice ID: ${invoiceId}`);
      }
  
      return NextResponse.json({
        message: "Invoice deleted successfully and reference removed from patient",
        success: true,
      });
    } catch (error) {
      console.error("Error deleting invoice:", error);
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
    const { InvoiceId, ...data } = body; // Extract InvoiceId and the data to update

    if (!InvoiceId) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    // Find the invoice by ID
    const invoice = await Invoice.findById(InvoiceId).exec();
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Update the invoice with the new data
    Object.assign(invoice, data);

    // Recalculate the total amount and balance
    
    invoice.balance = invoice.totalAmount - invoice.totalpaid;

    // Save the updated invoice
    await invoice.save();

    return NextResponse.json({
      message: "Invoice updated successfully",
      success: true,
      data: invoice,
    });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


