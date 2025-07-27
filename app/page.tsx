'use client';

import React from 'react';
import { ImageEditor } from '@/components/ImageEditor';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Layout */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Side - Main Canvas Area */}
        <div className="flex-1 flex flex-col">
          <ImageEditor />
        </div>
      </div>
    </div>
  );
}