// pages/api/cron/daily-reveal.ts
// 定时任务：每天 8:00 执行，将所有活跃匹配的 current_day 增加 1
// 需在 Vercel Cron Jobs 中配置，并验证 CRON_SECRET

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 验证 cron secret（防止未授权调用）
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 更新所有 status='active' 的匹配，将 current_day +1，但不超过 5
    const { data, error } = await supabaseAdmin
      .from('matches')
      .update({ current_day: supabaseAdmin.raw('LEAST(current_day + 1, 5)') })
      .eq('status', 'active')
      .lt('current_day', 5) // 只更新还没到第5天的
      .select();

    if (error) throw error;

    // 对于达到第5天的匹配，记录解锁时间
    const { data: day5Matches, error: fetchError } = await supabaseAdmin
      .from('matches')
      .select('id')
      .eq('status', 'active')
      .eq('current_day', 5)
      .is('day5_unlocked_at', null);

    if (!fetchError && day5Matches.length > 0) {
      await supabaseAdmin
        .from('matches')
        .update({ day5_unlocked_at: new Date().toISOString() })
        .in('id', day5Matches.map(m => m.id));
    }

    return res.status(200).json({ updated: data?.length || 0 });
  } catch (err: any) {
    console.error('Daily reveal error:', err);
    return res.status(500).json({ error: err.message });
  }
}