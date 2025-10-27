// app/api/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import { Purchase, PurchaseItem } from '@/app/(models)/inventory/Purchase';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Supplier from '@/app/(models)/inventory/Supplier';
import ProductBatch from '@/app/(models)/inventory/ProductBatch';
import Product from '@/app/(models)/inventory/Product';
import ProductUnit from '@/app/(models)/inventory/productunit';
import UnitOfMeasure from '@/app/(models)/inventory/UnitOfMeasure';

connect();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
      await authorizedMiddleware(req);
                    await Supplier.aggregate([{ $sample: { size: 1 } }]);
  await ProductBatch.aggregate([{ $sample: { size: 1 } }]);
            await Product.aggregate([{ $sample: { size: 1 } }]);
            await ProductUnit.aggregate([{ $sample: { size: 1 } }]);
            await UnitOfMeasure.aggregate([{ $sample: { size: 1 } }]);

  try {
    const { id } = params;

    const purchase = await Purchase.findById(id)
      .populate('supplierId')
      .populate({
        path: 'items',
        model: 'PurchaseItem',
        populate: [
          { path: 'productId', model: 'Product' },
          { path: 'batchId', model: 'ProductBatch' },
          { 
            path: 'productUnitId',
            model: 'ProductUnit',
            populate: {
              path: 'unitOfMeasureId', // 👈 deeper populate
              model: 'UnitOfMeasure',
            }
          }
        ]
      })
      .lean();

    if (!purchase) {
      return NextResponse.json({ message: 'Purchase not found' }, { status: 404 });
    }

    return NextResponse.json(purchase, { status: 200 });
  } catch (error) {
    console.error('Error fetching purchase by ID:', error);
    return NextResponse.json({ message: 'Failed to fetch purchase' }, { status: 500 });
  }
}




export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await authorizedMiddleware(req);
    const { id } = params;
    const { invoiceNo, supplierId, notes, purchaseDate, approvalStatus, items } = await req.json();

    if (!invoiceNo || !supplierId) {
      return NextResponse.json({ message: 'InvoiceNo and supplierId are required' }, { status: 400 });
    }

    const user = (req as any).user;

    // Update Purchase main fields
    const updatedPurchase = await Purchase.findByIdAndUpdate(
      id,
      {
        invoiceNo,
        supplierId,
        notes,
        purchaseDate,
        approvalStatus,
        updatedById: user.id,
      },
      { new: true }
    );

    if (!updatedPurchase) return NextResponse.json({ message: 'Purchase not found' }, { status: 404 });

    // Update Purchase Items
    if (Array.isArray(items)) {
      // Remove existing items for this purchase
      await PurchaseItem.deleteMany({ purchaseId: id });

      // Insert new items
      const newItems = items.map((item: any) => ({
        purchaseId: id,
        productId: item.productId,
        batchId: item.batchId,
        productUnitId: item.productUnitId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      }));

      await PurchaseItem.insertMany(newItems);

      // Update purchase totals
      const totalProducts = newItems.length;
      const totalQuantity = newItems.reduce((sum, i) => sum + (i.quantity || 0), 0);
      const Total = newItems.reduce((sum, i) => sum + (i.totalPrice || 0), 0);

      updatedPurchase.totalProducts = totalProducts;
      updatedPurchase.totalQuantity = totalQuantity;
      updatedPurchase.Total = Total;
      await updatedPurchase.save();
    }

    return NextResponse.json({ message: 'Purchase and items updated successfully', purchase: updatedPurchase }, { status: 200 });
  } catch (error) {
    console.error('Error updating purchase:', error);
    return NextResponse.json({ message: 'Failed to update purchase' }, { status: 500 });
  }
}


// DELETE - remove purchase by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await authorizedMiddleware(req);

    const { id } = params;
    const user = (req as any).user;

    const deletedPurchase = await Purchase.findByIdAndDelete(id);
    if (!deletedPurchase) return NextResponse.json({ message: 'Purchase not found' }, { status: 404 });

    // Optional: Delete associated items
    await PurchaseItem.deleteMany({ purchaseId: id });


    return NextResponse.json({ message: 'Purchase deleted successfully', purchase: deletedPurchase }, { status: 200 });
  } catch (error) {
    console.error('Error deleting purchase:', error);
    return NextResponse.json({ message: 'Failed to delete purchase' }, { status: 500 });
  }
}
