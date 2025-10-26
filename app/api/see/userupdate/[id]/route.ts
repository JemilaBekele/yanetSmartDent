import User from "@/app/(models)/User";
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/app/lib/mongodb";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import { uploadImage } from '@/app/helpers/imageUploader';

connect();

// Define the request body type
interface UserUpdateData {
  username?: string; // Optional, since it's a partial update
  phone?: string;    // Optional, since it's a partial update
  image?: string;    // Optional, since it's a partial update
}



export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    try {
      await authorizedMiddleware(request);
  
      const { id } = params;
      // Ensure the ID is provided
      if (!id) {
        return NextResponse.json({ error: "User ID is required" }, { status: 400 });
      }
  
      // Parse form data
      const data = await request.formData();
      const updateData: UserUpdateData = {};
  
      const username = data.get("username") as string;
      if (username) {
        updateData.username = username;
      }
  
      const phone = data.get("phone") as string;
      if (phone) {
        const duplicate = await User.findOne({ phone }).lean().exec() as { _id: string } | null;
        if (duplicate && duplicate._id.toString() !== id) {
          return NextResponse.json({ message: "Duplicate phone" }, { status: 409 });
        }
        updateData.phone = phone;
      }
  
      const imageFile = data.get("image");
      if (imageFile && imageFile instanceof File) {
        const imagePath = await uploadImage(imageFile);
        updateData.image = imagePath;
      }
  
      if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ message: "No fields to update" }, { status: 400 });
      }
  
      const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true }).lean().exec();
      if (!updatedUser) {
        return NextResponse.json({ message: "User not found" }, { status: 404 });
      }
  
      return NextResponse.json({ message: "User Updated", user: updatedUser }, { status: 200 });
    } catch (error) {
      console.error("Error updating user:", error);
      return NextResponse.json({ message: "Error", error }, { status: 500 });
    }
  }
  
