// components/StepIndicator.tsx
// 多步表单步骤指示器

import React from 'react';

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export default function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex justify-between items-center mb-12">
      <span className="text-xs uppercase tracking-[0.3em] text-pink-500 font-bold">
        {steps[currentStep]}
      </span>
      <div className="flex gap-1">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 w-8 rounded-full transition-colors ${
              i <= currentStep ? 'bg-pink-500' : 'bg-white/10'
            }`}
          />
        ))}
      </div>
    </div>
  );
}