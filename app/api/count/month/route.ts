import { NextRequest, NextResponse } from 'next/server';
import History from '@/app/(models)/history';
import Card from '@/app/(models)/card';
import Expense from '@/app/(models)/expense';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';

connect();

export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);

  try {
    const currentDate = new Date();

    // Calculate the start of the current week (assuming Monday as the start)
    const currentDayOfWeek = currentDate.getDay(); // 0 (Sunday) - 6 (Saturday)
    const startOfCurrentWeek = new Date(currentDate);
    startOfCurrentWeek.setDate(currentDate.getDate() - currentDayOfWeek + 1); // Adjusting to Monday

    // Calculate the start and end of last week
    const startOfLastWeek = new Date(startOfCurrentWeek);
    startOfLastWeek.setDate(startOfCurrentWeek.getDate() - 7); // Move to the previous week

    const endOfLastWeek = new Date(startOfCurrentWeek); // End of last week is the start of this week

    // Make sure the times are at 00:00:00 for comparisons
    startOfLastWeek.setHours(0, 0, 0, 0);
    endOfLastWeek.setHours(0, 0, 0, 0);

    // Calculate the start of the current month
    const startOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    startOfCurrentMonth.setHours(0, 0, 0, 0); // Ensure the time is set to the start of the day

    // 1. Fetch and calculate total history amount for last week
    const lastWeekHistory = await History.find({
      createdAt: {
        $gte: startOfLastWeek,
        $lt: endOfLastWeek
      }
    });

    const totalHistoryAmountLastWeek = lastWeekHistory.reduce(
      (total, item) => total + item.Invoice.amount, 0
    );

    // 2. Fetch and calculate total history amount for the current month
    const currentMonthHistory = await History.find({
      createdAt: {
        $gte: startOfCurrentMonth,
        $lte: currentDate
      }
    });

    const totalHistoryAmountCurrentMonth = currentMonthHistory.reduce(
      (total, item) => total + item.Invoice.amount, 0
    );

    // 3. Fetch and calculate total card price for last week
    const lastWeekCards = await Card.find({
      createdAt: {
        $gte: startOfLastWeek,
        $lt: endOfLastWeek
      }
    });

    const totalCardPriceLastWeek = lastWeekCards.reduce(
      (total, card) => total + card.cardprice, 0
    );

    // 4. Fetch and calculate total card price for the current month
    const currentMonthCards = await Card.find({
      createdAt: {
        $gte: startOfCurrentMonth,
        $lte: currentDate
      }
    });

    const totalCardPriceCurrentMonth = currentMonthCards.reduce(
      (total, card) => total + card.cardprice, 0
    );

    // 5. Fetch and calculate total expense for last week
    const lastWeekExpense = await Expense.find({
      createdAt: {
        $gte: startOfLastWeek,
        $lt: endOfLastWeek
      }
    });

    const totalExpenseAmountLastWeek = lastWeekExpense.reduce(
      (total, expense) => total + expense.amount, 0
    );

    // 6. Fetch and calculate total expense for the current month
    const currentMonthExpense = await Expense.find({
      createdAt: {
        $gte: startOfCurrentMonth,
        $lte: currentDate
      }
    });

    const totalExpenseCurrentMonth = currentMonthExpense.reduce(
      (total, expense) => total + expense.amount, 0
    );

    // 7. Calculate grand totals
    const grandTotalLastWeek = totalHistoryAmountLastWeek + totalCardPriceLastWeek - totalExpenseAmountLastWeek;
    const grandTotalCurrentMonth = totalHistoryAmountCurrentMonth + totalCardPriceCurrentMonth - totalExpenseCurrentMonth;

    // 8. Return the results
    return NextResponse.json({
      message: 'History, cards, and expenses retrieved successfully',
      success: true,
      data: {
        totalHistoryAmountLastWeek,
        totalCardPriceLastWeek,
        totalExpenseAmountLastWeek,
        grandTotalLastWeek,
        totalHistoryAmountCurrentMonth,
        totalCardPriceCurrentMonth,
        totalExpenseCurrentMonth,
        grandTotalCurrentMonth
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({ message: 'Failed to retrieve data.', success: false }, { status: 500 });
  }
}
