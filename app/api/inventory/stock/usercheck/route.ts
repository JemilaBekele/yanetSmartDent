// app/api/stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Stock from '@/app/(models)/inventory/Stock';
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

    // Aggregate all stock for this user where status is Available
    // Alternative approach with nested lookup
const stockEntries = await Stock.aggregate([
  {
    $match: {
      status: 'Available',
    },
  },
  {
    $lookup: {
      from: 'productbatches',
      localField: 'batchId',
      foreignField: '_id',
      as: 'batchInfo',
      pipeline: [
        {
          $lookup: {
            from: 'products',
            localField: 'productId',
            foreignField: '_id',
            as: 'productInfo',
          },
        },
        { $unwind: '$productInfo' },
      ],
    },
  },
  { $unwind: '$batchInfo' },
  {
    $project: {
      _id: 0,
      userId: 1,
      batchId: 1,
      quantity: 1,
      status: 1,
      lastUpdated: 1,
      productId: '$batchInfo.productId',
      productName: '$batchInfo.productInfo.name', // Access nested product name
      batchNumber: '$batchInfo.batchNumber',
      expiryDate: '$batchInfo.expiryDate',
      price: '$batchInfo.price',
    },
  },
]);

    return NextResponse.json(
      { success: true, data: stockEntries },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching stock:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch stock',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
