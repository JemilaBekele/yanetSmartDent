import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import { Announcement } from '@/app/(models)/CompanyProfile';
import { authorizedMiddleware } from '@/app/helpers/authentication';

// Ensure MongoDB connection
connect();

export async function POST(request: NextRequest) {
  try {
        await authorizedMiddleware(request);
    
    const { title, description, isCritical, criticalExpiry } = await request.json();

    // Validate request
    if (!title) {
      return NextResponse.json({ message: 'Announcement title is required' }, { status: 400 });
    }

    // Validate critical announcement
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

    // Check if user is authorized and get user data
    if (typeof request === 'object' && request !== null && 'user' in request) {
      const user = (request as { user: { id: string; username: string } }).user;

      // Create new announcement
      const newAnnouncement = new Announcement({
        title,
        description,
        isCritical: isCritical || false,
        main: true,
        criticalExpiry: isCritical ? new Date(criticalExpiry) : null,
        createdBy: {
          id: user.id,
          username: user.username,
        },
      });

      // Save announcement to the database
      await newAnnouncement.save();

      // Send response
      return NextResponse.json(
        {
          message: 'Announcement created successfully',
          announcement: newAnnouncement,
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }
  } catch (error) {
    console.error('Error while creating announcement:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const announcements = await Announcement.find({
      main: true,
      $or: [
        { isCritical: { $exists: false } },
        { isCritical: false },
        { 
          isCritical: true,
          criticalExpiry: { $gt: new Date() }
        }
      ]
    }).populate("createdBy");
    
    return NextResponse.json(announcements, { status: 200 });
  } catch (error) {
    console.error("Error while fetching announcements:", error);
    return NextResponse.json(
      { message: "Failed to fetch announcements" },
      { status: 500 }
    );
  }
}