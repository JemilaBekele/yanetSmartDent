import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import OrgService from '@/app/(models)/orgacredit';
import mongoose from 'mongoose';
import Category from '@/app/(models)/categori';

connect();

// GET method for fetching all services
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await authorizedMiddleware(req);
    const { id } = params;
  
    // Ensure the id is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }
  console.log(id)
    try {
      // Fetch services based on the organization ID
      const services = await OrgService.find({ organizationid: id })
        .populate({
          path: "organizationid",
          model: "Orgnazation",
          select: "organization",
        })
        .populate({
          path: "categoryId",
          model: "Category",
          select: "name",
        });
  console.log(services)
      return NextResponse.json(services, { status: 200 });
    } catch (error) {
      console.error("Error fetching services:", error);
      return NextResponse.json({ message: "Failed to fetch services" }, { status: 500 });
    }
  }

// PUT method for updating a service
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  
    try {
      const { id } = params;
  
      // Ensure the id is a valid MongoDB ObjectId
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
      }
  await Category.find()
      const updatedData = await req.json();
      
      const updatedService = await OrgService.findByIdAndUpdate(id, updatedData, { new: true });
  
      if (!updatedService) {
        return NextResponse.json({ error: "Service not found" }, { status: 404 });
      }
  
      return NextResponse.json(updatedService, { status: 200 });
    } catch (error) {
      console.error("Error updating service:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
// DELETE method for deleting a service
export async function DELETE(request: NextRequest) {
  await authorizedMiddleware(request);
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ message: 'Service ID is required' }, { status: 400 });
    }

    const deletedService = await OrgService.findByIdAndDelete(id);

    if (!deletedService) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Service deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ message: 'Failed to delete service' }, { status: 500 });
  }
}
