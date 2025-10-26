import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import Location from '@/app/(models)/inventory/location';
import { authorizedMiddleware } from '@/app/helpers/authentication';

connect();

// ======================= PATCH - Update Location ======================= //
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
                  await authorizedMiddleware(req);
  
  try {
    const { name } = await req.json();
    const { id } = params;

    if (!id || !name) {
      return NextResponse.json({ message: 'Location ID and name are required' }, { status: 400 });
    }

    const updatedLocation = await Location.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    if (!updatedLocation) {
      return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Location updated successfully', location: updatedLocation }, { status: 200 });
  } catch (error) {
    console.error('Error while updating location:', error);
    return NextResponse.json({ message: 'Failed to update location' }, { status: 500 });
  }
}

// ======================= DELETE - Remove Location ======================= //
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'Location ID is required' }, { status: 400 });
    }

    const deletedLocation = await Location.findByIdAndDelete(id);

    if (!deletedLocation) {
      return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Location deleted successfully', location: deletedLocation }, { status: 200 });
  } catch (error) {
    console.error('Error while deleting location:', error);
    return NextResponse.json({ message: 'Failed to delete location' }, { status: 500 });
  }
}
