import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import ProCategory from '@/app/(models)/inventory/Category';
import SubCategory from '@/app/(models)/inventory/SubCategory';
import Product from '@/app/(models)/inventory/Product';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import ProductBatch from '@/app/(models)/inventory/ProductBatch';

connect();

// GET - fetch product by ID
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    
    
        await authorizedMiddleware(req);


    const { id } = params;
 await ProCategory.aggregate([{ $sample: { size: 1 } }]);
            await SubCategory.aggregate([{ $sample: { size: 1 } }]);

            await ProductBatch.aggregate([{ $sample: { size: 1 } }]);
    const product = await Product.findById(id)
      .populate('categoryId')
      .populate('subCategoryId')
      .populate('batches');

    if (!product) {
      return NextResponse.json({ message: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    console.error('Error fetching product by ID:', error);
    return NextResponse.json({ message: 'Failed to fetch product' }, { status: 500 });
  }
}

// PATCH - update product by ID
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Add authorization
    await authorizedMiddleware(req);
    
    const { id } = params;
    const { productCode, name, description, categoryId, subCategoryId } = await req.json();

    if (!productCode || !name || !categoryId) {
      return NextResponse.json(
        { message: 'Product code, name, and categoryId are required' },
        { status: 400 }
      );
    }

    // Check if user is authenticated
    if (typeof req === 'object' && req !== null && 'user' in req) {
      const user = (req as { user: { id: string; username: string } }).user;
      
      const category = await ProCategory.findById(categoryId);
      if (!category) return NextResponse.json({ message: 'Category not found' }, { status: 404 });

      if (subCategoryId) {
        const subCategory = await SubCategory.findById(subCategoryId);
        if (!subCategory) return NextResponse.json({ message: 'SubCategory not found' }, { status: 404 });
      }

      // Check if product code already exists (excluding current product)
      const existingProduct = await Product.findOne({ 
        productCode, 
        _id: { $ne: id } 
      });
      if (existingProduct) return NextResponse.json({ message: 'Product code already exists' }, { status: 400 });

      const updatedProduct = await Product.findByIdAndUpdate(
        id,
        { 
          productCode, 
          name, 
          description, 
          categoryId, 
          subCategoryId,
          updatedBy: {
            id: user.id,
            username: user.username,
            updatedAt: new Date()
          }
        },
        { new: true }
      );

      if (!updatedProduct) return NextResponse.json({ message: 'Product not found' }, { status: 404 });

      return NextResponse.json({ message: 'Product updated successfully', product: updatedProduct }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ message: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE - remove product by ID
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Add authorization
    await authorizedMiddleware(req);
    
    const { id } = params;

    // Check if user is authenticated
    if (typeof req === 'object' && req !== null && 'user' in req) {
      const user = (req as { user: { id: string; username: string } }).user;
      
      // Optional: Add permission check (e.g., only admins can delete)
      // if (user.role !== 'admin') {
      //   return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
      // }

      const deletedProduct = await Product.findByIdAndDelete(id);
      if (!deletedProduct) return NextResponse.json({ message: 'Product not found' }, { status: 404 });

      // Optional: Log the deletion activity

      return NextResponse.json({ message: 'Product deleted successfully', product: deletedProduct }, { status: 200 });
    } else {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ message: 'Failed to delete product' }, { status: 500 });
  }
}