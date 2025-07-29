"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { ZoomControls } from "./ZoomControls";
import { ImageCanvas } from "./ImageCanvas";
import { MaskCanvas, type MaskState, type BrushSettings } from "./MaskCanvas";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Undo,
  Redo,
  Trash2,
  Wand2,
  Sparkles,
  UnfoldHorizontal,
  Scissors,
  Palette,
  ChevronDown,
  Focus,
} from "lucide-react";
import type { ImageData } from "./ImageEditor";

interface CanvasEditorProps {
  imageData: ImageData;
  onProcessImage: (maskCanvas: HTMLCanvasElement) => void;
  disabled?: boolean;
  brushSettings?: BrushSettings;
  onBrushSettingsChange?: (settings: BrushSettings) => void;
  // Mask state management
  initialMaskState?: MaskState; // Mask state with size info
  onMaskStateChange?: (maskState: MaskState) => void;
  // History state management
  initialHistoryState?: { history: string[]; historyIndex: number };
  onHistoryStateChange?: (history: string[], historyIndex: number) => void;
  // Processing state
  isProcessing?: boolean;
  // Help callback
  onShowHelp?: () => void;
  // Comparison feature
  processedImageUrl?: string | null;
  // Background removal feature
  onRemoveBackground?: () => void;
  isBackgroundProcessing?: boolean;
  backgroundRemovedImageUrl?: string | null;
  // Background replacement feature
  onReplaceBackground?: (backgroundUrl: string) => void;
  // Clear all operations
  onClearAll?: () => void;
  finalResult?: {
    url: string | null;
    type: "inpaint" | "background" | "blur" | "final" | "none";
  };
  // Background blur feature
  onBlurBackground?: (blurIntensity: number) => void;
  isBackgroundBlurProcessing?: boolean;
  backgroundBlurredImageUrl?: string | null;
}

const CanvasEditorComponent: React.FC<CanvasEditorProps> = ({
  imageData,
  onProcessImage,
  disabled = false,
  brushSettings: externalBrushSettings,
  onBrushSettingsChange,
  initialMaskState,
  onMaskStateChange,
  initialHistoryState,
  onHistoryStateChange,
  isProcessing = false,
  onShowHelp,
  processedImageUrl,
  onRemoveBackground,
  isBackgroundProcessing = false,
  backgroundRemovedImageUrl,
  onReplaceBackground,
  onBlurBackground,
  isBackgroundBlurProcessing = false,
  backgroundBlurredImageUrl,
  onClearAll,
  finalResult,
}) => {
  const maskCanvasRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [showComparison, setShowComparison] = useState(false);
  const [comparisonProgress, setComparisonProgress] = useState(0);
  const [comparisonTargetProgress, setComparisonTargetProgress] = useState(0);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const backgroundSelectorRef = useRef<HTMLDivElement>(null);
  const [showBlurSelector, setShowBlurSelector] = useState(false);
  const [blurIntensity, setBlurIntensity] = useState(20);
  const blurSelectorRef = useRef<HTMLDivElement>(null);
  const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Canvas state
  const [zoom, setZoom] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });

  const defaultBrushSettings: BrushSettings = {
    size: 20,
    opacity: 100,
    color: "#ff3333",
    shape: "circle",
  };

  const brushSettings = externalBrushSettings || defaultBrushSettings;

  // Debounced blur function for real-time preview
  const handleBlurIntensityChange = useCallback((newIntensity: number) => {
    setBlurIntensity(newIntensity);

    // Clear existing timeout
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
    }

    // Set new timeout for debounced blur application
    blurTimeoutRef.current = setTimeout(() => {
      if (onBlurBackground) {
        onBlurBackground(newIntensity);
      }
    }, 150); // 150ms debounce for faster response
  }, [onBlurBackground]);

  const handleClearAll = useCallback(() => {
    if (maskCanvasRef.current?.clearAll) {
      maskCanvasRef.current.clearAll();
    }
    if (onClearAll) {
      onClearAll();
    }
  }, [onClearAll]);

  const handleProcess = useCallback(() => {
    if (maskCanvasRef.current?.getCanvas) {
      const canvas = maskCanvasRef.current.getCanvas();
      if (canvas) {
        onProcessImage(canvas);
      }
    }
  }, [onProcessImage]);

  // Comparison handlers
  const handleCompareStart = () => {
    const comparisonImageUrl = finalResult?.url;
    if (comparisonImageUrl) {
      setShowComparison(true);
      setComparisonTargetProgress(1); // Target is full progress
    }
  };

  const handleCompareEnd = () => {
    setComparisonTargetProgress(0); // Target is zero progress
  };

  // Animation effect for comparison
  useEffect(() => {
    if (!showComparison) return;

    const animateProgress = () => {
      const currentProgress = comparisonProgress;
      const targetProgress = comparisonTargetProgress;

      if (Math.abs(currentProgress - targetProgress) < 0.01) {
        // Close enough to target, set exact value
        setComparisonProgress(targetProgress);
        if (targetProgress === 0) {
          setShowComparison(false);
        }
        return;
      }

      // Calculate step size for smooth animation (same speed regardless of direction)
      const step = 0.025; // This gives us ~400ms for full sweep (1/0.025 = 40 frames at 60fps)
      const direction = targetProgress > currentProgress ? 1 : -1;
      const newProgress = currentProgress + step * direction;

      // Clamp to target if we would overshoot
      const clampedProgress =
        direction > 0
          ? Math.min(newProgress, targetProgress)
          : Math.max(newProgress, targetProgress);

      setComparisonProgress(clampedProgress);
      requestAnimationFrame(animateProgress);
    };

    const animationId = requestAnimationFrame(animateProgress);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [showComparison, comparisonProgress, comparisonTargetProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setShowComparison(false);
      setComparisonProgress(0);
      setComparisonTargetProgress(0);
      // Clear blur timeout
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  // Close background selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        backgroundSelectorRef.current &&
        !backgroundSelectorRef.current.contains(event.target as Node)
      ) {
        setShowBackgroundSelector(false);
      }
    };

    if (showBackgroundSelector) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showBackgroundSelector]);

  // Close blur selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        blurSelectorRef.current &&
        !blurSelectorRef.current.contains(event.target as Node)
      ) {
        setShowBlurSelector(false);
      }
    };

    if (showBlurSelector) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showBlurSelector]);

  // Handle mouse wheel zoom
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      const newZoom = Math.max(0.1, Math.min(3, zoom + delta));
      setZoom(newZoom);
    },
    [zoom]
  );

  // Handle pan start
  const handlePanStart = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle mouse or Alt+Left mouse
      e.preventDefault();
      setIsPanning(true);
      setLastPanPoint({ x: e.clientX, y: e.clientY });
    }
  }, []);

  // Handle pan move
  const handlePanMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        e.preventDefault();
        const deltaX = e.clientX - lastPanPoint.x;
        const deltaY = e.clientY - lastPanPoint.y;

        setPan((prev) => ({
          x: prev.x + deltaX,
          y: prev.y + deltaY,
        }));

        setLastPanPoint({ x: e.clientX, y: e.clientY });
      }
    },
    [isPanning, lastPanPoint]
  );

  // Handle pan end
  const handlePanEnd = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Undo function
  const undo = useCallback(() => {
    if (maskCanvasRef.current?.undo) {
      maskCanvasRef.current.undo();
    }
  }, []);

  // Redo function
  const redo = useCallback(() => {
    if (maskCanvasRef.current?.redo) {
      maskCanvasRef.current.redo();
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

      if (ctrlKey && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (ctrlKey && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="h-full flex flex-col">
      {/* Top toolbar */}
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={undo}
            disabled={
              disabled || isProcessing || isBackgroundProcessing || isBackgroundBlurProcessing || !maskCanvasRef.current?.canUndo
            }
            className="border-gray-300 text-gray-700 hover:opacity-90"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={redo}
            disabled={
              disabled || isProcessing || isBackgroundProcessing || isBackgroundBlurProcessing || !maskCanvasRef.current?.canRedo
            }
            className="border-gray-300 text-gray-700 hover:opacity-90"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            disabled={disabled || isProcessing || isBackgroundProcessing || isBackgroundBlurProcessing}
            className="border-gray-300 text-gray-700 hover:opacity-90"
            title="Clear All"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <ZoomControls
            zoom={zoom}
            onZoomChange={setZoom}
            onPanChange={setPan}
            disabled={disabled || isProcessing || isBackgroundProcessing || isBackgroundBlurProcessing}
          />

          {(processedImageUrl || backgroundRemovedImageUrl || backgroundBlurredImageUrl) && (
            <Button
              variant="outline"
              size="sm"
              onMouseDown={handleCompareStart}
              onMouseUp={handleCompareEnd}
              onMouseLeave={handleCompareEnd}
              onTouchStart={handleCompareStart}
              onTouchEnd={handleCompareEnd}
              disabled={disabled || isProcessing || isBackgroundProcessing || isBackgroundBlurProcessing}
              className="border-gray-300 text-gray-700 hover:bg-gray-500"
              title={`Hold to compare with original${
                [processedImageUrl, backgroundRemovedImageUrl, backgroundBlurredImageUrl].filter(Boolean).length > 1
                  ? " (final result)"
                  : processedImageUrl
                  ? " (inpaint result)"
                  : backgroundRemovedImageUrl
                  ? " (background removed)"
                  : " (background blurred)"
              }`}
            >
              <UnfoldHorizontal className="w-4 h-4 " />
              {/* Compare */}
            </Button>
          )}
          <div className="relative">
            <Button
              onClick={onRemoveBackground}
              disabled={
                disabled || isBackgroundProcessing || isBackgroundBlurProcessing || !onRemoveBackground
              }
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
            >
              <Scissors className="w-4 h-4 mr-2" />
              {isBackgroundProcessing ? "Processing..." : "Remove Background"}
            </Button>

            {/* Background replacement dropdown */}
            {backgroundRemovedImageUrl && onReplaceBackground && (
              <div
                ref={backgroundSelectorRef}
                className="relative inline-block ml-1"
              >
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setShowBackgroundSelector(!showBackgroundSelector)
                  }
                  disabled={disabled || isBackgroundProcessing || isBackgroundBlurProcessing}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                  title="Replace background"
                >
                  <Palette className="w-4 h-4 mr-1" />
                  <ChevronDown className="w-3 h-3" />
                </Button>

                {/* Background selector dropdown */}
                {showBackgroundSelector && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                    <div className="p-3">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Choose Background
                      </h4>
                      <div className="grid grid-cols-4 gap-2">
                        {/* Predefined backgrounds */}
                        {[
                          { name: "White", color: "#ffffff" },
                          { name: "Black", color: "#000000" },
                          { name: "Blue", color: "#3b82f6" },
                          { name: "Green", color: "#10b981" },
                          { name: "Red", color: "#ef4444" },
                          { name: "Purple", color: "#8b5cf6" },
                          { name: "Yellow", color: "#f59e0b" },
                          { name: "Gray", color: "#6b7280" },
                        ].map((bg) => (
                          <button
                            key={bg.name}
                            onClick={() => {
                              // Create a solid color background with image dimensions
                              const canvas = document.createElement("canvas");
                              canvas.width = imageData.width;
                              canvas.height = imageData.height;
                              const ctx = canvas.getContext("2d");
                              if (ctx) {
                                ctx.fillStyle = bg.color;
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                const dataURL = canvas.toDataURL();
                                onReplaceBackground?.(dataURL);
                              }
                              setShowBackgroundSelector(false);
                            }}
                            className="w-12 h-12 rounded border-2 border-gray-200 hover:border-gray-400 transition-colors"
                            style={{ backgroundColor: bg.color }}
                            title={bg.name}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Background blur button and controls */}
            <div
              ref={blurSelectorRef}
              className="relative inline-block ml-1"
            >
              <Button
                onClick={() => {
                  if (onBlurBackground) {
                    onBlurBackground(blurIntensity);
                    // Auto-show blur selector after first blur for better UX
                    if (!backgroundBlurredImageUrl) {
                      setTimeout(() => setShowBlurSelector(true), 1000);
                    }
                  }
                }}
                disabled={
                  disabled || isBackgroundBlurProcessing || !onBlurBackground
                }
                className="bg-orange-600 hover:bg-orange-700 text-white shadow-sm"
              >
                <Focus className="w-4 h-4 mr-2" />
                {isBackgroundBlurProcessing ? "Processing..." : "Blur Background"}
              </Button>

              {/* Blur intensity control dropdown - only show if blur has been processed */}
              {backgroundBlurredImageUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBlurSelector(!showBlurSelector)}
                  disabled={disabled || isBackgroundBlurProcessing}
                  className="border-orange-300 text-orange-700 hover:bg-orange-50 ml-1"
                  title="Adjust blur intensity"
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
              )}

              {/* Blur selector dropdown - only show if blur has been processed */}
              {showBlurSelector && backgroundBlurredImageUrl && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">
                      Blur Intensity
                    </h4>
                    <div className="space-y-3">
                      <Slider
                        value={[blurIntensity]}
                        onValueChange={(value) => handleBlurIntensityChange(value[0])}
                        max={100}
                        min={5}
                        step={5}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Light (5%)</span>
                        <span className="font-medium">{blurIntensity}%</span>
                        <span>Heavy (100%)</span>
                      </div>
                      <div className="flex gap-2 mt-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleBlurIntensityChange(20)}
                          className="flex-1 text-xs"
                        >
                          Default (20%)
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (onBlurBackground) {
                              onBlurBackground(blurIntensity);
                            }
                            setShowBlurSelector(false);
                          }}
                          disabled={!onBlurBackground}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs"
                        >
                          Apply Blur
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <Button
            onClick={handleProcess}
            disabled={disabled || isProcessing || isBackgroundProcessing || isBackgroundBlurProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {isProcessing ? "Processing..." : "Remove Objects"}
          </Button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={containerRef}
          className="absolute inset-0 canvas-container flex items-center justify-center"
          onWheel={handleWheel}
          onMouseDown={handlePanStart}
          onMouseMove={handlePanMove}
          onMouseUp={handlePanEnd}
          onMouseLeave={handlePanEnd}
          style={{ cursor: isPanning ? "grabbing" : "grab" }}
        >
          <div className="relative"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isPanning ? "none" : "transform 0.1s ease-out",
            }}
          >
            <ImageCanvas
              imageData={imageData}
              finalResult={finalResult}
              canvasSize={canvasSize}
              showComparison={showComparison}
              comparisonProgress={comparisonProgress}
              onCanvasSizeChange={setCanvasSize}
            />

            <MaskCanvas
              key={imageData.id} // Force remount when switching images
              ref={maskCanvasRef}
              canvasSize={canvasSize}
              brushSettings={brushSettings}
              disabled={disabled}
              isPanning={isPanning}
              showComparison={showComparison}
              initialMaskState={initialMaskState}
              initialHistoryState={initialHistoryState}
              onMaskStateChange={onMaskStateChange}
              onHistoryStateChange={onHistoryStateChange}
              zoom={zoom}
            />

            {/* Processing Overlay - Outside transform container */}
            {(isProcessing || isBackgroundProcessing || isBackgroundBlurProcessing) && (
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 mx-auto">
                      <Sparkles className={`w-16 h-16 animate-spin ${
                        isBackgroundProcessing ? 'text-purple-500' :
                        isBackgroundBlurProcessing ? 'text-orange-500' : 'text-blue-500'
                      }`} />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-8 h-8 rounded-full animate-pulse ${
                        isBackgroundProcessing ? 'bg-purple-500' :
                        isBackgroundBlurProcessing ? 'bg-orange-500' : 'bg-blue-500'
                      }`}></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    {isBackgroundProcessing ? 'Removing Background' :
                     isBackgroundBlurProcessing ? 'Blurring Background' : 'Processing Image'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {isBackgroundProcessing
                      ? 'AI is removing the background from your image...'
                      : isBackgroundBlurProcessing
                      ? 'AI is blurring the background of your image...'
                      : 'AI is removing unwanted objects...'
                    }
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <div className={`w-2 h-2 rounded-full animate-bounce ${
                      isBackgroundProcessing ? 'bg-purple-500' :
                      isBackgroundBlurProcessing ? 'bg-orange-500' : 'bg-blue-500'
                    }`}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce delay-100 ${
                      isBackgroundProcessing ? 'bg-purple-500' :
                      isBackgroundBlurProcessing ? 'bg-orange-500' : 'bg-blue-500'
                    }`}></div>
                    <div className={`w-2 h-2 rounded-full animate-bounce delay-200 ${
                      isBackgroundProcessing ? 'bg-purple-500' :
                      isBackgroundBlurProcessing ? 'bg-orange-500' : 'bg-blue-500'
                    }`}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
// Custom comparison function to prevent re-renders when only brushSettings change
const arePropsEqual = (
  prevProps: CanvasEditorProps,
  nextProps: CanvasEditorProps
) => {
  // List of props to compare (excluding brushSettings)
  const propsToCompare: (keyof CanvasEditorProps)[] = [
    "imageData",
    "disabled",
    "initialMaskState",
    "initialHistoryState",
    "isProcessing",
    "processedImageUrl",
    "isBackgroundProcessing",
    "backgroundRemovedImageUrl",
    "isBackgroundBlurProcessing",
    "backgroundBlurredImageUrl",
    "finalResult",
  ];

  // Compare each prop individually
  for (const prop of propsToCompare) {
    if (prevProps[prop] !== nextProps[prop]) {
      return false;
    }
  }

  // Ignore brushSettings changes - component will get latest via useRef
  return true;
};

export const CanvasEditor = React.memo(CanvasEditorComponent, arePropsEqual);
