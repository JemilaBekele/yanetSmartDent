import { NextRequest, NextResponse } from 'next/server';
import MedicalFinding from '@/app/(models)/MedicalFinding';
import Patient from "@/app/(models)/Patient";
import { authorizedMiddleware } from '@/app/helpers/authentication';
import { connect } from '@/app/lib/mongodb';
connect();
interface MedicalFinding {
  createdAt: string; // or Date, depending on how you store it
  // Add other fields as needed
}

import { Types } from 'mongoose';

interface TreatmentCategoryType {
  // General Treatments
  Extraction?: boolean;
  Scaling?: boolean;
  Rootcanal?: boolean;
  Filling?: boolean;
  Bridge?: boolean;
  Crown?: boolean;
  Apecectomy?: boolean;
  Fixedorthodonticappliance?: boolean;
  Removableorthodonticappliance?: boolean;
  Removabledenture?: boolean;
  Splinting?: boolean;

  // Restorative Dentistry
  Restorative?: {
    AmalgamFilling?: boolean;
    CompositeFilling?: boolean;
    GlassIonomer?: boolean;
    TemporaryFilling?: boolean;
    CrownPreparation?: boolean;
    CrownCementation?: boolean;
    VeneerPlacement?: boolean;
    CoreBuildUp?: boolean;
    OnlayInlay?: boolean;
    ToothRecontouring?: boolean;
    other?: string;
  };

  // Endodontics
  Endodontic?: {
    RootCanalTreatment?: boolean;
    ReRootCanalTreatment?: boolean;
    PulpCappingDirect?: boolean;
    PulpCappingIndirect?: boolean;
    Pulpectomy?: boolean;
    Pulpotomy?: boolean;
    Apexification?: boolean;
    Apicoectomy?: boolean;
    RootCanalPost?: boolean;
    other?: string;
  };

  // Implant / Maxillofacial
  ImplantMaxillofacial?: {
    ImplantPlacement?: boolean;
    BoneGraft?: boolean;
    RidgeAugmentation?: boolean;
    SinusLift?: boolean;
    SoftTissueGraft?: boolean;
    ImplantExposure?: boolean;
    ImplantCrownDelivery?: boolean;
    MaxillofacialFractureRepair?: boolean;
    TMJDisorderManagement?: boolean;
    other?: string;
  };

  // Cosmetic / Aesthetic Dentistry
  CosmeticAesthetic?: {
    TeethWhiteningOffice?: boolean;
    TeethWhiteningHomeKit?: boolean;
    CompositeBonding?: boolean;
    DiastemaClosure?: boolean;
    VeneerPorcelain?: boolean;
    SmileMakeover?: boolean;
    GumContouring?: boolean;
    GingivalDepigmentation?: boolean;
    EnamelMicroabrasion?: boolean;
    ToothJewelry?: boolean;
    other?: string;
  };

  // Prosthodontics
  Prosthodontic?: {
    CompleteDenture?: boolean;
    PartialDenture?: boolean;
    FlexibleDenture?: boolean;
    ImplantSupportedOverdenture?: boolean;
    FixedPartialDenture?: boolean;
    CrownAndBridgeMaintenance?: boolean;
    ReliningRebasing?: boolean;
    DentureRepair?: boolean;
    OcclusalAdjustment?: boolean;
    NightGuardFabrication?: boolean;
    other?: string;
  };

  // Orthodontics
  Orthodontic?: {
    FixedAppliance?: boolean;
    RemovableAppliance?: boolean;
    RetainerPlacement?: boolean;
    BracketBonding?: boolean;
    WireChange?: boolean;
    Debonding?: boolean;
    SpaceMaintainer?: boolean;
    InterceptiveTreatment?: boolean;
    other?: string;
  };

  // Extra details per tooth
  ToothNumber?: string;
  Surface?: string;
  Quadrant?: string;
  Note?: string;
}

interface MedicalFindingType {
  _id: Types.ObjectId;
  Recommendation?: string;
  
  // Chief Complaint
  ChiefComplaint?: {
    None?: boolean;
    ImproveMySmile?: boolean;
    CrookedTeeth?: boolean;
    Crowding?: boolean;
    Spacing?: boolean;
    Crown?: boolean;
    Overbite?: boolean;
    Underbite?: boolean;
    Deepbite?: boolean;
    Crossbite?: boolean;
    ImpactedTeeth?: boolean;
    other?: string;
  };

  // Dental History
  DentalHistory?: {
    None?: boolean;
    PreviousOrthodonticTreatment?: boolean;
    MissingTooth?: boolean;
    UnderSizedTooth?: boolean;
    Attrition?: boolean;
    ImpactedTooth?: boolean;
    other?: string;
  };

  PhysicalExamination?: string;
  HistoryPresent?: string;
  PresentCondition?: string;
  DrugAllergy?: string;
  Diagnosis?: string;
  IntraoralExamination?: string;
  ExtraoralExamination?: string;
  Investigation?: string;
  Assessment?: string;
  NextProcedure?: string;

  // Treatment arrays
  TreatmentPlan: TreatmentCategoryType[];
  TreatmentDone: TreatmentCategoryType[];

  // Diseases
  diseases: Array<{
    disease: Types.ObjectId;
    diseaseTime: Date;
  }>;

  // References
  patientId: {
    id: Types.ObjectId;
  };
  createdBy: {
    id: string;
    username: string;
  };
  
  // Audit trail
  changeHistory: Array<{
    updatedBy: {
      id: string;
      username: string;
    };
    updateTime: Date;
  }>;

  createdAt: Date;
  updatedAt: Date;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResponse = await authorizedMiddleware(request);
  if (authResponse) return authResponse;

  try {
    const { id } = params; // Medical Finding ID
    if (!id) {
      return NextResponse.json({ error: "Finding ID is required" }, { status: 400 });
    }

    const body = await request.json(); // Parse the request body
    const { diseases, ...data } = body; // Separate `diseases` from other data

    const user = (request as { user: { id: string; username: string } }).user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }

    // Step 1: Prepare the updated data
    const updateData: any = {
      ...data,
      updatedBy: { id: user.id, username: user.username },
      // Handle diseases: map diseases to the desired structure
      diseases: diseases?.map((diseaseId: string) => ({
        disease: diseaseId,
        diseaseTime: new Date(), // Current timestamp
      })),
    };

    // Update the document and return the updated data
    const updatedFinding = await MedicalFinding.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true } // Return the updated document and run validators
    );

    if (!updatedFinding) {
      return NextResponse.json({ error: "Medical finding not found" }, { status: 404 });
    }

    // Step 2: Append to `changeHistory`
    const changeHistoryData = {
      updateTime: new Date(),
      updatedBy: { id: user.id, username: user.username },
      changes: data, // Track changes
    };

    await MedicalFinding.findByIdAndUpdate(
      id,
      { $push: { changeHistory: changeHistoryData } },
      { new: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Medical finding updated successfully",
        data: updatedFinding,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating medical finding:", error);
    return NextResponse.json({ error: "Error updating medical finding" }, { status: 500 });
  }
}
// Create a new medical finding
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await authorizedMiddleware(request);
  try {
    const { id } = params; // Treatment Plan ID

    if (!id) {
      return NextResponse.json({ error: "Treatment Plan ID is required" }, { status: 400 });
    }

    // Fetch the medical finding without populating `disease`
    const finding = await MedicalFinding.findById(id).lean<MedicalFindingType>(); // Use lean for a plain JavaScript object

    if (!finding) {
      return NextResponse.json({ error: "Medical finding not found" }, { status: 404 });
    }

    // Ensure diseases only include the `disease` field as an ID
    if (finding.diseases && Array.isArray(finding.diseases)) {
      finding.diseases = finding.diseases.map((d: any) => d.disease); // Extract only the disease ID
    }

    return NextResponse.json({
      message: "Medical finding retrieved successfully",
      success: true,
      data: finding,
    });
  } catch (error) {
    console.error("Error retrieving medical finding:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}






  










  

  

 







  





















  

  export async function DELETE(request: NextRequest,
    { params }: { params: { id: string } }) {
    // Authorization check
     authorizedMiddleware(request);
    
  
    try {
      const { id } = params; // Treatment Plan ID


      if (!id) {
        return NextResponse.json({ error: "Treatment Plan ID is required" }, { status: 400 });
      }
  
      
  
      // Find and delete the medical finding by ID
      const deletedFinding = await MedicalFinding.findByIdAndDelete(id).exec();
      if (!deletedFinding) {
        return NextResponse.json({ error: "Medical finding not found" }, { status: 404 });
      }
  
      // Remove the MedicalFinding reference from the associated patient's record
      const patient = await Patient.findOneAndUpdate(
        { MedicalFinding: id }, // Find patient with this MedicalFinding ID
        { $pull: { MedicalFinding: id } }, // Remove the MedicalFinding ID from the array
        { new: true } // Return the updated patient document
      );
  
      if (!patient) {
        console.warn(`No patient found with MedicalFinding ID: ${id}`);
      }
      return NextResponse.json({
        message: "Medical finding deleted successfully",
        success: true,
      });
    } catch (error) {
      console.error("Error deleting medical finding:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }