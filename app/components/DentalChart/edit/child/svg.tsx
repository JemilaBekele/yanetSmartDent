"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';

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

interface SVGPainterProps {
  toothNumber: number;
  rootLayers: RootLayer[];
  onRootLayerUpdate: (toothNumber: number, layers: RootLayer[]) => void;
  selectedRootCanalCondition: string;
  rootCanalConditions: any;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
}

const SVGPainter: React.FC<SVGPainterProps> = ({
  toothNumber,
  rootLayers,
  onRootLayerUpdate,
  selectedRootCanalCondition,
  rootCanalConditions,
  brushSize,
  onBrushSizeChange
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<number[][]>([]);
  const [drawingColor, setDrawingColor] = useState<string>('#000000');
  const [drawingBrushSize, setDrawingBrushSize] = useState<number>(18);
  const [isErasing, setIsErasing] = useState(false);
  const [lastDrawTime, setLastDrawTime] = useState<number>(0);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number } | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Get current color from selected condition
  const currentColor = rootCanalConditions[selectedRootCanalCondition]?.colorCode || '#000000';

  // Convert points to SVG path data
  const pointsToPathData = (points: number[][]): string => {
    if (points.length === 0) return '';
    
    let pathData = `M ${points[0][0]} ${points[0][1]}`;
    
    for (let i = 1; i < points.length; i++) {
      pathData += ` L ${points[i][0]} ${points[i][1]}`;
    }
    
    return pathData;
  };

  // Smooth the path (simple implementation)
  const smoothPath = (points: number[][], tolerance: number = 2): number[][] => {
    if (points.length <= 2) return points;
    
    const smoothed: number[][] = [points[0]];
    
    for (let i = 1; i < points.length - 1; i++) {
      const prev = points[i - 1];
      const current = points[i];
      const next = points[i + 1];
      
      // Simple average smoothing
      const avgX = (prev[0] + current[0] + next[0]) / 3;
      const avgY = (prev[1] + current[1] + next[1]) / 3;
      
      smoothed.push([avgX, avgY]);
    }
    
    smoothed.push(points[points.length - 1]);
    return smoothed;
  };

  // SIMPLE AND GUARANTEED ERASER - Remove any layer that's even remotely close
  const handleEraserAction = useCallback((x: number, y: number) => {
    if (rootLayers.length === 0) return;

    console.log('=== ERASER ACTION ===');
    console.log('Cursor position:', { x, y });
    console.log('Total layers:', rootLayers.length);

    // Method 1: Remove ANY layer that has points within a large radius
    const layersToRemove: string[] = [];
    const ERASER_RADIUS = brushSize * 3; // Large detection area

    for (let i = rootLayers.length - 1; i >= 0; i--) {
      const layer = rootLayers[i];
      
      if (layer.points && layer.points.length > 0) {
        // Check if ANY point in this layer is within the eraser radius
        const isInEraserRange = layer.points.some(point => {
          if (!point) return false;
          const distance = Math.sqrt((x - point[0]) ** 2 + (y - point[1]) ** 2);
          return distance <= ERASER_RADIUS;
        });
        
        if (isInEraserRange) {
          layersToRemove.push(layer.id);
          console.log(`✅ Layer ${layer.id} is within eraser range`);
          break; // Remove only one layer per click
        } else {
          console.log(`❌ Layer ${layer.id} is NOT within range`);
        }
      }
    }

    // Method 2: If no layers found with point detection, use bounding box fallback
    if (layersToRemove.length === 0) {
      console.log('Trying bounding box detection...');
      
      for (let i = rootLayers.length - 1; i >= 0; i--) {
        const layer = rootLayers[i];
        
        if (layer.points && layer.points.length > 0) {
          const minX = Math.min(...layer.points.map(p => p[0]));
          const maxX = Math.max(...layer.points.map(p => p[0]));
          const minY = Math.min(...layer.points.map(p => p[1]));
          const maxY = Math.max(...layer.points.map(p => p[1]));
          
          // Check if cursor is within the expanded bounding box
          const padding = brushSize * 4; // Very generous padding
          if (x >= minX - padding && x <= maxX + padding && 
              y >= minY - padding && y <= maxY + padding) {
            layersToRemove.push(layer.id);
            console.log(`✅ Layer ${layer.id} found via bounding box`);
            break;
          }
        }
      }
    }

    // Method 3: LAST RESORT - Remove the most recent layer if nothing else works
    if (layersToRemove.length === 0 && rootLayers.length > 0) {
      const mostRecentLayer = rootLayers[rootLayers.length - 1];
      layersToRemove.push(mostRecentLayer.id);
      console.log(`🔄 Removing most recent layer as fallback: ${mostRecentLayer.id}`);
    }

    // FINALLY: Remove the identified layers
    if (layersToRemove.length > 0) {
      const updatedLayers = rootLayers.filter(layer => !layersToRemove.includes(layer.id));
      console.log(`🎯 SUCCESS: Removing ${layersToRemove.length} layer(s)`);
      console.log(`Layers: ${rootLayers.length} → ${updatedLayers.length}`);
      onRootLayerUpdate(toothNumber, updatedLayers);
    } else {
      console.log('❌ NO layers could be identified for removal');
    }
  }, [rootLayers, toothNumber, onRootLayerUpdate, brushSize]);

  // Track cursor position for cursor visualization
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPosition({ x, y });

    if (isMouseDown) {
      if (isErasing) {
        // Continuous erasing while moving with mouse down
        handleEraserAction(x, y);
      } else if (isDrawing && selectedRootCanalCondition !== "NORMAL") {
        // Continue drawing
        setCurrentPath(prev => [...prev, [x, y]]);
      }
    }
  }, [isMouseDown, isDrawing, isErasing, selectedRootCanalCondition, handleEraserAction]);

  // Prevent double click
  const preventDoubleClick = useCallback((e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastDrawTime < 300) { // 300ms threshold for double click
      e.preventDefault();
      return;
    }
    setLastDrawTime(now);
  }, [lastDrawTime]);

  // Handle mouse down - start drawing or erasing
  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    preventDoubleClick(e);
    
    if (!svgRef.current) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsMouseDown(true);

    if (isErasing) {
      // Immediate erasing on click
      console.log('=== MOUSE DOWN - ERASER MODE ===');
      handleEraserAction(x, y);
    } else if (selectedRootCanalCondition !== "NORMAL") {
      // Start drawing
      setIsDrawing(true);
      setDrawingColor(currentColor);
      setDrawingBrushSize(brushSize);
      setCurrentPath([[x, y]]);
    }
  }, [isErasing, selectedRootCanalCondition, currentColor, brushSize, handleEraserAction, preventDoubleClick]);

  // Handle mouse up - finish drawing
  const handleMouseUp = useCallback(() => {
    if (isDrawing && currentPath.length >= 2 && !isErasing) {
      // Create proper SVG path data
      const smoothedPath = smoothPath(currentPath);
      const svgPathData = pointsToPathData(smoothedPath);
      
      // Create new layer with complete drawing data
      const newLayer: RootLayer = {
        id: `layer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        points: [...smoothedPath],
        color: drawingColor,
        condition: selectedRootCanalCondition,
        brushSize: drawingBrushSize,
        svgData: svgPathData,
        coordinates: smoothedPath.map(point => ({ 
          x: point[0], 
          y: point[1],
          timestamp: new Date().toISOString()
        })),
        isCustomPainting: true,
        position: "CUSTOM",
        timestamp: new Date().toISOString()
      };

      // Update layers
      const updatedLayers = [...rootLayers, newLayer];
      onRootLayerUpdate(toothNumber, updatedLayers);
    }

    // Reset drawing state
    setIsDrawing(false);
    setIsMouseDown(false);
    setCurrentPath([]);
  }, [isDrawing, isErasing, currentPath, drawingColor, drawingBrushSize, selectedRootCanalCondition, rootLayers, toothNumber, onRootLayerUpdate]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setIsMouseDown(false);
    if (isDrawing) {
      handleMouseUp();
    }
  }, [isDrawing, handleMouseUp]);

  // Handle context menu to prevent default right-click behavior
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  // Clear all drawings
  const handleClearAll = useCallback(() => {
    console.log('🗑️ Clearing ALL paintings');
    onRootLayerUpdate(toothNumber, []);
  }, [toothNumber, onRootLayerUpdate]);

  // Handle brush size change
  const handleBrushSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value);
    onBrushSizeChange(newSize);
  };

  // Toggle between drawing and erasing modes
  const toggleEraserMode = useCallback(() => {
    setIsErasing(prev => !prev);
    setIsDrawing(false);
    setCurrentPath([]);
    console.log('🔄 Eraser mode:', !isErasing);
  }, [isErasing]);

  // UPDATED: Render tooth structure based on CHILD teeth anatomical root table (24 teeth)
  const renderToothStructure = () => {
    // Child teeth with THREE roots (Primary Molars)
    const hasThreeRoots = [1, 2, 3].includes(toothNumber);
    
    // Child teeth with SINGLE root (Incisors, Canines, some Primary Molars)
    const hasSingleRoot = [4, 5, 6, 7, 8, 9, 16, 17, 18, 19, 20, 21].includes(toothNumber);
    
    // Child teeth with TWO roots (Primary Molars)
    const hasTwoRoots = [10, 11, 12, 13, 14, 15, 22, 23, 24].includes(toothNumber);

    // Three roots - Primary Molars (Upper and Lower first molars)
    if (hasThreeRoots) {
      return (
        <>
          {/* Crown - wider for molars */}
          <path
            d="M 30 50 Q 100 20 170 50 Q 200 80 170 120 Q 100 150 30 120 Q 0 80 30 50 Z"
            fill="#f8f8f8"
            stroke="#333"
            strokeWidth="2"
          />
          {/* Mesiobuccal Root (left) */}
          <path
            d="M 50 120 Q 60 200 70 120 L 70 280 Q 60 290 50 280 Z"
            fill="#f8f8f8"
            stroke="#333"
            strokeWidth="2"
          />
          {/* Distobuccal Root (middle) */}
          <path
            d="M 90 120 Q 100 180 110 120 L 110 280 Q 100 290 90 280 Z"
            fill="#f8f8f8"
            stroke="#333"
            strokeWidth="2"
          />
          {/* Palatal Root (right) - usually larger and curved */}
          <path
            d="M 130 120 Q 140 220 150 120 L 150 280 Q 140 290 130 280 Z"
            fill="#f8f8f8"
            stroke="#333"
            strokeWidth="2"
          />
        </>
      );
    } 
    // Two roots - Primary Molars
    else if (hasTwoRoots) {
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
            d="M 60 120 Q 70 200 80 120 L 80 280 Q 70 290 60 280 Z"
            fill="#f8f8f8"
            stroke="#333"
            strokeWidth="2"
          />
          {/* Distal Root (right) */}
          <path
            d="M 120 120 Q 130 200 140 120 L 140 280 Q 130 290 120 280 Z"
            fill="#f8f8f8"
            stroke="#333"
            strokeWidth="2"
          />
        </>
      );
    }
    // Single root - Incisors, Canines, some Primary Molars
    else if (hasSingleRoot) {
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
            d="M 90 120 Q 100 200 110 120 L 110 280 Q 100 290 90 280 Z"
            fill="#f8f8f8"
            stroke="#333"
            strokeWidth="2"
          />
        </>
      );
    }
    // Fallback for any unclassified teeth
    else {
      return (
        <>
          {/* Generic crown */}
          <path
            d="M 50 50 Q 100 20 150 50 Q 180 80 150 120 Q 100 150 50 120 Q 20 80 50 50 Z"
            fill="#f8f8f8"
            stroke="#333"
            strokeWidth="2"
          />
          {/* Generic root */}
          <path
            d="M 90 120 Q 100 200 110 120 L 110 280 Q 100 290 90 280 Z"
            fill="#f8f8f8"
            stroke="#333"
            strokeWidth="2"
          />
        </>
      );
    }
  };

  // Debug function to test data saving
  const handleTestDrawing = () => {
    const testPoints = [
      [50, 150], [60, 140], [70, 130], [80, 140], [90, 150]
    ];
    
    const svgPathData = pointsToPathData(testPoints);
    
    const testLayer: RootLayer = {
      id: `test-layer-${Date.now()}`,
      points: testPoints,
      color: currentColor,
      condition: selectedRootCanalCondition,
      brushSize: brushSize,
      svgData: svgPathData,
      coordinates: testPoints.map(point => ({ 
        x: point[0], 
        y: point[1],
        timestamp: new Date().toISOString()
      })),
      isCustomPainting: true,
      position: "CUSTOM",
      timestamp: new Date().toISOString()
    };
    
    const updatedLayers = [...rootLayers, testLayer];
    onRootLayerUpdate(toothNumber, updatedLayers);
    console.log('✅ Test drawing added');
  };

  // Debug function to log layer details
  const handleDebugLayers = () => {
    console.log('=== DEBUG LAYERS ===');
    console.log('Current layers count:', rootLayers.length);
    rootLayers.forEach((layer, index) => {
      console.log(`Layer ${index}:`, {
        id: layer.id,
        points: layer.points?.length,
        brushSize: layer.brushSize,
        condition: layer.condition,
        firstPoint: layer.points?.[0],
        lastPoint: layer.points?.[layer.points.length - 1]
      });
    });
    console.log('Eraser mode:', isErasing);
    console.log('Brush size:', brushSize);
    console.log('==================');
  };

  // UPDATED: Get root type description for CHILD teeth display
  const getRootDescription = () => {
    if ([1, 2, 3].includes(toothNumber)) return "3 Roots - Primary Molar (Three Roots)";
    if ([4, 5, 6, 7, 8, 9, 16, 17, 18, 19, 20, 21].includes(toothNumber)) return "Single Root (Incisors/Canines/Primary Molars)";
    if ([10, 11, 12, 13, 14, 15, 22, 23, 24].includes(toothNumber)) return "2 Roots - Primary Molar (Two Roots)";
    return "Generic Root Structure";
  };

  return (
    <div className="bg-white p-4 rounded-lg border border-gray-300">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="font-semibold text-gray-700">
            Freehand Painter - Child Tooth {toothNumber}
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            {getRootDescription()}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Brush Size:</span>
          <input
            type="range"
            min="2"
            max="20"
            value={brushSize}
            onChange={handleBrushSizeChange}
            className="w-20"
          />
          <span className="text-sm text-gray-600">{brushSize}px</span>
        </div>
      </div>

      {/* Mode Indicator and Color */}
      <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 rounded">
        <div className="flex items-center">
          <div
            className="w-6 h-6 rounded border border-gray-400 mr-2"
            style={{ backgroundColor: isErasing ? '#f8f8f8' : currentColor }}
          ></div>
          <span className="text-sm font-medium text-gray-700">
            {isErasing ? 'Eraser Mode' : (rootCanalConditions[selectedRootCanalCondition]?.label || 'Select Condition')}
          </span>
        </div>
        <button
          onClick={toggleEraserMode}
          className={`px-3 py-1 text-sm rounded transition-colors ${
            isErasing 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isErasing ? '✏️ Switch to Paint' : '🧽 Switch to Eraser'}
        </button>
      </div>

      {/* Drawing Canvas */}
      <div className="border-2 border-gray-300 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 p-2 mb-3">
        <svg
          ref={svgRef}
          width="100%"
          height="300"
          viewBox="0 0 200 300"
          className="bg-white rounded border border-gray-200 cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          onContextMenu={handleContextMenu}
        >
          {/* Background grid for better visibility */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#f0f0f0" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Base tooth structure - UPDATED based on CHILD teeth anatomical table */}
          <g className="tooth-structure">
            {renderToothStructure()}
          </g>
          
          {/* Existing painted layers */}
          {rootLayers.map((layer) => {
            // Use svgData if available, otherwise generate from points
            const pathData = layer.svgData || pointsToPathData(layer.points);
            
            return (
              <path
                key={layer.id}
                d={pathData}
                stroke={layer.color}
                strokeWidth={layer.brushSize || brushSize}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
                className="transition-opacity"
                style={{ filter: 'drop-shadow(1px 1px 2px rgba(0,0,0,0.3))' }}
              />
            );
          })}
          
          {/* Current drawing path */}
          {isDrawing && currentPath.length > 1 && !isErasing && (
            <path
              d={pointsToPathData(currentPath)}
              stroke={drawingColor}
              strokeWidth={brushSize}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          )}
          
          {/* Cursor visualization circles */}
          {cursorPosition && (
            <>
              {/* Painting cursor (always show when not erasing) */}
              {!isErasing && selectedRootCanalCondition !== "NORMAL" && (
                <circle
                  cx={cursorPosition.x}
                  cy={cursorPosition.y}
                  r={brushSize / 2}
                  fill="none"
                  stroke={currentColor}
                  strokeWidth="2"
                  strokeDasharray="3,2"
                  className="pointer-events-none"
                />
              )}
              
              {/* Eraser cursor */}
              {isErasing && (
                <>
                  <circle
                    cx={cursorPosition.x}
                    cy={cursorPosition.y}
                    r={brushSize * 1.5} // Larger visual indicator
                    fill="none"
                    stroke="#ff4444"
                    strokeWidth="2"
                    strokeDasharray="4,2"
                    className="pointer-events-none"
                  />
                  <circle
                    cx={cursorPosition.x}
                    cy={cursorPosition.y}
                    r={brushSize * 1.5}
                    fill="#ff4444"
                    fillOpacity="0.1"
                    className="pointer-events-none"
                  />
                </>
              )}
            </>
          )}
          
          {/* Help text */}
          {rootLayers.length === 0 && !isDrawing && (
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-gray-400 text-sm select-none"
              fontSize="12"
            >
              {isErasing 
                ? 'Click anywhere near drawings to erase them' 
                : selectedRootCanalCondition === "NORMAL"
                ? 'Select a condition to start painting'
                : 'Click and drag to paint'
              }
            </text>
          )}
        </svg>
      </div>

      {/* Controls */}
      <div className="flex justify-between items-center">
        <div className="text-xs text-gray-500">
          {rootLayers.length} painting{rootLayers.length !== 1 ? 's' : ''}
          {isErasing && ' • Eraser Active'}
          {isDrawing && ' • Drawing...'}
        </div>
        
        <div className="flex space-x-2">
          {/* Debug button for layers */}
          <button
            onClick={handleDebugLayers}
            className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
            title="Debug layer information"
          >
            Debug Layers
          </button>

          {/* Test button for debugging */}
          <button
            onClick={handleTestDrawing}
            className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
            title="Add test drawing to verify data saving"
          >
            Test
          </button>
          
          {/* Remove all button */}
          <button
            onClick={handleClearAll}
            disabled={rootLayers.length === 0}
            className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Remove All
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-200">
        <p className="text-xs text-blue-700">
          <strong>How to use:</strong> 
          {isErasing 
            ? ' Click anywhere near drawings to remove them. The large red circle shows your eraser detection area.'
            : ' Select a condition above, then click and drag on the tooth roots to paint. The colored circle shows your brush size.'
          }
        </p>
        <p className="text-xs text-blue-600 mt-1">
          <strong>Eraser Tip:</strong> The eraser has a large detection area. Click near any drawing to remove it.
        </p>
        <p className="text-xs text-blue-600 mt-1">
          <strong>Child Tooth Anatomy:</strong> {getRootDescription()}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          <strong>Debug:</strong> Use "Debug Layers" button to see detailed information about all paintings.
        </p>
      </div>
    </div>
  );
};

export default SVGPainter;