'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ExternalLink, Key, Server, Zap } from 'lucide-react';

interface APIConfig {
  provider: 'replicate' | 'huggingface' | 'local';
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

  const providerInfo = {
    replicate: {
      name: 'Replicate',
      description: 'High-quality Stable Diffusion inpainting',
      signupUrl: 'https://replicate.com',
      keyUrl: 'https://replicate.com/account/api-tokens',
      icon: <Zap className="w-5 h-5 text-blue-400" />
    },
    huggingface: {
      name: 'Hugging Face',
      description: 'Free inference API with rate limits',
      signupUrl: 'https://huggingface.co',
      keyUrl: 'https://huggingface.co/settings/tokens',
      icon: <Key className="w-5 h-5 text-yellow-400" />
    },
    local: {
      name: 'Local/Self-hosted',
      description: 'Your own inpainting API server',
      signupUrl: '',
      keyUrl: '',
      icon: <Server className="w-5 h-5 text-green-400" />
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl bg-gray-800 border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-white">API Configuration</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Provider Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">AI Provider</Label>
            <Select
              value={tempConfig.provider}
              onValueChange={(value: 'replicate' | 'huggingface' | 'local') =>
                setTempConfig({ ...tempConfig, provider: value })
              }
            >
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600">
                {Object.entries(providerInfo).map(([key, info]) => (
                  <SelectItem key={key} value={key} className="text-white">
                    <div className="flex items-center gap-2">
                      {info.icon}
                      {info.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Provider Info Card */}
          <Card className="p-4 bg-gray-700/50 border-gray-600">
            <div className="flex items-start gap-3">
              {providerInfo[tempConfig.provider].icon}
              <div className="flex-1">
                <h3 className="font-medium text-white mb-1">
                  {providerInfo[tempConfig.provider].name}
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  {providerInfo[tempConfig.provider].description}
                </p>
                
                {tempConfig.provider !== 'local' && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(providerInfo[tempConfig.provider].signupUrl, '_blank')}
                      className="border-gray-600 hover:border-gray-500"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Sign Up
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(providerInfo[tempConfig.provider].keyUrl, '_blank')}
                      className="border-gray-600 hover:border-gray-500"
                    >
                      <Key className="w-3 h-3 mr-1" />
                      Get API Key
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Configuration Fields */}
          {tempConfig.provider !== 'local' ? (
            <div className="space-y-3">
              <Label className="text-sm font-medium">API Key</Label>
              <Input
                type="password"
                placeholder="Enter your API key"
                value={tempConfig.apiKey}
                onChange={(e) => setTempConfig({ ...tempConfig, apiKey: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400">
                Your API key is stored locally and never sent to our servers
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Server URL</Label>
              <Input
                type="url"
                placeholder="http://localhost:8000"
                value={tempConfig.baseUrl}
                onChange={(e) => setTempConfig({ ...tempConfig, baseUrl: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <p className="text-xs text-gray-400">
                URL of your local inpainting API server
              </p>
            </div>
          )}

          {/* Setup Instructions */}
          <Card className="p-4 bg-blue-500/10 border-blue-500/20">
            <h4 className="font-medium text-blue-400 mb-2">Quick Setup Guide</h4>
            <div className="text-sm text-gray-300 space-y-1">
              {tempConfig.provider === 'replicate' && (
                <>
                  <p>1. Sign up at replicate.com</p>
                  <p>2. Go to Account → API Tokens</p>
                  <p>3. Create a new token and paste it above</p>
                  <p>4. You'll be charged per API call (~$0.01-0.05 per image)</p>
                </>
              )}
              {tempConfig.provider === 'huggingface' && (
                <>
                  <p>1. Sign up at huggingface.co</p>
                  <p>2. Go to Settings → Access Tokens</p>
                  <p>3. Create a new token and paste it above</p>
                  <p>4. Free tier has rate limits, may be slower</p>
                </>
              )}
              {tempConfig.provider === 'local' && (
                <>
                  <p>1. Set up your own inpainting server</p>
                  <p>2. Use models like Stable Diffusion Inpainting</p>
                  <p>3. Ensure CORS is enabled for web requests</p>
                  <p>4. API should accept POST /inpaint with image and mask</p>
                </>
              )}
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-gray-600 hover:border-gray-500"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Save Configuration
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};