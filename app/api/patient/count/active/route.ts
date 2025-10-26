import { connect } from "@/app/lib/mongodb";
import Order from "@/app/(models)/Order"; // Assuming the path to the Order model is correct
import { NextRequest, NextResponse } from "next/server";
import { authorizedMiddleware } from "@/app/helpers/authentication";


connect();

export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);
  
  try {
    // Count only active patients by querying the 'Order' collection with status 'Active'
    const activePatientsCount = await Order.countDocuments({ status: 'Active' });

    // Return the count of active patients
    return NextResponse.json({ activePatientsCount });
  } catch (error) {
    console.error("Error in GET /api/order/active-patients-count:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
