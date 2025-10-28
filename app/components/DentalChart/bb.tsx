"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { EditOutlined, DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import PatientComponent from "./PatientComponent";

// ... (all your existing interfaces remain the same)
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
  isChild: boolean;
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

// Conditions mapping
const TOOTH_CONDITIONS = {
  CARIES: { label: "Caries Lesions", colorCode: "#FF0000" },
  SILVER_AMALGAM: { label: "Silver Amalgam Filling", colorCode: "#D1D1D1" },
  COMPOSITE_FILLING: { label: "Composite Filling", colorCode: "#800080" },
  MISSING_TOOTH: { label: "Missing Tooth", colorCode: "#D9D9D9" },
  CROWN_MISSING: { label: "Crown Missing", colorCode: "#A0522D" },
  CROWN: { label: "Crown", colorCode: "#FFD700" },
  NEED_ROOT_CANAL: { label: "Need Root Canal", colorCode: "#FF1493" },
  RCT_TREATED: { label: "R.C. Treated Tooth", colorCode: "#0000FF" },
  POOR_RCT: { label: "Poor R.C.T Tooth", colorCode: "#E08D7E" },
  NEED_EXTRACTION: { label: "Tooth Needs Extraction", colorCode: "#000000" }
};

const ROOT_CANAL_CONDITIONS = {
  NORMAL: { label: "Normal", colorCode: "transparent" },
  NEED_ROOT_CANAL: { label: "Need Root Canal", colorCode: "#FF1493" },
  RCT_TREATED: { label: "R.C. Treated", colorCode: "#0000FF" },
  POOR_RCT: { label: "Poor R.C.T", colorCode: "#FF0000" }
};

// UPDATED: Correct child dental chart layout - 24 teeth total
const ADULT_DENTAL_CHART_LAYOUT = {
  upper: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  lower: [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17]
};

const CHILD_DENTAL_CHART_LAYOUT = {
  upper: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // 12 upper teeth
  lower: [24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13] // 12 lower teeth
};

// UPDATED: Different teeth configuration for child vs adult
const ADULT_FOUR_SURFACE_TEETH = [6, 7, 8, 9, 10, 11, 22, 23, 24, 25, 26, 27];
const CHILD_FOUR_SURFACE_TEETH = [4, 5, 6, 7, 8, 9, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

// UPDATED: Geometric Diagram Component with proper child/adult differentiation
const GeometricDiagram = ({ 
  width = 64, 
  height = 64,
  outerRectColor = "#111111",
  innerRectColor = "#111111",
  lineColor = "#111111",
  lineWidth = 3,
  toothNumber,
  isChild = false
}: {
  width?: number;
  height?: number;
  outerRectColor?: string;
  innerRectColor?: string;
  lineColor?: string;
  lineWidth?: number;
  toothNumber?: number;
  isChild?: boolean;
}) => {
  const outerRect = { width, height };
  const innerRect = { 
    width: width * 0.5, 
    height: height * 0.5 
  };
  const innerRectX = (width - innerRect.width) / 2;
  const innerRectY = (height - innerRect.height) / 2;

  // UPDATED: Correct child tooth patterns
  const shouldFillMiddleRectangle = () => {
    if (isChild) {
      // Child teeth with occlusal surfaces
      const grayTeeth = [4, 5, 6, 7, 8, 9, 16, 17, 18, 19, 20, 21];
      return toothNumber ? grayTeeth.includes(toothNumber) : false;
    } else {
      // Adult teeth with occlusal surfaces
      const grayTeeth = [6, 7, 8, 9, 10, 11, 22, 23, 25, 26, 27];
      return toothNumber ? grayTeeth.includes(toothNumber) : false;
    }
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
// Color Legend Component
const ColorLegend = () => (
  <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
    <h3 className="font-bold text-lg mb-3 text-gray-800 border-b pb-2">
      Color Code Explanation
    </h3>
    
    {/* Tooth Surface Conditions */}
    <div className="mb-4">
      <h4 className="font-semibold text-gray-700 mb-2 text-sm">Tooth Surface Conditions:</h4>
      <div className="grid grid-cols-3 gap-2 text-xs">
        {Object.entries(TOOTH_CONDITIONS).map(([key, condition]) => (
          <div key={key} className="flex items-center space-x-2 p-1 hover:bg-gray-50 rounded">
            <div 
              className="w-3 h-3 rounded border border-gray-300 flex-shrink-0"
              style={{ backgroundColor: condition.colorCode }}
            ></div>
            <span className="text-gray-600">{condition.label}</span>
          </div>
        ))}
      </div>
    </div>


  
  </div>
);
// Helper function to get overall tooth status
const getOverallToothStatus = (toothData?: ToothData): string => {
  if (!toothData) return "NORMAL";
  
  const hasMissingTooth = toothData.surfaces?.some(s => 
    s.condition === "MISSING_TOOTH" || toothData.overallStatus === "MISSING_TOOTH"
  );
  if (hasMissingTooth) return "MISSING_TOOTH";
  
  const needsExtraction = toothData.surfaces?.some(s => 
    s.condition === "NEED_EXTRACTION" || toothData.overallStatus === "NEED_EXTRACTION"
  );
  if (needsExtraction) return "NEED_EXTRACTION";
  
  const hasCrown = toothData.surfaces?.some(s => s.condition === "CROWN");
  if (hasCrown) return "CROWN";
  
  return toothData.overallStatus || "NORMAL";
};

// UPDATED: Surface Chart Tooth Component with proper alignment to root canal teeth
const SurfaceToothView = ({ 
  toothNumber, 
  toothData,
  onToothClick,
  isChild = false
}: { 
  toothNumber: number; 
  toothData?: ToothData;
  onToothClick: (toothNumber: number, event: React.MouseEvent) => void;
  isChild?: boolean;
}) => {
  const surfaces = toothData?.surfaces || [];
  const isFourSurfaceTooth = isChild 
    ? CHILD_FOUR_SURFACE_TEETH.includes(toothNumber)
    : ADULT_FOUR_SURFACE_TEETH.includes(toothNumber);
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
      className="flex flex-col items-center cursor-pointer transition-transform hover:scale-105"
      onClick={(e) => onToothClick(toothNumber, e)}
      title={`Click to see details for tooth ${toothNumber}${isChild ? ' (Child)' : ' (Adult)'}`}
    >
      {/* NO SPACE ABOVE - Box starts at the very top */}
      <div className="relative w-12 h-12">
        {isMissing && (
          <div 
            className="absolute inset-0 z-5 border border-gray-400"
            style={{ 
              backgroundColor: '#D3D3D3',
              opacity: 0.8
            }}
          ></div>
        )}
        
        {needsExtraction && (
          <div 
            className="absolute inset-0 z-5 border border-gray-600"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.3)'
            }}
          ></div>
        )}

        {hasCrown && !isMissing && !needsExtraction && (
          <div className="absolute inset-0 border border-yellow-500 border-dashed z-15 pointer-events-none"></div>
        )}

        {!isMissing && !needsExtraction && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <GeometricDiagram 
              width={36}
              height={36}
              outerRectColor="#111111"
              innerRectColor="#111111"
              lineColor="#111111"
              lineWidth={1.5}
              toothNumber={toothNumber}
              isChild={isChild}
            />
          </div>
        )}

       {!isMissing && !needsExtraction && (
  <div className="absolute inset-0 z-10 flex items-center justify-center">
    {/* Container with reduced size */}
    <div className="relative w-9 h-9"> {/* Reduced from full container size */}
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
  </div>
)}

        {needsExtraction && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <svg className="w-full h-full text-black" viewBox="0 0 10 10">
              <path 
                d="M1,1 L9,9 M9,1 L1,9" 
                stroke="currentColor" 
                strokeWidth="0.8" 
                strokeLinecap="round"
                style={{ filter: 'drop-shadow(0.5px 0.5px 0.5px rgba(0,0,0,0.5))' }}
              />
            </svg>
          </div>
        )}

        {isMissing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="text-[6px] font-bold text-gray-600 bg-white bg-opacity-70 px-0.5 rounded">
              MISSING
            </div>
          </div>
        )}
      </div>
      
      {/* Label positioned directly below the box */}
      <div 
        className={`text-[10px] font-semibold mt-0.5 ${
          isMissing ? 'text-gray-400' : 
          needsExtraction ? 'text-gray-700' : 
          'text-gray-600'
        }`}
      >
        {toothNumber}
        {isChild && <span className="text-blue-500 ml-0.5">C</span>}
        {!isChild && <span className="text-green-500 ml-0.5">A</span>}
      </div>
    </div>
  );
};
const RootCanalToothView = ({ 
  toothNumber, 
  toothData,
  customLayers,
  onToothClick,
  isChild = false
}: { 
  toothNumber: number; 
  toothData?: ToothData;
  customLayers?: RootLayer[];
  onToothClick: (toothNumber: number, event: React.MouseEvent) => void;
  isChild?: boolean;
}) => {
  const rootLayers = toothData?.roots || [];
  const allLayers = [...rootLayers, ...(customLayers || [])];
  const overallStatus = getOverallToothStatus(toothData);
  
  const isMissing = overallStatus === "MISSING_TOOTH";
  const needsExtraction = overallStatus === "NEED_EXTRACTION";
  
  // UPDATED: CORRECT child root anatomy based on your specifications
  const getRootPositions = (toothNumber: number, isChild: boolean): string[] => {
    if (isChild) {
      // Child teeth root anatomy
      if ([1, 2, 3].includes(toothNumber)) {
        return ["MESIOBUCCAL", "DISTOBUCCAL", "PALATAL"]; // 3 roots
      } else if ([10, 11, 12, 13, 14, 15, 22, 23, 24].includes(toothNumber)) {
        return ["MESIAL", "DISTAL"]; // 2 roots
      } else {
        return ["FULL"]; // Single root for others
      }
    } else {
      // Adult teeth root anatomy
      if (toothNumber >= 1 && toothNumber <= 16) {
        if ([6, 7, 8, 9, 10, 11].includes(toothNumber)) {
          return ["FULL"];
        } else if ([4, 5, 12, 13].includes(toothNumber)) {
          return ["BUCCAL", "PALATAL"];
        } else if ([1, 2, 3, 14, 15, 16].includes(toothNumber)) {
          return ["MESIOBUCCAL", "DISTOBUCCAL", "PALATAL"];
        }
      }
      
      if (toothNumber >= 17 && toothNumber <= 32) {
        if ([22, 23, 24, 25, 26, 27].includes(toothNumber)) {
          return ["FULL"];
        } else if ([20, 21, 28, 29].includes(toothNumber)) {
          return ["FULL"];
        } else if ([17, 18, 19, 30, 31, 32].includes(toothNumber)) {
          return ["MESIAL", "DISTAL"];
        }
      }
    }
    
    return ["FULL"];
  };

  const rootPositions = getRootPositions(toothNumber, isChild);
  const hasCustomPainting = customLayers && customLayers.length > 0;
  const isUpperTooth = isChild 
    ? (toothNumber >= 1 && toothNumber <= 12)
    : (toothNumber >= 1 && toothNumber <= 16);

  // Function to reverse SVG path for upper teeth
  const reverseSVGPathForUpperTeeth = (svgData: string): string => {
    if (!isUpperTooth) return svgData;
    
    return svgData.replace(/(\d+(\.\d+)?)\s+(\d+(\.\d+)?)/g, (match, x, _, y) => {
      const numX = parseFloat(x);
      const numY = parseFloat(y);
      return `${numX} ${300 - numY}`;
    });
  };

  // UPDATED: COMPLETELY DIFFERENT tooth structure rendering for child vs adult
  const renderToothStructure = () => {
    if (isMissing || needsExtraction) {
      return null;
    }

    if (isChild) {
      // CHILD TOOTH STRUCTURES
      if (isUpperTooth) {
        // Child upper teeth
        if ([1, 2, 3].includes(toothNumber)) {
          // Child upper molars - 3 roots
          return (
            <>
              {/* Three roots (pointing up) */}
              <path
                d="M 50 180 Q 60 100 70 180 L 70 50 Q 60 20 50 50 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
              <path
                d="M 90 180 Q 100 120 110 180 L 110 50 Q 100 20 90 50 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
              <path
                d="M 130 180 Q 140 80 150 180 L 150 50 Q 140 20 130 50 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
              {/* Crown */}
              <path
                d="M 30 250 Q 100 280 170 250 Q 200 220 170 180 Q 100 150 30 180 Q 0 220 30 250 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
            </>
          );
        } else if ([10, 11, 12].includes(toothNumber)) {
          // Child upper premolars - 2 roots
          return (
            <>
              {/* Two roots (pointing up) */}
              <path
                d="M 70 180 Q 85 100 95 180 L 95 50 Q 85 20 70 50 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
              <path
                d="M 105 180 Q 115 100 125 180 L 125 50 Q 115 20 105 50 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
              {/* Crown */}
              <path
                d="M 40 250 Q 100 280 160 250 Q 190 220 160 180 Q 100 150 40 180 Q 10 220 40 250 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
            </>
          );
        } else {
          // Child upper anterior - single root
          return (
            <>
              {/* Single root (pointing up) */}
              <path
                d="M 90 180 Q 100 120 110 180 L 110 80 Q 100 50 90 80 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
              {/* Crown - smaller for child teeth */}
              <path
                d="M 70 220 Q 100 240 130 220 Q 150 200 130 180 Q 100 170 70 180 Q 50 200 70 220 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
            </>
          );
        }
      } else {
        // Child lower teeth
        if ([22, 23, 24].includes(toothNumber)) {
          // Child lower molars - 2 roots
          return (
            <>
              {/* Crown */}
              <path
                d="M 40 50 Q 100 30 160 50 Q 180 70 160 100 Q 100 120 40 100 Q 20 70 40 50 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
              {/* Two roots */}
              <path
                d="M 60 100 Q 70 180 80 100 L 80 250 Q 70 270 60 250 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
              <path
                d="M 120 100 Q 130 180 140 100 L 140 250 Q 130 270 120 250 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
            </>
          );
        } else if ([13, 14, 15].includes(toothNumber)) {
          // Child lower premolars - 2 roots
          return (
            <>
              {/* Crown */}
              <path
                d="M 50 50 Q 100 30 150 50 Q 170 70 150 100 Q 100 120 50 100 Q 30 70 50 50 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
              {/* Two roots */}
              <path
                d="M 70 100 Q 80 180 90 100 L 90 220 Q 80 240 70 220 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
              <path
                d="M 110 100 Q 120 180 130 100 L 130 220 Q 120 240 110 220 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
            </>
          );
        } else {
          // Child lower anterior - single root
          return (
            <>
              {/* Crown - smaller for child teeth */}
              <path
                d="M 70 50 Q 100 30 130 50 Q 150 70 130 90 Q 100 110 70 90 Q 50 70 70 50 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
              {/* Single root */}
              <path
                d="M 90 90 Q 100 160 110 90 L 110 220 Q 100 240 90 220 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
            </>
          );
        }
      }
    } else {
      // ADULT TOOTH STRUCTURES (existing logic)
      const isUpperAnterior = [6, 7, 8, 9, 10, 11].includes(toothNumber);
      const isUpperPremolar = [4, 5, 12, 13].includes(toothNumber);
      const isUpperMolar = [1, 2, 3, 14, 15, 16].includes(toothNumber);
      const isLowerAnterior = [22, 23, 24, 25, 26, 27].includes(toothNumber);
      const isLowerPremolar = [20, 21, 28, 29].includes(toothNumber);
      const isLowerMolar = [17, 18, 19, 30, 31, 32].includes(toothNumber);

      if (isUpperTooth) {
        if (isUpperAnterior) {
          return (
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
          );
        } else if (isUpperPremolar) {
          return (
            <>
              <path
                d="M 70 180 Q 85 100 95 180 L 95 50 Q 85 20 70 50 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
              <path
                d="M 105 180 Q 115 100 125 180 L 125 50 Q 115 20 105 50 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
              <path
                d="M 40 250 Q 100 280 160 250 Q 190 220 160 180 Q 100 150 40 180 Q 10 220 40 250 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
            </>
          );
        } else if (isUpperMolar) {
          return (
            <>
              <path
                d="M 50 180 Q 60 100 70 180 L 70 50 Q 60 20 50 50 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
              <path
                d="M 90 180 Q 100 120 110 180 L 110 50 Q 100 20 90 50 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
              <path
                d="M 130 180 Q 140 80 150 180 L 150 50 Q 140 20 130 50 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
              <path
                d="M 30 250 Q 100 280 170 250 Q 200 220 170 180 Q 100 150 30 180 Q 0 220 30 250 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
            </>
          );
        }
      } else {
        if (isLowerAnterior || isLowerPremolar) {
          return (
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
          );
        } else if (isLowerMolar) {
          return (
            <>
              <path
                d="M 40 50 Q 100 20 160 50 Q 190 80 160 120 Q 100 150 40 120 Q 10 80 40 50 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
              <path
                d="M 60 120 Q 70 200 80 120 L 80 250 Q 70 280 60 250 Z"
                fill="#f8f8f8"
                stroke="#333"
                strokeWidth="2"
              />
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
    }

    // Fallback
    return (
      <>
        {isUpperTooth ? (
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
      title={`Click to see details for tooth ${toothNumber}${isChild ? ' (Child)' : ' (Adult)'}`}
    >
      {/* DECREASED: Container size */}
      <div className="relative w-16 h-16">
        <svg
          width="64"
          height="64"
          viewBox="0 0 200 300"
          className="absolute inset-0"
        >
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
          
          {!isMissing && !needsExtraction && (
            <g className="tooth-structure">
              {renderToothStructure()}
            </g>
          )}
          
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
                  strokeWidth={layer.brushSize || 6} 
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

          {needsExtraction && (
            <path
              d="M 30 30 L 170 270 M 170 30 L 30 270"
              stroke="#000000"
              strokeWidth="6" 
              strokeLinecap="round"
              style={{ filter: 'drop-shadow(2px 2px 2px rgba(0,0,0,0.5))' }}
            />
          )}

          {isMissing && (
            <text
              x="100"
              y="150"
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-bold"
              fill="#666"
              fontSize="20" 
            >
              MISSING
            </text>
          )}
        </svg>

        {/* UPDATED: Different image paths for child vs adult teeth */}
        {!isMissing && !needsExtraction && (
          <Image
            src={isChild ? `/images/child-teeth/${toothNumber}.svg` : `/images/teeth/${toothNumber}.svg`}
            alt={`Tooth ${toothNumber}`}
            fill
            className="object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        )}
        
        {!isMissing && !needsExtraction && hasCustomPainting && (
          <div className="absolute top-0.5 left-0.5 w-2 h-2 bg-green-500 rounded-full border border-white shadow-sm z-30"
               title="Has custom painting">
          </div>
        )}
        
        {!isMissing && !needsExtraction && allLayers.map((layer, index) => {
          if (layer.isCustomPainting) return null;
          
          const position = layer.position;
          let positionStyle = {};
          
          // Position overlays based on actual root anatomy
          if (rootPositions.length === 1) {
            // Single root teeth
            if (isUpperTooth) {
              positionStyle = { top: '0%', left: '25%', width: '50%', height: '40%' };
            } else {
              positionStyle = { top: '60%', left: '25%', width: '50%', height: '40%' };
            }
          } else if (rootPositions.length === 2) {
            // Two-root teeth
            if (isChild) {
              // Child two-root teeth
              switch (position) {
                case 'MESIAL':
                  positionStyle = isUpperTooth 
                    ? { top: '0%', left: '35%', width: '15%', height: '40%' }
                    : { top: '60%', left: '35%', width: '15%', height: '40%' };
                  break;
                case 'DISTAL':
                  positionStyle = isUpperTooth
                    ? { top: '0%', left: '50%', width: '15%', height: '40%' }
                    : { top: '60%', left: '50%', width: '15%', height: '40%' };
                  break;
                default:
                  positionStyle = isUpperTooth
                    ? { top: '0%', height: '40%' }
                    : { top: '60%', height: '40%' };
              }
            } else {
              // Adult two-root teeth (existing logic)
              if (rootPositions.includes("BUCCAL") && rootPositions.includes("PALATAL")) {
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
            }
          } else if (rootPositions.length === 3) {
            // Three-root teeth
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
      
      {/* DECREASED: Label size */}
      <span 
        className={`text-[10px] font-semibold mt-0.5 ${
          isMissing ? 'text-gray-400' : 
          needsExtraction ? 'text-gray-700 font-bold' : 
          'text-gray-600'
        }`}
      >
        {toothNumber}
        {isChild && <span className="text-blue-500 ml-0.5">C</span>}
        {!isChild && <span className="text-green-500 ml-0.5">A</span>}
      </span>
      
      {!isMissing && !needsExtraction && allLayers.length > 0 && (
        <div className="flex space-x-0.5 mt-0.5 flex-wrap justify-center max-w-16">
          {allLayers.map((layer, index) => (
            <div
              key={index}
              className="w-1.5 h-1.5 rounded-full border border-gray-400"
              style={{ backgroundColor: layer.color }}
              title={`${layer.position} - ${layer.condition}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// UPDATED: Root Canal Tooth Component with CORRECT child root anatomy


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

// Main Dental Chart Viewer Component - UPDATED for proper dual chart support
export default function DentalChartViewer({ params }: { params: { id: string } }) {
  const patientId = params.id;
  const router = useRouter();
  const [hasDentalChart, setHasDentalChart] = useState<boolean>(false);
  
  const [dentalCharts, setDentalCharts] = useState<{
    adult: DentalChartData | null;
    child: DentalChartData | null;
  }>({ adult: null, child: null });
  
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState<boolean>(false);
  const [explanationPosition, setExplanationPosition] = useState<{x: number, y: number}>({x: 0, y: 0});
  const [role, setRole] = useState<string>("");
  const [activeChartType, setActiveChartType] = useState<"adult" | "child">("adult");

  // Load both adult and child dental chart data
  useEffect(() => {
    const loadDentalCharts = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/DentalChart/${patientId}`);
        
        if (!response.ok) {
          throw new Error('Failed to load dental charts');
        }
        
        const data: DentalChartResponse = await response.json();
        
        if (data.success && data.data.DentalChart.length > 0) {
          // Separate adult and child charts
          const charts = {
            adult: data.data.DentalChart.find(chart => !chart.isChild) || null,
            child: data.data.DentalChart.find(chart => chart.isChild) || null
          };
          
          setDentalCharts(charts);
          setPatientData(data.data.patient);
          setHasDentalChart(true);

          // Set initial active chart based on available charts
          if (charts.adult) {
            setActiveChartType("adult");
          } else if (charts.child) {
            setActiveChartType("child");
          }
        } else {
          setHasDentalChart(false);
          setError('No dental charts found for this patient');
        }
      } catch (err) {
        console.error('Error loading dental charts:', err);
        setError('Failed to load dental chart data');
        setHasDentalChart(false);
      } finally {
        setLoading(false);
      }
    };

    const getUserRole = () => {
      const userRole = localStorage.getItem('userRole') || 'doctor';
      setRole(userRole);
    };

    loadDentalCharts();
    getUserRole();
  }, [patientId]);

  // Get current active chart data
  const getActiveChartData = (): DentalChartData | null => {
    return dentalCharts[activeChartType];
  };

  // Get tooth data from active chart
  const getToothData = (toothNumber: number): ToothData | undefined => {
    const chartData = getActiveChartData();
    return chartData?.teeth.find(t => t.toothNumber === toothNumber);
  };

  // Get custom layers from active chart
  const getCustomLayers = (toothNumber: number): RootLayer[] => {
    const chartData = getActiveChartData();
    const customTooth = chartData?.customRootLayers.find(ct => ct.toothNumber === toothNumber);
    return customTooth?.layers || [];
  };

  // Get all root layers from active chart
  const getAllRootLayers = (toothNumber: number): RootLayer[] => {
    const toothData = getToothData(toothNumber);
    const customLayers = getCustomLayers(toothNumber);
    return [...(toothData?.roots || []), ...customLayers];
  };

  // Edit function for specific chart type
  const handleEdit = (chartId: string, isChild: boolean) => {
    if (role === "doctor") {
      router.push(`/doctor/DentalChart/edit?dentalChartId=${chartId}&patientId=${patientId}&isChild=${isChild}`);
    } else if (role === "admin") {
      router.push(`/admin/DentalChart/edit?dentalChartId=${chartId}&patientId=${patientId}&isChild=${isChild}`);
    }
  };

  // Delete function for specific chart
  const handleDelete = async (chartId: string, chartType: "adult" | "child") => {
    if (!confirm(`Are you sure you want to delete this ${chartType} dental chart?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/DentalChart/detail/${chartId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert(`${chartType.charAt(0).toUpperCase() + chartType.slice(1)} dental chart deleted successfully`);
        setDentalCharts(prev => ({
          ...prev,
          [chartType]: null
        }));
        
        if (activeChartType === chartType) {
          const otherChartType = chartType === "adult" ? "child" : "adult";
          if (dentalCharts[otherChartType]) {
            setActiveChartType(otherChartType);
          } else {
            setHasDentalChart(false);
          }
        }
      } else {
        throw new Error('Failed to delete dental chart');
      }
    } catch (error) {
      console.error('Error deleting dental chart:', error);
      alert('Failed to delete dental chart');
    }
  };

  // Handle tooth click with chart type context
  const handleToothClick = (toothNumber: number, event: React.MouseEvent) => {
    setSelectedTooth(toothNumber);
    
    const rect = event.currentTarget.getBoundingClientRect();
    setExplanationPosition({
      x: event.clientX,
      y: event.clientY
    });
    
    setShowExplanation(true);
    
    setTimeout(() => {
      setShowExplanation(false);
    }, 5000);
  };

  // Generate explanation with chart type context
  const generateToothExplanation = (toothNumber: number): string => {
    const toothData = getToothData(toothNumber);
    const customLayers = getCustomLayers(toothNumber);
    const allRootLayers = getAllRootLayers(toothNumber);
    const overallStatus = getOverallToothStatus(toothData);

    if (!toothData && customLayers.length === 0) {
      return `Tooth ${toothNumber} is healthy with no recorded conditions. [${activeChartType.toUpperCase()}]`;
    }

    let explanation = `Tooth ${toothNumber} - ${activeChartType.toUpperCase()} CHART - `;

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

  // Render chart type selector
  const renderChartTypeSelector = () => (
    <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-4">
            <ColorLegend />

      <h3 className="font-bold text-lg mb-3 text-gray-800">Chart Type</h3>
      <div className="flex space-x-2">
        <button
          onClick={() => setActiveChartType("adult")}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeChartType === "adult" 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          disabled={!dentalCharts.adult}
        >
          Adult Chart (32 teeth) {dentalCharts.adult ? '✅' : '❌'}
        </button>
        <button
          onClick={() => setActiveChartType("child")}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeChartType === "child" 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
          disabled={!dentalCharts.child}
        >
          Child Chart (24 teeth) {dentalCharts.child ? '✅' : '❌'}
        </button>
      </div>
    </div>
  );

// COMBINED: Render surface and root canal chart in one view with proper alignment
// COMBINED: Render surface and root canal chart in one view with proper alignment - ONLY 2 ROWS
// COMBINED: Render surface and root canal chart in one view with horizontal scroll - ONLY 2 ROWS
const renderCombinedChart = () => {
  const chartData = getActiveChartData();
  const isChild = activeChartType === "child";
  const layout = isChild ? CHILD_DENTAL_CHART_LAYOUT : ADULT_DENTAL_CHART_LAYOUT;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-gray-300 relative">
      {showExplanation && selectedTooth && (
        <ExplanationTooltip
          toothNumber={selectedTooth}
          explanation={generateToothExplanation(selectedTooth)}
          position={explanationPosition}
          onClose={() => setShowExplanation(false)}
        />
      )}
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">
          Combined Dental Chart - {isChild ? 'Child (24 teeth)' : 'Adult (32 teeth)'} View
        </h1>
        <div className="text-sm text-gray-500">
          Last updated: {chartData ? new Date(chartData.updatedAt).toLocaleDateString() : 'N/A'}
        </div>
      </div>



      {/* Surface Legend */}
      <div className="grid grid-cols-5 gap-2 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-base font-bold">M</div>
          <div className="text-xs text-gray-600">Mesial</div>
        </div>
        <div className="text-center">
          <div className="text-base font-bold">O</div>
          <div className="text-xs text-gray-600">Occlusal</div>
        </div>
        <div className="text-center">
          <div className="text-base font-bold">D</div>
          <div className="text-xs text-gray-600">Distal</div>
        </div>
        <div className="text-center">
          <div className="text-base font-bold">B</div>
          <div className="text-xs text-gray-600">Buccal</div>
        </div>
        <div className="text-center">
          <div className="text-base font-bold">L</div>
          <div className="text-xs text-gray-600">Lingual</div>
        </div>
      </div>

      <div className="border-2 border-gray-200 rounded-xl p-4 space-y-8">
        {/* Upper Jaw - SINGLE ROW with horizontal scroll */}
        <div className="space-y-2">
          <div className="text-center font-semibold text-gray-700 bg-gray-100 py-2 rounded text-base">
            Upper Jaw
          </div>
          
          <div className="flex justify-start overflow-x-auto pb-4">
            <div className="flex flex-nowrap gap-4 px-2 min-w-max">
              {layout.upper.map(num => (
                <div key={`upper-tooth-${num}`} className="flex flex-col items-center space-y-1 flex-shrink-0">
                  {/* Root Canal View */}
                  <div className="mb-1 transform scale-110">
                    <RootCanalToothView
                      toothNumber={num}
                      toothData={getToothData(num)}
                      customLayers={getCustomLayers(num)}
                      onToothClick={handleToothClick}
                      isChild={isChild}
                    />
                  </div>
                  
                  {/* Surface View - DIRECTLY BELOW Root Canal View */}
                  <div className="mt-1 transform scale-110">
                    <SurfaceToothView
                      toothNumber={num}
                      toothData={getToothData(num)}
                      onToothClick={handleToothClick}
                      isChild={isChild}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Spacer between upper and lower jaws */}
        <div className="h-3 border-t border-gray-300"></div>

        {/* Lower Jaw - SINGLE ROW with horizontal scroll */}
        <div className="space-y-2">
          <div className="text-center font-semibold text-gray-700 bg-gray-100 py-2 rounded text-base">
            Lower Jaw
          </div>
          
          <div className="flex justify-start overflow-x-auto pb-4">
            <div className="flex flex-nowrap gap-4 px-2 min-w-max">
              {layout.lower.map(num => (
                <div key={`lower-tooth-${num}`} className="flex flex-col items-center space-y-1 flex-shrink-0">
                  {/* Surface View */}
                  <div className="mb-1 transform scale-110">
                    <SurfaceToothView
                      toothNumber={num}
                      toothData={getToothData(num)}
                      onToothClick={handleToothClick}
                      isChild={isChild}
                    />
                  </div>
                  
                  {/* Root Canal View - DIRECTLY BELOW Surface View */}
                  <div className="mt-1 transform scale-110">
                    <RootCanalToothView
                      toothNumber={num}
                      toothData={getToothData(num)}
                      customLayers={getCustomLayers(num)}
                      onToothClick={handleToothClick}
                      isChild={isChild}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Instructions */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
        <p className="text-yellow-700 text-sm">
          💡 <strong>Scroll horizontally</strong> to view all teeth. Each tooth shows Root Canal view (top) and Surface view (bottom).
        </p>
      </div>

      {/* Created By Information */}
      {chartData?.createdBy && (
        <div className="mb-4 mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2 text-base">Chart Information</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="font-medium text-gray-700">Created By:</span>
              <span className="ml-2 text-gray-600">{chartData.createdBy.username}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Created Date:</span>
              <span className="ml-2 text-gray-600">
                {chartData ? new Date(chartData.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Chart Version:</span>
              <span className="ml-2 text-gray-600">v{chartData?.version || 1}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Patient Type:</span>
              <span className="ml-2 text-gray-600">
                {isChild ? 'Child' : 'Adult'} ({isChild ? '24 teeth' : '32 teeth'})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Change History */}
 {chartData?.changeHistory && chartData.changeHistory.length > 0 && (
  <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
    <h3 className="font-semibold text-gray-800 mb-3 text-base">Recent Changes</h3>
    <div className="space-y-2 max-h-32 overflow-y-auto"> {/* Reduced max-height and added overflow */}
      {chartData.changeHistory.slice(0, 5).map((change, index) => (
        <div key={index} className="flex items-start justify-between p-2 bg-white rounded border">
          <div className="text-right text-xs text-gray-500">
            <div>{change.updatedBy?.username || 'System'}</div>
            <div>{new Date(change.updateTime).toLocaleDateString()}</div>
          </div>
        </div>
      ))}
      {chartData.changeHistory.length > 5 && (
        <div className="text-center text-sm text-gray-500 pt-2 sticky bottom-0 bg-gray-50">
          + {chartData.changeHistory.length - 5} more changes
        </div>
      )}
    </div>
  </div>
)}
    </div>
  );
};



  // Action buttons for multiple charts
  const renderActionButtons = () => (
    <div className="flex space-x-4 mt-6 flex-wrap gap-2">
      <button
        onClick={() => router.back()}
        className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition-colors"
      >
        Back
      </button>
      
      {/* Create Dental Chart Buttons */}
      {(role === "doctor" || role === "admin") && (
        <div className="flex space-x-2">
          {!dentalCharts.adult && (
            <button
              className="bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center space-x-2"
              onClick={() => router.push(`/${role}/DentalChart/add/${patientId}`)}>
              <PlusOutlined />
              <span>Create Adult Chart</span>
            </button>
          )}
          
          {!dentalCharts.child && (
            <button
              className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-2"
              onClick={() => router.push(`/${role}/DentalChart/child/add/${patientId}`)}>
              <PlusOutlined />
              <span>Create Child Chart</span>
            </button>
          )}
        </div>
      )}
      
      {/* Edit and Delete Buttons for active chart */}
      {(role === "doctor" || role === "admin") && getActiveChartData() && (
        <div className="flex space-x-2">
          <button
            className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center space-x-2"
            onClick={() => handleEdit(getActiveChartData()!._id, activeChartType === "child")}
          >
            <EditOutlined />
            <span>Edit {activeChartType === "child" ? "Child" : "Adult"} Chart</span>
          </button>
          <button
            className="bg-red-500 text-white px-6 py-2 rounded-md hover:bg-red-600 transition-colors flex items-center space-x-2"
            onClick={() => handleDelete(getActiveChartData()!._id, activeChartType)}
          >
            <DeleteOutlined />
            <span>Delete {activeChartType === "child" ? "Child" : "Adult"} Chart</span>
          </button>
        </div>
      )}
      
      {/* Print Button */}
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
            Combined Conditions (Surface + Root Canal):
          </label>
          <div className="space-y-2 text-sm">
            {/* Surface Conditions */}
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
            
            {/* Root Conditions */}
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
            
            {(!toothData?.surfaces || toothData.surfaces.length === 0) && allRootLayers.length === 0 && (
              <div className="text-gray-500 italic">No conditions recorded</div>
            )}
          </div>
        </div>
      </div>
    );
  };

return (
   <div className="flex m-8">
    <div className="flex-grow md:ml-64 container mx-auto p-6">
      <PatientComponent params={params} />
      
      {!hasDentalChart ? (
        <div className="bg-white p-10 rounded-lg shadow-lg border-2 border-gray-300 text-center">
          <div className="mb-8">
            <div className="text-7xl mb-6">🦷</div>
            <h2 className="text-3xl font-bold text-gray-700 mb-3">No Dental Charts Found</h2>
            <p className="text-gray-600 mb-8 text-lg">
              This patient doesn't have any dental chart records yet.
            </p>
            {renderActionButtons()}
          </div>
        </div>
      ) : (
        <>
        

          <div className="flex space-x-10">
            <div className="w-1/3 p-5 space-y-8">
              {renderChartTypeSelector()}
              {renderToothDetails()}
            </div>

            <div className="w-2/3">
              {renderCombinedChart()}
              {renderActionButtons()}
            </div>
          </div>
        </>
      )}
    </div>
  </div>
);
}