import { NextRequest, NextResponse } from 'next/server';
import Service from '@/app/(models)/Services';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';

connect();

// POST method for creating a new service
export async function POST(req: NextRequest) {
   await authorizedMiddleware(req);
  try {
    const { service, price, categoryId } = await req.json(); // Parse the request body

    // Validate request
    if (!service || !price || !categoryId) {
      return NextResponse.json({ message: 'Service, price, and categoryId are required' }, { status: 400 });
    }

    // Check if the service already exists in the given category
    const existingService = await Service.findOne({ service, categoryId });
    if (existingService) {
      return NextResponse.json({ message: 'Service already exists in this category' }, { status: 400 });
    }

    // Create new service
    const newService = new Service({
      service,
      price,
      categoryId,
    });

    // Save service to the database
    await newService.save();

    // Send response
    return NextResponse.json(
      {
        message: 'Service registered successfully',
        service: newService,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// GET method for fetching all services
export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);
  try {
    const services = await Service.find(); // Fetch services with category details
    return NextResponse.json(services, { status: 200 });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ message: 'Failed to fetch services' }, { status: 500 });
  }
}

// PATCH method for updating a service by its ID
