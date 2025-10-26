import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import OrgService from '@/app/(models)/orgacredit';

connect();

// GET method for fetching all services
export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);
  try {
    const services = await OrgService.find()
      .populate({
        path: 'organizationid',
        model: 'Orgnazation',
        select: 'organization',
      })
      .populate({
        path: 'categoryId',
        model: 'Category',
        select: 'name',
      });

    return NextResponse.json(services, { status: 200 });
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ message: 'Failed to fetch services' }, { status: 500 });
  }
}

// POST method for creating a new service
export async function POST(request: NextRequest) {
  await authorizedMiddleware(request);
  try {
    const { service, categoryId, price, organizationid } = await request.json();

    if (!service || !categoryId || !price || !organizationid) {
      return NextResponse.json({ message: 'All fields are required' }, { status: 400 });
    }

    const newService = new OrgService({ service, categoryId, price, organizationid });
    await newService.save();

    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json({ message: 'Failed to create service' }, { status: 500 });
  }
}

// PUT method for updating a service

