import { NextRequest, NextResponse } from 'next/server';
import Invoice from '@/app/(models)/Invoice';
import History from '@/app/(models)/history';
import Card from '@/app/(models)/card';
import Expense from '@/app/(models)/expense';
import Branch from '@/app/(models)/branch';
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
  const { id, startDate, endDate, receipt, branchId } = body; // Changed from 'branch' to 'branchId'



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

   

    // Determine which branch to use for filtering
    let branchFilter: mongoose.Types.ObjectId | string | null = null;
    
    // If branchId is provided in request, use it (with authorization check)
    if (branchId) {
      
      // Optional: Add role-based validation here
      // For example, only allow admins to filter by any branch
      if (fullUser.role === 'admin' || fullUser.role === 'superadmin') {
        branchFilter = new mongoose.Types.ObjectId(branchId);
      } else {
        // Non-admin users can only filter by their own branch
        if (branchId !== fullUser.branch?.toString()) {
          console.log('Non-admin user trying to access different branch - unauthorized');
          return NextResponse.json(
            { message: 'You are not authorized to filter by this branch.', success: false },
            { status: 403 }
          );
        }
        branchFilter = fullUser.branch;
      }
    } else {
      // If no branch provided, use the user's branch (for non-admin users)
      if (fullUser.branch && fullUser.role !== 'admin' && fullUser.role !== 'superadmin') {
        branchFilter = fullUser.branch;
      } else if (fullUser.role === 'admin' || fullUser.role === 'superadmin') {
      }
      // If user is admin/superadmin and no branch specified, don't apply branch filter (show all)
    }

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
      // Ensure branchFilter is properly converted to ObjectId
      if (typeof branchFilter === 'string') {
        query.branch = new mongoose.Types.ObjectId(branchFilter);
      } else {
        query.branch = branchFilter;
      }
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
      // Ensure branchFilter is properly converted to ObjectId for both queries
      if (typeof branchFilter === 'string') {
        baseCardQuery.branch = new mongoose.Types.ObjectId(branchFilter);
        baseExpenseQuery.branch = new mongoose.Types.ObjectId(branchFilter);
      } else {
        baseCardQuery.branch = branchFilter;
        baseExpenseQuery.branch = branchFilter;
      }
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
          appliedFilters: {
            branch: branchFilter?.toString(),
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



export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);

  try {
    const user = request['user'] as { id: string; username: string; role: string };
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
            await Branch.aggregate([{ $sample: { size: 1 } }]);

    // Fetch the complete user with branch information from database
    const fullUser = await User.findById(user.id).select('branch role').exec();
    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Build the query filter
    const filter: any = {
      'currentpayment.confirm': false,
    };

    // Only filter by branch if the user has a branch assigned and is not an admin
    // Admins can see all invoices across branches
    if (fullUser.branch ) {
      filter.branch = fullUser.branch;
    }

    // If you want super admins to see all, but branch admins to see only their branch:
    /*
    if (fullUser.branch && fullUser.role !== 'superadmin') {
      filter.branch = fullUser.branch;
    }
    */

    // Fetch invoices with the filter
    const invoices = await Invoice.find(filter)
      .populate('branch', 'name') // Optionally populate branch details// Populate service details
      .sort({ invoiceDate: -1 }) // Sort by latest first
      .exec();

    // Return the success response with status 200
    return NextResponse.json({
      message: 'Invoices retrieved successfully',
      success: true,
      data: invoices,
    }, { status: 200 });
  } catch (error) {
    // Log and return an error response with status 500
    console.error('Error fetching invoices:', error);
    return NextResponse.json({
      message: 'Failed to retrieve invoices.',
      success: false,
    }, { status: 500 });
  }
}

