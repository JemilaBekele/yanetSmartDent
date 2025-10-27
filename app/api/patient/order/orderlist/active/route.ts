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

  try {
   
            await Patient.aggregate([{ $sample: { size: 1 } }]);
            await Branch.aggregate([{ $sample: { size: 1 } }]);

    // Middleware check for authorization
    const authResponse = await authorizedMiddleware(request);

    if (authResponse instanceof NextResponse) {
      return authResponse;
    }

    const randomPatient = await Patient.aggregate([{ $sample: { size: 1 } }]);

    // Get the authenticated user from the request
    const user = (request as any)?.user;

    if (!user?.id) {
      return NextResponse.json({ error: "User not found or unauthorized" }, { status: 401 });
    }

    // Fetch the authenticated user to get their branch with proper typing
    const authUser = await User.findById(user.id).select('branch').lean() as UserWithBranch;

    if (!authUser) {
      return NextResponse.json({ error: "Authenticated user not found" }, { status: 404 });
    }

    // If user doesn't have a branch, return empty array
    if (!authUser.branch) {
      return NextResponse.json({
        message: "No branch assigned to user",
        success: true,
        orders: [],
      });
    }

    // Fetch active orders that have the same branch as the authenticated user
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

    if (!activeOrders || activeOrders.length === 0) {
      return NextResponse.json({ 
        message: "No active orders found for your branch",
        success: true,
        orders: [] 
      });
    }

    // Prepare the response to include patient details populated within each order
    const ordersWithPatients = activeOrders.map(order => ({
      ...order.toObject(),
      patient: order.patientId.id,
    }));

   

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
