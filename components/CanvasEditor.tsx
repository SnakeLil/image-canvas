'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { BrushControls } from './BrushControls';
import { ZoomControls } from './ZoomControls';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Undo, Redo, Trash2, Wand2 } from 'lucide-react';
import type { ImageData } from './ImageEditor';

interface CanvasEditorProps {
  imageData: ImageData;
  onProcessImage: (maskCanvas: HTMLCanvasElement) => void;
  disabled?: boolean;
}

interface BrushSettings {
  size: number;
  opacity: number;
}

interface CanvasState {
  imageData: ImageData | null;
  maskData: ImageData | null;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  imageData,
  onProcessImage,
  disabled = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    size: 20,
    opacity: 100
  });
  const [zoom, setZoom] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [history, setHistory] = useState<CanvasState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Initialize canvas
  useEffect(() => {
    if (!imageData || !canvasRef.current || !maskCanvasRef.current) return;

    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');

    if (!ctx || !maskCtx) return;

    // Calculate canvas size to fit container while maintaining aspect ratio
    const container = containerRef.current;
    if (!container) return;

    const containerWidth = container.clientWidth - 32; // Account for padding
    const containerHeight = Math.min(600, window.innerHeight * 0.6);
    
    const imageAspectRatio = imageData.width / imageData.height;
    const containerAspectRatio = containerWidth / containerHeight;

    let canvasWidth, canvasHeight;
    
    if (imageAspectRatio > containerAspectRatio) {
      canvasWidth = containerWidth;
      canvasHeight = containerWidth / imageAspectRatio;
    } else {
      canvasHeight = containerHeight;
      canvasWidth = containerHeight * imageAspectRatio;
    }

    setCanvasSize({ width: canvasWidth, height: canvasHeight });

    // Set canvas dimensions
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    maskCanvas.width = canvasWidth;
    maskCanvas.height = canvasHeight;

    // Draw image on main canvas
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    };
    img.src = imageData.url;

    // Initialize mask canvas with transparent background
    maskCtx.fillStyle = 'rgba(0, 0, 0, 0)';
    maskCtx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    // Set blend mode for better mask visibility
    maskCanvas.style.mixBlendMode = 'multiply';

    // Save initial state
    const initialState = {
      imageData: ctx.getImageData(0, 0, canvasWidth, canvasHeight),
      maskData: maskCtx.getImageData(0, 0, canvasWidth, canvasHeight)
    };
    setHistory([initialState]);
    setHistoryIndex(0);
  }, [imageData]);

  const saveState = useCallback(() => {
    if (!canvasRef.current || !maskCanvasRef.current) return;

    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');

    if (!ctx || !maskCtx) return;

    const state = {
      imageData: ctx.getImageData(0, 0, canvas.width, canvas.height),
      maskData: maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height)
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(state);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;

    const newIndex = historyIndex - 1;
    const state = history[newIndex];
    
    if (!canvasRef.current || !maskCanvasRef.current) return;
    
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');

    if (!ctx || !maskCtx) return;

    ctx.putImageData(state.imageData, 0, 0);
    maskCtx.putImageData(state.maskData, 0, 0);
    setHistoryIndex(newIndex);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    const newIndex = historyIndex + 1;
    const state = history[newIndex];
    
    if (!canvasRef.current || !maskCanvasRef.current) return;
    
    const canvas = canvasRef.current;
    const maskCanvas = maskCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');

    if (!ctx || !maskCtx) return;

    ctx.putImageData(state.imageData, 0, 0);
    maskCtx.putImageData(state.maskData, 0, 0);
    setHistoryIndex(newIndex);
  }, [history, historyIndex]);

  const clearMask = useCallback(() => {
    if (!maskCanvasRef.current) return;

    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    saveState();
  }, [saveState]);

  const getCanvasCoordinates = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return null;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }, []);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    setIsDrawing(true);
    
    const coords = getCanvasCoordinates(e);
    if (!coords || !maskCanvasRef.current) return;

    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    // Use red color for better visibility
    maskCtx.globalCompositeOperation = 'source-over';
    maskCtx.fillStyle = `rgba(255, 50, 50, ${brushSettings.opacity / 100})`;
    maskCtx.beginPath();
    maskCtx.arc(coords.x, coords.y, brushSettings.size / 2, 0, 2 * Math.PI);
    maskCtx.fill();
  }, [disabled, brushSettings, getCanvasCoordinates]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    
    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    if (!coords || !maskCanvasRef.current) return;

    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    // Use red color for better visibility
    maskCtx.globalCompositeOperation = 'source-over';
    maskCtx.fillStyle = `rgba(255, 50, 50, ${brushSettings.opacity / 100})`;
    maskCtx.beginPath();
    maskCtx.arc(coords.x, coords.y, brushSettings.size / 2, 0, 2 * Math.PI);
    maskCtx.fill();
  }, [isDrawing, disabled, brushSettings, getCanvasCoordinates]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    saveState();
  }, [isDrawing, saveState]);

  const handleProcess = useCallback(() => {
    if (!maskCanvasRef.current) return;
    onProcessImage(maskCanvasRef.current);
  }, [onProcessImage]);

  return (
    <Card className="p-4 bg-gray-800/50 border-gray-700">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={disabled || historyIndex <= 0}
              className="border-gray-600 hover:border-gray-500"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={disabled || historyIndex >= history.length - 1}
              className="border-gray-600 hover:border-gray-500"
            >
              <Redo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearMask}
              disabled={disabled}
              className="border-gray-600 hover:border-gray-500"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={handleProcess}
            disabled={disabled}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            Remove Objects
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-4">
          {/* Brush Controls */}
          <div className="lg:w-64">
            <BrushControls
              settings={brushSettings}
              onSettingsChange={setBrushSettings}
              disabled={disabled}
            />
          </div>

          {/* Canvas Container */}
          <div className="flex-1">
            <div 
              ref={containerRef}
              className="relative bg-gray-700/30 rounded-lg p-4 overflow-hidden"
              style={{ minHeight: '400px' }}
            >
              <div className="relative mx-auto" style={{ width: canvasSize.width, height: canvasSize.height }}>
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 rounded-lg"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                />
                <canvas
                  ref={maskCanvasRef}
                  className="absolute inset-0 rounded-lg opacity-60 pointer-events-auto"
                  style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>

              {/* Zoom Controls */}
              <div className="absolute top-4 right-4">
                <ZoomControls
                  zoom={zoom}
                  onZoomChange={setZoom}
                  disabled={disabled}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="text-sm text-gray-400 text-center">
          Paint over the areas you want to remove (shown in red), then click "Remove Objects" to process
        </div>
      </div>
    </Card>
  );
};