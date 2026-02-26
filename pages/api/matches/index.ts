// pages/api/matches/index.ts
// 获取当前用户的所有活跃匹配

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization' });
  const token = authHeader.split(' ')[1];

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

  try {
    // 查询 matches 表，获取与当前用户相关的所有活跃匹配
    const { data, error } = await supabaseAdmin
      .from('matches')
      .select(`
        *,
        user1:profiles!matches_user1_id_fkey(*),
        user2:profiles!matches_user2_id_fkey(*)
      `)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'active');

    if (error) throw error;

    // 整理数据：确定对方信息，解析线索 JSON
    const matches = (data || []).map((match: any) => {
      const isUser1 = match.user1_id === user.id;
      const otherUser = isUser1 ? match.user2 : match.user1;
      return {
        id: match.id,
        current_day: match.current_day,
        status: match.status,
        created_at: match.created_at,
        day1_clues: typeof match.day1_clues === 'string' ? JSON.parse(match.day1_clues) : match.day1_clues,
        day2_clues: typeof match.day2_clues === 'string' ? JSON.parse(match.day2_clues) : match.day2_clues,
        day3_clues: typeof match.day3_clues === 'string' ? JSON.parse(match.day3_clues) : match.day3_clues,
        day4_clues: typeof match.day4_clues === 'string' ? JSON.parse(match.day4_clues) : match.day4_clues,
        day5_unlocked_at: match.day5_unlocked_at,
        otherUser: {
          id: otherUser.id,
          username: otherUser.username,
          mbti: otherUser.mbti,
          role: otherUser.role,
          profile_photo_url: otherUser.profile_photo_url,
          preferred_contact: otherUser.preferred_contact,
          // 可根据需要添加其他字段
        },
      };
    });

    return res.status(200).json(matches);
  } catch (err: any) {
    console.error('Fetch matches error:', err);
    return res.status(500).json({ error: err.message });
  }
}