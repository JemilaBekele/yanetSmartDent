import ProCategory from '@/app/(models)/inventory/Category';
import { LocationItemStock } from '@/app/(models)/inventory/locationstock';
import { PersonalStock } from '@/app/(models)/inventory/personal';
import Product from '@/app/(models)/inventory/Product';
import ProductBatch from '@/app/(models)/inventory/ProductBatch';
import ProductUnit from '@/app/(models)/inventory/productunit';
import Stock from '@/app/(models)/inventory/Stock';
import StockLedger from '@/app/(models)/inventory/StockLedger';
import SubCategory from '@/app/(models)/inventory/SubCategory';
import UnitOfMeasure from '@/app/(models)/inventory/UnitOfMeasure';
import mongoose, { Types } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import Location from '@/app/(models)/inventory/location';
import { authorizedMiddleware } from '@/app/helpers/authentication';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
      await authorizedMiddleware(req);
  
  try {
    const { id } = params;
    await ProCategory.aggregate([{ $sample: { size: 1 } }]);
    await SubCategory.aggregate([{ $sample: { size: 1 } }]);

    // ✅ Fetch product (basic info)
    const product = await Product.findById(id)
      .populate('categoryId')
      .populate('subCategoryId')
      .lean();

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }
        await Location.aggregate([{ $sample: { size: 1 } }]);
    await UnitOfMeasure.aggregate([{ $sample: { size: 1 } }]);

    // ✅ Fetch product units with unit of measure
    const productUnits = await ProductUnit.find({ productId: id })
      .populate('unitOfMeasureId')
      .lean();

    // ✅ Fetch batches
    const batches = await ProductBatch.find({ productId: id }).lean();

const batchIds = batches.map(batch => new mongoose.Types.ObjectId(batch._id as Types.ObjectId));

    // ✅ Main stock
    const allStock = await Stock.find({ batchId: { $in: batchIds } })
      .populate('batchId')
      .populate('userId')
      .lean();

    // ✅ Personal stock
    const allPersonalStock = await PersonalStock.find({ batchId: { $in: batchIds }, status: 'ACTIVE' })
      .populate('batchId')
      .populate('userId')
      .lean();

    // ✅ Location stock
    const allLocationStock = await LocationItemStock.find({ batchId: { $in: batchIds }, status: 'ACTIVE' })
      .populate('batchId')
      .populate('locationId')
      .lean();

    // ✅ Ledger
    const stockLedgerEntries = await StockLedger.find({ productId: id })
      .populate('batchId')
      .populate({
        path: 'productUnitId',
        populate: { path: 'unitOfMeasureId', model: 'UnitOfMeasure' } // deep populate
      })
      .populate('userId')
      .sort({ movementDate: -1 })
      .lean();

    // ✅ Totals
    const stockCount = allStock.reduce((sum, item) => sum + item.quantity, 0);
    const personalStockCount = allPersonalStock.reduce((sum, item) => sum + item.quantity, 0);
    const locationStockCount = allLocationStock.reduce((sum, item) => sum + item.quantity, 0);
    const totalStock = stockCount + personalStockCount + locationStockCount;

    // ✅ Final response
    const productWithStock = {
      ...product,
      productUnits, // <<--- now included
      batches,
      stockData: {
        mainStock: allStock,
        personalStock: allPersonalStock,
        locationStock: allLocationStock,
        ledger: stockLedgerEntries,
        totals: {
          stockCount,
          personalStockCount,
          locationStockCount,
          totalStock
        }
      }
    };

    return NextResponse.json(productWithStock, { status: 200 });
  } catch (error) {
    console.error('Error while fetching product:', error);
    return NextResponse.json({ message: 'Failed to fetch product' }, { status: 500 });
  }
}
