// app/api/personal-stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import mongoose from 'mongoose';
import { HolderStatus, PersonalStock } from '@/app/(models)/inventory/personal';
import ProductBatch from '@/app/(models)/inventory/ProductBatch';
import Product from '@/app/(models)/inventory/Product';
import ProductUnit from '@/app/(models)/inventory/productunit';
import UnitOfMeasure from '@/app/(models)/inventory/UnitOfMeasure';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user and attach user info to req
    await authorizedMiddleware(req);
    const user = (req as any).user;

    if (!user || !user.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized user' }, { status: 401 });
    }

            await ProductBatch.aggregate([{ $sample: { size: 1 } }]);
            await Product.aggregate([{ $sample: { size: 1 } }]);
            await ProductUnit.aggregate([{ $sample: { size: 1 } }]);
            await UnitOfMeasure.aggregate([{ $sample: { size: 1 } }]);

    // Aggregate all ACTIVE personal stock for this user
    const personalStockEntries = await PersonalStock.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(user.id),
          status: HolderStatus.ACTIVE,
        },
      },
      {
        $lookup: {
          from: 'productbatches', // MongoDB collection name
          localField: 'batchId',
          foreignField: '_id',
          as: 'batchInfo',
        },
      },
      { $unwind: '$batchInfo' },
      {
        $project: {
          _id: 0,
          userId: 1,
          batchId: 1,
          quantity: 1,
          productId: '$batchInfo.productId',
          batchNumber: '$batchInfo.batchNumber',
          expiryDate: '$batchInfo.expiryDate',
          price: '$batchInfo.price',
        },
      },
    ]);

    return NextResponse.json(
      { success: true, data: personalStockEntries },
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
