// app/api/product-batch/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import Product from '@/app/(models)/inventory/Product';
import ProductBatch from '@/app/(models)/inventory/ProductBatch';
import { authorizedMiddleware } from '@/app/helpers/authentication';


connect(); // ensure MongoDB connection

// POST - create a new ProductBatch
export async function POST(req: NextRequest) {
      await authorizedMiddleware(req);
  
  try {
    const { batchNumber, expiryDate, manufactureDate, size, price, warningQuantity, productId, createdById } =
      await req.json();

    if (!productId) {
      return NextResponse.json(
        { message: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) return NextResponse.json({ message: 'Product not found' }, { status: 404 });

    let finalBatchNumber = batchNumber;

    // Generate batch number if not provided
    if (!finalBatchNumber) {
      // Generate a unique batch number using timestamp and random string
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 8);
      finalBatchNumber = `BATCH-${timestamp}-${randomStr}`.toUpperCase();
      
      // Optional: You can also use a counter-based system if you prefer
      // const batchCount = await ProductBatch.countDocuments({ productId });
      // finalBatchNumber = `${product.name}-${batchCount + 1}`.replace(/\s+/g, '-').toUpperCase();
    }

    // Check for unique batch number
    const existingBatch = await ProductBatch.findOne({ batchNumber: finalBatchNumber });
    if (existingBatch) {
      // If auto-generated batch number conflicts, regenerate
      const timestamp = Date.now().toString(36);
      const randomStr = Math.random().toString(36).substring(2, 8);
      finalBatchNumber = `BATCH-${timestamp}-${randomStr}`.toUpperCase();
    }

    const newBatch = new ProductBatch({
      batchNumber: finalBatchNumber,
      expiryDate,
      manufactureDate,
      size,
      price,
      warningQuantity,
      productId,
      createdById,
    });

    await newBatch.save();

    return NextResponse.json({ 
      message: 'Product batch created successfully', 
      batch: newBatch,
      batchNumberGenerated: !batchNumber // Indicate if batch number was auto-generated
    }, { status: 201 });
  } catch (error) {
    console.error('Error while creating product batch:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// GET - fetch all ProductBatches with product info
export async function GET(req: NextRequest) {
      await authorizedMiddleware(req);
  try {
    const batches = await ProductBatch.find()
      .populate('productId'); // populate related product info

    return NextResponse.json(batches, { status: 200 });
  } catch (error) {
    console.error('Error while fetching product batches:', error);
    return NextResponse.json({ message: 'Failed to fetch product batches' }, { status: 500 });
  }
}
