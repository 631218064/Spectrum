// pages/api/matches/[id]/terminate.ts
// 终止匹配

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization' });
  const token = authHeader.split(' ')[1];

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

  const { id: matchId } = req.query;

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

    // 终止匹配（软删除，标记状态和终止人）
    const { error: updateError } = await supabaseAdmin
      .from('matches')
      .update({
        status: 'terminated',
        terminated_by: user.id,
        terminated_at: new Date().toISOString(),
      })
      .eq('id', matchId);

    if (updateError) throw updateError;

    return res.status(200).json({ success: true });
  } catch (err: any) {
    console.error('Terminate match error:', err);
    return res.status(500).json({ error: err.message });
  }
}