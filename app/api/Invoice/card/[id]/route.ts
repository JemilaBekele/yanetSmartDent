import { NextRequest, NextResponse } from 'next/server';
import Card from '@/app/(models)/card';
import Patient from '@/app/(models)/Patient';
import User from '@/app/(models)/User'; // Import User model
import { authorizedMiddleware } from '@/app/helpers/authentication';
import Branch from '@/app/(models)/branch';

interface Card {
  createdAt: string;
  // Add other fields as needed
}

// Create a new card
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Call authorized middleware
    const authResponse = await authorizedMiddleware(request);
    if (authResponse instanceof NextResponse) {
      return authResponse;
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const requestBody = await request.json();
    const { cardprice } = requestBody;

    // Check if cardprice is missing
    if (!cardprice) {
      return NextResponse.json({ error: "Missing required fields: cardprice" }, { status: 400 });
    }

    // Get the authenticated user from request
    const user = (request as any)?.user;
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }

    // Fetch the complete user with branch information
    const fullUser = await User.findById(user.id).select('branch').exec();
    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log('=== Creating Card ===', {
      userId: user.id,
      userBranch: fullUser.branch,
      patientId: id
    });

    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Create new card with branch information
    const newCard = new Card({
      cardprice,
      patient: {
        id: patient._id,
        username: patient.firstname,
        cardno: patient.cardno,
      },
      createdBy: {
        id: user.id,
        username: user.username,
      },
      branch: fullUser.branch // Add branch from the logged-in user
    });

    const savedCard = await newCard.save();

    // Add the new Card to the patient's record
    patient.Card = patient.Card || [];
    patient.Card.push(savedCard._id);
    await patient.save();

    return NextResponse.json({
      message: "Card created successfully",
      success: true,
      data: savedCard,
    });

  } catch (error) {
    console.error("Error creating Card:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }
            await Branch.aggregate([{ $sample: { size: 1 } }]);

    // Find the patient by ID and populate Card with branch information
    const patient = await Patient.findById(id)
      .populate({
        path: 'Card',
        populate: {
          path: 'branch',
          select: 'name' // Populate branch name
        }
      })
      .exec();

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" });
    }

    // If the patient has no cards, return an empty array
    if (!patient.Card || patient.Card.length === 0) {
      return NextResponse.json({ 
        message: "No cards available for this patient", 
        data: [] 
      });
    }

    // Sort cards by createdAt field in descending order
    const sortedCards = patient.Card.sort((a: Card, b: Card) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Return the sorted cards with branch information
    return NextResponse.json({
      message: "Cards retrieved successfully",
      success: true,
      data: sortedCards,
    });
  } catch (error) {
    console.error("Error retrieving Cards:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}