'use client';

import React, { useState, useCallback } from 'react';
import { ImageUpload } from './ImageUpload';
import { CanvasEditor } from './CanvasEditor';
import { ProcessingModal } from './ProcessingModal';
import { APIConfigModal } from './APIConfigModal';
import { Card } from '@/components/ui/card';
import { createInpaintingService, type InpaintingRequest } from '@/lib/ai-services';
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
    provider: 'replicate' as 'replicate' | 'huggingface' | 'local',
    apiKey: '',
    baseUrl: 'http://localhost:8000'
  });

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

  const handleProcessImage = useCallback(async (maskCanvas: HTMLCanvasElement) => {
    if (!imageData) return;

    // Check if API is configured
    if (apiConfig.provider !== 'local' && !apiConfig.apiKey) {
      setError('Please configure your API key in settings');
      setShowAPIConfig(true);
      return;
    }
    setIsProcessing(true);
    setError(null);

    try {
      // Convert mask canvas to blob (white areas = keep, black areas = remove)
      const maskBlob = await new Promise<Blob>((resolve) => {
        // Create inverted mask for inpainting (black = areas to inpaint)
        const invertedCanvas = document.createElement('canvas');
        invertedCanvas.width = maskCanvas.width;
        invertedCanvas.height = maskCanvas.height;
        const invertedCtx = invertedCanvas.getContext('2d')!;
        
        // Fill with white background
        invertedCtx.fillStyle = 'white';
        invertedCtx.fillRect(0, 0, invertedCanvas.width, invertedCanvas.height);
        
        // Draw original mask in black
        invertedCtx.globalCompositeOperation = 'source-over';
        invertedCtx.fillStyle = 'black';
        const originalImageData = maskCanvas.getContext('2d')!.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
        const data = originalImageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 0) { // If alpha > 0 (painted area)
            const x = (i / 4) % maskCanvas.width;
            const y = Math.floor((i / 4) / maskCanvas.width);
            invertedCtx.fillRect(x, y, 1, 1);
          }
        }
        
        invertedCanvas.toBlob((blob) => resolve(blob!), 'image/png');
      });

      // Create inpainting service
      const inpaintingService = createInpaintingService();
      
      // Prepare request
      const request: InpaintingRequest = {
        image: imageData.file,
        mask: maskBlob,
        prompt: "high quality, photorealistic, seamless"
      };

      // Process image
      const result = await inpaintingService.removeObjects(request, apiConfig.provider, {
        apiKey: apiConfig.apiKey,
        baseUrl: apiConfig.baseUrl
      });
      
      if (result.success && result.imageUrl) {
        setProcessedImageUrl(result.imageUrl);
      } else {
        throw new Error(result.error || 'Failed to process image');
      }
      
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
            <h2 className="text-xl font-semibold">Edit Your Image</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAPIConfig(true)}
                className="border-gray-600 hover:border-gray-500"
              >
                <Settings className="w-4 h-4 mr-2" />
                API Settings
              </Button>
              <Button
                variant="outline"
                onClick={handleReset}
                className="border-gray-600 hover:border-gray-500"
              >
                Upload New Image
              </Button>
            </div>
          </div>

          {error && (
            <Card className="p-4 bg-red-500/10 border-red-500/20">
              <p className="text-red-400">{error}</p>
            </Card>
          )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Original Image</h3>
              <CanvasEditor
                imageData={imageData}
                onProcessImage={handleProcessImage}
                disabled={isProcessing}
              />
            </div>

            {(processedImageUrl || isProcessing) && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Processed Image</h3>
                <Card className="p-4 bg-gray-800/50 border-gray-700">
                  <div className="aspect-[4/3] bg-gray-700/30 rounded-lg flex items-center justify-center">
                    {isProcessing ? (
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                        <p className="text-gray-400">Processing image...</p>
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
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
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