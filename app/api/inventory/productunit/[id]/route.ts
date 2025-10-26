import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import ProductUnit from '@/app/(models)/inventory/productunit';
import mongoose from 'mongoose';
import UnitOfMeasure from '@/app/(models)/inventory/UnitOfMeasure';
import Product from '@/app/(models)/inventory/Product';

connect();




export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  
  try {
    const { conversionToBase, isDefault } = await req.json();
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'Product unit ID is required' }, { status: 400 });
    }

    // Validate conversion factor if provided
    if (conversionToBase !== undefined && conversionToBase <= 0) {
      return NextResponse.json({ 
        message: 'Conversion factor must be greater than 0' 
      }, { status: 400 });
    }

    const existingProductUnit = await ProductUnit.findById(id);
    if (!existingProductUnit) {
      return NextResponse.json({ message: 'Product unit not found' }, { status: 404 });
    }

    // If setting as default, remove default status from other units for this product
    if (isDefault) {
      await ProductUnit.updateMany(
        { productId: existingProductUnit.productId, _id: { $ne: id } },
        { isDefault: false }
      );
    }
                await UnitOfMeasure.aggregate([{ $sample: { size: 1 } }]);
                await Product.aggregate([{ $sample: { size: 1 } }]);

    const updateData: any = {};
    if (conversionToBase !== undefined) updateData.conversionToBase = conversionToBase;
    if (isDefault !== undefined) updateData.isDefault = isDefault;

    const updatedProductUnit = await ProductUnit.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('productId')
     .populate('unitOfMeasureId');

    return NextResponse.json({ 
      message: 'Product unit updated successfully', 
      productUnit: updatedProductUnit 
    }, { status: 200 });
  } catch (error) {
    console.error('Error while updating product unit:', error);
    return NextResponse.json({ message: 'Failed to update product unit' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'Product unit ID is required' }, { status: 400 });
    }

    const deletedProductUnit = await ProductUnit.findByIdAndDelete(id);

    if (!deletedProductUnit) {
      return NextResponse.json({ message: 'Product unit not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Product unit deleted successfully', 
      productUnit: deletedProductUnit 
    }, { status: 200 });
  } catch (error) {
    console.error('Error while deleting product unit:', error);
    return NextResponse.json({ message: 'Failed to delete product unit' }, { status: 500 });
  }
}