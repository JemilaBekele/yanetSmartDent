import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import ProCategory from '@/app/(models)/inventory/Category';
import { authorizedMiddleware } from '@/app/helpers/authentication';

connect();

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
      await authorizedMiddleware(req);
  
  try {
    const { name } = await req.json();
    const { id } = params;

    if (!id || !name) {
      return NextResponse.json({ message: 'Category ID and name are required' }, { status: 400 });
    }

    const updatedCategory = await ProCategory.findByIdAndUpdate(id, { name }, { new: true });

    if (!updatedCategory) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Category updated successfully', category: updatedCategory }, { status: 200 });
  } catch (error) {
    console.error('Error while updating category:', error);
    return NextResponse.json({ message: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
    }

    const deletedCategory = await ProCategory.findByIdAndDelete(id);

    if (!deletedCategory) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Category deleted successfully', category: deletedCategory }, { status: 200 });
  } catch (error) {
    console.error('Error while deleting category:', error);
    return NextResponse.json({ message: 'Failed to delete category' }, { status: 500 });
  }
}
