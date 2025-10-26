// app/api/stock-withdrawal/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/app/lib/mongodb";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import {
  StockWithdrawalRequest,
  StockWithdrawalStatus,
} from "@/app/(models)/inventory/StockWithdrawal";
import Location from "@/app/(models)/inventory/location";
import Product from "@/app/(models)/inventory/Product";
import ProductUnit from "@/app/(models)/inventory/productunit";
import UnitOfMeasure from "@/app/(models)/inventory/UnitOfMeasure";
import ProductBatch from "@/app/(models)/inventory/ProductBatch";

connect(); // ensure MongoDB connection

// ======================= POST - Create Stock Withdrawal Request ======================= //
export async function POST(req: NextRequest) {
  await authorizedMiddleware(req);
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return NextResponse.json(
        { message: "Unauthorized user" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { items, notes } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "At least one withdrawal item is required" },
        { status: 400 }
      );
    }

    // ✅ Build document with locToLoc = true
    const withdrawalDoc = new StockWithdrawalRequest({
      userId: user.id,
      items: items.map((item: any) => ({
        productId: item.productId,
        batchId: item.batchId,
        productUnitId: item.productUnitId,
        requestedQuantity: item.requestedQuantity,
        fromLocationId: item.fromLocationId,
      })),
      notes,
      status: StockWithdrawalStatus.PENDING,
      requestedAt: new Date(),
      locToMain: true, // ✅ always set true
    });

    await withdrawalDoc.save();

    return NextResponse.json(
      {
        message: "Stock withdrawal request created successfully",
        withdrawal: withdrawalDoc,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating stock withdrawal request:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ======================= GET - Fetch Stock Withdrawal Requests (only locToLoc) ======================= //
export async function GET(req: NextRequest) {
  await authorizedMiddleware(req);

  // warm up sample queries (looks like test queries, keeping them as is)
  await Location.aggregate([{ $sample: { size: 1 } }]);
  await Product.aggregate([{ $sample: { size: 1 } }]);
  await ProductBatch.aggregate([{ $sample: { size: 1 } }]);
  await ProductUnit.aggregate([{ $sample: { size: 1 } }]);
  await UnitOfMeasure.aggregate([{ $sample: { size: 1 } }]);

  try {
    const withdrawals = await StockWithdrawalRequest.find({ locToMain: true }) // ✅ filter only locToMain
      .populate({
        path: "userId",
        select: "username role",
      })
      .populate({
        path: "items.productId",
        select: "name code",
      })
      .populate({
        path: "items.batchId",
        select: "batchNumber expiryDate",
      })
      .populate({
        path: "items.productUnitId",
        select: "name conversionToBase",
        populate: {
          path: "unitOfMeasureId",
          select: "name symbol",
        },
      })
      .populate({
        path: "items.fromLocationId",
        select: "name type",
      })
      .sort({ created_at: -1 });

    return NextResponse.json(withdrawals, { status: 200 });
  } catch (error) {
    console.error("Error fetching stock withdrawal requests:", error);
    return NextResponse.json(
      { message: "Failed to fetch stock withdrawal requests" },
      { status: 500 }
    );
  }
}
