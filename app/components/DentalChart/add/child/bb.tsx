"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PatientComponent from "../PatientComponent";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons"; // Make sure to import the icons

// ... (all your existing interfaces and types remain the same)
interface ToothSurface {
  name: string;
  condition: string;
  color: string | null;
}

interface RootLayer {
  position: string;
  condition: string;
  color: string;
  isCustomPainting?: boolean;
  brushSize?: number;
  svgData?: any;
  coordinates?: any[];
  timestamp?: string;
}

interface ToothData {
  toothNumber: number;
  overallStatus: string;
  surfaces: ToothSurface[];
  roots: RootLayer[];
  notes: string;
  generalNote: string;
  lastModified: string;
}

interface CustomRootLayer {
  toothNumber: number;
  layers: RootLayer[];
  lastUpdated: string;
}

interface DentalChartData {
  _id: string;
  patient: string;
  teeth: ToothData[];
  customRootLayers: CustomRootLayer[];
  activeTab: string;
  selectedCondition: string;
  selectedRootCanalCondition: string;
  brushSettings: {
    brushSize: number;
    selectedColor: string;
  };
  createdBy: any;
  changeHistory: any[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

interface PatientData {
  id: string;
  firstname: string;
  age: number;
  phoneNumber: string;
  sex: string;
  cardno: string;
  Town: string;
  KK: string;
  updatedAt: string;
}

interface DentalChartResponse {
  message: string;
  success: boolean;
  data: {
    patient: PatientData;
    DentalChart: DentalChartData[];
  };
}

// Conditions mapping (same as in your editor)
const TOOTH_CONDITIONS = {
  CARIES: { label: "Caries Lesions", colorCode: "#FF0000" },
  SILVER_AMALGAM: { label: "Silver Amalgam Filling", colorCode: "#0000FF" },
  COMPOSITE_FILLING: { label: "Composite Filling", colorCode: "#800080" },
  MISSING_TOOTH: { label: "Missing Tooth", colorCode: "#D3D3D3" },
  CROWN_MISSING: { label: "Crown Missing", colorCode: "#A0522D" },
  CROWN: { label: "Crown", colorCode: "#FFD700" },
  NEED_ROOT_CANAL: { label: "Need Root Canal", colorCode: "#FF1493" },
  RCT_TREATED: { label: "R.C. Treated Tooth", colorCode: "#0000FF" },
  POOR_RCT: { label: "Poor R.C.T Tooth", colorCode: "#FF0000" },
  NEED_EXTRACTION: { label: "Tooth Needs Extraction", colorCode: "#000000" }
};

const ROOT_CANAL_CONDITIONS = {
  NORMAL: { label: "Normal", colorCode: "transparent" },
  NEED_ROOT_CANAL: { label: "Need Root Canal", colorCode: "#FF1493" },
  RCT_TREATED: { label: "R.C. Treated", colorCode: "#0000FF" },
  POOR_RCT: { label: "Poor R.C.T", colorCode: "#FF0000" }
};

const DENTAL_CHART_LAYOUT = {
  upper: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  lower: [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17]
};

const FOUR_SURFACE_TEETH = [6, 7, 8, 9, 10, 11, 22, 23, 24, 25, 26, 27];

// Geometric Diagram Component (preserved as requested)
// Geometric Diagram Component (preserved as requested) - UPDATED
const GeometricDiagram = ({ 
  width = 64, 
  height = 64,
  outerRectColor = "#111111",
  innerRectColor = "#111111",
  lineColor = "#111111",
  lineWidth = 3,
  toothNumber // Add toothNumber prop
}: {
  width?: number;
  height?: number;
  outerRectColor?: string;
  innerRectColor?: string;
  lineColor?: string;
  lineWidth?: number;
  toothNumber?: number; // Add toothNumber prop
}) => {
  const outerRect = { width, height };
  const innerRect = { 
    width: width * 0.5, 
    height: height * 0.5 
  };
  const innerRectX = (width - innerRect.width) / 2;
  const innerRectY = (height - innerRect.height) / 2;

  // Check if this specific tooth should have gray middle rectangle
  const shouldFillMiddleRectangle = () => {
    const grayTeeth = [6, 7, 8, 9, 10, 11, 22, 23, 25, 26, 27];
    return toothNumber ? grayTeeth.includes(toothNumber) : false;
  };

  const middleRectFill = shouldFillMiddleRectangle() ? "#808080" : "none";

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={`0 0 ${width} ${height}`}
      style={{ 
        backgroundColor: 'white',
        display: 'block'
      }}
    >
      <rect
        x="0"
        y="0"
        width={outerRect.width}
        height={outerRect.height}
        fill="none"
        stroke={outerRectColor}
        strokeWidth={lineWidth}
      />
      
      {/* Inner Rectangle - Now with conditional fill */}
      <rect
        x={innerRectX}
        y={innerRectY}
        width={innerRect.width}
        height={innerRect.height}
        fill={middleRectFill}
        stroke={innerRectColor}
        strokeWidth={lineWidth}
      />
      
      <line
        x1="0"
        y1="0"
        x2={innerRectX}
        y2={innerRectY}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />
      
      <line
        x1={outerRect.width}
        y1="0"
        x2={innerRectX + innerRect.width}
        y2={innerRectY}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />
      
      <line
        x1={outerRect.width}
        y1={outerRect.height}
        x2={innerRectX + innerRect.width}
        y2={innerRectY + innerRect.height}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />
      
      <line
        x1="0"
        y1={outerRect.height}
        x2={innerRectX}
        y2={innerRectY + innerRect.height}
        stroke={lineColor}
        strokeWidth={lineWidth}
      />
    </svg>
  );
};

// Helper function to get overall tooth status
const getOverallToothStatus = (toothData?: ToothData): string => {
  if (!toothData) return "NORMAL";
  
  // Check for missing tooth - HIGHEST PRIORITY
  const hasMissingTooth = toothData.surfaces?.some(s => 
    s.condition === "MISSING_TOOTH" || toothData.overallStatus === "MISSING_TOOTH"
  );
  if (hasMissingTooth) return "MISSING_TOOTH";
  
  // Check for extraction needed - SECOND PRIORITY
  const needsExtraction = toothData.surfaces?.some(s => 
    s.condition === "NEED_EXTRACTION" || toothData.overallStatus === "NEED_EXTRACTION"
  );
  if (needsExtraction) return "NEED_EXTRACTION";
  
  // Check for crown
  const hasCrown = toothData.surfaces?.some(s => s.condition === "CROWN");
  if (hasCrown) return "CROWN";
  
  return toothData.overallStatus || "NORMAL";
};

// Updated Surface Chart Tooth Component for Viewing with Click Handler
// Updated Surface Chart Tooth Component for Viewing with Click Handler - UPDATED
const SurfaceToothView = ({ 
  toothNumber, 
  toothData,
  onToothClick 
}: { 
  toothNumber: number; 
  toothData?: ToothData;
  onToothClick: (toothNumber: number, event: React.MouseEvent) => void;
}) => {
  const surfaces = toothData?.surfaces || [];
  const isFourSurfaceTooth = FOUR_SURFACE_TEETH.includes(toothNumber);
  const overallStatus = getOverallToothStatus(toothData);

  const getSurfaceColor = (surfaceName: string) => {
    const surface = surfaces.find(s => s.name === surfaceName);
    if (!surface) return 'transparent';
    return TOOTH_CONDITIONS[surface.condition as keyof typeof TOOTH_CONDITIONS]?.colorCode || 'transparent';
  };

  const isMissing = overallStatus === "MISSING_TOOTH";
  const needsExtraction = overallStatus === "NEED_EXTRACTION";
  const hasCrown = overallStatus === "CROWN";

  return (
    <div 
      className="flex flex-col items-center space-y-1 cursor-pointer transition-transform hover:scale-105"
      onClick={(e) => onToothClick(toothNumber, e)}
      title={`Click to see details for tooth ${toothNumber}`}
    >
      <div className="relative w-12 h-12 bg-white shadow-md border border-gray-400 ml-1">
        {/* Missing tooth background - ENHANCED VISIBILITY */}
        {isMissing && (
          <div 
            className="absolute inset-0 z-5 border-2 border-gray-400"
            style={{ 
              backgroundColor: '#D3D3D3',
              opacity: 0.8
            }}
          ></div>
        )}
        
        {/* Needs extraction background - ENHANCED VISIBILITY */}
        {needsExtraction && (
          <div 
            className="absolute inset-0 z-5 border-2 border-gray-600"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }}
          ></div>
        )}

        {/* Crown border */}
        {hasCrown && !isMissing && !needsExtraction && (
          <div className="absolute inset-0 border-2 border-yellow-500 border-dashed z-15 pointer-events-none"></div>
        )}

        {/* Geometric Diagram Background - HIDDEN FOR MISSING/EXTRACTION TEETH */}
        {!isMissing && !needsExtraction && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <GeometricDiagram 
              width={64}
              height={64}
              outerRectColor="#111111"
              innerRectColor="#111111"
              lineColor="#111111"
              lineWidth={3}
              toothNumber={toothNumber} // Pass the tooth number
            />
          </div>
        )}

        {/* Surface Overlays - HIDDEN FOR MISSING/EXTRACTION TEETH */}
        {!isMissing && !needsExtraction && (
          <div className="absolute inset-0 z-10">
            {/* Buccal (Top) */}
            <div
              className="absolute top-0 left-0 right-0 h-1/2"
              style={{ 
                clipPath: 'polygon(0% 0%, 100% 0%, 75% 50%, 25% 50%)',
                backgroundColor: getSurfaceColor("Buccal")
              }}
              title="Buccal"
            ></div>

            {/* Lingual (Bottom) */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1/2"
              style={{ 
                clipPath: 'polygon(25% 50%, 75% 50%, 100% 100%, 0% 100%)',
                backgroundColor: getSurfaceColor("Lingual")
              }}
              title="Lingual"
            ></div>

            {/* Mesial (Left) */}
            <div
              className="absolute top-0 bottom-0 left-0 w-1/2"
              style={{ 
                clipPath: 'polygon(0% 0%, 50% 25%, 50% 75%, 0% 100%)',
                backgroundColor: getSurfaceColor("Mesial")
              }}
              title="Mesial"
            ></div>

            {/* Distal (Right) */}
            <div
              className="absolute top-0 bottom-0 right-0 w-1/2"
              style={{ 
                clipPath: 'polygon(50% 25%, 100% 0%, 100% 100%, 50% 75%)',
                backgroundColor: getSurfaceColor("Distal")
              }}
              title="Distal"
            ></div>

            {/* Occlusal (Center) - only for posterior teeth */}
            {!isFourSurfaceTooth && (
              <div
                className="absolute top-1/4 left-1/4 w-1/2 h-1/2"
                style={{ 
                  backgroundColor: getSurfaceColor("Occlusal")
                }}
                title="Occlusal"
              ></div>
            )}
          </div>
        )}

        {/* "X" overlay for extraction - BOLDER AND MORE VISIBLE */}
        {needsExtraction && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <svg className="w-full h-full text-black" viewBox="0 0 10 10">
              <path 
                d="M1,1 L9,9 M9,1 L1,9" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))' }}
              />
            </svg>
          </div>
        )}

        {/* Missing tooth indicator */}
        {isMissing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="text-xs font-bold text-gray-600 bg-white bg-opacity-70 px-1 rounded">
              MISSING
            </div>
          </div>
        )}
      </div>
      <div 
        className={`text-xs font-semibold ${
          isMissing ? 'text-gray-400' : 
          needsExtraction ? 'text-gray-700' : 
          'text-gray-600'
        }`}
      >
        {toothNumber}
      </div>
    </div>
  );
};

// Updated Root Canal Tooth Component for Viewing with Click Handler
const RootCanalToothView = ({ 
  toothNumber, 
  toothData,
  customLayers,
  onToothClick 
}: { 
  toothNumber: number; 
  toothData?: ToothData;
  customLayers?: RootLayer[];
  onToothClick: (toothNumber: number, event: React.MouseEvent) => void;
}) => {
  const rootLayers = toothData?.roots || [];
  const allLayers = [...rootLayers, ...(customLayers || [])];
  const overallStatus = getOverallToothStatus(toothData);
  
  const isMissing = overallStatus === "MISSING_TOOTH";
  const needsExtraction = overallStatus === "NEED_EXTRACTION";
  
  const getRootPositions = (toothNumber: number): string[] => {
    // Upper teeth (1-16)
    if (toothNumber >= 1 && toothNumber <= 16) {
      // Upper incisors & canines (6-11) - Single root
      if ([6, 7, 8, 9, 10, 11].includes(toothNumber)) {
        return ["FULL"];
      }
      // Upper premolars (4-5, 12-13) - 2 roots
      else if ([4, 5, 12, 13].includes(toothNumber)) {
        return ["BUCCAL", "PALATAL"];
      }
      // Upper molars (1-3, 14-16) - 3 roots
      else if ([1, 2, 3, 14, 15, 16].includes(toothNumber)) {
        return ["MESIOBUCCAL", "DISTOBUCCAL", "PALATAL"];
      }
    }
    
    // Lower teeth (17-32)
    if (toothNumber >= 17 && toothNumber <= 32) {
      // Lower incisors & canines (22-27) - Single root
      if ([22, 23, 24, 25, 26, 27].includes(toothNumber)) {
        return ["FULL"];
      }
      // Lower premolars (20-21, 28-29) - Single root
      else if ([20, 21, 28, 29].includes(toothNumber)) {
        return ["FULL"];
      }
      // Lower molars (17-19, 30-32) - 2 roots
      else if ([17, 18, 19, 30, 31, 32].includes(toothNumber)) {
        return ["MESIAL", "DISTAL"];
      }
    }
    
    return ["FULL"]; // Default fallback
  };

  const rootPositions = getRootPositions(toothNumber);
  const hasCustomPainting = customLayers && customLayers.length > 0;
  const isUpperTooth = toothNumber >= 1 && toothNumber <= 16;

  // Function to reverse SVG path for upper teeth
  const reverseSVGPathForUpperTeeth = (svgData: string): string => {
    if (!isUpperTooth) return svgData;
    
    // Simple transformation: invert Y coordinates (300 - y)
    // This assumes the SVG viewBox is 0 0 200 300
    return svgData.replace(/(\d+(\.\d+)?)\s+(\d+(\.\d+)?)/g, (match, x, _, y) => {
      const numX = parseFloat(x);
      const numY = parseFloat(y);
      // Invert Y coordinate: 300 - y
      return `${numX} ${300 - numY}`;
    });
  };

  // Function to render tooth structure based on tooth number with correct root anatomy
  const renderToothStructure = () => {
    if (isMissing || needsExtraction) {
      // Return empty structure for missing/extraction teeth
      return null;
    }

    // Upper incisors & canines (6-11) - Single root
    const isUpperAnterior = [6, 7, 8, 9, 10, 11].includes(toothNumber);
    // Upper premolars (4-5, 12-13) - 2 roots (Buccal, Palatal)
    const isUpperPremolar = [4, 5, 12, 13].includes(toothNumber);
    // Upper molars (1-3, 14-16) - 3 roots (Mesiobuccal, Distobuccal, Palatal)
    const isUpperMolar = [1, 2, 3, 14, 15, 16].includes(toothNumber);
    // Lower incisors & canines (22-27) - Single root
    const isLowerAnterior = [22, 23, 24, 25, 26, 27].includes(toothNumber);
    // Lower premolars (20-21, 28-29) - Single root
    const isLowerPremolar = [20, 21, 28, 29].includes(toothNumber);
    // Lower molars (17-19, 30-32) - 2 roots (Mesial, Distal)
    const isLowerMolar = [17, 18, 19, 30, 31, 32].includes(toothNumber);

    // For upper teeth, we reverse the Y coordinates to make roots point upward
    if (isUpperTooth) {
      // Upper teeth - roots point upward
      if (isUpperAnterior) {
        return (
          <>
            {/* Single Root (pointing up) */}
            <path
              d="M 90 180 Q 100 100 110 180 L 110 50 Q 100 20 90 50 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
            {/* Crown (at bottom) */}
            <path
              d="M 50 250 Q 100 280 150 250 Q 180 220 150 180 Q 100 150 50 180 Q 20 220 50 250 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
          </>
        );
      } 
      else if (isUpperPremolar) {
        return (
          <>
            {/* Buccal Root (left - pointing up) */}
            <path
              d="M 70 180 Q 85 100 95 180 L 95 50 Q 85 20 70 50 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
            {/* Palatal Root (right - pointing up) */}
            <path
              d="M 105 180 Q 115 100 125 180 L 125 50 Q 115 20 105 50 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
            {/* Crown (at bottom) */}
            <path
              d="M 40 250 Q 100 280 160 250 Q 190 220 160 180 Q 100 150 40 180 Q 10 220 40 250 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
          </>
        );
      }
      else if (isUpperMolar) {
        return (
          <>
            {/* Mesiobuccal Root (left - pointing up) */}
            <path
              d="M 50 180 Q 60 100 70 180 L 70 50 Q 60 20 50 50 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
            {/* Distobuccal Root (middle - pointing up) */}
            <path
              d="M 90 180 Q 100 120 110 180 L 110 50 Q 100 20 90 50 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
            {/* Palatal Root (right - pointing up) */}
            <path
              d="M 130 180 Q 140 80 150 180 L 150 50 Q 140 20 130 50 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
            {/* Crown - wider for molars (at bottom) */}
            <path
              d="M 30 250 Q 100 280 170 250 Q 200 220 170 180 Q 100 150 30 180 Q 0 220 30 250 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
          </>
        );
      }
    } 
    else {
      // Lower teeth - roots point downward (original orientation)
      if (isLowerAnterior || isLowerPremolar) {
        return (
          <>
            {/* Crown */}
            <path
              d="M 50 50 Q 100 20 150 50 Q 180 80 150 120 Q 100 150 50 120 Q 20 80 50 50 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
            {/* Single Root */}
            <path
              d="M 90 120 Q 100 200 110 120 L 110 250 Q 100 280 90 250 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
          </>
        );
      } 
      else if (isLowerMolar) {
        return (
          <>
            {/* Crown */}
            <path
              d="M 40 50 Q 100 20 160 50 Q 190 80 160 120 Q 100 150 40 120 Q 10 80 40 50 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
            {/* Mesial Root (left) */}
            <path
              d="M 60 120 Q 70 200 80 120 L 80 250 Q 70 280 60 250 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
            {/* Distal Root (right) */}
            <path
              d="M 120 120 Q 130 200 140 120 L 140 250 Q 130 280 120 250 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
          </>
        );
      }
    }

    // Fallback for any unclassified teeth
    return (
      <>
        {isUpperTooth ? (
          // Upper fallback - roots up
          <>
            <path
              d="M 90 180 Q 100 100 110 180 L 110 50 Q 100 20 90 50 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
            <path
              d="M 50 250 Q 100 280 150 250 Q 180 220 150 180 Q 100 150 50 180 Q 20 220 50 250 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
          </>
        ) : (
          // Lower fallback - roots down
          <>
            <path
              d="M 50 50 Q 100 20 150 50 Q 180 80 150 120 Q 100 150 50 120 Q 20 80 50 50 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
            <path
              d="M 90 120 Q 100 200 110 120 L 110 250 Q 100 280 90 250 Z"
              fill="#f8f8f8"
              stroke="#333"
              strokeWidth="2"
            />
          </>
        )}
      </>
    );
  };

  return (
    <div 
      className="flex flex-col items-center cursor-pointer transition-transform hover:scale-105"
      onClick={(e) => onToothClick(toothNumber, e)}
      title={`Click to see details for tooth ${toothNumber}`}
    >
      <div className="relative w-20 h-20">
        <svg
          width="80"
          height="80"
          viewBox="0 0 200 300"
          className="absolute inset-0"
        >
          {/* Background grid for better visibility - HIDDEN FOR MISSING/EXTRACTION */}
          {!isMissing && !needsExtraction && (
            <defs>
              <pattern id={`grid-${toothNumber}`} width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
              </pattern>
            </defs>
          )}
          
          <rect 
            width="100%" 
            height="100%" 
            fill={
              isMissing ? '#D3D3D3' : 
              needsExtraction ? 'rgba(0,0,0,0.1)' : 
              `url(#grid-${toothNumber})`
            } 
          />
          
          {/* Base tooth structure with correct root anatomy - HIDDEN FOR MISSING/EXTRACTION */}
          {!isMissing && !needsExtraction && (
            <g className="tooth-structure">
              {renderToothStructure()}
            </g>
          )}
          
          {/* Render custom SVG drawings - REVERSED FOR UPPER TEETH - HIDDEN FOR MISSING/EXTRACTION */}
          {!isMissing && !needsExtraction && customLayers?.map((layer, index) => {
            if (layer.svgData) {
              const transformedSvgData = isUpperTooth 
                ? reverseSVGPathForUpperTeeth(layer.svgData)
                : layer.svgData;
                
              return (
                <path
                  key={index}
                  d={transformedSvgData}
                  stroke={layer.color}
                  strokeWidth={layer.brushSize || 8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                  style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))' }}
                  className="custom-painting"
                />
              );
            }
            return null;
          })}

          {/* "X" overlay for extraction - BOLDER AND MORE VISIBLE */}
          {needsExtraction && (
            <path
              d="M 30 30 L 170 270 M 170 30 L 30 270"
              stroke="#000000"
              strokeWidth="8"
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.5))' }}
            />
          )}

          {/* Missing tooth indicator */}
          {isMissing && (
            <text
              x="100"
              y="150"
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-bold"
              fill="#666"
              fontSize="24"
            >
              MISSING
            </text>
          )}
        </svg>

        {/* Fallback tooth image - HIDDEN FOR MISSING/EXTRACTION */}
        {!isMissing && !needsExtraction && (
          <Image
            src={`/images/teeth/${toothNumber}.svg`}
            alt={`Tooth ${toothNumber}`}
            fill
            className="object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        )}
        
        {/* Custom painting indicator - HIDDEN FOR MISSING/EXTRACTION */}
        {!isMissing && !needsExtraction && hasCustomPainting && (
          <div className="absolute top-1 left-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm z-30"
               title="Has custom painting">
          </div>
        )}
        
        {/* Root canal condition overlays - HIDDEN FOR MISSING/EXTRACTION */}
        {!isMissing && !needsExtraction && allLayers.map((layer, index) => {
          if (layer.isCustomPainting) return null;
          
          const position = layer.position;
          let positionStyle = {};
          
          // Position overlays based on actual root anatomy and tooth position
          if (rootPositions.length === 1) {
            // Single root teeth - full coverage
            if (isUpperTooth) {
              positionStyle = { top: '0%', left: '25%', width: '50%', height: '40%' }; // Top for upper teeth
            } else {
              positionStyle = { top: '60%', left: '25%', width: '50%', height: '40%' }; // Bottom for lower teeth
            }
          } else if (rootPositions.length === 2) {
            // Two-root teeth
            if (rootPositions.includes("BUCCAL") && rootPositions.includes("PALATAL")) {
              // Upper premolars
              switch (position) {
                case 'BUCCAL':
                  positionStyle = isUpperTooth 
                    ? { top: '0%', left: '30%', width: '20%', height: '40%' }
                    : { top: '60%', left: '30%', width: '20%', height: '40%' };
                  break;
                case 'PALATAL':
                  positionStyle = isUpperTooth
                    ? { top: '0%', left: '50%', width: '20%', height: '40%' }
                    : { top: '60%', left: '50%', width: '20%', height: '40%' };
                  break;
                default:
                  positionStyle = isUpperTooth
                    ? { top: '0%', height: '40%' }
                    : { top: '60%', height: '40%' };
              }
            } else if (rootPositions.includes("MESIAL") && rootPositions.includes("DISTAL")) {
              // Lower molars
              switch (position) {
                case 'MESIAL':
                  positionStyle = { top: '60%', left: '35%', width: '15%', height: '40%' };
                  break;
                case 'DISTAL':
                  positionStyle = { top: '60%', left: '50%', width: '15%', height: '40%' };
                  break;
                default:
                  positionStyle = { top: '60%', height: '40%' };
              }
            }
          } else if (rootPositions.length === 3) {
            // Three-root teeth (upper molars)
            switch (position) {
              case 'MESIOBUCCAL':
                positionStyle = isUpperTooth
                  ? { top: '0%', left: '25%', width: '15%', height: '40%' }
                  : { top: '60%', left: '25%', width: '15%', height: '40%' };
                break;
              case 'DISTOBUCCAL':
                positionStyle = isUpperTooth
                  ? { top: '0%', left: '42%', width: '15%', height: '40%' }
                  : { top: '60%', left: '42%', width: '15%', height: '40%' };
                break;
              case 'PALATAL':
                positionStyle = isUpperTooth
                  ? { top: '0%', left: '60%', width: '15%', height: '40%' }
                  : { top: '60%', left: '60%', width: '15%', height: '40%' };
                break;
              default:
                positionStyle = isUpperTooth
                  ? { top: '0%', height: '40%' }
                  : { top: '60%', height: '40%' };
            }
          }
          
          return (
            <div
              key={index}
              className="absolute border border-gray-300"
              style={{
                ...positionStyle,
                backgroundColor: layer.color,
                opacity: 0.7
              }}
              title={`${position} - ${layer.condition} ${layer.isCustomPainting ? '(Custom Painting)' : ''}`}
            />
          );
        })}
      </div>
      
      <span 
        className={`text-xs font-semibold mt-1 ${
          isMissing ? 'text-gray-400' : 
          needsExtraction ? 'text-gray-700 font-bold' : 
          'text-gray-600'
        }`}
      >
        {toothNumber}
      </span>
      
      {/* Root canal status indicator - HIDDEN FOR MISSING/EXTRACTION */}
      {!isMissing && !needsExtraction && allLayers.length > 0 && (
        <div className="flex space-x-1 mt-1 flex-wrap justify-center max-w-20">
          {allLayers.map((layer, index) => (
            <div
              key={index}
              className="w-2 h-2 rounded-full border border-gray-400"
              style={{ backgroundColor: layer.color }}
              title={`${layer.position} - ${layer.condition}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};



// Explanation Tooltip Component
const ExplanationTooltip = ({ 
  toothNumber, 
  explanation, 
  position, 
  onClose 
}: { 
  toothNumber: number; 
  explanation: string; 
  position: { x: number; y: number };
  onClose: () => void;
}) => {
  if (!toothNumber || !explanation) return null;

  return (
    <div 
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-sm"
      style={{
        left: `${position.x + 20}px`,
        top: `${position.y + 20}px`,
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-bold text-blue-600">Tooth {toothNumber} Explanation</h4>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-lg"
        >
          ×
        </button>
      </div>
      <p className="text-sm text-gray-700">{explanation}</p>
      <div className="text-xs text-gray-500 mt-2">
        Click anywhere to close
      </div>
    </div>
  );
};

// Main Dental Chart Viewer Component
export default function DentalChartViewer({ params }: { params: { id: string } }) {
  const patientId = params.id;
  const router = useRouter();
    const [hasDentalChart, setHasDentalChart] = useState<boolean>(false);
  
  const [dentalChartData, setDentalChartData] = useState<DentalChartData | null>(null);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"surface" | "rootCanal">("surface");
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [explanationPosition, setExplanationPosition] = useState<{x: number, y: number}>({x: 0, y: 0});
  const [role, setRole] = useState<string>(""); // You'll need to set this based on your auth system

  // Load dental chart data
  useEffect(() => {
    const loadDentalChart = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/DentalChart/${patientId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load dental chart');
        }
        
        const data: DentalChartResponse = await response.json();
        console.log(data)
        if (data.success && data.data.DentalChart.length > 0) {
          // Get the latest dental chart
          const latestChart = data.data.DentalChart[0];
          setDentalChartData(latestChart);
          setPatientData(data.data.patient);
                    setHasDentalChart(true);

          // Set initial active tab based on saved data
          if (latestChart.activeTab) {
            setActiveTab(latestChart.activeTab as "surface" | "rootCanal");
          }
        } else {
                    setHasDentalChart(false);

          setError('No dental chart found for this patient');
        }
      } catch (err) {
        console.error('Error loading dental chart:', err);
        setError('Failed to load dental chart data');
                setHasDentalChart(false);

      } finally {
        setLoading(false);
      }
    };

    // You'll need to get the user role from your authentication system
    // This is a placeholder - replace with your actual role detection
    const getUserRole = () => {
      // Example: Get role from localStorage, context, or API
      const userRole = localStorage.getItem('userRole') || 'doctor';
      setRole(userRole);
    };

    loadDentalChart();
    getUserRole();
  }, [patientId]);

  // EDIT FUNCTION - Based on your example
  const handleEdit = (patientId: string, findingId: string) => {
    if (role === "doctor") {
      router.push(`/doctor/DentalChart/edit?dentalChartId=${findingId}&patientId=${patientId}`);
    } else if (role === "admin") {
      router.push(`/admin/DentalChart/edit?dentalChartId=${findingId}&patientId=${patientId}`);
    }
  };

  // DELETE FUNCTION
  const handleDelete = async (findingId: string) => {
    if (!confirm('Are you sure you want to delete this dental chart?')) {
      return;
    }

    try {
      const response = await fetch(`/api/DentalChart/${findingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Dental chart deleted successfully');
        router.push('/medicaldata'); // Redirect to medical data page or wherever appropriate
      } else {
        throw new Error('Failed to delete dental chart');
      }
    } catch (error) {
      console.error('Error deleting dental chart:', error);
      alert('Failed to delete dental chart');
    }
  };

  // ... (all your existing helper functions remain the same)
  // Helper functions
  const getToothData = (toothNumber: number): ToothData | undefined => {
    return dentalChartData?.teeth.find(t => t.toothNumber === toothNumber);
  };

  const getCustomLayers = (toothNumber: number): RootLayer[] => {
    const customTooth = dentalChartData?.customRootLayers.find(ct => ct.toothNumber === toothNumber);
    return customTooth?.layers || [];
  };

  const getAllRootLayers = (toothNumber: number): RootLayer[] => {
    const toothData = getToothData(toothNumber);
    const customLayers = getCustomLayers(toothNumber);
    return [...(toothData?.roots || []), ...customLayers];
  };

  // NEW: Function to handle tooth click and show explanation
  const handleToothClick = (toothNumber: number, event: React.MouseEvent) => {
    setSelectedTooth(toothNumber);
    
    // Get click position for tooltip placement
    const rect = event.currentTarget.getBoundingClientRect();
    setExplanationPosition({
      x: event.clientX,
      y: event.clientY
    });
    
    setShowExplanation(true);
    
    // Auto-hide explanation after 5 seconds
    setTimeout(() => {
      setShowExplanation(false);
    }, 5000);
  };

  // NEW: Function to generate tooth explanation
  const generateToothExplanation = (toothNumber: number): string => {
    const toothData = getToothData(toothNumber);
    const customLayers = getCustomLayers(toothNumber);
    const allRootLayers = getAllRootLayers(toothNumber);
    const overallStatus = getOverallToothStatus(toothData);

    if (!toothData && customLayers.length === 0) {
      return `Tooth ${toothNumber} is healthy with no recorded conditions.`;
    }

    let explanation = `Tooth ${toothNumber} - `;

    // Overall status explanation
    switch (overallStatus) {
      case "MISSING_TOOTH":
        explanation += "This tooth is missing. ";
        break;
      case "NEED_EXTRACTION":
        explanation += "This tooth requires extraction. ";
        break;
      case "CROWN":
        explanation += "This tooth has a crown. ";
        break;
      case "CROWN_MISSING":
        explanation += "This tooth's crown is missing. ";
        break;
      default:
        explanation += "Normal overall status. ";
    }

    // Surface conditions explanation
    if (toothData?.surfaces && toothData.surfaces.length > 0) {
      explanation += "Surface conditions: ";
      toothData.surfaces.forEach((surface, index) => {
        const conditionLabel = TOOTH_CONDITIONS[surface.condition as keyof typeof TOOTH_CONDITIONS]?.label || surface.condition;
        explanation += `${surface.name} surface has ${conditionLabel.toLowerCase()}`;
        explanation += index < toothData.surfaces.length - 1 ? ", " : ". ";
      });
    }

    // Root conditions explanation
    if (allRootLayers.length > 0) {
      explanation += "Root conditions: ";
      allRootLayers.forEach((layer, index) => {
        const conditionLabel = ROOT_CANAL_CONDITIONS[layer.condition as keyof typeof ROOT_CANAL_CONDITIONS]?.label || layer.condition;
        if (layer.isCustomPainting) {
          explanation += `Custom painting (${conditionLabel.toLowerCase()})`;
        } else {
          explanation += `${layer.position} root has ${conditionLabel.toLowerCase()}`;
        }
        explanation += index < allRootLayers.length - 1 ? ", " : ". ";
      });
    }

    // Notes explanation
    if (toothData?.notes) {
      explanation += ` Notes: ${toothData.notes}`;
    }
    if (toothData?.generalNote) {
      explanation += ` General note: ${toothData.generalNote}`;
    }

    return explanation;
  };

  // Add click outside handler to close explanation
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      setShowExplanation(false);
    };

    if (showExplanation) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showExplanation]);

    const handleCreateDentalChart = () => {
    if (!patientData) return;

    const isChild = patientData.age < 18; // Assuming child is under 18
    
    if (role === "doctor") {
      if (isChild) {
        router.push(`/doctor/DentalChart/create/child?patientId=${patientId}`);
      } else {
        router.push(`/doctor/DentalChart/create/adult?patientId=${patientId}`);
      }
    } else if (role === "admin") {
      if (isChild) {
        router.push(`/admin/DentalChart/create/child?patientId=${patientId}`);
      } else {
        router.push(`/admin/DentalChart/create/adult?patientId=${patientId}`);
      }
    }
  };
  // Action Buttons Section - ADD THIS SECTION
  // Action Buttons Section - UPDATED
  const renderActionButtons = () => (
    <div className="flex space-x-4 mt-6">
      <button
        onClick={() => router.back()}
        className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors"
      >
        Back
      </button>
      
      {/* Create Dental Chart Button - Only show when no dental chart exists */}
      {!hasDentalChart && (role === "doctor" || role === "admin") && (
        <>
        <button
          className=" text-center bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center space-x-2"
          onClick={()=>router.push(`/doctor/DentalChart/add/${patientId}`)}
        >
          <PlusOutlined />
          <span>Create Dental Chart</span>
        </button>
          <button
          className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center space-x-2"
          onClick={()=>router.push(`/doctor/DentalChart/child/add/${patientId}`)}
        >
          <PlusOutlined />
          <span>Create Dental Chart For Child</span>
        </button></>
      )}
      
      {/* Edit and Delete Buttons - Only show when dental chart exists */}
      {hasDentalChart && (role === "doctor" || role === "admin") && dentalChartData && (
        <div className="flex space-x-2">
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-2"
            onClick={() => handleEdit(patientId, dentalChartData._id)}
          >
            <EditOutlined />
            <span>Edit Chart</span>
          </button>
          <button
            className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition-colors flex items-center space-x-2"
            onClick={() => handleDelete(dentalChartData._id)}
          >
            <DeleteOutlined />
            <span>Delete Chart</span>
          </button>
        </div>
      )}
      
      {/* Print Button - Only show when dental chart exists */}
      {hasDentalChart && (
        <button
          onClick={() => window.print()}
          className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors"
        >
          Print Chart
        </button>
      )}
    </div>
  );

  const renderNoDentalChart = () => (
    <div className="bg-white p-8 rounded-lg shadow-md border-2 border-gray-300 text-center">
      <div className="mb-6">
        <div className="text-6xl mb-4">🦷</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">No Dental Chart Found</h2>
        <p className="text-gray-600 mb-6">
          This patient doesn't have a dental chart record yet.
        </p>
        
        {/* Create Dental Chart Button */}
        {(role === "doctor" || role === "admin") && (
          <div className="space-y-4">
            <button
              onClick={handleCreateDentalChart}
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2 mx-auto"
            >
              <PlusOutlined className="text-xl" />
              <span>Create Dental Chart</span>
            </button>
            
            {/* Age-based path information */}
            {patientData && (
              <div className="text-sm text-gray-500 mt-4">
                {patientData.age < 18 ? (
                  <p>This will create a <strong>child dental chart</strong> (patient is {patientData.age} years old)</p>
                ) : (
                  <p>This will create an <strong>adult dental chart</strong> (patient is {patientData.age} years old)</p>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Message for non-authorized users */}
        {(role !== "doctor" && role !== "admin") && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700">
              You don't have permission to create dental charts. Please contact a doctor or administrator.
            </p>
          </div>
        )}
      </div>
    </div>
  );
  // ... (all your existing render functions remain the same)
  const renderSurfaceChart = () => (
    <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-300 relative">
      {/* Add tooltip */}
      {showExplanation && selectedTooth && (
        <ExplanationTooltip
          toothNumber={selectedTooth}
          explanation={generateToothExplanation(selectedTooth)}
          position={explanationPosition}
          onClose={() => setShowExplanation(false)}
        />
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Surface Dental Chart - View Mode</h1>
        <div className="text-sm text-gray-500">
          Last updated: {dentalChartData ? new Date(dentalChartData.updatedAt).toLocaleDateString() : 'N/A'}
        </div>
      </div>

      {/* Surface Legend */}
      <div className="grid grid-cols-5 gap-2 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-xs font-bold">M</div>
          <div className="text-xs text-gray-600">Mesial</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-bold">O</div>
          <div className="text-xs text-gray-600">Occlusal</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-bold">D</div>
          <div className="text-xs text-gray-600">Distal</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-bold">B</div>
          <div className="text-xs text-gray-600">Buccal</div>
        </div>
        <div className="text-center">
          <div className="text-xs font-bold">L</div>
          <div className="text-xs text-gray-600">Lingual</div>
        </div>
      </div>

      <div className="border-2 border-gray-200 rounded-xl p-4 space-y-4">
        {/* Upper Jaw */}
        <div className="flex justify-between items-center px-2">
          {DENTAL_CHART_LAYOUT.upper.slice(0, 8).map(num => (
            <div key={num} className="flex flex-col items-center">
              <div className="w-7 h-7 relative">
                <Image
                  src={`/images/teeth/${num}.png`}
                  alt={`Tooth ${num}`}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-600 mt-1">{num}</span>
            </div>
          ))}
          <div className="w-px h-7 bg-gray-300"></div>
          {DENTAL_CHART_LAYOUT.upper.slice(8, 16).map(num => (
            <div key={num} className="flex flex-col items-center">
              <div className="w-7 h-7 relative">
                <Image
                  src={`/images/teeth/${num}.png`}
                  alt={`Tooth ${num}`}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-600 mt-1">{num}</span>
            </div>
          ))}
        </div>

        {/* Upper Jaw Interactive */}
        <div className="flex justify-center items-center gap-1 flex-wrap ">
          {DENTAL_CHART_LAYOUT.upper.map(num => (
            <SurfaceToothView
              key={num}
              toothNumber={num}
              toothData={getToothData(num)}
              onToothClick={handleToothClick}
            />
          ))}
        </div>

        {/* Lower Jaw Interactive */}
        <div className="flex justify-center items-center gap-1 flex-wrap mt-2">
          {DENTAL_CHART_LAYOUT.lower.map(num => (
            <SurfaceToothView
              key={num}
              toothNumber={num}
              toothData={getToothData(num)}
              onToothClick={handleToothClick}
            />
          ))}
        </div>

        {/* Lower Jaw Illustrations */}
        <div className="flex justify-between items-center px-2 pt-2">
          {DENTAL_CHART_LAYOUT.lower.slice(0, 8).map(num => (
            <div key={num} className="flex flex-col items-center">
              <div className="w-7 h-7 relative">
                <Image
                  src={`/images/teeth/${num}.png`}
                  alt={`Tooth ${num}`}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-600 mt-1">{num}</span>
            </div>
          ))}
          <div className="w-px h-7 bg-gray-300"></div>
          {DENTAL_CHART_LAYOUT.lower.slice(8, 16).map(num => (
            <div key={num} className="flex flex-col items-center">
              <div className="w-7 h-7 relative">
                <Image
                  src={`/images/teeth/${num}.png`}
                  alt={`Tooth ${num}`}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-gray-600 mt-1">{num}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render Root Canal Chart View
  const renderRootCanalChart = () => (
    <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-300 overflow-hidden relative">
      {/* Add tooltip */}
      {showExplanation && selectedTooth && (
        <ExplanationTooltip
          toothNumber={selectedTooth}
          explanation={generateToothExplanation(selectedTooth)}
          position={explanationPosition}
          onClose={() => setShowExplanation(false)}
        />
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Root Canal Chart - View Mode</h1>
        <div className="text-sm text-gray-500">
          Last updated: {dentalChartData ? new Date(dentalChartData.updatedAt).toLocaleDateString() : 'N/A'}
        </div>
      </div>

      {/* Custom Paintings Summary */}
      {dentalChartData?.customRootLayers && dentalChartData.customRootLayers.length > 0 && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-800 mb-2">Custom Paintings Found:</h3>
          <div className="grid grid-cols-4 gap-2 text-sm">
            {dentalChartData.customRootLayers.map((customTooth, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>Tooth {customTooth.toothNumber}:</span>
                <span className="text-green-600">{customTooth.layers.length} painting(s)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border-4 border-gray-400 rounded-xl p-4 space-y-4 overflow-x-auto">
        {/* Interactive Dental Chart - UPPER JAW */}
        <div className="flex justify-between items-center px-2 w-full min-w-max">
          {DENTAL_CHART_LAYOUT.upper.slice(0, 8).map(num => (
            <div key={num} className="flex flex-col items-center w-16 flex-shrink-0">
              <RootCanalToothView
                toothNumber={num}
                toothData={getToothData(num)}
                customLayers={getCustomLayers(num)}
                onToothClick={handleToothClick}
              />
            </div>
          ))}
          <div className="w-px h-20 bg-gray-400 flex-shrink-0"></div>
          {DENTAL_CHART_LAYOUT.upper.slice(8, 16).map(num => (
            <div key={num} className="flex flex-col items-center w-16 flex-shrink-0">
              <RootCanalToothView
                toothNumber={num}
                toothData={getToothData(num)}
                customLayers={getCustomLayers(num)}
                onToothClick={handleToothClick}
              />
            </div>
          ))}
        </div>

        {/* Interactive Dental Chart - LOWER JAW */}
        <div className="flex justify-between items-center px-2 w-full min-w-max">
          {DENTAL_CHART_LAYOUT.lower.slice(0, 8).map(num => (
            <div key={num} className="flex flex-col items-center w-16 flex-shrink-0">
              <RootCanalToothView
                toothNumber={num}
                toothData={getToothData(num)}
                customLayers={getCustomLayers(num)}
                onToothClick={handleToothClick}
              />
            </div>
          ))}
          <div className="w-px h-20 bg-gray-400 flex-shrink-0"></div>
          {DENTAL_CHART_LAYOUT.lower.slice(8, 16).map(num => (
            <div key={num} className="flex flex-col items-center w-16 flex-shrink-0">
              <RootCanalToothView
                toothNumber={num}
                toothData={getToothData(num)}
                customLayers={getCustomLayers(num)}
                onToothClick={handleToothClick}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Detailed Tooth Information Panel
  const renderToothDetails = () => {
    if (!selectedTooth) return null;

    const toothData = getToothData(selectedTooth);
    const customLayers = getCustomLayers(selectedTooth);
    const allRootLayers = getAllRootLayers(selectedTooth);

    return (
      <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
        <h3 className="font-bold text-lg mb-3 text-gray-800">
          Tooth {selectedTooth} Details
        </h3>
        
        {/* Overall Status */}
        <div className="mb-4">
          <label className="block font-medium mb-2 text-gray-700">Overall Status:</label>
          <div className="p-2 bg-gray-50 rounded border">
            {toothData?.overallStatus || "NORMAL"}
          </div>
        </div>
        
        {/* Notes */}
        <div className="mb-4">
          <label className="block font-medium mb-2 text-gray-700">Notes:</label>
          <div className="p-2 bg-gray-50 rounded border min-h-24">
            {toothData?.notes || toothData?.generalNote || "No notes"}
          </div>
        </div>
        
        {/* Conditions Summary */}
        <div>
          <label className="block font-medium mb-2 text-gray-700">
            {activeTab === "surface" ? "Surface Conditions:" : "Root Conditions:"}
          </label>
          <div className="space-y-2 text-sm">
            {activeTab === "surface" ? (
              /* Surface Conditions */
              <>
                {toothData?.surfaces?.map((surface, index) => (
                  <div key={index} className="border rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{surface.name} Surface:</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded border border-gray-400"
                        style={{ 
                          backgroundColor: TOOTH_CONDITIONS[surface.condition as keyof typeof TOOTH_CONDITIONS]?.colorCode || 'transparent'
                        }}
                      ></div>
                      <span className="text-xs text-gray-600">
                        {TOOTH_CONDITIONS[surface.condition as keyof typeof TOOTH_CONDITIONS]?.label || surface.condition}
                      </span>
                    </div>
                  </div>
                ))}
                {(!toothData?.surfaces || toothData.surfaces.length === 0) && (
                  <div className="text-gray-500 italic">No surface conditions</div>
                )}
              </>
            ) : (
              /* Root Conditions */
              <>
                {/* Position-based root conditions */}
                {toothData?.roots?.map((root, index) => (
                  <div key={index} className="border rounded p-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{root.position} Root:</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded border border-gray-400"
                        style={{ backgroundColor: root.color }}
                      ></div>
                      <span className="text-xs text-gray-600">
                        {root.condition}
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Custom painted areas */}
                {customLayers.map((layer, index) => (
                  <div key={`custom-${index}`} className="border rounded p-2 border-green-300 bg-green-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">Custom Painted Area:</span>
                      <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                        Freehand
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded border border-gray-400"
                        style={{ backgroundColor: layer.color }}
                      ></div>
                      <span className="text-xs text-gray-600">
                        {layer.condition}
                      </span>
                    </div>
                    {layer.brushSize && (
                      <div className="text-xs text-gray-500 mt-1">
                        Brush size: {layer.brushSize}px
                      </div>
                    )}
                    {layer.timestamp && (
                      <div className="text-xs text-gray-500">
                        Created: {new Date(layer.timestamp).toLocaleString()}
                      </div>
                    )}
                  </div>
                ))}
                
                {allRootLayers.length === 0 && (
                  <div className="text-gray-500 italic">No root conditions</div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };
  if (error && !hasDentalChart) {
    return (
      <div className="flex m-7">
        <div className="flex-grow md:ml-60 container mx-auto p-4">
          <PatientComponent params={params} />
        <div className="bg-white p-8 rounded-lg shadow-md border-2 border-gray-300 text-center">
      <div className="mb-6">
        <div className="text-6xl mb-4">🦷</div>
        <h2 className="text-2xl font-bold text-gray-700 mb-2">No Dental Chart Found</h2>
        <p className="text-gray-600 mb-6">
          This patient doesn't have a dental chart record yet.
        </p>
            {renderActionButtons()}
          </div>  </div>
        </div>
      </div>
    );
  }
 return (
  <div className="flex m-7">
    <div className="flex-grow md:ml-60 container mx-auto p-4">
      <PatientComponent params={params} />
      
      {!hasDentalChart ? (
        renderNoDentalChart()
      ) : (
        <>
          {/* Instructions for user */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="text-blue-500 mr-3">💡</div>
              <div>
                <p className="text-blue-800 font-medium">Click on any tooth to see detailed explanations</p>
                <p className="text-blue-600 text-sm">The explanation will show conditions, treatments, and notes for the selected tooth.</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-8">
            {/* Controls and Details Panel */}
            <div className="w-1/3 p-4 space-y-6">
              {/* Tab Navigation */}
              <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                <h3 className="font-bold text-lg mb-3 text-gray-800">Chart Type</h3>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setActiveTab("surface")}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                      activeTab === "surface" 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Surface Chart
                  </button>
                  <button
                    onClick={() => setActiveTab("rootCanal")}
                    className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                      activeTab === "rootCanal" 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Root Canal Chart
                  </button>
                </div>
              </div>

              {/* Chart Statistics */}
              <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                <h3 className="font-bold text-lg mb-3 text-gray-800">Chart Statistics</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Teeth with markings:</span>
                    <span className="font-semibold">
                      {dentalChartData?.teeth.filter(t => 
                        (t.surfaces && t.surfaces.length > 0) || 
                        (t.roots && t.roots.length > 0)
                      ).length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Surface conditions:</span>
                    <span className="font-semibold">
                      {dentalChartData?.teeth.reduce((total, tooth) => 
                        total + (tooth.surfaces?.length || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Root conditions:</span>
                    <span className="font-semibold">
                      {dentalChartData?.teeth.reduce((total, tooth) => 
                        total + (tooth.roots?.length || 0), 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Custom paintings:</span>
                    <span className="font-semibold text-green-600">
                      {dentalChartData?.customRootLayers.reduce((total, tooth) => 
                        total + tooth.layers.length, 0) || 0}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chart version:</span>
                    <span className="font-semibold">v{dentalChartData?.version || 1}</span>
                  </div>
                </div>
              </div>

              {/* Selected Tooth Details */}
              {renderToothDetails()}
            </div>

            {/* Dental Chart Diagram */}
            <div className="w-2/3">
              {activeTab === "surface" ? renderSurfaceChart() : renderRootCanalChart()}

              {/* Use the new action buttons */}
              {renderActionButtons()}
            </div>
          </div>
        </>
      )}
    </div>
  </div>
);
}