import { NextRequest, NextResponse } from 'next/server';
import Service from '@/app/(models)/Services';
import Invoice from '@/app/(models)/Invoice';
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import Card from '@/app/(models)/card'; // ✅ Path depends on your project structure
import User from '@/app/(models)/User';
import Branch from '@/app/(models)/branch';
connect();
interface Invoices {
  createdAt: string; // or Date, depending on how you store it
  // Add other fields as needed
}
// Define interfaces for request body types
interface InvoiceItem {
  service: string; // ObjectId as string
  description: string;
  quantity: number;
  price: number; // This should represent the price of the service
  
}

interface CustomerName {
  id: string; // Patient ObjectId as string
  username: string; 
  cardno:  string// Patient Name
}

interface CreateInvoiceRequest {
  items: InvoiceItem[];
  customerName: CustomerName;
  currentpayment: {
    amount: number;
    date: Date;
    confirm: boolean;
    receipt: boolean;
  };
  status: 'Paid' | 'Pending' | 'Cancel' | 'order';
  confirm: boolean ;
  createdBy: {
    userId: string; // Adjust according to your user reference schema
    username: string;
    
  };// Status type
}

// Function to handle POST requests
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  // Use the authorized middleware to check authentication
  await authorizedMiddleware(request);

  try {
    // Extract patient ID from the URL parameters
    const { id } = params; // Use request.nextUrl to get URL parameters

    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    if (typeof request === 'object' && request !== null && 'user' in request) {
        const user = (request as { user: { id: string; username: string } }).user;
const userDetails = await User.findById(user.id).select('branch').exec();
      if (!userDetails) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
    // Fetch patient details
    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Parse the incoming request body
    const body: CreateInvoiceRequest = await request.json();

    // Extract the necessary fields from the body
    const { items, customerName, currentpayment, status } = body;

    // Check if required fields are provided
    if (!items || !customerName || currentpayment === undefined || !status) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    // Validate the status field
    const validStatuses = ['Paid', 'Pending', 'Cancel','order'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: "Invalid status value." }, { status: 400 });
    }

    // Check if all services referenced exist in the Service collection
    const servicesIds = items.map(item => item.service);
    const services = await Service.find({ '_id': { $in: servicesIds } });
    const serviceMap = new Map(services.map(service => [service._id.toString(), service]));

    // Validate services
    for (const item of items) {
      const serviceExists = serviceMap.get(item.service);
      if (!serviceExists) {
        return NextResponse.json({ message: `Service with id ${item.service} not found.` }, { status: 404 });
      }
    }

    // Create the new invoice
    const newInvoice = new Invoice({
      items: items.map(item => ({
        service: {
          id: serviceMap.get(item.service)?._id,
          service: serviceMap.get(item.service)?.service,
        },
        description: item.description,
        quantity: item.quantity,
        price: item.price,
        
      })),
      customerName: {
        id: patient._id, // Patient ObjectId
        username: patient.firstname,
        cardno: patient.cardno // Patient Name
      },
      
      currentpayment:  {
        amount: currentpayment               
      }, // The amount paid immediately
      status: status, 
              branch: userDetails.branch, // Add branch from user details

      createdBy: {
        id: user.id,
      username: user.username,
    },// Set the status of the invoice (Paid, Pending, Cancel,order)
    });

    // Save the new invoice
    

    const savedInvoice = await newInvoice.save();

      // Add the new appointment to the patient's record
      patient.Invoice = patient.Invoice || [];
      patient.Invoice.push(savedInvoice._id);
      await patient.save();

    // Respond with the newly created invoice
    return NextResponse.json({ invoice: savedInvoice }, { status: 201 });
  }} catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}


export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);
  await Card.findOne().sort({ _id: -1 });
            await Branch.aggregate([{ $sample: { size: 1 } }]);

  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    // Find the patient by ID and populate Invoice and Card with branch information
    const patient = await Patient.findById(id)
      .populate({
        path: "Invoice",
        model: "Invoice",
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "branch", // Populate branch for each invoice
          select: "name" // Only select the name field
        }
      })
      .populate({
        path: "Card",
        model: "Card", 
        options: { sort: { createdAt: -1 } },
        populate: {
          path: "branch", // Populate branch for each card
          select: "name" // Only select the name field
        }
      })
      .exec();

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Extract the last cardprice from the populated Card array
    const lastCard = patient.Card.length > 0 ? patient.Card[0] : null;
    const lastCardPrice = lastCard ? lastCard.cardprice : null;

    // Process the data to include branch information
    const processedInvoices = patient.Invoice.map((invoice: any) => ({
      ...invoice.toObject ? invoice.toObject() : invoice,
      branch: invoice.branch ? {
        _id: invoice.branch._id,
        name: invoice.branch.name
      } : null
    }));

    const processedCards = patient.Card.map((card: any) => ({
      ...card.toObject ? card.toObject() : card,
      branch: card.branch ? {
        _id: card.branch._id,
        name: card.branch.name
      } : null
    }));

    // Return the patient data, invoices, and the last card price
    return NextResponse.json({
      message: "Invoice and card data retrieved successfully",
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
        Invoice: processedInvoices,
        Card: processedCards, // Include all cards with branch info
        lastCardPrice: lastCardPrice,
      },
    });
  } catch (error) {
    console.error("Error retrieving Invoice and card data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}