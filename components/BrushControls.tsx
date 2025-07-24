'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Paintbrush } from 'lucide-react';

interface BrushControlsProps {
  settings: {
    size: number;
    opacity: number;
  };
  onSettingsChange: (settings: { size: number; opacity: number }) => void;
  disabled?: boolean;
}

export const BrushControls: React.FC<BrushControlsProps> = ({
  settings,
  onSettingsChange,
  disabled = false
}) => {
  return (
    <Card className="p-4 bg-white border-gray-200 shadow-sm">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Paintbrush className="w-4 h-4 text-blue-600" />
          <h3 className="font-medium text-gray-800">Brush Settings</h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm text-gray-700 font-medium">
              Size: {settings.size}px
            </Label>
            <Slider
              value={[settings.size]}
              onValueChange={([value]) =>
                onSettingsChange({ ...settings, size: value })
              }
              min={5}
              max={100}
              step={1}
              disabled={disabled}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-gray-700 font-medium">
              Opacity: {settings.opacity}%
            </Label>
            <Slider
              value={[settings.opacity]}
              onValueChange={([value]) =>
                onSettingsChange({ ...settings, opacity: value })
              }
              min={10}
              max={100}
              step={5}
              disabled={disabled}
              className="w-full"
            />
          </div>

          {/* Brush Preview */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">Preview</Label>
            <div className="h-16 bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
              <div
                className="rounded-full bg-red-500"
                style={{
                  width: `${Math.min(settings.size, 48)}px`,
                  height: `${Math.min(settings.size, 48)}px`,
                  opacity: settings.opacity / 100
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};