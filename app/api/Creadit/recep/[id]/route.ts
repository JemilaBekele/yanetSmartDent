// Import necessary modules and types
import { NextRequest, NextResponse } from 'next/server';
import Service from '@/app/(models)/Services';
import Credit from '@/app/(models)/creadit';
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
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
   
    // Parse the incoming request body
    const body: CreateInvoiceRequest = await request.json();
    console.log("Incoming request body:", body);

    // Extract the necessary fields from the body
    const { items, customerName, currentPayment, status, createdBy } = body;

    // Check if required fields are provided
    if (!items || !customerName || !currentPayment || !status || !createdBy) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
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
    const services = await Service.find({ '_id': { $in: serviceIds } });
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
      currentPayment: {
        amount: currentPayment.amount || 0,
        date: currentPayment.date || new Date(),
        confirm: currentPayment.confirm || false,
        receipt: currentPayment.receipt || false,
      },
      status: status,
      createdBy: {
        id: createdBy.userId,
        username: createdBy.username,
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
} catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}