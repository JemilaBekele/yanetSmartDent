import { NextRequest, NextResponse } from 'next/server';
import { connect } from '@/app/lib/mongodb';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Branch from '@/app/(models)/branch';

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
      name, 
      location, 
      phone, 
      manager 
    } = await req.json();
    console.log("Received PATCH request to update branch:", { id, name, location, phone, manager });

    // Validate inputs
    if (!id) {
      return NextResponse.json(
        { message: 'Branch ID is required' }, 
        { status: 400 }
      );
    }

    // Check if user is authorized and get user data
    if (typeof req === 'object' && req !== null && 'user' in req) {
      const user = (req as { user: { id: string; username: string } }).user;

      // Build update object with only provided fields
      const updateData: any = {};
      if (name) updateData.name = name;
      if (location !== undefined) updateData.location = location;
      if (phone !== undefined) updateData.phone = phone;
      if (manager !== undefined) updateData.manager = manager;

      console.log("Final update data:", updateData);

      // Check if branch name already exists (if name is being updated)
      if (name) {
        const existingBranch = await Branch.findOne({ 
          name, 
          _id: { $ne: id } 
        });
        if (existingBranch) {
          return NextResponse.json(
            { message: 'Branch name already exists' }, 
            { status: 400 }
          );
        }
      }

      // Find and update the branch by its ID
      const updatedBranch = await Branch.findByIdAndUpdate(
        id,
        updateData,
        { new: true } // Return the updated document
      ).populate('manager', 'name email username');

      if (!updatedBranch) {
        return NextResponse.json(
          { message: 'Branch not found' }, 
          { status: 404 }
        );
      }

      return NextResponse.json(
        { 
          message: 'Branch updated successfully', 
          branch: updatedBranch 
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }
  } catch (error) {
    console.error('Error while updating branch:', error);
    return NextResponse.json(
      { message: 'Failed to update branch' }, 
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
        { message: 'Branch ID is required' }, 
        { status: 400 }
      );
    }

    // Find and delete the branch by its ID
    const deletedBranch = await Branch.findByIdAndDelete(id);

    if (!deletedBranch) {
      return NextResponse.json(
        { message: 'Branch not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Branch deleted successfully', 
        branch: deletedBranch 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error while deleting branch:', error);
    return NextResponse.json(
      { message: 'Failed to delete branch' }, 
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

    if (!id) {
      return NextResponse.json(
        { message: "Branch ID is required" },
        { status: 400 }
      );
    }

    // Find the branch by its ID
    const branch = await Branch.findById(id).populate('manager', 'name email username');

    if (!branch) {
      return NextResponse.json(
        { message: "Branch not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(branch, { status: 200 });

  } catch (error) {
    console.error("Error while fetching branch:", error);
    return NextResponse.json(
      { message: "Failed to fetch branch" },
      { status: 500 }
    );
  }
}