import { NextApiRequest, NextApiResponse } from 'next';
import { createMatchAndClues } from '@/lib/matchRuntime';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing authorization' });
  const token = authHeader.split(' ')[1];
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
  const user = authData.user;
  if (authError || !user) return res.status(401).json({ error: 'Invalid token' });

  const { requestId, accept } = req.body || {};
  if (!requestId || typeof accept !== 'boolean') return res.status(400).json({ error: 'Missing requestId or accept' });

  try {
    const { data: request, error } = await supabaseAdmin
      .from('match_requests')
      .select('*')
      .eq('id', requestId)
      .eq('to_user_id', user.id)
      .eq('status', 'pending')
      .single();
    if (error || !request) return res.status(404).json({ error: 'Request not found' });

    if (!accept) {
      const ignoredAt = new Date().toISOString();
      const { error: ignoreLogError } = await supabaseAdmin.from('ignored_invitations').insert({
        inviter_id: request.from_user_id,
        invitee_id: request.to_user_id,
        ignored_at: ignoredAt,
      });
      if (ignoreLogError) {
        return res.status(500).json({ error: ignoreLogError.message || 'Failed to record ignore event' });
      }
      await supabaseAdmin.from('match_requests').update({ status: 'expired' }).eq('id', requestId);
      return res.status(200).json({ status: 'rejected' });
    }

    const { matchId, cluesReady } = await createMatchAndClues(request.from_user_id, request.to_user_id, 'invite');
    await supabaseAdmin.from('match_requests').delete().eq('id', requestId);
    return res.status(200).json({ status: 'matched', matchId, cluesReady });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Respond failed' });
  }
}
