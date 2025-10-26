// app/api/product-units/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import mongoose from 'mongoose';
import ProductUnit from '@/app/(models)/inventory/productunit';
import UnitOfMeasure from '@/app/(models)/inventory/UnitOfMeasure';
import { authorizedMiddleware } from '@/app/helpers/authentication';

connect();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
        await authorizedMiddleware(req);

  try {
    const { id } = params;

    // ✅ Validate productId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'Invalid product ID format' },
        { status: 400 }
      );
    }
                await UnitOfMeasure.aggregate([{ $sample: { size: 1 } }]);

    // ✅ Find all product units for the given productId
    const productUnits = await ProductUnit.find({ productId: id })
      .populate('productId', 'name') // populate product info (only "name")
      .populate('unitOfMeasureId', 'name symbol') // populate unit info
      .sort({ created_at: -1 });

    return NextResponse.json(
      {
        success: true,
        data: productUnits,
        count: productUnits.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching product units:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch product units',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
