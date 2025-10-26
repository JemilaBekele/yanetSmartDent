import { NextRequest, NextResponse } from "next/server";
import { authorizedMiddleware } from "@/app/helpers/authentication";
import Patient from "@/app/(models)/Patient";
import DentalChart from "@/app/(models)/DentalChart";
import mongoose from "mongoose";

// =========================
// 🦷 GET — Retrieve Dental Charts by Patient ID
// =========================
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Dental Chart ID is required" }, { status: 400 });
    }

    // Find dental chart by ID
    const dentalChart = await DentalChart.findById(id)
      .populate('patient', 'firstname age phoneNumber sex cardno Town KK updatedAt')
      .exec();

    if (!dentalChart) {
      return NextResponse.json(
        { error: "Dental chart not found" },
        { status: 404 }
      );
    }

    const patientData = dentalChart.patient;

    return NextResponse.json({
      message: "Dental chart retrieved successfully",
      success: true,
      data: {
        patient: patientData,
        DentalChart: dentalChart
      },
    });
  } catch (error) {
    console.error("Error retrieving dental chart:", error);
    
    // Handle invalid ObjectId format
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json({ 
        error: "Invalid dental chart ID format" 
      }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
// =========================
// 🦷 PATCH — Update an Existing Dental Chart
// =========================
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const authResponse = await authorizedMiddleware(request);
  if (authResponse) return authResponse;

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Dental Chart ID is required" }, { status: 400 });
    }

    const user = (request as { user: { id: string; username: string } }).user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized user" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      teeth = [],
      customRootLayers = [],
      activeTab = "surface",
      selectedTooth = null,
      selectedCondition = "NEED_EXTRACTION",
      selectedRootCanalCondition = "NORMAL",
      brushSettings = { brushSize: 8, selectedColor: "#FF1493" },
      ...updates 
    } = body;

    console.log("Received PATCH dental chart data:", {
      teethCount: teeth.length,
      customRootLayersCount: customRootLayers.length,
      hasBrushSettings: !!brushSettings,
      otherUpdates: Object.keys(updates)
    });

    // Enhanced validation and sanitization for customRootLayers
    const sanitizedCustomRootLayers = customRootLayers.map((customLayer: any) => {
      // Ensure we have valid layers array
      const layers = Array.isArray(customLayer.layers) ? customLayer.layers : [];
      
      return {
        toothNumber: Number(customLayer.toothNumber) || 1,
        layers: layers.map((layer: any) => {
          // Generate ID if not provided
          const layerId = layer.id || `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          // Ensure points is a valid array
          const points = Array.isArray(layer.points) ? layer.points : [];
          
          // Ensure coordinates is a valid array with proper structure
          const coordinates = Array.isArray(layer.coordinates) 
            ? layer.coordinates.map((coord: any) => ({
                x: Number(coord.x) || 0,
                y: Number(coord.y) || 0,
                timestamp: coord.timestamp || new Date()
              }))
            : [];

          // Create SVG data if not provided but points exist
          let svgData = layer.svgData;
          if (!svgData && points.length > 0) {
            svgData = pointsToPathData(points);
          }

          // VALIDATION FIX: Ensure color is valid hex or transparent
          const color = layer.color || "#FF1493";
          const isValidColor = /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color) || color === 'transparent';
          const validatedColor = isValidColor ? color : "#FF1493";

          return {
            id: layerId,
            position: layer.position || "CUSTOM",
            condition: layer.condition || "NORMAL",
            color: validatedColor, // Use validated color
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

    // VALIDATION FIX: Sanitize brushSettings to ensure valid color
    const sanitizedBrushSettings = {
      brushSize: Number(brushSettings?.brushSize) || 8,
      selectedColor: (() => {
        const color = brushSettings?.selectedColor || "#FF1493";
        const isValidColor = /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color);
        return isValidColor ? color : "#FF1493";
      })()
    };

    // Build update data with proper structure for the model
    const updateData: any = {
      ...updates,
      updatedBy: { id: user.id, username: user.username },
      updateTime: new Date(),
    };

    // Add specific fields if they exist in the request with sanitized data
    if (teeth !== undefined) updateData.teeth = teeth;
    if (customRootLayers !== undefined) updateData.customRootLayers = sanitizedCustomRootLayers;
    if (activeTab !== undefined) updateData.activeTab = activeTab;
    if (selectedTooth !== undefined) updateData.selectedTooth = selectedTooth;
    if (selectedCondition !== undefined) updateData.selectedCondition = selectedCondition;
    if (selectedRootCanalCondition !== undefined) updateData.selectedRootCanalCondition = selectedRootCanalCondition;
    if (brushSettings !== undefined) updateData.brushSettings = sanitizedBrushSettings;

    console.log("Sanitized update data:", {
      customRootLayersCount: sanitizedCustomRootLayers.length,
      brushSettings: sanitizedBrushSettings,
      teethCount: teeth?.length || 0
    });

    // Find existing chart first to add change history
    const existingChart = await DentalChart.findById(id);
    if (!existingChart) {
      return NextResponse.json({ error: "Dental chart not found" }, { status: 404 });
    }

    // Determine change type for history
    let changeType = "STATUS_CHANGE";
    let toothNumber = null;
    let details = {};

    if (teeth && teeth.length > 0) {
      changeType = "SURFACE_UPDATE";
      toothNumber = selectedTooth || teeth[0]?.toothNumber;
      details = { teethUpdated: teeth.length };
    } else if (customRootLayers && customRootLayers.length > 0) {
      changeType = "CUSTOM_PAINTING";
      toothNumber = selectedTooth || customRootLayers[0]?.toothNumber;
      details = { 
        customLayersUpdated: customRootLayers.length,
        sanitizedLayersCount: sanitizedCustomRootLayers.length
      };
    } else if (selectedCondition || selectedRootCanalCondition) {
      changeType = "STATUS_CHANGE";
      toothNumber = selectedTooth;
      details = { 
        selectedCondition, 
        selectedRootCanalCondition 
      };
    } else if (brushSettings) {
      changeType = "SETTINGS_UPDATE";
      details = { 
        brushSize: sanitizedBrushSettings.brushSize,
        selectedColor: sanitizedBrushSettings.selectedColor
      };
    }

    // Add to change history before update
    existingChart.addChangeHistory({
      updatedBy: { id: user.id, username: user.username },
      changeType,
      toothNumber,
      details,
      reason: "Updated via PATCH API"
    });

    // Update dental chart with validation
    const updatedDentalChart = await DentalChart.findByIdAndUpdate(
      id,
      { 
        ...updateData,
        $inc: { version: 1 } // Increment version for conflict resolution
      },
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    ).populate('patient', 'firstname age phoneNumber sex cardno Town KK updatedAt').exec();

    if (!updatedDentalChart) {
      return NextResponse.json({ error: "Dental chart not found after update" }, { status: 404 });
    }

    console.log("Successfully updated dental chart via PATCH:", {
      chartId: updatedDentalChart._id,
      version: updatedDentalChart.version,
      customPaintings: updatedDentalChart.customRootLayers.reduce((total: number, tooth: any) => total + tooth.layers.length, 0),
      changeType
    });

    return NextResponse.json({
      message: "Dental chart updated successfully",
      success: true,
      data: updatedDentalChart,
    });
  } catch (error) {
    console.error("Error updating dental chart:", error);
    
    // Enhanced error handling
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
    
    // Handle cast errors (invalid ObjectId)
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json({ 
        error: "Invalid dental chart ID",
        details: `Invalid ID format: ${error.value}`
      }, { status: 400 });
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      return NextResponse.json({ 
        error: "Duplicate entry",
        details: "A dental chart with this identifier already exists"
      }, { status: 409 });
    }
    
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// Helper function to provide suggestions for validation errors
function getValidationSuggestions(error: mongoose.Error.ValidationError): string[] {
  const suggestions: string[] = [];
  
  Object.keys(error.errors).forEach(field => {
    const err = error.errors[field];
    
    if (err.kind === 'regexp' && field.includes('color')) {
      suggestions.push(`Color fields must be valid hex colors (like #FF1493) or "transparent"`);
    }
    
    if (err.kind === 'enum') {
      suggestions.push(``);
    }
    
    if (err.kind === 'Number' || err.name === 'CastError') {
      suggestions.push(`Field ${field} must be a valid number`);
    }

    if (err.kind === 'required') {
      suggestions.push(`Field ${field} is required`);
    }
  });
  
  return suggestions.length > 0 ? suggestions : ['Check all field values and try again'];
}

// Helper function to validate and sanitize color values
function validateColor(color: string, defaultColor: string = "#FF1493"): string {
  if (!color) return defaultColor;
  
  const isValidHex = /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(color);
  const isTransparent = color === 'transparent';
  
  return (isValidHex || isTransparent) ? color : defaultColor;
}

// Enhanced pointsToPathData function with error handling
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

// =========================
// 🦷 POST — Create or Update Dental Chart for Patient
// =========================
// =========================
// 🦷 DELETE — Remove a Dental Chart
// =========================
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await authorizedMiddleware(request);

  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json({ error: "Dental Chart ID is required" }, { status: 400 });
    }

    const deletedChart = await DentalChart.findByIdAndDelete(id).exec();

    if (!deletedChart) {
      return NextResponse.json({ error: "Dental Chart not found" }, { status: 404 });
    }

    // Remove reference from patient if linked
    const patient = await Patient.findOneAndUpdate(
      { dentalCharts: id },
      { $pull: { dentalCharts: id } },
      { new: true }
    );

    if (!patient) {
      console.warn(`No patient found with Dental Chart ID: ${id}`);
    }

    return NextResponse.json({
      message: "Dental chart deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting dental chart:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
