import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import StockLedger from '@/app/(models)/inventory/StockLedger';
import { InventoryWithdrawalRequest, WithdrawalStatus } from '@/app/(models)/inventory/InventoryWithdrawalRequest ';
import ProductUnit from '@/app/(models)/inventory/productunit';
import { HolderStatus, PersonalStock } from '@/app/(models)/inventory/personal';

// ======================= CONTROLLER =======================
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ✅ Auth check
    await authorizedMiddleware(req);
    const user = (req as any).user;
    const { id } = params;
    const body = await req.json();
    let { status, notes } = body;

    console.log('Incoming body:', body);

    // ✅ Normalize status
    const normalizedStatus = status?.toUpperCase();
    console.log('Normalized status:', normalizedStatus);

    // ✅ Validate status
    if (!Object.values(WithdrawalStatus).includes(normalizedStatus)) {
      console.error('❌ Invalid status received:', normalizedStatus);
      return NextResponse.json({
        message: 'Invalid withdrawal status',
        validStatuses: Object.values(WithdrawalStatus)
      }, { status: 400 });
    }

    // ✅ Find withdrawal request
    const withdrawalRequest = await InventoryWithdrawalRequest.findById(id);
    if (!withdrawalRequest) {
      return NextResponse.json({ message: 'Withdrawal request not found' }, { status: 404 });
    }

    // ✅ Update withdrawal request
    withdrawalRequest.status = normalizedStatus;
    withdrawalRequest.updatedById = user.id;
    
    // Set timestamps based on status
    if (normalizedStatus === WithdrawalStatus.APPROVED) {
      withdrawalRequest.approvedAt = new Date();
    } else if (normalizedStatus === WithdrawalStatus.ISSUED) {
      withdrawalRequest.issuedAt = new Date();
    }
    
    // ✅ If Approved → Only update status, no stock movement
    if (normalizedStatus === WithdrawalStatus.APPROVED) {
      // Just update the status, no stock movements
      console.log('Withdrawal request approved - status updated only');
      await withdrawalRequest.save();
    }

    // ✅ If Issued → Create OUT movement from personal stock (items are consumed/used)
    if (normalizedStatus === WithdrawalStatus.ISSUED) {
      for (const item of withdrawalRequest.items) {
        // --- Get product unit to handle conversion
        const unit = await ProductUnit.findById(item.productUnitId);
        if (!unit) throw new Error(`ProductUnit not found for item ${item._id}`);

        // --- Convert requested qty → base qty
        const baseQty = item.requestedQuantity * (unit.conversionToBase || 1);

        // --- Find personal stock entry
        let personalStock = await PersonalStock.findOne({
          batchId: item.batchId,
          userId: withdrawalRequest.userId,
          status: { $in: [HolderStatus.ACTIVE, HolderStatus.FINISHED] }
        });

        if (!personalStock) {
          throw new Error(`Personal stock not found for batch ${item.batchId} and user ${withdrawalRequest.userId}`);
        }

        // --- Verify sufficient quantity in personal stock
        if (personalStock.quantity < baseQty) {
          throw new Error(`Insufficient quantity in personal stock for batch ${item.batchId}`);
        }

        // --- Update personal stock (reduce quantity)
        personalStock.quantity -= baseQty;
        personalStock.lastUpdated = new Date();
        
        // If quantity becomes zero, mark as FINISHED
        if (personalStock.quantity === 0) {
          personalStock.status = HolderStatus.FINISHED;
        }
        
        await personalStock.save();

        // --- PERSONAL STOCK LEDGER: Record OUT movement from personal stock (consumption)
        await StockLedger.create({
          productId: item.productId,
          batchId: item.batchId,
          movementType: 'OUT', // OUT for consumption/usage from personal stock
          stockType: 'PERSONAL', // Moving out of personal stock
          quantity: -baseQty, // Negative for outgoing from personal
          productUnitId: unit._id,
          reference: withdrawalRequest._id.toString(),
          userId: withdrawalRequest.userId,
          notes: notes || `Items consumed/used from personal stock`,
        });

        // --- Update the withdrawal item with personal stock reference
        item.personalStockId = personalStock._id;
      }

      // Save the updated items with personal stock references
      await withdrawalRequest.save();
    }

    // ✅ For other statuses (REJECTED, PENDING) → Just update status, no stock movements
    if ([WithdrawalStatus.REJECTED, WithdrawalStatus.PENDING].includes(normalizedStatus)) {
      console.log(`Status updated to ${normalizedStatus} - no stock movements`);
      await withdrawalRequest.save();
    }

    return NextResponse.json({ 
      message: `Withdrawal request ${normalizedStatus} successfully`,
      data: withdrawalRequest 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error updating withdrawal request status:', error);
    return NextResponse.json({ 
      message: error.message || 'Failed to update withdrawal request status' 
    }, { status: 500 });
  }
}