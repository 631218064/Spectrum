// components/Input.tsx
// 带样式的文本输入框

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="space-y-2">
      {label && <label className="text-xs text-white/50">{label}</label>}
      <input
        className={`w-full bg-white/5 border ${error ? 'border-red-500' : 'border-white/10'} rounded-xl p-3 outline-none focus:border-pink-500 transition-colors ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}