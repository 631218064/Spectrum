// hooks/useAIGeneration.ts
// 调用 AI 生成线索（用于测试或手动触发）

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface UseAIGenerationReturn {
  generateForMatch: (matchId: string) => Promise<{ success: boolean; error: string | null }>;
  isGenerating: boolean;
}

export function useAIGeneration(): UseAIGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateForMatch = async (matchId: string) => {
    setIsGenerating(true);
    try {
      // 调用 API 路由触发 AI 生成（确保路由已实现）
      const response = await fetch(`/api/matches/${matchId}/generate-clues`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '生成失败');
      return { success: true, error: null };
    } catch (err: any) {
      return { success: false, error: err.message };
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateForMatch, isGenerating };
}