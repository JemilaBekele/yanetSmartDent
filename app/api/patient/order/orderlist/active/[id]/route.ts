import { NextRequest, NextResponse } from 'next/server';
import Order from "@/app/(models)/Order";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import { connect } from "@/app/lib/mongodb";
import Patient from '@/app/(models)/Patient';

connect();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {

    await authorizedMiddleware(request);

  const { id } = params; // Get the order ID from the URL params

  try {
    const order = await Order.findById(id).exec();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Order retrieved successfully",
      success: true,
      order,
    });
  } catch (error) {
    console.error("Error in GET /api/patient/order/orderlist", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  await authorizedMiddleware(request);

  try {
    const reqBody = await request.json();
    const { orderId, status, assignedDoctorTo } = reqBody;

    // Validate input
    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }
    if (!status || !['Active', 'Inactive'].includes(status)) {
      return NextResponse.json({ error: "Valid status is required" }, { status: 400 });
    }
    if (!assignedDoctorTo || !assignedDoctorTo.id) {
      return NextResponse.json({ error: "Valid assigned doctor ID is required" }, { status: 400 });
    }
    if (!assignedDoctorTo.username) {
      return NextResponse.json({ error: "Assigned doctor username is required" }, { status: 400 });
    }

    const existingOrder = await Order.findById(orderId).exec();
    if (!existingOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Update fields
    existingOrder.status = status;
    existingOrder.assignedDoctorTo = { id: assignedDoctorTo.id, username: assignedDoctorTo.username }; // Update the assigned doctor
    existingOrder.updatedAt = new Date();

    if (status === 'Inactive') {
      await Patient.updateOne(
        { _id: existingOrder.patientId.id },
        { $set: { finish: false } }
      );}

      
    if (status === 'Inactive') {
      // Delete the order if the status is updated to 'Inactive'
      await Order.deleteOne({ _id: orderId });
      return NextResponse.json({
        message: "Order was set to inactive and deleted successfully",
        success: true,
      });
    }

    // Save updated order if not deleted
    const updatedOrder = await existingOrder.save();

    return NextResponse.json({
      message: "Order updated successfully",
      success: true,
      updatedOrder,
    });

  } catch (error) {
    console.error("Error in PATCH /api/patient/order", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
