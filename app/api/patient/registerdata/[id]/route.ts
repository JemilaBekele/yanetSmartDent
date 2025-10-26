import {connect} from "@/app/lib/mongodb";
import Patient from "@/app/(models)/Patient";
import Order from "@/app/(models)/Order";
import MedicalFinding from "@/app/(models)/MedicalFinding";
import Healthinfo from "@/app/(models)/healthinfo";
import Appointment from "@/app/(models)/appointment";
import Image from "@/app/(models)/image";
import Invoice from "@/app/(models)/Invoice";
import Card from "@/app/(models)/card";
import Orgnazation from '@/app/(models)/Orgnazation';
import { NextRequest, NextResponse } from "next/server";
import {authorizedMiddleware} from "@/app/helpers/authentication"
import Credit from "@/app/(models)/creadit";
import Branch from "@/app/(models)/branch";
connect();

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }
                await Branch.aggregate([{ $sample: { size: 1 } }]);

    await Orgnazation.aggregate([{ $sample: { size: 1 } }]);
    // Find the patient and populate the Orgnazation field with only _id and organization name
    const patient = await Patient.findById(id)
      .populate({
        path: "Orgnazation",
        select: "_id organization", // Only include _id and organization fields
      }).populate({
        path: "Healthinfo"
      })
      .populate({
        path: "branch"
      })
      .exec();

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json(patient);
  } catch (error: unknown) {
    console.error("Error in GET /api/patient/registerdata:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


  export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    authorizedMiddleware(request);
    try {
      const { id } = params;
      
      if (!id) {
        return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
      }
  
      const patient = await Patient.findById(id);
  
      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }
  
      // Deleting related documents
      if (patient.Order && patient.Order.length > 0) {
        await Order.deleteMany({ _id: { $in: patient.Order } });
      }
      if (patient.MedicalFinding && patient.MedicalFinding.length > 0) {
        await MedicalFinding.deleteMany({ _id: { $in: patient.MedicalFinding } });
      }
      if (patient.Healthinfo && patient.Healthinfo.length > 0) {
        await Healthinfo.deleteMany({ _id: { $in: patient.Healthinfo } });
      }
      if (patient.Appointment && patient.Appointment.length > 0) {
        await Appointment.deleteMany({ _id: { $in: patient.Appointment } });
      }
      if (patient.Image && patient.Image.length > 0) {
        await Image.deleteMany({ _id: { $in: patient.Image } });
      }
      if (patient.Invoice && patient.Invoice.length > 0) {
        await Invoice.deleteMany({ _id: { $in: patient.Invoice } });
      }
      if (patient.Card && patient.Card.length > 0) {
        await Card.deleteMany({ _id: { $in: patient.Card } });
      }
      if (patient.Credit && patient.Credit.length > 0) {
        await Credit.deleteMany({ _id: { $in: patient.Credit } });
      }
      
      
      // Finally, delete the patient document
      await Patient.findByIdAndDelete(id);
  
      return NextResponse.json({ message: "Patient and related data deleted successfully" });
    } catch (error: unknown) {
      console.error("Error in DELETE /api/patient/registerdata:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }


export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  authorizedMiddleware(request);
    try {
    
      const { id } = params;
      const body = await request.json();
      
      if (!id) {
        return NextResponse.json({ error: "patient ID is required" }, { status: 400 });
      }
  
      const updatedPatient = await Patient.findByIdAndUpdate(id, body, { new: true, runValidators: true });
  
      if (!updatedPatient) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
  
      return NextResponse.json(updatedPatient);
    } catch (error: unknown) {
      console.error("Error in PATCH /api/patient/registerdata:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }  