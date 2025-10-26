import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/app/lib/mongodb";
import Procedure from "@/app/(models)/Procedure";
import { authorizedMiddleware } from "@/app/helpers/authentication";

// Ensure MongoDB connection
connect();

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    await authorizedMiddleware(request);

    const { title, description } = await request.json();

    // Validate request
    if (!title) {
      return NextResponse.json(
        { message: "Procedure title is required" },
        { status: 400 }
      );
    }

    // Create new procedure
    const newProcedure = new Procedure({
      title,
      description,
    });

    // Save to database
    await newProcedure.save();

    return NextResponse.json(
      {
        message: "Procedure created successfully",
        procedure: newProcedure,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error while creating procedure:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const procedures = await Procedure.find().sort({ createdAt: -1 });
    return NextResponse.json(procedures, { status: 200 });
  } catch (error) {
    console.error("Error while fetching procedures:", error);
    return NextResponse.json(
      { message: "Failed to fetch procedures" },
      { status: 500 }
    );
  }
}
