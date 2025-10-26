import { NextRequest, NextResponse } from 'next/server';
import History from '@/app/(models)/history';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import CreditHistory from '@/app/(models)/credithistory';
import Expense from '@/app/(models)/expense';
import Card from '@/app/(models)/card';
import Branch from '@/app/(models)/branch';
import mongoose from 'mongoose';

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
  _id: {
    month: string;
    branch: any; // Use any to handle ObjectId
  };
  totalAmount: number;
}

interface CreditHistoryData {
  _id: {
    month: string;
    branch: any;
  };
  totalAmount: number;
}

interface ExpenseData {
  _id: {
    month: string;
    branch: any;
  };
  totalAmount: number;
}

interface CardData {
  _id: {
    month: string;
    branch: any;
  };
  cardprice: number;
}

interface BranchData {
  _id: string;
  name: string;
}

interface MonthlyData {
  month: string;
  monthId: string;
  revenue: number;
  expenses: number;
  cards: number;
  netProfit: number;
  historyRevenue: number;
  creditRevenue: number;
}

interface BranchReport {
  branchId: string;
  branchName: string;
  monthlyData: MonthlyData[];
  performanceMetrics: {
    bestMonth: MonthlyData | null;
    worstMonth: MonthlyData | null;
    averageMonthlyRevenue: number;
    averageMonthlyExpenses: number;
    averageMonthlyProfit: number;
    growthRate: number;
  };
}

// Generate complete monthly data for a branch
async function generateBranchMonthlyData(
  historyData: HistoryData[],
  creditHistoryData: CreditHistoryData[],
  expenseData: ExpenseData[],
  cardData: CardData[],
  branchId: string,
  branchName: string
): Promise<BranchReport> {
  const monthlyData: MonthlyData[] = [];
  
  console.log(`Processing branch: ${branchName} (${branchId})`);
  
  // Filter data for this specific branch - compare ObjectIds properly
  const branchHistory = historyData.filter(item => {
    const itemBranchId = item._id.branch?.toString ? item._id.branch.toString() : String(item._id.branch);
    return itemBranchId === branchId;
  });
  
  const branchCreditHistory = creditHistoryData.filter(item => {
    const itemBranchId = item._id.branch?.toString ? item._id.branch.toString() : String(item._id.branch);
    return itemBranchId === branchId;
  });
  
  const branchExpense = expenseData.filter(item => {
    const itemBranchId = item._id.branch?.toString ? item._id.branch.toString() : String(item._id.branch);
    return itemBranchId === branchId;
  });
  
  const branchCard = cardData.filter(item => {
    const itemBranchId = item._id.branch?.toString ? item._id.branch.toString() : String(item._id.branch);
    return itemBranchId === branchId;
  });

  console.log(`Found data for ${branchName}:`, {
    history: branchHistory.length,
    credit: branchCreditHistory.length,
    expense: branchExpense.length,
    card: branchCard.length
  });

  // Get all unique months from all data sources for this branch
  const allMonths = [
    ...branchHistory.map(item => item._id.month),
    ...branchCreditHistory.map(item => item._id.month),
    ...branchExpense.map(item => item._id.month),
    ...branchCard.map(item => item._id.month),
  ];

  const months = Array.from(new Set(allMonths));

  console.log(`Months for ${branchName}:`, months);

  // Process each month
  months.forEach(month => {
    const historyItem = branchHistory.find(item => item._id.month === month) || { totalAmount: 0 };
    const creditItem = branchCreditHistory.find(item => item._id.month === month) || { totalAmount: 0 };
    const expenseItem = branchExpense.find(item => item._id.month === month) || { totalAmount: 0 };
    const cardItem = branchCard.find(item => item._id.month === month) || { cardprice: 0 };

    const revenue = historyItem.totalAmount + creditItem.totalAmount;
    const netProfit = revenue + cardItem.cardprice - expenseItem.totalAmount;

    monthlyData.push({
      month: getMonthName(month),
      monthId: month,
      revenue: revenue,
      expenses: expenseItem.totalAmount,
      cards: cardItem.cardprice,
      netProfit: netProfit,
      historyRevenue: historyItem.totalAmount,
      creditRevenue: creditItem.totalAmount
    });
  });

  // Sort by date in ascending order
  monthlyData.sort((a, b) => a.monthId.localeCompare(b.monthId));

  // Calculate performance metrics
  const performanceMetrics = calculatePerformanceMetrics(monthlyData);

  console.log(`Generated ${monthlyData.length} months of data for ${branchName}`);

  return {
    branchId,
    branchName,
    monthlyData,
    performanceMetrics
  };
}

// Calculate performance metrics from monthly data
function calculatePerformanceMetrics(monthlyData: MonthlyData[]) {
  if (monthlyData.length === 0) {
    return {
      bestMonth: null,
      worstMonth: null,
      averageMonthlyRevenue: 0,
      averageMonthlyExpenses: 0,
      averageMonthlyProfit: 0,
      growthRate: 0
    };
  }

  const bestMonth = monthlyData.reduce((prev, current) => 
    (prev.netProfit > current.netProfit) ? prev : current
  );
  
  const worstMonth = monthlyData.reduce((prev, current) => 
    (prev.netProfit < current.netProfit) ? prev : current
  );

  const totalRevenue = monthlyData.reduce((sum, month) => sum + month.revenue, 0);
  const totalExpenses = monthlyData.reduce((sum, month) => sum + month.expenses, 0);
  const totalProfit = monthlyData.reduce((sum, month) => sum + month.netProfit, 0);

  const firstMonthProfit = monthlyData[0].netProfit;
  const lastMonthProfit = monthlyData[monthlyData.length - 1].netProfit;
  const growthRate = firstMonthProfit !== 0 ? 
    ((lastMonthProfit - firstMonthProfit) / firstMonthProfit) * 100 : 0;

  return {
    bestMonth,
    worstMonth,
    averageMonthlyRevenue: totalRevenue / monthlyData.length,
    averageMonthlyExpenses: totalExpenses / monthlyData.length,
    averageMonthlyProfit: totalProfit / monthlyData.length,
    growthRate: parseFloat(growthRate.toFixed(2))
  };
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Perform authorization
    await authorizedMiddleware(request);

    // Get query parameters for branch filtering
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    // Fetch all branches
    const allBranches: BranchData[] = await Branch.find({}).select('_id name');
    const branchMap = new Map();
    allBranches.forEach(branch => {
      branchMap.set(branch._id.toString(), branch.name);
    });

    console.log('Available branches:', Object.fromEntries(branchMap));

    // Aggregate data from History collection with branch grouping
    const historyData: HistoryData[] = await History.aggregate([
      {
        $match: {
          branch: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            month: { $substr: ["$createdAt", 0, 7] },
            branch: "$branch"
          },
          totalAmount: { $sum: "$Invoice.amount" },
        }
      }
    ]);

    // Aggregate data from CreditHistory collection with branch grouping
    const creditHistoryData: CreditHistoryData[] = await CreditHistory.aggregate([
      {
        $match: {
          branch: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            month: { $substr: ["$createdAt", 0, 7] },
            branch: "$branch"
          },
          totalAmount: { $sum: "$Credit.amount" },
        }
      }
    ]);

    // Aggregate data from Expense collection with branch grouping
    const expenseData: ExpenseData[] = await Expense.aggregate([
      {
        $match: {
          branch: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            month: { $substr: ["$createdAt", 0, 7] },
            branch: "$branch"
          },
          totalAmount: { $sum: "$amount" },
        }
      }
    ]);

    // Aggregate data from Card collection with branch grouping
    const cardData: CardData[] = await Card.aggregate([
      {
        $match: {
          branch: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: {
            month: { $substr: ["$createdAt", 0, 7] },
            branch: "$branch"
          },
          cardprice: { $sum: "$cardprice" },
        }
      }
    ]);

    // Convert all branch IDs to strings for consistent comparison
    const stringifiedHistoryData = historyData.map(item => ({
      ...item,
      _id: {
        month: item._id.month,
        branch: item._id.branch?.toString ? item._id.branch.toString() : String(item._id.branch)
      }
    }));

    const stringifiedCreditHistoryData = creditHistoryData.map(item => ({
      ...item,
      _id: {
        month: item._id.month,
        branch: item._id.branch?.toString ? item._id.branch.toString() : String(item._id.branch)
      }
    }));

    const stringifiedExpenseData = expenseData.map(item => ({
      ...item,
      _id: {
        month: item._id.month,
        branch: item._id.branch?.toString ? item._id.branch.toString() : String(item._id.branch)
      }
    }));

    const stringifiedCardData = cardData.map(item => ({
      ...item,
      _id: {
        month: item._id.month,
        branch: item._id.branch?.toString ? item._id.branch.toString() : String(item._id.branch)
      }
    }));

    console.log('Stringified History data:', stringifiedHistoryData);
    console.log('Stringified Credit history data:', stringifiedCreditHistoryData);
    console.log('Stringified Expense data:', stringifiedExpenseData);
    console.log('Stringified Card data:', stringifiedCardData);

    // Handle single branch request
    if (branchId) {
      const branchName = branchMap.get(branchId) || `Branch ${branchId}`;
      const branchReport = await generateBranchMonthlyData(
        stringifiedHistoryData, 
        stringifiedCreditHistoryData, 
        stringifiedExpenseData, 
        stringifiedCardData, 
        branchId, 
        branchName
      );

      return NextResponse.json({
        message: 'Branch monthly data retrieved successfully',
        success: true,
        data: {
          analysisType: 'single-branch-monthly',
          branchReport,
          filters: {
            branchId,
            branchName
          }
        },
      }, { status: 200 });
    }

    // Handle all branches - generate separate monthly reports for each branch
    const branchReports: BranchReport[] = [];

    // Convert Map to Array first to avoid iteration issues
    const branchArray = Array.from(branchMap.entries());

    console.log('Processing all branches:', branchArray);

    for (const [branchId, branchName] of branchArray) {
      try {
        const branchReport = await generateBranchMonthlyData(
          stringifiedHistoryData, 
          stringifiedCreditHistoryData, 
          stringifiedExpenseData, 
          stringifiedCardData, 
          branchId, 
          branchName
        );
        
        // Include branch even if no monthly data, but with empty array
        branchReports.push(branchReport);
        console.log(`Processed branch ${branchName}: ${branchReport.monthlyData.length} months of data`);
      } catch (error) {
        console.error(`Error processing branch ${branchName}:`, error);
      }
    }

    console.log('Final branch reports count:', branchReports.length);

    // Calculate cross-branch comparison metrics
    const branchComparison = branchReports
      .filter(branch => branch.monthlyData.length > 0)
      .map(branch => ({
        branchId: branch.branchId,
        branchName: branch.branchName,
        performance: branch.performanceMetrics,
        recentMonth: branch.monthlyData.length > 0 ? branch.monthlyData[branch.monthlyData.length - 1] : null
      }))
      .sort((a, b) => (b.performance.averageMonthlyProfit || 0) - (a.performance.averageMonthlyProfit || 0));

    return NextResponse.json({
      message: 'All branches monthly data retrieved successfully',
      success: true,
      data: {
        analysisType: 'multi-branch-monthly',
        branchReports: branchReports.filter(branch => branch.monthlyData.length > 0),
        branchComparison,
        timeframe: {
          months: branchReports.length > 0 && branchReports[0].monthlyData.length > 0 
            ? branchReports[0].monthlyData.map(m => m.month) 
            : [],
          period: 'all-available-months'
        },
        filters: {
          branchId: null,
          analysisType: 'all-branches-monthly-comparison'
        }
      },
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json({
      message: 'Failed to retrieve data',
      success: false
    }, { status: 500 });
  }
}