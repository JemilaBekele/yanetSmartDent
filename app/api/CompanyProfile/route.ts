import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import { CompanyProfile, Announcement } from '@/app/(models)/CompanyProfile';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import mongoose from 'mongoose';

// Ensure MongoDB connection
connect();

export async function POST(request: NextRequest) {
    
    // Apply authorization middleware first
    await authorizedMiddleware(request);

    try {
        const { 
            companyName, 
            address, 
            phone, 
            title, 
            description, 
            announcements 
        } = await request.json();

        // Validate required fields
        if (!companyName || !address || !phone) {
            return NextResponse.json(
                { message: 'Company name, address, and phone are required' }, 
                { status: 400 }
            );
        }

        // Check if user is authorized and get user data
        if (typeof request === 'object' && request !== null && 'user' in request) {
            const user = (request as { user: { id: string; username: string } }).user;

            // Check if company profile already exists
            const existingCompany = await CompanyProfile.findOne({ companyName });
            if (existingCompany) {
                return NextResponse.json(
                    { message: 'Company profile already exists' }, 
                    { status: 400 }
                );
            }

            let announcementIds: mongoose.Types.ObjectId[] = [];

            // If announcements are provided, create them first
            if (announcements && announcements.length > 0) {
                
                for (const announcementData of announcements) {
                    // Check if it's a temporary ID (starts with 'temp-') or already an ObjectId
                    if (typeof announcementData === 'string' && announcementData.startsWith('temp-')) {
                        // Skip temporary IDs - these are just placeholders from the frontend
                        continue;
                    }
                    
                    // If it's an object with title and description, create a new announcement
                    if (typeof announcementData === 'object' && announcementData.title) {
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

            // Create new company profile
            const newCompanyProfile = new CompanyProfile({
                companyName,
                address,
                phone,
                title,
                description,
                announcements: announcementIds, // Use the actual ObjectIds
                createdBy: {
                    id: user.id,
                    username: user.username,
                },
            });

            // Save company profile to the database
            await newCompanyProfile.save();

            // Populate the announcements before sending response
            const populatedCompanyProfile = await CompanyProfile.findById(newCompanyProfile._id)
                .populate('announcements')
                .populate('createdBy');

            // Send response
            return NextResponse.json(
                {
                    message: 'Company profile created successfully',
                    companyProfile: populatedCompanyProfile,
                },
                { status: 201 }
            );
        } else {
            return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
        }
    } catch (error) {
        console.error('Error while creating company profile:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET() {
  try {
    // Fetch all company profiles with populated announcements
    const companyProfiles = await CompanyProfile.find()
      .populate('createdBy')
      .populate('announcements');

    return NextResponse.json(companyProfiles, { status: 200 });
  } catch (error) {
    console.error('Error while fetching company profiles:', error);
    return NextResponse.json(
      { message: 'Failed to fetch company profiles' }, 
      { status: 500 }
    );
  }
}