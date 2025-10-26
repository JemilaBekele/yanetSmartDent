// app/api/stock-withdrawal/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/app/lib/mongodb";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import { StockWithdrawalRequest } from "@/app/(models)/inventory/StockWithdrawal";

connect();

// ======================= GET by ID ======================= //
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const withdrawalDoc = await StockWithdrawalRequest.findById(id)
      .populate("userId")
      .populate({
        path: "items.productId",
        model: "Product",
        select: "_id name code",
      })
      .populate({
        path: "items.batchId",
        model: "ProductBatch",
      })
      .populate({
        path: "items.productUnitId",
        model: "ProductUnit",
        populate: {
          path: "unitOfMeasureId",
          model: "UnitOfMeasure",
        },
      })
      .populate({
        path: "items.fromLocationId",
        model: "Location",
      })
      .lean();

    if (!withdrawalDoc) {
      return NextResponse.json(
        { message: "Stock withdrawal request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(withdrawalDoc, { status: 200 });
  } catch (error) {
    console.error("Error fetching stock withdrawal request by ID:", error);
    return NextResponse.json(
      { message: "Failed to fetch stock withdrawal request" },
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
    const { notes, status, approvedAt, issuedAt, items } = await req.json();
    const user = (req as any).user;

    const withdrawal = await StockWithdrawalRequest.findById(id);
    if (!withdrawal) {
      return NextResponse.json(
        { message: "Stock withdrawal request not found" },
        { status: 404 }
      );
    }

    if (notes !== undefined) withdrawal.notes = notes;
    if (status !== undefined) withdrawal.status = status;
    if (approvedAt !== undefined) withdrawal.approvedAt = approvedAt;
    if (issuedAt !== undefined) withdrawal.issuedAt = issuedAt;

    // Replace items if provided
    if (Array.isArray(items)) {
      withdrawal.items = items.map((item: any) => ({
        productId: item.productId,
        batchId: item.batchId,
        productUnitId: item.productUnitId,
        requestedQuantity: item.requestedQuantity,
        fromLocationId: item.fromLocationId,
      }));
    }

    const updatedWithdrawal = await withdrawal.save();

    return NextResponse.json(
      {
        message: "Stock withdrawal request updated successfully",
        withdrawal: updatedWithdrawal,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating stock withdrawal request:", error);
    return NextResponse.json(
      { message: "Failed to update stock withdrawal request" },
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

    const deletedWithdrawal = await StockWithdrawalRequest.findByIdAndDelete(id);
    if (!deletedWithdrawal) {
      return NextResponse.json(
        { message: "Stock withdrawal request not found" },
        { status: 404 }
      );
    }

    console.log(
      `StockWithdrawalRequest ${id} deleted by user ${user.username} (${user.id})`
    );

    return NextResponse.json(
      {
        message: "Stock withdrawal request deleted successfully",
        withdrawal: deletedWithdrawal,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting stock withdrawal request:", error);
    return NextResponse.json(
      { message: "Failed to delete stock withdrawal request" },
      { status: 500 }
    );
  }
}
