// components/Chip.tsx
// 可点击的标签/药丸组件，用于多选

import React from 'react';

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function Chip({ label, selected = false, onClick, className = '' }: ChipProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full border text-sm transition-all ${
        selected
          ? 'border-pink-500 bg-pink-500 text-white shadow-[0_0_15px_rgba(236,72,153,0.3)]'
          : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
      } ${className}`}
    >
      {label}
    </button>
  );
}