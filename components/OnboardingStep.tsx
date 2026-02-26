// components/OnboardingStep.tsx
// 注册步骤容器，包含标题和内容区域，提供统一样式

import React from 'react';

interface OnboardingStepProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function OnboardingStep({ title, children, className = '' }: OnboardingStepProps) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
      {title && (
        <h2 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
          {title}
        </h2>
      )}
      <div className={className}>{children}</div>
    </div>
  );
}