import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import { Announcement } from '@/app/(models)/CompanyProfile';
import { authorizedMiddleware } from '@/app/helpers/authentication';

// Ensure MongoDB connection
connect();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { title, description, isCritical, criticalExpiry } = await req.json();

    // Validate inputs
    if (!id || !title) {
      return NextResponse.json(
        { message: 'Announcement ID and title are required' }, 
        { status: 400 }
      );
    }

    // Validate critical announcement updates
    if (isCritical && !criticalExpiry) {
      return NextResponse.json(
        { message: 'Critical expiry date is required for critical announcements' }, 
        { status: 400 }
      );
    }

    if (isCritical && new Date(criticalExpiry) <= new Date()) {
      return NextResponse.json(
        { message: 'Critical expiry date must be in the future' }, 
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = { title, description };
    if (isCritical !== undefined) {
      updateData.isCritical = isCritical;
      if (isCritical) {
        updateData.criticalExpiry = new Date(criticalExpiry);
      } else {
        updateData.criticalExpiry = null;
      }
    }

    // Find and update the announcement
    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedAnnouncement) {
      return NextResponse.json(
        { message: 'Announcement not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Announcement updated successfully', 
        announcement: updatedAnnouncement 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error while updating announcement:', error);
    return NextResponse.json(
      { message: 'Failed to update announcement' }, 
      { status: 500 }
    );
  }
}
export async function GET(
request: NextRequest,
{ params }: { params: { id: string } }
) {
await authorizedMiddleware(request);

try {
const { id } = params;
    // Validate inputs
    if (!id) {
      return NextResponse.json(
        { message: 'Announcement ID is required' }, 
        { status: 400 }
      );
    }

    // Find and delete the announcement by its ID
    const deletedAnnouncement = await Announcement.findByIdAndDelete(id);

    if (!deletedAnnouncement) {
      return NextResponse.json(
        { message: 'Announcement not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Announcement deleted successfully', 
        announcement: deletedAnnouncement 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error while deleting announcement:', error);
    return NextResponse.json(
      { message: 'Failed to delete announcement' }, 
      { status: 500 }
    );
  }
}
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { message: 'Announcement ID is required' }, 
        { status: 400 }
      );
    }

    const deletedAnnouncement = await Announcement.findByIdAndDelete(id);

    if (!deletedAnnouncement) {
      return NextResponse.json(
        { message: 'Announcement not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Announcement deleted successfully', 
        announcement: deletedAnnouncement 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error while deleting announcement:', error);
    return NextResponse.json(
      { message: 'Failed to delete announcement' }, 
      { status: 500 }
    );
  }
}