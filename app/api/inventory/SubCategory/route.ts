// app/api/subcategory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import SubCategory from '@/app/(models)/inventory/SubCategory';
import ProCategory from '@/app/(models)/inventory/Category';
import { authorizedMiddleware } from '@/app/helpers/authentication';

connect();

// POST - Create new SubCategory
export async function POST(req: NextRequest) {
              await authorizedMiddleware(req);
  
  try {
    const { name, procategoryId } = await req.json();

    if (!name || !procategoryId) {
      return NextResponse.json(
        { message: 'SubCategory name and procategoryId are required' },
        { status: 400 }
      );
    }

    // Check if parent category exists
    const parentCategory = await ProCategory.findById(procategoryId);
    if (!parentCategory) {
      return NextResponse.json({ message: 'Parent category not found' }, { status: 404 });
    }

    // Check if SubCategory with same name already exists under the same category
    const existingSubCategory = await SubCategory.findOne({ name, procategoryId });
    if (existingSubCategory) {
      return NextResponse.json({ message: 'SubCategory already exists' }, { status: 400 });
    }

    const newSubCategory = new SubCategory({ name, procategoryId });
    await newSubCategory.save();

    return NextResponse.json(
      { message: 'SubCategory created successfully', subCategory: newSubCategory },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error while adding subcategory:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// GET - Fetch all SubCategories with products
export async function GET(req: NextRequest) {
              await authorizedMiddleware(req);
  
  try {
    const subCategories = await SubCategory.find()
     .populate('procategoryId'); 

    return NextResponse.json(subCategories, { status: 200 });
  } catch (error) {
    console.error('Error while fetching subcategories:', error);
    return NextResponse.json({ message: 'Failed to fetch subcategories' }, { status: 500 });
  }
}
