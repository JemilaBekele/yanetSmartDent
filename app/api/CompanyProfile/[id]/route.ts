import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import { Announcement, CompanyProfile } from '@/app/(models)/CompanyProfile';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import mongoose from 'mongoose';

// Ensure MongoDB connection
connect();



export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await authorizedMiddleware(req);
    const { 
      companyName, 
      address, 
      phone, 
      title, 
      description, 
      announcements 
    } = await req.json();

    // Validate inputs
    if (!id) {
      return NextResponse.json(
        { message: 'Company profile ID is required' }, 
        { status: 400 }
      );
    }

    // Check if user is authorized and get user data
    if (typeof req === 'object' && req !== null && 'user' in req) {
      const user = (req as { user: { id: string; username: string } }).user;

      let announcementIds: mongoose.Types.ObjectId[] = [];

      // Process announcements if provided
      if (announcements && announcements.length > 0) {
        
        for (const announcementData of announcements) {
          // If it's an existing announcement with _id, use the ObjectId directly
          if (announcementData._id && mongoose.Types.ObjectId.isValid(announcementData._id)) {
            announcementIds.push(new mongoose.Types.ObjectId(announcementData._id));
          }
          // If it's a new announcement without _id, create a new Announcement document
          else if (announcementData.title) {
            const newAnnouncement = new Announcement({
              title: announcementData.title,
              description: announcementData.description || '',
              createdBy: {
                id: user.id,
                username: user.username,
              },
            });
            
            const savedAnnouncement = await newAnnouncement.save();
            announcementIds.push(savedAnnouncement._id);
          }
        }
      }

      // Build update object with only provided fields
      const updateData: any = {};
      if (companyName) updateData.companyName = companyName;
      if (address) updateData.address = address;
      if (phone) updateData.phone = phone;
      if (title !== undefined) updateData.title = title;
      if (description !== undefined) updateData.description = description;
      
      // Only update announcements if we processed them
      if (announcementIds.length > 0) {
        updateData.announcements = announcementIds;
      }


      // Find and update the company profile by its ID
      const updatedCompanyProfile = await CompanyProfile.findByIdAndUpdate(
        id,
        updateData,
        { new: true } // Return the updated document
      ).populate('announcements').populate('createdBy');

      if (!updatedCompanyProfile) {
        return NextResponse.json(
          { message: 'Company profile not found' }, 
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          message: 'Company profile updated successfully', 
          companyProfile: updatedCompanyProfile 
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }
  } catch (error) {
    console.error('Error while updating company profile:', error);
    return NextResponse.json(
      { message: 'Failed to update company profile' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    await authorizedMiddleware(request);
  
    try {
      const { id } = params;

    // Validate inputs
    if (!id) {
      return NextResponse.json(
        { message: 'Company profile ID is required' }, 
        { status: 400 }
      );
    }

    // Find and delete the company profile by its ID
    const deletedCompanyProfile = await CompanyProfile.findByIdAndDelete(id);

    if (!deletedCompanyProfile) {
      return NextResponse.json(
        { message: 'Company profile not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Company profile deleted successfully', 
        companyProfile: deletedCompanyProfile 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error while deleting company profile:', error);
    return NextResponse.json(
      { message: 'Failed to delete company profile' }, 
      { status: 500 }
    );
  }
}


// Ensure MongoDB connection

export async function GET(
request: NextRequest,
{ params }: { params: { id: string } }
) {
await authorizedMiddleware(request);

try {
const { id } = params;

if (!id) {
  return NextResponse.json(
    { message: "Company profile ID is required" },
    { status: 400 }
  );
}

// Find the company profile by its ID
const companyProfile = await CompanyProfile.findById(id).populate(
  "announcements"
);

if (!companyProfile) {
  return NextResponse.json(
    { message: "Company profile not found" },
    { status: 404 }
  );
}

return NextResponse.json(companyProfile, { status: 200 });

} catch (error) {
console.error("Error while fetching company profile:", error);
return NextResponse.json(
{ message: "Failed to fetch company profile" },
{ status: 500 }
);
}
}
