'use client';

import React from 'react';
import { ImageEditor } from '@/components/ImageEditor';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <header className="border-b border-blue-200 bg-white/80 backdrop-blur-sm py-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-gray-800">Magic Eraser</h1>
          <p className="text-gray-600 mt-2">Remove unwanted objects from your images with AI-powered technology</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <ImageEditor />
      </main>
    </div>
  );
}