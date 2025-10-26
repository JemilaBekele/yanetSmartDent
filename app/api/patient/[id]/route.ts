import {connect} from "@/app/lib/mongodb";
import Patient from "@/app/(models)/Patient";
import { NextRequest, NextResponse } from "next/server";
import {authorizedMiddleware} from "@/app/helpers/authentication"
connect(); // Make sure you're connecting to DB

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const body = await request.json();
    const { finish } = body;

    if (typeof finish !== "boolean") {
      return NextResponse.json({ error: "finish must be a boolean" }, { status: 400 });
    }

    const updatedPatient = await Patient.findByIdAndUpdate(
      id,
      { finish },
      { new: true }
    );

    if (!updatedPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updatedPatient });
  } catch (error) {
    console.error("Error updating patient finish status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
