'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  Download, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Eye,
  CheckCircle,
  AlertCircle,
  Clock,
  Image as ImageIcon,
  X,
  ChevronDown
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { InteractiveCanvasEditor } from './InteractiveCanvasEditor';
import { BrushControls } from './BrushControls';
import { type ImageData } from './ImageEditor';
import { cn } from '@/lib/utils';

export interface BatchImageData extends ImageData {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  processedUrl?: string;
  error?: string;
  progress?: number;
}

interface CompactBatchProcessorProps {
  onBack: () => void;
  apiConfig: {
    provider: string;
    baseUrl: string;
    apiKey: string;
  };
}

export const CompactBatchProcessor: React.FC<CompactBatchProcessorProps> = ({ onBack, apiConfig }) => {
  const [images, setImages] = useState<BatchImageData[]>([]);
  const [templateImage, setTemplateImage] = useState<ImageData | null>(null);
  const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentProcessingIndex, setCurrentProcessingIndex] = useState(-1);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showImageList, setShowImageList] = useState(false);
  const [showBrushPanel, setShowBrushPanel] = useState(false);
  const [brushSettings, setBrushSettings] = useState({
    size: 20,
    opacity: 100,
    color: "#ffffff",
    shape: "magic-wand" as const
  });
  
  const processingRef = useRef<{ shouldStop: boolean }>({ shouldStop: false });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 文件上传处理
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImagePromises: Promise<BatchImageData>[] = acceptedFiles.map((file, index) => {
      const url = URL.createObjectURL(file);
      return new Promise<BatchImageData>((resolve) => {
        const img = new Image();
        img.onload = () => {
          resolve({
            id: `${Date.now()}-${index}`,
            file,
            url,
            width: img.width,
            height: img.height,
            status: 'pending'
          });
        };
        img.src = url;
      });
    });

    Promise.all(newImagePromises).then((resolvedImages) => {
      console.log('CompactBatchProcessor: Images resolved:', resolvedImages);
      setImages(prev => [...prev, ...resolvedImages]);

      // 如果还没有模板图片，使用第一张作为模板
      if (!templateImage && resolvedImages.length > 0) {
        console.log('CompactBatchProcessor: Setting template image:', resolvedImages[0]);
        setTemplateImage(resolvedImages[0]);
      }
    });
  }, [templateImage]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp']
    },
    multiple: true
  });



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onDrop(files);
    }
  };

  // 设置蒙版模板
  const handleMaskCreated = useCallback((canvas: HTMLCanvasElement) => {
    const maskCopy = document.createElement('canvas');
    maskCopy.width = canvas.width;
    maskCopy.height = canvas.height;
    const ctx = maskCopy.getContext('2d');
    if (ctx) {
      ctx.drawImage(canvas, 0, 0);
    }
    setMaskCanvas(maskCopy);
  }, []);

  // 批量处理函数
  const startBatchProcessing = useCallback(async () => {
    if (!maskCanvas || images.length === 0) return;

    setIsProcessing(true);
    setIsPaused(false);
    processingRef.current.shouldStop = false;

    for (let i = 0; i < images.length; i++) {
      if (processingRef.current.shouldStop) break;

      const image = images[i];
      if (image.status === 'completed') continue;

      setCurrentProcessingIndex(i);
      
      setImages(prev => prev.map((img, index) => 
        index === i ? { ...img, status: 'processing' as const, progress: 0 } : img
      ));

      try {
        const adaptedMask = await adaptMaskToImage(maskCanvas, image);
        const result = await processImage(image, adaptedMask);
        
        setImages(prev => prev.map((img, index) => 
          index === i ? { 
            ...img, 
            status: 'completed' as const, 
            processedUrl: result,
            progress: 100 
          } : img
        ));

      } catch (error) {
        setImages(prev => prev.map((img, index) => 
          index === i ? { 
            ...img, 
            status: 'error' as const, 
            error: error instanceof Error ? error.message : 'Processing failed',
            progress: 0
          } : img
        ));
      }

      while (isPaused && !processingRef.current.shouldStop) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    setIsProcessing(false);
    setCurrentProcessingIndex(-1);
  }, [maskCanvas, images, isPaused]);

  // 适配蒙版到图片尺寸
  const adaptMaskToImage = async (templateMask: HTMLCanvasElement, targetImage: BatchImageData): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    canvas.width = targetImage.width;
    canvas.height = targetImage.height;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const scaleX = targetImage.width / templateMask.width;
    const scaleY = targetImage.height / templateMask.height;
    
    ctx.save();
    ctx.scale(scaleX, scaleY);
    ctx.drawImage(templateMask, 0, 0);
    ctx.restore();

    return canvas;
  };

  // 转换文件为base64的辅助函数
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

  // 处理单张图片
  const processImage = async (image: BatchImageData, mask: HTMLCanvasElement): Promise<string> => {
    // Check if IOPaint server URL is configured
    if (!apiConfig.baseUrl) {
      throw new Error('Please configure IOPaint server URL in settings');
    }

    // Create properly sized mask canvas matching image dimensions
    const maskCanvasForProvider = document.createElement('canvas');
    maskCanvasForProvider.width = image.width;
    maskCanvasForProvider.height = image.height;
    const maskCtx = maskCanvasForProvider.getContext('2d')!;

    // IOPaint expects: white = remove, black = keep
    // First, fill with black background (areas to keep)
    maskCtx.fillStyle = 'black';
    maskCtx.fillRect(0, 0, maskCanvasForProvider.width, maskCanvasForProvider.height);

    // Convert user's colored mask to white mask for IOPaint
    const scaleX = image.width / mask.width;
    const scaleY = image.height / mask.height;

    // Get the user's mask data
    const userMaskCtx = mask.getContext('2d')!;
    const userMaskData = userMaskCtx.getImageData(0, 0, mask.width, mask.height);

    // Create a white mask from the user's colored mask
    const whiteMaskCanvas = document.createElement('canvas');
    whiteMaskCanvas.width = mask.width;
    whiteMaskCanvas.height = mask.height;
    const whiteMaskCtx = whiteMaskCanvas.getContext('2d')!;

    // Convert any non-transparent pixels to white
    const whiteMaskData = whiteMaskCtx.createImageData(mask.width, mask.height);
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
    const imageBase64 = await convertToBase64(image.file);
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
      croper_height: image.height,
      croper_width: image.width,
      use_extender: false,
      extender_x: 0,
      extender_y: 0,
      extender_height: image.height,
      extender_width: image.width,
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

    // IOPaint directly returns image as blob
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  };

  // 批量下载
  const downloadAll = useCallback(() => {
    const completedImages = images.filter(img => img.status === 'completed' && img.processedUrl);
    
    if (completedImages.length === 0) {
      alert('No processed images to download');
      return;
    }
    
    completedImages.forEach((img, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.href = img.processedUrl!;
        link.download = `processed_${img.file.name}`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }, index * 100);
    });
  }, [images]);

  // 统计信息
  const stats = {
    total: images.length,
    pending: images.filter(img => img.status === 'pending').length,
    processing: images.filter(img => img.status === 'processing').length,
    completed: images.filter(img => img.status === 'completed').length,
    error: images.filter(img => img.status === 'error').length,
  };

  const overallProgress = stats.total > 0 ? ((stats.completed + stats.error) / stats.total) * 100 : 0;

  return (
    <div className={cn(
      "relative h-full flex flex-col transition-all duration-300",
      isFullscreen ? "bg-black" : "bg-slate-50"
    )}>
      {/* 紧凑工具栏 */}
      <div className={cn(
        "flex items-center justify-between px-4 py-2 border-b transition-colors",
        isFullscreen ? "bg-slate-900 border-slate-700" : "bg-white border-slate-200"
      )}>
        {/* 左侧操作 */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack} className="h-8">
            ← Single Mode
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-8"
          >
            <Upload className="w-4 h-4 mr-2" />
            Add Images
          </Button>

          {/* 画笔设置 */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBrushPanel(!showBrushPanel)}
              className={cn("h-8", showBrushPanel && "bg-blue-100")}
            >
              Brush <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
            
            {showBrushPanel && (
              <Card className="absolute top-full left-0 mt-2 p-4 shadow-lg z-50 min-w-[300px]">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Brush Settings</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowBrushPanel(false)} className="h-6 w-6 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <BrushControls
                  settings={brushSettings}
                  onSettingsChange={setBrushSettings}
                  disabled={isProcessing}
                />
              </Card>
            )}
          </div>

          {/* 图片列表 */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowImageList(!showImageList)}
              className={cn("h-8", showImageList && "bg-blue-100")}
            >
              Images ({stats.total}) <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
            
            {showImageList && (
              <Card className="absolute top-full left-0 mt-2 p-4 shadow-lg z-50 min-w-[400px] max-h-[400px] overflow-y-auto">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium">Images ({stats.total})</h3>
                  <Button variant="ghost" size="sm" onClick={() => setShowImageList(false)} className="h-6 w-6 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {images.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No images uploaded yet</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {images.map((image, index) => (
                      <div key={image.id} className="flex items-center gap-3 p-2 rounded border">
                        <img src={image.url} alt={image.file.name} className="w-10 h-10 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{image.file.name}</p>
                          <p className="text-xs text-slate-500">{image.width} × {image.height}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          {image.status === 'pending' && <Clock className="w-4 h-4 text-slate-400" />}
                          {image.status === 'processing' && <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                          {image.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
                          {image.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* 中间：进度信息 */}
        {stats.total > 0 && (
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">{Math.round(overallProgress)}%</span>
              <span className="text-slate-500 ml-2">
                {stats.completed}/{stats.total} completed
              </span>
            </div>
            {isProcessing && (
              <div className="w-32">
                <Progress value={overallProgress} className="h-2" />
              </div>
            )}
          </div>
        )}

        {/* 右侧：主要操作 */}
        <div className="flex items-center gap-2">
          {!isProcessing && maskCanvas && stats.total > 0 && (
            <Button onClick={startBatchProcessing} size="sm" className="h-8">
              <Play className="w-4 h-4 mr-2" />
              Start Processing
            </Button>
          )}
          
          {stats.completed > 0 && (
            <Button onClick={downloadAll} variant="outline" size="sm" className="h-8">
              <Download className="w-4 h-4 mr-2" />
              Download All
            </Button>
          )}
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 relative overflow-hidden">
        {!templateImage ? (
          /* 上传区域 */
          <div className="h-full flex items-center justify-center p-8">
            <div
              {...getRootProps()}
              className={cn(
                "border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors max-w-md",
                isDragActive ? "border-blue-500 bg-blue-50" : "border-slate-300 hover:border-slate-400"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="w-16 h-16 mx-auto mb-4 text-slate-400" />
              <h3 className="text-lg font-medium text-slate-700 mb-2">
                {isDragActive ? 'Drop images here...' : 'Upload Images for Batch Processing'}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                Drag & drop multiple images or click to select
              </p>
              <Button type="button">
                Choose Files
              </Button>
            </div>
          </div>
        ) : (
          /* 蒙版设计区域 */
          <div className="h-full">
            <InteractiveCanvasEditor
              imageData={templateImage}
              onMaskChange={handleMaskCreated}
              onProcess={(maskCanvas) => {
                // 在批量处理中，Process按钮用于设置蒙版模板
                handleMaskCreated(maskCanvas);
              }}
              disabled={isProcessing}

              brushSettings={brushSettings}
              isProcessing={isProcessing}
              isAPIConfigured={!!apiConfig.baseUrl}
            />
          </div>
        )}
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* 预览模态框 */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Preview Result</h3>
              <Button variant="outline" onClick={() => setShowPreview(null)}>Close</Button>
            </div>
            <img src={showPreview} alt="Processed result" className="max-w-full h-auto" />
          </div>
        </div>
      )}

      {/* 点击外部关闭弹窗 */}
      {(showBrushPanel || showImageList) && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowBrushPanel(false);
            setShowImageList(false);
          }}
        />
      )}
    </div>
  );
};
