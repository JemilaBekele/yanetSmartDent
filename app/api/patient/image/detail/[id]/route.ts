import { NextRequest, NextResponse } from 'next/server';
import Image from '@/app/(models)/image';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Patient from '@/app/(models)/Patient';
import { connect } from '@/app/lib/mongodb';
connect();
interface Image {
    createdAt: string; // or Date, depending on how you store it
}



// PATCH functionality

// DELETE functionality
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // Authorization check
  const { id } = params;
console.log(id)
  if (!id) {
    return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
  }
  await authorizedMiddleware(request);

  try {
   

    // Find and delete the image by ID
    const existingImage = await Image.findByIdAndDelete(id).exec();
    if (!existingImage) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Remove the image reference from the associated patient's record
    const patient = await Patient.findOneAndUpdate(
      { Image: id}, // Find patient with this Image ID
      { $pull: { Image: id} }, // Remove the Image ID from the array
      { new: true } // Return the updated patient document
    );

    if (!patient) {
      console.warn(`No patient found with Image ID: ${id}`);
    }

    return NextResponse.json({
      message: "Image deleted successfully and reference removed from patient.",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}





export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    // Find the medical finding by ID
    const finding = await Image.findOne({ image: id }).exec();
    if (!finding) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
console.log(finding)
    return NextResponse.json({
      message: "Image retrieved successfully",
      success: true,
      data: finding, // Adjust the field name to match your schema
    });
  } catch (error) {
    console.error("Error retrieving image:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


  