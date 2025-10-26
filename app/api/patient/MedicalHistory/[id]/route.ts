import { NextRequest, NextResponse } from 'next/server';
import MedicalFinding from '@/app/(models)/MedicalFinding';
import Patient from '@/app/(models)/Patient';
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
import Disease from '@/app/(models)/disease';
import User from '@/app/(models)/User';
import Branch from '@/app/(models)/branch';

connect();

interface MedicalFinding {
  createdAt: string;
  // Add other fields as needed
}

// Create a new medical finding 
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);

  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "patient ID is required" }, { status: 400 });
    }

    if (typeof request === 'object' && request !== null && 'user' in request) {
      const user = (request as { user: { id: string; username: string } }).user;
      
      const {
        Recommendation,
        ChiefComplaint,
        DentalHistory,
        PhysicalExamination,
        HistoryPresent,
        PresentCondition,
        DrugAllergy,
        Diagnosis,
        IntraoralExamination,
        ExtraoralExamination,
        Investigation,
        Assessment,
        NextProcedure,
        TreatmentPlan,
        TreatmentDone,
        diseases
      } = await request.json();

      const createdBy = {
        id: user.id,
        username: user.username,
      };
     const fullUser = await User.findById(createdBy.id).select('branch').exec();
    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
      // Validate patient existence
      const patient = await Patient.findById(id).exec();
      if (!patient) {
        return NextResponse.json({ error: "Patient not found" }, { status: 404 });
      }

      // Create new MedicalFinding
      const newMedicalFinding = new MedicalFinding({
        Recommendation,
        ChiefComplaint,
        DentalHistory,
        PhysicalExamination,
        HistoryPresent,
        PresentCondition,
        DrugAllergy,
        Diagnosis,
        IntraoralExamination,
        ExtraoralExamination,
        Investigation,
        Assessment,
        NextProcedure,
        TreatmentPlan,
        TreatmentDone,
              branch: fullUser.branch, // Add branch from the logged-in user

        patientId:patient._id,
        createdBy,
        diseases: diseases?.map((diseaseId: string) => ({
          disease: diseaseId,
          diseaseTime: new Date(),
        })) || [],
      
      });

      const savedFinding = await newMedicalFinding.save();
      
      // Update patient's medical findings array
      if (!patient.MedicalFinding) {
        patient.MedicalFinding = [];
      }

      patient.MedicalFinding.push(savedFinding._id);
      await patient.save();

      return NextResponse.json({
        message: "Medical finding created successfully",
        success: true,
        data: savedFinding,
      });
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error creating medical finding:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}




export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }
    await Disease.aggregate([{ $sample: { size: 1 } }]);
    await Branch.aggregate([{ $sample: { size: 1 } }]);
    
    // Find the patient by ID and populate MedicalFinding with multiple paths
    const patientResult = await Patient.findById(id)
      .populate({
        path: 'MedicalFinding',
        populate: [
          {
            path: 'diseases.disease',
            model: 'Disease',
            select: 'disease',
          },
          {
            path: 'branch',
            model: 'Branch',
            select: 'name ', // Select the fields you need from Branch
          }
        ]
      })
      .select('-__v -updatedAt') // Exclude unnecessary fields
      .lean() // Convert to plain JavaScript object
      .exec();

    const patient = Array.isArray(patientResult) ? patientResult[0] : patientResult;

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Extract basic patient information
    const patientData = {
      Locked: patient.Locked,
      firstname: patient.firstname,
      lastname: patient.lastname,
      cardno: patient.cardno,
      sex: patient.sex,
      age: patient.age,
      phoneNumber: patient.phoneNumber,
      // Add any other patient fields you want to include
    };

    // Handle case when there are no medical findings
    if (!patient.MedicalFinding || patient.MedicalFinding.length === 0) {
      return NextResponse.json({ 
        message: "Patient data retrieved successfully",
        success: true,
        patient: patientData,
        medicalFindings: []
      });
    }

    // Sort and format medical findings
    const sortedFindings = patient.MedicalFinding.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const formattedFindings = sortedFindings.map((finding: any) => {
      const { diseases = [], branch, ...rest } = finding;

      return {
        diseases: Array.isArray(diseases)
          ? diseases.map((disease: any) =>
              disease.disease?.disease || "Unknown disease"
            )
          : [],
        branch: branch ? {
          _id: branch._id,
          branchName: branch.name,
       
          // Add other branch fields as needed
        } : null,
        ...rest, // This includes all other fields in the MedicalFinding document
      };
    });

    // Return both patient data and medical findings
    return NextResponse.json({
      message: "Patient data and medical findings retrieved successfully",
      success: true,
      patient: patientData,
      medicalFindings: formattedFindings
    });
  } catch (error) {
    console.error("Error retrieving patient data:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}