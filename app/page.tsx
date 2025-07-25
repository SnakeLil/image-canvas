'use client';

import React from 'react';
import { SimpleImageEditor } from '@/components/SimpleImageEditor';

export default function Home() {
  return (
    <div className="min-h-screen h-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* 优化的头部 - 更紧凑 */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md py-4 shadow-sm sticky top-0 z-40">
        <div className="max-w-full mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Magic Eraser</h1>
              <p className="text-slate-600 text-sm mt-1">AI-powered image editing tool</p>
            </div>
            {/* 可以在这里添加全局操作按钮 */}
          </div>
        </div>
      </header>

      {/* 全屏主内容区域 */}
      <main className="h-[calc(100vh-80px)] overflow-hidden">
        <SimpleImageEditor />
      </main>
    </div>
  );
}