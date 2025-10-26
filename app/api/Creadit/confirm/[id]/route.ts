import { NextRequest, NextResponse } from 'next/server';
import Credit from '@/app/(models)/creadit';
import CreditHistory from '@/app/(models)/credithistory'; 
import {connect} from "@/app/lib/mongodb";// Import the History model
import { authorizedMiddleware } from '@/app/helpers/authentication'; // Adjust the path according to your project structure
connect();

export async function PATCH(request: NextRequest) {
  await authorizedMiddleware(request);

  try {
    // Ensure the request contains the necessary user object
    if (typeof request === "object" && request !== null && "user" in request) {
      const user = (request as { user: { id: string; username: string } }).user;
      console.log("User Data:", user);

      // Parse the request body
      const { CreditId, currentPayment } = await request.json();
console.log(CreditId)
      // Validate the payment amount
      const paymentAmount = Number(currentPayment);
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        return NextResponse.json(
          { message: "Invalid payment amount.", success: false },
          { status: 400 }
        );
      }

      // Find the credit entry by ID
      const credit = await Credit.findById(CreditId);

      if (!credit) {
        return NextResponse.json(
          { message: "Credit not found.", success: false },
          { status: 404 }
        );
      }

      // Update the total paid and balance
      credit.totalPaid += paymentAmount;
      credit.balance = credit.totalAmount - credit.totalPaid;

      // Update the current payment details
      credit.currentPayment = {
        amount: 0, // Reset current payment
        receipt: true, // Indicate receipt generated
        confirm: true, // Confirm the payment
        date: new Date(), // Set the payment date
      };

      // Update the status based on payment progress
      credit.status = credit.totalPaid >= credit.totalAmount ? "Paid" : "Pending";

      // Save the updated credit entry
      await credit.save();

      // Create a new credit history entry
      const historyCredit = new CreditHistory({
        Credit: {
          id: credit._id,
          amount: paymentAmount,
          customerName: credit.customerName,
          created: {
            id: credit.createdBy.id,
            username: credit.createdBy.username,
          },
        },
        createdBy: {
          id: user.id,
          username: user.username,
        },
      });

      // Save the history entry
      await historyCredit.save();

      // Respond with the updated credit and the history entry
      return NextResponse.json(
        {
          message: "Credit updated successfully",
          success: true,
          data: credit,
          CreditHistory: historyCredit,
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { message: "Unauthorized request.", success: false },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error("Error updating credit:", error);
    return NextResponse.json(
      { message: "Failed to update credit.", success: false },
      { status: 500 }
    );
  }
}
