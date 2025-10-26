import ProductBatch from '@/app/(models)/inventory/ProductBatch';
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import mongoose from 'mongoose';
import { authorizedMiddleware } from '@/app/helpers/authentication';


connect();




export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
      await authorizedMiddleware(req);
  
  try {
    const { id } = params;
    

    // Validate productId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { message: 'Invalid product ID format' },
        { status: 400 }
      );
    }

    // Connect to database

    // Find all batches for the given product ID - use productId field, not id
    const batches = await ProductBatch.find({ productId: id })
      .populate('createdById', 'username') // Populate user info
      .populate('productId') // Populate product info
      .sort({ created_at: -1 }); // Sort by creation date, newest first


    return NextResponse.json(
      { 
        success: true, 
        data: batches,
        count: batches.length 
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching product batches:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch product batches',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}