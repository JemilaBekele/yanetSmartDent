import { NextRequest, NextResponse } from 'next/server';

import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Disease from '@/app/(models)/disease';
connect();
// POST method for creating a new service


// PATCH method for updating a service by its ID
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
  await authorizedMiddleware(request);
  try {
    const { id } = params; 
    const {disease} = await request.json(); // Parse request body

    // Validate inputs
    if (!id || (!disease)) {
      return NextResponse.json({ message: 'Service ID and at least one field (service, price, or categoryId) are required' }, { status: 400 });
    }

    // Find and update the service by its ID
    const updatedDisease = await Disease.findByIdAndUpdate(
      id,
      { disease },
      { new: true } // Return the updated document
    ).populate('categoryId', 'name');

    if (!updatedDisease) {
      return NextResponse.json({ message: 'Service not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Service updated successfully', Disease: updatedDisease }, { status: 200 });
  } catch (error) {
    console.error('Error updating service:', error);
    return NextResponse.json({ message: 'Failed to update service' }, { status: 500 });
  }
}

// DELETE method for removing a service by its ID
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    await authorizedMiddleware(request);
  
    try {
      const { id } = params; // Extract the ID from the route parameters
  
      // Validate the ID
      if (!id) {
        return NextResponse.json(
          { success: false, error: "Patient ID is required" },
          { status: 400 }
        );
      }
  
      // Attempt to find and delete the record
      const deletedDisease = await Disease.findByIdAndDelete(id);
  
      // Check if the record was found and deleted
      if (!deletedDisease) {
        return NextResponse.json(
          { success: false, error: "Disease not found" },
          { status: 404 }
        );
      }
  
      // Respond with success and the deleted record
      return NextResponse.json(
        {
          success: true,
          message: "Disease deleted successfully",
          data: deletedDisease,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error deleting disease:", error);
  
      // Respond with a generic error message
      return NextResponse.json(
        { success: false, error: "Failed to delete disease" },
        { status: 500 }
      );
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

    // Log `categoryId` for debugging
  

    // Fetch services based on the provided `categoryId`
    const services = await Disease.find({ id })

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
