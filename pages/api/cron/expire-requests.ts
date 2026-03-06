import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getRequestId, logApiError } from '@/lib/apiLogger';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requestId = getRequestId(req);
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'Unauthorized', requestId });
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

    return res.status(200).json({ expired: data?.length || 0, requestId });
  } catch (err: any) {
    logApiError(req, requestId, err);
    return res.status(500).json({ error: err.message, requestId });
  }
}
