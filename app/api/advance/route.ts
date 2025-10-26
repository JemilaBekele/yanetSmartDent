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
      console.log("User Data:", user);
      
      const userDetails = await User.findById(user.id).select('branch').exec();
      if (!userDetails) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Parse the request body
      const body = await request.json();
      const { patientId, amount } = body; 
      
      console.log("Received data:", { patientId, amount, typeOfAmount: typeof amount });

      // Validate required fields
      if (!patientId || amount === undefined || amount === null) {
        return NextResponse.json({
          message: 'Patient ID and amount are required.',
          success: false,
        }, { status: 400 });
      }

      // Convert amount to number - handle string with leading zeros
      let paymentAmount: number;
      
      if (typeof amount === 'string') {
        // Remove any leading zeros and convert to number
        paymentAmount = parseFloat(amount.replace(/^0+/, ''));
      } else {
        paymentAmount = Number(amount);
      }
      
      console.log("Converted amount:", paymentAmount);

      // Validate the converted amount
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        return NextResponse.json({
          message: 'Amount must be a valid number greater than 0.',
          success: false,
          data: {
            originalAmount: amount,
            convertedAmount: paymentAmount
          }
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

      // Get current price and advance
      const currentPrice = patient.price || 0;
      const currentAdvance = patient.Advance || 0;
      
      console.log("Current patient data:", {
        price: currentPrice,
        advance: currentAdvance,
        patientName: patient.firstname
      });

      // Calculate new advance amount (ADD instead of subtract)
      const newAdvanceAmount = currentAdvance + paymentAmount;
      
      // Calculate the remaining balance
      const remainingBalance = Math.max(0, currentPrice - newAdvanceAmount);
      const isPaymentComplete = newAdvanceAmount >= currentPrice;
      
      console.log("Payment calculations:", {
        newAdvanceAmount,
        currentPrice,
        remainingBalance,
        isPaymentComplete
      });

      // Update the advance (INCREASE it)
      const updatedPatient = await Patient.findByIdAndUpdate(
        patientId,
        {
          $set: {
            Advance: newAdvanceAmount
          }
        },
        { new: true } // Return updated document
      );

      // Create a history record for the advance payment
      const historyEntry = new History({
        Invoice: {
          amount: paymentAmount,
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
          paymentAdded: true, // Mark as payment addition
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
        message: 'Payment added to advance successfully',
        success: true,
        data: {
          patient: updatedPatient,
          paymentAmount: paymentAmount,
          newAdvance: updatedPatient.Advance,
          isPaymentComplete: isPaymentComplete,
          remainingBalance: remainingBalance,
          // Additional helpful fields
          totalPrice: currentPrice,
          advanceCoverage: Math.min(newAdvanceAmount, currentPrice), // How much of price is covered by advance
          excessAdvance: Math.max(0, newAdvanceAmount - currentPrice) // Any advance beyond the price
        },
        history: historyEntry,
      }, { status: 200 });
    }
  } catch (error) {
    // Log and return an error response
    console.error('Error processing advance payment:', error);
    return NextResponse.json({
      message: 'Failed to process payment.',
      success: false,
    }, { status: 500 });
  }
}

// Optional: GET endpoint to check patient's price and advance
export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);

  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({
        message: 'Patient ID is required.',
        success: false,
      }, { status: 400 });
    }

    const patient = await Patient.findById(patientId).select('price Advance firstname cardno branch');

    if (!patient) {
      return NextResponse.json({
        message: 'Patient not found.',
        success: false,
      }, { status: 404 });
    }

    const currentPrice = patient.price || 0;
    const currentAdvance = patient.Advance || 0;
    
    // Payment is complete when advance >= price
    const isPaymentComplete = currentAdvance >= currentPrice;
    const remainingBalance = Math.max(0, currentPrice - currentAdvance);
    const advanceCoverage = Math.min(currentAdvance, currentPrice);
    const excessAdvance = Math.max(0, currentAdvance - currentPrice);

    return NextResponse.json({
      message: 'Patient data retrieved successfully',
      success: true,
      data: {
        price: currentPrice,
        advance: currentAdvance,
        patientName: patient.firstname,
        cardno: patient.cardno,
        remainingBalance: remainingBalance,
        isPaymentComplete: isPaymentComplete,
        advanceCoverage: advanceCoverage,
        excessAdvance: excessAdvance
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error retrieving patient data:', error);
    return NextResponse.json({
      message: 'Failed to retrieve patient data.',
      success: false,
    }, { status: 500 });
  }
}