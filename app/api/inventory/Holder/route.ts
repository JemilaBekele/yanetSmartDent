import { PersonalStock } from '@/app/(models)/inventory/personal';
import Product from '@/app/(models)/inventory/Product';
import ProductBatch from '@/app/(models)/inventory/ProductBatch';
import ProductUnit from '@/app/(models)/inventory/productunit';
import UnitOfMeasure from '@/app/(models)/inventory/UnitOfMeasure';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { NextRequest, NextResponse } from 'next/server';

// ======================= GET all personal stocks =======================
export async function GET(request: NextRequest) {
            await authorizedMiddleware(request);
  
  try {
    
                await ProductBatch.aggregate([{ $sample: { size: 1 } }]);
                await Product.aggregate([{ $sample: { size: 1 } }]);
                await ProductUnit.aggregate([{ $sample: { size: 1 } }]);
                await UnitOfMeasure.aggregate([{ $sample: { size: 1 } }]);
    
    const personalStocks = await PersonalStock.find()
      .populate({
        path: 'userId',
        select: 'username email', // only fetch key user info
      })
      .populate({
        path: 'batchId',
        select: 'batchNumber expiryDate productId',
        populate: {
          path: 'productId',
          model: 'Product',
          select: 'name code', // fetch product info from batch
        },
      })
      .sort({ created_at: -1 }); // latest first

    return NextResponse.json(personalStocks, { status: 200 });
  } catch (error) {
    console.error('Error while fetching personal stocks:', error);
    return NextResponse.json(
      {
        message: 'Failed to fetch personal stocks',
        error: error.message,
      },
      { status: 500 },
    );
  }
}
