import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import ProCategory from '@/app/(models)/inventory/Category';
import { authorizedMiddleware } from '@/app/helpers/authentication';

connect();

export async function POST(req: NextRequest) {
    await authorizedMiddleware(req);
  
  try {
    const { name } = await req.json();

    if (!name) return NextResponse.json({ message: 'Category name is required' }, { status: 400 });

    const existingCategory = await ProCategory.findOne({ name });
    if (existingCategory) return NextResponse.json({ message: 'Category already exists' }, { status: 400 });

    const newCategory = new ProCategory({ name });
    await newCategory.save();

    return NextResponse.json({ message: 'Category registered successfully', category: newCategory }, { status: 201 });
  } catch (error) {
    console.error('Error while adding category:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest,) {
    await authorizedMiddleware(request);
  
  try {
    const categories = await ProCategory.find()
    return NextResponse.json(categories, { status: 200 });
  } catch (error) {
    console.error('Error while fetching categories:', error);
    return NextResponse.json({ message: 'Failed to fetch categories' }, { status: 500 });
  }
}
