import { NextRequest, NextResponse } from "next/server";
import Patient from "@/app/(models)/Patient";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import { connect } from "@/app/lib/mongodb";
import DentalLabForm from "@/app/(models)/labratory";
import User from "@/app/(models)/User";

connect();

// Define DentalLabForm interface
interface IDentalLabForm {
  createdAt: Date;
  // Add other properties as needed
}

// ====================== CREATE Dental Lab Form ======================
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await authorizedMiddleware(request);

  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }

    const user = (request as { user: { id: string; username: string } }).user;

    const {
      toothNumbers,
      toothNumberTwo,
      restoration,
      enclosedWith,
      material,
      shade,
      margin,
      occlusalStaining,
      occlusalClearance,
      stage,
      ponticDesign,
      collarDesign,
      specifications,
      notes,
      deliveryDate,
    } = await request.json();

    const fullUser = await User.findById(user.id).select('branch').exec();
    if (!fullUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if patient exists
    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Create new DentalLabForm with proper structure
    const newDentalLabForm = new DentalLabForm({
      patient: patient._id,
               branch: fullUser.branch, // Add branch from the logged-in user
      deliveryDate,
      toothNumbers: toothNumbers || [],
      toothNumberTwo: toothNumberTwo || [],
      restoration: {
        jointCrown: restoration?.jointCrown || false,
        separateCrown: restoration?.separateCrown || false,
        bridge: restoration?.bridge || false,
        other: restoration?.other || false,
      },
      enclosedWith: {
        impUpper: enclosedWith?.impUpper || false,
        impLower: enclosedWith?.impLower || false,
        vite: enclosedWith?.vite || false,
        modelUpper: enclosedWith?.modelUpper || false,
        modelLower: enclosedWith?.modelLower || false,
        bite: enclosedWith?.bite || false,
        other: enclosedWith?.other || false,
      },
      material: {
        pfm: material?.pfm || false,
        pfmFacing: material?.pfmFacing || false,
        fullMetal: material?.fullMetal || false,
        tiliteFacing: material?.tiliteFacing || false,
        tilite: material?.tilite || false,
        tiliteFullMetal: material?.tiliteFullMetal || false,
        tiliteInlayOnlay: material?.tiliteInlayOnlay || false,
        ywPFM: material?.ywPFM || false,
        ywFacing: material?.ywFacing || false,
        ywFullMetal: material?.ywFullMetal || false,
        bruxzirCrown: material?.bruxzirCrown || false,
        bruxzirBridge: material?.bruxzirBridge || false,
        bruxzirInlayOnlay: material?.bruxzirInlayOnlay || false,
        ywUltraTCrown: material?.ywUltraTCrown || false,
        ywUltraTBridge: material?.ywUltraTBridge || false,
        ywZirconCrown: material?.ywZirconCrown || false,
        ywZirconBridge: material?.ywZirconBridge || false,
        lavaPremium: material?.lavaPremium || false,
        lavaClassic: material?.lavaClassic || false,
        lavaEssential: material?.lavaEssential || false,
        ipsEmaxSingleCrown: material?.ipsEmaxSingleCrown || false,
        ipsEmaxLaminate: material?.ipsEmaxLaminate || false,
        ipsEmaxInlayOnlay: material?.ipsEmaxInlayOnlay || false,
        ipsEmpressSingleCrown: material?.ipsEmpressSingleCrown || false,
        ipsEmpressLaminate: material?.ipsEmpressLaminate || false,
        ipsEmpressInlayOnlay: material?.ipsEmpressInlayOnlay || false,
        mockup: material?.mockup || false,
        provisional: material?.provisional || false,
      },
      shade: {
        code: shade?.code || "",
        diagram: shade?.diagram || ""
      },
      margin: {
        shoulderMargin: margin?.shoulderMargin || false,
        gingivalMargin: margin?.gingivalMargin || false,
        none: margin?.none || false
      },
      occlusalStaining: {
        none: occlusalStaining?.none || false,
        light: occlusalStaining?.light || false,
        medium: occlusalStaining?.medium || false,
        dark: occlusalStaining?.dark || false
      },
      occlusalClearance: {
        callDoctor: occlusalClearance?.callDoctor || false,
        markOpposing: occlusalClearance?.markOpposing || false,
        metalIsland: occlusalClearance?.metalIsland || false,
      },
      stage: {
        metalTryIn: stage?.metalTryIn || false,
        copingTryIn: stage?.copingTryIn || false,
        bisqueTryIn: stage?.bisqueTryIn || false,
        finish: stage?.finish || false
      },
      ponticDesign: {
        modifiedRidge: ponticDesign?.modifiedRidge || false,
        fullRidge: ponticDesign?.fullRidge || false,
        hygienic: ponticDesign?.hygienic || false,
        ovate: ponticDesign?.ovate || false
      },
      collarDesign: {
        noCollar: collarDesign?.noCollar || false,
        lingualCollar: collarDesign?.lingualCollar || false,
        collar360: collarDesign?.collar360 || false
      },
      specifications,
      notes,
      finish: false, // New forms are unfinished by default
      createdBy: {
        id: user.id,
        username: user.username,
      },
    });

    const savedForm = await newDentalLabForm.save();
    console.log("Saved Dental Lab Form:", savedForm);

    // Link to patient
    patient.DentalLabForm = patient.DentalLabForm || [];
    patient.DentalLabForm.push(savedForm._id);
    await patient.save();
    console.log("Updated Patient with new Dental Lab Form:", patient);

    return NextResponse.json({
      message: "Dental Lab Form created successfully",
      success: true,
      data: savedForm,
    });
  } catch (error) {
    console.error("Error creating Dental Lab Form:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ====================== GET Dental Lab Forms ======================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { error: "Patient ID is required" },
        { status: 400 }
      );
    }
await DentalLabForm.aggregate([{ $sample: { size: 1 } }]);
    // Find patient with populated DentalLabForms
    const patient = await Patient.findById(id)
         .populate({
        path: "DentalLabForm", // Ensure this field exists in your Patient schema
        model: "DentalLabForm",
        options: { sort: { createdAt: -1 } }, 
         populate: [
    {
      path: "branch",
      model: "Branch"
    },
   
  ]// Sort by creation date
      })
      .exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" });
    }

    if (!patient.DentalLabForm || patient.DentalLabForm.length === 0) {
      return NextResponse.json({
        message: "No Dental Lab Forms available for this patient",
        data: [],
      });
    }

    // Sort by creation date descending
    const sortedForms = patient.DentalLabForm.sort(
      (a: IDentalLabForm, b: IDentalLabForm) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({
      message: "Dental Lab Forms retrieved successfully",
      success: true,
      data: sortedForms,
    });
  } catch (error) {
    console.error("Error retrieving Dental Lab Forms:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}