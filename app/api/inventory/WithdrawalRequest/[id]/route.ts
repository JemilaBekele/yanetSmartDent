// app/api/inventory-withdrawal/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { InventoryWithdrawalRequest } from '@/app/(models)/inventory/InventoryWithdrawalRequest ';

connect();

// ======================= GET by ID ======================= //
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
                    await authorizedMiddleware(req);

  try {
    const { id } = params;

    const withdrawalDoc = await InventoryWithdrawalRequest.findById(id)
      .populate('userId') // populate user info
      .populate({
        path: 'items.productId', // populate product details
        model: 'Product',
        select: '_id name code', // select only the fields we want
      })
      .populate({
        path: 'items.batchId',
        model: 'ProductBatch',
      })
      .populate({
        path: 'items.productUnitId',
        model: 'ProductUnit',
        populate: {
          path: 'unitOfMeasureId',
          model: 'UnitOfMeasure',
        },
      })
      .populate({
        path: 'items.personalStockId',
        model: 'PersonalStock',
      })
      .lean();

    if (!withdrawalDoc) {
      return NextResponse.json({ message: 'Withdrawal request not found' }, { status: 404 });
    }

    return NextResponse.json(withdrawalDoc, { status: 200 });
  } catch (error) {
    console.error('Error fetching withdrawal request by ID:', error);
    return NextResponse.json({ message: 'Failed to fetch withdrawal request' }, { status: 500 });
  }
}


// ======================= PATCH (Update) ======================= //
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authorizedMiddleware(req);
    const { id } = params;
    const { notes, status, approvedAt, issuedAt, items } = await req.json();
    const user = (req as any).user;

    // Find the withdrawal request first
    const withdrawal = await InventoryWithdrawalRequest.findById(id);
    if (!withdrawal) {
      return NextResponse.json({ message: 'Withdrawal request not found' }, { status: 404 });
    }

    // Update main fields
    if (notes !== undefined) withdrawal.notes = notes;
    if (status !== undefined) withdrawal.status = status;
    if (approvedAt !== undefined) withdrawal.approvedAt = approvedAt;
    if (issuedAt !== undefined) withdrawal.issuedAt = issuedAt;
    withdrawal.updatedById = user.id;

    // Replace items if provided
    if (Array.isArray(items)) {
      withdrawal.items = items.map((item: any) => ({
        productId: item.productId,
        batchId: item.batchId,
        productUnitId: item.productUnitId,
        requestedQuantity: item.requestedQuantity,
        personalStockId: item.personalStockId,
      }));
    }

    // Save the updated document
    const updatedWithdrawal = await withdrawal.save();

    return NextResponse.json(
      { message: 'Withdrawal request updated successfully', withdrawal: updatedWithdrawal },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating withdrawal request:', error);
    return NextResponse.json({ message: 'Failed to update withdrawal request' }, { status: 500 });
  }
}


// ======================= DELETE ======================= //
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await authorizedMiddleware(req);

    const { id } = params;
    const user = (req as any).user;

    const deletedWithdrawal = await InventoryWithdrawalRequest.findByIdAndDelete(id);
    if (!deletedWithdrawal) {
      return NextResponse.json({ message: 'Withdrawal request not found' }, { status: 404 });
    }

    console.log(`WithdrawalRequest ${id} deleted by user ${user.username} (${user.id})`);

    return NextResponse.json(
      { message: 'Withdrawal request deleted successfully', withdrawal: deletedWithdrawal },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting withdrawal request:', error);
    return NextResponse.json({ message: 'Failed to delete withdrawal request' }, { status: 500 });
  }
}
