// components/LoadingSpinner.tsx
// 通用的加载动画

import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = 40,
  color = 'text-pink-500',
  fullScreen = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full border-4 border-t-transparent ${color}`}
        style={{ width: size, height: size, borderWidth: size / 10 }}
      />
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return spinner;
}