import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/app/lib/mongodb";
import Patient from "@/app/(models)/Patient";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import DentalLabForm from "@/app/(models)/labratory";

connect();

interface IDentalLabForm {
  _id: string;
  createdAt: Date;

  finish?: boolean;
  modelacceptance?: boolean;
  delivered?: boolean;
  // Add other possible properties that might indicate completion
  status?: string;
  completed?: boolean;
  isFinished?: boolean;
}

interface IPatient {
  _id: string;
  cardno: string;
  firstname: string;
  age: number;
  sex: string;
  phoneNumber: string;
  Town: string;
  KK: string;
  DentalLabForm: IDentalLabForm[];
}

export async function GET(request: NextRequest) {
  await authorizedMiddleware(request);
    
  try {
    await DentalLabForm.aggregate([{ $sample: { size: 1 } }]);
    
    // Find all patients with populated DentalLabForms
    const patients = await Patient.find({})
      .populate("DentalLabForm")
      .exec();
      
      
    if (!patients || patients.length === 0) {
      return NextResponse.json({ error: "No patients found" }, { status: 404 });
    }

    // Enhanced filtering with better completion checks
    const patientsWithUnfinishedForms = patients.filter((patient: IPatient) => {
      if (!patient.DentalLabForm || patient.DentalLabForm.length === 0) {
        return false;
      }
      
      // Check if this patient has any unfinished forms
      return patient.DentalLabForm.some((form: IDentalLabForm) => {
        return !isFormFinished(form);
      });
    });

   

    if (patientsWithUnfinishedForms.length === 0) {
      return NextResponse.json({
        message: "No patients with unfinished Dental Lab Forms found",
        data: [],
      });
    }

    // Process each patient to include their unfinished forms
    const result = patientsWithUnfinishedForms.map((patient: IPatient) => {
      // Filter for UNFINISHED forms for this patient
      const unfinishedForms = patient.DentalLabForm.filter((form: IDentalLabForm) => {
        return !isFormFinished(form);
      });


      // Sort by creation date descending
      const sortedForms = unfinishedForms.sort(
        (a: IDentalLabForm, b: IDentalLabForm) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return {
        patientInfo: {
          _id: patient._id,
          cardno: patient.cardno,
          firstname: patient.firstname,
          age: patient.age,
          sex: patient.sex,
          phoneNumber: patient.phoneNumber,
          Town: patient.Town,
          KK: patient.KK,
        },
        unfinishedForms: sortedForms
      };
    });

    return NextResponse.json({
      message: "Patients with unfinished Dental Lab Forms retrieved successfully",
      success: true,
      data: result,
      count: result.length
    });
  } catch (error) {
    console.error("Error retrieving patients with unfinished forms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to determine if a form is finished
function isFormFinished(form: IDentalLabForm): boolean {
  // Check multiple indicators of completion
  // If ANY of these are true, consider the form finished
  
  // Based on your data, it seems like form.finish might be the main indicator
  // but there's conflicting data with stage.finish
  
  // Priority: if form.finish exists, use that
  if (form.finish !== undefined) {
    return form.finish === true;
  }
  
  // Otherwise check other indicators
  return (
    form.finish === true ||
    form.modelacceptance === true ||
    form.delivered === true ||
    form.completed === true ||
    form.isFinished === true ||
    form.status === 'completed' ||
    form.status === 'finished'
  );
}