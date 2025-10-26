import { NextRequest, NextResponse } from 'next/server';
import MedicalFinding from '@/app/(models)/MedicalFinding';
import Patient from '@/app/(models)/Patient';
import Invoiceprice from '@/app/(models)/Invoice';
import { authorizedMiddleware } from '@/app/helpers/authentication';

// Define the treatment prices and ensure it matches the possible treatment keys
const treatmentPrices: Record<string, number> = {
  teethWhitening: 300,
  veneers: 700,
  bonding: 250,
  cosmeticContouring: 400,
  gumContouring: 350,
  compositeBonding: 500,
  smileMakeovers: 1000,
  other: 200
};

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
await authorizedMiddleware(request);
  
  try {
    if (typeof request === 'object' && request !== null && 'user' in request) {
      const user = (request as { user: { id: string; username: string } }).user; // Type assertion for user
      const { id } = params;

      if (!id) {
        return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
      }

      const reqBody = await request.json();
      const { MedicalFindingId } = reqBody;

      reqBody.createdBy = {
        id: user.id,       // Set from user
        username: user.username,
      };

      // Find the patient by ID
      const patient = await Patient.findById(id).exec();
      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      // Retrieve the MedicalFinding by its ID
      const medicalFinding = await MedicalFinding.findById(MedicalFindingId).exec();
      if (!medicalFinding) {
        return NextResponse.json({ error: "Medical Finding not found" }, { status: 404 });
      }

      // Extract the TreatmentPlan from MedicalFinding
      const { TreatmentPlan } = medicalFinding;

      // Calculate the total price based on the selected treatment plan
      let totalPrice = 0;
      for (const treatment in TreatmentPlan) {
        // Check if the treatment is selected (true) and add the price if it is
        if (TreatmentPlan[treatment] === true && treatment in treatmentPrices) {
          totalPrice += treatmentPrices[treatment]; // Ensure the treatment key exists in treatmentPrices
        }
      }

      // Create a new invoice with the calculated price
      const newInvoice = new Invoiceprice({
        MedicalFindingId: {
          id: medicalFinding._id,
        },
        patientId: {
          id: patient._id,
        },
        createdBy: {
          id: user.id,
          username: user.username,
        },
        price: totalPrice, // Use the calculated price
      });

      // Save the new invoice
      const savedInvoice = await newInvoice.save();

      // Attach the invoice to the patient
      if (!patient.Invoiceprice) {
        patient.Invoiceprice = [];
      }
      patient.Invoiceprice.push(savedInvoice._id);
      await patient.save();

      // Return the medical findings along with the invoice
      return NextResponse.json({
        message: "Medical findings and invoice created successfully",
        success: true,
        savedInvoice,
      });
    }
  } catch (error) {
    console.error("Error retrieving medical findings:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}




export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const authrtoResponse = await authorizedMiddleware(request);
    if (authrtoResponse) {
      return authrtoResponse;
    }
  
    try {
      // Type assertion for user
        const { id } = params;
  
        if (!id) {
          return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
        }
  
        // Find the patient by ID
        const patient = await Patient.findById(id).populate('Invoiceprice').exec();
        if (!patient) {
          return NextResponse.json({ error: "Patient not found" }, { status: 404 });
        }
  
        // Retrieve the invoices associated with the patient
        const invoices = await Invoiceprice.find({ patientId: id }).exec();
        if (invoices.length === 0) {
          return NextResponse.json({ error: "No invoices found for this patient" }, { status: 404 });
        }
  
        // Gather all the related medical findings for the invoices
        const medicalFindings = await MedicalFinding.find({
          _id: { $in: invoices.map(invoice => invoice.MedicalFindingId.id) },
        }).exec();
  
        // Return the patient data along with the invoices and related medical findings
        return NextResponse.json({
          message: "Patient invoices and medical findings retrieved successfully",
          success: true,
          patient,
          invoices,
          medicalFindings,
        });
      
    } catch (error) {
      console.error("Error retrieving patient invoices and medical findings:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }