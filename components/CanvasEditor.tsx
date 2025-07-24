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
  imageData: globalThis.ImageData | null;
  maskData: globalThis.ImageData | null;
}

interface StarParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  rotation: number;
  velocity: {
    x: number;
    y: number;
  };
  life: number;
  maxLife: number;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  imageData,
  onProcessImage,
  disabled = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastPoint = useRef<{x: number, y: number} | null>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushSettings, setBrushSettings] = useState<BrushSettings>({
    size: 20,
    opacity: 100
  });
  const [zoom, setZoom] = useState(1);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [history, setHistory] = useState<CanvasState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [stars, setStars] = useState<StarParticle[]>([]);
  const animationFrameRef = useRef<number>();

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

    let canvasWidth: number, canvasHeight: number;
    
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

    // Initialize mask canvas with transparent background for display
    maskCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Remove blend mode to show white paint clearly
    maskCanvas.style.mixBlendMode = 'normal';

    // Save initial state
    const initialState = {
      imageData: ctx.getImageData(0, 0, canvasWidth, canvasHeight),
      maskData: maskCtx.getImageData(0, 0, canvasWidth, canvasHeight)
    };
    setHistory([initialState]);
    setHistoryIndex(0);
  }, [imageData]);

  // Create star particles
  const createStars = useCallback((x: number, y: number, count: number = 3) => {
    const newStars: StarParticle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 1.0;
      const speed = 0.5 + Math.random() * 1.5;
      newStars.push({
        id: Date.now() + i + Math.random() * 1000,
        x: x + (Math.random() - 0.5) * 30,
        y: y + (Math.random() - 0.5) * 30,
        size: 6 + Math.random() * 10,
        opacity: 0.8 + Math.random() * 0.2,
        rotation: Math.random() * Math.PI * 2,
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed - 0.5 // slight upward drift
        },
        life: 0,
        maxLife: 40 + Math.random() * 30
      });
    }
    setStars(prev => [...prev, ...newStars]);
  }, []);

  // Animate stars
  const animateStars = useCallback(() => {
    setStars(prev => {
      const updated = prev.map(star => ({
        ...star,
        x: star.x + star.velocity.x,
        y: star.y + star.velocity.y,
        rotation: star.rotation + 0.1,
        life: star.life + 1,
        opacity: Math.max(0, 1 - (star.life / star.maxLife))
      })).filter(star => star.life < star.maxLife);

      return updated;
    });

    if (stars.length > 0) {
      animationFrameRef.current = requestAnimationFrame(animateStars);
    }
  }, [stars.length]);

  // Start animation when stars are created
  useEffect(() => {
    if (stars.length > 0 && !animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animateStars);
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [stars.length, animateStars]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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

    if (!ctx || !maskCtx || !state.imageData || !state.maskData) return;

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

    if (!ctx || !maskCtx || !state.imageData || !state.maskData) return;

    ctx.putImageData(state.imageData, 0, 0);
    maskCtx.putImageData(state.maskData, 0, 0);
    setHistoryIndex(newIndex);
  }, [history, historyIndex]);

  const clearMask = useCallback(() => {
    if (!maskCanvasRef.current) return;

    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    // Clear mask canvas completely
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
    lastPoint.current = null; // Reset last point for new stroke

    const coords = getCanvasCoordinates(e);
    if (!coords || !maskCanvasRef.current) return;

    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    // Use white color for IOPaint (white = remove, black = keep)
    maskCtx.globalCompositeOperation = 'source-over';
    maskCtx.fillStyle = `rgba(255, 255, 255, ${brushSettings.opacity / 100})`;
    maskCtx.beginPath();
    maskCtx.arc(coords.x, coords.y, brushSettings.size / 2, 0, 2 * Math.PI);
    maskCtx.fill();

    lastPoint.current = coords; // Set initial point

    // Create stars at drawing position
    createStars(coords.x, coords.y, 2);
  }, [disabled, brushSettings, getCanvasCoordinates, createStars]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;

    e.preventDefault();
    const coords = getCanvasCoordinates(e);
    if (!coords || !maskCanvasRef.current) return;

    const maskCanvas = maskCanvasRef.current;
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;

    // Improved drawing with line smoothing (similar to IOPaint)
    maskCtx.globalCompositeOperation = 'source-over';
    maskCtx.fillStyle = `rgba(255, 255, 255, ${brushSettings.opacity / 100})`;
    maskCtx.strokeStyle = `rgba(255, 255, 255, ${brushSettings.opacity / 100})`;
    maskCtx.lineWidth = brushSettings.size;
    maskCtx.lineCap = 'round';
    maskCtx.lineJoin = 'round';

    // If this is the first point, just draw a circle
    if (!lastPoint.current) {
      maskCtx.beginPath();
      maskCtx.arc(coords.x, coords.y, brushSettings.size / 2, 0, 2 * Math.PI);
      maskCtx.fill();
      lastPoint.current = coords;
    } else {
      // Draw a line from the last point to the current point
      maskCtx.beginPath();
      maskCtx.moveTo(lastPoint.current.x, lastPoint.current.y);
      maskCtx.lineTo(coords.x, coords.y);
      maskCtx.stroke();
      lastPoint.current = coords;
    }

    // Create stars while drawing (less frequently)
    if (Math.random() < 0.15) {
      createStars(coords.x, coords.y, 1);
    }
  }, [isDrawing, disabled, brushSettings, getCanvasCoordinates, createStars]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPoint.current = null; // Clear last point
    saveState();
  }, [isDrawing, saveState]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDrawing) {
      draw(e);
    }
  }, [isDrawing, draw]);

  const handleMouseLeave = useCallback(() => {
    stopDrawing();
  }, [stopDrawing]);

  const handleProcess = useCallback(() => {
    if (!maskCanvasRef.current) return;
    onProcessImage(maskCanvasRef.current);
  }, [onProcessImage]);

  // Create custom cursor SVG
  const createStarCursor = useCallback((size: number) => {
    const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill="#FFD700"
              stroke="#FFA500"
              stroke-width="1"
              filter="url(#glow)"/>
        <circle cx="12" cy="12" r="1" fill="#FFF" opacity="0.8"/>
      </svg>
    `;
    const encoded = encodeURIComponent(svg);
    return `url("data:image/svg+xml,${encoded}") ${size/2} ${size/2}, auto`;
  }, []);

  return (
    <Card className="p-4 bg-white border-gray-200 shadow-sm">
      <div className="space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={disabled || historyIndex <= 0}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={disabled || historyIndex >= history.length - 1}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Redo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearMask}
              disabled={disabled}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <Button
            onClick={handleProcess}
            disabled={disabled}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
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
              className="relative bg-gray-50 rounded-lg p-4 overflow-hidden border border-gray-200"
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
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    cursor: createStarCursor(Math.max(20, brushSettings.size))
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={handleMouseMove}
                  onMouseUp={stopDrawing}
                  onMouseLeave={handleMouseLeave}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />

                {/* Star particles overlay */}
                <div className="absolute inset-0 pointer-events-none" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                  {stars.map(star => (
                    <div
                      key={star.id}
                      className="absolute"
                      style={{
                        left: star.x - star.size / 2,
                        top: star.y - star.size / 2,
                        width: star.size,
                        height: star.size,
                        opacity: star.opacity,
                        transform: `rotate(${star.rotation}rad)`,
                        transition: 'opacity 0.1s ease-out'
                      }}
                    >
                      <svg
                        width={star.size}
                        height={star.size}
                        viewBox="0 0 24 24"
                        className="drop-shadow-lg"
                      >
                        <defs>
                          <radialGradient id={`starGradient-${star.id}`} cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#FFF" stopOpacity="0.9" />
                            <stop offset="30%" stopColor="#FFD700" stopOpacity="0.8" />
                            <stop offset="100%" stopColor="#FF6B35" stopOpacity="0.6" />
                          </radialGradient>
                          <filter id={`glow-${star.id}`}>
                            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        </defs>
                        <path
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          fill={`url(#starGradient-${star.id})`}
                          stroke="#FFB347"
                          strokeWidth="0.3"
                          filter={`url(#glow-${star.id})`}
                        />
                        <circle cx="12" cy="12" r="0.8" fill="#FFF" opacity="0.9" />
                      </svg>
                    </div>
                  ))}
                </div>
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

        <div className="text-sm text-gray-600 text-center space-y-1">
          <div>Paint over the areas you want to remove (shown in white), then click "Remove Objects" to process</div>
          <div className="text-xs text-blue-600">✨ Watch for magical star effects while painting!</div>
        </div>
      </div>
    </Card>
  );
};