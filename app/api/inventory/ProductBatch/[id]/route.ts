import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import ProductBatch from '@/app/(models)/inventory/ProductBatch';
import Product from '@/app/(models)/inventory/Product';
import { authorizedMiddleware } from '@/app/helpers/authentication';


connect();

// GET - fetch ProductBatch by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
      await authorizedMiddleware(req);
  
  try {
    const { id } = params;

    const batch = await ProductBatch.findById(id)
      .populate('productId')
      .populate('createdById');

    if (!batch) {
      return NextResponse.json({ message: 'Product batch not found' }, { status: 404 });
    }

    return NextResponse.json(batch, { status: 200 });
  } catch (error) {
    console.error('Error fetching product batch by ID:', error);
    return NextResponse.json({ message: 'Failed to fetch product batch' }, { status: 500 });
  }
}

// PATCH - update ProductBatch by ID
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { batchNumber, expiryDate, manufactureDate, size, price, warningQuantity, productId } = await req.json();

    if (!batchNumber || !productId) {
      return NextResponse.json(
        { message: 'Batch number and productId are required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) return NextResponse.json({ message: 'Product not found' }, { status: 404 });

    // Check if the batch exists
    const existingBatch = await ProductBatch.findById(id);
    if (!existingBatch) return NextResponse.json({ message: 'Product batch not found' }, { status: 404 });

    // Check for duplicate batch number (only if batchNumber is being changed)
    if (batchNumber !== existingBatch.batchNumber) {
      const duplicateBatch = await ProductBatch.findOne({ 
        batchNumber, 
        _id: { $ne: id } // Exclude the current batch from the check
      });
      
      if (duplicateBatch) {
        return NextResponse.json({ 
          message: 'Batch number already exists for another batch' 
        }, { status: 400 });
      }
    }

    const updatedBatch = await ProductBatch.findByIdAndUpdate(
      id,
      { batchNumber, expiryDate, manufactureDate, size, price, warningQuantity, productId },
      { new: true, runValidators: true }
    );

    return NextResponse.json({ 
      message: 'Product batch updated successfully', 
      batch: updatedBatch 
    }, { status: 200 });
  } catch (error) {
    console.error('Error updating product batch:', error);
    return NextResponse.json({ 
      message: 'Failed to update product batch' 
    }, { status: 500 });
  }
}

// DELETE - remove ProductBatch by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    const deletedBatch = await ProductBatch.findByIdAndDelete(id);
    if (!deletedBatch) return NextResponse.json({ message: 'Product batch not found' }, { status: 404 });

    return NextResponse.json({ message: 'Product batch deleted successfully', batch: deletedBatch }, { status: 200 });
  } catch (error) {
    console.error('Error deleting product batch:', error);
    return NextResponse.json({ message: 'Failed to delete product batch' }, { status: 500 });
  }
}
