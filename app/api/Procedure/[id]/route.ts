import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/app/lib/mongodb";
import Procedure from "@/app/(models)/Procedure";
import { authorizedMiddleware } from "@/app/helpers/authentication";

// Ensure MongoDB connection
connect();

/**
 * PATCH /api/procedure/[id]
 * Update an existing procedure
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authorizedMiddleware(req);
    const { id } = params;
    const { title, description } = await req.json();

    if (!id || !title) {
      return NextResponse.json(
        { message: "Procedure ID and title are required" },
        { status: 400 }
      );
    }

    const updatedProcedure = await Procedure.findByIdAndUpdate(
      id,
      { title, description },
      { new: true }
    );

    if (!updatedProcedure) {
      return NextResponse.json(
        { message: "Procedure not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Procedure updated successfully",
        procedure: updatedProcedure,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error while updating procedure:", error);
    return NextResponse.json(
      { message: "Failed to update procedure" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/procedure/[id]
 * Get a specific procedure by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await authorizedMiddleware(request);

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { message: "Procedure ID is required" },
        { status: 400 }
      );
    }

    const procedure = await Procedure.findById(id);

    if (!procedure) {
      return NextResponse.json(
        { message: "Procedure not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(procedure, { status: 200 });
  } catch (error) {
    console.error("Error while fetching procedure:", error);
    return NextResponse.json(
      { message: "Failed to fetch procedure" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/procedure/[id]
 * Delete a specific procedure by ID
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authorizedMiddleware(req);
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { message: "Procedure ID is required" },
        { status: 400 }
      );
    }

    const deletedProcedure = await Procedure.findByIdAndDelete(id);

    if (!deletedProcedure) {
      return NextResponse.json(
        { message: "Procedure not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        message: "Procedure deleted successfully",
        procedure: deletedProcedure,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error while deleting procedure:", error);
    return NextResponse.json(
      { message: "Failed to delete procedure" },
      { status: 500 }
    );
  }
}
