import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import ProductUnit from '@/app/(models)/inventory/productunit';
import UnitOfMeasure from '@/app/(models)/inventory/UnitOfMeasure';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Product from '@/app/(models)/inventory/Product';

connect();

export async function POST(req: NextRequest) {
          await authorizedMiddleware(req);
  
  try {
    const { productId, unitOfMeasureId, conversionToBase, isDefault } = await req.json();

    // Validate required fields
    if (!productId || !unitOfMeasureId || !conversionToBase) {
      return NextResponse.json({ 
        message: 'Product ID, Unit of Measure ID, and conversion factor are required' 
      }, { status: 400 });
    }

    // Validate conversion factor
    if (conversionToBase <= 0) {
      return NextResponse.json({ 
        message: 'Conversion factor must be greater than 0' 
      }, { status: 400 });
    }

    // Check if this product-unit combination already exists
    const existingProductUnit = await ProductUnit.findOne({ 
      productId, 
      unitOfMeasureId 
    });
    
    if (existingProductUnit) {
      return NextResponse.json({ 
        message: 'This product already has this unit of measure assigned' 
      }, { status: 400 });
    }

    // If setting as default, remove default status from other units for this product
    if (isDefault) {
      await ProductUnit.updateMany(
        { productId, _id: { $ne: null } },
        { isDefault: false }
      );
    }

    const newProductUnit = new ProductUnit({ 
      productId, 
      unitOfMeasureId, 
      conversionToBase, 
      isDefault: isDefault || false 
    });
    
    await newProductUnit.save();

    // Populate the references for better response
    const populatedProductUnit = await ProductUnit.findById(newProductUnit._id)
      .populate('productId')
      .populate('unitOfMeasureId');

    return NextResponse.json({ 
      message: 'Product unit assigned successfully', 
      productUnit: populatedProductUnit 
    }, { status: 201 });
  } catch (error) {
    console.error('Error while adding product unit:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
          await authorizedMiddleware(req);
  
  try {
                                await UnitOfMeasure.aggregate([{ $sample: { size: 1 } }]);
                await Product.aggregate([{ $sample: { size: 1 } }]);

    const productUnits = await ProductUnit.find()
      .populate('productId')
      .populate('unitOfMeasureId')
      .sort({ createdAt: -1 });

    return NextResponse.json(productUnits, { status: 200 });
  } catch (error) {
    console.error('Error while fetching product units:', error);
    return NextResponse.json({ message: 'Failed to fetch product units' }, { status: 500 });
  }
}

