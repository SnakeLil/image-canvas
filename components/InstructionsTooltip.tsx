'use client';

import React, { useState } from 'react';
import { X, HelpCircle, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface InstructionsTooltipProps {
  show: boolean;
  onClose: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const InstructionsTooltip: React.FC<InstructionsTooltipProps> = ({
  show,
  onClose,
  position = 'top-right'
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!show) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4'
  };

  const handleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 transition-all duration-300 ease-in-out`}>
      {isMinimized ? (
        // Minimized state - just a help icon
        <Button
          variant="outline"
          size="sm"
          onClick={handleMinimize}
          className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 rounded-full w-10 h-10 p-0"
        >
          <HelpCircle className="w-4 h-4 text-blue-500" />
        </Button>
      ) : (
        // Expanded state - full instructions
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl max-w-sm animate-in slide-in-from-top-2 duration-300">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-800">Quick Guide</span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMinimize}
                className="w-6 h-6 p-0 hover:bg-gray-100 rounded-md"
              >
                <Minimize2 className="w-3 h-3 text-gray-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="w-6 h-6 p-0 hover:bg-gray-100 rounded-md"
              >
                <X className="w-3 h-3 text-gray-500" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Main instruction */}
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <div className="text-sm font-medium text-blue-900 mb-1">
                    How to remove objects
                  </div>
                  <div className="text-xs text-blue-700">
                    Paint over areas you want to remove, then click "Remove Objects"
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-700 mb-2">Controls:</div>
              <div className="grid grid-cols-1 gap-2 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="text-base">🖱️</span>
                  <span>Scroll to zoom in/out</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">⌨️</span>
                  <span>Alt + drag to pan around</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">🖱️</span>
                  <span>Middle-click + drag to pan</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base">⌨️</span>
                  <span>Ctrl+Z to undo, Ctrl+Y to redo</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100">
              <div className="flex items-start gap-2">
                <div className="text-base">💡</div>
                <div>
                  <div className="text-xs font-medium text-yellow-900 mb-1">
                    Pro Tips
                  </div>
                  <div className="text-xs text-yellow-700 space-y-1">
                    <div>• Use larger brush for big objects</div>
                    <div>• Paint slightly beyond object edges</div>
                    <div>• Process multiple images in parallel</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 pb-3">
            <Button
              onClick={onClose}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-xs py-2 rounded-lg transition-colors duration-200"
            >
              Got it! Let's start editing
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
