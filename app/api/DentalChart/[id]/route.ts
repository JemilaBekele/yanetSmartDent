import { NextRequest, NextResponse } from "next/server";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import Patient from "@/app/(models)/Patient";
import DentalChart from "@/app/(models)/DentalChart";
import mongoose from "mongoose";

// =============================
// 🦷 CREATE DENTAL CHART (POST)
// =============================
// =============================
// 🦷 POST - Create/Update Dental Chart (FIXED NOTES SAVING)
// =============================
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  await authorizedMiddleware(request);

  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const user = (request as { user: { id: string; username: string } }).user;
    
    const { 
      teeth = [],
      customRootLayers = [],
      activeTab = "surface",
      selectedTooth = null,
      selectedCondition = "NEED_EXTRACTION",
      selectedRootCanalCondition = "NORMAL",
      brushSettings = { brushSize: 8, selectedColor: "#FF1493" },
      notes = [],
      changeHistory = []
    } = await request.json();

 
    // FIXED: Process teeth data to include notes from frontend
    const processedTeeth = teeth.map((tooth: any) => {
      // Find if there's a note for this tooth in the notes array
      const toothNote = notes.find((note: any) => note.toothNumber === tooth.toothNumber);
      
      return {
        ...tooth,
        // FIX: Ensure both notes and generalNote fields are populated
        notes: toothNote?.content || tooth.notes || "",
        generalNote: toothNote?.content || tooth.generalNote || "",
        lastModified: new Date()
      };
    });

   

    // Enhanced validation and sanitization for customRootLayers
    const sanitizedCustomRootLayers = customRootLayers.map((customLayer: any) => {
      const layers = Array.isArray(customLayer.layers) ? customLayer.layers : [];
      
      return {
        toothNumber: Number(customLayer.toothNumber) || 1,
        layers: layers.map((layer: any) => {
          const layerId = layer.id || `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          const points = Array.isArray(layer.points) ? layer.points : [];
          
          const coordinates = Array.isArray(layer.coordinates) 
            ? layer.coordinates.map((coord: any) => ({
                x: Number(coord.x) || 0,
                y: Number(coord.y) || 0,
                timestamp: coord.timestamp || new Date()
              }))
            : [];

          let svgData = layer.svgData;
          if (!svgData && points.length > 0) {
            svgData = pointsToPathData(points);
          }

          const color = layer.color || "#FF1493";
          const isValidColor = /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color) || color === 'transparent';
          const validatedColor = isValidColor ? color : "#FF1493";

          return {
            id: layerId,
            position: layer.position || "CUSTOM",
            condition: layer.condition || "NORMAL",
            color: validatedColor,
            isCustomPainting: layer.isCustomPainting !== undefined ? layer.isCustomPainting : true,
            brushSize: Number(layer.brushSize) || 8,
            svgData: svgData,
            points: points,
            coordinates: coordinates,
            timestamp: layer.timestamp ? new Date(layer.timestamp) : new Date()
          };
        }),
        lastUpdated: new Date()
      };
    });

    // Process change history from frontend
    const sanitizedChangeHistory = Array.isArray(changeHistory) ? changeHistory.map((change: any) => ({
      updatedBy: change.updatedBy || { id: user.id, username: user.username },
      updateTime: change.updateTime ? new Date(change.updateTime) : new Date(),
      changeType: change.changeType || "NOTE_UPDATE",
      toothNumber: Number(change.toothNumber) || null,
      details: change.details || {},
      reason: change.reason || "User action"
    })) : [];

    // Validate patient
    const patient = await Patient.findById(id).exec();
    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    let existingChart = await DentalChart.findOne({ 
      patient: patient._id, 
      isChild: false 
    });

    const userReference = {
      id: user.id,
      username: user.username,
    };

    // Sanitize brushSettings
    const sanitizedBrushSettings = {
      brushSize: Number(brushSettings.brushSize) || 8,
      selectedColor: (() => {
        const color = brushSettings.selectedColor || "#FF1493";
        const isValidColor = /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color);
        return isValidColor ? color : "#FF1493";
      })()
    };

    if (existingChart) {
      // FIXED: Update existing dental chart with PROCESSED teeth data (includes notes)
      existingChart.teeth = processedTeeth; // Use processedTeeth instead of raw teeth
      existingChart.customRootLayers = sanitizedCustomRootLayers;
      existingChart.activeTab = activeTab;
      existingChart.selectedTooth = selectedTooth;
      existingChart.selectedCondition = selectedCondition;
      existingChart.selectedRootCanalCondition = selectedRootCanalCondition;
      existingChart.brushSettings = sanitizedBrushSettings;
      
      // Add change history for notes if any were added/updated
      const notesAdded = notes.filter(note => note.content && note.content.trim() !== '');
      if (notesAdded.length > 0) {
        notesAdded.forEach(note => {
          existingChart.addChangeHistory({
            updatedBy: userReference,
            changeType: "NOTE_UPDATE",
            toothNumber: note.toothNumber,
            details: {
              noteType: note.noteType,
              content: note.content,
              previousContent: "" // Track changes if needed
            },
            reason: `Note ${note.toothNumber ? `for tooth ${note.toothNumber}` : 'general'} updated`
          });
        });
      }

      // Add frontend change history
      if (sanitizedChangeHistory.length > 0) {
        sanitizedChangeHistory.forEach(change => {
          existingChart.addChangeHistory(change);
        });
      } else if (notesAdded.length > 0 || processedTeeth.length > 0) {
        // Fallback: Add change history if notes or teeth were updated
        existingChart.addChangeHistory({
          updatedBy: userReference,
          changeType: "NOTE_UPDATE",
          details: {
            teethUpdated: processedTeeth.length,
            notesAdded: notesAdded.length,
            customPaintings: sanitizedCustomRootLayers.reduce((total: number, tooth: any) => total + tooth.layers.length, 0)
          },
          reason: "Updated dental chart with notes and conditions"
        });
      }

      // Increment version
      existingChart.version += 1;

      const savedChart = await existingChart.save();


      return NextResponse.json({
        message: "Dental chart updated successfully",
        success: true,
        data: savedChart,
      });
    } else {
      // FIXED: Create new dental chart with PROCESSED teeth data (includes notes)
      const newDentalChart = new DentalChart({
        patient: patient._id,
        teeth: processedTeeth, // Use processedTeeth instead of raw teeth
        customRootLayers: sanitizedCustomRootLayers,
        activeTab,
        selectedTooth,
        selectedCondition,
        selectedRootCanalCondition,
        brushSettings: sanitizedBrushSettings,
        createdBy: userReference,
        version: 1
      });

      // Add initial change history that includes notes information
      const notesAdded = notes.filter(note => note.content && note.content.trim() !== '');
      newDentalChart.addChangeHistory({
        updatedBy: userReference,
        changeType: "NOTE_UPDATE",
        details: {
          teethCount: processedTeeth.length,
          notesAdded: notesAdded.length,
          customPaintings: sanitizedCustomRootLayers.reduce((total: number, tooth: any) => total + tooth.layers.length, 0),
          notes: notesAdded.map(note => ({
            toothNumber: note.toothNumber,
            noteType: note.noteType,
            contentPreview: note.content.substring(0, 50) + (note.content.length > 50 ? '...' : '')
          }))
        },
        reason: "Created new dental chart with notes and conditions"
      });

      const savedChart = await newDentalChart.save();

      // Link to patient
      if (!patient.DentalChart) {
        patient.DentalChart = [];
      }
      patient.DentalChart.push(savedChart._id);
      await patient.save();

   
      return NextResponse.json({
        message: "Dental chart created successfully",
        success: true,
        data: savedChart,
      });
    }
  } catch (error) {
    console.error("Error saving dental chart:", error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      console.error("Validation errors:", error.errors);
      
      const errorDetails = Object.values(error.errors).map((err: any) => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));

      return NextResponse.json({ 
        error: "Validation error",
        details: errorDetails,
        suggestions: getValidationSuggestions(error)
      }, { status: 400 });
    }

    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json({ 
        error: "Invalid data format",
        details: `Invalid ${error.path}: ${error.value}`
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}
function getValidationSuggestions(error: mongoose.Error.ValidationError): string[] {
  const suggestions: string[] = [];
  
  Object.keys(error.errors).forEach(field => {
    const err = error.errors[field];
    
    if (err.kind === 'regexp' && field.includes('color')) {
      suggestions.push(`Color fields must be valid hex colors (like #FF1493) or "transparent"`);
    }
    
    if (err.kind === 'enum') {
      suggestions.push(`Field ${field} must be one of the allowed values`);
    }
    
    if (err.kind === 'Number' || err.name === 'CastError') {
      suggestions.push(`Field ${field} must be a valid number`);
    }

    // NEW: Handle note-related validation
    if (field.includes('note') || field.includes('Note')) {
      suggestions.push(`Note fields must be valid text strings`);
    }
  });
  
  return suggestions.length > 0 ? suggestions : ['Check all field values and try again'];
}
function pointsToPathData(points: any[]): string {
  try {
    if (!points || points.length === 0) return '';
    
    let pathData = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathData += ` L ${points[i].x} ${points[i].y}`;
    }
    return pathData;
  } catch (error) {
    console.error('Error converting points to SVG path:', error);
    return '';
  }
}
// Enhanced helper function to process teeth data with notes

// =============================
// 🦷 HELPER FUNCTIONS
// =============================

// Helper function to extract notes from teeth data
// function extractNotesFromTeeth(teeth: any[]): any[] {
//   const notes: any[] = [];
  
//   if (!Array.isArray(teeth)) return notes;
  
//   teeth.forEach(tooth => {
//     if (!tooth) return;
    
//     // Extract from generalNote - only if it has content
//     if (tooth.generalNote && typeof tooth.generalNote === 'string' && tooth.generalNote.trim() !== '') {
//       notes.push({
//         toothNumber: tooth.toothNumber,
//         noteType: 'GENERAL',
//         content: tooth.generalNote.trim(),
//         timestamp: new Date(),
//         createdBy: { id: 'system', username: 'system' } // Will be overridden by user data
//       });
//     }
//   });
  
//   return notes;
// }

// Helper function to provide suggestions for validation errors


// Helper function to validate and sanitize color values
// function validateColor(color: string, defaultColor: string = "#FF1493"): string {
//   if (!color) return defaultColor;
  
//   const isValidHex = /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color);
//   const isTransparent = color === 'transparent';
  
//   return (isValidHex || isTransparent) ? color : defaultColor;
// }

// Enhanced pointsToPathData function with error handling


// // Helper function to provide suggestions for validation errors
// function getValidationSuggestions(error: mongoose.Error.ValidationError): string[] {
//   const suggestions: string[] = [];
  
//   Object.keys(error.errors).forEach(field => {
//     const err = error.errors[field];
    
//     if (err.kind === 'regexp' && field.includes('color')) {
//       suggestions.push(`Color fields must be valid hex colors (like #FF1493) or "transparent"`);
//     }
    
//     if (err.kind === 'enum') {
//       suggestions.push(`Field ${field} must be one of the allowed values`);
//     }
    
//     if (err.kind === 'Number' || err.name === 'CastError') {
//       suggestions.push(`Field ${field} must be a valid number`);
//     }

//     // NEW: Handle note-related validation
//     if (field.includes('note') || field.includes('Note')) {
//       suggestions.push(`Note fields must be valid text strings`);
//     }
//   });
  
//   return suggestions.length > 0 ? suggestions : ['Check all field values and try again'];
// }

// // Helper function to validate and sanitize color values
// function validateColor(color: string, defaultColor: string = "#FF1493"): string {
//   if (!color) return defaultColor;
  
//   const isValidHex = /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color);
//   const isTransparent = color === 'transparent';
  
//   return (isValidHex || isTransparent) ? color : defaultColor;
// }

// // Enhanced pointsToPathData function with error handling
// function pointsToPathData(points: any[]): string {
//   try {
//     if (!points || points.length === 0) return '';
    
//     let pathData = `M ${points[0].x} ${points[0].y}`;
//     for (let i = 1; i < points.length; i++) {
//       pathData += ` L ${points[i].x} ${points[i].y}`;
//     }
//     return pathData;
//   } catch (error) {
//     console.error('Error converting points to SVG path:', error);
//     return '';
//   }
// }

// // NEW: Helper function to extract note changes from teeth data
// function extractNotesFromTeeth(teeth: any[]): any[] {
//   const notes: any[] = [];
  
//   teeth.forEach(tooth => {
//     if (tooth.generalNote && tooth.generalNote.trim() !== '') {
//       notes.push({
//         toothNumber: tooth.toothNumber,
//         noteType: 'GENERAL',
//         content: tooth.generalNote,
//         timestamp: new Date()
//       });
//     }
    
//     if (tooth.notes && tooth.notes.trim() !== '') {
//       notes.push({
//         toothNumber: tooth.toothNumber,
//         noteType: 'SPECIFIC',
//         content: tooth.notes,
//         timestamp: new Date()
//       });
//     }
//   });
  
//   return notes;
// }

// Helper function to provide suggestions for validation errors
// function getValidationSuggestions(error: mongoose.Error.ValidationError): string[] {
//   const suggestions: string[] = [];
  
//   Object.keys(error.errors).forEach(field => {
//     const err = error.errors[field];
    
//     if (err.kind === 'regexp' && field.includes('color')) {
//       suggestions.push(`Color fields must be valid hex colors (like #FF1493) or "transparent"`);
//     }
    
//     if (err.kind === 'enum') {
//       suggestions.push(``);
//     }
    
//     if (err.kind === 'Number' || err.name === 'CastError') {
//       suggestions.push(`Field ${field} must be a valid number`);
//     }
//   });
  
//   return suggestions.length > 0 ? suggestions : ['Check all field values and try again'];
// }

// // Helper function to validate and sanitize color values
// function validateColor(color: string, defaultColor: string = "#FF1493"): string {
//   if (!color) return defaultColor;
  
//   const isValidHex = /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color);
//   const isTransparent = color === 'transparent';
  
//   return (isValidHex || isTransparent) ? color : defaultColor;
// }

// // Enhanced pointsToPathData function with error handling
// function pointsToPathData(points: any[]): string {
//   try {
//     if (!points || points.length === 0) return '';
    
//     let pathData = `M ${points[0].x} ${points[0].y}`;
//     for (let i = 1; i < points.length; i++) {
//       pathData += ` L ${points[i].x} ${points[i].y}`;
//     }
//     return pathData;
//   } catch (error) {
//     console.error('Error converting points to SVG path:', error);
//     return '';
//   }
// }

// Helper function to convert points to SVG path data (same as frontend)


// ============================================
// 🩺 GET DENTAL CHARTS BY PATIENT ID (GET)
// ============================================
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: "Patient ID is required" }, { status: 400 });
    }

    const patient = await Patient.findById(id)
      .populate({
        path: "DentalChart",
        model: "DentalChart",
        options: { sort: { createdAt: -1 } },
      })
      .exec();

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Patient dental chart retrieved successfully",
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
          updatedAt: patient.updatedAt,
        },
        DentalChart: patient.DentalChart || [],
      },
    });
  } catch (error) {
    console.error("Error fetching dental chart:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
