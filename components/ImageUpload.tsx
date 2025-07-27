'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon, Sparkles, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
  onMultipleImageUpload?: (files: File[]) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUpload,
  onMultipleImageUpload
}) => {
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    setIsDragOver(false);
    setUploadProgress(0);

    if (acceptedFiles.length === 0) {
      setError('Please select valid image files (JPG, PNG, or WebP)');
      setUploadProgress(null);
      return;
    }

    // Validate file sizes (max 10MB each)
    const invalidFiles = acceptedFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (invalidFiles.length > 0) {
      setError(`${invalidFiles.length} file(s) exceed 10MB limit`);
      setUploadProgress(null);
      return;
    }

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null) return null;
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    // Complete upload after progress animation
    setTimeout(() => {
      setUploadProgress(null);

      // If multiple files and callback exists, use multiple upload
      if (acceptedFiles.length > 1 && onMultipleImageUpload) {
        onMultipleImageUpload(acceptedFiles);
      } else {
        // Otherwise use single upload with first file
        onImageUpload(acceptedFiles[0]);
      }
    }, 1200);
  }, [onImageUpload, onMultipleImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false),
    onDragOver: (e) => {
      e.preventDefault();
      setIsDragOver(true);
    },
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    multiple: true,
    maxFiles: 10, // Allow up to 10 files
    disabled: uploadProgress !== null
  });

  return (
    <div className="min-h-screen pt-12 bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-200/30 rounded-full blur-xl animate-pulse"></div>
      <div className="absolute top-1/3 right-20 w-32 h-32 bg-purple-200/30 rounded-full blur-xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-pink-200/30 rounded-full blur-xl animate-pulse delay-500"></div>

      <div className="max-w-4xl w-full relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 mb-4 group">
            <Sparkles className="w-8 h-8 text-yellow-500 animate-spin-slow group-hover:animate-pulse" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Magic Eraser
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-2 animate-fade-in-up delay-200">
            Upload images to remove backgrounds
          </p>
          <p className="text-gray-500 animate-fade-in-up delay-300">
            Powered by AI technology
          </p>
        </div>

        {/* Upload Area */}
        <Card className="p-8 bg-white/80 backdrop-blur-sm border-gray-200 shadow-xl">
          <div
            {...getRootProps()}
            className={`
              relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ease-in-out overflow-hidden
              ${uploadProgress !== null
                ? 'border-green-500 bg-green-50'
                : isDragActive || isDragOver
                ? 'border-blue-500 bg-blue-50 scale-105 shadow-lg'
                : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 hover:scale-102'
              }
              ${uploadProgress !== null ? 'pointer-events-none' : ''}
            `}
          >
            <input {...getInputProps()} />

            <div className="space-y-6">
              {/* Icon */}
              <div className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                uploadProgress !== null
                  ? 'bg-green-500 scale-110'
                  : isDragActive || isDragOver
                  ? 'bg-blue-500 scale-110'
                  : 'bg-gradient-to-br from-blue-500 to-purple-500'
              }`}>
                {uploadProgress !== null ? (
                  <div className="text-white font-bold text-lg">
                    {uploadProgress}%
                  </div>
                ) : isDragActive || isDragOver ? (
                  <Upload className="w-10 h-10 text-white animate-bounce" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-white" />
                )}
              </div>

              {/* Progress Bar */}
              {uploadProgress !== null && (
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              {/* Main Text */}
              <div>
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                  {uploadProgress !== null
                    ? 'Uploading Images...'
                    : isDragActive || isDragOver
                    ? 'Drop your images here'
                    : 'Upload Images'
                  }
                </h3>
                <p className="text-gray-600 mb-4">
                  {uploadProgress !== null
                    ? 'Please wait while we process your images'
                    : isDragActive || isDragOver
                    ? 'Release to upload your images'
                    : 'Drag & drop images or click to browse'
                  }
                </p>

                {/* Upload Button */}
                {uploadProgress === null && (
                  <Button
                    className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-8 py-3 rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    size="lg"
                    disabled={isDragActive || isDragOver}
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Choose Images
                  </Button>
                )}

                <p className="text-sm text-gray-500 mt-4">
                  {uploadProgress !== null
                    ? 'Processing your images with AI technology'
                    : 'Supports JPG, PNG, and WebP • Up to 10 files • Max 10MB each'
                  }
                </p>
              </div>
            </div>

            {/* Decorative elements */}
            <div className={`absolute top-4 right-4 w-2 h-2 rounded-full transition-all duration-300 ${
              uploadProgress !== null
                ? 'bg-green-400 animate-ping'
                : isDragActive || isDragOver
                ? 'bg-blue-400 animate-ping'
                : 'bg-blue-400 animate-pulse'
            }`}></div>
            <div className={`absolute bottom-4 left-4 w-3 h-3 rounded-full transition-all duration-300 ${
              uploadProgress !== null
                ? 'bg-green-400 animate-ping delay-500'
                : isDragActive || isDragOver
                ? 'bg-purple-400 animate-ping delay-300'
                : 'bg-purple-400 animate-pulse delay-1000'
            }`}></div>
            <div className={`absolute top-1/2 left-4 w-1 h-1 rounded-full transition-all duration-300 ${
              uploadProgress !== null
                ? 'bg-green-300 animate-ping delay-1000'
                : isDragActive || isDragOver
                ? 'bg-blue-300 animate-ping delay-700'
                : 'bg-blue-300 animate-pulse delay-500'
            }`}></div>

            {/* Drag overlay effect */}
            {(isDragActive || isDragOver) && (
              <div className="absolute inset-0 bg-blue-500/10 rounded-2xl animate-pulse"></div>
            )}

            {/* Upload overlay effect */}
            {uploadProgress !== null && (
              <div className="absolute inset-0 bg-green-500/10 rounded-2xl"></div>
            )}
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 text-sm font-medium">{error}</p>
            </div>
          )}
        </Card>

        {/* Example Images Section */}
        <div className="mt-16 text-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">
              What can you remove?
            </h2>
            <p className="text-gray-600">
              Our AI can intelligently remove any unwanted objects from your photos
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto mb-8">
            {[
              {
                icon: "🌳",
                label: "Trees & Plants",
                description: "Remove vegetation",
                gradient: "from-green-400 to-emerald-500"
              },
              {
                icon: "🚗",
                label: "Vehicles",
                description: "Cars, bikes, trucks",
                gradient: "from-blue-400 to-cyan-500"
              },
              {
                icon: "🏠",
                label: "Buildings",
                description: "Houses, structures",
                gradient: "from-orange-400 to-red-500"
              },
              {
                icon: "👤",
                label: "People",
                description: "Remove individuals",
                gradient: "from-purple-400 to-pink-500"
              }
            ].map((item, index) => (
              <div
                key={index}
                className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border border-gray-100"
              >
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${item.gradient} flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>
                <div className="text-sm font-semibold text-gray-800 mb-1">{item.label}</div>
                <div className="text-xs text-gray-500">{item.description}</div>
              </div>
            ))}
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
            {[
              {
                icon: "🎯",
                title: "Precise Selection",
                description: "Paint over objects you want to remove with pixel-perfect accuracy"
              },
              {
                icon: "🤖",
                title: "AI-Powered",
                description: "Advanced machine learning algorithms ensure natural-looking results"
              },
              {
                icon: "⚡",
                title: "Fast Processing",
                description: "Get professional results in seconds, not hours"
              }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 max-w-2xl mx-auto">
            <p className="text-gray-700 font-medium mb-2">
              ✨ Professional photo editing made simple
            </p>
            <p className="text-sm text-gray-600">
              Upload your images and use our intuitive brush tool to mark objects for removal.
              Our AI will seamlessly fill in the background, creating natural-looking results.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};