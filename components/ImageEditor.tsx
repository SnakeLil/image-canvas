'use client';

import React, { useState, useCallback } from 'react';
import { ImageUpload } from './ImageUpload';
import { CanvasEditor } from './CanvasEditor';
import { ProcessingModal } from './ProcessingModal';
import { APIConfigModal } from './APIConfigModal';
import { Card } from '@/components/ui/card';
import { type AIProvider } from '@/lib/ai-services';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

export interface ImageData {
  file: File;
  url: string;
  width: number;
  height: number;
}

export const ImageEditor: React.FC = () => {
  const [imageData, setImageData] = useState<ImageData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImageUrl, setProcessedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAPIConfig, setShowAPIConfig] = useState(false);
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

      // Then draw the user's white painted areas (areas to remove)
      const scaleX = imageData.width / maskCanvas.width;
      const scaleY = imageData.height / maskCanvas.height;
      maskCtx.save();
      maskCtx.scale(scaleX, scaleY);
      // Use 'source-over' to ensure white areas are drawn on top of black background
      maskCtx.globalCompositeOperation = 'source-over';
      maskCtx.drawImage(maskCanvas, 0, 0);
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

  return (
    <div className="w-full">
      {!imageData ? (
        <ImageUpload onImageUpload={handleImageUpload} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-800">Edit Your Image</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAPIConfig(true)}
                className="border-blue-300 text-blue-700 hover:bg-blue-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                API Settings
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Upload New Image
              </Button>
            </div>
          </div>

          {/* API Configuration Status */}
          {!isAPIConfigured && (
            <Card className="p-4 bg-amber-50 border-amber-200 shadow-sm">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-amber-600" />
                <p className="text-amber-700">
                  Please configure an AI provider to use the magic eraser feature.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAPIConfig(true)}
                  className="ml-auto border-amber-300 text-amber-700 hover:bg-amber-100"
                >
                  Configure Now
                </Button>
              </div>
            </Card>
          )}

          {error && (
            <Card className="p-4 bg-red-50 border-red-200 shadow-sm">
              <p className="text-red-700">{error}</p>
            </Card>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-800">Original Image</h3>
              <CanvasEditor
                imageData={imageData}
                onProcessImage={handleProcessImage}
                disabled={isProcessing}
              />
            </div>

            {(processedImageUrl || isProcessing) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-800">Processed Image</h3>
                <Card className="p-4 bg-white border-gray-200 shadow-sm">
                  <div className="aspect-[4/3] bg-gray-50 rounded-lg flex items-center justify-center">
                    {isProcessing ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-gray-600">Processing image...</p>
                      </div>
                    ) : processedImageUrl ? (
                      <img
                        src={processedImageUrl}
                        alt="Processed"
                        className="max-w-full max-h-full object-contain rounded-lg"
                      />
                    ) : null}
                  </div>

                  {processedImageUrl && (
                    <div className="mt-4 flex justify-center">
                      <a
                        href={processedImageUrl}
                        download="processed-image.png"
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm"
                      >
                        Download Image
                      </a>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>
      )}

      <ProcessingModal isOpen={isProcessing} />
      <APIConfigModal
        isOpen={showAPIConfig}
        onClose={() => setShowAPIConfig(false)}
        config={apiConfig}
        onConfigChange={setApiConfig}
      />
    </div>
  );
};