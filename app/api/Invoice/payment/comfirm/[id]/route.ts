import { NextRequest, NextResponse } from 'next/server';
import Invoice from '@/app/(models)/Invoice';
import History from '@/app/(models)/history'; // Import the History model
import { authorizedMiddleware } from '@/app/helpers/authentication'; // Adjust the path according to your project structure
import { connect } from '@/app/lib/mongodb';
connect();
export async function PATCH(request: NextRequest) {
  // Use the authorized middleware to check authentication
  await authorizedMiddleware(request);

  try {
    if (typeof request === 'object' && request !== null && 'user' in request) {
      const user = (request as { user: { id: string; username: string } }).user;
      
      // Parse the request body
      const { invoiceId, currentpayment, receiptvalue } = await request.json(); 
      
      // Find the invoice by ID
      const invoice = await Invoice.findById(invoiceId);
      
      if (!invoice) {
        return NextResponse.json({
          message: 'Invoice not found.',
          success: false,
        }, { status: 404 });
      }

      // Update the total paid and balance
      invoice.totalpaid += currentpayment; // Add the current payment amount to totalpaid
      invoice.balance = invoice.totalAmount - invoice.totalpaid; // Update the balance
      invoice.currentpayment.amount = 0; 
      invoice.currentpayment.receipt = true  // Set the current payment amount
      invoice.currentpayment.confirm = true; // Confirm the payment
      invoice.currentpayment.date = new Date(); // Update the date to now

      // Update the status based on totalpaid and totalAmount
      invoice.status = invoice.totalpaid >= invoice.totalAmount ? 'Paid' : 'Pending';

      // Save the updated invoice
      await invoice.save();

      // Create a history record
      const historyEntry = new History({
        Invoice: {
          id: invoice._id,
          amount: currentpayment,
          receipt: true,
          customerName: {
            id: invoice.customerName.id,
            username: invoice.customerName.username,
            cardno: invoice.customerName.cardno,
          },
          created: {  
            id: invoice.createdBy.id,
            username: invoice.createdBy.username,
          },
        },
        createdBy: {
          id: user.id,
          username: user.username,
        }, 
        branch: invoice.branch// Set the user ID from the request
      });

      // Save the history entry
      await historyEntry.save();

      // Return the success response
      return NextResponse.json({
        message: 'Invoice updated successfully',
        success: true,
        data: invoice,
        history: historyEntry, // Optionally return the history entry
      }, { status: 200 });
    }
  } catch (error) {
    // Log and return an error response
    console.error('Error updating invoice:', error);
    return NextResponse.json({
      message: 'Failed to update invoice.',
      success: false,
    }, { status: 500 });
  }
}