import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/app/lib/mongodb";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import { CorrectionStatus, ManualStockCorrection, ManualStockCorrectionItem } from "@/app/(models)/inventory/manualcorrection";
import { generateCorrectionReference } from "@/app/lib/correctionUtils";

connect(); // ensure MongoDB connection

// ======================= POST - Create Manual Stock Correction ======================= //
export async function POST(req: NextRequest) {
  try {
    // ✅ Authorize request & extract user
    await authorizedMiddleware(req);
    const user = (req as any).user;
    if (!user || !user.id) {
      return NextResponse.json(
        { message: "Unauthorized user" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { items, reason, notes } = body;

    // ✅ Validate required fields
    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { message: "Reason is required" },
        { status: 400 }
      );
    }

    // ✅ Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: "At least one correction item is required" },
        { status: 400 }
      );
    }

    // ✅ Validate each item
    for (const item of items) {
      if (
        !item.productId ||
        !item.productUnitId ||
        !item.batchId ||
        item.oldQuantity === undefined ||
        item.newQuantity === undefined
      ) {
        return NextResponse.json(
          { message: "All item fields (productId, productUnitId, batchId, oldQuantity, newQuantity) are required" },
          { status: 400 }
        );
      }

      // Validate that at least one source reference is provided
      if (!item.personalStockId && !item.stockId && !item.locationItemStockId) {
        return NextResponse.json(
          { message: "At least one source reference (personalStockId, stockId, or locationItemStockId) is required for each item" },
          { status: 400 }
        );
      }

      // Calculate difference
      item.difference = item.newQuantity - item.oldQuantity;
    }

    // ✅ Generate sequential reference
    const reference = await generateCorrectionReference();

    // ✅ Create main correction document
    const correctionDoc = new ManualStockCorrection({
      reference,
      reason,
      notes,
      status: CorrectionStatus.PENDING,
      createdById: user.id,
    });

    await correctionDoc.save();

    // ✅ Create correction items
    const correctionItems = items.map((item: any) => ({
      correctionId: correctionDoc._id,
      productId: item.productId,
      productUnitId: item.productUnitId,
      batchId: item.batchId,
      personalStockId: item.personalStockId,
      stockId: item.stockId,
      locationItemStockId: item.locationItemStockId,
      oldQuantity: item.oldQuantity,
      newQuantity: item.newQuantity,
      difference: item.difference,
      notes: item.notes,
    }));

    await ManualStockCorrectionItem.insertMany(correctionItems);

    // ✅ Populate and return the complete document
    const populatedCorrection = await ManualStockCorrection.findById(correctionDoc._id)
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
        message: "Manual stock correction created successfully",
        correction: populatedCorrection,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating manual stock correction:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// ======================= GET - Fetch All Manual Stock Corrections ======================= //
export async function GET(req: NextRequest) {
  try {
    // ✅ Optional: Add authorization if needed
    await authorizedMiddleware(req);

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // ✅ Build filter
    const filter: any = {};
    if (status && Object.values(CorrectionStatus).includes(status as any)) {
      filter.status = status;
    }

    // ✅ Get total count for pagination
    const total = await ManualStockCorrection.countDocuments(filter);

    // ✅ Fetch corrections with pagination and population
    const corrections = await ManualStockCorrection.find(filter)
      .populate({
        path: "createdById",
        select: "username email",
      })
      .populate({
        path: "approvedById",
        select: "username email",
      })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit);

    // ✅ Fetch items for each correction
    const correctionsWithItems = await Promise.all(
      corrections.map(async (correction) => {
        const items = await ManualStockCorrectionItem.find({
          correctionId: correction._id,
        })
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
          });

        return {
          ...correction.toObject(),
          items,
        };
      })
    );

    return NextResponse.json(
      {
        corrections: correctionsWithItems,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching manual stock corrections:", error);
    return NextResponse.json(
      { message: "Failed to fetch manual stock corrections" },
      { status: 500 }
    );
  }
}