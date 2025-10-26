// Import necessary modules and types
import { NextRequest, NextResponse } from 'next/server';
import Credit from '@/app/(models)/creadit';
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import OrgService from '@/app/(models)/orgacredit';
import User from '@/app/(models)/User';
connect();
interface CreditDocument {
  createdAt: string; // or Date, depending on how you store it
  // Add other fields as needed
}

// Define interfaces for request body types
interface CreditItem {
  service: string; // ObjectId as string
  description: string;
  quantity: number;
  price: number; // This should represent the price of the service
}

interface CustomerName {
  id: string; // Patient ObjectId as string
}

interface CreateInvoiceRequest {
  items: CreditItem[];
  customerName: CustomerName;
  currentPayment: {
    amount: number;
    date: Date;
    confirm: boolean;
    receipt: boolean;
  };
  status: 'Paid' | 'Pending' | 'Cancel' | 'Credit';
  createdBy: {
    userId: string; // Adjust according to your user reference schema
    username: string;
  };
}

// Function to handle POST requests
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // Use the authorized middleware to check authentication
  await authorizedMiddleware(request);

  try {
    // Extract patient ID from the URL parameters
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }
    if (typeof request === 'object' && request !== null && 'user' in request) {
      const user = (request as { user: { id: string; username: string } }).user;
    // Parse the incoming request body
    const body: CreateInvoiceRequest = await request.json();

    // Extract the necessary fields from the body
    const { items, customerName, currentPayment, status, createdBy } = body;

    // Check if required fields are provided
    if (!items || !customerName || !currentPayment || !status || !createdBy) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }
const userDetails = await User.findById(user.id).select('branch').exec();
      if (!userDetails) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    // Validate the status field
    const validStatuses = ['Paid', 'Pending', 'Cancel', 'Credit'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: "Invalid status value." }, { status: 400 });
    }

    // Fetch patient details
    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Check if all services referenced exist in the Service collection
    const serviceIds = items.map(item => item.service);
    const services = await OrgService.find({ '_id': { $in: serviceIds } });
    const serviceMap = new Map(services.map(service => [service._id.toString(), service]));

    // Validate services
    for (const item of items) {
      const serviceExists = serviceMap.get(item.service);
      if (!serviceExists) {
        return NextResponse.json({ message: `Service with id ${item.service} not found.` }, { status: 404 });
      }
    }

    // Create the new invoice
    const newCredit= new Credit({
      items: items.map(item => ({
        service: {
          id: serviceMap.get(item.service)?._id,
          service: serviceMap.get(item.service)?.service,
        },
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        totalPrice: item.quantity * item.price,
      })),
      customerName: {
        id: patient._id, // Patient ObjectId
      },
                    branch: userDetails.branch, // Add branch from user details

      currentPayment: {
        amount: currentPayment.amount || 0,
        date: currentPayment.date || new Date(),
        confirm: currentPayment.confirm || false,
        receipt: currentPayment.receipt || false,
      },
      status: status,
      createdBy: {
        id: user.id,
        username: user.username,
      }
    });

    // Save the new Credit
    const savedCredit = await newCredit.save();

    // Add the new Credit to the patient's record
    patient.Credit = patient.Credit || [];
    patient.Credit.push(savedCredit._id);
    await patient.save();

    // Respond with the newly created Credit
    return NextResponse.json({ Credit: savedCredit }, { status: 201 });
}} catch (error) {
    console.error("Error creating Credit:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}

// Function to handle GET requests
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);

  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    // Find the patient by ID and populate Credit
    const patient = await Patient.findById(id)
      .populate({
        path: "Credit",
        model: "Credit",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "branch", // Populate branch for each invoice
          select: "name" // Only select the name field
        }
      }).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

   
    // Return the sorted Credit
    return NextResponse.json({
      message: "Credit retrieved successfully",
      success: true,
      data: {
        patient: {
          id: patient._id,
          firstname: patient.firstname,
          age: patient.age,
          phoneNumber: patient.phoneNumber,
          sex: patient.sex,
          cardno: patient.cardno,
          Town: patient.Town,
          KK: patient.KK,
          HNo: patient.HNo,
          updatedAt: patient.updatedAt,
        },
        Credit: patient.Credit || [],
      },
    });
  } catch (error) {
    console.error("Error retrieving Credit:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}