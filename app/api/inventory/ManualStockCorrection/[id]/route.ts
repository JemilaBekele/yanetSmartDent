// app/api/manual-stock-correction/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/app/lib/mongodb";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import { CorrectionStatus, ManualStockCorrection, ManualStockCorrectionItem } from "@/app/(models)/inventory/manualcorrection";

connect();

// ======================= GET by ID ======================= //
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const correctionDoc = await ManualStockCorrection.findById(id)
      .populate({
        path: "createdById",
        select: "username email",
      })
      .populate({
        path: "approvedById",
        select: "username email",
      })
      .lean();

    if (!correctionDoc) {
      return NextResponse.json(
        { message: "Manual stock correction not found" },
        { status: 404 }
      );
    }

    // Fetch items separately since virtuals don't work with lean()
    const items = await ManualStockCorrectionItem.find({ correctionId: id })
      .populate({
        path: "productId",
        select: "name code",
      })
      .populate({
        path: "productUnitId",
        select: "name conversionToBase",
        populate: {
          path: "unitOfMeasureId",
          select: "name symbol",
        },
      })
      .populate({
        path: "batchId",
        select: "batchNumber expiryDate",
      })
      .populate({
        path: "personalStockId",
        select: "quantity",
      })
      .populate({
        path: "stockId",
        select: "quantity",
      })
      .populate({
        path: "locationItemStockId",
        select: "quantity",
      })
      .lean();

    const correctionWithItems = {
      ...correctionDoc,
      items,
    };

    return NextResponse.json(correctionWithItems, { status: 200 });
  } catch (error) {
    console.error("Error fetching manual stock correction by ID:", error);
    return NextResponse.json(
      { message: "Failed to fetch manual stock correction" },
      { status: 500 }
    );
  }
}

// ======================= PATCH (Update) ======================= //
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authorizedMiddleware(req);
    const { id } = params;
    const { notes, status, reason } = await req.json();
    const user = (req as any).user;

    const correction = await ManualStockCorrection.findById(id);
    if (!correction) {
      return NextResponse.json(
        { message: "Manual stock correction not found" },
        { status: 404 }
      );
    }

    // Validate status transition
    if (status && status !== correction.status) {
      if (correction.status !== CorrectionStatus.PENDING) {
        return NextResponse.json(
          { message: "Only pending corrections can be updated" },
          { status: 400 }
        );
      }

      if (!Object.values(CorrectionStatus).includes(status)) {
        return NextResponse.json(
          { message: "Invalid status" },
          { status: 400 }
        );
      }

      correction.status = status;

      // Set approved by if status is approved
      if (status === CorrectionStatus.APPROVED) {
        correction.approvedById = user.id;
        // Here you would implement the actual stock adjustment logic
        // await adjustStockQuantities(id);
      }
    }

    if (notes !== undefined) correction.notes = notes;
    if (reason !== undefined && reason.trim()) correction.reason = reason;

    const updatedCorrection = await correction.save();

    // Populate the updated document
    const populatedCorrection = await ManualStockCorrection.findById(updatedCorrection._id)
      .populate({
        path: "createdById",
        select: "username email",
      })
      .populate({
        path: "approvedById",
        select: "username email",
      });

    return NextResponse.json(
      {
        message: "Manual stock correction updated successfully",
        correction: populatedCorrection,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating manual stock correction:", error);
    return NextResponse.json(
      { message: "Failed to update manual stock correction" },
      { status: 500 }
    );
  }
}

// ======================= DELETE ======================= //
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authorizedMiddleware(req);

    const { id } = params;
    const user = (req as any).user;

    const correction = await ManualStockCorrection.findById(id);
    if (!correction) {
      return NextResponse.json(
        { message: "Manual stock correction not found" },
        { status: 404 }
      );
    }

    // Only allow deletion of pending corrections
    if (correction.status !== CorrectionStatus.PENDING) {
      return NextResponse.json(
        { message: "Only pending corrections can be deleted" },
        { status: 400 }
      );
    }

    // Delete items first (to maintain referential integrity)
    await ManualStockCorrectionItem.deleteMany({ correctionId: id });

    // Delete the main correction
    const deletedCorrection = await ManualStockCorrection.findByIdAndDelete(id);

    console.log(
      `ManualStockCorrection ${id} deleted by user ${user.username} (${user.id})`
    );

    return NextResponse.json(
      {
        message: "Manual stock correction deleted successfully",
        correction: deletedCorrection,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting manual stock correction:", error);
    return NextResponse.json(
      { message: "Failed to delete manual stock correction" },
      { status: 500 }
    );
  }
}