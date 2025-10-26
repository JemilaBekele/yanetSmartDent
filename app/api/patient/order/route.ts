import { NextRequest, NextResponse } from 'next/server';
import Patient from "@/app/(models)/Patient";
import User from "@/app/(models)/User";
import Order from "@/app/(models)/Order";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import { connect } from '@/app/lib/mongodb';
import Age from '@/app/(models)/age';

connect();

export async function POST(request: NextRequest) {
  // Middleware check for authorization
  await authorizedMiddleware(request);

  try {
    if (typeof request === 'object' && request !== null && 'user' in request) {
      const user = (request as { user: { id: string; username: string } }).user;
      console.log("User Data:", user);

      const reqBody = await request.json();
      const { patientId, assignedDoctorId, status } = reqBody;

      // Fetch the creator user to get their branch
      const creatorUser = await User.findById(user.id).select('branch').exec();
      if (!creatorUser) {
        console.error(`Creator user not found: ${user.id}`);
        return NextResponse.json({ error: "Creator user not found" }, { status: 404 });
      }

      reqBody.createdBy = {
        id: user.id,
        username: user.username,
      };

      // Fetch the patient
      const patient = await Patient.findById(patientId).exec();
      if (!patient) {
        console.error(`Patient not found: ${patientId}`);
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      // Fetch the assigned doctor
      const assignedDoctor = await User.findById(assignedDoctorId);
      if (!assignedDoctor) {
        console.error(`Doctor not found: ${assignedDoctorId}`);
        return NextResponse.json({ error: "Doctor not found" }, { status: 404 });
      }

      // DELETE ALL existing orders for this patient first
      if (patient.Order && patient.Order.length > 0) {
        // Delete all orders associated with this patient
        await Order.deleteMany({ _id: { $in: patient.Order } });
        
        // Also delete all associated Age documents for this patient
        
        console.log(`Deleted ${patient.Order.length} existing orders for patient: ${patientId}`);
        
        // Clear the Order array from patient
        patient.Order = [];
        await patient.save();
      }

      // CREATE new order with branch from creator
      const newOrder = new Order({
        assignedDoctorTo: {
          id: assignedDoctor._id,
          username: assignedDoctor.username,
        },
        patientId: {
          id: patient._id,
        },
        branch: creatorUser.branch, // Add branch from creator
        createdBy: {
          id: user.id,
          username: user.username,
        },
        status,
      });

      // Save the new order
      const savedOrder = await newOrder.save();
      
      const newAge = new Age({
        patient: patient._id,
                branch: creatorUser.branch, // Add branch from creator

      });

      // Save the new Age document
      const savedAge = await newAge.save();

      // Attach the new order to the patient
      patient.Order.push(savedOrder._id);
      await patient.save();

      return NextResponse.json({
        message: "Order created successfully",
        success: true,
        savedOrder,
        savedAge
      });
    }
  } catch (error) {
    console.error("Error in POST /api/patient/order", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}