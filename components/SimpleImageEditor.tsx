'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ImageUpload } from './ImageUpload';
import { InteractiveCanvasEditor } from './InteractiveCanvasEditor';
import { CompactLayout } from './CompactLayout';
import { BrushControls } from './BrushControls';
import { ProcessingModal } from './ProcessingModal';
import { APIConfigModal } from './APIConfigModal';
import { CompactModeSelector, type ProcessingMode } from './CompactModeSelector';
import { CompactBatchProcessor } from './CompactBatchProcessor';
import { type AIProvider } from '@/lib/ai-services';

export interface ImageData {
  file: File;
  url: string;
  width: number;
  height: number;
}

export const SimpleImageEditor: React.FC = () => {
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('single');
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [showAPIConfig, setShowAPIConfig] = useState(false);

  const [brushSettings, setBrushSettings] = useState<{
    size: number;
    opacity: number;
    color: string;
    shape: import('./MagicCursor').CursorShape;
  }>({
    size: 20,
    opacity: 100,
    color: "#ffffff",
    shape: "magic-wand"
  });

  // 用于获取蒙版画布的ref
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [apiConfig, setApiConfig] = useState({
    provider: 'iopaint' as AIProvider,
    apiKey: '',
    baseUrl: 'http://127.0.0.1:8080'
  });

  // Show API config modal on first load if no API is configured
  const [hasShownInitialConfig, setHasShownInitialConfig] = useState(false);

  // Check if API is configured (IOPaint doesn't need API key, just check baseUrl)
  const isAPIConfigured = !!apiConfig.baseUrl;

  const handleBrushSettingsChange = useCallback((settings: {
    size: number;
    opacity: number;
    color: string;
    shape: import('./MagicCursor').CursorShape;
  }) => {
    setBrushSettings(settings);
  }, []);



  // 调试用：监控imageData变化
  useEffect(() => {
    console.log('🔥 imageData state changed:', imageData);
  }, [imageData]);



  // Show config modal on first load if not configured
  React.useEffect(() => {
    if (!hasShownInitialConfig && !isAPIConfigured) {
      setShowAPIConfig(true);
      setHasShownInitialConfig(true);
    }
  }, [hasShownInitialConfig, isAPIConfigured]);

  const handleImageUpload = useCallback((file: File) => {
    console.log('🔥 handleImageUpload called with file:', file.name, file.size);

    // 立即清除之前的状态
    setProcessedImageUrl(null);

    const url = URL.createObjectURL(file);
    console.log('🔥 Created object URL:', url);

    const img = new Image();
    img.onload = () => {
      console.log('🔥 Image loaded successfully:', { width: img.width, height: img.height });
      const newImageData = {
        file,
        url,
        width: img.width,
        height: img.height
      };
      console.log('🔥 About to set imageData:', newImageData);

      // 直接设置状态
      setImageData(newImageData);
      console.log('🔥 setImageData called');
    };
    img.onerror = (error) => {
      console.error('🔥 Image load error:', error);
    };
    img.src = url;
    console.log('🔥 Image src set, waiting for load...');
  }, []);

  // 转换文件为base64的辅助函数
  const convertToBase64 = useCallback((fileOrBlob: File | Blob): Promise<string> => {
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
  }, []);

  const handleProcessImage = useCallback(async (maskCanvas: HTMLCanvasElement) => {
    if (!imageData) return;

    // Check if IOPaint server URL is configured
    if (!apiConfig.baseUrl) {
      console.error('Please configure IOPaint server URL in settings');
      return;
    }
    setIsProcessing(true);

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
        console.error('API Error Response:', errorText);
        throw new Error(`Processing failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // IOPaint返回处理后的图片blob
      const blob = await response.blob();
      const processedUrl = URL.createObjectURL(blob);

      console.log('Image processed successfully:', processedUrl);
      setProcessedImageUrl(processedUrl);

    } catch (err) {
      console.error('Processing error:', err);
      // 可以在这里添加错误提示UI
      alert(`Processing failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  }, [imageData, apiConfig, convertToBase64]);

  // 处理图片的函数，从InteractiveCanvasEditor获取蒙版
  const handleProcessClick = useCallback(() => {
    if (maskCanvasRef.current) {
      handleProcessImage(maskCanvasRef.current);
    }
  }, []);

  const handleReset = useCallback(() => {
    setImageData(null);
    setProcessedImageUrl(null);
  }, []);

  const handleBackToModeSelection = useCallback(() => {
    setImageData(null);
    setProcessedImageUrl(null);
    // 这将触发显示模式选择界面
  }, []);



  // 批量处理模式
  if (processingMode === 'batch') {
    return (
      <div className="h-full">
        <CompactBatchProcessor
          onBack={() => setProcessingMode('single')}
          apiConfig={apiConfig}
        />
      </div>
    );
  }

  // 单张处理模式
  if (processingMode === 'single') {
    // 如果没有选择图片，显示模式选择和上传界面
    if (!imageData) {
      return (
        <div className="h-full flex flex-col">
          {/* 模式选择 */}
          <div className="p-6">
            <CompactModeSelector
              currentMode={processingMode}
              onModeChange={setProcessingMode}
            />
          </div>

          {/* 上传区域 */}
          <div className="flex-1 flex items-center justify-center p-6">
            <ImageUpload onImageUpload={handleImageUpload} />
          </div>
        </div>
      );
    }

    // 有图片时，显示编辑界面
    return (
      <div className="h-full">
        <CompactLayout
          onUpload={handleImageUpload}
          onSettings={() => setShowAPIConfig(true)}
          onReset={handleReset}
          onBack={handleBackToModeSelection}
          onDownload={() => {
            if (processedImageUrl) {
              const link = document.createElement('a');
              link.href = processedImageUrl;
              link.download = 'processed-image.png';
              link.click();
            }
          }}
          onProcess={handleProcessClick}
          isProcessing={isProcessing}
          isAPIConfigured={isAPIConfigured}
          processedImageUrl={processedImageUrl}
        imageInfo={imageData ? {
          name: imageData.file.name,
          width: imageData.width,
          height: imageData.height
        } : undefined}
        brushControls={
          <BrushControls
            settings={brushSettings}
            onSettingsChange={handleBrushSettingsChange}
            disabled={isProcessing}
          />
        }
      >
        {/* 交互式画布编辑器 */}
        {imageData && (
          <InteractiveCanvasEditor
            imageData={imageData}
            onMaskChange={handleProcessImage}
            onProcess={(maskCanvas) => {
              handleProcessImage(maskCanvas);
            }}
            disabled={isProcessing}
            brushSettings={brushSettings}
            processedImageUrl={processedImageUrl}
            isProcessing={isProcessing}
            isAPIConfigured={isAPIConfigured}
            maskCanvasRef={maskCanvasRef}
          />
        )}
      </CompactLayout>

        {/* 模态框 */}
        <ProcessingModal isOpen={isProcessing} />
        <APIConfigModal
          isOpen={showAPIConfig}
          onClose={() => setShowAPIConfig(false)}
          config={apiConfig}
          onConfigChange={setApiConfig}
        />
      </div>
    );
  }

  // 默认返回（不应该到达这里）
  return null;
};
