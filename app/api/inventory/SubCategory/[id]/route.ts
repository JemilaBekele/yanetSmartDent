// app/api/subcategory/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import SubCategory from '@/app/(models)/inventory/SubCategory';
import ProCategory from '@/app/(models)/inventory/Category';
import { authorizedMiddleware } from '@/app/helpers/authentication';

connect();

// PATCH - Update SubCategory
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
            await authorizedMiddleware(req);
  
  try {
    const { name, procategoryId } = await req.json();
    const { id } = params;

    if (!id || !name || !procategoryId) {
      return NextResponse.json({ message: 'SubCategory ID, name and procategoryId are required' }, { status: 400 });
    }

    // Check if parent category exists
    const parentCategory = await ProCategory.findById(procategoryId);
    if (!parentCategory) {
      return NextResponse.json({ message: 'Parent category not found' }, { status: 404 });
    }

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      id,
      { name, procategoryId },
      { new: true }
    );

    if (!updatedSubCategory) {
      return NextResponse.json({ message: 'SubCategory not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'SubCategory updated successfully', subCategory: updatedSubCategory }, { status: 200 });
  } catch (error) {
    console.error('Error while updating subcategory:', error);
    return NextResponse.json({ message: 'Failed to update subcategory' }, { status: 500 });
  }
}


export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
              await authorizedMiddleware(req);

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'Product category ID is required' }, { status: 400 });
    }

    // Check if parent category exists
    const parentCategory = await ProCategory.findById(id);
    if (!parentCategory) {
      return NextResponse.json({ message: 'Parent category not found' }, { status: 404 });
    }

    // Find all subcategories that belong to this product category
    const subCategories = await SubCategory.find({ procategoryId: id });

    return NextResponse.json({ 
      message: 'Subcategories retrieved successfully', 
      subCategories,
      count: subCategories.length 
    }, { status: 200 });
  } catch (error) {
    console.error('Error while fetching subcategories:', error);
    return NextResponse.json({ message: 'Failed to fetch subcategories' }, { status: 500 });
  }
}
// DELETE - Delete SubCategory
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ message: 'SubCategory ID is required' }, { status: 400 });
    }

    const deletedSubCategory = await SubCategory.findByIdAndDelete(id);

    if (!deletedSubCategory) {
      return NextResponse.json({ message: 'SubCategory not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'SubCategory deleted successfully', subCategory: deletedSubCategory }, { status: 200 });
  } catch (error) {
    console.error('Error while deleting subcategory:', error);
    return NextResponse.json({ message: 'Failed to delete subcategory' }, { status: 500 });
  }
}
