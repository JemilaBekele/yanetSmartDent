import { NextRequest, NextResponse } from 'next/server';
import Stock from '@/app/(models)/inventory/Stock';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {  
  try {
    await authorizedMiddleware(req);
    const { id } = params;
    
    // Validate batchId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid batch ID format' 
        },
        { status: 400 }
      );
    }


    // Sum only AVAILABLE stock for given batchId
    const stockEntry = await Stock.aggregate([
      { $match: { batchId: new mongoose.Types.ObjectId(id), status: 'Available' } },
      {
        $group: {
          _id: '$batchId',
          totalAvailable: { $sum: '$quantity' },
        },
      },
    ]);

    // Return 0 instead of 404 if no stock is found
    const availableQuantity = stockEntry.length > 0 ? stockEntry[0].totalAvailable : 0;

    return NextResponse.json(
      {
        success: true,
        data: {
          batchId: id,
          availableQuantity: availableQuantity,
        }
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching available stock by batchId:', error);
    return NextResponse.json(
      { 
        success: false,
        message: 'Failed to fetch available stock',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}