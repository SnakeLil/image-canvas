"use client";

import React, { useState, useCallback } from "react";
import { ImageUpload } from "./ImageUpload";
import { CanvasEditor } from "./CanvasEditor";
import type { MaskState } from "./CanvasEditor";

import { APIConfigModal } from "./APIConfigModal";
import { ToolPanel } from "./ToolPanel";
import { ImageThumbnails } from "./ImageThumbnails";
import { InstructionsModal } from "./InstructionsModal";
import { useInstructions } from "../hooks/useInstructions";
import { Card } from "@/components/ui/card";
import { type AIProvider } from "@/lib/ai-services";
import { Button } from "@/components/ui/button";
import { Settings } from "lucide-react";
import { removeBackground, canvasToBase64 } from "@/lib/background-removal";
import { DragOverlay } from "./DragOverLay";

export interface ImageData {
  id: string;
  file: File;
  url: string;
  width: number;
  height: number;
  name: string;
  thumbnail?: string;
}

export interface ImageProject {
  images: ImageData[];
  currentImageId: string | null;
  processedResults: Record<string, string>; // imageId -> processedImageUrl (inpaint results)
  backgroundRemovedResults: Record<string, string>; // imageId -> backgroundRemovedImageUrl (final result with background)
  originalBackgroundRemovedResults: Record<string, string>; // imageId -> original background removed (no background)
  maskStates: Record<string, MaskState>; // imageId -> maskState with size info
  historyStates: Record<string, { history: string[]; historyIndex: number }>; // imageId -> history data
  processingStates: Record<string, boolean>; // imageId -> isProcessing (inpaint)
  backgroundProcessingStates: Record<string, boolean>; // imageId -> isBackgroundProcessing
  // Track operation timestamps to determine the latest result
  processedTimestamps: Record<string, number>; // imageId -> timestamp when inpaint was completed
  backgroundRemovedTimestamps: Record<string, number>; // imageId -> timestamp when background removal was completed
}

export const ImageEditor: React.FC = () => {
  const [project, setProject] = useState<ImageProject>({
    images: [],
    currentImageId: null,
    processedResults: {},
    backgroundRemovedResults: {},
    originalBackgroundRemovedResults: {},
    maskStates: {},
    historyStates: {},
    processingStates: {},
    backgroundProcessingStates: {},
    processedTimestamps: {},
    backgroundRemovedTimestamps: {},
  });

  const [error, setError] = useState<string | null>(null);
  const [showAPIConfig, setShowAPIConfig] = useState(false);
  const [apiConfig, setApiConfig] = useState({
    provider: "iopaint" as AIProvider,
    apiKey: "",
    baseUrl: "https://faith1314666-imggen-magic-wand.hf.space",
  });
  const [brushSettings, setBrushSettings] = useState({
    size: 20,
    opacity: 100,
    color: "#ff3333",
    shape: "magic-wand" as import("./MagicCursor").CursorShape,
  });

  // Global drag and drop state
  const [isGlobalDragOver, setIsGlobalDragOver] = useState(false);

  // Helper functions
  const getCurrentImage = useCallback((): ImageData | null => {
    if (!project.currentImageId) return null;
    return (
      project.images.find((img) => img.id === project.currentImageId) || null
    );
  }, [project.currentImageId, project.images]);

  const getCurrentProcessedUrl = useCallback((): string | null => {
    if (!project.currentImageId) return null;
    return project.processedResults[project.currentImageId] || null;
  }, [project.currentImageId, project.processedResults]);

  const getCurrentMaskState = useCallback((): MaskState | undefined => {
    if (!project.currentImageId) return undefined;
    return project.maskStates[project.currentImageId];
  }, [project.currentImageId, project.maskStates]);

  const getCurrentHistoryState = useCallback(() => {
    if (!project.currentImageId) return undefined;
    return project.historyStates[project.currentImageId];
  }, [project.currentImageId, project.historyStates]);

  const getCurrentProcessingState = useCallback((): boolean => {
    if (!project.currentImageId) return false;
    return project.processingStates[project.currentImageId] || false;
  }, [project.currentImageId, project.processingStates]);

  const setImageProcessingState = useCallback(
    (imageId: string, isProcessing: boolean) => {
      setProject((prev) => ({
        ...prev,
        processingStates: {
          ...prev.processingStates,
          [imageId]: isProcessing,
        },
      }));
    },
    []
  );

  const getCurrentBackgroundRemovedUrl = useCallback((): string | null => {
    if (!project.currentImageId) return null;
    return project.backgroundRemovedResults[project.currentImageId] || null;
  }, [project.currentImageId, project.backgroundRemovedResults]);

  const getCurrentOriginalBackgroundRemovedUrl = useCallback(():
    | string
    | null => {
    if (!project.currentImageId) return null;
    return (
      project.originalBackgroundRemovedResults[project.currentImageId] || null
    );
  }, [project.currentImageId, project.originalBackgroundRemovedResults]);

  const getCurrentBackgroundProcessingState = useCallback((): boolean => {
    if (!project.currentImageId) return false;
    return project.backgroundProcessingStates[project.currentImageId] || false;
  }, [project.currentImageId, project.backgroundProcessingStates]);

  const setImageBackgroundProcessingState = useCallback(
    (imageId: string, isProcessing: boolean) => {
      setProject((prev) => ({
        ...prev,
        backgroundProcessingStates: {
          ...prev.backgroundProcessingStates,
          [imageId]: isProcessing,
        },
      }));
    },
    []
  );

  // Get the final result based on timestamps (latest operation wins)
  const getCurrentFinalResult = useCallback((): {
    url: string | null;
    type: "inpaint" | "background" | "final" | "none";
  } => {
    if (!project.currentImageId) return { url: null, type: "none" };

    const imageId = project.currentImageId;
    const processedUrl = project.processedResults[imageId];
    const backgroundRemovedUrl = project.backgroundRemovedResults[imageId];
    const processedTimestamp = project.processedTimestamps[imageId] || 0;
    const backgroundRemovedTimestamp =
      project.backgroundRemovedTimestamps[imageId] || 0;

    // If both results exist, compare timestamps and mark as final
    if (processedUrl && backgroundRemovedUrl) {
      if (backgroundRemovedTimestamp > processedTimestamp) {
        return { url: backgroundRemovedUrl, type: "final" };
      } else {
        return { url: processedUrl, type: "final" };
      }
    } else if (processedUrl) {
      return { url: processedUrl, type: "inpaint" };
    } else if (backgroundRemovedUrl) {
      return { url: backgroundRemovedUrl, type: "background" };
    }

    return { url: null, type: "none" };
  }, [
    project.currentImageId,
    project.processedResults,
    project.backgroundRemovedResults,
    project.processedTimestamps,
    project.backgroundRemovedTimestamps,
  ]);

  // Show API config modal on first load if no API is configured
  const [hasShownInitialConfig, setHasShownInitialConfig] = useState(false);

  // Check if API is configured (IOPaint doesn't need API key, just check baseUrl)
  const isAPIConfigured = !!apiConfig.baseUrl;

  // Instructions state
  const {
    showInstructions,
    hideInstructions,
    showInstructionsAgain,
    showInstructionsIfFirstTime,
  } = useInstructions();

  // Show config modal on first load if not configured
  React.useEffect(() => {
    if (!hasShownInitialConfig && !isAPIConfigured) {
      setShowAPIConfig(true);
      setHasShownInitialConfig(true);
    }
  }, [hasShownInitialConfig, isAPIConfigured]);

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

        setProject((prev) => {
          const isFirstImage = prev.images.length === 0;

          // Show instructions if this is the first image uploaded
          if (isFirstImage) {
            showInstructionsIfFirstTime();
          }

          return {
            ...prev,
            images: [...prev.images, newImage],
            currentImageId: imageId,
          };
        });
      };

      img.onerror = () => {
        setError("Failed to load image. Please try a different file.");
        URL.revokeObjectURL(url);
      };

      img.src = url;
    },
    [showInstructionsIfFirstTime]
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
          setProject((prev) => {
            const isFirstUpload = prev.images.length === 0;

            // Show instructions if this is the first upload
            if (isFirstUpload) {
              showInstructionsIfFirstTime();
            }

            return {
              ...prev,
              images: [...prev.images, ...successfulImages],
              currentImageId: successfulImages[0].id, // Set first uploaded image as current
            };
          });
        }

        if (failedFiles.length > 0) {
          setError(`Failed to load: ${failedFiles.join(", ")}`);
        }
      });
    },
    [showInstructionsIfFirstTime]
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

        if (currentBackgroundRemovedUrl) {
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
        // Store the processed result for the current image with timestamp
        const timestamp = Date.now();
        setProject((prev) => ({
          ...prev,
          processedResults: {
            ...prev.processedResults,
            [currentImage.id]: imageUrl,
          },
          processedTimestamps: {
            ...prev.processedTimestamps,
            [currentImage.id]: timestamp,
          },
        }));
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
      const imageUrl = currentProcessedUrl || currentImage.url;

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

      // Store the background removed result for the current image with timestamp
      const timestamp = Date.now();
      setProject((prev) => ({
        ...prev,
        backgroundRemovedResults: {
          ...prev.backgroundRemovedResults,
          [currentImage.id]: resultImageUrl,
        },
        originalBackgroundRemovedResults: {
          ...prev.originalBackgroundRemovedResults,
          [currentImage.id]: resultImageUrl,
        },
        backgroundRemovedTimestamps: {
          ...prev.backgroundRemovedTimestamps,
          [currentImage.id]: timestamp,
        },
      }));

      // Add a history entry for background removal operation
      // This allows users to undo back to the state before background removal

      // const currentHistoryState = getCurrentHistoryState();
      // if (currentHistoryState) {
      //   const newHistory = [...currentHistoryState.history];
      //   const newIndex = currentHistoryState.historyIndex + 1;

      //   // Add a marker entry to indicate background removal operation
      //   // We'll use an empty canvas as the mask state since background removal doesn't use masks
      //   const emptyCanvas = document.createElement('canvas');
      //   emptyCanvas.width = canvas.width;
      //   emptyCanvas.height = canvas.height;
      //   const emptyMaskDataURL = emptyCanvas.toDataURL();

      //   newHistory.splice(newIndex, newHistory.length - newIndex, emptyMaskDataURL);

      //   // Update history state directly
      //   setProject(prev => ({
      //     ...prev,
      //     historyStates: {
      //       ...prev.historyStates,
      //       [currentImage.id]: { history: newHistory, historyIndex: newIndex }
      //     }
      //   }));
      // }
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
    getCurrentHistoryState,
    getCurrentProcessedUrl,
  ]);

  const handleReplaceBackground = useCallback(
    async (backgroundUrl: string) => {
      const currentImage = getCurrentImage();
      const currentOriginalBackgroundRemovedUrl =
        getCurrentOriginalBackgroundRemovedUrl();

      if (!currentImage || !currentOriginalBackgroundRemovedUrl) return;

      try {
        setError(null);

        // Create canvas for compositing
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }

        // Set canvas size to match original image
        canvas.width = currentImage.width;
        canvas.height = currentImage.height;

        // Load background image (it's a data URL from canvas)
        const backgroundImg = new Image();
        await new Promise((resolve, reject) => {
          backgroundImg.onload = resolve;
          backgroundImg.onerror = reject;
          backgroundImg.src = backgroundUrl;
        });

        // Load the background-removed foreground image
        const foregroundImg = new Image();
        foregroundImg.crossOrigin = "anonymous";
        await new Promise((resolve, reject) => {
          foregroundImg.onload = resolve;
          foregroundImg.onerror = reject;
          foregroundImg.src = currentOriginalBackgroundRemovedUrl;
        });

        // Composite the images
        // 1. Draw background (already sized correctly)
        ctx.drawImage(backgroundImg, 0, 0);

        // 2. Draw foreground (background-removed image) on top
        ctx.drawImage(
          foregroundImg,
          0,
          0,
          currentImage.width,
          currentImage.height
        );

        // Convert result to blob URL
        const resultImageUrl = canvas.toDataURL();

        // Store the background replaced result for the current image
        setProject((prev) => ({
          ...prev,
          backgroundRemovedResults: {
            ...prev.backgroundRemovedResults,
            [currentImage.id]: resultImageUrl,
          },
        }));

        // Add a history entry for background replacement operation

        // const currentHistoryState = getCurrentHistoryState();
        // if (currentHistoryState) {
        //   const newHistory = [...currentHistoryState.history];
        //   const newIndex = currentHistoryState.historyIndex + 1;

        //   // Add a marker entry to indicate background replacement operation
        //   const emptyCanvas = document.createElement('canvas');
        //   emptyCanvas.width = currentImage.width;
        //   emptyCanvas.height = currentImage.height;
        //   const emptyMaskDataURL = emptyCanvas.toDataURL();

        //   newHistory.splice(newIndex, newHistory.length - newIndex, emptyMaskDataURL);

        //   // Update history state directly
        //   setProject(prev => ({
        //     ...prev,
        //     historyStates: {
        //       ...prev.historyStates,
        //       [currentImage.id]: { history: newHistory, historyIndex: newIndex }
        //     }
        //   }));
        // }
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
      getCurrentHistoryState,
    ]
  );

  const handleClearAll = useCallback(() => {
    const currentImage = getCurrentImage();
    if (!currentImage) return;

    // Clear all processing results for the current image
    setProject((prev) => {
      const newProcessedResults = { ...prev.processedResults };
      const newBackgroundRemovedResults = { ...prev.backgroundRemovedResults };
      const newOriginalBackgroundRemovedResults = {
        ...prev.originalBackgroundRemovedResults,
      };
      const newHistoryStates = { ...prev.historyStates };
      const newProcessedTimestamps = { ...prev.processedTimestamps };
      const newBackgroundRemovedTimestamps = {
        ...prev.backgroundRemovedTimestamps,
      };

      // Remove all results for current image
      delete newProcessedResults[currentImage.id];
      delete newBackgroundRemovedResults[currentImage.id];
      delete newOriginalBackgroundRemovedResults[currentImage.id];
      delete newProcessedTimestamps[currentImage.id];
      delete newBackgroundRemovedTimestamps[currentImage.id];

      // Reset history to initial state (empty mask)
      newHistoryStates[currentImage.id] = { history: [], historyIndex: -1 };

      return {
        ...prev,
        processedResults: newProcessedResults,
        backgroundRemovedResults: newBackgroundRemovedResults,
        originalBackgroundRemovedResults: newOriginalBackgroundRemovedResults,
        historyStates: newHistoryStates,
        processedTimestamps: newProcessedTimestamps,
        backgroundRemovedTimestamps: newBackgroundRemovedTimestamps,
      };
    });
  }, [getCurrentImage]);

  const handleReset = useCallback(() => {
    setProject({
      images: [],
      currentImageId: null,
      processedResults: {},
      backgroundRemovedResults: {},
      originalBackgroundRemovedResults: {},
      maskStates: {},
      historyStates: {},
      processingStates: {},
      backgroundProcessingStates: {},
      processedTimestamps: {},
      backgroundRemovedTimestamps: {},
    });
    setError(null);
  }, []);

  const handleImageRemove = useCallback((imageId: string) => {
    setProject((prev) => {
      const newImages = prev.images.filter((img) => img.id !== imageId);
      const newProcessedResults = { ...prev.processedResults };
      const newBackgroundRemovedResults = { ...prev.backgroundRemovedResults };
      const newOriginalBackgroundRemovedResults = {
        ...prev.originalBackgroundRemovedResults,
      };
      const newMaskStates = { ...prev.maskStates };
      const newHistoryStates = { ...prev.historyStates };
      const newProcessingStates = { ...prev.processingStates };
      const newBackgroundProcessingStates = {
        ...prev.backgroundProcessingStates,
      };
      const newProcessedTimestamps = { ...prev.processedTimestamps };
      const newBackgroundRemovedTimestamps = {
        ...prev.backgroundRemovedTimestamps,
      };

      delete newProcessedResults[imageId];
      delete newBackgroundRemovedResults[imageId];
      delete newOriginalBackgroundRemovedResults[imageId];
      delete newMaskStates[imageId];
      delete newHistoryStates[imageId];
      delete newProcessingStates[imageId];
      delete newBackgroundProcessingStates[imageId];
      delete newProcessedTimestamps[imageId];
      delete newBackgroundRemovedTimestamps[imageId];

      // If removing current image, select another one
      let newCurrentImageId = prev.currentImageId;
      if (prev.currentImageId === imageId) {
        newCurrentImageId = newImages.length > 0 ? newImages[0].id : null;
      }

      return {
        images: newImages,
        currentImageId: newCurrentImageId,
        processedResults: newProcessedResults,
        backgroundRemovedResults: newBackgroundRemovedResults,
        originalBackgroundRemovedResults: newOriginalBackgroundRemovedResults,
        maskStates: newMaskStates,
        historyStates: newHistoryStates,
        processingStates: newProcessingStates,
        backgroundProcessingStates: newBackgroundProcessingStates,
        processedTimestamps: newProcessedTimestamps,
        backgroundRemovedTimestamps: newBackgroundRemovedTimestamps,
      };
    });
  }, []);

  // Save current mask state before switching
  const saveMaskState = useCallback((imageId: string, maskState: MaskState) => {
    setProject((prev) => ({
      ...prev,
      maskStates: {
        ...prev.maskStates,
        [imageId]: maskState,
      },
    }));
  }, []);

  // Save history state for current image
  const saveHistoryState = useCallback(
    (imageId: string, history: string[], historyIndex: number) => {
      setProject((prev) => ({
        ...prev,
        historyStates: {
          ...prev.historyStates,
          [imageId]: { history, historyIndex },
        },
      }));
    },
    []
  );

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
    setProject((prev) => ({
      ...prev,
      currentImageId: imageId,
    }));
  }, []);

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
            {/* Left Side - Canvas Area */}
            <div className="flex-1 flex flex-col bg-white">
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
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
              </div>

              {/* Canvas Content Area */}
              <div className="flex-1 p-4">
                {/* API Configuration Status */}
                {!isAPIConfigured && (
                  <Card className="mb-4 p-4 bg-amber-50 border-amber-200 shadow-sm">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-amber-600" />
                      <p className="text-amber-700">
                        Please configure an AI provider to use the magic eraser
                        feature.
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
                    getCurrentBackgroundProcessingState()
                  }
                  brushSettings={brushSettings}
                  onBrushSettingsChange={setBrushSettings}
                  initialMaskState={getCurrentMaskState()}
                  onMaskStateChange={handleMaskStateChange}
                  initialHistoryState={getCurrentHistoryState()}
                  onHistoryStateChange={handleHistoryStateChange}
                  isProcessing={getCurrentProcessingState()}
                  processedImageUrl={getCurrentProcessedUrl()}
                  finalResult={getCurrentFinalResult()}
                  onShowHelp={() => {
                    // This will be handled by CanvasEditor's internal logic
                  }}
                  onRemoveBackground={handleRemoveBackground}
                  isBackgroundProcessing={getCurrentBackgroundProcessingState()}
                  backgroundRemovedImageUrl={getCurrentBackgroundRemovedUrl()}
                  onReplaceBackground={handleReplaceBackground}
                  onClearAll={handleClearAll}
                />
              </div>
            </div>

            {/* Right Side - Tool Panel */}
            <ToolPanel
              brushSettings={brushSettings}
              onBrushSettingsChange={setBrushSettings}
              processedImageUrl={currentProcessedUrl}
              backgroundRemovedImageUrl={getCurrentBackgroundRemovedUrl()}
              finalResult={getCurrentFinalResult()}
              isProcessing={getCurrentProcessingState()}
              isBackgroundProcessing={getCurrentBackgroundProcessingState()}
              disabled={
                getCurrentProcessingState() ||
                getCurrentBackgroundProcessingState()
              }
              onShowHelp={handleShowHelp}
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
