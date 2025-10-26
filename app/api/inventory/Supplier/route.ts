import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import Supplier from '@/app/(models)/inventory/Supplier';
import { authorizedMiddleware } from '@/app/helpers/authentication';

connect();

// ================== CREATE SUPPLIER ==================
export async function POST(req: NextRequest) {
                await authorizedMiddleware(req);
  
  try {
    const { name, contactName, phone, email, address, city, country, tinNumber, notes } = await req.json();

    if (!name) {
      return NextResponse.json({ message: 'Supplier name is required' }, { status: 400 });
    }

    // Check if supplier with same name already exists
    const existingSupplier = await Supplier.findOne({ name });
    if (existingSupplier) {
      return NextResponse.json({ message: 'Supplier with this name already exists' }, { status: 400 });
    }

    const newSupplier = new Supplier({
      name,
      contactName,
      phone,
      email,
      address,
      city,
      country,
      tinNumber,
      notes
    });

    await newSupplier.save();

    return NextResponse.json({ message: 'Supplier created successfully', supplier: newSupplier }, { status: 201 });
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// ================== GET ALL SUPPLIERS ==================
export async function GET(req: NextRequest) {
                await authorizedMiddleware(req);
  
  try {
    const suppliers = await Supplier.find().sort({ createdAt: -1 });
    return NextResponse.json(suppliers, { status: 200 });
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json({ message: 'Failed to fetch suppliers' }, { status: 500 });
  }
}
