'use client';

import React from 'react';
import { ImageEditor } from '@/components/ImageEditor';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="border-b border-gray-800 py-4">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-white">AI Object Remover</h1>
          <p className="text-gray-400 mt-1">Remove unwanted objects from your images with AI</p>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <ImageEditor />
      </main>
    </div>
  );
}