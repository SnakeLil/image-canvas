"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import type { ImageData } from "./ImageEditor";

export interface ImageCanvasProps {
  imageData: ImageData;
  finalResult?: { url: string | null; type: 'inpaint' | 'background' | 'final' | 'none' };
  canvasSize: { width: number; height: number };
  showComparison?: boolean;
  comparisonProgress?: number;
  onCanvasSizeChange?: (size: { width: number; height: number }) => void;
}

export const ImageCanvas: React.FC<ImageCanvasProps> = ({
  imageData,
  finalResult,
  canvasSize,
  showComparison = false,
  comparisonProgress = 0,
  onCanvasSizeChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Maximum canvas dimensions
  const MAX_CANVAS_WIDTH = 800;
  const MAX_CANVAS_HEIGHT = 600;

  // Initialize canvas - optimized to reduce flicker
  useEffect(() => {
    if (!imageData || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

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
      // Notify parent about canvas size change
      if (onCanvasSizeChange && (canvasSize.width !== newWidth || canvasSize.height !== newHeight)) {
        onCanvasSizeChange({ width: newWidth, height: newHeight });
      }

      // Set canvas dimensions
      canvas.width = newWidth;
      canvas.height = newHeight;

      // Draw image (use final result if available, otherwise original)
      const img = new Image();
      img.onload = () => {
        // Use another requestAnimationFrame to ensure smooth rendering
        requestAnimationFrame(() => {
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
        });
      };
      img.src = finalResult?.url || imageData.url;
    });
  }, [imageData, finalResult, onCanvasSizeChange, canvasSize.width, canvasSize.height]);

  return (
    <div className="relative" style={{ width: canvasSize.width, height: canvasSize.height }}>
      <canvas
        ref={canvasRef}
        className="block rounded-lg shadow-lg"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
        }}
      />

      {/* Comparison Overlay */}
      {showComparison && finalResult?.url && (
        <div className="absolute inset-0 pointer-events-none">
          {/* Processed image overlay with clip-path */}
          <div className="absolute inset-0">
            <img
              src={finalResult.url}
              className="w-full absolute inset-0 h-full object-contain rounded-lg"
              style={{
                clipPath: `inset(0 ${100 - comparisonProgress * 100}% 0 0)`,
              }}
            />
            <img
              src={imageData.url}
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
      )}
    </div>
  );
};
