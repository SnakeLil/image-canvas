'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Server, Download, Play } from 'lucide-react';

interface APIConfig {
  provider: 'iopaint';
  apiKey: string;
  baseUrl: string;
}

interface APIConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: APIConfig;
  onConfigChange: (config: APIConfig) => void;
}

export const APIConfigModal: React.FC<APIConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onConfigChange
}) => {
  const [tempConfig, setTempConfig] = useState<APIConfig>(config);

  const handleSave = () => {
    onConfigChange(tempConfig);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-white border-gray-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">IOPaint Configuration</DialogTitle>
          <p className="text-gray-600 text-sm">Configure your local IOPaint server for image inpainting</p>
        </DialogHeader>

        <div className="space-y-6">
          {/* IOPaint Info Card */}
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-start gap-4">
              <Server className="w-6 h-6 text-green-600 mt-1" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-medium text-gray-800">IOPaint (Local Server)</h3>
                  <Badge className="bg-green-500 text-white text-xs">Free & Open Source</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Free, open-source local inpainting server. No API keys required, runs completely offline.
                </p>

                {/* Features */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Cost</div>
                    <div className="text-sm font-medium text-green-600">Free</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Privacy</div>
                    <div className="text-sm font-medium text-blue-600">100% Local</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 mb-1">Speed</div>
                    <div className="text-sm font-medium text-purple-600">Fast</div>
                  </div>
                </div>

                {/* Setup Instructions */}
                <div className="bg-white rounded-lg p-3 border border-green-200">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Quick Setup:</h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-green-600" />
                      <span>Run: <code className="bg-gray-100 px-1 rounded">./setup-iopaint.sh</code></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-green-600" />
                      <span>Start: <code className="bg-gray-100 px-1 rounded">./start_iopaint.sh</code></span>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <a
                      href="https://github.com/Sanster/IOPaint"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Setup Guide
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Configuration */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseUrl" className="text-sm font-medium text-gray-700">
                IOPaint Server URL
              </Label>
              <Input
                id="baseUrl"
                type="url"
                placeholder="http://localhost:8080"
                value={tempConfig.baseUrl}
                onChange={(e) => setTempConfig({ ...tempConfig, baseUrl: e.target.value })}
                className="bg-white border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500">
                Default: http://localhost:8080 (change if you're running IOPaint on a different port or server)
              </p>
            </div>

            {/* Test Connection */}
            <Card className="p-3 bg-gray-50 border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-800">Connection Status</h4>
                  <p className="text-xs text-gray-600">Make sure IOPaint is running before using the magic eraser</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const response = await fetch(`${tempConfig.baseUrl}/api/v1/model`);
                      if (response.ok) {
                        alert('✅ IOPaint server is running!');
                      } else {
                        alert('❌ Cannot connect to IOPaint server');
                      }
                    } catch (error) {
                      alert('❌ Cannot connect to IOPaint server. Make sure it\'s running.');
                    }
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100"
                >
                  Test Connection
                </Button>
              </div>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
