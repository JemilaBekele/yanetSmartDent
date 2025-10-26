// app/api/inventory-withdrawal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { InventoryWithdrawalRequest, WithdrawalStatus } from '@/app/(models)/inventory/InventoryWithdrawalRequest ';
import Product from '@/app/(models)/inventory/Product';
import ProductBatch from '@/app/(models)/inventory/ProductBatch';
import ProductUnit from '@/app/(models)/inventory/productunit';
import UnitOfMeasure from '@/app/(models)/inventory/UnitOfMeasure';
import { PersonalStock } from '@/app/(models)/inventory/personal';

connect(); // ensure MongoDB connection

// ======================= POST - Create Withdrawal Request ======================= //
export async function POST(req: NextRequest) {
  try {
    // Authorize the request to get the logged-in user
    await authorizedMiddleware(req);

    const body = await req.json();
    const { items, notes } = body;

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: 'At least one withdrawal item is required' },
        { status: 400 }
      );
    }

    // Get user from authentication
    const user = (req as any).user;
    if (!user || !user.id) {
      return NextResponse.json({ message: 'Unauthorized user' }, { status: 401 });
    }

    // Build withdrawal request
    const withdrawalDoc = new InventoryWithdrawalRequest({
      userId: user.id,
      items: items.map((item: any) => ({
        productId: item.productId,
        batchId: item.batchId,
        productUnitId: item.productUnitId,
        requestedQuantity: item.requestedQuantity,
      })),
      notes,
      status: WithdrawalStatus.PENDING,
      requestedAt: new Date(),
    });

    await withdrawalDoc.save();

    return NextResponse.json(
      { message: 'Withdrawal request created successfully', withdrawal: withdrawalDoc },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating withdrawal request:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ======================= GET - Fetch All Withdrawal Requests ======================= //
export async function GET(req: NextRequest)  {
                  await authorizedMiddleware(req);
  await Product.aggregate([{ $sample: { size: 1 } }]);
            await ProductBatch.aggregate([{ $sample: { size: 1 } }]);

            await ProductUnit.aggregate([{ $sample: { size: 1 } }]);
            await UnitOfMeasure.aggregate([{ $sample: { size: 1 } }]);
            await PersonalStock.aggregate([{ $sample: { size: 1 } }]);
  try {
    const withdrawals = await InventoryWithdrawalRequest.find()
      .populate({
        path: 'userId',
        select: 'username  role', // show limited user info
      })
      .populate({
        path: 'items.productId',
        select: 'name code',
      })
      .populate({
        path: 'items.batchId',
        select: 'batchNumber expiryDate',
      })
      .populate({
        path: 'items.productUnitId',
        select: 'name conversionToBase',
        populate: {
          path: 'unitOfMeasureId',
          select: 'name symbol',
        },
      })
      .populate({
        path: 'items.personalStockId',
        select: 'quantity status lastUpdated',
      })
      .sort({ created_at: -1 });

    return NextResponse.json(withdrawals, { status: 200 });
  } catch (error) {
    console.error('Error fetching withdrawal requests:', error);
    return NextResponse.json({ message: 'Failed to fetch withdrawal requests' }, { status: 500 });
  }
}
