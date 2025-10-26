import { NextRequest, NextResponse } from 'next/server';
import { authorizedMiddleware } from '@/app/helpers/authentication';
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

    // ✅ Find withdrawal request with fromLocationId populated
    const withdrawalRequest = await StockWithdrawalRequest.findById(id)
      .populate('items.productId')
      .populate('items.batchId')
      .populate('items.productUnitId')
      .populate('items.fromLocationId')
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

    // ✅ If ISSUED → process stock movement from location to location
    if (status === StockWithdrawalStatus.ISSUED) {
      for (const item of withdrawalRequest.items) {
        // --- Get product unit to handle conversion
        const unit = await ProductUnit.findById(item.productUnitId._id || item.productUnitId);
        if (!unit) {
          throw new Error(`ProductUnit not found for item ${item._id}`);
        }

        // --- Convert requested quantity to base units
        const baseQuantity = item.requestedQuantity * (unit.conversionToBase || 1);

        // --- Check if sufficient stock exists in FROM location
        const fromLocationStock = await LocationItemStock.findOne({
          batchId: item.batchId._id || item.batchId,
          locationId: item.fromLocationId._id || item.fromLocationId
        });

        if (!fromLocationStock) {
          throw new Error(`No stock found for batch ${item.batchId.batchNumber} in location ${item.fromLocationId.name}`);
        }

        if (fromLocationStock.quantity < baseQuantity) {
          throw new Error(`Insufficient stock for batch ${item.batchId.batchNumber} in location ${item.fromLocationId.name}. Available: ${fromLocationStock.quantity}, Requested: ${baseQuantity}`);
        }

        // --- Deduct from FROM location stock (OUT movement)
        fromLocationStock.quantity -= baseQuantity;
        fromLocationStock.lastUpdated = new Date();
        await fromLocationStock.save();

        // --- Stock Ledger entry for OUT movement from FROM location
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
          notes: `Stock transfer from ${item.fromLocationId.name} to ${item.toLocationId.name}`,
          locationId: item.fromLocationId._id || item.fromLocationId
        });

        // --- Check if stock already exists in TO location
        let toLocationStock = await LocationItemStock.findOne({
          batchId: item.batchId._id || item.batchId,
          locationId: item.toLocationId._id || item.toLocationId
        });

        if (toLocationStock) {
          // Update existing location stock - ALWAYS set status to ACTIVE
          toLocationStock.quantity += baseQuantity;
          toLocationStock.status = 'ACTIVE'; // ✅ Ensure status is ACTIVE
          toLocationStock.lastUpdated = new Date();
          await toLocationStock.save();
        } else {
          // Create new location stock
          toLocationStock = await LocationItemStock.create({
            batchId: item.batchId._id || item.batchId,
            locationId: item.toLocationId._id || item.toLocationId,
            quantity: baseQuantity,
            status: 'ACTIVE',
            lastUpdated: new Date(),
            notes: `Transferred from ${item.fromLocationId.name}`
          });
        }

        // --- Stock Ledger entry for IN movement to TO location
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
          notes: `Stock received from ${item.fromLocationId.name}`,
          locationId: item.toLocationId._id || item.toLocationId
        });

        // --- If FROM location stock becomes zero, update its status
        if (fromLocationStock.quantity === 0) {
          fromLocationStock.status = 'FINISHED';
          await fromLocationStock.save();
        }
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