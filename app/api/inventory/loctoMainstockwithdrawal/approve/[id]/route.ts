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
      .populate('items.fromLocationId');

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

    // ✅ If ISSUED → process stock movement from location storage to main storage
    if (status === StockWithdrawalStatus.ISSUED) {
      for (const item of withdrawalRequest.items) {
        // --- Get product unit to handle conversion
        const unit = await ProductUnit.findById(item.productUnitId._id || item.productUnitId);
        if (!unit) {
          throw new Error(`ProductUnit not found for item ${item._id}`);
        }

        // --- Convert requested quantity to base units
        const baseQuantity = item.requestedQuantity * (unit.conversionToBase || 1);

        // --- Check if sufficient stock exists in the FROM location storage
        const locationStock = await LocationItemStock.findOne({ 
          batchId: item.batchId._id || item.batchId,
          locationId: item.fromLocationId._id || item.fromLocationId
        });

        if (!locationStock) {
          throw new Error(`No stock found for batch ${item.batchId.batchNumber} in location ${item.fromLocationId.name}`);
        }

        if (locationStock.quantity < baseQuantity) {
          throw new Error(`Insufficient stock for batch ${item.batchId.batchNumber} in location ${item.fromLocationId.name}. Available: ${locationStock.quantity}, Requested: ${baseQuantity}`);
        }

        // --- Deduct from location stock (OUT movement from location)
        locationStock.quantity -= baseQuantity;
        locationStock.lastUpdated = new Date();
        
        // If location stock becomes zero, update its status
        if (locationStock.quantity === 0) {
          locationStock.status = 'FINISHED';
        }
        
        await locationStock.save();

        // --- Stock Ledger entry for OUT movement from location storage
        await StockLedger.create({
          productId: item.productId._id || item.productId,
          batchId: item.batchId._id || item.batchId,
          movementType: 'OUT',
          stockType: 'Location',
          quantity: baseQuantity,
          productUnitId: unit._id,
          originalQuantity: item.requestedQuantity,
          originalUnitId: unit._id,
          reference: `WD-${withdrawalRequest._id}`,
          userId: user.id,
          notes: `Stock withdrawal from ${item.fromLocationId.name} to main storage`,
        });

        // --- Check if stock already exists in main storage
        let mainStock = await Stock.findOne({
          batchId: item.batchId._id || item.batchId
        });

        if (mainStock) {
          // Update existing main stock - ALWAYS set status to ACTIVE
          mainStock.quantity += baseQuantity;
          mainStock.status = 'ACTIVE'; // ✅ Ensure status is ACTIVE
          mainStock.lastUpdated = new Date();
          await mainStock.save();
        } else {
          // Create new main stock entry
          mainStock = await Stock.create({
            batchId: item.batchId._id || item.batchId,
            quantity: baseQuantity,
            status: 'ACTIVE',
            lastUpdated: new Date(),
            notes: `Transferred from location ${item.fromLocationId.name}`
          });
        }

        // --- Stock Ledger entry for IN movement to main storage
        await StockLedger.create({
          productId: item.productId._id || item.productId,
          batchId: item.batchId._id || item.batchId,
          movementType: 'IN',
          stockType: 'MAIN',
          quantity: baseQuantity,
          productUnitId: unit._id,
          originalQuantity: item.requestedQuantity,
          originalUnitId: unit._id,
          reference: `WD-${withdrawalRequest._id}`,
          userId: user.id,
          notes: `Stock transferred from ${item.fromLocationId.name} to main storage`,
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