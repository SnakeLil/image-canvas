"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Upload,
  Settings,
  Download,
  RotateCcw,
  Wand2,
  Palette,
  Layers,
  Zap,
  X,
  ChevronDown,
  Image as ImageIcon,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CompactLayoutProps {
  children: React.ReactNode;
  onUpload?: (file: File) => void;
  onSettings?: () => void;
  onReset?: () => void;
  onDownload?: () => void;
  onProcess?: () => void;
  onBack?: () => void;
  isProcessing?: boolean;
  isAPIConfigured?: boolean;
  processedImageUrl?: string | null;
  imageInfo?: { name: string; width: number; height: number };
  brushControls?: React.ReactNode;
}

export const CompactLayout: React.FC<CompactLayoutProps> = ({
  children,
  onUpload,
  onSettings,
  onReset,
  onDownload,
  onProcess,
  onBack,
  isProcessing = false,
  isAPIConfigured = false,
  processedImageUrl,
  imageInfo,
  brushControls,
}) => {
  const [showBrushPanel, setShowBrushPanel] = useState(false);
  const [showLayersPanel, setShowLayersPanel] = useState(false);
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      onUpload(file);
    }
  };

  return (
    <div className="relative h-full flex flex-col transition-all duration-300 bg-slate-50">
      {/* 顶部紧凑工具栏 */}
      <div className="flex items-center justify-between px-4 py-2 border-b transition-colors bg-white border-slate-200">
        {/* 左侧：主要操作 */}
        <div className="flex items-center gap-2">
          {/* 返回按钮 */}
          {onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 px-3"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}

          {/* 上传按钮 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            className="h-8 px-3"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload
          </Button>

          {/* 隐藏的文件输入 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* 画笔设置 */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBrushPanel(!showBrushPanel)}
              className={cn(
                "h-8 px-3",
                showBrushPanel && "bg-blue-100 text-blue-700"
              )}
            >
              <Palette className="w-4 h-4 mr-2" />
              Brush
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>

            {/* 画笔设置弹窗 */}
            {showBrushPanel && (
              <Card className="absolute top-full left-0 mt-2 p-4 shadow-lg z-50 min-w-[300px] bg-white border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-slate-800">Brush Settings</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBrushPanel(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {brushControls}
              </Card>
            )}
          </div>

          {/* 图层面板 */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLayersPanel(!showLayersPanel)}
              className={cn(
                "h-8 px-3",
                showLayersPanel && "bg-blue-100 text-blue-700"
              )}
            >
              <Layers className="w-4 h-4 mr-2" />
              Layers
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>

            {/* 图层面板弹窗 */}
            {showLayersPanel && (
              <Card className="absolute top-full left-0 mt-2 p-4 shadow-lg z-50 min-w-[250px] bg-white border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-slate-800">Layers</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLayersPanel(false)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium">Original</span>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      Base
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-500 rounded opacity-60"></div>
                      <span className="text-sm font-medium">Mask</span>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-xs text-red-600 border-red-300"
                    >
                      Active
                    </Badge>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* 中间：图片信息 */}
        {imageInfo && (
          <div className="text-sm font-medium text-slate-700">
            {imageInfo.name} ({imageInfo.width}×{imageInfo.height})
          </div>
        )}

        {/* 右侧：状态和操作 */}
        <div className="flex items-center gap-2 py-1">
          {/* 状态指示 */}
          {!isAPIConfigured && (
            <Badge
              variant="outline"
              className="text-amber-600 border-amber-300 text-xs"
            >
              <Settings className="w-3 h-3 mr-1" />
              API
            </Badge>
          )}

          {isProcessing && (
            <Badge
              variant="outline"
              className="text-blue-600 border-blue-300 text-xs"
            >
              <Zap className="w-3 h-3 mr-1" />
              Processing
            </Badge>
          )}
          {processedImageUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownload}
              className="w-full my-auto h-8"
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          )}
          {/* 设置 */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettingsPanel(!showSettingsPanel)}
              className={cn(
                "h-8 w-8 p-0",
                showSettingsPanel && "bg-blue-100 text-blue-700"
              )}
            >
              <Settings className="w-4 h-4" />
            </Button>

            {/* 设置面板弹窗 */}
            {showSettingsPanel && (
              <Card className="absolute top-full right-0 mt-2 p-3 shadow-lg z-50 min-w-[200px] bg-white border-slate-200">
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSettings}
                    className="w-full justify-start h-8"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    API Settings
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReset}
                    className="w-full justify-start h-8"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    New Image
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* 主内容区域 - 最大化图片编辑空间 */}
      <div className="flex-1 relative overflow-hidden">{children}</div>

      {/* 底部按钮 */}
      <div className="flex items-center justify-center gap-4 p-3 border-t transition-colors bg-white border-slate-200">
        {!isAPIConfigured && (
          <p className="text-xs text-amber-600 ml-4">
            Configure API settings first
          </p>
        )}
      </div>

      {/* 点击外部关闭弹窗 */}
      {(showBrushPanel || showLayersPanel || showSettingsPanel) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowBrushPanel(false);
            setShowLayersPanel(false);
            setShowSettingsPanel(false);
          }}
        />
      )}
    </div>
  );
};
