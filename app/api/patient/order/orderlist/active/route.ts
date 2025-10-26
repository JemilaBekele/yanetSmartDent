import { connect } from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from 'next/server';
import Patient from "@/app/(models)/Patient";
import Order from "@/app/(models)/Order";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import User from "@/app/(models)/User";
import Branch from "@/app/(models)/branch";

connect();

// Define interface for user with branch
interface UserWithBranch {
  _id: unknown;
  branch?: string | null;
  __v?: number;
}

export async function GET(request: NextRequest) {
  console.log("=== [GET /api/patient/order/orderlist] START ===");

  try {
    console.log("Incoming Request:", {
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers),
    });
            await Patient.aggregate([{ $sample: { size: 1 } }]);
            await Branch.aggregate([{ $sample: { size: 1 } }]);

    // Middleware check for authorization
    console.log("Running authorizedMiddleware...");
    const authResponse = await authorizedMiddleware(request);
    console.log("authorizedMiddleware response:", authResponse);

    if (authResponse instanceof NextResponse) {
      console.log("Middleware returned NextResponse → Unauthorized or error response");
      return authResponse;
    }

    console.log("Running random patient aggregation test...");
    const randomPatient = await Patient.aggregate([{ $sample: { size: 1 } }]);
    console.log("Random patient aggregation result:", randomPatient);

    // Get the authenticated user from the request
    const user = (request as any)?.user;
    console.log("User object from request:", user);

    if (!user?.id) {
      console.log("User not found or unauthorized");
      return NextResponse.json({ error: "User not found or unauthorized" }, { status: 401 });
    }

    // Fetch the authenticated user to get their branch with proper typing
    console.log("Fetching authenticated user details...");
    const authUser = await User.findById(user.id).select('branch').lean() as UserWithBranch;
    console.log("Authenticated user found:", authUser);

    if (!authUser) {
      console.log("Authenticated user not found in DB");
      return NextResponse.json({ error: "Authenticated user not found" }, { status: 404 });
    }

    // If user doesn't have a branch, return empty array
    if (!authUser.branch) {
      console.log("User has no branch assigned");
      return NextResponse.json({
        message: "No branch assigned to user",
        success: true,
        orders: [],
      });
    }

    // Fetch active orders that have the same branch as the authenticated user
    console.log("Fetching active orders for branch:", authUser.branch);
    const activeOrders = await Order.find({
      status: 'Active',
      branch: authUser.branch,
    })
      .sort({ updatedAt: 1 })
      .populate({
        path: 'patientId.id',
        model: 'Patient',
      })
      .populate({
        path: 'branch',
        model: 'Branch',
      })
      .exec();

    console.log(`Active orders found: ${activeOrders?.length || 0}`);
    console.log("Active orders raw data:", activeOrders);

    if (!activeOrders || activeOrders.length === 0) {
      console.log("No active orders found for branch");
      return NextResponse.json({ 
        message: "No active orders found for your branch",
        success: true,
        orders: [] 
      });
    }

    // Prepare the response to include patient details populated within each order
    console.log("Mapping orders with populated patient data...");
    const ordersWithPatients = activeOrders.map(order => ({
      ...order.toObject(),
      patient: order.patientId.id,
    }));

    console.log("Final response data:", {
      message: "Patient profiles retrieved successfully",
      success: true,
      ordersCount: ordersWithPatients.length,
      sampleOrder: ordersWithPatients[0] || null,
    });

    console.log("=== [GET /api/patient/order/orderlist] END ===");
    return NextResponse.json({
      message: "Patient profiles retrieved successfully",
      success: true,
      orders: ordersWithPatients,
    });

  } catch (error) {
    console.error("❌ Error in GET /api/patient/order/orderlist:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
