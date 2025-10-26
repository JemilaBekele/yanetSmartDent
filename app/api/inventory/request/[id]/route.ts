// app/api/inventory-request/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { InventoryRequest, InventoryRequestItem } from '@/app/(models)/inventory/request';
import ProductBatch from '@/app/(models)/inventory/ProductBatch';
import Product from '@/app/(models)/inventory/Product';
import ProductUnit from '@/app/(models)/inventory/productunit';
import UnitOfMeasure from '@/app/(models)/inventory/UnitOfMeasure';

connect();

// ======================= GET by ID ======================= //
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
          await authorizedMiddleware(req);
 await Product.aggregate([{ $sample: { size: 1 } }]);
            await ProductBatch.aggregate([{ $sample: { size: 1 } }]);

            await ProductUnit.aggregate([{ $sample: { size: 1 } }]);
            await UnitOfMeasure.aggregate([{ $sample: { size: 1 } }]);
  try {
    const { id } = params;
  await ProductBatch.aggregate([{ $sample: { size: 1 } }]);
            await Product.aggregate([{ $sample: { size: 1 } }]);
            await ProductUnit.aggregate([{ $sample: { size: 1 } }]);
            await UnitOfMeasure.aggregate([{ $sample: { size: 1 } }]);

    const requestDoc = await InventoryRequest.findById(id)
      .populate('requestedById')
      .populate('approvedById')
      .populate({
        path: 'items',
        model: 'InventoryRequestItem',
        populate: [
          { path: 'productId', model: 'Product' },
          { path: 'batchId', model: 'ProductBatch' },
          {
            path: 'productUnitId',
            model: 'ProductUnit',
            populate: {
              path: 'unitOfMeasureId', // deeper populate like purchase
              model: 'UnitOfMeasure',
            },
          },
        ],
      })
      .lean();

    if (!requestDoc) {
      return NextResponse.json({ message: 'Inventory request not found' }, { status: 404 });
    }

    return NextResponse.json(requestDoc, { status: 200 });
  } catch (error) {
    console.error('Error fetching inventory request by ID:', error);
    return NextResponse.json({ message: 'Failed to fetch request' }, { status: 500 });
  }
}

// ======================= PATCH (Update) ======================= //
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
          await authorizedMiddleware(req);
  
  try {
    await authorizedMiddleware(req);
    const { id } = params;
    const {  notes, requestDate, approvalStatus, items } = await req.json();

    

    const user = (req as any).user;

    // Update main InventoryRequest fields
    const updatedRequest = await InventoryRequest.findByIdAndUpdate(
      id,
      {
        notes,
        requestDate,
        approvalStatus,
        updatedById: user.id,
      },
      { new: true }
    );

    if (!updatedRequest) {
      return NextResponse.json({ message: 'Inventory request not found' }, { status: 404 });
    }

    // Update Items if provided
    if (Array.isArray(items)) {
      // Remove existing items for this request
      await InventoryRequestItem.deleteMany({ requestId: id });

      // Insert new items
      const newItems = items.map((item: any) => ({
        requestId: id,
        productId: item.productId,
        batchId: item.batchId,
        productUnitId: item.productUnitId,
        requestedQuantity: item.requestedQuantity,
        approvedQuantity: item.approvedQuantity || 0,
      }));

      await InventoryRequestItem.insertMany(newItems);

      // Update totals
      const totalProducts = newItems.length;
      const totalRequestedQuantity = newItems.reduce((sum, i) => sum + (i.requestedQuantity || 0), 0);
      const totalApprovedQuantity = newItems.reduce((sum, i) => sum + (i.approvedQuantity || 0), 0);

      updatedRequest.totalProducts = totalProducts;
      updatedRequest.totalRequestedQuantity = totalRequestedQuantity;
      updatedRequest.totalApprovedQuantity = totalApprovedQuantity;
      await updatedRequest.save();
    }

    return NextResponse.json(
      { message: 'Inventory request and items updated successfully', request: updatedRequest },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating inventory request:', error);
    return NextResponse.json({ message: 'Failed to update request' }, { status: 500 });
  }
}

// ======================= DELETE ======================= //
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await authorizedMiddleware(req);

    const { id } = params;
    const user = (req as any).user;

    const deletedRequest = await InventoryRequest.findByIdAndDelete(id);
    if (!deletedRequest) {
      return NextResponse.json({ message: 'Inventory request not found' }, { status: 404 });
    }

    // Delete associated items
    await InventoryRequestItem.deleteMany({ requestId: id });

    console.log(`InventoryRequest ${id} deleted by user ${user.username} (${user.id})`);

    return NextResponse.json({ message: 'Inventory request deleted successfully', request: deletedRequest }, { status: 200 });
  } catch (error) {
    console.error('Error deleting inventory request:', error);
    return NextResponse.json({ message: 'Failed to delete request' }, { status: 500 });
  }
}
