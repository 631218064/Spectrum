// hooks/useMatch.ts
// 获取单个匹配的详情

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { MatchCard } from '@/types';

interface UseMatchReturn {
  match: MatchCard | null;
  isLoading: boolean;
  error: Error | null;
  refreshMatch: () => Promise<void>;
}

export function useMatch(matchId: string | undefined, userId: string | undefined): UseMatchReturn {
  const [match, setMatch] = useState<MatchCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMatch = async () => {
    if (!matchId || !userId) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          user1:profiles!matches_user1_id_fkey(*),
          user2:profiles!matches_user2_id_fkey(*)
        `)
        .eq('id', matchId)
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .single();

      if (error) throw error;

      const isUser1 = data.user1_id === userId;
      const otherUser = isUser1 ? data.user2 : data.user1;

      setMatch({
        id: data.id,
        current_day: data.current_day,
        status: data.status,
        created_at: data.created_at,
        day1_clues: data.day1_clues || [],
        day2_clues: data.day2_clues || [],
        day3_clues: data.day3_clues || [],
        day4_clues: data.day4_clues || [],
        day5_unlocked_at: data.day5_unlocked_at,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          mbti: otherUser.mbti,
          role: otherUser.role,
          profile_photo_url: otherUser.profile_photo_url,
          preferred_contact: otherUser.preferred_contact,
        },
      });
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMatch();
  }, [matchId, userId]);

  return { match, isLoading, error, refreshMatch: fetchMatch };
}