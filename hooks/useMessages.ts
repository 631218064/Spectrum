// hooks/useMessages.ts
// 获取和发送匹配中的消息

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { DailyMessage } from '@/types';

interface UseMessagesReturn {
  messages: DailyMessage[];
  isLoading: boolean;
  error: Error | null;
  sendMessage: (content: string) => Promise<{ success: boolean; error: Error | null }>;
  refreshMessages: () => Promise<void>;
}

export function useMessages(matchId: string | undefined, userId: string | undefined): UseMessagesReturn {
  const [messages, setMessages] = useState<DailyMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchMessages = async () => {
    if (!matchId) return;
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(id, username)
        `)
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data as DailyMessage[]);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    // 订阅新消息（可选）
    const subscription = supabase
      .channel(`messages:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as DailyMessage]);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [matchId]);

  const sendMessage = async (content: string) => {
    if (!matchId || !userId) return { success: false, error: new Error('Missing matchId or userId') };

    try {
      // 检查今日是否已发送（前端简单校验，后端也会做）
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('match_id', matchId)
        .eq('sender_id', userId)
        .gte('created_at', today);

      if (count && count >= 1) {
        return { success: false, error: new Error('Already sent a message today') };
      }

      const { error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: userId,
          content,
          day_number: (await getCurrentDay(matchId)) || 1, // 需要获取当前 day
        });

      if (error) throw error;
      return { success: true, error: null };
    } catch (err) {
      return { success: false, error: err as Error };
    }
  };

  // 辅助函数：获取匹配的当前 day
  const getCurrentDay = async (mid: string) => {
    const { data } = await supabase
      .from('matches')
      .select('current_day')
      .eq('id', mid)
      .single();
    return data?.current_day;
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    refreshMessages: fetchMessages,
  };
}