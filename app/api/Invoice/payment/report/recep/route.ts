import { NextRequest, NextResponse } from 'next/server';
import History from '@/app/(models)/history';
import Card from '@/app/(models)/card';
import Expense from '@/app/(models)/expense';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Patient from '@/app/(models)/Patient';
import User from '@/app/(models)/User';
import mongoose from 'mongoose';

connect();

interface Query {
  'Invoice.created.id'?: string;
  'Invoice.receipt'?: boolean;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
  branch?: mongoose.Types.ObjectId | string;
}

export async function POST(req: NextRequest) {
  await authorizedMiddleware(req);
  const body = await req.json();
  const { id, startDate, endDate, receipt } = body; // Removed branch from destructuring

  if (!id && (!startDate || !endDate)) {
    return NextResponse.json(
      { message: 'Either username or both start and end dates are required.', success: false },
      { status: 400 }
    );
  }

  try {
    // Get the authenticated user
    const user = req['user'] as { id: string; username: string; role: string };
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await Patient.aggregate([{ $sample: { size: 1 } }]);
    
    // Fetch the complete user with branch information from database
    const fullUser = await User.findById(user.id).select('branch role').exec();
    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Always use the logged-in user's branch for filtering
    // Only apply branch filter if user has a branch assigned and is not admin/superadmin
    let branchFilter: mongoose.Types.ObjectId | string | null = null;
    
    if (fullUser.branch && fullUser.role !== 'admin' && fullUser.role !== 'superadmin') {
      branchFilter = fullUser.branch;
    }
    // If user is admin/superadmin or doesn't have a branch, don't apply branch filter (show all)

    const query: Query = {};
    let startDateObj: Date | null = null;
    let endDateObj: Date | null = null;

    if (id) {
      query['Invoice.created.id'] = id;
    }

    if (startDate && endDate) {
      startDateObj = new Date(startDate);
      endDateObj = new Date(endDate);

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return NextResponse.json({ message: 'Invalid date format.', success: false }, { status: 400 });
      }

      if (endDateObj < startDateObj) {
        return NextResponse.json({ message: 'End date must be greater than or equal to start date.', success: false }, { status: 400 });
      }

      endDateObj.setHours(23, 59, 59, 999);
      query.createdAt = { $gte: startDateObj, $lte: endDateObj };
    }

    if (receipt !== undefined) {
      query['Invoice.receipt'] = receipt;
    }

    // Add branch filter to the main query if applicable
    if (branchFilter) {
      query.branch = branchFilter;
    }

    // Build base queries for cards and expenses
    const baseCardQuery: any = {};
    const baseExpenseQuery: any = {};
    
    if (startDateObj && endDateObj) {
      baseCardQuery.createdAt = { $gte: startDateObj, $lte: endDateObj };
      baseExpenseQuery.createdAt = { $gte: startDateObj, $lte: endDateObj };
    }
    
    // Add branch filter to card and expense queries if applicable
    if (branchFilter) {
      baseCardQuery.branch = branchFilter;
      baseExpenseQuery.branch = branchFilter;
    }

    // Fetch history and populate patient name
    const history = await History.find(query)
      .populate({
        path: 'Invoice.customerName.id',
        model: 'Patient',
        select: 'firstname',
      })
      .populate('branch', 'name') // Populate branch details
      .exec();

    let cards: Array<any> = [];
    let Expenses: Array<any> = [];

    if (!id) {
      cards = await Card.find(baseCardQuery)
        .populate({
          path: 'patient.id',
          select: 'firstname',
        })
        .populate('branch', 'name') // Populate branch details
        .exec();

      Expenses = await Expense.find(baseExpenseQuery)
        .populate('branch', 'name') // Populate branch details
        .exec();
    }

    return NextResponse.json(
      {
        message: 'Invoices, cards, and expenses retrieved successfully',
        success: true,
        data: {
          history,
          cards,
          Expenses,
          // Optional: Include the applied branch filter in response
          appliedFilters: {
            branch: branchFilter,
            dateRange: startDateObj && endDateObj ? { start: startDateObj, end: endDateObj } : null,
            user: id || null
          }
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching invoices and history:', error);
    return NextResponse.json(
      { message: 'Failed to retrieve invoices and history.', success: false },
      { status: 500 }
    );
  }
}