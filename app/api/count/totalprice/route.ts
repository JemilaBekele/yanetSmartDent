import { NextRequest, NextResponse } from 'next/server';
import Invoice from '@/app/(models)/Invoice'; // Adjust the path to your Invoice model
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Credit from '@/app/(models)/creadit';
connect();
export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);
  try {
    // Fetch all invoices
    const invoices = await Invoice.find();
    const credit = await Credit.find();

    // Calculate total balance from all invoices
    const totalInvoice = invoices.reduce((total, invoice) => total + invoice.balance, 0);

    const totalCredit = credit.reduce((total, credit) => total + credit.balance, 0);
    
const totalBalance= totalInvoice + totalCredit

    // Return the combined results
    return NextResponse.json({
      message: 'Invoices retrieved successfully',
      success: true,
      data: {
            // Sum of total paid from all invoices
        totalBalance,  // Sum of balances from all invoices
      },
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ message: 'Failed to retrieve invoices.', success: false }, { status: 500 });
  }
}
