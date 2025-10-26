import { connect } from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import Creadit from '@/app/(models)/creadit';
import CreditHistory from "@/app/(models)/credithistory";

connect();

export async function PATCH(request: NextRequest) {
  // Use the authorized middleware to check authentication
  await authorizedMiddleware(request);

  try {
    if (typeof request === "object" && request !== null && "user" in request) {
      const user = (request as { user: { id: string; username: string } }).user;
      console.log("User Data:", user);

      const body = await request.json(); // Parse the request body
      const { creditIds, status, currentPayment } = body; // Extract credit IDs, status, and currentPayment

      // Check if credit IDs are provided
      if (!creditIds || !Array.isArray(creditIds) || creditIds.length === 0) {
        return NextResponse.json({ error: "credit IDs are required" }, { status: 400 });
      }

      // Fetch all the credits by their IDs before update
      const credits = await Creadit.find({ _id: { $in: creditIds } });

      // If no credits found
      if (credits.length === 0) {
        return NextResponse.json({ error: "No credits found for the provided IDs" }, { status: 404 });
      }

      // Track updated credits and history entries
      const updatedCredits: Creadit[] = []; // Declare the type for updatedCredits
      const historyEntries: typeof CreditHistory[] = [];

      // Update each credit
      for (const credit of credits) {
        const paymentAmount = credit.currentPayment.amount; // Fetch the payment amount before update

        // Prepare the updated data
        const updatedCreditData = {
          status: status || 'Paid', // Default to 'Paid' if no status is provided
          'currentPayment.confirm': currentPayment?.confirm ?? true,
          'currentPayment.date': new Date(),
        };

        // Update the credit document
        const updatedCredit = await Creadit.findByIdAndUpdate(credit._id, updatedCreditData, { new: true });

        if (updatedCredit) {
          updatedCredits.push(updatedCredit);

          // Create a history entry for this credit update
          const historyCredit = new CreditHistory({
            Credit: {
              id: updatedCredit._id,
              amount: paymentAmount, // The payment amount from the currentPayment
              customerName: {
                id: updatedCredit.customerName.id
              },
              created: { id: updatedCredit.createdBy.id, username: updatedCredit.createdBy.username },
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
      }

      // Return success response with updated credits and history
      return NextResponse.json({
        message: "Credits and history updated successfully",
        success: true,
        modifiedCount: updatedCredits.length,
        updatedCredits,
        CreditHistory: historyEntries,
      });
    }
  } catch (error) {
    console.error("Error updating credits and creating history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

