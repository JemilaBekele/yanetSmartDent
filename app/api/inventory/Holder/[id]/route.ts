import {  NextResponse,NextRequest } from 'next/server';
import { StockHolding } from '@/app/(models)/inventory/StockHolding';
import { InventoryRequestItem } from '@/app/(models)/inventory/request';
import ProductBatch from '@/app/(models)/inventory/ProductBatch';
import Product from '@/app/(models)/inventory/Product';
import ProductUnit from '@/app/(models)/inventory/productunit';
import UnitOfMeasure from '@/app/(models)/inventory/UnitOfMeasure';
import { authorizedMiddleware } from '@/app/helpers/authentication';

// GET - fetch all stock holdings with selective populated references
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  
  try {
          await authorizedMiddleware(req);

    const { id } = params;
            await InventoryRequestItem.aggregate([{ $sample: { size: 1 } }]);

            await ProductBatch.aggregate([{ $sample: { size: 1 } }]);
            await Product.aggregate([{ $sample: { size: 1 } }]);
            await ProductUnit.aggregate([{ $sample: { size: 1 } }]);
            await UnitOfMeasure.aggregate([{ $sample: { size: 1 } }]);

            const stockHolding = await StockHolding.findById(id)
      .populate({
        path: 'requestId',
        select: 'requestNo requestDate approvalStatus'
      })
      .populate({
        path: 'holderId',
        select: 'username email'
      })
      .populate({
        path: 'issuedById',
        select: 'username email'
      })
      .populate({
        path: 'items.requestItemId',
        select: 'requestedQuantity approvedQuantity'
      })
      .populate({
        path: 'items.batchId',
        select: 'batchNumber expiryDate manufacturingDate'
      })
      .populate({
        path: 'items.productId',
        select: 'name code description category'
      })
      .populate({
        path: 'items.productUnitId',
        select: 'conversionToBase',
        populate: {
          path: 'unitOfMeasureId',
          model: 'UnitOfMeasure',
          select: 'name symbol'
        }
      });

    if (!stockHolding) {
      return NextResponse.json(
        { message: 'Stock holding not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(stockHolding, { status: 200 });
  } catch (error) {
    console.error('Error while fetching stock holding:', error);
    return NextResponse.json({ 
      message: 'Failed to fetch stock holding',
      error: error.message 
    }, { status: 500 });
  }
}
