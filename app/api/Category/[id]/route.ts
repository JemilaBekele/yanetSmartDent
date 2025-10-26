import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import Category from '@/app/(models)/categori';

// Ensure MongoDB connection
connect();

export async function PATCH(req: NextRequest) {
  try {
    const { id, name } = await req.json(); // Parse request body

    // Validate inputs
    if (!id || !name) {
      return NextResponse.json({ message: 'Category ID and name are required' }, { status: 400 });
    }

    // Find and update the category by its ID
    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      { name },
      { new: true } // Return the updated document
    );

    if (!updatedCategory) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Category updated successfully', category: updatedCategory },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error while updating category:', error);
    return NextResponse.json({ message: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json(); // Parse request body

    // Validate inputs
    if (!id) {
      return NextResponse.json({ message: 'Category ID is required' }, { status: 400 });
    }

    // Find and delete the category by its ID
    const deletedCategory = await Category.findByIdAndDelete(id);

    if (!deletedCategory) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(
      { message: 'Category deleted successfully', category: deletedCategory },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error while deleting category:', error);
    return NextResponse.json({ message: 'Failed to delete category' }, { status: 500 });
  }
}
