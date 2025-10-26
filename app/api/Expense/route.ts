
import { NextResponse, NextRequest } from "next/server";
import Expense from "@/app/(models)/expense";
import User from "@/app/(models)/User"; // Import User model to get branch
import { authorizedMiddleware } from '@/app/helpers/authentication';

// POST method to create a new expense
export async function POST(request: NextRequest) {
  await authorizedMiddleware(request);
  try {
    if (typeof request === 'object' && request !== null && 'user' in request) {
      const user = (request as { user: { id: string; username: string } }).user; 

      const reqBody = await request.json();
      const { discription, amount } = reqBody;

      // Validate required fields
      if (!discription || !amount) {
        return NextResponse.json(
          { message: "Please provide all required fields: discription and amount" },
          { status: 400 }
        );
      }

      // Fetch the user to get their branch
      const creatorUser = await User.findById(user.id).select('branch').exec();
      if (!creatorUser) {
        console.error(`Creator user not found: ${user.id}`);
        return NextResponse.json({ error: "Creator user not found" }, { status: 404 });
      }

      // Create a new Expense entry with branch
      const newExpense = new Expense({
        discription,
        amount,
        createdBy: {
          id: user.id,
          username: user.username,
        },
        branch: creatorUser.branch, // Add branch from the logged-in user
      });

      // Save the expense to the database
      await newExpense.save();

      // Return the saved expense data
      return NextResponse.json(newExpense, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}


export async function GET(request: NextRequest) {
  try {
    await authorizedMiddleware(request);

    if (typeof request === 'object' && request !== null && 'user' in request) {
      const user = (request as { user: { id: string; username: string } }).user;

      // Fetch the user to get their branch
      const currentUser = await User.findById(user.id).select('branch').exec();
      if (!currentUser) {
        console.error(`User not found: ${user.id}`);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // Fetch only expenses from the same branch as the logged-in user
      const expenses = await Expense.find({ 
        branch: currentUser.branch 
      }).populate({
        path: "branch"
      }).sort({ createdAt: -1 }); // Sort by createdAt (most recent first)

      // Return the expenses in JSON format
      return NextResponse.json(expenses, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}