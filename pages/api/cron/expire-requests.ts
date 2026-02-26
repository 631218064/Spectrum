// pages/api/cron/expire-requests.ts
// 定时任务：每小时执行，将过期的匹配请求标记为 expired

import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const now = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from('match_requests')
      .update({ status: 'expired' })
      .eq('status', 'pending')
      .lt('expires_at', now)
      .select();

    if (error) throw error;

    return res.status(200).json({ expired: data?.length || 0 });
  } catch (err: any) {
    console.error('Expire requests error:', err);
    return res.status(500).json({ error: err.message });
  }
}