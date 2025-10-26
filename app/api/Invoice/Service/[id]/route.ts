import { NextRequest, NextResponse } from 'next/server';
import Service from '@/app/(models)/Services';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
connect();
// POST method for creating a new service


// PATCH method for updating a service by its ID
export async function PATCH(req: NextRequest) {
  await authorizedMiddleware(req);
  try {
    const { id, service, price, categoryId } = await req.json(); // Parse request body

    // Validate inputs
    if (!id || (!service && !price && !categoryId)) {
      return NextResponse.json({ message: 'Service ID and at least one field (service, price, or categoryId) are required' }, { status: 400 });
    }

    // Find and update the service by its ID
    const updatedService = await Service.findByIdAndUpdate(
      id,
      { service, price, categoryId },
      { new: true } // Return the updated document
    ).populate('categoryId', 'name');

    if (!updatedService) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Service updated successfully', service: updatedService }, { status: 200 });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ message: 'Failed to update service' }, { status: 500 });
  }
}

// DELETE method for removing a service by its ID
export async function DELETE( request: NextRequest,
  { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);
  
  try {
    const { id } = params; // Patient ID

  if (!id) {
    return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
  }

    // Find and delete the service by its ID
    const deletedService = await Service.findByIdAndDelete(id);

    if (!deletedService) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Service deleted successfully', service: deletedService }, { status: 200 });
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json({ message: 'Failed to delete service' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authorizedMiddleware(request);
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }
const categoryId=id
    // Log `categoryId` for debugging
    console.log("categoryId received:", categoryId);

    // Validate the `categoryId`
    if (!categoryId) {
      return NextResponse.json(
        { message: "categoryId is required" },
        { status: 400 }
      );
    }

    // Fetch services based on the provided `categoryId`
    const services = await Service.find({ categoryId }).populate(
      "categoryId",
      "name"
    );

    // Return the services as a JSON response
    return NextResponse.json(services, { status: 200 });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json(
      { message: "Failed to fetch services" },
      { status: 500 }
    );
  }
}
