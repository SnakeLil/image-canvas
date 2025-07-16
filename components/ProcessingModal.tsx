'use client';

import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Sparkles } from 'lucide-react';

interface ProcessingModalProps {
  isOpen: boolean;
}

export const ProcessingModal: React.FC<ProcessingModalProps> = ({ isOpen }) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md bg-gray-800 border-gray-700">
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="relative mb-6">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-600 border-t-blue-500"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          
          <DialogTitle className="text-lg font-semibold text-white mb-2">
            Processing Your Image
          </DialogTitle>
          
          <p className="text-gray-400 mb-4">
            AI is removing unwanted objects from your image...
          </p>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            This may take a few moments
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};