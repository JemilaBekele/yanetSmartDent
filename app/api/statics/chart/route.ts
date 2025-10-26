import { NextRequest, NextResponse } from 'next/server';
import History from '@/app/(models)/history';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import CreditHistory from '@/app/(models)/credithistory';
import Expense from '@/app/(models)/expense';
import Card from '@/app/(models)/card';

// Ensure the database connection is established
connect();

// Utility function to convert the month identifier (YYYY-MM) to the full month name
const getMonthName = (month: string): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December'
  ];
  const monthIndex = parseInt(month.split('-')[1], 10) - 1;
  return monthNames[monthIndex];
}

// Define types for the aggregated data
interface HistoryData {
  _id: string; // The month identifier (YYYY-MM)
  totalAmount: number; // Total amount from the History collection
}

interface CreditHistoryData {
  _id: string; // The month identifier (YYYY-MM)
  totalAmount: number; // Total amount from the CreditHistory collection
}

interface ExpenseData {
  _id: string; // The month identifier (YYYY-MM)
  totalAmount: number; // Total amount from the Expense collection
}

interface CardData {
  _id: string; // The month identifier (YYYY-MM)
  cardprice: number; // Total card price from the Card collection
}
interface MergedData {
  month: string;          // The month name (e.g., 'January', 'February', etc.)
  expenseAmount: number;  // The total amount from the Expense collection
  totalcount: number;     // The total amount after adjustments (History, Credit, Card, Expense)
}

// Utility function to get the date 6 months ago in YYYY-MM format
const getSixMonthsAgo = (): string => {
  const date = new Date();
  date.setMonth(date.getMonth() - 6);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

// Merge function with correct types
async function mergeData(
  historyData: HistoryData[],
  creditHistoryData: CreditHistoryData[],
  expenseData: ExpenseData[],
  cardData: CardData[]
): Promise<MergedData[]> {
  const result: MergedData[] = [];
  const months = new Set([
    ...historyData.map(item => item._id),
    ...creditHistoryData.map(item => item._id),
    ...expenseData.map(item => item._id),
    ...cardData.map(item => item._id),
  ]);

  // Get the date for 6 months ago
  const sixMonthsAgo = getSixMonthsAgo();

  months.forEach(month => {
    if (month < sixMonthsAgo) return;

    const historyItem = historyData.find(item => item._id === month) || { totalAmount: 0 };
    const creditItem = creditHistoryData.find(item => item._id === month) || { totalAmount: 0 };
    const expenseItem = expenseData.find(item => item._id === month) || { totalAmount: 0 };
    const cardItem = cardData.find(item => item._id === month) || { cardprice: 0 };

    const totalcount = historyItem.totalAmount + creditItem.totalAmount + cardItem.cardprice - expenseItem.totalAmount;

    result.push({
      month: month, // Keep YYYY-MM for sorting
      expenseAmount: expenseItem.totalAmount,
      totalcount: totalcount,
    });
  });

  // Sort by date in ascending order (oldest first)
  result.sort((a, b) => a.month.localeCompare(b.month));

  // Convert to full month names after sorting
  return result.map(item => ({
    ...item,
    month: getMonthName(item.month),
  }));
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Perform authorization (if needed)
    await authorizedMiddleware(request);

    // Aggregate data from History collection
    const historyData: HistoryData[] = await History.aggregate([
      {
        $group: {
          _id: { $substr: ["$createdAt", 0, 7] }, // Group by month (YYYY-MM)
          totalAmount: { $sum: "$Invoice.amount" },
        }
      }
    ]);

    // Aggregate data from CreditHistory collection
    const creditHistoryData: CreditHistoryData[] = await CreditHistory.aggregate([
      {
        $group: {
          _id: { $substr: ["$createdAt", 0, 7] }, // Group by month (YYYY-MM)
          totalAmount: { $sum: "$Credit.amount" },
        }
      }
    ]);

    // Aggregate data from Expense collection
    const expenseData: ExpenseData[] = await Expense.aggregate([
      {
        $group: {
          _id: { $substr: ["$createdAt", 0, 7] }, // Group by month (YYYY-MM)
          totalAmount: { $sum: "$amount" },
        }
      }
    ]);

    // Aggregate data from Card collection
    const cardData: CardData[] = await Card.aggregate([
      {
        $group: {
          _id: { $substr: ["$createdAt", 0, 7] }, // Group by month (YYYY-MM)
          cardprice: { $sum: "$cardprice" },
        }
      }
    ]);

    // Merge the data from all sources
    const mergedData = await mergeData(historyData, creditHistoryData, expenseData, cardData);

    // Return the merged data as JSON response
    return NextResponse.json({
      message: 'Data retrieved successfully',
      success: true,
      data: mergedData,
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({
      message: 'Failed to retrieve data',
      success: false
    }, { status: 500 });
  }
}
