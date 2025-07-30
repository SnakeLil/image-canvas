"use client";

import React, { useState, useCallback, useMemo, useRef } from "react";
import { ImageUpload } from "./ImageUpload";
import { CanvasEditor } from "./CanvasEditor";
import { useImageProjectManager } from "./ImageProjectManager";
import type { MaskState } from "./MaskCanvas";

import { APIConfigModal } from "./APIConfigModal";
import { ToolPanel } from "./ToolPanel";
import { ImageThumbnails } from "./ImageThumbnails";
import { InstructionsModal } from "./InstructionsModal";
import { useInstructions } from "../hooks/useInstructions";
import { Card } from "@/components/ui/card";
import { type AIProvider } from "@/lib/ai-services";
import { removeBackground, blurBackground, adjustBlurIntensity, canvasToBase64, compositeWithBackground } from "@/lib/background-removal";
import { blobToBase64 } from "@/lib/image-utils";
import { DragOverlay } from "./DragOverlay";

export interface ImageData {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
  name: string;
  thumbnail?: string;
}

export const BASE_URL = 'https://faith1314666-imggen-magic-wand.hf.space'

export const ImageEditor: React.FC = () => {
  const {
    project,
    getCurrentImage,
    getCurrentProcessedUrl,
    getCurrentMaskState,
    getCurrentHistoryState,
    getCurrentProcessingState,
    getCurrentBackgroundRemovedUrl,
    getCurrentOriginalBackgroundRemovedUrl,
    getCurrentBackgroundProcessingState,
    getCurrentBackgroundBlurredUrl,
    getCurrentBackgroundBlurProcessingState,
    getCurrentBackgroundBlurData,
    getCurrentFinalResult,
    setImageProcessingState,
    setImageBackgroundProcessingState,
    setImageBackgroundBlurProcessingState,
    addImage,
    addImages,
    removeImage,
    selectImage,
    saveMaskState,
    saveHistoryState,
    setProcessedResult,
    setBackgroundRemovedResult,
    setBackgroundBlurredResult,
    setBackgroundBlurData,
    replaceBackground,
    clearAllResults,
  } = useImageProjectManager();

  const [error, setError] = useState<string | null>(null);
  const [showAPIConfig, setShowAPIConfig] = useState(false);
  const [apiConfig, setApiConfig] = useState({
    provider: "iopaint" as AIProvider,
    apiKey: "",
    baseUrl: BASE_URL,
  });
  const [brushSettings, setBrushSettings] = useState({
    size: 20,
    opacity: 100,
    color: "#ff3333",
    shape: "circle" as import("./MagicCursor").CursorShape,
  });

  // Memoize brushSettings to prevent unnecessary re-renders
  const memoizedBrushSettings = useMemo(() => ({
    size: brushSettings.size,
    opacity: brushSettings.opacity,
    color: brushSettings.color,
    shape: brushSettings.shape,
  }), [
    brushSettings.size,
    brushSettings.opacity,
    brushSettings.color,
    brushSettings.shape,
  ]);

  // Global drag and drop state
  const [isGlobalDragOver, setIsGlobalDragOver] = useState(false);




  // Instructions state
  const {
    showInstructions,
    hideInstructions,
    showInstructionsAgain,
    showInstructionsIfFirstTime,
  } = useInstructions();
  const finalResult = getCurrentFinalResult();
  const finalUrl = finalResult?.url;

  const handleImageUpload = useCallback(
    (file: File) => {
      setError(null);

      const url = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        const imageId = `img_${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 11)}`;
        const newImage: ImageData = {
          id: imageId,
          file,
          url,
          width: img.naturalWidth,
          height: img.naturalHeight,
          name: file.name,
        };

        const isFirstImage = project.images.length === 0;

        // Show instructions if this is the first image uploaded
        if (isFirstImage) {
          showInstructionsIfFirstTime();
        }

        addImage(newImage);
      };

      img.onerror = () => {
        setError("Failed to load image. Please try a different file.");
        URL.revokeObjectURL(url);
      };

      img.src = url;
    },
    [showInstructionsIfFirstTime, addImage, project.images.length]
  );

  const handleMultipleImageUpload = useCallback(
    (files: File[]) => {
      setError(null);

      const loadPromises = files.map((file, index) => {
        return new Promise<ImageData>((resolve, reject) => {
          const url = URL.createObjectURL(file);
          const img = new Image();

          img.onload = () => {
            const imageId = `img_${Date.now()}_${index}_${Math.random()
              .toString(36)
              .substring(2, 11)}`;
            const newImage: ImageData = {
              id: imageId,
              file,
              url,
              width: img.naturalWidth,
              height: img.naturalHeight,
              name: file.name,
            };
            resolve(newImage);
          };

          img.onerror = () => {
            reject(new Error(`Failed to load ${file.name}`));
          };

          img.src = url;
        });
      });

      Promise.allSettled(loadPromises).then((results) => {
        const successfulImages: ImageData[] = [];
        const failedFiles: string[] = [];

        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            successfulImages.push(result.value);
          } else {
            failedFiles.push(files[index].name);
          }
        });

        if (successfulImages.length > 0) {
          const isFirstUpload = project.images.length === 0;

          // Show instructions if this is the first upload
          if (isFirstUpload) {
            showInstructionsIfFirstTime();
          }

          addImages(successfulImages);
        }

        if (failedFiles.length > 0) {
          setError(`Failed to load: ${failedFiles.join(", ")}`);
        }
      });
    },
    [showInstructionsIfFirstTime, addImages, project.images.length]
  );

  // Global drag and drop handlers
  const handleGlobalDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if dragged items contain files
    if (e.dataTransfer.types.includes("Files")) {
      setIsGlobalDragOver(true);
    }
  }, []);

  const handleGlobalDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleGlobalDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Only hide overlay if leaving the main container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsGlobalDragOver(false);
    }
  }, []);

  const handleGlobalDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsGlobalDragOver(false);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        const fileArray = Array.from(files);
        const imageFiles = fileArray.filter((file) =>
          file.type.startsWith("image/")
        );

        if (imageFiles.length === 0) return;

        if (imageFiles.length === 1) {
          handleImageUpload(imageFiles[0]);
        } else {
          handleMultipleImageUpload(imageFiles);
        }
      }
    },
    [handleImageUpload, handleMultipleImageUpload]
  );

  // Helper function to convert File/Blob to base64 (IOPaint format) - using utility function
  const convertToBase64 = blobToBase64;

  const handleProcessImage = useCallback(
    async (maskCanvas: HTMLCanvasElement) => {
      const currentImage = getCurrentImage();
      if (!currentImage) return;

      // Check if IOPaint server URL is configured
      if (!apiConfig.baseUrl) {
        setError("Please configure IOPaint server URL in settings");
        setShowAPIConfig(true);
        return;
      }

      // Set processing state for current image
      setImageProcessingState(currentImage.id, true);
      setError(null);

      try {
        // Create properly sized mask canvas matching image dimensions
        const maskCanvasForProvider = document.createElement("canvas");
        maskCanvasForProvider.width = currentImage.width;
        maskCanvasForProvider.height = currentImage.height;
        const maskCtx = maskCanvasForProvider.getContext("2d")!;

        // IOPaint expects: white = remove, black = keep
        // First, fill with black background (areas to keep)
        maskCtx.fillStyle = "black";
        maskCtx.fillRect(
          0,
          0,
          maskCanvasForProvider.width,
          maskCanvasForProvider.height
        );

        // Convert user's colored mask to white mask for IOPaint
        const scaleX = currentImage.width / maskCanvas.width;
        const scaleY = currentImage.height / maskCanvas.height;

        // Get the user's mask data
        const userMaskCtx = maskCanvas.getContext("2d")!;
        const userMaskData = userMaskCtx.getImageData(
          0,
          0,
          maskCanvas.width,
          maskCanvas.height
        );

        // Create a white mask from the user's colored mask
        const whiteMaskCanvas = document.createElement("canvas");
        whiteMaskCanvas.width = maskCanvas.width;
        whiteMaskCanvas.height = maskCanvas.height;
        const whiteMaskCtx = whiteMaskCanvas.getContext("2d")!;

        // Convert any non-transparent pixels to white
        const whiteMaskData = whiteMaskCtx.createImageData(
          maskCanvas.width,
          maskCanvas.height
        );
        for (let i = 0; i < userMaskData.data.length; i += 4) {
          const alpha = userMaskData.data[i + 3];
          if (alpha > 0) {
            // Convert to white with same alpha
            whiteMaskData.data[i] = 255; // R
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
        maskCtx.globalCompositeOperation = "source-over";
        maskCtx.drawImage(whiteMaskCanvas, 0, 0);
        maskCtx.restore();

        // Convert image and mask to base64 (IOPaint format)
        // Use background removed image if available, otherwise use original
        const currentBackgroundRemovedUrl = getCurrentBackgroundRemovedUrl();
        let imageBase64: string;
        if (finalUrl) {
          const response = await fetch(finalUrl);
          const blob = await response.blob();
          imageBase64 = await convertToBase64(blob);
        } else if (currentBackgroundRemovedUrl) {
          // Convert background removed image URL to base64
          const response = await fetch(currentBackgroundRemovedUrl);
          const blob = await response.blob();
          imageBase64 = await convertToBase64(blob);
        } else {
          // Use original image file
          imageBase64 = await convertToBase64(currentImage.file);
        }
        const maskBlob = await new Promise<Blob>((resolve) => {
          maskCanvasForProvider.toBlob((blob) => resolve(blob!), "image/png");
        });
        const maskBase64 = await convertToBase64(maskBlob);

        // Call IOPaint API directly using their format
        const requestBody = {
          image: imageBase64,
          mask: maskBase64,
          ldm_steps: 20,
          ldm_sampler: "plms",
          hd_strategy: "Crop",
          hd_strategy_crop_trigger_size: 800,
          hd_strategy_crop_margin: 128,
          hd_strategy_resize_limit: 1280,
          prompt: "",
          negative_prompt: "",
          use_croper: false,
          croper_x: 0,
          croper_y: 0,
          croper_height: currentImage.height,
          croper_width: currentImage.width,
          use_extender: false,
          extender_x: 0,
          extender_y: 0,
          extender_height: currentImage.height,
          extender_width: currentImage.width,
          sd_mask_blur: 12,
          sd_strength: 1.0,
          sd_steps: 50,
          sd_guidance_scale: 7.5,
          sd_sampler: "DPM++ 2M",
          sd_seed: -1,
          sd_match_histograms: false,
          sd_lcm_lora: false,
          enable_controlnet: false,
          controlnet_conditioning_scale: 0.4,
          controlnet_method: "",
          enable_brushnet: false,
          brushnet_method: "",
          brushnet_conditioning_scale: 1.0,
          enable_powerpaint_v2: false,
          powerpaint_task: "object-remove",
        };

        const response = await fetch(`${apiConfig.baseUrl}/api/v1/inpaint`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `IOPaint API error: ${response.status} ${response.statusText} - ${errorText}`
          );
        }

        // IOPaint returns the image directly as blob
        const blob = await response.blob();
        const imageUrl = URL.createObjectURL(blob);
        // Store the processed result for the current image
        setProcessedResult(currentImage.id, imageUrl);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to process image. Please try again."
        );
        console.error("Processing error:", err);
      } finally {
        // Clear processing state for current image
        setImageProcessingState(currentImage.id, false);
      }
    },
    [
      getCurrentImage,
      apiConfig,
      setImageProcessingState,
      getCurrentBackgroundRemovedUrl,
      finalUrl,
      setProcessedResult,
    ]
  );

  const handleRemoveBackground = useCallback(async () => {
    const currentImage = getCurrentImage();
    if (!currentImage) return;

    try {
      // Set processing state for current image
      setImageBackgroundProcessingState(currentImage.id, true);
      setError(null);

      // Convert image to base64 for background removal
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Failed to get canvas context");
      }

      // Load the image (use processed result if available, otherwise use original)
      const currentProcessedUrl = getCurrentProcessedUrl();
      const imageUrl = finalUrl || currentProcessedUrl || currentImage.url;

      const img = new Image();
      img.crossOrigin = "anonymous";

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Set canvas size to match image
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      // Draw image to canvas
      ctx.drawImage(img, 0, 0);

      // Convert to base64
      const imageBase64 = canvasToBase64(canvas);

      // Call background removal API
      const resultBase64 = await removeBackground(imageBase64);

      // Create blob URL for the result
      const resultImageUrl = `data:image/png;base64,${resultBase64}`;

      // Store the background removed result for the current image
      setBackgroundRemovedResult(currentImage.id, resultImageUrl);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to remove background. Please try again."
      );
      console.error("Background removal error:", err);
    } finally {
      // Clear processing state for current image
      setImageBackgroundProcessingState(currentImage.id, false);
    }
  }, [
    getCurrentImage,
    setImageBackgroundProcessingState,
    getCurrentProcessedUrl,
    finalUrl,
    setBackgroundRemovedResult
  ]);

  const handleReplaceBackground = useCallback(
    async (backgroundUrl: string) => {
      const currentImage = getCurrentImage();
      const currentOriginalBackgroundRemovedUrl =
        getCurrentOriginalBackgroundRemovedUrl();

      if (!currentImage || !currentOriginalBackgroundRemovedUrl) return;

      try {
        setError(null);

        // Check if this is the transparent background (same as background removed image)
        if (backgroundUrl === currentOriginalBackgroundRemovedUrl) {
          // For transparent background, directly use the background removed image
          replaceBackground(currentImage.id, backgroundUrl);
          return;
        }

        // Use the new compositeWithBackground function for other backgrounds
        const resultImageUrl = await compositeWithBackground(
          currentOriginalBackgroundRemovedUrl,
          backgroundUrl,
          currentImage.width,
          currentImage.height
        );

        // Store the background replaced result for the current image
        replaceBackground(currentImage.id, resultImageUrl);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to replace background. Please try again."
        );
        console.error("Background replacement error:", err);
      }
    },
    [
      getCurrentImage,
      getCurrentOriginalBackgroundRemovedUrl,
      replaceBackground,
    ]
  );

  const handleClearAll = useCallback(() => {
    const currentImage = getCurrentImage();
    if (!currentImage) return;

    // Clear all processing results for the current image
    clearAllResults(currentImage.id);
  }, [getCurrentImage, clearAllResults]);

  const handleBlurBackground = useCallback(async (blurIntensity: number) => {
    const currentImage = getCurrentImage();
    if (!currentImage) return;

    try {
      // Set processing state for current image
      setImageBackgroundBlurProcessingState(currentImage.id, true);
      setError(null);

      // Check if we already have blur data cached
      const existingBlurData = getCurrentBackgroundBlurData();

      if (existingBlurData) {
        // We have cached data, just adjust blur intensity (frontend only)
        const resultBase64 = await adjustBlurIntensity(
          existingBlurData.originalImageBase64,
          existingBlurData.removedBackgroundBase64,
          blurIntensity
        );

        const resultImageUrl = `data:image/png;base64,${resultBase64}`;
        setBackgroundBlurredResult(currentImage.id, resultImageUrl);

        // Update the cached intensity
        setBackgroundBlurData(currentImage.id, {
          ...existingBlurData,
          currentIntensity: blurIntensity
        });
      } else {
        // First time blur - need to prepare data
        let originalImageBase64: string;
        let removedBackgroundBase64: string;

        // Convert the source image to base64
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }

        // Load the image (use processed result if available, otherwise use original)
        const currentProcessedUrl = getCurrentProcessedUrl();
        const imageUrl = finalUrl || currentProcessedUrl || currentImage.url;

        const img = new Image();
        img.crossOrigin = "anonymous";

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = imageUrl;
        });

        // Set canvas size to match image
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;

        // Draw image to canvas
        ctx.drawImage(img, 0, 0);

        // Convert to base64
        originalImageBase64 = canvasToBase64(canvas);

        // Check if we already have a background-removed result
        const currentOriginalBackgroundRemovedUrl = getCurrentOriginalBackgroundRemovedUrl();

        if (currentOriginalBackgroundRemovedUrl) {
          // We already have a background-removed result, use it
          const response = await fetch(currentOriginalBackgroundRemovedUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          removedBackgroundBase64 = await new Promise((resolve, reject) => {
            reader.onload = () => {
              const result = reader.result as string;
              const base64 = result.split(',')[1];
              resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          // Need to remove background first
          removedBackgroundBase64 = await removeBackground(originalImageBase64);
        }

        // Apply blur with the prepared data
        const resultBase64 = await adjustBlurIntensity(
          originalImageBase64,
          removedBackgroundBase64,
          blurIntensity
        );

        const resultImageUrl = `data:image/png;base64,${resultBase64}`;
        setBackgroundBlurredResult(currentImage.id, resultImageUrl);

        // Cache the data for future adjustments
        setBackgroundBlurData(currentImage.id, {
          originalImageBase64,
          removedBackgroundBase64,
          currentIntensity: blurIntensity
        });
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to blur background. Please try again."
      );
      console.error("Background blur error:", err);
    } finally {
      // Clear processing state for current image
      setImageBackgroundBlurProcessingState(currentImage.id, false);
    }
  }, [
    getCurrentImage,
    setImageBackgroundBlurProcessingState,
    getCurrentProcessedUrl,
    getCurrentOriginalBackgroundRemovedUrl,
    getCurrentBackgroundBlurData,
    finalUrl,
    setBackgroundBlurredResult,
    setBackgroundBlurData
  ]);

  const handleImageRemove = useCallback((imageId: string) => {
    removeImage(imageId);
  }, [removeImage]);



  // Handle mask state change from CanvasEditor
  const handleMaskStateChange = useCallback(
    (maskState: MaskState) => {
      if (!project.currentImageId) return;
      saveMaskState(project.currentImageId, maskState);
    },
    [project.currentImageId, saveMaskState]
  );

  // Handle history state change from CanvasEditor
  const handleHistoryStateChange = useCallback(
    (history: string[], historyIndex: number) => {
      if (!project.currentImageId) return;
      saveHistoryState(project.currentImageId, history, historyIndex);
    },
    [project.currentImageId, saveHistoryState]
  );

  const handleImageSelect = useCallback((imageId: string) => {
    selectImage(imageId);
  }, [selectImage]);

  // Handle show help request
  const handleShowHelp = useCallback(() => {
    showInstructionsAgain();
  }, [showInstructionsAgain]);

  const currentImage = getCurrentImage();
  const currentProcessedUrl = getCurrentProcessedUrl();

  return (
    <div className="flex flex-col h-full relative">
      {!currentImage ? (
        <div className="flex-1">
          <ImageUpload
            onImageUpload={handleImageUpload}
            onMultipleImageUpload={handleMultipleImageUpload}
          />
        </div>
      ) : (
        <div
          className="flex flex-col h-full relative"
          onDragEnter={handleGlobalDragEnter}
          onDragOver={handleGlobalDragOver}
          onDragLeave={handleGlobalDragLeave}
          onDrop={handleGlobalDrop}
        >
          {/* Global Drag Overlay - only show when there's a current image */}
          {isGlobalDragOver && <DragOverlay />}

          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col bg-white">
              {/* <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-800">
                  Edit Your Image
                </h2>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAPIConfig(true)}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
              </div> */}

              {/* Canvas Content Area */}
              <div className="flex-1 p-4">
                {error && (
                  <Card className="mb-4 p-4 bg-red-50 border-red-200 shadow-sm">
                    <p className="text-red-700">{error}</p>
                  </Card>
                )}

                {/* Main Canvas */}
                <CanvasEditor
                  imageData={currentImage}
                  onProcessImage={handleProcessImage}
                  disabled={
                    getCurrentProcessingState() ||
                    getCurrentBackgroundProcessingState() ||
                    getCurrentBackgroundBlurProcessingState()
                  }
                  brushSettings={memoizedBrushSettings}
                  onBrushSettingsChange={setBrushSettings}
                  initialMaskState={getCurrentMaskState()}
                  onMaskStateChange={handleMaskStateChange}
                  initialHistoryState={getCurrentHistoryState()}
                  onHistoryStateChange={handleHistoryStateChange}
                  isProcessing={getCurrentProcessingState()}
                  processedImageUrl={getCurrentProcessedUrl()}
                  finalResult={finalResult}
                  onShowHelp={() => {
                    // This will be handled by CanvasEditor's internal logic
                  }}
                  onRemoveBackground={handleRemoveBackground}
                  isBackgroundProcessing={getCurrentBackgroundProcessingState()}
                  backgroundRemovedImageUrl={getCurrentBackgroundRemovedUrl()}
                  onReplaceBackground={handleReplaceBackground}
                  onBlurBackground={handleBlurBackground}
                  isBackgroundBlurProcessing={getCurrentBackgroundBlurProcessingState()}
                  backgroundBlurredImageUrl={getCurrentBackgroundBlurredUrl()}
                  onClearAll={handleClearAll}
                />
              </div>
            </div>

            {/* Right Side - Tool Panel */}
            <ToolPanel
              brushSettings={memoizedBrushSettings}
              onBrushSettingsChange={setBrushSettings}
              processedImageUrl={currentProcessedUrl}
              backgroundRemovedImageUrl={getCurrentBackgroundRemovedUrl()}
              backgroundBlurredImageUrl={getCurrentBackgroundBlurredUrl()}
              finalResult={finalResult}
              isProcessing={getCurrentProcessingState()}
              isBackgroundProcessing={getCurrentBackgroundProcessingState()}
              isBackgroundBlurProcessing={getCurrentBackgroundBlurProcessingState()}
              disabled={
                getCurrentProcessingState() ||
                getCurrentBackgroundProcessingState() ||
                getCurrentBackgroundBlurProcessingState()
              }
              onShowHelp={handleShowHelp}
              currentImageDimensions={currentImage ? {
                width: currentImage.width,
                height: currentImage.height
              } : undefined}
            />
          </div>

          {/* Bottom - Image Thumbnails */}
          <ImageThumbnails
            images={project.images}
            currentImageId={project.currentImageId}
            onImageSelect={handleImageSelect}
            onImageAdd={handleImageUpload}
            onMultipleImageAdd={handleMultipleImageUpload}
            onImageRemove={handleImageRemove}
            processedResults={project.processedResults}
            processingStates={project.processingStates}
            backgroundRemovedResults={project.backgroundRemovedResults}
            backgroundProcessingStates={project.backgroundProcessingStates}
          />
        </div>
      )}

      <APIConfigModal
        isOpen={showAPIConfig}
        onClose={() => setShowAPIConfig(false)}
        config={apiConfig}
        onConfigChange={setApiConfig}
      />

      <InstructionsModal isOpen={showInstructions} onClose={hideInstructions} />
    </div>
  );
};
