import { connect } from "@/app/lib/mongodb";
import Patient from "@/app/(models)/Patient";
import {NextRequest, NextResponse } from "next/server";
import { authorizedMiddleware } from "@/app/helpers/authentication";


connect();

export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);
  
  try {
    // Get the current date
    const currentDate = new Date();

    // 1. Calculate the start of the current month
    const startOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

    // 2. Calculate the start of the last month (handle month & year transition)
    const startOfLastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);

    // 3. Get the count of patients registered in the last month
    const lastMonthPatients = await Patient.countDocuments({
      createdAt: {
        $gte: startOfLastMonth,    // Patients created from the start of the last month onwards
        $lt: startOfCurrentMonth   // Patients created before the start of the current month
      },
    });

    // 4. Get the count of patients registered in the current month
    const currentMonthPatients = await Patient.countDocuments({
      createdAt: {
        $gte: startOfCurrentMonth, // Patients created from the start of the current month onwards
        $lte: currentDate          // Patients created until the current date/time
      },
    });

    // 5. Return the count of patients registered in the last month and current month
    return NextResponse.json({ lastMonthPatients, currentMonthPatients });
  } catch (error: unknown) {
    console.error("Error in GET /api/patient/monthly-count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
