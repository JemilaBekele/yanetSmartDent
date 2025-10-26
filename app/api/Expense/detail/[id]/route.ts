import { NextRequest, NextResponse } from 'next/server';
import Expense from '@/app/(models)/expense';

import { authorizedMiddleware } from '@/app/helpers/authentication';

import { connect } from '@/app/lib/mongodb';
connect();


  
  export async function PATCH(request: NextRequest) {
    const authrtoResponse = await authorizedMiddleware(request);
    if (authrtoResponse) return authrtoResponse;
  
    try {
      const body = await request.json(); // Parse the request body
      const { expeId, ...data } = body; // Extract expeId and updates
  
      if (!expeId) {
        return NextResponse.json({ error: "Finding ID is required" }, { status: 400 });
      }
  
      // Find and update the Expense by ID
      const updatedExpense = await Expense.findByIdAndUpdate(expeId, data, { new: true }).exec();
      if (!updatedExpense) {
        return NextResponse.json({ error: "Expense not found" }, { status: 404 });
      }
  
      return NextResponse.json({
        message: "Expense updated successfully",
        success: true,
        data: updatedExpense,
      });
    } catch (error) {
      console.error("Error updating Expense:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
  

  

  export async function DELETE(request: NextRequest) {
    // Authorization check
     authorizedMiddleware(request);
    
  
    try {
      // Parse the request body to get the expeId
      const body = await request.json(); // Assuming the expeId is in the JSON body
      const { expeId } = body;
  
      if (!expeId) {
        return NextResponse.json({ error: "Finding ID is required" }, { status: 400 });
      }
  
      // Find and delete the Expense by ID
      const deletedExpense = await Expense.findByIdAndDelete(expeId).exec();
      if (!deletedExpense) {
        return NextResponse.json({ error: "Expense not found" }, { status: 404 });
      }
  
      // Optionally, remove the finding reference from the associated patient
      // (You can add code here if you have references to update in related documents)
  
      return NextResponse.json({
        message: "Expensedeleted successfully",
        success: true,
      });
    } catch (error) {
      console.error("Error deleting Expense:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }