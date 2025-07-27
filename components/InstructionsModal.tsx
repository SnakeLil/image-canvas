'use client';

import React from 'react';
import { X, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  isOpen,
  onClose
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] bg-white border border-gray-200 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                Quick Guide
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Learn how to use Magic Eraser effectively
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-8 h-8 p-0 hover:bg-gray-100 rounded-full"
          >
            <X className="w-4 h-4 text-gray-500" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Main instruction */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-start gap-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full mt-1 flex-shrink-0"></div>
              <div>
                <div className="text-base font-semibold text-blue-900 mb-2">
                  How to remove objects
                </div>
                <div className="text-sm text-blue-700 leading-relaxed">
                  Paint over the areas you want to remove using the brush tool, then click the "Remove Objects" button. Our AI will intelligently fill in the background.
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-3">
            <div className="text-base font-semibold text-gray-800 mb-3">Controls & Shortcuts:</div>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span>🖱️</span>
                <span><strong>Scroll:</strong> Zoom</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span>⌨️</span>
                <span><strong>Alt+Drag:</strong> Pan</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span>🖱️</span>
                <span><strong>Middle+Drag:</strong> Pan</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                <span>⌨️</span>
                <span><strong>Ctrl+Z/Y/Ctrl+Shift+Z:</strong> Undo/Redo</span>
              </div>
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
            <div className="flex items-start gap-2">
              <div className="text-lg">💡</div>
              <div>
                <div className="text-sm font-semibold text-yellow-900 mb-2">Pro Tips</div>
                <div className="text-xs text-yellow-800 space-y-1">
                  <div>• Use larger brush for big objects, smaller for details</div>
                  <div>• Paint slightly beyond object edges for better results</div>
                  <div>• Process multiple images in parallel for efficiency</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 pb-6 border-t border-gray-100 bg-gray-50">
          <Button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Got it! Let's start editing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
