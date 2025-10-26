import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import OrgService from '@/app/(models)/orgacredit';
import Category from '@/app/(models)/categori';

connect();

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await authorizedMiddleware(request);
    const { id } = params;

    // Check for the required `categoryId` parameter
    if (!id) {
      return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
    }

    // Extract `orgId` from the request body
    const body = await request.json();
    const orgId = body.orgId;

    if (!orgId) {
      return NextResponse.json({ error: "Organization ID is required" }, { status: 400 });
    }

    // Log `categoryId` and `orgId` for debugging
    console.log("categoryId received:", id);
    console.log("organizationId received:", orgId);
    await Category.find()
    // Fetch services based on `categoryId` and `organizationid`
    const services = await OrgService.find({ 
      categoryId: id,
      organizationid: orgId,
    }).populate("categoryId", "name");

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
