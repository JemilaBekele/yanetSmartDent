// app/api/inventory-request/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { InventoryRequest, InventoryRequestItem } from '@/app/(models)/inventory/request';

connect(); // ensure MongoDB connection

// ======================= POST - Create Inventory Request ======================= //
export async function POST(req: NextRequest) {
          await authorizedMiddleware(req);

  try {
    // Authorize the request to get the logged-in user
    await authorizedMiddleware(req);
    
    const body = await req.json();
    const { items, notes, requestDate } = body;

    // Remove requestNo validation and get requestedById from authentication
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Get user from authentication
    const user = (req as any).user;
    if (!user || !user.id) {
      return NextResponse.json({ message: 'Unauthorized user' }, { status: 401 });
    }

    // Generate a unique request number (optional - if you still want some identifier)
    const requestNo = `REQ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create Inventory Request with authenticated user as requestedBy
    const requestDoc = new InventoryRequest({
      requestNo, // Auto-generated if needed, or remove this field entirely
      requestedById: user.id, // Use authenticated user's ID
      notes,
      requestDate,
      createdById: user.id,
    });
    await requestDoc.save();

    // Create Request Items
    let totalRequestedQuantity = 0;
    const totalProducts = items.length;

    for (const item of items) {
      const { productId, batchId, productUnitId, requestedQuantity } = item;
      totalRequestedQuantity += requestedQuantity;

      const reqItem = new InventoryRequestItem({
        requestId: requestDoc._id,
        productId,
        batchId,
        productUnitId,
        requestedQuantity,
      });
      await reqItem.save();
    }

    // Update totals
    requestDoc.totalProducts = totalProducts;
    requestDoc.totalRequestedQuantity = totalRequestedQuantity;
    await requestDoc.save();

    return NextResponse.json(
      { message: 'Inventory request created successfully', request: requestDoc },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating inventory request:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ======================= GET - Fetch All Inventory Requests ======================= //
export async function GET(req: NextRequest) {
        await authorizedMiddleware(req);
  
  try {
    
    const requests = await InventoryRequest.find()
      .populate('items')
      .populate('requestedById')
      .populate('approvedById')
.sort({ requestDate: -1 })


    return NextResponse.json(requests, { status: 200 });
  } catch (error) {
    console.error('Error fetching inventory requests:', error);
    return NextResponse.json({ message: 'Failed to fetch requests' }, { status: 500 });
  }
}
