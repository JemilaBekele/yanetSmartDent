import { NextRequest, NextResponse } from "next/server";
import Service from "@/app/(models)/Services";
import Invoice from "@/app/(models)/Invoice";
import Patient from "@/app/(models)/Patient";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import { connect } from "@/app/lib/mongodb";

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
  cardno: string; // Patient card number
}

interface CreateInvoiceRequest {
  items: InvoiceItem[];
  customerName: CustomerName;
  currentpayment: {
    amount: number;
  };
  status: "Paid" | "Pending" | "Cancel" | "order";
  confirm: boolean;
  createdBy: {
    userId: string; // Coming from request body
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

    // Extract the necessary fields from the body
    const { items, customerName, currentpayment, status, createdBy } = body;

    // Check if required fields are provided
    if (!items || !customerName || !currentpayment || !status || !createdBy || !createdBy.userId || !createdBy.username) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }

    // Validate the status field
    const validStatuses = ["Paid", "Pending", "Cancel", "order"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: "Invalid status value." }, { status: 400 });
    }

    // Fetch patient details
    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Check if all services referenced exist in the Service collection
    const servicesIds = items.map((item) => item.service);
    const services = await Service.find({ _id: { $in: servicesIds } });
    const serviceMap = new Map(services.map((service) => [service._id.toString(), service]));

    // Validate services
    for (const item of items) {
      const serviceExists = serviceMap.get(item.service);
      if (!serviceExists) {
        return NextResponse.json({ message: `Service with id ${item.service} not found.` }, { status: 404 });
      }
    }

    // Create the new invoice
    const newInvoice = new Invoice({
      items: items.map((item) => ({
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
        cardno: patient.cardno, // Patient card number
      },
      currentpayment: {
        amount: currentpayment,
      },
      status: status,
      createdBy: {
        id: createdBy.userId, // Comes from request body
        username: createdBy.username,
      },
    });

    // Save the new invoice
    const savedInvoice = await newInvoice.save();

    // Add the new invoice to the patient's record
    patient.Invoice = patient.Invoice || [];
    patient.Invoice.push(savedInvoice._id);
    await patient.save();

    // Respond with the newly created invoice
    return NextResponse.json({ invoice: savedInvoice }, { status: 201 });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
