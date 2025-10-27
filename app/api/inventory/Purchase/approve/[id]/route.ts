import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { ApprovalStatus, Purchase, PurchaseItem } from '@/app/(models)/inventory/Purchase';
import Stock from '@/app/(models)/inventory/Stock';
import StockLedger from '@/app/(models)/inventory/StockLedger';
import ProductUnit from '@/app/(models)/inventory/productunit';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ✅ Auth check
    await authorizedMiddleware(req);
    const user = (req as any).user;
    const { id } = params;
    const body = await req.json();
    let { approvalStatus, notes } = body;


    // ✅ Normalize status
    const status = approvalStatus?.toUpperCase();

    // ✅ Validate status
    if (!Object.values(ApprovalStatus).includes(status)) {
      console.error('❌ Invalid status received:', status);
      return NextResponse.json({
        message: 'Invalid approval status',
        validStatuses: Object.values(ApprovalStatus),
      }, { status: 400 });
    }

    // ✅ Find purchase
    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return NextResponse.json({ message: 'Purchase not found' }, { status: 404 });
    }

    // ✅ Update purchase
    purchase.approvalStatus = status;
    purchase.updatedById = user.id;
    await purchase.save();

    // ✅ If Approved → update or create stock & ledger
    if (status === ApprovalStatus.APPROVED) {
      const items = await PurchaseItem.find({ purchaseId: purchase._id });

      for (const item of items) {
        // --- Get product unit to handle conversion
        const unit = await ProductUnit.findById(item.productUnitId);
        if (!unit) throw new Error(`ProductUnit not found for item ${item._id}`);

        // --- Convert purchased qty → base qty
        const baseQty = item.quantity * (unit.conversionToBase || 1);

        // --- Check if stock exists for batchId
        let stock = await Stock.findOne({ batchId: item.batchId });

        if (stock) {
          // Update existing stock
          stock.quantity += baseQty; // Add to existing base quantity
          stock.originalQuantity += item.quantity; // Add to original quantity
          stock.status = 'Available'; // Ensure status is Available
          stock.userId = user.id; // Update userId
          stock.lastUpdated = new Date(); // Update lastUpdated
          await stock.save();
        } else {
          // Create new stock
          stock = await Stock.create({
            batchId: item.batchId,
            userId: user.id,
            quantity: baseQty, // Store in base
            originalQuantity: item.quantity,
            status: 'Available',
          });
        }

        // --- Stock Ledger (record both)
        await StockLedger.create({
          productId: item.productId,
          batchId: item.batchId,
          movementType: 'IN',
          stockType: 'MAIN',
          quantity: baseQty, // Base unit qty
          productUnitId: unit._id, // Use ProductUnit _id
          originalQuantity: item.quantity,
          originalUnitId: unit._id, // Same as productUnitId for consistency
          reference: purchase.invoiceNo,
          userId: user.id,
          notes: notes || 'Purchase approval stock-in',
        });
      }
    }

    return NextResponse.json({ message: `Purchase ${status} successfully` }, { status: 200 });
  } catch (error) {
    console.error('Error updating purchase status:', error);
    return NextResponse.json({ message: 'Failed to update purchase status' }, { status: 500 });
  }
}