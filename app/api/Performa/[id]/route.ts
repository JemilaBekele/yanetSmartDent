import { NextRequest, NextResponse } from 'next/server';
import Service from '@/app/(models)/Services';
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import Perfo from '@/app/(models)/performa';
connect();

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

    // Fetch patient details
    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Parse the incoming request body
    const body: CreateInvoiceRequest = await request.json();

    // Extract the necessary fields from the body
    const { items, customerName} = body;

    // Check if required fields are provided
    if (!items || !customerName ) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
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
    const newInvoice = new Perfo({
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
      
      createdBy: {
        id: user.id,
      username: user.username,
    },// Set the status of the invoice (Paid, Pending, Cancel,order)
    });

    // Save the new invoice
    

     const savedInvoice = await newInvoice.save();

      // Add the new appointment to the patient's record
      patient.Perfo = patient.Perfo || [];
      patient.Perfo.push(savedInvoice._id);
      await patient.save();

    
    // Respond with the newly created invoice
    return NextResponse.json({ Perfo: savedInvoice }, { status: 201 });
  }} catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}


export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);

  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    // Find the patient by ID and populate Invoice and Card
    const patient = await Patient.findById(id)
      .populate({
        path: "Perfo",
        model: "Perfo",
        options: { sort: { createdAt: -1 } }, // Sort invoices by createdAt in descending order
      })
      .populate({
        path: "Card",
        model: "Card",
        options: { sort: { createdAt: -1 } }, // Sort cards by createdAt in descending order
      })
      .exec();

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Extract the last cardprice from the populated Card array
    const lastCard = patient.Card.length > 0 ? patient.Card[0] : null; // The first card is the latest due to sorting
    const lastCardPrice = lastCard ? lastCard.cardprice : null;

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
        Perfo: patient.Perfo || [],
        lastCardPrice: lastCardPrice, // Include the last card price in the response
      },
    });
  } catch (error) {
    console.error("Error retrieving Invoice and card data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}