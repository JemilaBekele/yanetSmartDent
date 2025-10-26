import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/app/lib/mongodb";
import Patient from "@/app/(models)/Patient";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import DentalLabForm from "@/app/(models)/labratory";

connect();

interface IDentalLabForm {
  _id: string;
  createdAt: Date;
  finish: boolean;
  modelacceptance: boolean;
  delivered: boolean;
  deliveredby?: string;
  stage?: {
    finish?: boolean;
    metalTryIn?: boolean;
    copingTryIn?: boolean;
    bisqueTryIn?: boolean;
  };
  // Patient info from populated data
  patient?: {
    _id: string;
    cardno: string;
    firstname: string;
    age: number;
    sex: string;
    phoneNumber: string;
    Town: string;
    KK: string;
  };
  // Form details
  toothNumbers?: string[];
  restoration?: any;
  material?: any;
  shade?: any;
}

// Update IPatient interface to make DentalLabForm optional
interface IPatient {
  _id: string;
  cardno: string;
  firstname: string;
  age: number;
  sex: string;
  phoneNumber: string;
  Town: string;
  KK: string;
  DentalLabForm?: IDentalLabForm[]; // Made optional with ?
}

export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);
    
  try {
    console.log("Starting to fetch finished forms...");
    
    // Get all FINISHED DentalLabForms and populate patient data
    const finishedForms = await DentalLabForm.find({ finish: true })
      .populate("patient")
      .sort({ createdAt: -1 })
      .exec();

    console.log(`Found ${finishedForms.length} finished forms`);
    
    if (!finishedForms || finishedForms.length === 0) {
      console.log("No finished forms found");
      return NextResponse.json({
        message: "No finished Dental Lab Forms found",
        data: [],
      });
    }

    // Log the first form to see its structure
    if (finishedForms.length > 0) {
      console.log("First finished form sample:", JSON.stringify(finishedForms[0], null, 2));
    }

    // Group forms by patient
    const formsByPatient: { [patientId: string]: {
      patientInfo: IPatient;
      finishedForms: IDentalLabForm[];
    } } = {};

    finishedForms.forEach((form: any) => {
      console.log(`Processing form ${form._id}, patient:`, form.patient);
      
      if (!form.patient) {
        console.log(`Skipping form ${form._id} - no patient data`);
        return; // Skip if no patient data
      }

      const patientId = form.patient._id.toString();
      console.log(`Patient ID: ${patientId}`);
      
      if (!formsByPatient[patientId]) {
        console.log(`Creating new entry for patient ${patientId}`);
        formsByPatient[patientId] = {
          patientInfo: {
            _id: form.patient._id,
            cardno: form.patient.cardno,
            firstname: form.patient.firstname,
            age: form.patient.age,
            sex: form.patient.sex,
            phoneNumber: form.patient.phoneNumber,
            Town: form.patient.Town,
            KK: form.patient.KK,
            // DentalLabForm is optional now, so we don't need to include it here
          },
          finishedForms: []
        };
      }

      console.log(`Adding form ${form._id} to patient ${patientId}`);
      formsByPatient[patientId].finishedForms.push(form);
    });

    console.log(`Grouped forms into ${Object.keys(formsByPatient).length} patients`);

    // Convert to array and sort forms by date (newest first)
    const result = Object.values(formsByPatient).map(item => ({
      ...item,
      finishedForms: item.finishedForms.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }));

    console.log("Final result:", JSON.stringify(result, null, 2));

    return NextResponse.json({
      message: "Finished Dental Lab Forms retrieved successfully",
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    console.error("Error retrieving finished forms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Simplified helper function based on your schema
function isFormFinished(form: IDentalLabForm): boolean {
  return form.finish === true;
}