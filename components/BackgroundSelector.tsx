"use client";

import React, { useState, useRef, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Upload, Plus, Search } from "lucide-react";
import { imageToBase64, imageUrlToBase64 } from "@/lib/background-removal";

interface BackgroundSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectColor: (color: string) => void;
  onSelectImage: (imageUrl: string) => void;
  originalImageUrl?: string;
  disabled?: boolean;
}

// 预设背景图片
const PRESET_BACKGROUNDS = [
  "https://images.pexels.com/photos/31559069/pexels-photo-31559069.jpeg?auto=compress&cs=tinysrgb&w=600&loading=lazy",
  "https://images.pexels.com/photos/32423725/pexels-photo-32423725.jpeg?auto=compress&cs=tinysrgb&w=600&loading=lazy",
  "https://images.pexels.com/photos/33060985/pexels-photo-33060985.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
  "https://images.pexels.com/photos/32583181/pexels-photo-32583181.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
  "https://images.pexels.com/videos/27722640/brush-evening-forest-lake-27722640.jpeg?auto=compress&cs=tinysrgb&w=600&loading=lazy",
  "https://images.pexels.com/videos/29845543/pexels-photo-29845543.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
  "https://images.pexels.com/photos/33148690/pexels-photo-33148690.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
  "https://images.pexels.com/photos/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1366957/pexels-photo-1366957.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1323712/pexels-photo-1323712.jpeg?auto=compress&cs=tinysrgb&w=600",
  "https://images.pexels.com/photos/1366630/pexels-photo-1366630.jpeg?auto=compress&cs=tinysrgb&w=600",
];

// 预设颜色
const PRESET_COLORS = [
  "#ffffff",
  "#000000",
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
  "#f43f5e",
  "#6b7280",
  "#374151",
  "#1f2937",
];

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  isOpen,
  onClose,
  onSelectColor,
  onSelectImage,
  originalImageUrl,
  disabled = false,
}) => {
  const [activeTab, setActiveTab] = useState<"photo" | "color">("photo");
  const [customColor, setCustomColor] = useState("#ffffff");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件上传
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      try {
        const newImages: string[] = [];
        for (const file of Array.from(files)) {
          if (file.type.startsWith("image/")) {
            const url = URL.createObjectURL(file);
            newImages.push(url);
          }
        }
        setUploadedImages((prev) => [...prev, ...newImages]);
      } catch (error) {
        console.error("Error uploading images:", error);
      }
    },
    []
  );

  // 处理颜色选择
  const handleColorSelect = useCallback(
    (color: string) => {
      onSelectColor(color);
      onClose();
    },
    [onSelectColor, onClose]
  );

  // 处理图片选择
  const handleImageSelect = useCallback(
    (imageUrl: string) => {
      onSelectImage(imageUrl);
      onClose();
    },
    [onSelectImage, onClose]
  );

  // 过滤背景图片
  const filteredBackgrounds = PRESET_BACKGROUNDS.filter(
    (url) =>
      searchQuery === "" ||
      url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">Choose Background</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 h-6 w-6 p-0"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as "photo" | "color")}
        className="w-full"
      >
        <div className="w-full px-2">
          <TabsList className="grid w-full grid-cols-2  mt-2">
            <TabsTrigger value="photo" className="text-xs font-medium">
              Photo
            </TabsTrigger>
            <TabsTrigger value="color" className="text-xs font-medium">
              Color
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Photo Tab */}
        <TabsContent value="photo" className="p-4 pt-2">
          {/* Search Bar */}
          <div className="relative mb-3">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3" />
            <Input
              type="text"
              placeholder="Search backgrounds..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-7 bg-gray-50 border-gray-200 text-xs h-10"
            />
          </div>

          {/* Content Area */}
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-3 gap-2">
              {/* Upload Button */}
              <div className="aspect-square">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  className="w-full h-full border-2 border-dashed border-gray-300 rounded hover:border-gray-400 transition-colors flex flex-col items-center justify-center text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4 mb-1" />
                  <span className="text-xs text-center">Upload</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Original Image (if available) */}
              {originalImageUrl && (
                <div className="aspect-square">
                  <button
                    onClick={() => handleImageSelect(originalImageUrl)}
                    disabled={disabled}
                    className="w-full h-full rounded overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <img
                      src={originalImageUrl}
                      alt="Original"
                      className="w-full h-full object-cover"
                    />
                  </button>
                </div>
              )}

              {/* Uploaded Images */}
              {uploadedImages.map((imageUrl, index) => (
                <div key={`uploaded-${index}`} className="aspect-square">
                  <button
                    onClick={() => handleImageSelect(imageUrl)}
                    disabled={disabled}
                    className="w-full h-full rounded overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <img
                      src={imageUrl}
                      alt={`Uploaded ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                </div>
              ))}

              {/* Preset Background Images */}
              {filteredBackgrounds.map((imageUrl, index) => (
                <div key={`preset-${index}`} className="aspect-square">
                  <button
                    onClick={() => handleImageSelect(imageUrl)}
                    disabled={disabled}
                    className="w-full h-full rounded overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <img
                      src={imageUrl}
                      alt={`Background ${index + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Color Tab */}
        <TabsContent value="color" className="p-4 pt-2">
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {/* Custom Color Picker */}
            <div className="mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <input
                    type="color"
                    value={customColor}
                    onChange={(e) => setCustomColor(e.target.value)}
                    className="w-10 h-10 rounded border-2 border-gray-200 cursor-pointer"
                  />
                  <div className="absolute inset-0 rounded bg-gradient-to-br from-red-500 to-purple-500 opacity-20 pointer-events-none"></div>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-700 mb-1">
                    Custom Color
                  </p>
                  <p className="text-xs text-gray-500">Click to choose</p>
                </div>
                <Button
                  onClick={() => handleColorSelect(customColor)}
                  disabled={disabled}
                  size="sm"
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs h-7 px-3"
                >
                  Apply
                </Button>
              </div>
            </div>

            {/* Preset Colors */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-2">
                Preset Colors
              </p>
              <div className="grid grid-cols-4 gap-2">
                {/* Transparent/Remove option */}
                <button
                  onClick={() => handleColorSelect("transparent")}
                  disabled={disabled}
                  className="aspect-square rounded border-2 border-gray-300 hover:border-gray-400 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove background"
                >
                  <div className="w-5 h-5 rounded-full border-2 border-gray-400 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-4 h-0.5 bg-red-500 rotate-45"></div>
                    </div>
                  </div>
                </button>

                {/* Preset color buttons */}
                {PRESET_COLORS.map((color, index) => (
                  <button
                    key={color}
                    onClick={() => handleColorSelect(color)}
                    disabled={disabled}
                    className="aspect-square rounded border-2 border-gray-200 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
