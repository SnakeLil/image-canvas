'use client';

import React, { useState, useCallback } from 'react';
import { ImageUpload } from './ImageUpload';
import { InteractiveCanvasEditor } from './InteractiveCanvasEditor';
import { OptimizedCanvas } from './OptimizedCanvas';
import { OptimizedLayout, ToolBar, StatusBar } from './OptimizedLayout';
import { ProcessingModal } from './ProcessingModal';
import { APIConfigModal } from './APIConfigModal';
import { BatchProcessor } from './BatchProcessor';
import { BrushControls } from './BrushControls';
import { ModeSelector, ModeIntroduction, type ProcessingMode } from './ModeSelector';
import { Card } from '@/components/ui/card';
import { type AIProvider } from '@/lib/ai-services';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Download,
  RotateCcw,
  Wand2,
  Image as ImageIcon,
  Layers,
  Palette,
  Zap
} from 'lucide-react';

export interface ImageData {
  file: File;
  url: string;
  width: number;
  height: number;
}

export const ImageEditor: React.FC = () => {
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('single');
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAPIConfig, setShowAPIConfig] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [brushSettings, setBrushSettings] = useState({
    size: 20,
    opacity: 100,
    color: "#ffffff",
    shape: "magic-wand" as const
  });
  const [apiConfig, setApiConfig] = useState({
    provider: 'iopaint' as AIProvider,
    apiKey: '',
    baseUrl: 'http://127.0.0.1:8080'
  });

  // Show API config modal on first load if no API is configured
  const [hasShownInitialConfig, setHasShownInitialConfig] = useState(false);

  // Check if API is configured (IOPaint doesn't need API key, just check baseUrl)
  const isAPIConfigured = !!apiConfig.baseUrl;

  // Show config modal on first load if not configured
  React.useEffect(() => {
    if (!hasShownInitialConfig && !isAPIConfigured) {
      setShowAPIConfig(true);
      setHasShownInitialConfig(true);
    }
  }, [hasShownInitialConfig, isAPIConfigured]);

  const handleImageUpload = useCallback((file: File) => {
    setError(null);
    setProcessedImageUrl(null);
    
    const url = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = () => {
      setImageData({
        file,
        url,
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
    
    img.onerror = () => {
      setError('Failed to load image. Please try a different file.');
    };
    
    img.src = url;
  }, []);

  // Helper function to convert File/Blob to base64 (IOPaint format)
  const convertToBase64 = (fileOrBlob: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        resolve(base64String);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(fileOrBlob);
    });
  };

  const handleProcessImage = useCallback(async (maskCanvas: HTMLCanvasElement) => {
    if (!imageData) return;

    // Check if IOPaint server URL is configured
    if (!apiConfig.baseUrl) {
      setError('Please configure IOPaint server URL in settings');
      setShowAPIConfig(true);
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      // Create properly sized mask canvas matching image dimensions
      const maskCanvasForProvider = document.createElement('canvas');
      maskCanvasForProvider.width = imageData.width;
      maskCanvasForProvider.height = imageData.height;
      const maskCtx = maskCanvasForProvider.getContext('2d')!;

      // IOPaint expects: white = remove, black = keep
      // First, fill with black background (areas to keep)
      maskCtx.fillStyle = 'black';
      maskCtx.fillRect(0, 0, maskCanvasForProvider.width, maskCanvasForProvider.height);

      // Convert user's colored mask to white mask for IOPaint
      const scaleX = imageData.width / maskCanvas.width;
      const scaleY = imageData.height / maskCanvas.height;

      // Get the user's mask data
      const userMaskCtx = maskCanvas.getContext('2d')!;
      const userMaskData = userMaskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);

      // Create a white mask from the user's colored mask
      const whiteMaskCanvas = document.createElement('canvas');
      whiteMaskCanvas.width = maskCanvas.width;
      whiteMaskCanvas.height = maskCanvas.height;
      const whiteMaskCtx = whiteMaskCanvas.getContext('2d')!;

      // Convert any non-transparent pixels to white
      const whiteMaskData = whiteMaskCtx.createImageData(maskCanvas.width, maskCanvas.height);
      for (let i = 0; i < userMaskData.data.length; i += 4) {
        const alpha = userMaskData.data[i + 3];
        if (alpha > 0) {
          // Convert to white with same alpha
          whiteMaskData.data[i] = 255;     // R
          whiteMaskData.data[i + 1] = 255; // G
          whiteMaskData.data[i + 2] = 255; // B
          whiteMaskData.data[i + 3] = alpha; // A
        } else {
          // Keep transparent
          whiteMaskData.data[i] = 0;
          whiteMaskData.data[i + 1] = 0;
          whiteMaskData.data[i + 2] = 0;
          whiteMaskData.data[i + 3] = 0;
        }
      }
      whiteMaskCtx.putImageData(whiteMaskData, 0, 0);

      // Now draw the white mask to the IOPaint canvas
      maskCtx.save();
      maskCtx.scale(scaleX, scaleY);
      maskCtx.globalCompositeOperation = 'source-over';
      maskCtx.drawImage(whiteMaskCanvas, 0, 0);
      maskCtx.restore();

      // Convert image and mask to base64 (IOPaint format)
      const imageBase64 = await convertToBase64(imageData.file);
      const maskBlob = await new Promise<Blob>((resolve) => {
        maskCanvasForProvider.toBlob((blob) => resolve(blob!), 'image/png');
      });
      const maskBase64 = await convertToBase64(maskBlob);

      // Call IOPaint API directly using their format
      const requestBody = {
        image: imageBase64,
        mask: maskBase64,
        ldm_steps: 20,
        ldm_sampler: 'plms',
        hd_strategy: 'Crop',
        hd_strategy_crop_trigger_size: 800,
        hd_strategy_crop_margin: 128,
        hd_strategy_resize_limit: 1280,
        prompt: '',
        negative_prompt: '',
        use_croper: false,
        croper_x: 0,
        croper_y: 0,
        croper_height: imageData.height,
        croper_width: imageData.width,
        use_extender: false,
        extender_x: 0,
        extender_y: 0,
        extender_height: imageData.height,
        extender_width: imageData.width,
        sd_mask_blur: 12,
        sd_strength: 1.0,
        sd_steps: 50,
        sd_guidance_scale: 7.5,
        sd_sampler: 'DPM++ 2M',
        sd_seed: -1,
        sd_match_histograms: false,
        sd_lcm_lora: false,
        enable_controlnet: false,
        controlnet_conditioning_scale: 0.4,
        controlnet_method: '',
        enable_brushnet: false,
        brushnet_method: '',
        brushnet_conditioning_scale: 1.0,
        enable_powerpaint_v2: false,
        powerpaint_task: 'object-remove'
      };

      const response = await fetch(`${apiConfig.baseUrl}/api/v1/inpaint`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`IOPaint API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // IOPaint returns the image directly as blob
      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setProcessedImageUrl(imageUrl);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image. Please try again.');
      console.error('Processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  }, [imageData, apiConfig]);

  const handleReset = useCallback(() => {
    setImageData(null);
    setProcessedImageUrl(null);
    setError(null);
  }, []);

  // 如果没有选择图片，显示模式选择和上传界面
  if (!imageData && processingMode === 'single') {
    return (
      <div className="h-full flex flex-col">
        {/* 模式选择 */}
        <div className="p-6">
          <ModeSelector
            currentMode={processingMode}
            onModeChange={setProcessingMode}
          />
          <ModeIntroduction mode={processingMode} />
        </div>

        {/* 上传区域 */}
        <div className="flex-1 flex items-center justify-center p-6">
          <ImageUpload onImageUpload={handleImageUpload} />
        </div>
      </div>
    );
  }

  // 批量处理模式
  if (processingMode === 'batch') {
    return (
      <div className="h-full">
        <BatchProcessor
          onBack={() => setProcessingMode('single')}
          apiConfig={apiConfig}
        />
      </div>
    );
  }

  // 单张处理模式 - 使用优化布局
  return (
    <OptimizedLayout
      onFullscreen={setIsFullscreen}
      topBar={
        <ToolBar
          title="Magic Eraser"
          subtitle={imageData ? `${imageData.file.name} (${imageData.width}×${imageData.height})` : undefined}
          isFullscreen={isFullscreen}
          actions={
            <div className="flex items-center gap-2">
              {/* API配置状态 */}
              {!isAPIConfigured && (
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  <Settings className="w-3 h-3 mr-1" />
                  API Not Configured
                </Badge>
              )}

              {/* 处理状态 */}
              {isProcessing && (
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  <Zap className="w-3 h-3 mr-1" />
                  Processing...
                </Badge>
              )}

              {/* 操作按钮 */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAPIConfig(true)}
                className="h-8"
              >
                <Settings className="w-4 h-4 mr-2" />
                API Settings
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="h-8"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                New Image
              </Button>

              {processedImageUrl && (
                <Button
                  variant="default"
                  size="sm"
                  asChild
                  className="h-8"
                >
                  <a href={processedImageUrl} download="processed-image.png">
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </a>
                </Button>
              )}
            </div>
          }
        />
      }
      leftPanel={
        <div className="space-y-6">
          {/* 画笔控制 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-800">Brush Settings</h3>
            </div>
            <BrushControls
              settings={brushSettings}
              onSettingsChange={setBrushSettings}
              disabled={isProcessing}
            />
          </div>

          {/* 图层信息 */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-slate-600" />
              <h3 className="font-semibold text-slate-800">Layers</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  <span className="text-sm font-medium">Original</span>
                </div>
                <Badge variant="secondary" className="text-xs">Base</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded opacity-60"></div>
                  <span className="text-sm font-medium">Mask</span>
                </div>
                <Badge variant="outline" className="text-xs text-red-600 border-red-300">Active</Badge>
              </div>
            </div>
          </div>

          {/* 处理按钮 */}
          <div className="pt-4 border-t border-slate-200">
            <Button
              onClick={handleProcessImage}
              disabled={isProcessing || !isAPIConfigured}
              className="w-full h-12 text-base font-semibold"
              size="lg"
            >
              <Wand2 className="w-5 h-5 mr-2" />
              {isProcessing ? 'Processing...' : 'Remove Objects'}
            </Button>

            {!isAPIConfigured && (
              <p className="text-xs text-amber-600 mt-2 text-center">
                Configure API settings to enable processing
              </p>
            )}
          </div>
        </div>
      }
      bottomBar={
        <StatusBar
          zoom={zoom}
          imageSize={imageData ? { width: imageData.width, height: imageData.height } : undefined}
          isFullscreen={isFullscreen}
          onZoomChange={setZoom}
        />
      }
    >
      {/* 主画布区域 */}
      <div className="h-full flex">
        {/* 原图编辑区域 */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1">
            {imageData && (
              <InteractiveCanvasEditor
                imageData={imageData}
                onProcess={handleProcessImage}
                disabled={isProcessing}
                brushSettings={brushSettings}
                processedImageUrl={processedImageUrl}
                isProcessing={isProcessing}
                isAPIConfigured={!!apiConfig.apiKey}
                showResult={!!processedImageUrl}
              />
            )}
          </div>
        </div>

        {/* 结果预览区域 */}
        {(processedImageUrl || isProcessing) && (
          <div className="w-1/2 border-l border-slate-200 bg-white flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Processed Result
              </h3>
            </div>
            <div className="flex-1 p-4 flex items-center justify-center bg-slate-50">
              {isProcessing ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p className="text-slate-600 font-medium">Processing your image...</p>
                  <p className="text-slate-500 text-sm mt-1">This may take a few moments</p>
                </div>
              ) : processedImageUrl ? (
                <div className="max-w-full max-h-full flex items-center justify-center">
                  <img
                    src={processedImageUrl}
                    alt="Processed result"
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </OptimizedLayout>
  );
};