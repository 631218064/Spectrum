// pages/api/matches/request.ts
// 发送匹配请求

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

  const { toUserId } = req.body;
  if (!toUserId) {
    return res.status(400).json({ error: 'Missing toUserId' });
  }

  // 不能给自己发请求
  if (toUserId === user.id) {
    return res.status(400).json({ error: 'Cannot send request to yourself' });
  }

  try {
    // 检查是否已存在 pending 请求
    const { data: existing } = await supabaseAdmin
      .from('match_requests')
      .select('id')
      .eq('from_user_id', user.id)
      .eq('to_user_id', toUserId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ error: 'Request already sent' });
    }

    // 检查对方是否已向你发送请求（若是则直接匹配）
    const { data: reverse } = await supabaseAdmin
      .from('match_requests')
      .select('*')
      .eq('from_user_id', toUserId)
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .maybeSingle();

    if (reverse) {
      // 互相喜欢，创建匹配
      // 调用 respond 逻辑（可复用函数，此处简化）
      // 实际项目中可抽取为公共函数
      const matchId = await createMatch(user.id, toUserId);
      // 删除原请求
      await supabaseAdmin.from('match_requests').delete().eq('id', reverse.id);
      // 扣除匹配限额
      await supabaseAdmin.rpc('decrement_match_usage', { uid: user.id });
      await supabaseAdmin.rpc('decrement_match_usage', { uid: toUserId });
      // 生成线索（调用 AI 或模板）
      await generateCluesForMatch(matchId);

      return res.status(200).json({ matchId, status: 'matched' });
    }

    // 创建新请求
    const { error: insertError } = await supabaseAdmin
      .from('match_requests')
      .insert({
        from_user_id: user.id,
        to_user_id: toUserId,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

    if (insertError) throw insertError;

    // 可选：发送通知（此处略）
    return res.status(200).json({ status: 'pending' });
  } catch (err: any) {
    console.error('Match request error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// 辅助函数：创建匹配记录
async function createMatch(uid1: string, uid2: string): Promise<string> {
  const { data, error } = await supabaseAdmin
    .from('matches')
    .insert({ user1_id: uid1, user2_id: uid2 })
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

// 辅助函数：为匹配生成线索（调用 AI 模块）
async function generateCluesForMatch(matchId: string) {
  // 获取双方资料
  const { data: match, error } = await supabaseAdmin
    .from('matches')
    .select('user1_id, user2_id')
    .eq('id', matchId)
    .single();
  if (error) throw error;

  const [user1, user2] = await Promise.all([
    supabaseAdmin.from('profiles').select('*').eq('id', match.user1_id).single(),
    supabaseAdmin.from('profiles').select('*').eq('id', match.user2_id).single(),
  ]);

  // 导入 AI 生成函数
  const { generateDailyClues } = await import('@/lib/ai');
  const clues = await generateDailyClues(user1.data, user2.data);

  // 更新匹配记录
  const { error: updateError } = await supabaseAdmin
    .from('matches')
    .update({
      day1_clues: clues.day1,
      day2_clues: clues.day2,
      day3_clues: clues.day3,
      day4_clues: clues.day4,
    })
    .eq('id', matchId);

  if (updateError) throw updateError;
}