import User from "@/app/(models)/User";
import {connect} from "@/app/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import {authorizedMiddleware} from "@/app/helpers/authentication"
import bcrypt from "bcrypt";

connect(); 

export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  authorizedMiddleware(request);
    try {
     
      const { userId } = params;
      
      
      if (!userId) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
      }
  
      const user = await User.findById({ _id: userId }).populate('branch', 'name location phone');
  
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

interface UserData {
  username?: string;
  password?: string;
  role?: string;
  phone?: string;
  image?: string | null;
  deadlinetime?: Date | null;
  experience?: number | null;
  position?: string | null;
  lead?: boolean;
  senior?: boolean;
  junior?: boolean;
  head?: boolean;
  labassistant?: boolean;
  labtechnician?: boolean;
  labhead?: boolean;
  receptionist?: boolean;
  customservice?: boolean;
  branch?: string | null; // Added branch field
}

interface UserData {
  username?: string;
  password?: string;
  role?: string;
  phone?: string;
  image?: string | null;
  deadlinetime?: Date | null;
  experience?: number | null;
  position?: string | null;
  lead?: boolean;
  senior?: boolean;
  junior?: boolean;
  head?: boolean;
  labassistant?: boolean;
  labtechnician?: boolean;
  labhead?: boolean;
  receptionist?: boolean;
  customservice?: boolean;
  branch?: string | null; // Added branch field
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ message: "User ID is required." }, { status: 400 });
    }

    const data = await req.formData();
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    // Prepare updates object
    const updates: UserData = {};

    // Extract and assign fields safely
    const username = data.get("username") as string | null;
    const role = data.get("role") as string | null;
    const phone = data.get("phone") as string | null;
    const experience = data.get("experience") as string | null;
    const position = data.get("position") as string | null;
    const deadlinetime = data.get("deadlinetime") as string | null;
    const branch = data.get("branch") as string | null;
    const password = data.get("password") as string | null;

    if (username) updates.username = username;
    if (role) updates.role = role;

    if (phone) {
      const duplicate = await User.findOne({ phone });
      if (duplicate && duplicate._id.toString() !== id) {
        return NextResponse.json({ message: "Phone number already exists." }, { status: 409 });
      }
      updates.phone = phone;
    }

    // Experience and position
    if (experience !== null) updates.experience = experience === "" ? null : Number(experience);
    if (position !== null) updates.position = position === "" ? null : position;

    // Branch field
    if (branch !== null) updates.branch = branch === "" ? null : branch;

    // Password update
    if (password) {
      updates.password = await bcrypt.hash(password, 10);
    }

    // Parse deadline time
    if (deadlinetime) {
      const deadlineDate = new Date(deadlinetime);
      if (!isNaN(deadlineDate.getTime())) {
        updates.deadlinetime = deadlineDate;
      }
    }

    // Boolean fields
    updates.lead = data.get("lead") === "true";
    updates.senior = data.get("senior") === "true";
    updates.junior = data.get("junior") === "true";
    updates.head = data.get("head") === "true";
    updates.labassistant = data.get("labassistant") === "true";
    updates.labtechnician = data.get("labtechnician") === "true";
    updates.labhead = data.get("labhead") === "true";
    updates.receptionist = data.get("receptionist") === "true";
    updates.customservice = data.get("customservice") === "true";

    // Update and return new record
    const updatedUser = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('branch', 'name location phone'); // Populate branch details

    if (!updatedUser) {
      return NextResponse.json({ message: "Failed to update user." }, { status: 500 });
    }

    return NextResponse.json(
      { message: "User updated successfully.", user: updatedUser },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating user:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: "Failed to update user.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}