// hooks/useMatches.ts
// 获取当前用户的所有活跃匹配

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MatchCard } from '@/types';

interface UseMatchesReturn {
  matches: MatchCard[];
  isLoading: boolean;
  error: Error | null;
  refreshMatches: () => Promise<void>;
}

export function useMatches(userId: string | undefined): UseMatchesReturn {
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMatches = async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!matches_user1_id_fkey(*),
          user2:profiles!matches_user2_id_fkey(*)
        `)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .eq('status', 'active');

      if (error) throw error;

      // 转换为 MatchCard 格式
      const formattedMatches = (data || []).map((match: any) => {
        const isUser1 = match.user1_id === userId;
        const otherUser = isUser1 ? match.user2 : match.user1;
        return {
          id: match.id,
          current_day: match.current_day,
          status: match.status,
          created_at: match.created_at,
          day1_clues: match.day1_clues || [],
          day2_clues: match.day2_clues || [],
          day3_clues: match.day3_clues || [],
          day4_clues: match.day4_clues || [],
          day5_unlocked_at: match.day5_unlocked_at,
          otherUser: {
            id: otherUser.id,
            username: otherUser.username,
            mbti: otherUser.mbti,
            role: otherUser.role,
            profile_photo_url: otherUser.profile_photo_url,
            preferred_contact: otherUser.preferred_contact,
          },
        };
      });

      setMatches(formattedMatches);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [userId]);

  return { matches, isLoading, error, refreshMatches: fetchMatches };
}