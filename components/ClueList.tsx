// components/ClueList.tsx
// 展示已解锁的线索列表

import React from 'react';
import { Sparkles } from 'lucide-react';

interface ClueListProps {
  clues: string[];
  currentDay: number;
}

export default function ClueList({ clues, currentDay }: ClueListProps) {
  if (!clues.length) {
    return (
      <div className="text-center py-8 text-white/30">
        <Sparkles className="mx-auto mb-2" size={32} />
        <p className="text-sm">No clues yet. Check back tomorrow!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
      {clues.map((clue, i) => (
        <div
          key={i}
          className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 animate-in fade-in slide-in-from-bottom-4"
        >
          <p className="text-sm italic leading-relaxed text-white/90">"{clue}"</p>
        </div>
      ))}
    </div>
  );
}