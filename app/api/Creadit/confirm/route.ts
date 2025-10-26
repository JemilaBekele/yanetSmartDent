import { NextRequest, NextResponse } from "next/server";
import Credit from "@/app/(models)/creadit";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import CreditHistory from "@/app/(models)/credithistory";
import { connect } from "@/app/lib/mongodb";

connect();

export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);

  try {
    // Find all Credit records where currentPayment.confirm is false and populate Patient data based on customer ID
    const unconfirmedCredits = await Credit.find({
      "currentPayment.confirm": false,
    })
      .populate({ path: "customerName.id", model: "Patient" })
      .exec();

    if (unconfirmedCredits.length === 0) {
      return NextResponse.json({ message: "No unconfirmed Credit records available", data: [] });
    }

    return NextResponse.json({
      message: "Unconfirmed Credit records retrieved successfully",
      success: true,
      data: unconfirmedCredits,
    });
  } catch (error) {
    console.error("Error retrieving unconfirmed Credit records:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface CreditToUpdate {
  creditId: string;
  paymentAmount: number;
}

export async function PATCH(request: NextRequest) {
  await authorizedMiddleware(request);

  try {
    if (typeof request === "object" && request !== null && "user" in request) {
      const user = (request as { user: { id: string; username: string } }).user;
      console.log("User Data:", user);

      // Parse the request body to get creditsToUpdate array
      const { creditsToUpdate }: { creditsToUpdate: CreditToUpdate[] } = await request.json();

      if (!Array.isArray(creditsToUpdate) || creditsToUpdate.length === 0) {
        return NextResponse.json(
          { message: "No valid credits to update.", success: false },
          { status: 400 }
        );
      }

      const updatedCredits: typeof Credit[] = [];
      const historyEntries: typeof CreditHistory[] = [];

      // Iterate over each object in creditsToUpdate
      for (const { creditId, paymentAmount } of creditsToUpdate) {
        const credit = await Credit.findById(creditId);

        if (!credit) {
          console.warn(`Credit not found for ID: ${creditId}`);
          continue; // Skip if credit not found
        }

        // Update the total paid and balance
        const amount = Number(paymentAmount);
        if (isNaN(amount) || amount <= 0) {
          console.warn(`Invalid payment amount for credit ID: ${creditId}`);
          continue;
        }

        credit.totalPaid += amount;
        credit.balance = credit.totalAmount - credit.totalPaid;
        credit.currentPayment.amount = 0; // Reset current payment amount
        credit.currentPayment.receipt = 0; // Reset receipt
        credit.currentPayment.confirm = true; // Confirm the payment
        credit.currentPayment.date = new Date(); // Set the payment date

        // Update the status based on totalPaid and totalAmount
        credit.status = credit.totalPaid >= credit.totalAmount ? "Paid" : "Pending";

        // Save the updated credit
        await credit.save();
        updatedCredits.push(credit);

        // Create a history record
        const historyCredit = new CreditHistory({
          Credit: {
            id: credit._id,
             amount: paymentAmount,
            customerName: { id: credit.customerName.id },
            created: { id: credit.createdBy.id },
          },
          createdBy: {
            id: user.id,
            username: user.username,
          },
        });

        // Save the history entry
        await historyCredit.save();
        historyEntries.push(historyCredit);
      }

      // Return the success response with all updated credits and history entries
      return NextResponse.json(
        {
          message: "Credits updated successfully",
          success: true,
          data: updatedCredits,
          CreditHistory: historyEntries,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error updating credits:", error);
    return NextResponse.json(
      { message: "Failed to update credits.", success: false },
      { status: 500 }
    );
  }
}
