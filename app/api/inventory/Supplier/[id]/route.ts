import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import Supplier from '@/app/(models)/inventory/Supplier';

connect();

// ================== UPDATE SUPPLIER ==================
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { name, contactName, phone, email, address, city, country, tinNumber, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ message: 'Supplier ID is required' }, { status: 400 });
    }

    const existingSupplier = await Supplier.findById(id);
    if (!existingSupplier) {
      return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (contactName !== undefined) updateData.contactName = contactName;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (country !== undefined) updateData.country = country;
    if (tinNumber !== undefined) updateData.tinNumber = tinNumber;
    if (notes !== undefined) updateData.notes = notes;

    const updatedSupplier = await Supplier.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      message: 'Supplier updated successfully',
      supplier: updatedSupplier,
    }, { status: 200 });
  } catch (error) {
    console.error('Error while updating supplier:', error);
    return NextResponse.json({ message: 'Failed to update supplier' }, { status: 500 });
  }
}

// ================== DELETE SUPPLIER ==================
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'Supplier ID is required' }, { status: 400 });
    }

    const deletedSupplier = await Supplier.findByIdAndDelete(id);

    if (!deletedSupplier) {
      return NextResponse.json({ message: 'Supplier not found' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Supplier deleted successfully',
      supplier: deletedSupplier,
    }, { status: 200 });
  } catch (error) {
    console.error('Error while deleting supplier:', error);
    return NextResponse.json({ message: 'Failed to delete supplier' }, { status: 500 });
  }
}
