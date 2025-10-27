import { NextRequest, NextResponse } from 'next/server';
import Patient from '@/app/(models)/Patient';
import History from '@/app/(models)/history';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import User from '@/app/(models)/User';

connect();

export async function PATCH(request: NextRequest) {
  // Use the authorized middleware to check authentication
  await authorizedMiddleware(request);

  try {
    if (typeof request === 'object' && request !== null && 'user' in request) {
      const user = (request as { user: { id: string; username: string } }).user;
      const userDetails = await User.findById(user.id).select('branch').exec();
      if (!userDetails) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      // Parse the request body
      const { patientId, amount } = await request.json(); 
      
      // Validate required fields
      if (!patientId || !amount) {
        return NextResponse.json({
          message: 'Patient ID and amount are required.',
          success: false,
        }, { status: 400 });
      }

      if (amount <= 0) {
        return NextResponse.json({
          message: 'Amount must be greater than 0.',
          success: false,
        }, { status: 400 });
      }

      // Find the patient by ID
      const patient = await Patient.findById(patientId);
      
      if (!patient) {
        return NextResponse.json({
          message: 'Patient not found.',
          success: false,
        }, { status: 404 });
      }

      // Check if patient has sufficient advance
      if (!patient.Advance || patient.Advance < amount) {
        return NextResponse.json({
          message: 'Insufficient advance amount.',
          success: false,
          data: {
            currentAdvance: patient.Advance || 0,
            requestedAmount: amount
          }
        }, { status: 400 });
      }

      // Update patient's advance and price
      const updatedPatient = await Patient.findByIdAndUpdate(
        patientId,
        {
          $inc: {
            Advance: -amount, // Decrease advance by the amount
            price: -amount    // Decrease total price by the amount (if price represents total amount due)
          }
        },
        { new: true } // Return updated document
      );

      // Create a history record for the advance payment
      const historyEntry = new History({
        Invoice: {
          amount: amount,
          receipt: true,
          customerName: {
            id: patient._id,
            username: `${patient.firstname}`.trim(),
            cardno: patient.cardno,
          },
          created: {  
            id: user.id,
            username: user.username,
          },
          advance: true, // Mark as advance payment
        },
        createdBy: {
          id: user.id,
          username: user.username,
        },
        branch: userDetails.branch
      });

      // Save the history entry
      await historyEntry.save();

      // Return the success response
      return NextResponse.json({
        message: 'Advance payment applied successfully',
        success: true,
        data: {
          patient: updatedPatient,
          paymentAmount: amount,
          remainingAdvance: updatedPatient.Advance
        },
        history: historyEntry,
      }, { status: 200 });
    }
  } catch (error) {
    // Log and return an error response
    console.error('Error processing advance payment:', error);
    return NextResponse.json({
      message: 'Failed to process advance payment.',
      success: false,
    }, { status: 500 });
  }
}

