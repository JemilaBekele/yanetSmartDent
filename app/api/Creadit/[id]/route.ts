
import {connect} from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import {authorizedMiddleware} from "@/app/helpers/authentication"

import Creadit from '@/app/(models)/creadit';


connect(); 


export async function PATCH(request: NextRequest) {
  // Use the authorized middleware to check authentication
  await authorizedMiddleware(request);

  try {
    const body = await request.json(); // Parse the request body
    const { creditId, ...data } = body; // Extract InvoiceId and the data to update

    if (!creditId) {
        console.log('ddd')
      return NextResponse.json({ error: "creadit ID is required" }, { status: 400 });
     
    }

    // Find the invoice by ID
    const creadit = await Creadit.findById(creditId).exec();
    if (!creadit) {
      return NextResponse.json({ error: "creadit not found" }, { status: 404 });
    }

    // Update the invoice with the new data
    Object.assign(creadit, data);

   
    creadit.status='Paid'
    creadit.currentPayment.confirm = true
    creadit.currentPayment.amount = 0
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