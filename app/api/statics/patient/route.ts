import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/app/lib/mongodb";
import Patient from "@/app/(models)/Patient";
import { authorizedMiddleware } from "@/app/helpers/authentication";

connect();

export async function GET(req: NextRequest) {
  await authorizedMiddleware(req);
  
  try {
    const tenMonthsAgo = new Date();
    tenMonthsAgo.setMonth(tenMonthsAgo.getMonth() - 9);
    tenMonthsAgo.setDate(1); // Start from the first day of the month

    // Aggregation pipeline to group patients by month
    const patientTrends = await Patient.aggregate([
      {
        $match: {
          createdAt: { $gte: tenMonthsAgo }, // Filter last 10 months
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" }, // Group by month
          count: { $sum: 1 }, // Count number of patients per month
        },
      },
      {
        $sort: { _id: 1 }, // Sort by month
      },
    ]);

    // Define the type explicitly
    const trendData: { month: string; patients: number }[] = [];

    // Generate a full 10-month dataset with missing months set to zero
    const currentMonth = new Date().getMonth() + 1;
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    
    for (let i = 9; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12; // Handle year wrap-around
      const monthName = months[monthIndex];
      const patientCount = patientTrends.find((p) => p._id === monthIndex + 1)?.count || 0;
      
      trendData.push({ month: monthName, patients: patientCount });
    }

    return NextResponse.json({ success: true, data: trendData }, { status: 200 });

  } catch (error) {
    console.error("Error fetching patient registration trends:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}