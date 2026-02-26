// pages/api/matches/respond.ts
// 响应匹配请求（接受或拒绝）

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

  const { requestId, accept } = req.body;
  if (!requestId || typeof accept !== 'boolean') {
    return res.status(400).json({ error: 'Missing requestId or accept' });
  }

  try {
    // 获取请求记录
    const { data: request, error: fetchError } = await supabaseAdmin
      .from('match_requests')
      .select('*')
      .eq('id', requestId)
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (!accept) {
      // 拒绝：直接删除请求
      await supabaseAdmin.from('match_requests').delete().eq('id', requestId);
      return res.status(200).json({ status: 'rejected' });
    }

    // 接受：创建匹配
    const matchId = await createMatch(request.from_user_id, request.to_user_id);

    // 删除请求
    await supabaseAdmin.from('match_requests').delete().eq('id', requestId);

    // 扣除双方匹配限额
    await supabaseAdmin.rpc('decrement_match_usage', { uid: request.from_user_id });
    await supabaseAdmin.rpc('decrement_match_usage', { uid: request.to_user_id });

    // 生成线索
    await generateCluesForMatch(matchId);

    return res.status(200).json({ matchId, status: 'matched' });
  } catch (err: any) {
    console.error('Respond error:', err);
    return res.status(500).json({ error: err.message });
  }
}

// 复用之前的辅助函数，为避免重复，可提取到单独文件，此处省略
// 实际项目中建议将 createMatch 和 generateCluesForMatch 放在 lib/matches.ts 中