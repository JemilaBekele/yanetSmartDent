import User from "@/app/(models)/User";
import {connect} from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import {authorizedMiddleware} from "@/app/helpers/authentication"


  

connect(); 


export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  authorizedMiddleware(request);
    try {
     
      const { id } = params;
      
      
      if (!id) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
      }
  
      const user = await User.findById({ _id: id });
  
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
  
      return NextResponse.json(user);
    } catch (error: unknown) {
      console.error("Error in GET /api/users:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }


export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  authorizedMiddleware(request);
  try {
      
      const { id } = params;
      
      if (!id) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
      }
  
      const user = await User.findByIdAndDelete(id);
  
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
  
      return NextResponse.json({ message: "User deleted successfully" });
    } catch (error: unknown) {
      console.error("Error in DELETE /api/users:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
    try {
      const { id } = params;
      
      // Ensure the ID is provided
      if (!id) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
      }
  
      // Parse incoming FormData
      const data = await req.formData();
  
      // Find the user to update
      const user = await User.findById(id);
      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
  
      // Initialize fields to update with proper types
      const updates: Partial<{ username: string; phone: string; role: string }> = {};
  
      // Update fields from FormData
      const username = data.get("username") as string | null;
      const phone = data.get("phone") as string | null;
      const role = data.get("role") as string | null;
  
      if (username) updates.username = username;
      if (phone) {
        // Check for duplicate phone, but exclude the current user from the check
        const duplicate = await User.findOne({ phone }).lean().exec() as { _id: string } | null;
        
        if (duplicate && duplicate._id.toString() !== id) {
          return NextResponse.json({ message: "Duplicate phone" }, { status: 409 });
        }
        updates.phone = phone;
      }
      
      if (role) updates.role = role;
  
      // Update the user in the database
      const updatedUser = await User.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });
  
      return NextResponse.json(updatedUser);
    } catch (error: unknown) {
      console.error("Error in PATCH /api/users:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
  