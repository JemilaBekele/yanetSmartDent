// app/api/purchase/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import { Purchase, PurchaseItem } from '@/app/(models)/inventory/Purchase';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Supplier from '@/app/(models)/inventory/Supplier';

connect(); // ensure MongoDB connection

// POST - create a new Purchase
export async function POST(req: NextRequest) {
  try {
    await authorizedMiddleware(req);

    const requestBody = await req.json();
    const { invoiceNo, supplierId, items, notes, purchaseDate } = requestBody;

    if (!invoiceNo || !supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'InvoiceNo, supplierId, and at least one item are required' }, { status: 400 });
    }

    // Check for unique invoiceNo
    const existingPurchase = await Purchase.findOne({ invoiceNo });
    if (existingPurchase) {
      return NextResponse.json({ message: 'Invoice number already exists' }, { status: 400 });
    }

    const user = (req as any).user;

    // Create purchase
    const purchase = new Purchase({
      invoiceNo,
      supplierId,
      notes,
      purchaseDate,
      createdById: user.id,
    });

    await purchase.save();

    // Create Purchase Items
    let totalQuantity = 0;
    let totalProducts = items.length;
    let Total = 0;

    for (const item of items) {
      const { productId, batchId, productUnitId, quantity, unitPrice } = item;
      const totalPrice = quantity * unitPrice;
      Total += totalPrice;
      totalQuantity += quantity;

      const purchaseItem = new PurchaseItem({
        purchaseId: purchase._id,
        productId,
        batchId,
        productUnitId,
        quantity,
        unitPrice,
        totalPrice,
      });

      await purchaseItem.save();
    }

    // Update totals in purchase
    purchase.totalProducts = totalProducts;
    purchase.totalQuantity = totalQuantity;
    purchase.Total = Total;

    await purchase.save();

    return NextResponse.json({ message: 'Purchase created successfully', purchase }, { status: 201 });
  } catch (error) {
    console.error('Error creating purchase:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// GET - fetch all purchases with items
export async function GET(req: NextRequest) {
      await authorizedMiddleware(req);
  
  try {
                    await Supplier.aggregate([{ $sample: { size: 1 } }]);

    const purchases = await Purchase.find()
      .populate('items')
      .populate('supplierId')
      .sort({ purchaseDate: -1 }); // or createdAt: -1
 // Add this line to populate supplier

    return NextResponse.json(purchases, { status: 200 });
  } catch (error) {
    console.error('Error fetching purchases:', error);
    return NextResponse.json({ message: 'Failed to fetch purchases' }, { status: 500 });
  }
}