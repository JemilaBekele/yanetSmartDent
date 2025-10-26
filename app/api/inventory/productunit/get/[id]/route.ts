import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import mongoose from 'mongoose';
import ProductUnit from '@/app/(models)/inventory/productunit';
import UnitOfMeasure from '@/app/(models)/inventory/UnitOfMeasure';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Product from '@/app/(models)/inventory/Product';


connect();



export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
        await authorizedMiddleware(req);

  try {
    await connect();
    
    const { id } = params;
    
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Invalid product unit ID format' 
        },
        { status: 400 }
      );
    }
                await UnitOfMeasure.aggregate([{ $sample: { size: 1 } }]);
                await Product.aggregate([{ $sample: { size: 1 } }]);

    // Find the specific product unit by its ID
    const productUnit = await ProductUnit.findById(id)
      .populate('productId') // Populate product info
      .populate('unitOfMeasureId'); // Populate unit of measure info

    // Check if product unit was found
    if (!productUnit) {
      return NextResponse.json(
        { 
          success: false,
          message: 'Product unit not found' 
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        data: productUnit
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching product unit:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch product unit',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
