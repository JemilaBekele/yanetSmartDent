import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import Location from '@/app/(models)/inventory/location';
import { authorizedMiddleware } from '@/app/helpers/authentication';

// Connect to MongoDB
connect();

// ======================= POST - Create Location ======================= //
export async function POST(req: NextRequest) {
              await authorizedMiddleware(req);

  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: 'Location name is required' },
        { status: 400 }
      );
    }

    // Check if location already exists
    const existingLocation = await Location.findOne({ name });
    if (existingLocation) {
      return NextResponse.json(
        { message: 'Location already exists' },
        { status: 400 }
      );
    }

    const newLocation = new Location({ name });
    await newLocation.save();

    return NextResponse.json(
      { message: 'Location registered successfully', location: newLocation },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error while adding location:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// ======================= GET - Fetch All Locations ======================= //
export async function GET(request: NextRequest) {
                await authorizedMiddleware(request);

  try {
    const locations = await Location.find();
    return NextResponse.json(locations, { status: 200 });
  } catch (error) {
    console.error('Error while fetching locations:', error);
    return NextResponse.json(
      { message: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}
