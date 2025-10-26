// app/api/personal-stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import mongoose from 'mongoose';
import { HolderStatus, PersonalStock } from '@/app/(models)/inventory/personal';

export async function GET(req: NextRequest, { params }: { params: { batchId: string, userId: string } }) {
  try {
    // Authenticate user
    await authorizedMiddleware(req);

    const { batchId, userId } = params;

    // Validate ObjectId formats
    if (!mongoose.Types.ObjectId.isValid(batchId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid batchId or userId format',
        },
        { status: 400 }
      );
    }

    // Aggregate total ACTIVE stock for given user and batch
    const personalStockEntry = await PersonalStock.aggregate([
      {
        $match: {
          batchId: new mongoose.Types.ObjectId(batchId),
          userId: new mongoose.Types.ObjectId(userId),
          status: HolderStatus.ACTIVE,
        },
      },
      {
        $group: {
          _id: { batchId: '$batchId', userId: '$userId' },
          totalQuantity: { $sum: '$quantity' },
        },
      },
    ]);

    const totalQuantity = personalStockEntry.length > 0 ? personalStockEntry[0].totalQuantity : 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          batchId,
          userId,
          totalQuantity,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching personal stock:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch personal stock',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
