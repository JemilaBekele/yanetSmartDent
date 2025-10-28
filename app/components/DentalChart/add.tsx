"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import SVGPainter from "./svg";
import PatientComponent from "./PatientComponent";

type DentalChartProps = {
  params: {
    id: string; // Patient ID
  };
};

// Updated RootLayer interface to match SVGPainter
interface RootLayer {
  id: string;
  points: number[][];
  color: string;
  condition: string;
  brushSize: number;
  svgData: string | null;
  coordinates: Array<{ x: number; y: number; timestamp: string }>;
  isCustomPainting: boolean;
  position: string;
  timestamp: string;
}

interface CustomRootLayer {
  toothNumber: number;
  layers: RootLayer[];
  lastUpdated: string;
}

// Updated Tooth conditions mapping with SILVER color fixed and overall status conditions separated
const TOOTH_CONDITIONS = {
  CARIES: { label: "Caries/Lesions", colorCode: "#FF0000" }, // Red
  SILVER_AMALGAM: { label: "Silver Amalgam Fillings", colorCode: "#C0C0C0" }, // Changed to actual silver color
  COMPOSITE_FILLING: { label: "Composite Fillings", colorCode: "#800080" }, // Purple
  CROWN_MISSING: { label: "Crown Missing", colorCode: "#A0522D" }, // Sienna/Brown
  CROWN: { label: "Crown", colorCode: "#FFD700" }, // Gold
  NEED_ROOT_CANAL: { label: "Need Root Canal Treatment", colorCode: "#FF1493" }, // Deep Pink
  RCT_TREATED: { label: "R.C. Treated Tooth", colorCode: "#0000FF" }, // Blue
  POOR_RCT: { label: "Poor R.C.T Tooth", colorCode: "#E08D7E" }, // Red
  PROSTHETIC_CROWN: { label: "Prosthetic Crown", colorCode: "#FFD700" } // Gold (same as crown)
};

// OVERALL_STATUS conditions (not for surfaces)
const OVERALL_STATUS = {
  NORMAL: { label: "Normal", colorCode: "transparent" },
  MISSING_TOOTH: { label: "Missing Tooth", colorCode: "#D3D3D3" }, // Light Gray
  NEED_EXTRACTION: { label: "Tooth Needs Extraction", colorCode: "#000000" }, // Black
  CROWN: { label: "Crown", colorCode: "#FFD700" }, // Gold
  PROSTHETIC_CROWN: { label: "Prosthetic Crown", colorCode: "#FFD700" } // Gold
};

// Root canal conditions mapping using backend colors - UPDATED (removed missing/extraction)
const ROOT_CANAL_CONDITIONS = {
  NORMAL: { label: "Normal", colorCode: "transparent" },
  NEED_ROOT_CANAL: { label: "Need Root Canal", colorCode: "#FF1493" }, // Deep Pink
  RCT_TREATED: { label: "R.C. Treated", colorCode: "#0000FF" }, // Blue
  POOR_RCT: { label: "Poor R.C.T", colorCode: "#E08D7E" }, // Red
  CROWN: { label: "Crown (tooth or with crown)", colorCode: "#FFD700" }, // Gold
  PROSTHETIC_CROWN: { label: "Prosthetic Crown", colorCode: "#FFD700" } // Gold
};

// Universal numbering system (1-32)
const DENTAL_CHART_LAYOUT = {
  upper: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
  lower: [32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17]
};

// Teeth with only 4 surfaces (anterior teeth without occlusal surface)
const FOUR_SURFACE_TEETH = [6, 7, 8, 9, 10, 11, 22, 23, 24, 25, 26, 27];

const ROOT_POSITIONS = {
  SINGLE: ["FULL"],
  DOUBLE: ["BUCCAL", "PALATAL"], // for upper premolars
  TRIPLE_UPPER: ["MESIOBUCCAL", "DISTOBUCCAL", "PALATAL"], // for upper molars
  DOUBLE_LOWER: ["MESIAL", "DISTAL"], // for lower molars
};

// ✅ Corrected based on anatomical chart
const getRootPositions = (toothNumber: number): string[] => {
  // UPPER JAW (1-16 in Universal numbering)
  if (toothNumber >= 1 && toothNumber <= 16) {
    if ([4,6, 7, 8, 9, 10, 11,13].includes(toothNumber)) {
      return ROOT_POSITIONS.SINGLE;
    } 
    else if ([5, 12].includes(toothNumber)) {
      return ROOT_POSITIONS.DOUBLE;
    } 
    else if ([1, 2, 3, 14, 15, 16].includes(toothNumber)) {
      return ROOT_POSITIONS.TRIPLE_UPPER;
    }
  }

  // LOWER JAW (17-32 in Universal numbering)
  if (toothNumber >= 17 && toothNumber <= 32) {
    if ([22, 23, 24, 25, 26, 27].includes(toothNumber)) {
      return ROOT_POSITIONS.SINGLE;
    } 
    else if ([20, 21, 28, 29].includes(toothNumber)) {
      return ROOT_POSITIONS.SINGLE;
    } 
    else if ([17, 18, 19, 30, 31, 32].includes(toothNumber)) {
      return ROOT_POSITIONS.DOUBLE_LOWER;
    }
  }

  return ROOT_POSITIONS.SINGLE;
};

// Geometric Diagram Component for Surface Chart
const GeometricDiagram = ({ 
  width = 48, 
  height = 64,
  outerRectColor = "#000000",
  innerRectColor = "#000000",
  lineColor = "#000000",
  lineWidth = 0.5,
  toothNumber
}: {
  width?: number;
  height?: number;
  outerRectColor?: string;
  innerRectColor?: string;
  lineColor?: string;
  lineWidth?: number;
  toothNumber?: number;
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
      {/* Outer Rectangle */}
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
      
      {/* Connecting Lines */}
      <line x1="0" y1="0" x2={innerRectX} y2={innerRectY} stroke={lineColor} strokeWidth={lineWidth} />
      <line x1={outerRect.width} y1="0" x2={innerRectX + innerRect.width} y2={innerRectY} stroke={lineColor} strokeWidth={lineWidth} />
      <line x1={outerRect.width} y1={outerRect.height} x2={innerRectX + innerRect.width} y2={innerRectY + innerRect.height} stroke={lineColor} strokeWidth={lineWidth} />
      <line x1="0" y1={outerRect.height} x2={innerRectX} y2={innerRectY + innerRect.height} stroke={lineColor} strokeWidth={lineWidth} />
    </svg>
  );
};

// Tooth image component
const ToothImage = ({ toothNumber }: { toothNumber: number }) => {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-12 relative">
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
      </div>
      <span className="text-xs font-semibold text-gray-600 mt-1">{toothNumber}</span>
    </div>
  );
};

// Surface Chart Tooth Component - FIXED COLOR SELECTION
const SurfaceTooth = ({ 
  toothNumber, 
  isSelected, 
  onClick, 
  getSurfaceCondition, 
  handleSurfaceClick, 
  getOverallToothStatus,
  getToothNote,
  selectedCondition // ADD THIS PROP
}: { 
  toothNumber: number; 
  isSelected: boolean;
  onClick: () => void;
  getSurfaceCondition: (toothNumber: number, surfaceName: string) => string | null;
  handleSurfaceClick: (toothNumber: number, surfaceName: string, condition: string) => void;
  getOverallToothStatus: (toothNumber: number) => string | null;
  getToothNote: (toothNumber: number) => string | null;
  selectedCondition: string; // ADD THIS
}) => {
  const isFourSurfaceTooth = FOUR_SURFACE_TEETH.includes(toothNumber);
  const overallStatus = getOverallToothStatus(toothNumber);
  const toothNote = getToothNote(toothNumber);
  
  // Check if tooth is marked as missing or needs extraction
  const isMissing = overallStatus === "MISSING_TOOTH";
  const needsExtraction = overallStatus === "NEED_EXTRACTION";

  return (
    <div className="flex flex-col items-center space-y-1">
      <div
        className={`relative w-12 h-12 bg-white cursor-pointer transition-all duration-200 ${
          isSelected ? 'shadow-lg scale-110 border-2 border-blue-500' : 'shadow-md border border-gray-400'
        } ${isMissing ? 'opacity-50' : ''}`}
        onClick={onClick}
      >
        {/* Background for missing tooth - completely gray */}
        {isMissing && (
          <div 
            className="absolute inset-0 z-0 flex items-center justify-center"
            style={{ 
              backgroundColor: OVERALL_STATUS.MISSING_TOOTH.colorCode,
              opacity: 0.7
            }}
          >
            <span className="text-xs font-bold text-gray-600">Missing</span>
          </div>
        )}

        {/* Geometric Diagram Background - hidden for missing teeth */}
        {!isMissing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
            <GeometricDiagram 
              width={64}
              height={64}
              outerRectColor="#111111"
              innerRectColor="#111111"
              lineColor="#111111"
              lineWidth={3}
              toothNumber={toothNumber}
            />
          </div>
        )}

        {/* Surface Overlays - only show if tooth is not missing and doesn't need extraction */}
        {!isMissing && !needsExtraction && (
          <div className="absolute inset-0 z-10">
            {/* Buccal (Top) */}
            <div
              className="absolute top-0 left-0 right-0 h-1/2 cursor-pointer hover:opacity-70"
              style={{ 
                clipPath: 'polygon(0% 0%, 100% 0%, 75% 50%, 25% 50%)',
                backgroundColor: getSurfaceCondition(toothNumber, "Buccal") 
                  ? TOOTH_CONDITIONS[getSurfaceCondition(toothNumber, "Buccal") as keyof typeof TOOTH_CONDITIONS]?.colorCode 
                  : 'transparent'
              }}
              onClick={(e) => {
                e.stopPropagation();
                const currentCondition = getSurfaceCondition(toothNumber, "Buccal");
                // FIX: Use selectedCondition instead of hardcoded "CARIES"
                const newCondition = currentCondition ? null : selectedCondition;
                handleSurfaceClick(toothNumber, "Buccal", newCondition || selectedCondition);
              }}
              title="Buccal"
            ></div>

            {/* Lingual (Bottom) */}
            <div
              className="absolute bottom-0 left-0 right-0 h-1/2 cursor-pointer hover:opacity-70"
              style={{ 
                clipPath: 'polygon(25% 50%, 75% 50%, 100% 100%, 0% 100%)',
                backgroundColor: getSurfaceCondition(toothNumber, "Lingual") 
                  ? TOOTH_CONDITIONS[getSurfaceCondition(toothNumber, "Lingual") as keyof typeof TOOTH_CONDITIONS]?.colorCode 
                  : 'transparent'
              }}
              onClick={(e) => {
                e.stopPropagation();
                const currentCondition = getSurfaceCondition(toothNumber, "Lingual");
                // FIX: Use selectedCondition instead of hardcoded "CARIES"
                const newCondition = currentCondition ? null : selectedCondition;
                handleSurfaceClick(toothNumber, "Lingual", newCondition || selectedCondition);
              }}
              title="Lingual"
            ></div>

            {/* Mesial (Left) */}
            <div
              className="absolute top-0 bottom-0 left-0 w-1/2 cursor-pointer hover:opacity-70"
              style={{ 
                clipPath: 'polygon(0% 0%, 50% 25%, 50% 75%, 0% 100%)',
                backgroundColor: getSurfaceCondition(toothNumber, "Mesial") 
                  ? TOOTH_CONDITIONS[getSurfaceCondition(toothNumber, "Mesial") as keyof typeof TOOTH_CONDITIONS]?.colorCode 
                  : 'transparent'
              }}
              onClick={(e) => {
                e.stopPropagation();
                const currentCondition = getSurfaceCondition(toothNumber, "Mesial");
                // FIX: Use selectedCondition instead of hardcoded "CARIES"
                const newCondition = currentCondition ? null : selectedCondition;
                handleSurfaceClick(toothNumber, "Mesial", newCondition || selectedCondition);
              }}
              title="Mesial"
            ></div>

            {/* Distal (Right) */}
            <div
              className="absolute top-0 bottom-0 right-0 w-1/2 cursor-pointer hover:opacity-70"
              style={{ 
                clipPath: 'polygon(50% 25%, 100% 0%, 100% 100%, 50% 75%)',
                backgroundColor: getSurfaceCondition(toothNumber, "Distal") 
                  ? TOOTH_CONDITIONS[getSurfaceCondition(toothNumber, "Distal") as keyof typeof TOOTH_CONDITIONS]?.colorCode 
                  : 'transparent'
              }}
              onClick={(e) => {
                e.stopPropagation();
                const currentCondition = getSurfaceCondition(toothNumber, "Distal");
                // FIX: Use selectedCondition instead of hardcoded "CARIES"
                const newCondition = currentCondition ? null : selectedCondition;
                handleSurfaceClick(toothNumber, "Distal", newCondition || selectedCondition);
              }}
              title="Distal"
            ></div>

            {/* Occlusal (Center) - only for posterior teeth */}
            {!isFourSurfaceTooth && (
              <div
                className="absolute top-1/4 left-1/4 w-1/2 h-1/2 cursor-pointer hover:opacity-70"
                style={{ 
                  backgroundColor: getSurfaceCondition(toothNumber, "Occlusal") 
                    ? TOOTH_CONDITIONS[getSurfaceCondition(toothNumber, "Occlusal") as keyof typeof TOOTH_CONDITIONS]?.colorCode 
                    : 'transparent'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  const currentCondition = getSurfaceCondition(toothNumber, "Occlusal");
                  // FIX: Use selectedCondition instead of hardcoded "CARIES"
                  const newCondition = currentCondition ? null : selectedCondition;
                  handleSurfaceClick(toothNumber, "Occlusal", newCondition || selectedCondition);
                }}
                title="Occlusal"
              ></div>
            )}
          </div>
        )}

        {/* "X" overlay for extraction - stays on top */}
        {needsExtraction && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <svg className="w-full h-full text-black" viewBox="0 0 10 10">
              <path 
                d="M1,1 L9,9 M9,1 L1,9" 
                strokeWidth="1.5" 
                strokeLinecap="round"
                stroke={OVERALL_STATUS.NEED_EXTRACTION.colorCode}
              />
            </svg>
          </div>
        )}

        {/* Crown overlay */}
        {(overallStatus === "CROWN" || overallStatus === "PROSTHETIC_CROWN") && (
          <div 
            className="absolute inset-0 border-2 pointer-events-none z-15"
            style={{ 
              borderColor: OVERALL_STATUS.CROWN.colorCode,
              borderStyle: overallStatus === "PROSTHETIC_CROWN" ? "dashed" : "solid",
              borderWidth: '3px'
            }}
          />
        )}

        {/* Note Indicator */}
        {toothNote && (
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border border-yellow-600 z-30"
               title={`Note: ${toothNote}`}>
          </div>
        )}
      </div>
      
      <div className="text-xs font-semibold text-gray-600">{toothNumber}</div>
      
      {/* Note Preview */}
      {toothNote && (
        <div className="text-xs text-yellow-700 bg-yellow-100 px-1 py-0.5 rounded max-w-[60px] truncate"
             title={toothNote}>
          {toothNote.length > 10 ? `${toothNote.substring(0, 10)}...` : toothNote}
        </div>
      )}
    </div>
  );
};

// Root Canal Tooth Component
const RootCanalTooth = ({ 
  toothNumber, 
  isSelected, 
  onClick,
  rootLayers,
  onRootClick,
  selectedRootPosition,
  hasCustomPainting,
  overallStatus
}: { 
  toothNumber: number; 
  isSelected: boolean;
  onClick: () => void;
  rootLayers: any[];
  onRootClick: (position: string, condition: string) => void;
  selectedRootPosition: string | null;
  hasCustomPainting: boolean;
  overallStatus: string | null;
}) => {
  const rootPositions = getRootPositions(toothNumber);
  const isAnterior = rootPositions.length === 1;
  
  // Check special statuses
  const isMissing = overallStatus === "MISSING_TOOTH";
  const needsExtraction = overallStatus === "NEED_EXTRACTION";
  const hasCrown = overallStatus === "CROWN" || overallStatus === "PROSTHETIC_CROWN";

  return (
    <div 
      className={`flex flex-col items-center cursor-pointer transition-all duration-200 ${
        isSelected ? 'scale-110' : ''
      } ${isMissing ? 'opacity-50' : ''}`}
      onClick={onClick}
    >
      <div className="relative w-20 h-20">
        {/* Base tooth image with missing tooth background */}
        {isMissing ? (
          <div 
            className="absolute inset-0 bg-gray-200 rounded flex items-center justify-center"
            style={{ 
              backgroundColor: OVERALL_STATUS.MISSING_TOOTH.colorCode,
              opacity: 0.7
            }}
          >
            <span className="text-xs font-bold text-gray-600">Missing</span>
          </div>
        ) : (
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
        
        {/* Crown overlay */}
        {hasCrown && (
          <div 
            className="absolute inset-0 border-2 pointer-events-none z-15"
            style={{ 
              borderColor: OVERALL_STATUS.CROWN.colorCode,
              borderStyle: overallStatus === "PROSTHETIC_CROWN" ? "dashed" : "solid",
              borderWidth: '3px'
            }}
          />
        )}
        
        {/* Custom painting indicator */}
        {hasCustomPainting && (
          <div className="absolute top-1 left-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm z-30"
               title="Has custom painting">
          </div>
        )}
        
        {/* Root canal condition overlays by position - only if not missing and doesn't need extraction */}
        {!isMissing && !needsExtraction && rootLayers.map((layer, index) => {
          const position = layer.position;
          let positionStyle = {};
          
          if (isAnterior) {
            positionStyle = { top: '60%', height: '40%' };
          } else {
            switch (position) {
              case 'BUCCAL':
              case 'MESIOBUCCAL':
                positionStyle = { top: '60%', left: '25%', width: '25%', height: '40%' };
                break;
              case 'LINGUAL':
                positionStyle = { top: '60%', left: '50%', width: '25%', height: '40%' };
                break;
              case 'DISTOBUCCAL':
              case 'DISTAL':
                positionStyle = { top: '60%', left: '75%', width: '25%', height: '40%' };
                break;
              case 'MESIAL':
                positionStyle = { top: '60%', left: '0%', width: '25%', height: '40%' };
                break;
              default:
                positionStyle = { top: '60%', height: '40%' };
            }
          }
          
          return (
            <div
              key={index}
              className="absolute cursor-pointer border border-gray-300 hover:border-blue-500 transition-colors"
              style={{
                ...positionStyle,
                backgroundColor: layer.color,
                opacity: 0.7
              }}
              onClick={(e) => {
                e.stopPropagation();
                const currentCondition = layer.condition;
                const newCondition = currentCondition === "NORMAL" ? "NEED_ROOT_CANAL" : "NORMAL";
                onRootClick(position, newCondition);
              }}
              title={`${position} - ${layer.condition}`}
            />
          );
        })}
        
        {/* Root position indicators (clickable areas) - only if not missing and doesn't need extraction */}
        {!isMissing && !needsExtraction && rootPositions.map((position, index) => {
          const hasLayer = rootLayers.some(layer => layer.position === position);
          
          if (!hasLayer) {
            let positionStyle = {};
            let label = "";
            
            if (isAnterior) {
              positionStyle = { 
                top: '60%', 
                height: '40%',
                left: '0%',
                width: '100%'
              };
              label = "ROOT";
            } else {
              switch (position) {
                case 'BUCCAL':
                  positionStyle = { top: '60%', left: '30%', width: '20%', height: '40%' };
                  label = "B";
                  break;
                case 'LINGUAL':
                  positionStyle = { top: '60%', left: '50%', width: '20%', height: '40%' };
                  label = "L";
                  break;
                case 'MESIOBUCCAL':
                  positionStyle = { top: '60%', left: '20%', width: '20%', height: '40%' };
                  label = "MB";
                  break;
                case 'DISTOBUCCAL':
                  positionStyle = { top: '60%', left: '60%', width: '20%', height: '40%' };
                  label = "DB";
                  break;
                case 'MESIAL':
                  positionStyle = { top: '60%', left: '10%', width: '20%', height: '40%' };
                  label = "M";
                  break;
                case 'DISTAL':
                  positionStyle = { top: '60%', left: '70%', width: '20%', height: '40%' };
                  label = "D";
                  break;
                default:
                  positionStyle = { top: '60%', height: '40%' };
              }
            }
            
            return (
              <div
                key={position}
                className={`absolute cursor-pointer border border-dashed border-gray-400 hover:border-blue-500 transition-colors flex items-center justify-center ${
                  selectedRootPosition === position ? 'bg-blue-100 border-blue-500' : 'bg-gray-100'
                }`}
                style={positionStyle}
                onClick={(e) => {
                  e.stopPropagation();
                  onRootClick(position, "NEED_ROOT_CANAL");
                }}
                title={`Click to mark ${position} root`}
              >
                <span className="text-xs font-bold text-gray-600">{label}</span>
              </div>
            );
          }
          return null;
        })}
        
        {/* "X" overlay for extraction */}
        {needsExtraction && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <svg className="w-full h-full text-black" viewBox="0 0 10 10">
              <path 
                d="M1,1 L9,9 M9,1 L1,9" 
                strokeWidth="1.5" 
                strokeLinecap="round"
                stroke={OVERALL_STATUS.NEED_EXTRACTION.colorCode}
              />
            </svg>
          </div>
        )}
        
        {/* Selection border */}
        {isSelected && (
          <div className="absolute inset-0 border-2 border-blue-500 rounded pointer-events-none z-10" />
        )}
      </div>
      
      <span className="text-xs font-semibold text-gray-600 mt-1">{toothNumber}</span>
      
      {/* Root canal status indicator */}
      {!isMissing && !needsExtraction && rootLayers.length > 0 && (
        <div className="flex space-x-1 mt-1 flex-wrap justify-center max-w-20">
          {rootLayers.map((layer, index) => (
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

// Main Component with Tabs
export default function DentalChart({ params }: DentalChartProps) {
  const patientId = params.id;
  const router = useRouter();
  const { data: session } = useSession();

  const [activeTab, setActiveTab] = useState<"surface" | "rootCanal">("surface");
  
  // Common states
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [teethData, setTeethData] = useState<any[]>([]);
  const [generalNote, setGeneralNote] = useState("");
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formType, setFormType] = useState<"success" | "error" | null>(null);

  // Surface Chart states
  const [selectedCondition, setSelectedCondition] = useState<string>("CARIES");

  // Root Canal Chart states
  const [selectedRootCanalCondition, setSelectedRootCanalCondition] = useState<string>("NORMAL");
  const [selectedRootPosition, setSelectedRootPosition] = useState<string | null>(null);
  const [brushSize, setBrushSize] = useState(18);
  const [painterTooth, setPainterTooth] = useState<number | null>(null);
  const [customRootLayers, setCustomRootLayers] = useState<CustomRootLayer[]>([]);

  const role = useMemo(() => session?.user?.role || "", [session]);

  // Load existing dental chart
  useEffect(() => {
    const loadDentalChart = async () => {
      try {
        const response = await fetch(`/api/DentalChart/${patientId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.data) {
            setTeethData(data.data.teeth || []);
            if (data.data.customRootLayers) {
              const transformedLayers: CustomRootLayer[] = data.data.customRootLayers.map((layer: any) => ({
                toothNumber: layer.toothNumber,
                layers: layer.layers.map((l: any) => ({
                  id: l.id || `layer-${Date.now()}`,
                  points: l.points || [],
                  color: l.color,
                  condition: l.condition,
                  brushSize: l.brushSize || 8,
                  svgData: l.svgData || null,
                  coordinates: l.coordinates || [],
                  isCustomPainting: l.isCustomPainting !== undefined ? l.isCustomPainting : true,
                  position: l.position || "CUSTOM",
                  timestamp: l.timestamp || new Date().toISOString()
                })),
                lastUpdated: layer.lastUpdated || new Date().toISOString()
              }));
              setCustomRootLayers(transformedLayers);
            }
          }
        }
      } catch (error) {
        console.error("Error loading dental chart:", error);
      }
    };

    loadDentalChart();
  }, [patientId]);

  // Helper function to get overall tooth status
  const getOverallToothStatus = (toothNumber: number): string | null => {
    const tooth = teethData.find(t => t.toothNumber === toothNumber);
    return tooth?.overallStatus || null;
  };

  // Helper function to get tooth note
  const getToothNote = (toothNumber: number): string | null => {
    const tooth = teethData.find(t => t.toothNumber === toothNumber);
    return tooth?.generalNote || null;
  };

  // Surface Chart Handlers
// Surface Chart Handlers
const handleSurfaceToothClick = (toothNumber: number) => {
  const newSelectedTooth = toothNumber === selectedTooth ? null : toothNumber;
  setSelectedTooth(newSelectedTooth);
  
  if (newSelectedTooth) {
    const existingTooth = teethData.find(t => t.toothNumber === newSelectedTooth);
    // Make sure we get the note from the tooth data
    const note = existingTooth?.generalNote || existingTooth?.notes || "";
    setGeneralNote(note);
    
    
  } else {
    setGeneralNote("");
  }
};

  // FIXED Surface Chart Handlers - properly use selected condition
  const handleSurfaceClick = (toothNumber: number, surfaceName: string, condition: string) => {
    let isNewTooth = true;
    
    // FIX: Use the selected condition from state
    const conditionToApply = condition || selectedCondition;
    
    const updatedTeeth = teethData.map(tooth => {
      if (tooth.toothNumber === toothNumber) {
        isNewTooth = false;
        let isNewSurface = true;
        const updatedSurfaces = tooth.surfaces?.map((surface: any) => {
          if (surface.name === surfaceName) {
            isNewSurface = false;
            if (surface.condition === conditionToApply) {
              return null; // Remove condition if same
            }
            return { 
              ...surface, 
              condition: conditionToApply,
              color: TOOTH_CONDITIONS[conditionToApply as keyof typeof TOOTH_CONDITIONS]?.colorCode || "#FF0000"
            };
          }
          return surface;
        }).filter(Boolean) || [];

        if (isNewSurface && conditionToApply) {
          updatedSurfaces.push({ 
            name: surfaceName, 
            condition: conditionToApply,
            color: TOOTH_CONDITIONS[conditionToApply as keyof typeof TOOTH_CONDITIONS]?.colorCode || "#FF0000"
          });
        }
        return { ...tooth, surfaces: updatedSurfaces, generalNote: tooth.generalNote || "" };
      }
      return tooth;
    });

    if (isNewTooth && conditionToApply) {
      updatedTeeth.push({
        toothNumber: toothNumber,
        surfaces: [{ 
          name: surfaceName, 
          condition: conditionToApply,
          color: TOOTH_CONDITIONS[conditionToApply as keyof typeof TOOTH_CONDITIONS]?.colorCode || "#FF0000"
        }],
        generalNote: ""
      });
    }

    setTeethData(updatedTeeth);
    
   
  };

  const getSurfaceCondition = (toothNumber: number, surfaceName: string) => {
    const tooth = teethData.find(t => t.toothNumber === toothNumber);
    if (!tooth) return null;
    const surface = tooth.surfaces?.find((s: any) => s.name === surfaceName);
    return surface ? surface.condition : null;
  };

  // Root Canal Chart Handlers
  const handleRootCanalToothClick = (toothNumber: number) => {
    const newSelectedTooth = toothNumber === selectedTooth ? null : toothNumber;
    setSelectedTooth(newSelectedTooth);
    setSelectedRootPosition(null);
    
    if (newSelectedTooth) {
      const existingTooth = teethData.find(t => t.toothNumber === newSelectedTooth);
      setGeneralNote(existingTooth?.notes || "");
    } else {
      setGeneralNote("");
    }
  };

  const handleRootPositionClick = (toothNumber: number, position: string, condition: string) => {
    setSelectedTooth(toothNumber);
    setSelectedRootPosition(position);
    
    handleRootCanalClick(toothNumber, position, condition);
  };

  const handleRootCanalClick = (toothNumber: number, position: string, condition: string) => {
    const selectedColor = ROOT_CANAL_CONDITIONS[condition as keyof typeof ROOT_CANAL_CONDITIONS]?.colorCode;
    
    const updatedTeeth = teethData.map(tooth => {
      if (tooth.toothNumber === toothNumber) {
        let updatedRoots = tooth.roots || [];
        
        const existingRootIndex = updatedRoots.findIndex((r: any) => r.position === position);
        
        if (existingRootIndex > -1) {
          if (condition === "NORMAL") {
            // Remove the root condition
            updatedRoots.splice(existingRootIndex, 1);
          } else {
            // Update the root condition
            updatedRoots[existingRootIndex] = {
              position: position,
              condition: condition,
              color: selectedColor
            };
          }
        } else if (condition !== "NORMAL") {
          // Add new root condition
          updatedRoots.push({
            position: position,
            condition: condition,
            color: selectedColor
          });
        }
        
        return { ...tooth, roots: updatedRoots };
      }
      return tooth;
    });

    if (!teethData.find(t => t.toothNumber === toothNumber) && condition !== "NORMAL") {
      updatedTeeth.push({
        toothNumber: toothNumber,
        surfaces: [],
        notes: "",
        overallStatus: "NORMAL",
        roots: [{
          position: position,
          condition: condition,
          color: selectedColor
        }]
      });
    }

    setTeethData(updatedTeeth);
  };

  const handleRemoveRootLayer = (toothNumber: number, position: string) => {
    const updatedTeeth = teethData.map(tooth => {
      if (tooth.toothNumber === toothNumber) {
        const updatedRoots = tooth.roots?.filter((root: any) => root.position !== position) || [];
        return { ...tooth, roots: updatedRoots };
      }
      return tooth;
    });

    setTeethData(updatedTeeth);
  };

  const getRootLayers = (toothNumber: number) => {
    const tooth = teethData.find(t => t.toothNumber === toothNumber);
    if (!tooth) return [];
    return tooth.roots || [];
  };

  const handleOverallStatusChange = (status: string) => {
    if (!selectedTooth) return;

    const updatedTeeth = teethData.map(tooth => 
      tooth.toothNumber === selectedTooth 
        ? { ...tooth, overallStatus: status }
        : tooth
    );

    if (!teethData.find(t => t.toothNumber === selectedTooth)) {
      updatedTeeth.push({
        toothNumber: selectedTooth,
        surfaces: [],
        notes: generalNote,
        overallStatus: status,
        roots: []
      });
    }

    setTeethData(updatedTeeth);
  };
// Add this handler to update notes immediately when typing
const handleGeneralNoteChange = (newNote: string) => {
  setGeneralNote(newNote);
  
  // IMMEDIATELY update the tooth data with the new note
  if (selectedTooth) {
    const updatedTeeth = teethData.map(tooth => 
      tooth.toothNumber === selectedTooth 
        ? { 
            ...tooth, 
            notes: newNote,
            generalNote: newNote 
          }
        : tooth
    );
    
    // If the tooth doesn't exist in teethData yet, add it
    if (!teethData.find(t => t.toothNumber === selectedTooth)) {
      updatedTeeth.push({
        toothNumber: selectedTooth,
        surfaces: [],
        notes: newNote,
        generalNote: newNote,
        overallStatus: "NORMAL",
        roots: []
      });
    }
    
    setTeethData(updatedTeeth);
    
   
  }
};
  // Custom painting handlers
  const handleRootLayerUpdate = (toothNumber: number, layers: RootLayer[]) => {
    setCustomRootLayers(prev => {
      const filtered = prev.filter(layer => layer.toothNumber !== toothNumber);
      
      if (layers.length > 0) {
        const toothLayers: CustomRootLayer = {
          toothNumber,
          layers: layers.map(layer => ({
            ...layer,
            id: layer.id || `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            points: layer.points || [],
            svgData: layer.svgData || null,
            coordinates: layer.coordinates || [],
            isCustomPainting: true,
            position: "CUSTOM",
            timestamp: layer.timestamp || new Date().toISOString()
          })),
          lastUpdated: new Date().toISOString()
        };
        return [...filtered, toothLayers];
      }
      return filtered;
    });
  };

  const getCustomRootLayers = (toothNumber: number): RootLayer[] => {
    const toothData = customRootLayers.find(layer => layer.toothNumber === toothNumber);
    return toothData?.layers || [];
  };

  const getAllRootLayers = (toothNumber: number) => {
    const positionLayers = getRootLayers(toothNumber);
    const customLayers = getCustomRootLayers(toothNumber);
    return [...positionLayers, ...customLayers];
  };

  // FIXED Handle save function - PROPERLY EXTRACT AND SAVE NOTES
// SIMPLIFIED Handle save function - notes are already in teethData
const handleSave = async () => {
  try {
    setFormMessage("Saving dental chart...");
    setFormType(null);

    // Notes are already in teethData from handleGeneralNoteChange
    const notes = teethData
      .filter(tooth => tooth.generalNote && tooth.generalNote.trim() !== '')
      .map(tooth => ({
        toothNumber: tooth.toothNumber,
        noteType: 'GENERAL',
        content: tooth.generalNote.trim(),
        timestamp: new Date().toISOString(),
        createdBy: {
          id: session?.user?.id || 'unknown',
          username: session?.user?.username || 'unknown'
        }
      }));

 

    const saveData = {
      teeth: teethData, // This now contains the updated notes
      customRootLayers: customRootLayers,
      activeTab: activeTab,
      selectedTooth: selectedTooth,
      selectedCondition: selectedCondition,
      selectedRootCanalCondition: selectedRootCanalCondition,
      brushSettings: {
        brushSize: brushSize,
        selectedColor: ROOT_CANAL_CONDITIONS[selectedRootCanalCondition as keyof typeof ROOT_CANAL_CONDITIONS]?.colorCode || "#FF1493"
      },
      notes: notes,
      changeHistory: []
    };

    

    const response = await fetch(`/api/DentalChart/${patientId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(saveData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to save dental chart");
    }

    const result = await response.json();
    
    setFormMessage("Dental chart saved successfully!");
    setFormType("success");


    setTimeout(() => {
      if (role === "doctor") {
        router.push(`/doctor/DentalChart/${patientId}`);
      } else if (role === "admin") {
        router.push(`/admin/DentalChart/${patientId}`);
      }
    }, 2000);

  } catch (error) {
    console.error("Error saving dental chart:", error);
    setFormMessage(`Error saving dental chart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    setFormType("error");
  }
};

  // Debug function
  const debugDataStructure = () => {
    customRootLayers.forEach(toothLayer => {
      toothLayer.layers.forEach((layer: RootLayer, index: number) => {
        console.log(`Tooth ${toothLayer.toothNumber}, Layer ${index}:`, {
          points: layer.points?.length || 0,
          svgData: layer.svgData ? 'Present' : 'Missing',
          coordinates: layer.coordinates?.length || 0,
          brushSize: layer.brushSize,
          color: layer.color,
          condition: layer.condition
        });
      });
    });
  };

  // Filter conditions for surface chart (remove missing/extraction)
  const getSurfaceConditions = () => {
    const { ...surfaceConditions } = TOOTH_CONDITIONS;
    return surfaceConditions;
  };

  // Render Surface Chart - UPDATED TO PASS selectedCondition
  const renderSurfaceChart = () => {
    const surfaceConditions = getSurfaceConditions();
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-md border-2 border-gray-300">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Surface Dental Chart</h1>
        </div>
        
        <div>
          <label className="block font-bold mb-2 text-gray-700">Select Condition:</label>
          <select
            value={selectedCondition}
            onChange={(e) => setSelectedCondition(e.target.value)}
            className="border p-2 rounded-md w-full mb-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            {Object.entries(surfaceConditions).map(([key, condition]) => (
              <option key={key} value={key}>
                {condition.label}
              </option>
            ))}
          </select>

          <div className="flex items-center space-x-3 mt-2 p-2 rounded-md bg-gray-50">
            <div
              className="w-6 h-6 border rounded"
              style={{ backgroundColor: surfaceConditions[selectedCondition as keyof typeof surfaceConditions]?.colorCode }}
            ></div>
            <span className="text-sm font-medium text-gray-600">
              {surfaceConditions[selectedCondition as keyof typeof surfaceConditions]?.label}
            </span>
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

        <div className="border-2 border-gray-200 rounded-xl p-4 space-y-6">
          {/* Upper Jaw Row */}
          <div className="flex flex-col items-center w-full">
            {/* Upper Jaw Illustrations */}
            <div className="flex justify-between items-center w-full max-w-6xl mb-2 px-4">
              <div className="flex gap-1">
                {DENTAL_CHART_LAYOUT.upper.slice(0, 8).map(num => <ToothImage key={num} toothNumber={num} />)}
              </div>
              <div className="w-px h-8 bg-gray-300 mx-4"></div>
              <div className="flex gap-1">
                {DENTAL_CHART_LAYOUT.upper.slice(8, 16).map(num => <ToothImage key={num} toothNumber={num} />)}
              </div>
            </div>
            
            {/* Upper Jaw Interactive - Single Row */}
            <div className="flex justify-between items-center w-full max-w-6xl gap-0.5 px-4">
              {DENTAL_CHART_LAYOUT.upper.map(num => (
                <SurfaceTooth
                  key={num}
                  toothNumber={num}
                  isSelected={selectedTooth === num}
                  onClick={() => handleSurfaceToothClick(num)}
                  getSurfaceCondition={getSurfaceCondition}
                  handleSurfaceClick={handleSurfaceClick}
                  getOverallToothStatus={getOverallToothStatus}
                  getToothNote={getToothNote}
                  selectedCondition={selectedCondition} // PASS SELECTED CONDITION
                />
              ))}
            </div>
          </div>

          {/* Lower Jaw Row */}
          <div className="flex flex-col items-center w-full">
            {/* Lower Jaw Interactive - Single Row */}
            <div className="flex justify-between items-center w-full max-w-6xl gap-0.5 px-4">
              {DENTAL_CHART_LAYOUT.lower.map(num => (
                <SurfaceTooth
                  key={num}
                  toothNumber={num}
                  isSelected={selectedTooth === num}
                  onClick={() => handleSurfaceToothClick(num)}
                  getSurfaceCondition={getSurfaceCondition}
                  handleSurfaceClick={handleSurfaceClick}
                  getOverallToothStatus={getOverallToothStatus}
                  getToothNote={getToothNote}
                  selectedCondition={selectedCondition} // PASS SELECTED CONDITION
                />
              ))}
            </div>
            
            {/* Lower Jaw Illustrations */}
            <div className="flex justify-between items-center w-full max-w-6xl mt-2 px-4">
              <div className="flex gap-1">
                {DENTAL_CHART_LAYOUT.lower.slice(0, 8).map(num => <ToothImage key={num} toothNumber={num} />)}
              </div>
              <div className="w-px h-8 bg-gray-300 mx-4"></div>
              <div className="flex gap-1">
                {DENTAL_CHART_LAYOUT.lower.slice(8, 16).map(num => <ToothImage key={num} toothNumber={num} />)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Root Canal Chart (same as before)
  const renderRootCanalChart = () => (
    <div className="p-6">
      {/* Header Section */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Root Canal Chart</h1>
        <button
          onClick={debugDataStructure}
          className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
          title="Debug data structure"
        >
          Debug Data
        </button>
      </div>

      {/* Instructions Section */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>Instructions:</strong> Select a root canal condition above, then either:
        </p>
        <ul className="list-disc list-inside mt-1 text-sm text-blue-700">
          <li>Click on specific root positions (marked with dashed borders) to apply conditions</li>
          <li>Select a tooth and click "Open SVG Painter" for freehand drawing on roots</li>
        </ul>
        <div className="mt-2 text-xs text-blue-600">
          <strong>Root Position Abbreviations:</strong> M=Mesial, D=Distal, B=Buccal, L=Lingual, MB=MesioBuccal, DB=DistoBuccal
        </div>
        <div className="mt-2 text-xs text-green-600">
          <strong>Green dot</strong> on a tooth indicates custom freehand painting
        </div>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="overflow-x-auto">
        <div className="p-4 space-y-4 min-w-max">
          {/* Upper Jaw Section - 4 Columns Layout */}
          
          {/* Upper Jaw Illustrations - 4 Columns */}
          <div className="flex justify-between items-center px-2">
            {/* Column 1: Teeth 1-4 */}
            <div className="flex justify-between flex-1 mr-2">
              {DENTAL_CHART_LAYOUT.upper.slice(0, 4).map(num => (
                <div key={num} className="flex flex-col items-center w-20">
                  <div className="w-16 h-16 relative">
                    <Image
                      src={`/images/teeth/${num}.svg`}
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
            
            {/* Column 2: Teeth 5-8 */}
            <div className="flex justify-between flex-1 mx-2">
              {DENTAL_CHART_LAYOUT.upper.slice(4, 8).map(num => (
                <div key={num} className="flex flex-col items-center w-20">
                  <div className="w-16 h-16 relative">
                    <Image
                      src={`/images/teeth/${num}.svg`}
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
            
            {/* Column 3: Teeth 9-12 */}
            <div className="flex justify-between flex-1 mx-2">
              {DENTAL_CHART_LAYOUT.upper.slice(8, 12).map(num => (
                <div key={num} className="flex flex-col items-center w-20">
                  <div className="w-16 h-16 relative">
                    <Image
                      src={`/images/teeth/${num}.svg`}
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
            
            {/* Column 4: Teeth 13-16 */}
            <div className="flex justify-between flex-1 ml-2">
              {DENTAL_CHART_LAYOUT.upper.slice(12, 16).map(num => (
                <div key={num} className="flex flex-col items-center w-20">
                  <div className="w-16 h-16 relative">
                    <Image
                      src={`/images/teeth/${num}.svg`}
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

          {/* Upper Jaw Interactive - 4 Columns */}
          <div className="flex justify-between items-center w-full px-2">
            {/* Column 1: Teeth 1-4 */}
            <div className="flex justify-between flex-1 mr-2">
              {DENTAL_CHART_LAYOUT.upper.slice(0, 4).map(num => (
                <RootCanalTooth
                  key={num}
                  toothNumber={num}
                  isSelected={selectedTooth === num}
                  onClick={() => handleRootCanalToothClick(num)}
                  rootLayers={getAllRootLayers(num)}
                  onRootClick={(position, condition) => handleRootPositionClick(num, position, condition)}
                  selectedRootPosition={selectedTooth === num ? selectedRootPosition : null}
                  hasCustomPainting={getCustomRootLayers(num).length > 0}
                  overallStatus={getOverallToothStatus(num)}
                />
              ))}
            </div>
            
            {/* Column 2: Teeth 5-8 */}
            <div className="flex justify-between flex-1 mx-2">
              {DENTAL_CHART_LAYOUT.upper.slice(4, 8).map(num => (
                <RootCanalTooth
                  key={num}
                  toothNumber={num}
                  isSelected={selectedTooth === num}
                  onClick={() => handleRootCanalToothClick(num)}
                  rootLayers={getAllRootLayers(num)}
                  onRootClick={(position, condition) => handleRootPositionClick(num, position, condition)}
                  selectedRootPosition={selectedTooth === num ? selectedRootPosition : null}
                  hasCustomPainting={getCustomRootLayers(num).length > 0}
                  overallStatus={getOverallToothStatus(num)}
                />
              ))}
            </div>
            
            {/* Column 3: Teeth 9-12 */}
            <div className="flex justify-between flex-1 mx-2">
              {DENTAL_CHART_LAYOUT.upper.slice(8, 12).map(num => (
                <RootCanalTooth
                  key={num}
                  toothNumber={num}
                  isSelected={selectedTooth === num}
                  onClick={() => handleRootCanalToothClick(num)}
                  rootLayers={getAllRootLayers(num)}
                  onRootClick={(position, condition) => handleRootPositionClick(num, position, condition)}
                  selectedRootPosition={selectedTooth === num ? selectedRootPosition : null}
                  hasCustomPainting={getCustomRootLayers(num).length > 0}
                  overallStatus={getOverallToothStatus(num)}
                />
              ))}
            </div>
            
            {/* Column 4: Teeth 13-16 */}
            <div className="flex justify-between flex-1 ml-2">
              {DENTAL_CHART_LAYOUT.upper.slice(12, 16).map(num => (
                <RootCanalTooth
                  key={num}
                  toothNumber={num}
                  isSelected={selectedTooth === num}
                  onClick={() => handleRootCanalToothClick(num)}
                  rootLayers={getAllRootLayers(num)}
                  onRootClick={(position, condition) => handleRootPositionClick(num, position, condition)}
                  selectedRootPosition={selectedTooth === num ? selectedRootPosition : null}
                  hasCustomPainting={getCustomRootLayers(num).length > 0}
                  overallStatus={getOverallToothStatus(num)}
                />
              ))}
            </div>
          </div>

          {/* Lower Jaw Section - 4 Columns Layout */}
          
          {/* Lower Jaw Interactive - 4 Columns */}
          <div className="flex justify-between items-center w-full px-2">
            {/* Column 1: Teeth 17-20 */}
            <div className="flex justify-between flex-1 mr-2">
              {DENTAL_CHART_LAYOUT.lower.slice(0, 4).map(num => (
                <RootCanalTooth
                  key={num}
                  toothNumber={num}
                  isSelected={selectedTooth === num}
                  onClick={() => handleRootCanalToothClick(num)}
                  rootLayers={getAllRootLayers(num)}
                  onRootClick={(position, condition) => handleRootPositionClick(num, position, condition)}
                  selectedRootPosition={selectedTooth === num ? selectedRootPosition : null}
                  hasCustomPainting={getCustomRootLayers(num).length > 0}
                  overallStatus={getOverallToothStatus(num)}
                />
              ))}
            </div>
            
            {/* Column 2: Teeth 21-24 */}
            <div className="flex justify-between flex-1 mx-2">
              {DENTAL_CHART_LAYOUT.lower.slice(4, 8).map(num => (
                <RootCanalTooth
                  key={num}
                  toothNumber={num}
                  isSelected={selectedTooth === num}
                  onClick={() => handleRootCanalToothClick(num)}
                  rootLayers={getAllRootLayers(num)}
                  onRootClick={(position, condition) => handleRootPositionClick(num, position, condition)}
                  selectedRootPosition={selectedTooth === num ? selectedRootPosition : null}
                  hasCustomPainting={getCustomRootLayers(num).length > 0}
                  overallStatus={getOverallToothStatus(num)}
                />
              ))}
            </div>
            
            {/* Column 3: Teeth 25-28 */}
            <div className="flex justify-between flex-1 mx-2">
              {DENTAL_CHART_LAYOUT.lower.slice(8, 12).map(num => (
                <RootCanalTooth
                  key={num}
                  toothNumber={num}
                  isSelected={selectedTooth === num}
                  onClick={() => handleRootCanalToothClick(num)}
                  rootLayers={getAllRootLayers(num)}
                  onRootClick={(position, condition) => handleRootPositionClick(num, position, condition)}
                  selectedRootPosition={selectedTooth === num ? selectedRootPosition : null}
                  hasCustomPainting={getCustomRootLayers(num).length > 0}
                  overallStatus={getOverallToothStatus(num)}
                />
              ))}
            </div>
            
            {/* Column 4: Teeth 29-32 */}
            <div className="flex justify-between flex-1 ml-2">
              {DENTAL_CHART_LAYOUT.lower.slice(12, 16).map(num => (
                <RootCanalTooth
                  key={num}
                  toothNumber={num}
                  isSelected={selectedTooth === num}
                  onClick={() => handleRootCanalToothClick(num)}
                  rootLayers={getAllRootLayers(num)}
                  onRootClick={(position, condition) => handleRootPositionClick(num, position, condition)}
                  selectedRootPosition={selectedTooth === num ? selectedRootPosition : null}
                  hasCustomPainting={getCustomRootLayers(num).length > 0}
                  overallStatus={getOverallToothStatus(num)}
                />
              ))}
            </div>
          </div>

          {/* Lower Jaw Illustrations - 4 Columns */}
          <div className="flex justify-between items-center px-2">
            {/* Column 1: Teeth 17-20 */}
            <div className="flex justify-between flex-1 mr-2">
              {DENTAL_CHART_LAYOUT.lower.slice(0, 4).map(num => (
                <div key={num} className="flex flex-col items-center w-20">
                  <div className="w-16 h-16 relative">
                    <Image
                      src={`/images/teeth/${num}.svg`}
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
            
            {/* Column 2: Teeth 21-24 */}
            <div className="flex justify-between flex-1 mx-2">
              {DENTAL_CHART_LAYOUT.lower.slice(4, 8).map(num => (
                <div key={num} className="flex flex-col items-center w-20">
                  <div className="w-16 h-16 relative">
                    <Image
                      src={`/images/teeth/${num}.svg`}
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
            
            {/* Column 3: Teeth 25-28 */}
            <div className="flex justify-between flex-1 mx-2">
              {DENTAL_CHART_LAYOUT.lower.slice(8, 12).map(num => (
                <div key={num} className="flex flex-col items-center w-20">
                  <div className="w-16 h-16 relative">
                    <Image
                      src={`/images/teeth/${num}.svg`}
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
            
            {/* Column 4: Teeth 29-32 */}
            <div className="flex justify-between flex-1 ml-2">
              {DENTAL_CHART_LAYOUT.lower.slice(12, 16).map(num => (
                <div key={num} className="flex flex-col items-center w-20">
                  <div className="w-16 h-16 relative">
                    <Image
                      src={`/images/teeth/${num}.svg`}
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
      </div>
    </div>
  );

  return (
    <div className="flex m-7">
      <div className="flex-grow md:ml-60 container mx-auto p-4">
        <PatientComponent params={params} />

        <div className="flex space-x-8">
          {/* Patient Details and Controls */}
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
            
            {/* Condition Selector based on active tab */}
            {activeTab === "surface" ? (
              <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                <h3 className="font-bold text-lg mb-3 text-gray-800">Tooth Condition</h3>
                <div>
                  <label className="block font-medium mb-2 text-gray-700">Condition:</label>
                  <select
                    value={selectedCondition}
                    onChange={(e) => setSelectedCondition(e.target.value)}
                    className="border border-gray-300 p-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {Object.entries(getSurfaceConditions()).map(([key, condition]) => (
                      <option key={key} value={key}>
                        {condition.label}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-center mt-2">
                    <div
                      className="w-4 h-4 mr-2 border border-gray-400"
                      style={{ 
                        backgroundColor: getSurfaceConditions()[selectedCondition as keyof typeof TOOTH_CONDITIONS]?.colorCode 
                      }}
                    ></div>
                    <span className="text-sm text-gray-600">
                      {getSurfaceConditions()[selectedCondition as keyof typeof TOOTH_CONDITIONS]?.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Click on tooth surfaces to apply conditions
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* SVG Painter Section - Only for Root Canal Chart */}
                {selectedTooth && (
                  <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                    <h3 className="font-bold text-lg mb-3 text-gray-800">Advanced Root Canal Painter</h3>
                    
                    <button
                      onClick={() => setPainterTooth(painterTooth ? null : selectedTooth)}
                      className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                        painterTooth === selectedTooth 
                          ? 'bg-red-500 text-white hover:bg-red-600' 
                          : 'bg-green-500 text-white hover:bg-green-600'
                      }`}
                    >
                      {painterTooth === selectedTooth ? "Close SVG Painter" : "Open SVG Painter"}
                    </button>
                    
                    {painterTooth === selectedTooth && (
                      <div className="mt-4">
                        <SVGPainter
                          toothNumber={selectedTooth}
                          rootLayers={getCustomRootLayers(selectedTooth)}
                          onRootLayerUpdate={handleRootLayerUpdate}
                          selectedRootCanalCondition={selectedRootCanalCondition}
                          rootCanalConditions={ROOT_CANAL_CONDITIONS}
                          brushSize={brushSize}
                          onBrushSizeChange={setBrushSize}
                        />
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-600 mt-3">
                      <strong>Painting Features:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Click and drag to paint freely on tooth roots</li>
                        <li>Click on painted areas to remove them</li>
                        <li>Use different colors for different conditions</li>
                        <li>Precise root canal marking</li>
                        <li>Clear All button to start over</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                {/* Root Canal Condition Selector */}
                <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                  <h3 className="font-bold text-lg mb-3 text-gray-800">Root Canal Condition</h3>

                  <div>
                    <label className="block font-medium mb-2 text-gray-700">Root Canal Condition:</label>
                    <select
                      value={selectedRootCanalCondition}
                      onChange={(e) => setSelectedRootCanalCondition(e.target.value)}
                      className="border border-gray-300 p-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {Object.entries(ROOT_CANAL_CONDITIONS).map(([key, condition]) => (
                        <option key={key} value={key}>
                          {condition.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center mt-2">
                      <div
                        className="w-4 h-4 mr-2 border border-gray-400"
                        style={{ 
                          backgroundColor: ROOT_CANAL_CONDITIONS[selectedRootCanalCondition as keyof typeof ROOT_CANAL_CONDITIONS]?.colorCode 
                        }}
                      ></div>
                      <span className="text-sm text-gray-600">
                        {ROOT_CANAL_CONDITIONS[selectedRootCanalCondition as keyof typeof ROOT_CANAL_CONDITIONS]?.label}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Click on specific root positions to apply conditions
                    </p>
                    
                    {/* Selected position info */}
                    {selectedRootPosition && (
                      <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-sm text-blue-700">
                          Selected: <strong>{selectedRootPosition}</strong> root
                          {selectedTooth && ` on tooth ${selectedTooth}`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
            
            {/* Selected Tooth Details */}
            {selectedTooth && (
              <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
                <h3 className="font-bold text-lg mb-3 text-gray-800">
                  Tooth {selectedTooth} Details
                </h3>
                
                {activeTab === "rootCanal" && (
                  /* Overall Status Selector - Only for Root Canal Chart */
                  <div className="mb-4">
                    <label className="block font-medium mb-2 text-gray-700">Overall Status:</label>
                    <select
                      value={teethData.find(t => t.toothNumber === selectedTooth)?.overallStatus || "NORMAL"}
                      onChange={(e) => handleOverallStatusChange(e.target.value)}
                      className="border border-gray-300 p-2 rounded-md w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="MISSING_TOOTH">Missing Tooth</option>
                      <option value="NEED_EXTRACTION">Needs Extraction</option>
                      <option value="CROWN">Crown</option>
                      <option value="PROSTHETIC_CROWN">Prosthetic Crown</option>
                    </select>
                  </div>
                )}
                
                {/* General Notes */}
             {/* General Notes */}
<div className="mb-4">
  <label className="block font-medium mb-2 text-gray-700">Notes:</label>
  <textarea
    value={generalNote}
    onChange={(e) => handleGeneralNoteChange(e.target.value)} // Use the new handler
    className="border border-gray-300 p-2 rounded-md w-full h-24 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
    placeholder="Add notes for this tooth..."
    maxLength={500}
  />
  <div className="text-xs text-gray-500 text-right mt-1">
    {generalNote.length}/500
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
                        {teethData.find(t => t.toothNumber === selectedTooth)?.surfaces?.map((surface: any, index: number) => (
                          <div key={index} className="border rounded p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{surface.name} Surface:</span>
                              <button
                                onClick={() => {
                                  const updatedTeeth = teethData.map(tooth => {
                                    if (tooth.toothNumber === selectedTooth) {
                                      const updatedSurfaces = tooth.surfaces?.filter((s: any) => s.name !== surface.name) || [];
                                      return { ...tooth, surfaces: updatedSurfaces };
                                    }
                                    return tooth;
                                  });
                                  setTeethData(updatedTeeth);
                                }}
                                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                              >
                                Remove
                              </button>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div
                                className="w-3 h-3 rounded border border-gray-400"
                                style={{ backgroundColor: TOOTH_CONDITIONS[surface.condition as keyof typeof TOOTH_CONDITIONS]?.colorCode }}
                              ></div>
                              <span className="text-xs text-gray-600">
                                {TOOTH_CONDITIONS[surface.condition as keyof typeof TOOTH_CONDITIONS]?.label}
                              </span>
                            </div>
                          </div>
                        ))}
                        {(!teethData.find(t => t.toothNumber === selectedTooth)?.surfaces || teethData.find(t => t.toothNumber === selectedTooth)?.surfaces?.length === 0) && (
                          <div className="text-gray-500 italic">No surface conditions set</div>
                        )}
                      </>
                    ) : (
                      /* Root Conditions */
                      <>
                        {/* Position-based root conditions */}
                        {teethData.find(t => t.toothNumber === selectedTooth)?.roots?.map((root: any, index: number) => (
                          <div key={index} className="border rounded p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{root.position} Root:</span>
                              <button
                                onClick={() => handleRemoveRootLayer(selectedTooth, root.position)}
                                className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                              >
                                Remove
                              </button>
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
                        {getCustomRootLayers(selectedTooth).map((layer: RootLayer, index: number) => (
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
                            <div className="text-xs text-gray-500 mt-1">
                              Points: {layer.points?.length || 0}, 
                              Brush: {layer.brushSize}px
                              {layer.svgData && ", SVG: ✓"}
                            </div>
                          </div>
                        ))}
                        
                        {getAllRootLayers(selectedTooth).length === 0 && (
                          <div className="text-gray-500 italic">No root conditions set</div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
      
          {/* Dental Chart Diagram */}
          <div className="w-2/3">
            {activeTab === "surface" ? renderSurfaceChart() : renderRootCanalChart()}

            {/* Save Button */}
            <div className="flex space-x-4 mt-6">
              <button
                onClick={debugDataStructure}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
              >
                Debug Data
              </button>
              <button
                onClick={handleSave}
                className="bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors border-2 border-blue-600 flex-1"
              >
                Save Dental Chart
              </button>
            </div>
            
            {/* Form Message */}
            {formMessage && (
              <p className={`mt-4 ${formType === "success" ? "bg-green-300 text-green-600" : "bg-red-300 text-red-600"} p-2 rounded-md text-center border-2 ${formType === "success" ? "border-green-400" : "border-red-400"}`}>
                {formMessage}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}