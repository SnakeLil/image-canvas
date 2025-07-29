"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { ZoomControls } from "./ZoomControls";
import { createMagicWandCursor } from "./MagicCursor";
import { Button } from "@/components/ui/button";
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
} from "lucide-react";
import type { ImageData } from "./ImageEditor";

export interface MaskState {
  dataURL: string;
  width: number;
  height: number;
}

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
  finalResult?: { url: string | null; type: 'inpaint' | 'background' | 'final' | 'none' };
}

interface BrushSettings {
  size: number;
  opacity: number;
  color: string;
  shape: import("./MagicCursor").CursorShape;
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
  onClearAll,
  finalResult,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [internalBrushSettings, setInternalBrushSettings] =
    useState<BrushSettings>({
      size: 20,
      opacity: 100,
      color: "#ff3333",
      shape: "magic-wand",
    });
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonProgress, setComparisonProgress] = useState(0);
  const [comparisonTargetProgress, setComparisonTargetProgress] = useState(0);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);
  const backgroundSelectorRef = useRef<HTMLDivElement>(null);

  console.log('canvas editor 重渲染')

  // Use ref to store brush settings to avoid re-renders
  const brushSettingsRef = useRef<BrushSettings>(
    externalBrushSettings || internalBrushSettings
  );

  // Update ref when external settings change, but don't trigger re-render
  useEffect(() => {
    brushSettingsRef.current = externalBrushSettings || internalBrushSettings;
  }, [externalBrushSettings, internalBrushSettings]);

  // Helper function to create mask state
  const createMaskState = useCallback(
    (canvas: HTMLCanvasElement): MaskState => {
      return {
        dataURL: canvas.toDataURL(),
        width: canvas.width,
        height: canvas.height,
      };
    },
    []
  );

  // Helper function to draw a line between two points - optimized to avoid re-renders
  const drawLine = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      from: { x: number; y: number },
      to: { x: number; y: number }
    ) => {
      const currentBrushSize = brushSettingsRef.current.size;
      const distance = Math.sqrt(
        Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)
      );
      const steps = Math.max(
        1,
        Math.floor(distance / (currentBrushSize / 4))
      ); // More steps for smoother lines

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = from.x + (to.x - from.x) * t;
        const y = from.y + (to.y - from.y) * t;

        ctx.beginPath();
        ctx.arc(x, y, currentBrushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [] // No dependencies - stable function
  );

  const [zoom, setZoom] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [lastDrawPoint, setLastDrawPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [previousDrawPoint, setPreviousDrawPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);
  // Simplified history system - back to dataURL but with optimizations
  const [history, setHistory] = useState<string[]>(
    initialHistoryState?.history || []
  );
  const [historyIndex, setHistoryIndex] = useState(
    initialHistoryState?.historyIndex || -1
  );

  // Sync history state when props change (image switching)
  useEffect(() => {
    if (initialHistoryState) {
      setHistory(initialHistoryState.history);
      setHistoryIndex(initialHistoryState.historyIndex);
    } else {
      // Reset to empty state for new images
      setHistory([]);
      setHistoryIndex(-1);
    }
  }, [initialHistoryState]);

  // Restore mask state when switching images - optimized to reduce flicker
  useEffect(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas || !canvasSize.width || !canvasSize.height) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use requestAnimationFrame to batch canvas operations
    requestAnimationFrame(() => {
      // Clear current mask
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Restore mask state if available
      if (initialMaskState) {
        const img = new Image();
        img.onload = () => {
          // Scale the mask to fit current canvas size
          const scaleX = canvasSize.width / initialMaskState.width;
          const scaleY = canvasSize.height / initialMaskState.height;

          // Use another requestAnimationFrame to ensure smooth rendering
          requestAnimationFrame(() => {
            // If the aspect ratios match, scale uniformly
            if (Math.abs(scaleX - scaleY) < 0.01) {
              ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
            } else {
              // If aspect ratios don't match, this might be from a different image
              // Only restore if dimensions match exactly to avoid confusion
              if (
                initialMaskState.width === canvasSize.width &&
                initialMaskState.height === canvasSize.height
              ) {
                ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
              }
            }
          });
        };
        img.src = initialMaskState.dataURL;
      }
    });
  }, [initialMaskState, canvasSize]);

  // Save initial blank state for new images (when no history exists)
  useEffect(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas || !canvasSize.width || !canvasSize.height) return;

    // Only save initial state if no history exists (new image)
    if (history.length === 0 && historyIndex === -1) {
      const dataURL = canvas.toDataURL();
      setHistory([dataURL]);
      setHistoryIndex(0);

      // Notify parent about initial state
      if (onHistoryStateChange) {
        onHistoryStateChange([dataURL], 0);
      }
      if (onMaskStateChange) {
        onMaskStateChange(createMaskState(canvas));
      }
    }
  }, [
    canvasSize,
    history.length,
    historyIndex,
    onHistoryStateChange,
    onMaskStateChange,
    createMaskState,
  ]);

  // Maximum canvas dimensions
  const MAX_CANVAS_WIDTH = 800;
  const MAX_CANVAS_HEIGHT = 600;

  // Initialize canvas - optimized to reduce flicker
  useEffect(() => {
    if (!imageData || !canvasRef.current || !maskCanvasRef.current) return;

    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const ctx = canvas.getContext("2d");
    const maskCtx = maskCanvas.getContext("2d");

    if (!ctx || !maskCtx) return;

    // Calculate canvas size with maximum constraints
    const aspectRatio = imageData.width / imageData.height;
    let newWidth = Math.min(imageData.width, MAX_CANVAS_WIDTH);
    let newHeight = newWidth / aspectRatio;

    if (newHeight > MAX_CANVAS_HEIGHT) {
      newHeight = MAX_CANVAS_HEIGHT;
      newWidth = newHeight * aspectRatio;
    }

    // Batch all canvas operations in a single frame
    requestAnimationFrame(() => {
      setCanvasSize({ width: newWidth, height: newHeight });

      // Set canvas dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;
      maskCanvas.width = newWidth;
      maskCanvas.height = newHeight;

      // Clear mask first (restoration is handled by separate useEffect)
      maskCtx.clearRect(0, 0, newWidth, newHeight);

      // Draw image (use background removed version if available, otherwise original)
      const img = new Image();
      img.onload = () => {
        // Use another requestAnimationFrame to ensure smooth rendering
        requestAnimationFrame(() => {
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
        });
      };
      img.src = finalResult?.url || imageData.url;
    });
  }, [imageData, backgroundRemovedImageUrl, finalResult]);

  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled || isPanning || isProcessing) return;
      setIsDrawing(true);

      const canvas = maskCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      // Account for zoom and pan transformations
      const x =
        (clientX - rect.left - rect.width / 2) / zoom + canvasSize.width / 2;
      const y =
        (clientY - rect.top - rect.height / 2) / zoom + canvasSize.height / 2;

      // Store the starting point but don't draw yet
      setLastDrawPoint({ x, y });
      setPreviousDrawPoint({ x, y });
    },
    [disabled, isPanning, isProcessing, zoom, canvasSize]
  );

  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || disabled || isPanning || isProcessing) return;

      const canvas = maskCanvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      // Account for zoom and pan transformations
      const x =
        (clientX - rect.left - rect.width / 2) / zoom + canvasSize.width / 2;
      const y =
        (clientY - rect.top - rect.height / 2) / zoom + canvasSize.height / 2;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Get current brush settings from ref to avoid re-renders
      const currentBrush = brushSettingsRef.current;

      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = currentBrush.color;
      ctx.globalAlpha = currentBrush.opacity / 100;

      // If this is the first draw after starting, draw the starting point too
      if (lastDrawPoint) {
        ctx.beginPath();
        ctx.arc(
          lastDrawPoint.x,
          lastDrawPoint.y,
          currentBrush.size / 2,
          0,
          Math.PI * 2
        );
        ctx.fill();
        setLastDrawPoint(null); // Clear the starting point
      }

      // Draw line from previous point to current point for smooth drawing
      if (previousDrawPoint) {
        drawLine(ctx, previousDrawPoint, { x, y });
      } else {
        // Draw current point if no previous point
        ctx.beginPath();
        ctx.arc(x, y, currentBrush.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update previous point
      setPreviousDrawPoint({ x, y });
    },
    [
      isDrawing,
      disabled,
      isPanning,
      isProcessing,
      zoom,
      canvasSize,
      lastDrawPoint,
      previousDrawPoint,
      drawLine,
    ]
  );

  // Save current state to history - optimized to reduce flicker
  const saveToHistory = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;

    const dataURL = canvas.toDataURL();

    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(dataURL);
      const finalHistory = newHistory.slice(-20);

      // Notify parent immediately with the new history
      const newIndex = finalHistory.length - 1;
      if (onHistoryStateChange) {
        onHistoryStateChange(finalHistory, newIndex);
      }

      return finalHistory;
    });

    setHistoryIndex((prev) => prev + 1);

    // Notify about mask state change
    if (onMaskStateChange) {
      onMaskStateChange(createMaskState(canvas));
    }
  }, [historyIndex, onHistoryStateChange, onMaskStateChange, createMaskState]);

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      setPreviousDrawPoint(null); // Reset previous point

      // Save to history immediately to reduce flicker
      // Use requestAnimationFrame to ensure canvas operations are complete
      requestAnimationFrame(() => {
        saveToHistory();
      });
    }
  }, [isDrawing, saveToHistory]);



  const handleClearAll = useCallback(() => {
    const canvas = maskCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear the mask canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save the cleared state to history immediately
    requestAnimationFrame(() => {
      saveToHistory();
    });

    // Call the parent's clear all function to reset all processing results
    if (onClearAll) {
      onClearAll();
    }
  }, [saveToHistory, onClearAll]);

  const handleProcess = useCallback(() => {
    if (!maskCanvasRef.current) return;
    onProcessImage(maskCanvasRef.current);
  }, [onProcessImage]);

  // Comparison handlers
  const handleCompareStart = () => {
    const comparisonImageUrl = finalResult?.url
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
      const newProgress = currentProgress + (step * direction);

      // Clamp to target if we would overshoot
      const clampedProgress = direction > 0
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
    };
  }, []);

  // Close background selector when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (backgroundSelectorRef.current && !backgroundSelectorRef.current.contains(event.target as Node)) {
        setShowBackgroundSelector(false);
      }
    };

    if (showBackgroundSelector) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showBackgroundSelector]);

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



  // Undo function - optimized to reduce flicker
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;

    const canvas = maskCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newIndex = historyIndex - 1;
    const imageData = history[newIndex];

    // Update index immediately
    setHistoryIndex(newIndex);

    // Optimized rendering with minimal canvas operations
    if (imageData) {
      const img = new Image();
      img.onload = () => {
        // Use a single requestAnimationFrame for all operations
        requestAnimationFrame(() => {
          // Clear and draw in one frame to minimize flicker
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          // Notify parent about state changes
          if (onMaskStateChange) {
            onMaskStateChange(createMaskState(canvas));
          }
        });
      };
      img.src = imageData;
    } else {
      requestAnimationFrame(() => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (onMaskStateChange) {
          onMaskStateChange(createMaskState(canvas));
        }
      });
    }

    // Notify parent about history change
    if (onHistoryStateChange) {
      onHistoryStateChange(history, newIndex);
    }
  }, [
    historyIndex,
    history,
    onMaskStateChange,
    onHistoryStateChange,
    createMaskState,
  ]);

  // Redo function - optimized to reduce flicker
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    const canvas = maskCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const newIndex = historyIndex + 1;
    const imageData = history[newIndex];

    // Update index immediately
    setHistoryIndex(newIndex);

    // Optimized rendering with minimal canvas operations
    if (imageData) {
      const img = new Image();
      img.onload = () => {
        // Use a single requestAnimationFrame for all operations
        requestAnimationFrame(() => {
          // Clear and draw in one frame to minimize flicker
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);

          // Notify parent about state changes
          if (onMaskStateChange) {
            onMaskStateChange(createMaskState(canvas));
          }
        });
      };
      img.src = imageData;
    }

    // Notify parent about history change
    if (onHistoryStateChange) {
      onHistoryStateChange(history, newIndex);
    }
  }, [
    historyIndex,
    history,
    onMaskStateChange,
    onHistoryStateChange,
    createMaskState,
  ]);

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
            disabled={disabled || isProcessing || historyIndex <= 0}
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
              disabled || isProcessing || historyIndex >= history.length - 1
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
            disabled={disabled || isProcessing || isBackgroundProcessing}
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
            disabled={disabled || isProcessing}
          />

          {(processedImageUrl || backgroundRemovedImageUrl) && (
            <Button
              variant="outline"
              size="sm"
              onMouseDown={handleCompareStart}
              onMouseUp={handleCompareEnd}
              onMouseLeave={handleCompareEnd}
              onTouchStart={handleCompareStart}
              onTouchEnd={handleCompareEnd}
              disabled={disabled || isProcessing || isBackgroundProcessing}
              className="border-gray-300 text-gray-700 hover:bg-gray-500"
              title={`Hold to compare with original${
                processedImageUrl && backgroundRemovedImageUrl
                  ? ' (final result)'
                  : processedImageUrl
                    ? ' (inpaint result)'
                    : ' (background removed)'
              }`}
            >
              <UnfoldHorizontal className="w-4 h-4 " />
              {/* Compare */}
            </Button>
          )}
          <div className="relative">
            <Button
              onClick={onRemoveBackground}
              disabled={disabled || isBackgroundProcessing || !onRemoveBackground}
              className="bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
            >
              <Scissors className="w-4 h-4 mr-2" />
              {isBackgroundProcessing ? "Processing..." : "Remove Background"}
            </Button>

            {/* Background replacement dropdown */}
            {backgroundRemovedImageUrl && onReplaceBackground && (
              <div ref={backgroundSelectorRef} className="relative inline-block ml-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBackgroundSelector(!showBackgroundSelector)}
                  disabled={disabled || isBackgroundProcessing}
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
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Choose Background</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {/* Predefined backgrounds */}
                        {[
                          { name: 'White', color: '#ffffff' },
                          { name: 'Black', color: '#000000' },
                          { name: 'Blue', color: '#3b82f6' },
                          { name: 'Green', color: '#10b981' },
                          { name: 'Red', color: '#ef4444' },
                          { name: 'Purple', color: '#8b5cf6' },
                          { name: 'Yellow', color: '#f59e0b' },
                          { name: 'Gray', color: '#6b7280' },
                        ].map((bg) => (
                          <button
                            key={bg.name}
                            onClick={() => {
                              // Create a solid color background with image dimensions
                              const canvas = document.createElement('canvas');
                              canvas.width = imageData.width;
                              canvas.height = imageData.height;
                              const ctx = canvas.getContext('2d');
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
          </div>
          <Button
            onClick={handleProcess}
            disabled={disabled || isProcessing}
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
          <div
            className="relative"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "center center",
              transition: isPanning ? "none" : "transform 0.1s ease-out",
            }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 rounded-lg shadow-lg"
              style={{
                width: canvasSize.width,
                height: canvasSize.height,
              }}
            />
            <canvas
              ref={maskCanvasRef}
              className="absolute inset-0 rounded-lg"
              style={{
                width: canvasSize.width,
                height: canvasSize.height,
                opacity: showComparison ? 0 : 0.6, // Hide mask during comparison
                cursor: isPanning
                  ? "grabbing"
                  : createMagicWandCursor(
                      brushSettingsRef.current.shape,
                      Math.max(20, brushSettingsRef.current.size)
                    ),
                pointerEvents: isPanning ? "none" : "auto",
                transition: "opacity 0.2s ease-in-out", // Smooth transition
              }}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />

            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-lg flex items-center justify-center z-50">
                <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-2xl text-center">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 mx-auto">
                      <Sparkles className="w-16 h-16 text-blue-500 animate-spin" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-8 bg-blue-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">
                    Processing Image
                  </h3>
                  <p className="text-gray-600 mb-4">
                    AI is removing unwanted objects...
                  </p>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Comparison Overlay */}
        {showComparison && finalResult?.url && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div
              className="relative"
              style={{
                width: canvasSize.width,
                height: canvasSize.height,
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transformOrigin: "center center",
              }}
            >
              {/* Processed image overlay with clip-path */}
              <div
                className="absolute inset-0"
                style={{
                  // clipPath: `inset(0 ${100 - comparisonProgress * 100}% 0 0)`,
                  transition:
                    comparisonProgress === 0
                      ? "none"
                      : "clip-path 0.1s ease-out",
                }}
              >
                <img
                  src={finalResult?.url!}
                  className="w-full absolute inset-0 h-full object-contain rounded-lg"
                  style={{
                    clipPath: `inset(0 ${100 - comparisonProgress * 100}% 0 0)`,
                  }}
                />
                <img
                  src={imageData?.url!}
                  className="w-full absolute inset-0 h-full object-contain rounded-lg"
                  style={{
                    clipPath: `inset(0 ${100 - comparisonProgress * 100}% 0 0)`,
                  }}
                />
              </div>

              {/* Sweep line */}
              {comparisonProgress > 0 && comparisonProgress < 1 && (
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10"
                  style={{
                    left: `${comparisonProgress * 100}%`,
                    transform: "translateX(-50%)",
                  }}
                />
              )}
            </div>

            {/* Progress indicator */}
            {/* <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm font-medium z-20">
              {Math.round(comparisonProgress * 100)}% Processed
            </div> */}
          </div>
        )}
      </div>
    </div>
  );
};
// Custom comparison function to prevent re-renders when only brushSettings change
const arePropsEqual = (prevProps: CanvasEditorProps, nextProps: CanvasEditorProps) => {
  // List of props to compare (excluding brushSettings)
  const propsToCompare: (keyof CanvasEditorProps)[] = [
    'imageData', 'disabled', 'initialMaskState', 'initialHistoryState',
    'isProcessing', 'processedImageUrl', 'isBackgroundProcessing',
    'backgroundRemovedImageUrl', 'finalResult'
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