import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import UnitOfMeasure from '@/app/(models)/inventory/UnitOfMeasure';
import { authorizedMiddleware } from '@/app/helpers/authentication';

connect();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
        await authorizedMiddleware(req);

  try {
    const { name, symbol } = await req.json();
    const { id } = params;

    if (!id || !name) {
      return NextResponse.json({ message: 'Unit ID and name are required' }, { status: 400 });
    }

    // Check if another unit already has this name
    const duplicateUnit = await UnitOfMeasure.findOne({ 
      name, 
      _id: { $ne: id } 
    });
    if (duplicateUnit) {
      return NextResponse.json({ message: 'Another unit with this name already exists' }, { status: 400 });
    }

    const updatedUnit = await UnitOfMeasure.findByIdAndUpdate(
      id, 
      { name, symbol }, 
      { new: true, runValidators: true }
    );

    if (!updatedUnit) {
      return NextResponse.json({ message: 'Unit of measure not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Unit of measure updated successfully', 
      unit: updatedUnit 
    }, { status: 200 });
  } catch (error) {
    console.error('Error while updating unit of measure:', error);
    return NextResponse.json({ message: 'Failed to update unit of measure' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'Unit ID is required' }, { status: 400 });
    }

    const deletedUnit = await UnitOfMeasure.findByIdAndDelete(id);

    if (!deletedUnit) {
      return NextResponse.json({ message: 'Unit of measure not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      message: 'Unit of measure deleted successfully', 
      unit: deletedUnit 
    }, { status: 200 });
  } catch (error) {
    console.error('Error while deleting unit of measure:', error);
    return NextResponse.json({ message: 'Failed to delete unit of measure' }, { status: 500 });
  }
}