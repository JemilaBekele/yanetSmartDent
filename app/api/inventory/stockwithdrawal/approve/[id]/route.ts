import { NextRequest, NextResponse } from 'next/server';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Stock from '@/app/(models)/inventory/Stock';
import StockLedger from '@/app/(models)/inventory/StockLedger';
import { StockWithdrawalRequest, StockWithdrawalStatus } from '@/app/(models)/inventory/StockWithdrawal';
import ProductUnit from '@/app/(models)/inventory/productunit';
import { LocationItemStock } from '@/app/(models)/inventory/locationstock';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await authorizedMiddleware(req);
    const user = (req as any).user;
    const { id } = params;
    const body = await req.json();
    const { status } = body;


    // ✅ Validate status
    if (!Object.values(StockWithdrawalStatus).includes(status)) {
      return NextResponse.json({
        message: 'Invalid withdrawal status',
        validStatuses: Object.values(StockWithdrawalStatus),
      }, { status: 400 });
    }

    // ✅ Find withdrawal request
    const withdrawalRequest = await StockWithdrawalRequest.findById(id)
      .populate('items.productId')
      .populate('items.batchId')
      .populate('items.productUnitId')
      .populate('items.toLocationId');

    if (!withdrawalRequest) {
      return NextResponse.json({ message: 'Withdrawal request not found' }, { status: 404 });
    }

    // ✅ Check if already in final state
    if ([StockWithdrawalStatus.ISSUED, StockWithdrawalStatus.REJECTED].includes(withdrawalRequest.status)) {
      return NextResponse.json({ 
        message: `Withdrawal request is already ${withdrawalRequest.status} and cannot be modified` 
      }, { status: 400 });
    }

    // ✅ Update withdrawal request status
    withdrawalRequest.status = status;
    withdrawalRequest.updatedAt = new Date();

    // ✅ Set timestamps based on status
    if (status === StockWithdrawalStatus.ISSUED) {
      withdrawalRequest.issuedAt = new Date();
    } else if (status === StockWithdrawalStatus.REJECTED) {
      withdrawalRequest.approvedAt = new Date();
    }

    // ✅ If ISSUED → process stock movement from main storage to target location
    if (status === StockWithdrawalStatus.ISSUED) {
      for (const item of withdrawalRequest.items) {
        // --- Get product unit to handle conversion
        const unit = await ProductUnit.findById(item.productUnitId._id || item.productUnitId);
        if (!unit) {
          throw new Error(`ProductUnit not found for item ${item._id}`);
        }

        // --- Convert requested quantity to base units
        const baseQuantity = item.requestedQuantity * (unit.conversionToBase || 1);

        // --- Check if sufficient stock exists in main storage
        const mainStock = await Stock.findOne({ 
          batchId: item.batchId._id || item.batchId 
        });

        if (!mainStock) {
          throw new Error(`No stock found for batch ${item.batchId.batchNumber}`);
        }

        if (mainStock.quantity < baseQuantity) {
          throw new Error(`Insufficient stock for batch ${item.batchId.batchNumber}. Available: ${mainStock.quantity}, Requested: ${baseQuantity}`);
        }

        // --- Deduct from main stock (OUT movement)
        mainStock.quantity -= baseQuantity;
        mainStock.lastUpdated = new Date();
        await mainStock.save();

        // --- Stock Ledger entry for OUT movement from main storage
        await StockLedger.create({
          productId: item.productId._id || item.productId,
          batchId: item.batchId._id || item.batchId,
          movementType: 'OUT',
          stockType: 'MAIN',
          quantity: baseQuantity,
          productUnitId: unit._id,
          originalQuantity: item.requestedQuantity,
          originalUnitId: unit._id,
          reference: `WD-${withdrawalRequest._id}`,
          userId: user.id,
          notes: `Stock withdrawal to ${item.toLocationId.name}`,
        });

        // --- Check if stock already exists in target location
        let locationStock = await LocationItemStock.findOne({
          batchId: item.batchId._id || item.batchId,
          locationId: item.toLocationId._id || item.toLocationId
        });

        if (locationStock) {
          // Update existing location stock
          locationStock.quantity += baseQuantity;
          locationStock.lastUpdated = new Date();
          await locationStock.save();
        } else {
          // Create new location stock
          locationStock = await LocationItemStock.create({
            batchId: item.batchId._id || item.batchId,
            locationId: item.toLocationId._id || item.toLocationId,
            quantity: baseQuantity,
            status: 'ACTIVE',
            lastUpdated: new Date(),
            notes: `Transferred from main storage`
          });
        }

        // --- Stock Ledger entry for IN movement to location storage
        await StockLedger.create({
          productId: item.productId._id || item.productId,
          batchId: item.batchId._id || item.batchId,
          movementType: 'IN',
          stockType: 'Location',
          quantity: baseQuantity,
          productUnitId: unit._id,
          originalQuantity: item.requestedQuantity,
          originalUnitId: unit._id,
          reference: `WD-${withdrawalRequest._id}`,
          userId: user.id,
          notes: `Stock transferred to ${item.toLocationId.name}`,
        });
      }
    }

    // ✅ Save the updated withdrawal request
    await withdrawalRequest.save();

    return NextResponse.json({ 
      message: `Withdrawal request ${status} successfully`,
      withdrawalRequest 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating withdrawal status:', error);
    return NextResponse.json({ 
      message: 'Failed to update withdrawal status',
      error: error.message 
    }, { status: 500 });
  }
}