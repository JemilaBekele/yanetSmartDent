import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import Branch from '@/app/(models)/branch';
import User from '@/app/(models)/User';

// Ensure MongoDB connection
connect();

export async function POST(req: NextRequest) {
  try {
    const { name, location, phone, manager } = await req.json(); // Parse the request body

    // Validate request
    if (!name) {
      return NextResponse.json({ message: 'Branch name is required' }, { status: 400 });
    }

    // Check if the branch already exists
    const existingBranch = await Branch.findOne({ name });
    if (existingBranch) {
      return NextResponse.json({ message: 'Branch name already exists' }, { status: 400 });
    }

    // Create new branch
    const newBranch = new Branch({ 
      name, 
      location: location || null, 
      phone: phone || null, 
      manager: manager || null 
    });

    // Save branch to the database
    await newBranch.save();

    // Send response
    return NextResponse.json(
      {
        message: 'Branch registered successfully',
        branch: newBranch,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error while adding branch:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function GET() {
  try {
                    await User.aggregate([{ $sample: { size: 1 } }]);
    
    // Fetch all branches from the database
    // Populate manager field if it exists to get manager details
    const branches = await Branch.find().populate('manager', 'username');

    return NextResponse.json(branches, { status: 200 });
  } catch (error) {
    console.error('Error while fetching branches:', error);
    return NextResponse.json({ message: 'Failed to fetch branches' }, { status: 500 });
  }
}