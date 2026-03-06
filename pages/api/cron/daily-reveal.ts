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
    const { data: rows, error: fetchRowsError } = await supabaseAdmin
      .from('matches')
      .select('id,current_day')
      .eq('status', 'active')
      .lt('current_day', 5);

    if (fetchRowsError) throw fetchRowsError;
    const nextRows = (rows || []).map((m: any) => ({ id: m.id, current_day: Math.min(5, Number(m.current_day || 1) + 1) }));
    if (nextRows.length > 0) {
      for (const row of nextRows) {
        const { error: updateError } = await supabaseAdmin.from('matches').update({ current_day: row.current_day }).eq('id', row.id);
        if (updateError) throw updateError;
      }
    }

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

    return res.status(200).json({ updated: nextRows.length, requestId });
  } catch (err: any) {
    logApiError(req, requestId, err);
    return res.status(500).json({ error: err.message, requestId });
  }
}
