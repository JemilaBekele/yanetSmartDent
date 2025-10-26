import { NextRequest, NextResponse } from 'next/server';
import Stock from '@/app/(models)/inventory/Stock';
import { authorizedMiddleware } from '@/app/helpers/authentication';

export async function GET(req: NextRequest) {
          await authorizedMiddleware(req);
  
  try {
    // Fetch all stock entries
    const stockEntries = await Stock.find()
      .populate({
        path: 'batchId',
        model: 'ProductBatch',
        populate: {
          path: 'productId',
          model: 'Product',
        },
      })
      .populate('userId')
      .sort({ created_at: 1 }) // first come, first fetch
      .lean();

    if (!stockEntries || stockEntries.length === 0) {
      return NextResponse.json({ message: 'No stock entries found' }, { status: 404 });
    }

    return NextResponse.json(stockEntries, { status: 200 });

  } catch (error) {
    console.error('Error fetching stock entries:', error);
    return NextResponse.json({ message: 'Failed to fetch stock entries', error: error.message }, { status: 500 });
  }
}
