// File: src/app/api/employee-count/route.ts

import User from "@/app/(models)/User";
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/app/lib/mongodb";
import { authorizedMiddleware } from "@/app/helpers/authentication";

// Add this line to force dynamic rendering
export const dynamic = 'force-dynamic';

connect();

export async function GET(request: NextRequest) {
  try {
    // Run authentication/authorization middleware
    await authorizedMiddleware(request);

    // Count all employees
    const totalEmployees = await User.countDocuments();

    return NextResponse.json(
      { totalEmployees },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error in GET /api/employee-count:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}