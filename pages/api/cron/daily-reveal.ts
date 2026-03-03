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
    // 读取所有需要推进 day 的匹配，再批量更新，避免使用 raw SQL 依赖
    const { data: rows, error: fetchRowsError } = await supabaseAdmin
      .from('matches')
      .select('id,current_day')
      .eq('status', 'active')
      .lt('current_day', 5);

    if (fetchRowsError) throw fetchRowsError;
    const nextRows = (rows || []).map((m: any) => ({ id: m.id, current_day: Math.min(5, Number(m.current_day || 1) + 1) }));
    if (nextRows.length > 0) {
      for (const row of nextRows) {
        const { error: updateError } = await supabaseAdmin
          .from('matches')
          .update({ current_day: row.current_day })
          .eq('id', row.id);
        if (updateError) throw updateError;
      }
    }

    // 对于达到第5天的匹配，记录解锁时间
    const { data: day5Matches, error: fetchDay5Error } = await supabaseAdmin
      .from('matches')
      .select('id')
      .eq('status', 'active')
      .eq('current_day', 5)
      .is('day5_unlocked_at', null);

    if (!fetchDay5Error && (day5Matches || []).length > 0) {
      await supabaseAdmin
        .from('matches')
        .update({ day5_unlocked_at: new Date().toISOString() })
        .in('id', (day5Matches || []).map((m: any) => m.id));
    }

    return res.status(200).json({ updated: nextRows.length });
  } catch (err: any) {
    console.error('Daily reveal error:', err);
    return res.status(500).json({ error: err.message });
  }
}
