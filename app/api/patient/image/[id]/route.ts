// app/api/patient/image/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import Image from '@/app/(models)/image';
import { authorizedMiddleware } from '@/app/helpers/authentication';

import { uploadImage } from '@/app/helpers/imageUploader';
import Patient from '@/app/(models)/Patient';

import { connect } from '@/app/lib/mongodb';
connect();

interface Image {
    createdAt: string; // or Date, depending on how you store it
    // Add other fields as needed
  }
  export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    await authorizedMiddleware(request);
     
  
      try {
          const { id } = params;
          if (!id) {
              return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
          }if (typeof request === 'object' && request !== null && 'user' in request) {
              const user = (request as { user: { id: string; username: string } }).user; // Type assertion for user
              console.log("User Data:", user);
        
              const patient = await Patient.findById(id).exec();
              if (!patient) {
                return NextResponse.json({ error: "Patient not found" }, { status: 404 });
              }
          const formData = await request.formData(); // Parse the incoming FormData
  
          // Extract images from form data
          const image = formData.get('image') as File | null;
          const imagetwo = formData.get('imagetwo') as File | null;
          const imagethree = formData.get('imagethree') as File | null;
  
          // Validate incoming data
          if (!image && !imagetwo && !imagethree) {
              return NextResponse.json({ error: "At least one image must be provided" }, { status: 400 });
          }
  
          // Process the images
          const uploadedImage = image ? await uploadImage(image) : null;
          const uploadedImageTwo = imagetwo ? await uploadImage(imagetwo) : null;
          const uploadedImageThree = imagethree ? await uploadImage(imagethree) : null;
  
          // Create a new Image document
          const newImage = new Image({
              image: uploadedImage,
              imagetwo: uploadedImageTwo,
              imagethree: uploadedImageThree,
              patientId: { id: patient._id },
              createdBy: {
                  id: user.id,
                  username: user.username,
                },
          });
  
          // Save the image to the database
          const savedImageinfo =    await newImage.save();
  
           // Add the new health info to the patient
        patient.Image = patient.Image || [];
        patient.Image.push(savedImageinfo._id);
        await patient.save();
  
          return NextResponse.json(savedImageinfo, { status: 201 });
     } } catch (error) {
          console.error("Error creating image:", error);
          return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
      }
  }






  export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const { id } = params;
      if (!id) {
        return NextResponse.json(
          { error: "Patient ID is required" },
          { status: 400 }
        );
      }
  
      // Find the patient by ID and dynamically fetch the associated images
      const patient = await Patient.findById(id).populate({
        path: 'Image',
        options: { sort: { createdAt: -1 } }, // Dynamically sort by createdAt descending
      }).exec();
  
      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }
  
      // Check if the patient has images
      if (!patient.Image || patient.Image.length === 0) {
        return NextResponse.json({
          message: "No images available for this patient",
          data: [],
        });
      }
  
      // Return the images associated with the patient
      return NextResponse.json({
        message: "Images retrieved successfully",
        success: true,
        data: patient.Image,
      });
    } catch (error) {
      console.error("Error retrieving images:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }