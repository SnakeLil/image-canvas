'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ImageUploadProps {
  onImageUpload: (file: File) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload }) => {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length === 0) {
      setError('Please select a valid image file (JPG, PNG, or WebP)');
      return;
    }

    const file = acceptedFiles[0];
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    onImageUpload(file);
  }, [onImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp']
    },
    maxFiles: 1
  });

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-8 bg-white border-gray-200 shadow-lg">
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all
            ${isDragActive
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
            }
          `}
        >
          <input {...getInputProps()} />

          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              {isDragActive ? (
                <Upload className="w-8 h-8 text-blue-600" />
              ) : (
                <ImageIcon className="w-8 h-8 text-blue-500" />
              )}
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">
                {isDragActive ? 'Drop your image here' : 'Upload an image'}
              </h3>
              <p className="text-gray-600">
                Drag & drop an image or click to browse
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Supports JPG, PNG, and WebP files up to 10MB
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}
      </Card>
    </div>
  );
};