// Import the Orgnazation model
import {  NextRequest, NextResponse } from 'next/server';
import Orgnazation from '@/app/(models)/Orgnazation';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Service from '@/app/(models)/Services';
import OrgService from '@/app/(models)/orgacredit';
connect();
// Example usage in an API route
export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);
  try {
    // Use the find method to retrieve all Orgnazation documents
    const organizations = await Orgnazation.find({})
    return NextResponse.json({
      message: "Organization finding updated successfully",
      success: true,
      data: organizations,
    }, { status: 200 });
  } catch (error) {
    console.error("Error updating Organization finding:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}



export async function POST(request: NextRequest) {
  await authorizedMiddleware(request);

  try {
    const { organization } = await request.json();

    // Validate if the organization name is provided
    if (!organization) {
      return NextResponse.json({ error: "Organization name is required" }, { status: 400 });
    }

    if (typeof request === 'object' && request !== null && 'user' in request) {
      const user = (request as { user: { id: string; username: string } }).user;
      console.log("User Data:", user);

      // Check if the organization already exists
      const existingOrganization = await Orgnazation.findOne({ organization });
      if (existingOrganization) {
        return NextResponse.json({ error: "Organization already exists" }, { status: 400 });
      }

      // Create the new organization
      const newOrganization = new Orgnazation({
        organization,
        createdBy: {
          id: user.id,
          username: user.username,
        },
      });

      // Save the new organization to the database
      await newOrganization.save();
      console.log("New organization created:", newOrganization);

      // Fetch all existing services
      const services = await Service.find({});
      console.log("Fetched services:", services);

      // Copy all services to the OrgService model with the organization ID
      for (const service of services) {
        const newOrgService = new OrgService({
          service: service.service,
          categoryId: service.categoryId,
          price: service.price,
          organizationid: newOrganization._id, // Add the organization ID
        });

        await newOrgService.save();
        console.log(`Copied service: ${service.service}`);
      }

      return NextResponse.json({
        message: "Organization created successfully and services copied.",
        success: true,
        data: newOrganization,
      }, { status: 201 });
    } else {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error creating organization or copying services:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
