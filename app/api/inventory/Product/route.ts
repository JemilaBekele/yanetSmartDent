// app/api/product/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import Product from '@/app/(models)/inventory/Product';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import ProductBatch from '@/app/(models)/inventory/ProductBatch';
import { PersonalStock } from '@/app/(models)/inventory/personal';
import Stock from '@/app/(models)/inventory/Stock';
import { LocationItemStock } from '@/app/(models)/inventory/locationstock';
import mongoose from 'mongoose';
import ProCategory from '@/app/(models)/inventory/Category';
import SubCategory from '@/app/(models)/inventory/SubCategory';

connect(); // ensure MongoDB connection

// POST - create a new Product
// app/api/products/route.ts

// ======================= POST - create a new Product ======================= //
export async function POST(req: NextRequest) {
  try {
    // ✅ Authenticate user
    await authorizedMiddleware(req);
    const user = (req as any).user;

    const { productCode, name, description, categoryId, subCategoryId } =
      await req.json();

    // ✅ Required fields validation
    if (!productCode || !name || !categoryId) {
      return NextResponse.json(
        { message: "Product code, name, and categoryId are required" },
        { status: 400 }
      );
    }

    // ✅ Check if productCode is unique
    const existingProduct = await Product.findOne({ productCode });
    if (existingProduct) {
      return NextResponse.json(
        { message: "Product with this code already exists" },
        { status: 400 }
      );
    }

    // ✅ Check if category exists
    const categoryExists = await ProCategory.findById(categoryId);
    if (!categoryExists) {
      return NextResponse.json(
        { message: "Category not found" },
        { status: 404 }
      );
    }

    // ✅ If subCategory is provided, validate
    if (subCategoryId) {
      const subCategoryExists = await SubCategory.findById(subCategoryId);
      if (!subCategoryExists) {
        return NextResponse.json(
          { message: "SubCategory not found" },
          { status: 404 }
        );
      }
    }

    // ✅ Create new product (assign createdById from authenticated user)
    const newProduct = new Product({
      productCode,
      name,
      description,
      categoryId,
      subCategoryId,
      createdById: user.id, // 👈 automatically set
    });

    await newProduct.save();

    return NextResponse.json(
      {
        message: "Product created successfully",
        product: newProduct,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("❌ Error while creating product:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}





interface ProductDocument {
  _id: mongoose.Types.ObjectId;
  productCode: string;
  name: string;
  description?: string;
  categoryId: any;
  subCategoryId?: any;
  createdById?: mongoose.Types.ObjectId;
  created_at: Date;
  updated_at: Date;
}

interface BatchDocument {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  // other batch fields...
}

export async function GET() {
  try {
    const products = await Product.find()
      .populate('categoryId')
      .populate('subCategoryId')
      .lean() as unknown as ProductDocument[];

    // Get all product IDs to query stock information
    const productIds = products.map(product => product._id.toString());
    
    // Fetch batches for all products
    const batches = await ProductBatch.find({ 
      productId: { $in: productIds } 
    }).lean() as unknown as BatchDocument[];

    // Get batch IDs for stock queries
    const batchIds = batches.map(batch => batch._id.toString());
    
    // Fetch stock counts from Stock model (grouped by productId)
    const stockAggregate = await Stock.aggregate([
      { $match: { batchId: { $in: batchIds.map(id => new mongoose.Types.ObjectId(id)) } } },
      {
        $lookup: {
          from: 'productbatches',
          localField: 'batchId',
          foreignField: '_id',
          as: 'batch'
        }
      },
      { $unwind: '$batch' },
      {
        $group: {
          _id: '$batch.productId',
          totalStock: { $sum: '$quantity' }
        }
      }
    ]);

    // Fetch stock counts from PersonalStock model (grouped by productId)
    const personalStockAggregate = await PersonalStock.aggregate([
      { $match: { 
        batchId: { $in: batchIds.map(id => new mongoose.Types.ObjectId(id)) }, 
        status: 'ACTIVE' 
      } },
      {
        $lookup: {
          from: 'productbatches',
          localField: 'batchId',
          foreignField: '_id',
          as: 'batch'
        }
      },
      { $unwind: '$batch' },
      {
        $group: {
          _id: '$batch.productId',
          totalPersonalStock: { $sum: '$quantity' }
        }
      }
    ]);

    // Fetch stock counts from LocationItemStock model (grouped by productId)
    const locationStockAggregate = await LocationItemStock.aggregate([
      { $match: { 
        batchId: { $in: batchIds.map(id => new mongoose.Types.ObjectId(id)) }, 
        status: 'ACTIVE' 
      } },
      {
        $lookup: {
          from: 'productbatches',
          localField: 'batchId',
          foreignField: '_id',
          as: 'batch'
        }
      },
      { $unwind: '$batch' },
      {
        $group: {
          _id: '$batch.productId',
          totalLocationStock: { $sum: '$quantity' }
        }
      }
    ]);

    // Convert aggregates to maps for easy lookup
    const stockMap = new Map();
    stockAggregate.forEach(item => {
      stockMap.set(item._id.toString(), item.totalStock);
    });

    const personalStockMap = new Map();
    personalStockAggregate.forEach(item => {
      personalStockMap.set(item._id.toString(), item.totalPersonalStock);
    });

    const locationStockMap = new Map();
    locationStockAggregate.forEach(item => {
      locationStockMap.set(item._id.toString(), item.totalLocationStock);
    });

    // Enhance products with stock information from all locations
    const productsWithStock = products.map(product => {
      const productIdStr = product._id.toString();
      
      const stockCount = stockMap.get(productIdStr) || 0;
      const personalStockCount = personalStockMap.get(productIdStr) || 0;
      const locationStockCount = locationStockMap.get(productIdStr) || 0;
      const totalStock = stockCount + personalStockCount + locationStockCount;
      
      return {
        ...product,
        stockCount,              // From Stock model (warehouse/main stock)
        personalStockCount,      // From PersonalStock model (individual holders)
        locationStockCount,      // From LocationItemStock model (specific locations)
        totalStock               // Combined total from all locations
      };
    });

    return NextResponse.json(productsWithStock, { status: 200 });
  } catch (error) {
    console.error('Error while fetching products:', error);
    return NextResponse.json({ message: 'Failed to fetch products' }, { status: 500 });
  }
}