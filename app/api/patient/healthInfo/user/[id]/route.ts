import { NextRequest, NextResponse } from "next/server";
import Healthinfo from "@/app/(models)/healthinfo";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import { connect } from "@/app/lib/mongodb";
import Patient from "@/app/(models)/Patient";

connect();

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);

  try {
    const { id } = params;

    if (!id) {
      console.error("❌ Patient ID is missing");
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }
    const user = (request as { user: { id: string; username: string } }).user;
   
    const body = await request.json();
    console.log("📩 Received body:", body); // Log incoming data

    const { userinfo } = body;

    if (!Array.isArray(userinfo) || userinfo.length === 0) {
      console.error("❌ Invalid userinfo format:", userinfo);
      return NextResponse.json({ error: "Invalid userinfo data" }, { status: 400 });
    }

    // Check if patient exists before creating a new healthInfo record
    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Create a new healthInfo entry
    const healthInfo = new Healthinfo({
      patientId: { id: patient._id },
      userinfo,
      createdBy: {
        id: user.id,
        username: user.username,
      },
    });

    const savedHealthinfo = await healthInfo.save();
    console.log("✅ New healthInfo created:", healthInfo);
  // Add the new health info to the patient
  patient.Healthinfo = patient.Healthinfo || [];
  patient.Healthinfo.push(savedHealthinfo._id);
  await patient.save();

    return NextResponse.json({
      message: "New healthInfo created successfully",
      success: true,
      data: savedHealthinfo,
    });
  } catch (error) {
    console.error("🔥 Error creating healthInfo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
