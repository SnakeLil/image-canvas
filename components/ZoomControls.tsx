'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number) => void;
  disabled?: boolean;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomChange,
  disabled = false
}) => {
  const handleZoomIn = () => {
    onZoomChange(Math.min(zoom + 0.25, 3));
  };

  const handleZoomOut = () => {
    onZoomChange(Math.max(zoom - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    onZoomChange(1);
  };

  return (
    <div className="flex flex-col gap-2 bg-gray-800/80 backdrop-blur-sm rounded-lg p-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleZoomIn}
        disabled={disabled || zoom >= 3}
        className="border-gray-600 hover:border-gray-500"
      >
        <ZoomIn className="w-4 h-4" />
      </Button>
      
      <div className="text-xs text-center text-gray-400 px-2">
        {Math.round(zoom * 100)}%
      </div>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleZoomOut}
        disabled={disabled || zoom <= 0.5}
        className="border-gray-600 hover:border-gray-500"
      >
        <ZoomOut className="w-4 h-4" />
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={handleResetZoom}
        disabled={disabled || zoom === 1}
        className="border-gray-600 hover:border-gray-500"
      >
        <RotateCcw className="w-4 h-4" />
      </Button>
    </div>
  );
};