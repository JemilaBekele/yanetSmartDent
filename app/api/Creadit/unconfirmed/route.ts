import { NextRequest, NextResponse } from 'next/server';
import Credit from '@/app/(models)/creadit';
import { authorizedMiddleware } from '@/app/helpers/authentication';

export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);

  try {
    // Find all Credit records where currentPayment.confirm is false and populate Patient data based on customer ID
    const unconfirmedCredits = await Credit.find({ 
      'currentPayment.confirm': false, 
      
    }).populate({ path: 'customerName.id', model: 'Patient' }).exec();

    if (unconfirmedCredits.length === 0) {
      return NextResponse.json({ message: "No unconfirmed Credit records available", data: [] });
    }
    

    // Create a Map to store unique patients based on their ID
    const uniquePatients = new Map();

    unconfirmedCredits.forEach((credit) => {
      if (credit.customerName && credit.customerName.id && !uniquePatients.has(credit.customerName.id._id)) {
        uniquePatients.set(credit.customerName.id._id, credit.customerName);
      }
    });

    // Convert the Map values to an array of unique patient data
    const uniquePatientData = Array.from(uniquePatients.values());
    console.log(uniquePatientData)
    return NextResponse.json({
      message: "Unconfirmed Credit records retrieved successfully",
      success: true,
      data: uniquePatientData,
    });
  } catch (error) {
    console.error("Error retrieving unconfirmed Credit records:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}