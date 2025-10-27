
import { NextRequest, NextResponse } from 'next/server';
import Expense from '@/app/(models)/expense';
import User from '@/app/(models)/User';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import mongoose from 'mongoose';
import Branch from '@/app/(models)/branch';

connect();

interface Query {
  branch?: mongoose.Types.ObjectId | null;
  createdAt?: {
    $gte?: Date;
    $lte?: Date;
  };
}

export async function POST(req: NextRequest) {
  try {
    await authorizedMiddleware(req);

    const body = await req.json();
    const { startDate, endDate, branchId } = body;


    if (!startDate || !endDate) {
      return NextResponse.json({ 
        message: 'Both start and end dates are required.', 
        success: false 
      }, { status: 400 });
    }

    const query: Query = {};

    // Determine which branch to query
    let targetBranchId;
    
    
    if (branchId) {
      targetBranchId = branchId;
      
      // Convert string to ObjectId if it's a string
      if (typeof targetBranchId === 'string') {
        try {
          query.branch = new mongoose.Types.ObjectId(targetBranchId);
        } catch (error) {
          return NextResponse.json({ 
            message: 'Invalid branch ID format.', 
            success: false 
          }, { status: 400 });
        }
      } else {
        query.branch = targetBranchId;
      }
    } else {
      console.log('No branch filter applied - will return expenses from all branches');
      // Don't add branch to query when no branchId is provided
    }

    // Date validation and filtering
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

 

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      return NextResponse.json({ 
        message: 'Invalid date format.', 
        success: false 
      }, { status: 400 });
    }

    if (endDateObj < startDateObj) {
      return NextResponse.json({ 
        message: 'End date must be greater than or equal to start date.', 
        success: false 
      }, { status: 400 });
    }

    endDateObj.setHours(23, 59, 59, 999);
    query.createdAt = { $gte: startDateObj, $lte: endDateObj };


    // Fetch expenses
    
    const expenses = await Expense.find(query)
      .populate({
        path: "branch",
      })
      .sort({ createdAt: -1 })
      .exec();


    return NextResponse.json({
      message: 'Expenses retrieved successfully',
      success: true,
      data: {
        expenses,
        filters: {
          branch: targetBranchId,
          startDate: startDateObj.toISOString(),
          endDate: endDateObj.toISOString()
        }
      },
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ 
      message: 'Failed to retrieve expenses.', 
      success: false 
    }, { status: 500 });
  }
}