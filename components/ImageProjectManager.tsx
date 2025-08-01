"use client";

import { useState, useCallback } from "react";
import type { ImageData } from "./ImageEditor";
import type { MaskState } from "./MaskCanvas";

export interface ImageProject {
  images: ImageData[];
  currentImageId: string | null;
  processedResults: Record<string, string>; // imageId -> processedImageUrl (inpaint results)
  backgroundRemovedResults: Record<string, string>; // imageId -> backgroundRemovedImageUrl (final result with background)
  originalBackgroundRemovedResults: Record<string, string>; // imageId -> original background removed (no background)
  backgroundBlurredResults: Record<string, string>; // imageId -> backgroundBlurredImageUrl (blurred background results)
  // Store blur data for real-time adjustment
  backgroundBlurData: Record<string, {
    originalImageBase64: string;
    removedBackgroundBase64: string;
    currentIntensity: number;
  }>; // imageId -> blur data for real-time adjustment
  maskStates: Record<string, MaskState>; // imageId -> maskState with size info
  historyStates: Record<string, { history: string[]; historyIndex: number }>; // imageId -> history data
  processingStates: Record<string, boolean>; // imageId -> isProcessing (inpaint)
  backgroundProcessingStates: Record<string, boolean>; // imageId -> isBackgroundProcessing
  backgroundBlurProcessingStates: Record<string, boolean>; // imageId -> isBackgroundBlurProcessing
  // Track operation timestamps to determine the latest result
  processedTimestamps: Record<string, number>; // imageId -> timestamp when inpaint was completed
  backgroundRemovedTimestamps: Record<string, number>; // imageId -> timestamp when background removal was completed
  backgroundBlurredTimestamps: Record<string, number>; // imageId -> timestamp when background blur was completed
}

export const useImageProjectManager = () => {
  const [project, setProject] = useState<ImageProject>({
    images: [],
    currentImageId: null,
    processedResults: {},
    backgroundRemovedResults: {},
    originalBackgroundRemovedResults: {},
    backgroundBlurredResults: {},
    backgroundBlurData: {},
    maskStates: {},
    historyStates: {},
    processingStates: {},
    backgroundProcessingStates: {},
    backgroundBlurProcessingStates: {},
    processedTimestamps: {},
    backgroundRemovedTimestamps: {},
    backgroundBlurredTimestamps: {},
  });

  // Helper functions
  const getCurrentImage = useCallback((): ImageData | null => {
    if (!project.currentImageId) return null;
    return project.images.find((img) => img.id === project.currentImageId) || null;
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

  const getCurrentBackgroundRemovedUrl = useCallback((): string | null => {
    if (!project.currentImageId) return null;
    return project.backgroundRemovedResults[project.currentImageId] || null;
  }, [project.currentImageId, project.backgroundRemovedResults]);

  const getCurrentOriginalBackgroundRemovedUrl = useCallback((): string | null => {
    if (!project.currentImageId) return null;
    return project.originalBackgroundRemovedResults[project.currentImageId] || null;
  }, [project.currentImageId, project.originalBackgroundRemovedResults]);

  const getCurrentBackgroundProcessingState = useCallback((): boolean => {
    if (!project.currentImageId) return false;
    return project.backgroundProcessingStates[project.currentImageId] || false;
  }, [project.currentImageId, project.backgroundProcessingStates]);

  const getCurrentBackgroundBlurredUrl = useCallback((): string | null => {
    if (!project.currentImageId) return null;
    return project.backgroundBlurredResults[project.currentImageId] || null;
  }, [project.currentImageId, project.backgroundBlurredResults]);

  const getCurrentBackgroundBlurProcessingState = useCallback((): boolean => {
    if (!project.currentImageId) return false;
    return project.backgroundBlurProcessingStates[project.currentImageId] || false;
  }, [project.currentImageId, project.backgroundBlurProcessingStates]);

  const getCurrentBackgroundBlurData = useCallback(() => {
    if (!project.currentImageId) return null;
    return project.backgroundBlurData[project.currentImageId] || null;
  }, [project.currentImageId, project.backgroundBlurData]);

  // Get the final result based on timestamps (latest operation wins)
  const getCurrentFinalResult = useCallback((): {
    url: string | null;
    type: "inpaint" | "background" | "blur" | "final" | "none";
  } => {
    if (!project.currentImageId) return { url: null, type: "none" };

    const imageId = project.currentImageId;
    const processedUrl = project.processedResults[imageId];
    const backgroundRemovedUrl = project.backgroundRemovedResults[imageId];
    const backgroundBlurredUrl = project.backgroundBlurredResults[imageId];
    const processedTimestamp = project.processedTimestamps[imageId] || 0;
    const backgroundRemovedTimestamp = project.backgroundRemovedTimestamps[imageId] || 0;
    const backgroundBlurredTimestamp = project.backgroundBlurredTimestamps[imageId] || 0;

    // Find the latest operation
    const operations = [
      { url: processedUrl, timestamp: processedTimestamp, type: "inpaint" as const },
      { url: backgroundRemovedUrl, timestamp: backgroundRemovedTimestamp, type: "background" as const },
      { url: backgroundBlurredUrl, timestamp: backgroundBlurredTimestamp, type: "blur" as const },
    ].filter(op => op.url); // Only include operations that have results

    if (operations.length === 0) {
      return { url: null, type: "none" };
    }

    // Sort by timestamp and get the latest
    const latestOperation = operations.sort((a, b) => b.timestamp - a.timestamp)[0];

    // If there are multiple operations, mark as final, otherwise use the specific type
    const resultType = operations.length > 1 ? "final" : latestOperation.type;

    return { url: latestOperation.url, type: resultType };
  }, [
    project.currentImageId,
    project.processedResults,
    project.backgroundRemovedResults,
    project.backgroundBlurredResults,
    project.processedTimestamps,
    project.backgroundRemovedTimestamps,
    project.backgroundBlurredTimestamps,
  ]);

  // State setters
  const setImageProcessingState = useCallback((imageId: string, isProcessing: boolean) => {
    setProject((prev) => ({
      ...prev,
      processingStates: {
        ...prev.processingStates,
        [imageId]: isProcessing,
      },
    }));
  }, []);

  const setImageBackgroundProcessingState = useCallback((imageId: string, isProcessing: boolean) => {
    setProject((prev) => ({
      ...prev,
      backgroundProcessingStates: {
        ...prev.backgroundProcessingStates,
        [imageId]: isProcessing,
      },
    }));
  }, []);

  const setImageBackgroundBlurProcessingState = useCallback((imageId: string, isProcessing: boolean) => {
    setProject((prev) => ({
      ...prev,
      backgroundBlurProcessingStates: {
        ...prev.backgroundBlurProcessingStates,
        [imageId]: isProcessing,
      },
    }));
  }, []);

  const addImage = useCallback((imageData: ImageData) => {
    setProject((prev) => ({
      ...prev,
      images: [...prev.images, imageData],
      currentImageId: imageData.id,
    }));
  }, []);

  const addImages = useCallback((images: ImageData[]) => {
    setProject((prev) => ({
      ...prev,
      images: [...prev.images, ...images],
      currentImageId: images[0]?.id || prev.currentImageId,
    }));
  }, []);

  const removeImage = useCallback((imageId: string) => {
    setProject((prev) => {
      const newImages = prev.images.filter((img) => img.id !== imageId);
      const newProcessedResults = { ...prev.processedResults };
      const newBackgroundRemovedResults = { ...prev.backgroundRemovedResults };
      const newOriginalBackgroundRemovedResults = { ...prev.originalBackgroundRemovedResults };
      const newBackgroundBlurredResults = { ...prev.backgroundBlurredResults };
      const newBackgroundBlurData = { ...prev.backgroundBlurData };
      const newMaskStates = { ...prev.maskStates };
      const newHistoryStates = { ...prev.historyStates };
      const newProcessingStates = { ...prev.processingStates };
      const newBackgroundProcessingStates = { ...prev.backgroundProcessingStates };
      const newBackgroundBlurProcessingStates = { ...prev.backgroundBlurProcessingStates };
      const newProcessedTimestamps = { ...prev.processedTimestamps };
      const newBackgroundRemovedTimestamps = { ...prev.backgroundRemovedTimestamps };
      const newBackgroundBlurredTimestamps = { ...prev.backgroundBlurredTimestamps };

      // Clean up all data for this image
      delete newProcessedResults[imageId];
      delete newBackgroundRemovedResults[imageId];
      delete newOriginalBackgroundRemovedResults[imageId];
      delete newBackgroundBlurredResults[imageId];
      delete newBackgroundBlurData[imageId];
      delete newMaskStates[imageId];
      delete newHistoryStates[imageId];
      delete newProcessingStates[imageId];
      delete newBackgroundProcessingStates[imageId];
      delete newBackgroundBlurProcessingStates[imageId];
      delete newProcessedTimestamps[imageId];
      delete newBackgroundRemovedTimestamps[imageId];
      delete newBackgroundBlurredTimestamps[imageId];

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
        backgroundBlurredResults: newBackgroundBlurredResults,
        backgroundBlurData: newBackgroundBlurData,
        maskStates: newMaskStates,
        historyStates: newHistoryStates,
        processingStates: newProcessingStates,
        backgroundProcessingStates: newBackgroundProcessingStates,
        backgroundBlurProcessingStates: newBackgroundBlurProcessingStates,
        processedTimestamps: newProcessedTimestamps,
        backgroundRemovedTimestamps: newBackgroundRemovedTimestamps,
        backgroundBlurredTimestamps: newBackgroundBlurredTimestamps,
      };
    });
  }, []);

  const selectImage = useCallback((imageId: string) => {
    setProject((prev) => ({
      ...prev,
      currentImageId: imageId,
    }));
  }, []);

  const saveMaskState = useCallback((imageId: string, maskState: MaskState) => {
    setProject((prev) => ({
      ...prev,
      maskStates: {
        ...prev.maskStates,
        [imageId]: maskState,
      },
    }));
  }, []);

  const saveHistoryState = useCallback((imageId: string, history: string[], historyIndex: number) => {
    setProject((prev) => ({
      ...prev,
      historyStates: {
        ...prev.historyStates,
        [imageId]: { history, historyIndex },
      },
    }));
  }, []);

  const setProcessedResult = useCallback((imageId: string, url: string) => {
    const timestamp = Date.now();
    setProject((prev) => ({
      ...prev,
      processedResults: {
        ...prev.processedResults,
        [imageId]: url,
      },
      processedTimestamps: {
        ...prev.processedTimestamps,
        [imageId]: timestamp,
      },
    }));
  }, []);

  const setBackgroundRemovedResult = useCallback((imageId: string, url: string) => {
    const timestamp = Date.now();
    setProject((prev) => ({
      ...prev,
      backgroundRemovedResults: {
        ...prev.backgroundRemovedResults,
        [imageId]: url,
      },
      originalBackgroundRemovedResults: {
        ...prev.originalBackgroundRemovedResults,
        [imageId]: url,
      },
      backgroundRemovedTimestamps: {
        ...prev.backgroundRemovedTimestamps,
        [imageId]: timestamp,
      },
    }));
  }, []);

  const replaceBackground = useCallback((imageId: string, url: string) => {
    setProject((prev) => ({
      ...prev,
      backgroundRemovedResults: {
        ...prev.backgroundRemovedResults,
        [imageId]: url,
      },
    }));
  }, []);

  const setBackgroundBlurredResult = useCallback((imageId: string, url: string) => {
    const timestamp = Date.now();
    setProject((prev) => ({
      ...prev,
      backgroundBlurredResults: {
        ...prev.backgroundBlurredResults,
        [imageId]: url,
      },
      backgroundBlurredTimestamps: {
        ...prev.backgroundBlurredTimestamps,
        [imageId]: timestamp,
      },
    }));
  }, []);

  const setBackgroundBlurData = useCallback((imageId: string, data: {
    originalImageBase64: string;
    removedBackgroundBase64: string;
    currentIntensity: number;
  }) => {
    setProject((prev) => ({
      ...prev,
      backgroundBlurData: {
        ...prev.backgroundBlurData,
        [imageId]: data,
      },
    }));
  }, []);

  const clearAllResults = useCallback((imageId: string) => {
    setProject((prev) => {
      const newProcessedResults = { ...prev.processedResults };
      const newBackgroundRemovedResults = { ...prev.backgroundRemovedResults };
      const newOriginalBackgroundRemovedResults = { ...prev.originalBackgroundRemovedResults };
      const newBackgroundBlurredResults = { ...prev.backgroundBlurredResults };
      const newBackgroundBlurData = { ...prev.backgroundBlurData };
      const newProcessedTimestamps = { ...prev.processedTimestamps };
      const newBackgroundRemovedTimestamps = { ...prev.backgroundRemovedTimestamps };
      const newBackgroundBlurredTimestamps = { ...prev.backgroundBlurredTimestamps };

      delete newProcessedResults[imageId];
      delete newBackgroundRemovedResults[imageId];
      delete newOriginalBackgroundRemovedResults[imageId];
      delete newBackgroundBlurredResults[imageId];
      delete newBackgroundBlurData[imageId];
      delete newProcessedTimestamps[imageId];
      delete newBackgroundRemovedTimestamps[imageId];
      delete newBackgroundBlurredTimestamps[imageId];

      return {
        ...prev,
        processedResults: newProcessedResults,
        backgroundRemovedResults: newBackgroundRemovedResults,
        originalBackgroundRemovedResults: newOriginalBackgroundRemovedResults,
        backgroundBlurredResults: newBackgroundBlurredResults,
        backgroundBlurData: newBackgroundBlurData,
        processedTimestamps: newProcessedTimestamps,
        backgroundRemovedTimestamps: newBackgroundRemovedTimestamps,
        backgroundBlurredTimestamps: newBackgroundBlurredTimestamps,
      };
    });
  }, []);

  const resetProject = useCallback(() => {
    setProject({
      images: [],
      currentImageId: null,
      processedResults: {},
      backgroundRemovedResults: {},
      originalBackgroundRemovedResults: {},
      backgroundBlurredResults: {},
      backgroundBlurData: {},
      maskStates: {},
      historyStates: {},
      processingStates: {},
      backgroundProcessingStates: {},
      backgroundBlurProcessingStates: {},
      processedTimestamps: {},
      backgroundRemovedTimestamps: {},
      backgroundBlurredTimestamps: {},
    });
  }, []);

  return {
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
    resetProject,
  };
};
