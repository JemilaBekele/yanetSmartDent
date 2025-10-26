import { NextRequest, NextResponse } from 'next/server';
// Adjust the path to your Invoice model
import History from '@/app/(models)/history'; 
import Card from '@/app/(models)/card';
import Expense from '@/app/(models)/expense';
import { connect } from "@/app/lib/mongodb"; // Import MongoDB connection helper
import { HistoryItem } from '@/types/history';
import { authorizedMiddleware } from '@/app/helpers/authentication';

connect();

interface Query {
  'Invoice.created.username'?: string;
  'Invoice.receipt'?: boolean;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}

export async function POST(req: NextRequest) {
   await authorizedMiddleware(req);
    const body = await req.json();
    const { username, startDate, endDate, receipt } = body;
  
    // If no date range is provided, default to today
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
    const query: Query = {};
    let startDateObj: Date = startOfDay;
    let endDateObj: Date = endOfDay;
  
    try {
      // Add username filter if provided
      if (username) {
        query['Invoice.created.username'] = username;
      }
  
      // Add date range filter if both startDate and endDate are provided
      if (startDate && endDate) {
        startDateObj = new Date(startDate);
        endDateObj = new Date(endDate);
  
        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
          return NextResponse.json({ message: 'Invalid date format.', success: false }, { status: 400 });
        }
  
        if (endDateObj < startDateObj) {
          return NextResponse.json({ message: 'End date must be greater than or equal to start date.', success: false }, { status: 400 });
        }
  
        // If startDate and endDate are the same, set the time to cover the entire day
        if (startDateObj.getTime() === endDateObj.getTime()) {
          endDateObj.setHours(23, 59, 59, 999);
        } else {
          endDateObj.setHours(23, 59, 59, 999); // Include end of the day for endDate
        }
      }
  
      // Set the default date range to today if not provided
      query.createdAt = { $gte: startDateObj, $lte: endDateObj };
  
      // Add receipt filter if provided
      if (receipt !== undefined) {
        query['Invoice.receipt'] = receipt;
      }
  
      const history: HistoryItem[] = await History.find(query);
  
      let cards = [];
      let Expenses = [];
      if (!username) {
        cards = await Card.find({
          createdAt: { $gte: startDateObj, $lte: endDateObj },
        });
        Expenses = await Expense.find({
          createdAt: { $gte: startDateObj, $lte: endDateObj },
        });
      }
  
      return NextResponse.json(
        {
          message: 'Invoices and cards retrieved successfully',
          success: true,
          data: {
            history,
            cards,
            Expenses,
          },
        },
        { status: 200 }
      );
    } catch (error) {
      console.error('Error fetching invoices and cards:', error);
      return NextResponse.json(
        { message: 'Failed to retrieve invoices and cards.', success: false },
        { status: 500 }
      );
    }
  }
