import ProCategory from '@/app/(models)/inventory/Category';
import Product from '@/app/(models)/inventory/Product';
import ProductBatch from '@/app/(models)/inventory/ProductBatch';
import SubCategory from '@/app/(models)/inventory/SubCategory';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
// Import your ProductBatch model

// GET - fetch product information and all its batches
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
            await ProCategory.aggregate([{ $sample: { size: 1 } }]);
            await SubCategory.aggregate([{ $sample: { size: 1 } }]);

    // First, get the product with populated category and subcategory
    const product = await Product.findById(id)
      .populate('categoryId')
      .populate('subCategoryId')
      .populate('createdById');

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    // Then, get all batches associated with this product
    const batches = await ProductBatch.find({ productId: id })
      .populate('createdById')
      .sort({ created_at: -1 }); // Sort by creation date, newest first

    // Return both product info and its batches
    return NextResponse.json({
      product: product,
      batches: batches
    }, { status: 200 });

  } catch (error) {
    console.error('Error fetching product and batches:', error);
    return NextResponse.json({ message: 'Failed to fetch product and batches' }, { status: 500 });
  }
}