'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Image as ImageIcon, 
  Images, 
  Zap, 
  Clock, 
  CheckCircle,
  Download
} from 'lucide-react';

export type ProcessingMode = 'single' | 'batch';

interface CompactModeSelectorProps {
  currentMode: ProcessingMode;
  onModeChange: (mode: ProcessingMode) => void;
}

export const CompactModeSelector: React.FC<CompactModeSelectorProps> = ({ 
  currentMode, 
  onModeChange 
}) => {
  return (
    <div className="space-y-4">
      {/* 紧凑的模式选择器 */}
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Magic Eraser</h2>
            <p className="text-sm text-slate-600">Choose your processing mode</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Select value={currentMode} onValueChange={onModeChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-500" />
                    <span>Single Image</span>
                  </div>
                </SelectItem>
                <SelectItem value="batch">
                  <div className="flex items-center gap-2">
                    <Images className="w-4 h-4 text-purple-500" />
                    <span>Batch Processing</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* 模式信息卡片 */}
      <Card className={`p-4 transition-colors ${
        currentMode === 'single' 
          ? 'bg-blue-50 border-blue-200' 
          : 'bg-purple-50 border-purple-200'
      }`}>
        {currentMode === 'single' ? (
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <ImageIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-blue-900 mb-2">Single Image Mode</h3>
              <p className="text-sm text-blue-700 mb-3">
                Upload one image, design your mask with precision, and get instant results. 
                Perfect for detailed editing and when you need to see immediate feedback.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                  <Zap className="w-3 h-3 mr-1" />
                  Real-time editing
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                  <Clock className="w-3 h-3 mr-1" />
                  Immediate results
                </Badge>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-300">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Precision editing
                </Badge>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <div className="p-2 bg-purple-500 rounded-lg">
              <Images className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-purple-900 mb-2">Batch Processing Mode</h3>
              <p className="text-sm text-purple-700 mb-3">
                Upload multiple images, create a mask template, and process them all automatically. 
                Great for applying the same edits to many images efficiently.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300">
                  <Images className="w-3 h-3 mr-1" />
                  Multiple images
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300">
                  <Clock className="w-3 h-3 mr-1" />
                  Automated queue
                </Badge>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-300">
                  <Download className="w-3 h-3 mr-1" />
                  Bulk download
                </Badge>
              </div>
              <div className="mt-2 text-xs text-purple-600">
                <strong>How it works:</strong> Design your mask on the first image, then we'll apply it to all images in the batch.
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

// 简化的模式介绍组件，用于其他地方
export const SimpleModeInfo: React.FC<{ mode: ProcessingMode }> = ({ mode }) => {
  if (mode === 'single') {
    return (
      <div className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-3 py-2 rounded-lg">
        <ImageIcon className="w-4 h-4" />
        <span>Single image mode - Real-time editing with immediate results</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-sm text-purple-700 bg-purple-50 px-3 py-2 rounded-lg">
      <Images className="w-4 h-4" />
      <span>Batch mode - Process multiple images with one mask template</span>
    </div>
  );
};
