import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Stock from '@/app/(models)/inventory/Stock';
import StockLedger from '@/app/(models)/inventory/StockLedger';
import ProductUnit from '@/app/(models)/inventory/productunit';
import { ApprovalStatus, InventoryRequest, InventoryRequestItem } from '@/app/(models)/inventory/request';
import { HolderStatus, PersonalStock } from '@/app/(models)/inventory/personal';

// ======================= CONTROLLER =======================
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await authorizedMiddleware(req);
    const user = (req as any).user;
    const { id } = params;
    const body = await req.json();
    let { approvalStatus, items, notes } = body;

    const status = approvalStatus?.toUpperCase();
    if (!Object.values(ApprovalStatus).includes(status)) {
      return NextResponse.json({
        message: 'Invalid approval status',
        validStatuses: Object.values(ApprovalStatus),
      }, { status: 400 });
    }

    const request = await InventoryRequest.findById(id);
    if (!request) {
      return NextResponse.json({ message: 'Inventory request not found' }, { status: 404 });
    }

    request.approvalStatus = status;
    request.updatedById = user.id;
    if (status === ApprovalStatus.APPROVED) {
      request.approvedById = user.id;
    }
    await request.save();

    if (Array.isArray(items)) {
      for (const i of items) {
        await InventoryRequestItem.findByIdAndUpdate(i._id, {
          approvedQuantity: i.approvedQuantity || 0,
        });
      }
    }

    if (status === ApprovalStatus.APPROVED) {
      const requestItems = await InventoryRequestItem.find({ requestId: id });

      for (const item of requestItems) {
        if (item.approvedQuantity > 0) {
          const unit = await ProductUnit.findById(item.productUnitId);
          if (!unit) throw new Error(`ProductUnit not found for item ${item._id}`);

          const baseUnitId = unit.baseUnitId || unit._id;
          const baseQty = item.approvedQuantity * (unit.conversionToBase || 1);

          const stock = await Stock.findOne({ batchId: item.batchId });
          if (!stock || stock.quantity < baseQty) {
            throw new Error(`Insufficient stock for product ${item.productId}`);
          }

          // Deduct from main stock
          stock.quantity -= baseQty;
          await stock.save();

          // Ledger: MAIN stock (OUT)
          await StockLedger.create({
            productId: item.productId,
            batchId: item.batchId,
            stockType: 'MAIN',
            movementType: 'OUT',
            quantity: baseQty,
            productUnitId: baseUnitId,
            reference: request.requestNo,
            userId: user.id, // admin/approver
            notes: notes || `Issued to requester (${request.requestedById})`,
          });

          // ====== Update PersonalStock ======
          const existingPersonalStock = await PersonalStock.findOne({
            batchId: item.batchId,
            userId: request.requestedById,
          });

          if (existingPersonalStock) {
            existingPersonalStock.quantity += baseQty;
            existingPersonalStock.lastUpdated = new Date();
            await existingPersonalStock.save();
          } else {
            await PersonalStock.create({
              batchId: item.batchId,
              userId: request.requestedById,
              quantity: baseQty,
              status: HolderStatus.ACTIVE,
              notes: notes || `Issued from request ${request.requestNo}`,
            });
          }

          // Ledger: PERSONAL stock (IN)
          await StockLedger.create({
            productId: item.productId,
            batchId: item.batchId,
            stockType: 'PERSONAL',
            movementType: 'IN',
            quantity: baseQty,
            productUnitId: baseUnitId,
            reference: request.requestNo,
            userId: request.requestedById, // stock belongs to this user
            notes: notes || `Received from main stock (approved by ${user.id})`,
          });
        }
      }
    }

    return NextResponse.json({ message: `Request ${status} successfully` }, { status: 200 });
  } catch (error) {
    console.error('Error updating inventory request:', error);
    return NextResponse.json({ 
      message: 'Failed to update inventory request',
      error: error.message 
    }, { status: 500 });
  }
}
