"use client";

import React from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cursorShapes, type CursorShape } from "./MagicCursor";
import { Paintbrush, Palette, Circle, Square } from "lucide-react";

interface BrushControlsProps {
  settings: {
    size: number;
    opacity: number;
    color: string;
    shape: import("./MagicCursor").CursorShape;
  };
  onSettingsChange: (settings: {
    size: number;
    opacity: number;
    color: string;
    shape: import("./MagicCursor").CursorShape;
  }) => void;
  disabled?: boolean;
}

export const BrushControls: React.FC<BrushControlsProps> = ({
  settings,
  onSettingsChange,
  disabled = false,
}) => {
  const presetColors = [
    "#ff3333",
    "#ff6b35",
    "#f7931e",
    "#ffcd3c",
    "#c5e063",
    "#6bcf7f",
    "#4ecdc4",
    "#45b7d1",
    "#96ceb4",
    "#ffeaa7",
    "#fab1a0",
    "#fd79a8",
  ];

  return (
    <div className="space-y-6">
      {/* Brush Size */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Circle className="w-4 h-4 text-blue-500" />
            Brush Size
          </Label>
          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
            {settings.size}px
          </span>
        </div>
        <div className="relative">
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
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>5px</span>
            <span>100px</span>
          </div>
        </div>
      </div>

      {/* Brush Opacity */}
      {/* <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Square className="w-4 h-4 text-purple-500" />
            Opacity
          </Label>
          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
            {settings.opacity}%
          </span>
        </div>
        <div className="relative">
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
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>10%</span>
            <span>100%</span>
          </div>
        </div>
      </div> */}

      {/* Brush Color */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Palette className="w-4 h-4 text-pink-500" />
            Color
          </Label>
          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">
            {settings.color.toUpperCase()}
          </span>
        </div>

        {/* Color Presets */}
        <div className="grid grid-cols-6 gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              onClick={() => onSettingsChange({ ...settings, color })}
              disabled={disabled}
              className={`w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 ${
                settings.color === color
                  ? "border-gray-800 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Custom Color Picker */}
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={settings.color}
            onChange={(e) =>
              onSettingsChange({ ...settings, color: e.target.value })
            }
            disabled={disabled}
            className="w-8 h-8 rounded-lg border-2 border-gray-200 cursor-pointer disabled:cursor-not-allowed"
          />
          <span className="text-xs text-gray-500">Custom color</span>
        </div>

        <div className="text-xs text-gray-400 bg-blue-50 p-2 rounded-lg">
          💡 Display color only - mask will be white for AI processing
        </div>
      </div>

      {/* Brush Preview */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700">
          Live Preview
        </Label>
        <div className="relative h-20 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-gray-200 overflow-hidden">
          {/* Grid pattern background */}
          <div
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `
                   linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
                   linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
                   linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
                   linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
                 `,
              backgroundSize: "8px 8px",
              backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
            }}
          />

          {/* Brush preview */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="rounded-full shadow-lg transition-all duration-200"
              style={{
                width: `${Math.min(settings.size, 60)}px`,
                height: `${Math.min(settings.size, 60)}px`,
                backgroundColor: settings.color,
                opacity: settings.opacity / 100,
                transform: "scale(1)",
                animation: "pulse 2s infinite",
              }}
            />
          </div>

          {/* Size indicator */}
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            {settings.size}px
          </div>
        </div>
      </div>

      {/* Cursor Shape */}
      {/* <div className="space-y-3">
        <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
          <Paintbrush className="w-4 h-4 text-green-500" />
          Cursor Style
        </Label>

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(cursorShapes).map(([key, config]) => (
            <button
              key={key}
              onClick={() =>
                onSettingsChange({ ...settings, shape: key as CursorShape })
              }
              disabled={disabled}
              className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${
                settings.shape === key
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-200 hover:border-gray-300 bg-white"
              }`}
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-lg">{config.icon}</span>
                <span className="text-xs font-medium">{config.name}</span>
              </div>
            </button>
          ))}
        </div>
      </div> */}
    </div>
  );
};
