import { NextRequest, NextResponse } from 'next/server';
import StockLedger from '@/app/(models)/inventory/StockLedger';
import { authorizedMiddleware } from '@/app/helpers/authentication';

export async function GET(req: NextRequest) {
          await authorizedMiddleware(req);
  
  try {
    // Fetch all stock ledger entries
    const ledger = await StockLedger.find()
      .populate('productId')
      .populate('batchId')
      .populate({
        path: 'productUnitId',
        model: 'ProductUnit',
        populate: {
          path: 'unitOfMeasureId',
          model: 'UnitOfMeasure',
        }
      })
      .populate('userId')
      .sort({ movementDate: -1 }) // latest first
      .lean();

    if (!ledger || ledger.length === 0) {
      return NextResponse.json({ message: 'No stock ledger entries found' }, { status: 404 });
    }

    return NextResponse.json(ledger, { status: 200 });

  } catch (error) {
    console.error('Error fetching stock ledger:', error);
    return NextResponse.json({ message: 'Failed to fetch stock ledger', error: error.message }, { status: 500 });
  }
}
