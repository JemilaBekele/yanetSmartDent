// Import the Orgnazation model
import {  NextRequest, NextResponse } from 'next/server';
import Orgnazation from '@/app/(models)/Orgnazation';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';

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
