'use client';

import React, { useRef, useState } from 'react';
import { Plus, X, Download, Sparkles } from 'lucide-react';
import type { ImageData } from './ImageEditor';
import { downloadFile } from '@/lib/download-utils';

interface ImageThumbnailsProps {
  images: ImageData[];
  currentImageId: string | null;
  onImageSelect: (imageId: string) => void;
  onImageAdd: (file: File) => void;
  onMultipleImageAdd?: (files: File[]) => void;
  onImageRemove: (imageId: string) => void;
  processedResults: Record<string, string>;
  processingStates: Record<string, boolean>;
  backgroundRemovedResults?: Record<string, string>;
  backgroundProcessingStates?: Record<string, boolean>;
}

export const ImageThumbnails: React.FC<ImageThumbnailsProps> = ({
  images,
  currentImageId,
  onImageSelect,
  onImageAdd,
  onMultipleImageAdd,
  onImageRemove,
  processedResults,
  processingStates,
  backgroundRemovedResults = {},
  backgroundProcessingStates = {}
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // Common function to handle files (used by both file input and drag & drop)
  const handleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    // Filter only image files
    const imageFiles = fileArray.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) return;

    if (imageFiles.length === 1) {
      onImageAdd(imageFiles[0]);
    } else if (imageFiles.length > 1 && onMultipleImageAdd) {
      onMultipleImageAdd(imageFiles);
    } else {
      // Fallback: add files one by one if no multiple handler
      imageFiles.forEach(file => onImageAdd(file));
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
      // Reset the input so the same files can be selected again
      event.target.value = '';
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragOver to false if we're leaving the container itself
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  return (
    <div
      className={`h-28 fixed bottom-0 bg-white border-t border-gray-200 px-4 py-2 w-full transition-colors ${
        isDragOver ? 'bg-blue-50 border-blue-300' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-100/80 border-2 border-dashed border-blue-400 flex items-center justify-center z-50">
          <div className="text-blue-600 font-medium text-lg flex items-center space-x-2">
            <Plus className="w-6 h-6" />
            <span>Drop images here to upload</span>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-4 h-full max-w-full">
        <div className="text-sm font-medium text-gray-700 flex-shrink-0">
          Images ({images.length}):
        </div>

        <div
          className="flex space-x-4 overflow-x-auto overflow-y-hidden flex-1 py-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 min-w-0 max-w-[85vw]"
          style={{
            // scrollbarWidth: 'thin',
            // scrollbarColor: '#cbd5e1 transparent'
          }}
        >
          {images.map((image) => {
            const isSelected = image.id === currentImageId;
            const hasProcessedResult = processedResults[image.id];
            const hasBackgroundRemovedResult = backgroundRemovedResults[image.id];
            const isProcessing = processingStates[image.id] || false;
            const isBackgroundProcessing = backgroundProcessingStates[image.id] || false;
            const isAnyProcessing = isProcessing || isBackgroundProcessing;
            
            return (
              <div
                key={image.id}
                className="relative flex-shrink-0 group p-2"
              >
                {/* Main thumbnail */}
                <div
                  className={`w-16 h-16 rounded-lg border-2 cursor-pointer transition-all relative overflow-hidden ${
                    isSelected
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onImageSelect(image.id)}
                >
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Processing overlay */}
                  {isAnyProcessing && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                </div>

                {/* Processing/Processed indicator */}
                {isAnyProcessing ? (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center z-10">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </div>
                ) : (hasProcessedResult || hasBackgroundRemovedResult) ? (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center z-10">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                ) : null}

                {/* Background removed indicator */}
                {hasBackgroundRemovedResult && !isAnyProcessing && (
                  <div className="absolute top-1 left-1 w-4 h-4 bg-purple-500 rounded-full border-2 border-white flex items-center justify-center z-10">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                )}

                {/* Remove button */}
                {images.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onImageRemove(image.id);
                    }}
                    className="absolute top-0 left-0 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 shadow-lg"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}

                {/* Download processed result */}
                {hasProcessedResult && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(processedResults[image.id], `processed-${image.name}`);
                    }}
                    className="absolute bottom-0 right-0 w-5 h-5 bg-blue-500 hover:bg-blue-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10 shadow-lg"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                )}

                {/* Image name tooltip */}
                {/* <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mt-1 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">
                  {image.name}
                </div> */}
              </div>
            );
          })}

          {/* Add new image button */}
          <div className="p-2 flex-shrink-0">
            <button
              onClick={handleAddClick}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-300 hover:border-gray-400 flex items-center justify-center text-gray-400 hover:text-gray-500 transition-colors"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />

        {/* Quick actions */}
        <div className="flex items-center space-x-2 flex-shrink-0">
          {images.length > 0 && (
            <div className="text-xs text-gray-500">
              {images.filter(img => processedResults[img.id]).length} processed
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
