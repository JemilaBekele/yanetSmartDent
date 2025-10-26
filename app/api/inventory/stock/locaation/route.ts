// app/api/location-stock/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { LocationItemStock } from '@/app/(models)/inventory/locationstock';
import ProductBatch from '@/app/(models)/inventory/ProductBatch';
import Product from '@/app/(models)/inventory/Product';
import ProductUnit from '@/app/(models)/inventory/productunit';
import UnitOfMeasure from '@/app/(models)/inventory/UnitOfMeasure';
import Location from '@/app/(models)/inventory/location';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user and attach user info to req
    await authorizedMiddleware(req);
    const user = (req as any).user;

    if (!user || !user.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized user' }, { status: 401 });
    }
    // Warm up the models (optional performance optimization)
    await Location.aggregate([{ $sample: { size: 1 } }]);
    await ProductBatch.aggregate([{ $sample: { size: 1 } }]);
    await Product.aggregate([{ $sample: { size: 1 } }]);    await ProductUnit.aggregate([{ $sample: { size: 1 } }]);
    await UnitOfMeasure.aggregate([{ $sample: { size: 1 } }]);

    // Aggregate all location stock where status is ACTIVE
    const locationStockEntries = await LocationItemStock.aggregate([
      {
        $match: {
          status: 'ACTIVE',
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
        $lookup: {
          from: 'locations',
          localField: 'locationId',
          foreignField: '_id',
          as: 'locationInfo',
        },
      },
      { $unwind: '$locationInfo' },
      {
        $project: {
          _id: 0,
          locationStockId: '$_id',
          batchId: 1,
          locationId: 1,
          quantity: 1,
          status: 1,
          notes: 1,
          lastUpdated: 1,
          created_at: 1,
          updated_at: 1,
          productId: '$batchInfo.productId',
          productName: '$batchInfo.productInfo.name',
          productCode: '$batchInfo.productInfo.code',
          batchNumber: '$batchInfo.batchNumber',
          expiryDate: '$batchInfo.expiryDate',
          price: '$batchInfo.price',
          locationName: '$locationInfo.name',
          locationType: '$locationInfo.type',
        },
      },
    ]);

    return NextResponse.json(
      { 
        success: true, 
        data: locationStockEntries,
        count: locationStockEntries.length 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching location stock:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch location stock',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}