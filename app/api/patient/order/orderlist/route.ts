import { connect } from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from 'next/server';
import Patient from "@/app/(models)/Patient";
import Order from "@/app/(models)/Order";
import { authorizedMiddleware } from "@/app/helpers/authentication";

connect();

export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);
  try {
    // Check if the user is present in the request
    const user = request['user'];
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await Patient.aggregate([{ $sample: { size: 1 } }]);
    const doctorId = user.id;

    // Fetch active orders for the doctor, sorted by updatedAt in ascending order, with populated patient data
    const activeOrders = await Order.find({
      'assignedDoctorTo.id': doctorId,
      status: 'Active',
    })
      .sort({ updatedAt: 1 }) // First come, first serve based on updatedAt
      .populate({
        path: 'patientId.id', // Path to populate
        model: 'Patient', // Model to populate from
      })
      .exec();
      

    if (!activeOrders || activeOrders.length === 0) {
      return NextResponse.json({ message: "No active orders found" });
    }

    // Prepare the response to include patient details populated within each order
    const ordersWithPatients = activeOrders.map(order => ({
      ...order.toObject(),
      patient: order.patientId.id, // Populated patient data
    }));
    return NextResponse.json({
      message: "Patient profiles retrieved successfully",
      success: true,
      orders: ordersWithPatients,
    });
  } catch (error) {
    console.error("Error in GET /api/patient/order/orderlist", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}