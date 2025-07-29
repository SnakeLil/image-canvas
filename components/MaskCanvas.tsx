"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { createMagicWandCursor, createDynamicCircleCursor } from "./MagicCursor";

export interface MaskState {
  dataURL: string;
  width: number;
  height: number;
}

export interface BrushSettings {
  size: number;
  opacity: number;
  color: string;
  shape: import("./MagicCursor").CursorShape;
}

export interface MaskCanvasProps {
  canvasSize: { width: number; height: number };
  brushSettings: BrushSettings;
  disabled?: boolean;
  isPanning?: boolean;
  showComparison?: boolean;
  initialMaskState?: MaskState;
  initialHistoryState?: { history: string[]; historyIndex: number };
  onMaskStateChange?: (maskState: MaskState) => void;
  onHistoryStateChange?: (history: string[], historyIndex: number) => void;
  onStartDrawing?: () => void;
  onStopDrawing?: () => void;
  zoom?: number; // Add zoom prop for cursor scaling
}

export const MaskCanvas = React.forwardRef<any, MaskCanvasProps>(
  (
    {
      canvasSize,
      brushSettings,
      disabled = false,
      isPanning = false,
      showComparison = false,
      initialMaskState,
      initialHistoryState,
      onMaskStateChange,
      onHistoryStateChange,
      onStartDrawing,
      onStopDrawing,
      zoom = 1,
    },
    ref
  ) => {
    const maskCanvasRef = useRef<HTMLCanvasElement>(null);
    const brushSettingsRef = useRef<BrushSettings>(brushSettings);

    const [isDrawing, setIsDrawing] = useState(false);
    const [lastDrawPoint, setLastDrawPoint] = useState<{
      x: number;
      y: number;
    } | null>(null);
    const [previousDrawPoint, setPreviousDrawPoint] = useState<{
      x: number;
      y: number;
    } | null>(null);

    // History management
    const [history, setHistory] = useState<string[]>(
      initialHistoryState?.history || []
    );
    const [historyIndex, setHistoryIndex] = useState(
      initialHistoryState?.historyIndex || -1
    );

    // Update ref when external settings change
    useEffect(() => {
      brushSettingsRef.current = brushSettings;
    }, [brushSettings]);

    // Calculate actual brush size considering canvas scaling
    const getActualBrushSize = useCallback(() => {
      const canvas = maskCanvasRef.current;
      if (!canvas) return brushSettings.size;

      // Get the ratio between canvas actual size and display size
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const averageScale = (scaleX + scaleY) / 2;

      // Return brush size scaled by canvas resolution
      return brushSettings.size * averageScale;
    }, [brushSettings.size]);

    // Sync history state when props change (image switching)
    useEffect(() => {
      if (initialHistoryState) {
        setHistory(initialHistoryState.history);
        setHistoryIndex(initialHistoryState.historyIndex);
      } else {
        // For new images, reset history and force clear canvas
        setHistory([]);
        setHistoryIndex(-1);

        // Force clear canvas immediately for new images
        const canvas = maskCanvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      }
    }, [initialHistoryState]);

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

    // Helper function to draw a line between two points
    const drawLine = useCallback(
      (
        ctx: CanvasRenderingContext2D,
        from: { x: number; y: number },
        to: { x: number; y: number }
      ) => {
        const actualBrushSize = getActualBrushSize();
        const distance = Math.sqrt(
          Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)
        );
        const steps = Math.max(
          1,
          Math.floor(distance / (actualBrushSize / 4))
        );

        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const x = from.x + (to.x - from.x) * t;
          const y = from.y + (to.y - from.y) * t;

          ctx.beginPath();
          ctx.arc(x, y, actualBrushSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      },
      [getActualBrushSize]
    );

    // Initialize canvas
    useEffect(() => {
      const canvas = maskCanvasRef.current;
      if (!canvas || !canvasSize.width || !canvasSize.height) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Set canvas dimensions
      canvas.width = canvasSize.width;
      canvas.height = canvasSize.height;

      // Clear mask first
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);
    }, [canvasSize]);

    // Restore mask state when switching images
    useEffect(() => {
      const canvas = maskCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Ensure canvas has correct dimensions
      if (canvasSize.width && canvasSize.height) {
        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;
      }

      requestAnimationFrame(() => {
        // Always clear the canvas first - this is crucial for new images
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Only restore if there's a mask state for this image
        if (initialMaskState && canvasSize.width && canvasSize.height) {
          const img = new Image();
          img.onload = () => {
            const scaleX = canvasSize.width / initialMaskState.width;
            const scaleY = canvasSize.height / initialMaskState.height;

            requestAnimationFrame(() => {
              // Clear again before drawing to ensure clean state
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              if (Math.abs(scaleX - scaleY) < 0.01) {
                ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
              } else if (
                initialMaskState.width === canvasSize.width &&
                initialMaskState.height === canvasSize.height
              ) {
                ctx.drawImage(img, 0, 0, canvasSize.width, canvasSize.height);
              }
            });
          };
          img.src = initialMaskState.dataURL;
        }
      });
    }, [initialMaskState, canvasSize]);

    // Handle new image initialization - save blank state for new images
    useEffect(() => {
      const canvas = maskCanvasRef.current;
      if (!canvas || !canvasSize.width || !canvasSize.height) return;

      // Only initialize for new images (no mask state and empty history)
      if (!initialMaskState && history.length === 0 && historyIndex === -1) {
        // Small delay to ensure canvas is fully cleared
        const timeoutId = setTimeout(() => {
          const dataURL = canvas.toDataURL();
          setHistory([dataURL]);
          setHistoryIndex(0);

          if (onHistoryStateChange) {
            onHistoryStateChange([dataURL], 0);
          }
          if (onMaskStateChange) {
            onMaskStateChange(createMaskState(canvas));
          }
        }, 10);

        return () => clearTimeout(timeoutId);
      }
    }, [
      initialMaskState,
      canvasSize,
      history.length,
      historyIndex,
      onHistoryStateChange,
      onMaskStateChange,
      createMaskState,
    ]);

    // Save current state to history
    const saveToHistory = useCallback(() => {
      const canvas = maskCanvasRef.current;
      if (!canvas) return;

      const dataURL = canvas.toDataURL();

      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1);
        newHistory.push(dataURL);
        const finalHistory = newHistory.slice(-20);

        const newIndex = finalHistory.length - 1;
        if (onHistoryStateChange) {
          onHistoryStateChange(finalHistory, newIndex);
        }

        return finalHistory;
      });

      setHistoryIndex((prev) => prev + 1);

      if (onMaskStateChange) {
        onMaskStateChange(createMaskState(canvas));
      }
    }, [
      historyIndex,
      onHistoryStateChange,
      onMaskStateChange,
      createMaskState,
    ]);

    const startDrawing = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        if (disabled || isPanning) return;

        setIsDrawing(true);
        onStartDrawing?.();

        const canvas = maskCanvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        // Convert screen coordinates to canvas coordinates
        // The canvas is positioned with absolute inset-0, so we need to convert
        // the mouse position relative to the actual canvas coordinate system
        const x = ((clientX - rect.left) / rect.width) * canvas.width;
        const y = ((clientY - rect.top) / rect.height) * canvas.height;

        // Clamp coordinates to canvas bounds to prevent drawing outside
        const clampedX = Math.max(0, Math.min(canvas.width - 1, x));
        const clampedY = Math.max(0, Math.min(canvas.height - 1, y));

        setLastDrawPoint({ x: clampedX, y: clampedY });
        setPreviousDrawPoint({ x: clampedX, y: clampedY });
      },
      [disabled, isPanning, onStartDrawing]
    );

    const draw = useCallback(
      (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || disabled || isPanning) return;

        const canvas = maskCanvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
        const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

        // Convert screen coordinates to canvas coordinates
        // The canvas is positioned with absolute inset-0, so we need to convert
        // the mouse position relative to the actual canvas coordinate system
        const x = ((clientX - rect.left) / rect.width) * canvas.width;
        const y = ((clientY - rect.top) / rect.height) * canvas.height;

        // Clamp coordinates to canvas bounds to prevent drawing outside
        const clampedX = Math.max(0, Math.min(canvas.width - 1, x));
        const clampedY = Math.max(0, Math.min(canvas.height - 1, y));

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const currentBrush = brushSettingsRef.current;
        const actualBrushSize = getActualBrushSize();

        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = currentBrush.color;
        ctx.globalAlpha = currentBrush.opacity / 100;

        if (lastDrawPoint) {
          ctx.beginPath();
          ctx.arc(
            lastDrawPoint.x,
            lastDrawPoint.y,
            actualBrushSize / 2,
            0,
            Math.PI * 2
          );
          ctx.fill();
          setLastDrawPoint(null);
        }

        if (previousDrawPoint) {
          drawLine(ctx, previousDrawPoint, { x: clampedX, y: clampedY });
        } else {
          ctx.beginPath();
          ctx.arc(clampedX, clampedY, actualBrushSize / 2, 0, Math.PI * 2);
          ctx.fill();
        }

        setPreviousDrawPoint({ x: clampedX, y: clampedY });
      },
      [
        isDrawing,
        disabled,
        isPanning,
        lastDrawPoint,
        previousDrawPoint,
        drawLine,
        getActualBrushSize,
      ]
    );

    const stopDrawing = useCallback(() => {
      if (isDrawing) {
        setIsDrawing(false);
        setPreviousDrawPoint(null);
        onStopDrawing?.();

        requestAnimationFrame(() => {
          saveToHistory();
        });
      }
    }, [isDrawing, saveToHistory, onStopDrawing]);

    // Undo function
    const undo = useCallback(() => {
      if (historyIndex <= 0) return;

      const canvas = maskCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const newIndex = historyIndex - 1;
      const imageData = history[newIndex];

      setHistoryIndex(newIndex);

      if (imageData) {
        const img = new Image();
        img.onload = () => {
          requestAnimationFrame(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

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

    // Redo function
    const redo = useCallback(() => {
      if (historyIndex >= history.length - 1) return;

      const canvas = maskCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const newIndex = historyIndex + 1;
      const imageData = history[newIndex];

      setHistoryIndex(newIndex);

      if (imageData) {
        const img = new Image();
        img.onload = () => {
          requestAnimationFrame(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            if (onMaskStateChange) {
              onMaskStateChange(createMaskState(canvas));
            }
          });
        };
        img.src = imageData;
      }

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

    // Clear all
    const clearAll = useCallback(() => {
      const canvas = maskCanvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      requestAnimationFrame(() => {
        saveToHistory();
      });
    }, [saveToHistory]);

    // Expose methods to parent
    React.useImperativeHandle(ref, () => ({
      undo,
      redo,
      clearAll,
      getCanvas: () => maskCanvasRef.current,
      canUndo: historyIndex > 0,
      canRedo: historyIndex < history.length - 1,
    }));

    // Calculate cursor size based on brush size and zoom level
    const getCursorSize = () => {
      const canvas = maskCanvasRef.current;
      if (!canvas) {
        // Fallback when canvas is not available
        const scaledSize = brushSettings.size * zoom;
        return Math.max(8, Math.min(scaledSize, 120));
      }

      // Get the ratio between canvas display size and actual size
      const rect = canvas.getBoundingClientRect();
      const displayToActualRatio = rect.width / canvas.width;

      // Calculate the cursor size that matches the actual brush size on screen
      // The brush size is applied to canvas coordinates, so we need to scale it back to display coordinates
      const actualBrushSize = getActualBrushSize();
      const cursorSize = actualBrushSize * displayToActualRatio * zoom;

      // Ensure cursor is visible and usable
      return Math.max(8, Math.min(cursorSize, 120));
    };

    return (
      <div className="absolute inset-0" style={{ width: canvasSize.width, height: canvasSize.height }}>
        <canvas
          ref={maskCanvasRef}
          className="block rounded-lg"
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            opacity: showComparison ? 0 : 0.6,
            cursor: isPanning
              ? "grabbing"
              : brushSettings.shape === "circle"
              ? createDynamicCircleCursor(
                  getCursorSize(),
                  brushSettings.color,
                  brushSettings.opacity
                )
              : createMagicWandCursor(
                  brushSettings.shape,
                  getCursorSize()
                ),
            pointerEvents: isPanning ? "none" : "auto",
            transition: "opacity 0.2s ease-in-out",
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
    );
  }
);

MaskCanvas.displayName = "MaskCanvas";
