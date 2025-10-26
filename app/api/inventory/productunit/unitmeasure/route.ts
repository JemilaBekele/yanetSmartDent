import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import UnitOfMeasure from '@/app/(models)/inventory/UnitOfMeasure';
import { authorizedMiddleware } from '@/app/helpers/authentication';

connect();

export async function POST(req: NextRequest) {
          await authorizedMiddleware(req);

  try {
    const { name, symbol } = await req.json();

    if (!name) {
      return NextResponse.json({ message: 'Unit of measure name is required' }, { status: 400 });
    }

    const existingUnit = await UnitOfMeasure.findOne({ name });
    if (existingUnit) {
      return NextResponse.json({ message: 'Unit of measure already exists' }, { status: 400 });
    }

    const newUnit = new UnitOfMeasure({ name, symbol });
    await newUnit.save();

    return NextResponse.json({ 
      message: 'Unit of measure registered successfully', 
      unit: newUnit 
    }, { status: 201 });
  } catch (error) {
    console.error('Error while adding unit of measure:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
        await authorizedMiddleware(req);

  try {
    const units = await UnitOfMeasure.find().sort({ createdAt: -1 });
    return NextResponse.json(units, { status: 200 });
  } catch (error) {
    console.error('Error while fetching units of measure:', error);
    return NextResponse.json({ message: 'Failed to fetch units of measure' }, { status: 500 });
  }
}
