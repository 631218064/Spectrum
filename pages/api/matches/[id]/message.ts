// pages/api/matches/[id]/message.ts
// 发送每日消息

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization' });
  const token = authHeader.split(' ')[1];

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

  const { id: matchId } = req.query;
  const { content } = req.body;
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid content' });
  }

  try {
    // 验证匹配是否存在且用户参与
    const { data: match, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('id', matchId)
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq('status', 'active')
      .single();

    if (matchError || !match) {
      return res.status(404).json({ error: 'Match not found or not active' });
    }

    // 检查今日是否已发送过消息（按日期，不考虑时区，简化处理）
    const today = new Date().toISOString().split('T')[0];
    const { count, error: countError } = await supabaseAdmin
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('sender_id', user.id)
      .gte('created_at', today);

    if (countError) throw countError;
    if (count && count >= 1) {
      return res.status(400).json({ error: 'Already sent a message today' });
    }

    // 插入消息
    const { error: insertError } = await supabaseAdmin
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: user.id,
        content,
        day_number: match.current_day, // 记录发送时处于第几天
      });

    if (insertError) throw insertError;

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Send message error:', err);
    return res.status(500).json({ error: err.message });
  }
}