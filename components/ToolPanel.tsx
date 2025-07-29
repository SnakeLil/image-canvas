"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BrushControls } from "./BrushControls";
import { Download, HelpCircle, Maximize2, X, Image } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FireworksEffect } from "./FireworksEffect";

interface ToolPanelProps {
  brushSettings: {
    size: number;
    opacity: number;
    color: string;
    shape: import("./MagicCursor").CursorShape;
  };
  onBrushSettingsChange: (settings: {
    size: number;
    opacity: number;
    color: string;
    shape: import("./MagicCursor").CursorShape;
  }) => void;
  processedImageUrl?: string | null;
  backgroundRemovedImageUrl?: string | null;
  finalResult?: {
    url: string | null;
    type: "inpaint" | "background" | "final" | "none";
  };
  isProcessing?: boolean;
  isBackgroundProcessing?: boolean;
  disabled?: boolean;
  onShowHelp?: () => void;
}

export const ToolPanel: React.FC<ToolPanelProps> = ({
  brushSettings,
  onBrushSettingsChange,
  processedImageUrl,
  backgroundRemovedImageUrl,
  finalResult,
  isProcessing = false,
  isBackgroundProcessing = false,
  disabled = false,
  onShowHelp,
}) => {
  const [showFire, setShowFire] = useState(false);
  // Use the finalResult from props (based on timestamps)
  const getFinalResultUrl = () => {
    return finalResult?.url || null;
  };

  const getFinalResultType = () => {
    return finalResult?.type || "none";
  };
  const [showPreview, setShowPreview] = useState(false);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const hasCelebrate = useRef(false);

  const handleCelebrate = () => {
    setShowFire(true);
    setTimeout(() => {
      setShowFire(false);
    }, 3000);
  };
  useEffect(() => {
    if (
      (processedImageUrl || backgroundRemovedImageUrl) &&
      !hasCelebrate.current
    ) {
      handleCelebrate();
      hasCelebrate.current = true;
    }
  }, [processedImageUrl, backgroundRemovedImageUrl]);
  const handleShowHelp = () => {
    if (onShowHelp) {
      onShowHelp();
    }
  };

  const handlePreviewClick = () => {
    if (getFinalResultUrl()) {
      setShowPreview(true);
    }
  };
  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col pb-8">
      {/* Header */}
      <div className="p-4 h-[73px] border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-800">Tools</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleShowHelp}
            className="text-gray-500 hover:text-blue-500 hover:bg-blue-50 transition-colors duration-200"
            title="Show help and instructions"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tool Panel Content */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
        {/* Result Preview */}
        {(processedImageUrl ||
          backgroundRemovedImageUrl ||
          isProcessing ||
          isBackgroundProcessing) && (
          <Card className="p-4 bg-white border border-gray-200 shadow-sm">
            <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Result Preview
            </h4>

            <div
              ref={previewContainerRef}
              className={`relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden border border-gray-200 mb-4 group ${
                processedImageUrl
                  ? "cursor-pointer hover:border-blue-300 transition-colors"
                  : ""
              }`}
              onClick={handlePreviewClick}
            >
              {/* Checkerboard pattern for transparency */}
              <div
                className="absolute inset-0 opacity-20"
                style={{
                  backgroundImage: `
                       linear-gradient(45deg, #ccc 25%, transparent 25%),
                       linear-gradient(-45deg, #ccc 25%, transparent 25%),
                       linear-gradient(45deg, transparent 75%, #ccc 75%),
                       linear-gradient(-45deg, transparent 75%, #ccc 75%)
                     `,
                  backgroundSize: "12px 12px",
                  backgroundPosition: "0 0, 0 6px, 6px -6px, -6px 0px",
                }}
              />

              <div className="absolute inset-0 flex items-center justify-center">
                {isProcessing || isBackgroundProcessing ? (
                  <div className="text-center">
                    <div className="relative mb-3">
                      <div
                        className={`animate-spin rounded-full h-12 w-12 border-4 mx-auto ${
                          isBackgroundProcessing
                            ? "border-purple-200 border-t-purple-600"
                            : "border-blue-200 border-t-blue-600"
                        }`}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className={`w-3 h-3 rounded-full animate-pulse ${
                            isBackgroundProcessing
                              ? "bg-purple-600"
                              : "bg-blue-600"
                          }`}
                        ></div>
                      </div>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mb-1">
                      {isBackgroundProcessing
                        ? "Removing Background"
                        : "Processing Image"}
                    </p>
                    <p className="text-xs text-gray-500">
                      AI is working ✨
                    </p>
                  </div>
                ) : getFinalResultUrl() ? (
                  <div className="relative w-full h-full flex justify-center">
                    <img
                      src={getFinalResultUrl()!}
                      alt={
                        getFinalResultType() === "final"
                          ? "Final Result"
                          : getFinalResultType() === "inpaint"
                          ? "Processed"
                          : "Background Removed"
                      }
                      className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                    />
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                        <Maximize2 className="w-4 h-4 text-gray-700 cursor-pointer" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <Image className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-medium mb-1">No Result Yet</p>
                    <p className="text-xs">
                      Process your image to see results here
                    </p>
                  </div>
                )}
              </div>

              {/* Status badge */}
              {getFinalResultUrl() && (
                <div
                  className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-full font-medium ${
                    getFinalResultType() === "final"
                      ? "bg-blue-500"
                      : getFinalResultType() === "inpaint"
                      ? "bg-green-500"
                      : "bg-purple-500"
                  }`}
                >
                  ✓{" "}
                  {getFinalResultType() === "final"
                    ? "Final Result"
                    : getFinalResultType() === "inpaint"
                    ? "Processed"
                    : "Background Removed"}
                </div>
              )}

              {/* Click hint */}
              {getFinalResultUrl() && (
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  Click to preview
                </div>
              )}

              {/* Fireworks Effect - positioned to overlay the preview */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 10 }}
              >
                <FireworksEffect
                  isActive={showFire}
                  containerRef={previewContainerRef}
                  onComplete={() => {
                    // Fireworks animation completed - could add additional effects here
                  }}
                />
              </div>
            </div>

            {getFinalResultUrl() && (
              <Button
                asChild
                className={`w-full text-white shadow-sm ${
                  getFinalResultType() === "final"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    : getFinalResultType() === "inpaint"
                    ? "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                }`}
                size="sm"
              >
                <a
                  href={getFinalResultUrl()!}
                  download={
                    getFinalResultType() === "final"
                      ? "final-result.png"
                      : getFinalResultType() === "inpaint"
                      ? "processed-image.png"
                      : "background-removed.png"
                  }
                  className="flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download{" "}
                  {getFinalResultType() === "final"
                    ? "Final Result"
                    : getFinalResultType() === "inpaint"
                    ? "Result"
                    : "Background Removed"}
                </a>
              </Button>
            )}
          </Card>
        )}
        <Card className="p-4 bg-white border border-gray-200 shadow-sm">
          <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            Brush Settings
          </h4>
          <BrushControls
            settings={brushSettings}
            onSettingsChange={onBrushSettingsChange}
            disabled={disabled}
          />
        </Card>
      </div>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95 border-0">
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <button
              onClick={() => setShowPreview(false)}
              className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {getFinalResultUrl() && (
              <img
                src={getFinalResultUrl()!}
                alt={
                  getFinalResultType() === "final"
                    ? "Final Result Preview"
                    : getFinalResultType() === "inpaint"
                    ? "Processed Image Preview"
                    : "Background Removed Preview"
                }
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
