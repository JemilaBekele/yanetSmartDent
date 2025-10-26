import { NextRequest, NextResponse } from 'next/server';
import Expense from '@/app/(models)/expense';
import User from '@/app/(models)/User';
import { Item } from '@/types/expens';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import mongoose from 'mongoose';
import Branch from '@/app/(models)/branch';

connect();

interface Query {
  branch?: mongoose.Types.ObjectId;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}

export async function POST(req: NextRequest) {
  try {
    await authorizedMiddleware(req);

    if (typeof req === 'object' && req !== null && 'user' in req) {
      const user = (req as { user: { id: string; username: string } }).user;

      // Fetch the user to get their branch
      const currentUser = await User.findById(user.id).select('branch').exec();
      if (!currentUser) {
        console.error(`User not found: ${user.id}`);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const body = await req.json();
      const { startDate, endDate } = body;

      // Check if at least one of the required parameters is provided
      if (!startDate || !endDate) {
        return NextResponse.json({ message: 'Both start and end dates are required.', success: false }, { status: 400 });
      }

      const query: Query = {
        branch: currentUser.branch // Only query expenses from the same branch
      };

      // Add date range filter if both startDate and endDate are provided
      if (startDate && endDate) {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);

        if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
          return NextResponse.json({ message: 'Invalid date format.', success: false }, { status: 400 });
        }

        if (endDateObj < startDateObj) {
          return NextResponse.json({ message: 'End date must be greater than or equal to start date.', success: false }, { status: 200 });
        }

        if (startDateObj.getTime() === endDateObj.getTime()) {
          endDateObj.setHours(23, 59, 59, 999);
        } else {
          endDateObj.setHours(23, 59, 59, 999);
        }

        // Add date filter to query
        query.createdAt = { $gte: startDateObj, $lte: endDateObj };
      }
                      await Branch.aggregate([{ $sample: { size: 1 } }]);
      

      // Fetch expenses based on the query (only from same branch)
      const expense: Item[] = await Expense.find(query).populate({
        path: "branch"
      }).sort({ createdAt: -1 });

      // Return the results
      return NextResponse.json({
        message: 'Expenses retrieved successfully',
        success: true,
        data: {
          expense,
        },
      }, { status: 200 });
    }
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ message: 'Failed to retrieve expenses.', success: false }, { status: 500 });
  }
}