import User from "@/app/(models)/User";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { connect } from "@/app/lib/mongodb";
import { uploadImage } from '@/app/helpers/imageUploader';
import Branch from "@/app/(models)/branch";

connect();

interface UserData {
  username: string;
  password: string;
  role: string;
  phone: string;
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

export async function POST(request: NextRequest) {
  try {
    // Parse multipart/form-data
    const data = await request.formData();

    // Extract and typecast fields
    const userData: UserData = {
      username: data.get("username") as string,
      password: data.get("password") as string,
      role: data.get("role") as string,
      phone: data.get("phone") as string,
      image: null,
      deadlinetime: null,
      experience: data.get("experience") ? Number(data.get("experience")) : null,
      position: data.get("position") ? (data.get("position") as string) : null,
      lead: data.get("lead") === "true",
      senior: data.get("senior") === "true",
      junior: data.get("junior") === "true",
      head: data.get("head") === "true",
      labassistant: data.get("labassistant") === "true",
      labtechnician: data.get("labtechnician") === "true",
      labhead: data.get("labhead") === "true",
      receptionist: data.get("receptionist") === "true",
      customservice: data.get("customservice") === "true",
      branch: data.get("branch") ? (data.get("branch") as string) : null, // Added branch
    };

    // Basic validation
    if (!userData.username || !userData.password || !userData.role || !userData.phone) {
      return NextResponse.json({ message: "All required fields must be filled." }, { status: 400 });
    }

    // Check for duplicate phone
    const duplicate = await User.findOne({ phone: userData.phone }).lean().exec();
    if (duplicate) {
      return NextResponse.json({ message: "Phone number already exists." }, { status: 409 });
    }

    // Parse or set default deadline time
    const deadlineStr = data.get("deadlinetime") as string | null;
    if (deadlineStr) {
      const deadlineDate = new Date(deadlineStr);
      if (!isNaN(deadlineDate.getTime())) {
        userData.deadlinetime = deadlineDate;
      } else {
        console.warn(`Invalid deadlinetime format: ${deadlineStr}`);
      }
    } else if (userData.role === "User") {
      userData.deadlinetime = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // +30 days
    }

    // Hash password
    userData.password = await bcrypt.hash(userData.password, 10);

    // Handle optional image upload
    const imageFile = data.get("image");
    if (imageFile && imageFile instanceof File) {
      const imagePath = await uploadImage(imageFile);
      userData.image = imagePath;
    }

    // Create user record
    await User.create(userData);

    return NextResponse.json({ message: "User created successfully." }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);

    if (error.name === "ValidationError") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    if (error.code === 11000) {
      return NextResponse.json({ message: "Duplicate entry detected (e.g., phone)." }, { status: 409 });
    }

    return NextResponse.json(
      {
        message: "Failed to create user.",
        error: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
export async function GET() {
  try {
    const users = await User.find({}).populate('branch', 'name location phone').lean();
    const now = new Date();
await Branch.aggregate([{ $sample: { size: 1 } }]);
    // Update lock status for users with expired deadlines
    const updatePromises = users.map(async (user: any) => {
      if (
        user.deadlinetime &&
        new Date(user.deadlinetime).getTime() < now.getTime() &&
        !user.lock
      ) {
        await User.findByIdAndUpdate(user._id, { lock: true });
      }
    });

    await Promise.all(updatePromises);

    // Fetch updated users with branch population
    const updatedUsers = await User.find({})
      .populate('branch', 'name location phone')
      .select('-password') // Exclude password from response
      .lean();

    return NextResponse.json(updatedUsers);
  } catch (error) {
    console.error("Error in GET /api/REGISTER:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}