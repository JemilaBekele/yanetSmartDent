import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import Category from '@/app/(models)/categori';

// Ensure MongoDB connection
connect();

export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json(); // Parse the request body

    // Validate request
    if (!name) {
      return NextResponse.json({ message: 'Category name is required' }, { status: 400 });
    }

    // Check if the category already exists
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return NextResponse.json({ message: 'Category name already exists' }, { status: 400 });
    }

    // Create new category
    const newCategory = new Category({ name });

    // Save category to the database
    await newCategory.save();

    // Send response
    return NextResponse.json(
      {
        message: 'Category registered successfully',
        category: newCategory,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error while adding category:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Fetch all categories from the database
    const categories = await Category.find();

    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error('Error while fetching categories:', error);
    return NextResponse.json({ message: 'Failed to fetch categories' }, { status: 500 });
  }
}
